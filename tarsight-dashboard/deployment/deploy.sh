#!/bin/bash

set -e

echo "🚀 Tarsight Dashboard Docker 部署脚本"
echo "======================================"
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "📝 创建 .env 文件..."

    # 检查是否有 .env.local
    if [ -f .env.local ]; then
        echo "从 .env.local 复制环境变量..."
        cp .env.local .env
        echo "✅ .env 文件已创建"
    else
        echo "❌ 错误：.env.local 文件不存在"
        echo "请先创建 .env.local 文件并填入必要的环境变量："
        echo "  - NEXT_PUBLIC_SUPABASE_URL"
        echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
        echo "  - NEXT_PUBLIC_PROJECT_ID"
        exit 1
    fi
fi

echo ""
echo "📦 开始构建 Docker 镜像..."

# 使用 docker compose 或 docker-compose
if docker compose version &> /dev/null; then
    docker compose build
else
    docker-compose build
fi

echo "✅ 镜像构建完成"
echo ""
echo "🎯 启动容器..."

if docker compose version &> /dev/null; then
    docker compose up -d
else
    docker-compose up -d
fi

echo "✅ 容器已启动"
echo ""
echo "🌐 应用访问地址: http://localhost:15183"
echo ""
echo "📋 常用命令:"
echo "  查看日志: docker logs -f tarsight-dashboard"
echo "  停止服务: docker stop tarsight-dashboard"
echo "  重启服务: docker restart tarsight-dashboard"
echo "  删除容器: docker rm -f tarsight-dashboard"
echo ""
echo "✨ 部署完成！"
