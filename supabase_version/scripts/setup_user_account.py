#!/usr/bin/env python3
"""
配置用户账户和数据迁移脚本

功能：
1. 创建或获取用户
2. 将现有项目分配给用户
3. 更新 global_config
4. 验证 RLS 策略
"""

import sys
import os
import logging

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.supabase_client import get_supabase_client
from utils.env_config import get_env_config

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)


def setup_user_account(email: str, password: str):
    """设置用户账户并迁移数据"""

    logger.info(f"🔧 配置用户账户: {email}")
    logger.info("=" * 60)

    client = get_supabase_client()
    env_config = get_env_config()

    # 获取项目 ID
    project = client.get_tarsight_project()
    project_id = project['id']
    logger.info(f"📋 项目 ID: {project_id}")

    # 步骤 1: 使用 Supabase Auth API 创建用户（如果不存在）
    logger.info("\n📝 步骤 1: 创建/检查用户账户")

    import requests

    # 注册用户
    signup_url = f"{env_config.supabase_url}/auth/v1/signup"
    signup_data = {
        "email": email,
        "password": password,
        "options": {
            "data": {
                "name": "Bruce"
            }
        }
    }

    try:
        response = requests.post(signup_url, json=signup_data, headers={
            "apikey": env_config.supabase_anon_key,
            "Content-Type": "application/json"
        })

        if response.status_code in [200, 201]:
            user_data = response.json()
            user_id = user_data.get('user', {}).get('id')
            logger.info(f"✅ 用户账户创建成功: {user_id}")
        elif response.status_code == 422:
            # 用户已存在，尝试登录获取 ID
            logger.info("ℹ️  用户已存在，尝试登录获取用户 ID...")

            login_url = f"{env_config.supabase_url}/auth/v1/token?grant_type=password"
            login_data = {
                "email": email,
                "password": password
            }

            response = requests.post(login_url, json=login_data, headers={
                "apikey": env_config.supabase_anon_key,
                "Content-Type": "application/json"
            })

            if response.status_code == 200:
                user_data = response.json()
                user_id = user_data.get('user', {}).get('id')
                logger.info(f"✅ 用户 ID: {user_id}")
            else:
                logger.error(f"❌ 登录失败: {response.text}")
                return
        else:
            logger.error(f"❌ 创建用户失败: {response.text}")
            return

    except Exception as e:
        logger.error(f"❌ 用户操作异常: {str(e)}")
        return

    # 步骤 2: 更新项目的 user_id
    logger.info(f"\n📝 步骤 2: 将项目分配给用户")

    update_sql = f"""
    UPDATE projects
    SET user_id = '{user_id}'
    WHERE id = '{project_id}';
    """

    try:
        # 使用 REST API 更新
        response = client.session.patch(
            f"{env_config.supabase_url}/rest/v1/projects",
            params={'id': f'eq.{project_id}'},
            json={'user_id': user_id},
            headers=client.headers
        )

        if response.status_code in [200, 204]:
            logger.info(f"✅ 项目已分配给用户: {user_id}")
        else:
            logger.error(f"❌ 更新失败: {response.status_code} - {response.text}")
            logger.info("💡 请手动执行以下 SQL:")
            logger.info(update_sql)

    except Exception as e:
        logger.error(f"❌ 更新异常: {str(e)}")
        logger.info("💡 请手动执行以下 SQL:")
        logger.info(update_sql)

    # 步骤 3: 检查 RLS 是否启用
    logger.info(f"\n📝 步骤 3: 检查 RLS 状态")

    rls_check_sql = """
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('projects', 'modules', 'test_cases', 'test_executions', 'test_results')
    ORDER BY tablename;
    """

    logger.info("💡 请在 Supabase Dashboard SQL Editor 中执行以下 SQL 检查 RLS:")
    logger.info(rls_check_sql)

    # 步骤 4: 输出配置脚本
    logger.info(f"\n📝 步骤 4: 生成 RLS 配置脚本")
    logger.info("=" * 60)
    logger.info("请在 Supabase Dashboard 的 SQL Editor 中执行 setup_auth_and_rls.sql")
    logger.info("=" * 60)

    # 步骤 5: 测试登录
    logger.info(f"\n📝 步骤 5: 测试用户登录")

    try:
        login_url = f"{env_config.supabase_url}/auth/v1/token?grant_type=password"
        login_data = {
            "email": email,
            "password": password
        }

        response = requests.post(login_url, json=login_data, headers={
            "apikey": env_config.supabase_anon_key,
            "Content-Type": "application/json"
        })

        if response.status_code == 200:
            user_data = response.json()
            access_token = user_data.get('access_token')
            logger.info(f"✅ 登录成功！Access Token: {access_token[:50]}...")

            # 使用 token 测试访问项目
            auth_client = get_supabase_client(access_token=access_token)
            projects = auth_client.get_projects()

            if projects:
                logger.info(f"✅ 使用 token 访问成功！找到 {len(projects)} 个项目")
                for p in projects:
                    logger.info(f"   - {p['name']} (user_id: {p.get('user_id', 'N/A')})")
            else:
                logger.warning("⚠️  未找到项目，可能 RLS 策略未正确配置")
        else:
            logger.error(f"❌ 登录测试失败: {response.text}")

    except Exception as e:
        logger.error(f"❌ 登录测试异常: {str(e)}")

    logger.info("\n" + "=" * 60)
    logger.info("✨ 配置完成！")
    logger.info("=" * 60)
    logger.info("\n📋 后续步骤:")
    logger.info("1. 在 Supabase Dashboard 中执行 setup_auth_and_rls.sql")
    logger.info("2. 在 Authentication → Users 中确认用户已创建")
    logger.info("3. 重启前端应用并测试登录")
    logger.info(f"   邮箱: {email}")
    logger.info(f"   密码: {password}")
    logger.info("")


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='配置用户账户')
    parser.add_argument('--email', default='243644123@qq.com', help='用户邮箱')
    parser.add_argument('--password', default='Bruce1993@', help='用户密码')

    args = parser.parse_args()

    try:
        setup_user_account(args.email, args.password)
    except KeyboardInterrupt:
        logger.info("\n⚠️  操作已取消")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ 配置失败: {str(e)}")
        sys.exit(1)
