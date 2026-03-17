#!/bin/bash
# Tarsight 健康检查脚本 v2.0
# 改进：添加容器环境检查、Alpine兼容性检查、更详细的诊断
# 使用方法: bash health-check.sh [--verbose]

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

VERBOSE=false
PROJECT_DIR="/opt/tarsight"
FRONTEND_PORT="25380"

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            echo "使用方法: bash health-check.sh [选项]"
            echo ""
            echo "选项:"
            echo "  --verbose, -v         显示详细检查信息"
            echo "  -h, --help            显示帮助信息"
            exit 0
            ;;
        *)
            echo -e "${RED}未知选项: $1${NC}"
            echo "使用 -h 或 --help 查看帮助"
            exit 1
            ;;
    esac
done

if [ -f "${PROJECT_DIR}/.env" ]; then
    set -a
    source <(sed 's/\r$//' "${PROJECT_DIR}/.env")
    set +a
fi
FRONTEND_PORT="${FRONTEND_PORT:-25380}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Tarsight 服务健康检查 v2.0${NC}"
echo -e "${BLUE}  时间: $(date)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

ERRORS=0
WARNINGS=0

# 1. 检查Docker服务
echo -e "${YELLOW}[1/9] 检查Docker服务...${NC}"
if systemctl is-active --quiet docker; then
    echo -e "${GREEN}✓ Docker服务运行正常${NC}"

    if [ "$VERBOSE" = true ]; then
        DOCKER_VERSION=$(docker --version)
        echo "  $DOCKER_VERSION"
    fi
else
    echo -e "${RED}✗ Docker服务未运行${NC}"
    ERRORS=$((ERRORS+1))
fi

# 2. 检查容器状态
echo -e "${YELLOW}[2/9] 检查容器状态...${NC}"
if docker ps | grep -q tarsight-frontend; then
    echo -e "${GREEN}✓ tarsight-frontend 容器正在运行${NC}"

    # 显示容器运行时间
    UPTIME=$(docker inspect tarsight-frontend 2>/dev/null | grep -A 5 State | grep StartedAt | cut -d'"' -f4)
    if [ ! -z "$UPTIME" ]; then
        echo "  运行时间: $UPTIME"
    fi

    # 检查健康状态
    HEALTH_STATUS=$(docker inspect tarsight-frontend 2>/dev/null | jq -r '.[0].State.Health.Status' 2>/dev/null || echo "unknown")
    if [ "$HEALTH_STATUS" = "healthy" ]; then
        echo -e "  健康状态: ${GREEN}$HEALTH_STATUS${NC}"
    elif [ "$HEALTH_STATUS" = "starting" ]; then
        echo -e "  健康状态: ${YELLOW}$HEALTH_STATUS${NC}"
    elif [ "$HEALTH_STATUS" != "unknown" ]; then
        echo -e "  健康状态: ${RED}$HEALTH_STATUS${NC}"
        WARNINGS=$((WARNINGS+1))
    fi
else
    echo -e "${RED}✗ tarsight-frontend 容器未运行${NC}"
    ERRORS=$((ERRORS+1))
fi

# 3. 检查Alpine兼容性（新增）
echo -e "${YELLOW}[3/9] 检查容器环境（Alpine兼容性）...${NC}"
if docker ps | grep -q tarsight-frontend; then
    # 检查/bin/sh是否存在
    if docker compose exec -T frontend which /bin/sh > /dev/null 2>&1; then
        echo -e "${GREEN}✓ /bin/sh 存在（Alpine兼容）${NC}"
    else
        echo -e "${RED}✗ /bin/sh 不存在${NC}"
        ERRORS=$((ERRORS+1))
    fi

    # 检查Python3
    if docker compose exec -T frontend which python3 > /dev/null 2>&1; then
        PYTHON_VERSION=$(docker compose exec -T frontend python3 --version 2>&1 || echo "unknown")
        echo -e "${GREEN}✓ Python 已安装: $PYTHON_VERSION${NC}"
    else
        echo -e "${YELLOW}⚠ Python 未找到或无法访问${NC}"
        WARNINGS=$((WARNINGS+1))
    fi
else
    echo -e "${YELLOW}⚠ 容器未运行，跳过环境检查${NC}"
fi

# 4. 检查端口监听
echo -e "${YELLOW}[4/9] 检查端口监听...${NC}"
if netstat -tulpn 2>/dev/null | grep -q "127.0.0.1:${FRONTEND_PORT}"; then
    echo -e "${GREEN}✓ 端口127.0.0.1:${FRONTEND_PORT}正在监听${NC}"
elif netstat -tulpn 2>/dev/null | grep -q ":${FRONTEND_PORT}"; then
    echo -e "${GREEN}✓ 端口${FRONTEND_PORT}正在监听${NC}"
else
    echo -e "${RED}✗ 端口${FRONTEND_PORT}未监听${NC}"
    ERRORS=$((ERRORS+1))
fi

