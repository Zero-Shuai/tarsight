#!/usr/bin/env python3
"""
配置 Supabase 用户认证和行级安全策略（RLS）

功能：
1. 为所有表启用 RLS
2. 配置用户只能访问自己的数据
3. 允许认证用户进行 CRUD 操作
"""

import sys
import os
import logging

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.supabase_client import get_supabase_client

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)


def execute_sql(client: get_supabase_client, sql: str, description: str) -> bool:
    """执行 SQL 语句"""
    try:
        result = client.execute_sql(sql)
        if result.get('error'):
            logger.error(f"❌ {description} 失败: {result.get('error')}")
            return False
        logger.info(f"✅ {description} 成功")
        return True
    except Exception as e:
        logger.error(f"❌ {description} 异常: {str(e)}")
        return False


def setup_rls():
    """配置行级安全策略"""

    logger.info("🔐 开始配置 Supabase 认证和 RLS 策略")
    logger.info("=" * 60)

    client = get_supabase_client()
    project = client.get_tarsight_project()
    project_id = project['id']

    # SQL 脚本
    sql_commands = [
        # 1. 启用所有表的 RLS
        {
            "sql": f"""
            -- 为 projects 表启用 RLS
            ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

            -- 为 modules 表启用 RLS
            ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

            -- 为 test_cases 表启用 RLS
            ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;

            -- 为 test_executions 表启用 RLS
            ALTER TABLE test_executions ENABLE ROW LEVEL SECURITY;

            -- 为 test_results 表启用 RLS
            ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
            """,
            "description": "启用所有表的 RLS"
        },

        # 2. 删除旧的策略（如果存在）
        {
            "sql": """
            DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
            DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
            DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
            DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

            DROP POLICY IF EXISTS "Users can view modules of their projects" ON modules;
            DROP POLICY IF EXISTS "Users can insert modules into their projects" ON modules;
            DROP POLICY IF EXISTS "Users can update modules of their projects" ON modules;
            DROP POLICY IF EXISTS "Users can delete modules from their projects" ON modules;

            DROP POLICY IF EXISTS "Users can view test cases of their projects" ON test_cases;
            DROP POLICY IF EXISTS "Users can insert test cases into their projects" ON test_cases;
            DROP POLICY IF EXISTS "Users can update test cases of their projects" ON test_cases;
            DROP POLICY IF EXISTS "Users can delete test cases from their projects" ON test_cases;

            DROP POLICY IF EXISTS "Users can view test executions of their projects" ON test_executions;
            DROP POLICY IF EXISTS "Users can insert test executions into their projects" ON test_executions;
            DROP POLICY IF EXISTS "Users can update test executions of their projects" ON test_executions;
            DROP POLICY IF EXISTS "Users can delete test executions from their projects" ON test_executions;

            DROP POLICY IF EXISTS "Users can view test results of their projects" ON test_results;
            DROP POLICY IF EXISTS "Users can insert test results into their projects" ON test_results;
            DROP POLICY IF EXISTS "Users can update test results of their projects" ON test_results;
            DROP POLICY IF EXISTS "Users can delete test results from their projects" ON test_results;
            """,
            "description": "删除旧策略"
        },

        # 3. 创建 projects 表策略
        {
            "sql": """
            -- 用户只能查看自己的项目
            CREATE POLICY "Users can view their own projects"
            ON projects
            FOR SELECT
            USING (auth.uid()::text = user_id);

            -- 用户可以创建项目
            CREATE POLICY "Users can insert their own projects"
            ON projects
            FOR INSERT
            WITH CHECK (auth.uid()::text = user_id);

            -- 用户可以更新自己的项目
            CREATE POLICY "Users can update their own projects"
            ON projects
            FOR UPDATE
            USING (auth.uid()::text = user_id)
            WITH CHECK (auth.uid()::text = user_id);

            -- 用户可以删除自己的项目
            CREATE POLICY "Users can delete their own projects"
            ON projects
            FOR DELETE
            USING (auth.uid()::text = user_id);
            """,
            "description": "创建 projects 表策略"
        },

        # 4. 创建 modules 表策略
        {
            "sql": """
            -- 用户可以查看自己项目的模块
            CREATE POLICY "Users can view modules of their projects"
            ON modules
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM projects
                    WHERE projects.id = modules.project_id
                    AND projects.user_id = auth.uid()::text
                )
            );

            -- 用户可以为自己的项目添加模块
            CREATE POLICY "Users can insert modules into their projects"
            ON modules
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM projects
                    WHERE projects.id = project_id
                    AND projects.user_id = auth.uid()::text
                )
            );

            -- 用户可以更新自己项目的模块
            CREATE POLICY "Users can update modules of their projects"
            ON modules
            FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM projects
                    WHERE projects.id = modules.project_id
                    AND projects.user_id = auth.uid()::text
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM projects
                    WHERE projects.id = project_id
                    AND projects.user_id = auth.uid()::text
                )
            );

            -- 用户可以删除自己项目的模块
            CREATE POLICY "Users can delete modules from their projects"
            ON modules
            FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM projects
                    WHERE projects.id = modules.project_id
                    AND projects.user_id = auth.uid()::text
                )
            );
            """,
            "description": "创建 modules 表策略"
        },

        # 5. 创建 test_cases 表策略
        {
            "sql": """
            -- 用户可以查看自己项目的测试用例
            CREATE POLICY "Users can view test cases of their projects"
            ON test_cases
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM projects
                    WHERE projects.id = test_cases.project_id
                    AND projects.user_id = auth.uid()::text
                )
            );

            -- 用户可以为自己的项目添加测试用例
            CREATE POLICY "Users can insert test cases into their projects"
            ON test_cases
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM projects
                    WHERE projects.id = project_id
                    AND projects.user_id = auth.uid()::text
                )
            );

            -- 用户可以更新自己项目的测试用例
            CREATE POLICY "Users can update test cases of their projects"
            ON test_cases
            FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM projects
                    WHERE projects.id = test_cases.project_id
                    AND projects.user_id = auth.uid()::text
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM projects
                    WHERE projects.id = project_id
                    AND projects.user_id = auth.uid()::text
                )
            );

            -- 用户可以删除自己项目的测试用例
            CREATE POLICY "Users can delete test cases from their projects"
            ON test_cases
            FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM projects
                    WHERE projects.id = test_cases.project_id
                    AND projects.user_id = auth.uid()::text
                )
            );
            """,
            "description": "创建 test_cases 表策略"
        },

        # 6. 创建 test_executions 表策略
        {
            "sql": """
            -- 用户可以查看自己项目的测试执行
            CREATE POLICY "Users can view test executions of their projects"
            ON test_executions
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM projects
                    WHERE projects.id = test_executions.project_id
                    AND projects.user_id = auth.uid()::text
                )
            );

            -- 用户可以为自己的项目创建测试执行
            CREATE POLICY "Users can insert test executions into their projects"
            ON test_executions
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM projects
                    WHERE projects.id = project_id
                    AND projects.user_id = auth.uid()::text
                )
            );

            -- 用户可以更新自己项目的测试执行
            CREATE POLICY "Users can update test executions of their projects"
            ON test_executions
            FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM projects
                    WHERE projects.id = test_executions.project_id
                    AND projects.user_id = auth.uid()::text
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM projects
                    WHERE projects.id = project_id
                    AND projects.user_id = auth.uid()::text
                )
            );

            -- 用户可以删除自己项目的测试执行
            CREATE POLICY "Users can delete test executions from their projects"
            ON test_executions
            FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM projects
                    WHERE projects.id = test_executions.project_id
                    AND projects.user_id = auth.uid()::text
                )
            );
            """,
            "description": "创建 test_executions 表策略"
        },

        # 7. 创建 test_results 表策略
        {
            "sql": """
            -- 用户可以查看自己项目的测试结果
            CREATE POLICY "Users can view test results of their projects"
            ON test_results
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM test_executions
                    JOIN projects ON projects.id = test_executions.project_id
                    WHERE test_executions.id = test_results.execution_id
                    AND projects.user_id = auth.uid()::text
                )
            );

            -- 用户可以为自己的项目添加测试结果
            CREATE POLICY "Users can insert test results into their projects"
            ON test_results
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM test_executions
                    JOIN projects ON projects.id = test_executions.project_id
                    WHERE test_executions.id = execution_id
                    AND projects.user_id = auth.uid()::text
                )
            );

            -- 用户可以更新自己项目的测试结果
            CREATE POLICY "Users can update test results of their projects"
            ON test_results
            FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM test_executions
                    JOIN projects ON projects.id = test_executions.project_id
                    WHERE test_executions.id = test_results.execution_id
                    AND projects.user_id = auth.uid()::text
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM test_executions
                    JOIN projects ON projects.id = test_executions.project_id
                    WHERE test_executions.id = execution_id
                    AND projects.user_id = auth.uid()::text
                )
            );

            -- 用户可以删除自己项目的测试结果
            CREATE POLICY "Users can delete test results from their projects"
            ON test_results
            FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM test_executions
                    JOIN projects ON projects.id = test_executions.project_id
                    WHERE test_executions.id = test_results.execution_id
                    AND projects.user_id = auth.uid()::text
                )
            );
            """,
            "description": "创建 test_results 表策略"
        },
    ]

    # 执行所有 SQL 命令
    success_count = 0
    failed_count = 0

    for command in sql_commands:
        if execute_sql(client, command['sql'], command['description']):
            success_count += 1
        else:
            failed_count += 1

    logger.info("")
    logger.info("=" * 60)
    logger.info(f"✨ 配置完成！成功: {success_count}, 失败: {failed_count}")
    logger.info("")
    logger.info("📝 后续步骤：")
    logger.info("1. 在 Supabase Dashboard 中启用 Email Auth")
    logger.info("2. 配置邮件服务器（SMTP）用于发送验证邮件")
    logger.info("3. 测试用户注册和登录功能")
    logger.info("")


def add_user_id_column():
    """为 projects 表添加 user_id 列（如果不存在）"""
    logger.info("📋 检查并添加 user_id 列")

    client = get_supabase_client()

    sql = """
    -- 为 projects 表添加 user_id 列
    ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS user_id TEXT;

    -- 为现有记录设置默认值（可选：设置为第一个用户或系统用户）
    -- UPDATE projects SET user_id = 'system-user' WHERE user_id IS NULL;
    """

    if execute_sql(client, sql, "添加 user_id 列"):
        logger.info("✅ user_id 列已添加到 projects 表")
        return True
    else:
        logger.error("❌ 添加 user_id 列失败")
        return False


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='配置 Supabase 认证和 RLS')
    parser.add_argument('--add-user-id', action='store_true',
                       help='先添加 user_id 列到 projects 表')

    args = parser.parse_args()

    try:
        # 如果需要，先添加 user_id 列
        if args.add_user_id:
            add_user_id_column()

        # 配置 RLS
        setup_rls()

    except KeyboardInterrupt:
        logger.info("\n⚠️  操作已取消")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ 配置失败: {str(e)}")
        sys.exit(1)
