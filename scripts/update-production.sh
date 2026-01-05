#!/bin/bash
# Tarsight 生产环境自动更新脚本 - 方案B（零停机）
# 使用方法: sudo bash update-production.sh

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

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Tarsight 生产环境更新脚本${NC}"
echo -e "${BLUE}  方案: 零停机更新${NC}"
echo -e "${BLUE}  时间: $(date)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. 检查当前状态
echo -e "${YELLOW}[1/7] 检查当前环境...${NC}"
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
echo -e "${YELLOW}[2/7] 创建备份...${NC}"
echo -e "备份目录: ${BACKUP_DIR}"
sudo cp -r $PROJECT_DIR $BACKUP_DIR
echo -e "${GREEN}✓ 备份完成${NC}"

# 同时创建git备份分支
BACKUP_BRANCH="backup-before-update-${BACKUP_DATE}"
git branch $BACKUP_BRANCH
echo -e "${GREEN}✓ Git备份分支: $BACKUP_BRANCH${NC}"
echo ""

# 3. 拉取最新代码
echo -e "${YELLOW}[3/7] 拉取最新代码...${NC}"
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

# 4. 构建新镜像
echo -e "${YELLOW}[4/7] 构建新Docker镜像...${NC}"
echo -e "这个过程可能需要几分钟..."
docker compose build --no-cache frontend
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 镜像构建成功${NC}"
else
    echo -e "${RED}❌ 镜像构建失败${NC}"
    echo -e "${YELLOW}正在回滚...${NC}"
    git reset --hard HEAD~1
    docker compose build frontend
    docker compose up -d frontend --no-deps --force-recreate
    echo -e "${GREEN}✓ 已回滚到之前版本${NC}"
    exit 1
fi
echo ""

# 5. 停止旧容器
echo -e "${YELLOW}[5/7] 停止旧容器...${NC}"
docker compose stop frontend
echo -e "${GREEN}✓ 旧容器已停止${NC}"
echo ""

# 6. 启动新容器
echo -e "${YELLOW}[6/7] 启动新容器...${NC}"
docker compose up -d frontend --no-deps --force-recreate
echo -e "${GREEN}✓ 新容器已启动${NC}"
echo ""

# 7. 等待并验证
echo -e "${YELLOW}[7/7] 等待服务启动并验证...${NC}"
echo "等待30秒..."
sleep 30

# 检查容器状态
echo ""
echo -e "${YELLOW}容器状态:${NC}"
docker ps | grep tarsight-frontend

# 检查健康状态
if docker ps | grep -q tarsight-frontend; then
    echo -e "${GREEN}✓ 容器正在运行${NC}"

    # 测试HTTP响应
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
        git reset --hard HEAD~1
        docker compose stop frontend
        docker compose up -d frontend --no-deps --force-recreate
        sleep 30
        echo -e "${GREEN}✓ 已回滚到之前版本${NC}"
    fi
    exit 1
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
echo -e "${YELLOW}如遇问题，备份位于: $BACKUP_DIR${NC}"
echo -e "${YELLOW}Git备份分支: $BACKUP_BRANCH${NC}"
echo ""
echo -e "查看完整日志: ${BLUE}docker compose logs -f frontend${NC}"
echo -e "查看容器状态: ${BLUE}docker ps${NC}"
echo ""
