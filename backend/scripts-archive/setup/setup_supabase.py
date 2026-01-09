#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Supabase 快速设置脚本
引导用户完成 Supabase 集成配置
"""

import os
import sys
from pathlib import Path

def get_user_input(prompt, example=""):
    """获取用户输入"""
    if example:
        prompt = f"{prompt}\n示例: {example}\n> "
    else:
        prompt = f"{prompt}\n> "

    return input(prompt).strip()

def validate_url(url):
    """验证 URL 格式"""
    return url.startswith('https://') and '.supabase.co' in url

def validate_key(key):
    """验证密钥格式"""
    return key.startswith('eyJ') and len(key) > 100

def update_env_file(supabase_url, anon_key, service_key=""):
    """更新 .env.supabase 文件"""
    env_file = Path(".env.supabase")

    # 读取现有配置（如果存在）
    existing_config = {}
    if env_file.exists():
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    existing_config[key] = value

    # 更新配置
    existing_config['SUPABASE_URL'] = supabase_url
    existing_config['SUPABASE_ANON_KEY'] = anon_key
    if service_key:
        existing_config['SUPABASE_SERVICE_KEY'] = service_key

    # 写入文件
    with open(env_file, 'w', encoding='utf-8') as f:
        f.write("# =============================================\n")
        f.write("# Supabase 数据库配置\n")
        f.write("# =============================================\n\n")

        # Supabase 配置
        f.write(f"SUPABASE_URL={supabase_url}\n")
        f.write(f"SUPABASE_ANON_KEY={anon_key}\n")
        if service_key:
            f.write(f"SUPABASE_SERVICE_KEY={service_key}\n")
        f.write("\n")

        f.write("# =============================================\n")
        f.write("# Tarsight 项目配置\n")
        f.write("# =============================================\n\n")

        # 保留其他配置
        other_keys = [
            'TARGET_PROJECT', 'BASE_URL', 'API_TOKEN', 'WECHAT_WEBHOOK_URL',
            'ENABLE_WECHAT_NOTIFICATION', 'REPORTS_DIR', 'ALLURE_REPORTS_DIR',
            'GENERATE_HTML_REPORT', 'DEFAULT_TIMEOUT', 'HTTP_TIMEOUT',
            'VERBOSE_OUTPUT', 'DEBUG_MODE', 'LOG_LEVEL'
        ]

        for key in other_keys:
            if key in existing_config:
                f.write(f"{key}={existing_config[key]}\n")

    print(f"✅ 配置文件已更新: {env_file}")

def print_setup_guide():
    """打印设置指南"""
    print("\n" + "="*60)
    print("🚀 Supabase 项目创建指南")
    print("="*60)

    print("\n📝 步骤 1: 创建 Supabase 项目")
    print("1. 访问 https://supabase.com")
    print("2. 点击 'Start your project' 或 'New project'")
    print("3. 登录或注册账户")
    print("4. 选择组织（或创建新组织）")
    print("5. 输入项目名称（例如: tarsight-test-platform）")
    print("6. 设置数据库密码")
    print("7. 选择地区")
    print("8. 点击 'Create new project'")

    print("\n📡 步骤 2: 获取 API 配置")
    print("1. 等待项目创建完成（约1-2分钟）")
    print("2. 进入项目 Dashboard")
    print("3. 点击左侧菜单 'Settings' → 'API'")
    print("4. 在 'Project URL' 部分，复制完整的 URL")
    print("5. 在 'Project API keys' 部分，复制 'anon public' 密钥")

    print("\n⚙️ 步骤 3: 配置数据库架构")
    print("1. 在 Supabase Dashboard 中，点击 'SQL Editor'")
    print("2. 点击 'New query'")
    print("3. 复制并粘贴 database/schema/01_complete_schema.sql 的内容")
    print("4. 点击 'Run' 执行 SQL")

def main():
    """主函数"""
    print("🔧 Tarsight Supabase 快速设置")
    print("="*60)

    # 检查是否已有配置
    env_file = Path(".env.supabase")
    if env_file.exists():
        print("⚠️ 检测到现有的 .env.supabase 文件")
        choice = input("是否要重新配置? (y/N): ").lower().strip()
        if choice not in ['y', 'yes']:
            print("配置未更改，退出设置")
            return

    print_setup_guide()

    print("\n🔧 请输入 Supabase 配置信息:")
    print("-" * 40)

    # 获取 Supabase URL
    while True:
        supabase_url = get_user_input("Supabase 项目 URL", "https://abcdefg.supabase.co")
        if not supabase_url:
            print("❌ URL 不能为空")
            continue

        if not validate_url(supabase_url):
            print("❌ URL 格式不正确，应该是类似 https://your-project-ref.supabase.co 的格式")
            continue

        break

    # 获取匿名密钥
    while True:
        anon_key = get_user_input("Supabase 匿名密钥 (anon public)", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
        if not anon_key:
            print("❌ 密钥不能为空")
            continue

        if not validate_key(anon_key):
            print("⚠️ 密钥格式可能不正确，请确保复制完整的 'anon public' 密钥")
            confirm = input("是否继续使用此密钥? (y/N): ").lower().strip()
            if confirm in ['y', 'yes']:
                break
            continue

        break

    # 获取服务密钥（可选）
    service_key = get_user_input("Supabase 服务密钥 (service_role，可选)", "eyJ...")
    if not service_key:
        print("ℹ️ 跳过服务密钥配置")

    print("\n📋 配置预览:")
    print(f"URL: {supabase_url}")
    print(f"匿名密钥: {anon_key[:30]}...")
    if service_key:
        print(f"服务密钥: {service_key[:30]}...")

    # 确认配置
    print("\n" + "-"*40)
    confirm = input("确认以上配置是否正确? (y/N): ").lower().strip()
    if confirm not in ['y', 'yes']:
        print("配置已取消")
        return

    # 更新配置文件
    try:
        update_env_file(supabase_url, anon_key, service_key)
        print("\n✅ 配置保存成功!")

        print("\n🧪 下一步操作:")
        print("1. 在 Supabase Dashboard 中执行 database/schema/01_complete_schema.sql")
        print("2. 运行连接测试: python scripts/test_supabase_connection.py")
        print("3. 迁移现有数据: python scripts/migrate_to_supabase.py")
        print("4. 测试完整集成: python run.py --mode database")

    except Exception as e:
        print(f"\n❌ 配置保存失败: {e}")
        print("请检查文件权限和磁盘空间")

if __name__ == "__main__":
    main()