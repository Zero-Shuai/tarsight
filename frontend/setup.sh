#!/bin/bash

echo "🚀 Tarsight Dashboard 快速启动"
echo "================================"
echo ""

# 检查是否存在 .env.local
if [ ! -f .env.local ]; then
  echo "📝 创建环境变量文件..."
  cp .env.local.example .env.local

  echo ""
  echo "⚠️  请编辑 .env.local 文件并填入你的 Supabase 配置:"
  echo "   - NEXT_PUBLIC_SUPABASE_URL"
  echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
  echo "   - NEXT_PUBLIC_PROJECT_ID"
  echo ""
  echo "按 Enter 继续..."
  read

  # 尝试从父项目读取配置
  if [ -f ../supabase_version/.env.supabase ]; then
    echo "📋 从父项目读取配置..."
    source ../supabase_version/.env.supabase

    sed -i '' "s|your_supabase_url_here|$SUPABASE_URL|" .env.local
    sed -i '' "s|your_supabase_anon_key_here|$SUPABASE_ANON_KEY|" .env.local

    # 如果有项目ID，也填入
    if [ ! -z "$PROJECT_ID" ]; then
      sed -i '' "s|your_project_id|$PROJECT_ID|" .env.local
    fi

    echo "✅ 配置已自动填入"
  fi
fi

# 安装依赖
if [ ! -d node_modules ]; then
  echo ""
  echo "📦 安装依赖..."
  npm install
fi

# 启动开发服务器
echo ""
echo "🎯 启动开发服务器..."
echo ""
npm run dev
