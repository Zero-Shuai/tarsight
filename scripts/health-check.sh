#!/bin/bash
# Tarsight 健康检查脚本
# 用于检查服务是否正常运行

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Tarsight 服务健康检查${NC}"
echo -e "${BLUE}  时间: $(date)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

ERRORS=0

# 1. 检查Docker服务
echo -e "${YELLOW}[1/6] 检查Docker服务...${NC}"
if systemctl is-active --quiet docker; then
    echo -e "${GREEN}✓ Docker服务运行正常${NC}"
else
    echo -e "${RED}✗ Docker服务未运行${NC}"
    ERRORS=$((ERRORS+1))
fi

# 2. 检查容器状态
echo -e "${YELLOW}[2/6] 检查容器状态...${NC}"
if docker ps | grep -q tarsight-frontend; then
    echo -e "${GREEN}✓ tarsight-frontend 容器正在运行${NC}"

    # 显示容器运行时间
    UPTIME=$(docker inspect tarsight-frontend | grep -A 5 State | grep StartedAt | cut -d'"' -f4)
    echo "  运行时间: $UPTIME"
else
    echo -e "${RED}✗ tarsight-frontend 容器未运行${NC}"
    ERRORS=$((ERRORS+1))
fi

# 3. 检查端口监听
echo -e "${YELLOW}[3/6] 检查端口监听...${NC}"
if netstat -tulpn 2>/dev/null | grep -q :3000; then
    echo -e "${GREEN}✓ 端口3000正在监听${NC}"
else
    echo -e "${RED}✗ 端口3000未监听${NC}"
    ERRORS=$((ERRORS+1))
fi

# 4. 检查HTTP响应
echo -e "${YELLOW}[4/6] 检查HTTP响应...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
    echo -e "${GREEN}✓ Web服务响应正常 (HTTP $HTTP_CODE)${NC}"

    # 测试响应时间
    RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:3000)
    echo "  响应时间: ${RESPONSE_TIME}s"
else
    echo -e "${RED}✗ Web服务响应异常 (HTTP $HTTP_CODE)${NC}"
    ERRORS=$((ERRORS+1))
fi

# 5. 检查错误日志
echo -e "${YELLOW}[5/6] 检查错误日志...${NC}"
ERROR_COUNT=$(docker compose logs frontend --tail 100 2>&1 | grep -i error | wc -l)
if [ $ERROR_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ 最近100条日志中无错误${NC}"
else
    echo -e "${YELLOW}⚠ 最近100条日志中发现 $ERROR_COUNT 条错误${NC}"
    echo "最近的错误:"
    docker compose logs frontend --tail 100 2>&1 | grep -i error | tail -3
fi

# 6. 检查资源使用
echo -e "${YELLOW}[6/6] 检查资源使用...${NC}"
STATS=$(docker stats tarsight-frontend --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}" | tail -1)
echo "  CPU/内存: $STATS"

# 解析内存使用
MEM_PERCENT=$(echo $STATS | awk '{print $3}' | sed 's/%//')
if [ ! -z "$MEM_PERCENT" ] && [ "$MEM_PERCENT" -gt 80 ]; then
    echo -e "${YELLOW}⚠ 内存使用超过80%${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ 所有检查通过，服务运行正常${NC}"
    echo -e "${BLUE}========================================${NC}"
    exit 0
else
    echo -e "${RED}✗ 发现 $ERRORS 个问题，请检查${NC}"
    echo -e "${BLUE}========================================${NC}"
    exit 1
fi
