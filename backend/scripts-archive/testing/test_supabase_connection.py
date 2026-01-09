#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Supabase 连接测试脚本
用于验证 Supabase 配置和连接状态
"""

import os
import asyncio
import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from dotenv import load_dotenv
from supabase import create_client, Client


# 全局客户端
_supabase_client: Client = None


def get_supabase_client() -> Client:
    """获取Supabase客户端"""
    global _supabase_client
    if _supabase_client is None:
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_ANON_KEY')
        if not url or not key:
            raise ValueError("SUPABASE_URL 和 SUPABASE_ANON_KEY 环境变量必须设置")
        _supabase_client = create_client(url, key)
    return _supabase_client


def test_environment():
    """测试环境变量配置"""
    print("🔍 检查环境变量配置...")

    # 尝试加载 .env 文件
    env_files = ['.env', '.env.supabase']
    loaded = False
    for env_file in env_files:
        env_path = Path(project_root) / env_file
        if env_path.exists():
            load_dotenv(env_path)
            print(f"✅ 已加载环境文件: {env_file}")
            loaded = True
            break

    if not loaded:
        print(f"⚠️ 未找到环境文件: {env_files}")

    # 检查必要的环境变量
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_ANON_KEY')

    print(f"📡 SUPABASE_URL: {'✅ 已设置' if url else '❌ 未设置'}")
    if url:
        print(f"   URL: {url}")

    print(f"🔑 SUPABASE_ANON_KEY: {'✅ 已设置' if key else '❌ 未设置'}")
    if key:
        print(f"   密钥长度: {len(key)} 字符")
        print(f"   密钥前缀: {key[:20]}...")

    return bool(url and key)


async def test_connection():
    """测试 Supabase 连接"""
    print("\n🔗 测试 Supabase 连接...")

    try:
        client = get_supabase_client()
        print("✅ Supabase 客户端创建成功")

        # 测试简单查询 - 检查表是否存在
        print("📋 检查数据库表...")

        # 检查全局配置表
        try:
            result = client.table('global_configs').select('*').limit(1).execute()
            print(f"✅ global_configs 表可访问，找到 {len(result.data)} 条记录")
        except Exception as e:
            if "does not exist" in str(e):
                print("❌ global_configs 表不存在，需要执行数据库架构")
            else:
                print(f"❌ 访问 global_configs 表失败: {e}")
            return False

        # 检查项目表
        try:
            result = client.table('projects').select('*').limit(1).execute()
            print(f"✅ projects 表可访问，找到 {len(result.data)} 个项目")
        except Exception as e:
            if "does not exist" in str(e):
                print("❌ projects 表不存在，需要执行数据库架构")
            else:
                print(f"❌ 访问 projects 表失败: {e}")
            return False

        # 测试写入权限（使用全局配置表）
        print("✍️ 测试写入权限...")
        test_config = {
            'config_key': 'test_connection',
            'config_value': True,
            'description': '测试连接时创建的临时配置'
        }

        try:
            result = client.table('global_configs').insert(test_config).execute()
            if result.data:
                print("✅ 写入权限正常")
                # 删除测试数据
                client.table('global_configs').delete().eq('config_key', 'test_connection').execute()
                print("🧹 清理测试数据完成")
            else:
                print("⚠️ 写入操作未返回数据")
        except Exception as e:
            print(f"❌ 写入权限测试失败: {e}")
            print("💡 可能需要检查 Row Level Security (RLS) 策略")

        return True

    except ValueError as e:
        if "SUPABASE_URL" in str(e) or "SUPABASE_ANON_KEY" in str(e):
            print(f"❌ 配置错误: {e}")
        else:
            print(f"❌ 客户端创建失败: {e}")
        return False
    except Exception as e:
        print(f"❌ 连接测试失败: {e}")
        return False


async def test_basic_operations():
    """测试基本数据库操作"""
    print("\n🧪 测试基本数据库操作...")

    try:
        client = get_supabase_client()

        # 测试创建项目
        print("📁 测试项目创建...")
        test_project = {
            'name': 'Tarsight Test Project',
            'description': '用于测试连接的项目',
            'base_url': 'https://api.example.com',
            'created_by': '00000000-0000-0000-0000-000000000001'
        }

        try:
            result = client.table('projects').insert(test_project).execute()
            if result.data:
                project_id = result.data[0]['id']
                print(f"✅ 测试项目创建成功: {project_id}")

                # 测试获取项目
                project = client.table('projects').select('*').eq('id', project_id).execute()
                if project.data:
                    print("✅ 项目读取成功")

                # 清理测试数据
                client.table('projects').delete().eq('id', project_id).execute()
                print("🧹 测试项目清理完成")

                return True
            else:
                print("❌ 项目创建失败")
                return False

        except Exception as e:
            print(f"❌ 项目操作失败: {e}")
            if "permission denied" in str(e):
                print("💡 可能需要调整 RLS 策略或使用服务密钥")
            return False

    except Exception as e:
        print(f"❌ 基本操作测试失败: {e}")
        return False


def print_next_steps():
    """打印下一步操作建议"""
    print("\n📋 下一步操作建议:")
    print("=" * 50)
    print("1. ✅ 确保已设置正确的 SUPABASE_URL 和 SUPABASE_ANON_KEY")
    print("2. 📊 在 Supabase Dashboard 中执行 database/schema/01_complete_schema.sql")
    print("3. 🚀 运行迁移脚本: python scripts/migrate_to_supabase.py")
    print("4. 🧪 测试集成: python run.py")
    print("\n📚 详细指南: database/README.md")


async def main():
    """主函数"""
    print("🔧 Tarsight Supabase 连接测试")
    print("=" * 50)

    # 测试环境配置
    env_ok = test_environment()
    if not env_ok:
        print("\n❌ 环境配置不完整，请检查 .env.supabase 文件")
        print("\n💡 示例配置:")
        print("SUPABASE_URL=https://your-project-ref.supabase.co")
        print("SUPABASE_ANON_KEY=your-anon-key-here")
        return

    # 测试连接
    connection_ok = await test_connection()
    if not connection_ok:
        print("\n❌ Supabase 连接失败")
        print("\n🔧 故障排除:")
        print("1. 检查网络连接")
        print("2. 验证 URL 和密钥是否正确")
        print("3. 确认 Supabase 项目状态")
        return

    # 测试基本操作
    operations_ok = await test_basic_operations()

    # 总结
    print("\n" + "=" * 50)
    if env_ok and connection_ok and operations_ok:
        print("🎉 所有测试通过！Supabase 集成准备就绪")
    else:
        print("⚠️ 部分测试失败，请检查上述错误信息")

    print_next_steps()


if __name__ == "__main__":
    asyncio.run(main())