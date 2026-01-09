#!/bin/bash

# Tarsight Dashboard 云服务器快速部署脚本
# 适用于: Ubuntu 20.04+, Debian 10+, CentOS 7+

set -e

echo "🚀 Tarsight Dashboard 云服务器部署"
echo "=================================="
echo ""

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为 root 用户
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}⚠️  请不要使用 root 用户运行此脚本${NC}"
    echo "请使用普通用户，脚本会在需要时使用 sudo"
    exit 1
fi

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}📦 Docker 未安装，开始安装...${NC}"

    # 检测操作系统
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
    else
        echo -e "${RED}❌ 无法检测操作系统${NC}"
        exit 1
    fi

    if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
        # Ubuntu/Debian 安装 Docker
        sudo apt-get update
        sudo apt-get install -y ca-certificates curl gnupg
        sudo install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/$OS/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        sudo chmod a+r /etc/apt/keyrings/docker.gpg

        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS \
          $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
          sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    elif [[ "$OS" == "centos" ]] || [[ "$OS" == "rhel" ]]; then
        # CentOS/RHEL 安装 Docker
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        sudo systemctl start docker
        sudo systemctl enable docker
    else
        echo -e "${RED}❌ 不支持的操作系统: $OS${NC}"
        exit 1
    fi

    # 将当前用户添加到 docker 组
    sudo usermod -aG docker $USER

    echo -e "${GREEN}✅ Docker 安装完成${NC}"
    echo -e "${YELLOW}⚠️  请注销并重新登录以使 docker 组生效${NC}"
    echo -e "${YELLOW}   或运行: newgrp docker${NC}"
fi

# 检查 .env 文件
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚙️  配置环境变量...${NC}"

    if [ -f ../.env.local ]; then
        echo "从 .env.local 复制配置..."
        cp ../.env.local .env
    else
        echo "需要手动配置环境变量"
        echo ""
        echo "请输入你的 Supabase 配置:"
        echo ""
        read -p "Supabase URL (例如: https://xxx.supabase.co): " SUPABASE_URL
        read -p "Supabase Anon Key: " SUPABASE_KEY

        cat > .env << EOF
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_KEY
EOF

        echo ""
        echo -e "${GREEN}✅ 环境变量已配置${NC}"
    fi
fi

echo ""
echo -e "${YELLOW}🔨 构建 Docker 镜像...${NC}"

# 使用 docker compose 或 docker-compose
if docker compose version &> /dev/null; then
    docker compose build
else
    docker-compose build
fi

echo -e "${GREEN}✅ 镜像构建完成${NC}"
echo ""
echo -e "${YELLOW}🚀 启动容器...${NC}"

if docker compose version &> /dev/null; then
    docker compose up -d
else
    docker-compose up -d
fi

echo -e "${GREEN}✅ 容器已启动${NC}"
echo ""

# 获取服务器 IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "your-server-ip")

echo "=========================================="
echo -e "${GREEN}🎉 部署完成！${NC}"
echo "=========================================="
echo ""
echo "📱 访问地址:"
echo "   http://$SERVER_IP:3000"
echo ""
echo "📋 常用命令:"
echo "   查看日志: docker logs -f tarsight-dashboard"
echo "   停止服务: docker compose down"
echo "   重启服务: docker compose restart"
echo "   查看状态: docker compose ps"
echo ""
echo "📖 更多信息请查看: CLOUD_DEPLOYMENT_GUIDE.md"
echo ""
