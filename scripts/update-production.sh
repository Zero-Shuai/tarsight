#!/bin/bash
# Tarsight 生产环境自动更新脚本 v2.0
# 改进：添加类型检查选项、健康检查验证、更好的错误处理
# 使用方法: sudo bash update-production.sh [--no-lint] [--skip-health-check]

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
PROJECT_DIR="/opt/tarsight"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/tarsight_backup_${BACKUP_DATE}"
NO_LINT=false
SKIP_HEALTH_CHECK=false

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-lint)
            NO_LINT=true
            shift
            ;;
        --skip-health-check)
            SKIP_HEALTH_CHECK=true
            shift
            ;;
        -h|--help)
            echo "使用方法: sudo bash update-production.sh [选项]"
            echo ""
            echo "选项:"
            echo "  --no-lint              临时禁用TypeScript类型检查"
            echo "  --skip-health-check     跳过更新后的健康检查"
            echo "  -h, --help             显示帮助信息"
            echo ""
            echo "示例:"
            echo "  sudo bash update-production.sh              # 标准更新"
            echo "  sudo bash update-production.sh --no-lint    # 禁用类型检查"
            exit 0
            ;;
        *)
            echo -e "${RED}未知选项: $1${NC}"
            echo "使用 -h 或 --help 查看帮助"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Tarsight 生产环境更新脚本 v2.0${NC}"
echo -e "${BLUE}  方案: 零停机更新${NC}"
echo -e "${BLUE}  时间: $(date)${NC}"
if [ "$NO_LINT" = true ]; then
    echo -e "${YELLOW}  模式: 禁用类型检查${NC}"
fi
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. 检查当前状态
echo -e "${YELLOW}[1/8] 检查当前环境...${NC}"
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ 错误: 项目目录不存在: $PROJECT_DIR${NC}"
    exit 1
fi

cd $PROJECT_DIR
echo -e "${GREEN}✓ 项目目录: $PROJECT_DIR${NC}"

if ! docker ps | grep -q tarsight-frontend; then
    echo -e "${YELLOW}⚠ 警告: tarsight-frontend 容器未运行${NC}"
else
    echo -e "${GREEN}✓ tarsight-frontend 容器正在运行${NC}"
fi

# 检查git状态
echo ""
echo -e "${YELLOW}当前Git版本:${NC}"
git log --oneline -1
echo ""

# 2. 创建备份
echo -e "${YELLOW}[2/8] 创建备份...${NC}"
echo -e "备份目录: ${BACKUP_DIR}"
sudo cp -r $PROJECT_DIR $BACKUP_DIR
echo -e "${GREEN}✓ 备份完成${NC}"

# 同时创建git备份分支
BACKUP_BRANCH="backup-before-update-${BACKUP_DATE}"
git branch $BACKUP_BRANCH
echo -e "${GREEN}✓ Git备份分支: $BACKUP_BRANCH${NC}"
echo ""

# 3. 拉取最新代码
echo -e "${YELLOW}[3/8] 拉取最新代码...${NC}"
git fetch origin
echo -e "${GREEN}✓ 代码拉取完成${NC}"

echo ""
echo -e "${YELLOW}最新更新:${NC}"
git log HEAD..origin/master --oneline
echo ""

# 确认更新
read -p "是否继续更新? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ 更新已取消${NC}"
    exit 0
fi

git pull origin master
echo -e "${GREEN}✓ 代码更新完成${NC}"
echo ""

# 4. 处理类型检查选项
if [ "$NO_LINT" = true ]; then
    echo -e "${YELLOW}[4/8] 临时禁用类型检查...${NC}"
    if [ -f "tarsight-dashboard/package.json" ]; then
        # 备份原文件
        cp tarsight-dashboard/package.json tarsight-dashboard/package.json.bak

        # 修改build命令添加--no-lint
        sed -i 's/"build": "next build"/"build": "next build --no-lint"/' tarsight-dashboard/package.json
        echo -e "${GREEN}✓ 已临时禁用类型检查${NC}"
        echo -e "${YELLOW}  原文件已备份到 package.json.bak${NC}"
    fi
    echo ""
fi

# 5. 构建新镜像
echo -e "${YELLOW}[5/8] 构建新Docker镜像...${NC}"
echo -e "这个过程可能需要几分钟..."
echo -e "${YELLOW}开始时间: $(date)${NC}"

