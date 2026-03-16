#!/bin/bash
# Tarsight 自动化部署脚本（GitHub Actions 专用）
# 用途：非交互式自动部署，由 GitHub Actions 调用
# 使用方法: bash scripts/auto-deploy.sh [--ref <git-ref>] [--no-lint]

set -euo pipefail  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
PROJECT_DIR="/opt/tarsight"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_ROOT="/opt/tarsight-deploy-backups"
BACKUP_DIR="${BACKUP_ROOT}/${BACKUP_DATE}"
TMP_ROOT="/opt/tarsight-deploy-tmp"
NO_LINT=false
TARGET_REF="origin/master"
FRONTEND_PORT="25380"
BUILD_LOG=""
NEXT_BUILD_ARGS=""

rollback() {
    echo -e "${YELLOW}自动回滚到 ${PRE_DEPLOY_REF}...${NC}"
    git reset --hard "$PRE_DEPLOY_REF"
    docker compose build frontend
    docker compose up -d frontend --no-deps --force-recreate
    echo -e "${GREEN}✓ 已回滚到部署前版本${NC}"
}

cleanup() {
    if [ -n "${BUILD_LOG}" ] && [ -f "${BUILD_LOG}" ]; then
        rm -f "${BUILD_LOG}"
    fi
}

trap cleanup EXIT

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --ref)
            if [[ $# -lt 2 ]]; then
                echo -e "${RED}缺少 --ref 的值${NC}"
                exit 1
            fi
            TARGET_REF="$2"
            shift 2
            ;;
        --no-lint)
            NO_LINT=true
            NEXT_BUILD_ARGS="--no-lint"
            shift
            ;;
        *)
            echo -e "${RED}未知选项: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Tarsight 自动化部署${NC}"
echo -e "${BLUE}  时间: $(date)${NC}"
echo -e "${BLUE}  目标版本: ${TARGET_REF}${NC}"
if [ "$NO_LINT" = true ]; then
    echo -e "${YELLOW}  模式: 禁用类型检查${NC}"
fi
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. 检查当前状态
echo -e "${YELLOW}[1/7] 检查当前环境...${NC}"
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ 错误: 项目目录不存在: $PROJECT_DIR${NC}"
    exit 1
fi

cd "$PROJECT_DIR"
echo -e "${GREEN}✓ 项目目录: $PROJECT_DIR${NC}"
git config core.autocrlf false
git config core.safecrlf false
if [ -f ".env" ]; then
    set -a
    source <(sed 's/\r$//' ".env")
    set +a
fi
FRONTEND_PORT="${FRONTEND_PORT:-25380}"
PRE_DEPLOY_REF=$(git rev-parse HEAD)
APP_VERSION=$(git rev-parse --short "$TARGET_REF" 2>/dev/null || git rev-parse --short HEAD)
export APP_VERSION
export NEXT_PUBLIC_APP_VERSION="${APP_VERSION}"
echo -e "${GREEN}✓ 当前版本: ${PRE_DEPLOY_REF}${NC}"
echo -e "${GREEN}✓ 应用版本: ${APP_VERSION}${NC}"

# 2. 创建备份
echo -e "${YELLOW}[2/7] 创建轻量备份...${NC}"
mkdir -p "$BACKUP_DIR"
echo -e "备份目录: ${BACKUP_DIR}"
printf '%s\n' "$PRE_DEPLOY_REF" > "${BACKUP_DIR}/pre_deploy_ref.txt"
if [ -f ".env" ]; then
    cp ".env" "${BACKUP_DIR}/.env"
fi
cp "docker-compose.yml" "${BACKUP_DIR}/docker-compose.yml"
echo -e "${GREEN}✓ 轻量备份完成${NC}"
mkdir -p "$BACKUP_ROOT"
find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d | sort | head -n -10 | xargs -r rm -rf

# 创建git备份分支
BACKUP_BRANCH="backup-before-auto-deploy-${BACKUP_DATE}"
git branch "$BACKUP_BRANCH"
echo -e "${GREEN}✓ Git备份分支: $BACKUP_BRANCH${NC}"
echo ""

# 3. 处理本地修改（自动放弃）并拉取最新代码
echo -e "${YELLOW}[3/7] 清理本地修改并拉取最新代码...${NC}"
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    echo -e "${YELLOW}检测到本地修改，自动放弃...${NC}"
    git reset --hard HEAD
    git clean -fd
    echo -e "${GREEN}✓ 本地修改已清除${NC}"
else
    echo -e "${GREEN}✓ 工作目录干净${NC}"
fi

# 拉取最新代码
echo -e "${YELLOW}拉取最新代码...${NC}"
git fetch origin
git reset --hard "$TARGET_REF"
echo -e "${GREEN}✓ 已更新到目标版本: $(git rev-parse HEAD)${NC}"
echo ""

# 4. 处理构建选项
if [ "$NO_LINT" = true ]; then
    echo -e "${YELLOW}[4/7] 使用 --no-lint 构建参数${NC}"
else
    echo -e "${YELLOW}[4/7] 使用默认构建参数${NC}"
fi
echo ""

# 5. 构建新镜像
echo -e "${YELLOW}[5/7] 构建 Docker 镜像...${NC}"
echo -e "开始时间: $(date)"
mkdir -p "$TMP_ROOT"
BUILD_LOG=$(mktemp "${TMP_ROOT}/auto-build.XXXXXX.log")

if NEXT_BUILD_ARGS="${NEXT_BUILD_ARGS}" docker compose build --no-cache frontend > "${BUILD_LOG}" 2>&1; then
    echo -e "${GREEN}✓ 镜像构建成功${NC}"
else
    echo -e "${RED}❌ 镜像构建失败${NC}"
    echo -e "${YELLOW}构建错误日志:${NC}"
    tail -50 "${BUILD_LOG}"

    rollback
    exit 1
fi
echo ""

# 6. 重启容器
echo -e "${YELLOW}[6/7] 重启容器...${NC}"
docker compose stop frontend
docker compose up -d frontend --no-deps --force-recreate
echo -e "${GREEN}✓ 容器已重启${NC}"
echo ""

# 7. 验证部署
echo -e "${YELLOW}[7/7] 验证部署...${NC}"
echo "等待服务启动（60秒）..."
sleep 60

# 基础验证
if docker ps | grep -q tarsight-frontend; then
    echo -e "${GREEN}✓ 容器正在运行${NC}"

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${FRONTEND_PORT}/healthz" || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ 健康检查接口响应正常 (HTTP ${HTTP_CODE})${NC}"
    else
        echo -e "${YELLOW}⚠ 健康检查接口响应异常 (HTTP ${HTTP_CODE})${NC}"
    fi
else
    echo -e "${RED}❌ 容器启动失败${NC}"
    echo -e "${YELLOW}错误日志:${NC}"
    docker compose logs frontend --tail 50

    rollback
    exit 1
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ 自动部署完成！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "容器信息:"
docker ps | grep tarsight-frontend
echo ""
echo -e "${YELLOW}备份信息:${NC}"
echo -e "  目录: ${BACKUP_DIR}"
echo -e "  Git分支: ${BACKUP_BRANCH}"
echo ""
