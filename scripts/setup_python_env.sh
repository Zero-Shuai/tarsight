#!/bin/bash

# Tarsight Python 环境配置脚本
# 适用于 Ubuntu 服务器部署

set -e

echo "=========================================="
echo "Tarsight Python 环境配置"
echo "=========================================="

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_DIR="/opt/tarsight"
PYTHON_DIR="${PROJECT_DIR}/supabase_version"

# 检查是否以正确用户运行
if [ "$USER" != "tarsight" ]; then
    echo -e "${YELLOW}警告: 建议使用 tarsight 用户运行此脚本${NC}"
    echo "当前用户: $USER"
    read -p "是否继续? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "📂 项目目录: $PROJECT_DIR"
echo "🐍 Python 目录: $PYTHON_DIR"
echo ""

# 1. 检查 Python 版本
echo "1️⃣  检查 Python 版本..."
python3 --version

# 2. 进入 Python 目录
cd "$PYTHON_DIR" || exit 1

# 3. 创建虚拟环境（如果不存在）
if [ ! -d ".venv" ]; then
    echo ""
    echo "2️⃣  创建 Python 虚拟环境..."
    python3 -m venv .venv
    echo -e "${GREEN}✅ 虚拟环境创建成功${NC}"
else
    echo ""
    echo "2️⃣  虚拟环境已存在，跳过创建"
fi

# 4. 激活虚拟环境
echo ""
echo "3️⃣  激活虚拟环境..."
source .venv/bin/activate

# 5. 安装 pip 和 uv
echo ""
echo "4️⃣  安装基础工具..."
pip install --upgrade pip
pip install uv

# 6. 安装 Python 依赖
echo ""
echo "5️⃣  安装 Python 依赖包..."
echo "这可能需要几分钟..."
uv pip install --system -r pyproject.toml

echo -e "${GREEN}✅ Python 依赖安装完成${NC}"

# 7. 检查环境变量文件
echo ""
echo "6️⃣  检查环境变量配置..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  已创建 .env 文件，请手动配置以下变量:${NC}"
        echo "   - SUPABASE_URL"
        echo "   - SUPABASE_ANON_KEY"
        echo "   - SUPABASE_SERVICE_ROLE_KEY"
        echo "   - BASE_URL"
        echo "   - API_TOKEN"
    else
        echo -e "${YELLOW}⚠️  警告: .env.example 文件不存在${NC}"
    fi
else
    echo -e "${GREEN}✅ .env 文件已存在${NC}"
fi

# 8. 创建必要目录
echo ""
echo "7️⃣  创建必要目录..."
mkdir -p reports
mkdir -p reports/allure-results

# 9. 测试运行
echo ""
echo "8️⃣  测试 Python 环境..."
if python run.py --help > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Python 环境配置成功！${NC}"
else
    echo -e "${YELLOW}⚠️  警告: run.py 可能需要额外配置${NC}"
fi

# 10. 显示配置信息
echo ""
echo "=========================================="
echo "配置完成！"
echo "=========================================="
echo ""
echo "虚拟环境路径: $PYTHON_DIR/.venv"
echo "Python 解释器: $PYTHON_DIR/.venv/bin/python"
echo ""
echo "下一步操作:"
echo ""
echo "1. 配置 Python 环境变量:"
echo "   vim $PYTHON_DIR/.env"
echo ""
echo "2. 更新前端环境变量，添加以下内容:"
echo "   PROJECT_ROOT=$PYTHON_DIR"
echo "   PYTHON_PATH=$PYTHON_DIR/.venv/bin/python"
echo ""
echo "3. 重启前端服务:"
echo "   pm2 restart tarsight-frontend"
echo ""
echo "4. 测试执行:"
echo "   cd $PYTHON_DIR"
echo "   source .venv/bin/activate"
echo "   python run.py --help"
echo ""

# 11. 显示激活命令
echo "激活虚拟环境命令:"
echo -e "${GREEN}source $PYTHON_DIR/.venv/bin/activate${NC}"
echo ""