if docker compose build --no-cache frontend 2>&1 | tee /tmp/build.log; then
    echo -e "${GREEN}✓ 镜像构建成功${NC}"
else
    echo -e "${RED}❌ 镜像构建失败${NC}"
    echo -e "${YELLOW}构建错误日志:${NC}"
    tail -50 /tmp/build.log

    echo ""
    echo -e "${YELLOW}是否需要回滚到之前版本? (y/n)${NC}"
    read -r -n 1 response
    echo
    if [[ $response =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}正在回滚...${NC}"
        git reset --hard HEAD~1

        # 恢复package.json
        if [ -f "tarsight-dashboard/package.json.bak" ]; then
            mv tarsight-dashboard/package.json.bak tarsight-dashboard/package.json
        fi

        docker compose build frontend
        docker compose up -d frontend --no-deps --force-recreate
        echo -e "${GREEN}✓ 已回滚到之前版本${NC}"
    fi
    exit 1
fi
echo ""

# 6. 停止旧容器
echo -e "${YELLOW}[6/8] 停止旧容器...${NC}"
docker compose stop frontend
echo -e "${GREEN}✓ 旧容器已停止${NC}"
echo ""

# 7. 启动新容器
echo -e "${YELLOW}[7/8] 启动新容器...${NC}"
docker compose up -d frontend --no-deps --force-recreate
echo -e "${GREEN}✓ 新容器已启动${NC}"
echo ""

# 8. 验证部署
if [ "$SKIP_HEALTH_CHECK" = false ]; then
    echo -e "${YELLOW}[8/8] 验证部署...${NC}"
    echo "等待服务启动（60秒）..."
    sleep 60

    # 运行健康检查脚本
    if [ -f "scripts/health-check.sh" ]; then
        bash scripts/health-check.sh
        HEALTH_STATUS=$?

        if [ $HEALTH_STATUS -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✓ 健康检查通过${NC}"
        else
            echo ""
            echo -e "${YELLOW}⚠ 健康检查发现问题，请手动验证${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ 健康检查脚本不存在，跳过自动检查${NC}"

        # 基础验证
        if docker ps | grep -q tarsight-frontend; then
            echo -e "${GREEN}✓ 容器正在运行${NC}"

            if curl -f -s http://localhost:3000 > /dev/null; then
                echo -e "${GREEN}✓ Web服务响应正常${NC}"
            else
                echo -e "${YELLOW}⚠ Web服务响应测试失败，请手动检查${NC}"
            fi
        else
            echo -e "${RED}❌ 容器启动失败${NC}"
            echo -e "${YELLOW}查看错误日志:${NC}"
            docker compose logs frontend --tail 50

            echo ""
            echo -e "${YELLOW}是否需要回滚? (y/n)${NC}"
            read -r -n 1 response
            echo
            if [[ $response =~ ^[Yy]$ ]]; then
                echo -e "${YELLOW}正在回滚...${NC}"
                cd /opt/tarsight_backup_${BACKUP_DATE}
                docker compose up -d frontend
                echo -e "${GREEN}✓ 已回滚到备份版本${NC}"
            fi
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}[8/8] 跳过健康检查${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ 更新完成！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "最新日志:"
docker compose logs frontend --tail 20
echo ""
echo -e "容器信息:"
docker ps | grep tarsight-frontend
echo ""

# 清理临时文件
if [ -f "tarsight-dashboard/package.json.bak" ]; then
    echo -e "${YELLOW}注意: package.json.bak 保留，如需恢复类型检查执行:${NC}"
    echo -e "  mv tarsight-dashboard/package.json.bak tarsight-dashboard/package.json"
    echo -e "  docker compose up -d --build"
fi

echo ""
echo -e "${YELLOW}备份信息:${NC}"
echo -e "  目录: ${BACKUP_DIR}"
echo -e "  Git分支: ${BACKUP_BRANCH}"
echo ""
echo -e "${YELLOW}后续建议:${NC}"
echo -e "  1. 在浏览器中测试应用功能"
echo -e "  2. 尝试执行一个测试用例，验证Python功能"
echo -e "  3. 查看完整日志: ${BLUE}docker compose logs -f frontend${NC}"
echo ""
