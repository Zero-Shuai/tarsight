#!/usr/bin/env python3
"""
为 global_configs 表配置 RLS 策略
"""
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from utils.supabase_config_manager import get_env_config
from utils.supabase_client import SupabaseClient
from utils.auth import AuthClient


def setup_global_configs_rls():
    """配置 global_configs 表的 RLS 策略"""

    print("=" * 60)
    print("开始配置 global_configs 表的 RLS 策略")
    print("=" * 60)

    # 读取 SQL 脚本
    sql_file = project_root / "setup_global_configs_rls.sql"

    if not sql_file.exists():
        print(f"❌ 错误：找不到 SQL 文件 {sql_file}")
        return False

    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    # 首先需要使用管理员权限
    auth_client = AuthClient()

    # 检查是否已登录
    tokens = auth_client.load_tokens()
    if not tokens or 'access_token' not in tokens:
        print("❌ 错误：未登录，请先运行 python scripts/login.py 登录")
        return False

    print("\n📝 执行 RLS 配置 SQL...")

    # 使用 service_role key 来执行 DDL 操作
    env_config = get_env_config()
    from supabase import create_client

    # 使用 service_role key 进行管理操作
    admin_client = create_client(
        env_config.supabase_url,
        env_config.supabase_service_role_key
    )

    try:
        # 执行 SQL（注意：Supabase Python 客户端可能不支持直接执行 DDL）
        # 这里需要使用 rpc 或者直接使用 PostgreSQL 连接

        print("\n⚠️  注意：Supabase Python 客户端不支持直接执行 DDL 语句")
        print("请使用以下两种方式之一：")
        print()
        print("方式 1：在 Supabase Dashboard 的 SQL Editor 中执行")
        print(f"  文件路径: {sql_file}")
        print()
        print("方式 2：使用 psql 命令")
        print(f"  psql -h <your-db-host> -U postgres -d postgres -f {sql_file}")
        print()

        # 显示 SQL 内容
        print("=" * 60)
        print("SQL 脚本内容：")
        print("=" * 60)
        print(sql_content)
        print("=" * 60)

        return False

    except Exception as e:
        print(f"❌ 执行失败: {e}")
        return False


if __name__ == "__main__":
    success = setup_global_configs_rls()
    sys.exit(0 if success else 1)