# 5. 检查HTTP响应
echo -e "${YELLOW}[5/9] 检查HTTP响应...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${FRONTEND_PORT}/healthz" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Web服务响应正常 (HTTP $HTTP_CODE)${NC}"
    VERSION_JSON=$(curl -fsS "http://127.0.0.1:${FRONTEND_PORT}/api/version" 2>/dev/null || true)
    if [ -n "$VERSION_JSON" ]; then
        echo "  当前版本: ${VERSION_JSON}"
    fi

    # 测试响应时间
    RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" "http://127.0.0.1:${FRONTEND_PORT}/healthz" 2>/dev/null || echo "0")
    echo "  响应时间: ${RESPONSE_TIME}s"

    # 检查响应时间是否合理
    if [ $(echo "$RESPONSE_TIME > 3.0" | bc -l 2>/dev/null || echo "0") -eq 1 ]; then
        echo -e "${YELLOW}  ⚠ 响应时间较慢（>3秒）${NC}"
        WARNINGS=$((WARNINGS+1))
    fi
else
    echo -e "${RED}✗ Web服务响应异常 (HTTP $HTTP_CODE)${NC}"
    ERRORS=$((ERRORS+1))
fi

# 6. 检查错误日志
echo -e "${YELLOW}[6/9] 检查错误日志...${NC}"
ERROR_COUNT=$(docker compose logs frontend --tail 100 2>&1 | grep -i error | wc -l)
if [ $ERROR_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ 最近100条日志中无错误${NC}"
else
    echo -e "${YELLOW}⚠ 最近100条日志中发现 $ERROR_COUNT 条错误${NC}"

    # 显示最近的错误
    if [ "$ERROR_COUNT" -gt 0 ]; then
        echo "  最近的错误:"
        docker compose logs frontend --tail 100 2>&1 | grep -i error | tail -3 | while read line; do
            echo "    - $line"
        done
    fi
    WARNINGS=$((WARNINGS+1))
fi

# 检查特定错误
if docker compose logs frontend --tail 50 2>&1 | grep -q "spawn.*ENOENT"; then
    echo -e "${RED}✗ 发现 spawn ENOENT 错误（shell路径问题）${NC}"
    ERRORS=$((ERRORS+1))
fi

# 7. 检查资源使用
echo -e "${YELLOW}[7/9] 检查资源使用...${NC}"
STATS=$(docker stats tarsight-frontend --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}" | tail -1)
echo "  CPU/内存: $STATS"

# 解析内存使用
MEM_PERCENT=$(echo $STATS | awk '{print $3}' | sed 's/%//' | sed 's/%//' | cut -d'/' -f1)
if [ ! -z "$MEM_PERCENT" ] && [ "$MEM_PERCENT" -gt 80 ]; then
    echo -e "${YELLOW}⚠ 内存使用超过80%${NC}"
    WARNINGS=$((WARNINGS+1))
elif [ ! -z "$MEM_PERCENT" ] && [ "$MEM_PERCENT" -gt 90 ]; then
    echo -e "${RED}✗ 内存使用超过90%，需要关注${NC}"
    ERRORS=$((ERRORS+1))
fi

# 8. 检查磁盘空间（新增）
echo -e "${YELLOW}[8/9] 检查磁盘空间...${NC}"
DISK_USAGE=$(df -h /opt/tarsight 2>/dev/null | tail -1 | awk '{print $5}' | sed 's/%//')
if [ ! -z "$DISK_USAGE" ]; then
    if [ "$DISK_USAGE" -lt 80 ]; then
        echo -e "${GREEN}✓ 磁盘空间充足（使用率: ${DISK_USAGE}%）${NC}"
    elif [ "$DISK_USAGE" -lt 90 ]; then
        echo -e "${YELLOW}⚠ 磁盘使用率较高（${DISK_USAGE}%）${NC}"
        WARNINGS=$((WARNINGS+1))
    else
        echo -e "${RED}✗ 磁盘空间不足（使用率: ${DISK_USAGE}%）${NC}"
        ERRORS=$((ERRORS+1))
    fi
else
    echo -e "${YELLOW}⚠ 无法获取磁盘使用信息${NC}"
fi

# 9. Docker系统检查（新增）
echo -e "${YELLOW}[9/9] Docker系统状态...${NC}"
DOCKER_SYSTEM=$(docker system df --format "table {{.Type}}\t{{.TotalCount}}\t{{.Size}}" 2>/dev/null | tail -n +2)
if [ ! -z "$DOCKER_SYSTEM" ]; then
    echo "  Docker资源使用:"
    echo "$DOCKER_SYSTEM" | head -5 | while read line; do
        echo "    $line"
    done
else
    echo -e "${YELLOW}⚠ 无法获取Docker系统信息${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"

# 总结
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ 所有检查通过，服务运行正常${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo "检查完成时间: $(date)"
    exit 0
elif [ $ERRORS -eq 0 ] && [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ 发现 $WARNINGS 个警告，建议关注${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo "检查完成时间: $(date)"
    exit 0
else
    echo -e "${RED}✗ 发现 $ERRORS 个错误和 $WARNINGS 个警告，请检查${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo "检查完成时间: $(date)"
    exit 1
fi
