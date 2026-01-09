#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
创建测试执行相关的数据库表
"""

import os
import requests
import json
from dotenv import load_dotenv

load_dotenv('.env.supabase')


def create_table(table_sql):
    """创建表"""
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_ANON_KEY')

    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }

    print(f"📋 创建表: {table_sql.split('CREATE TABLE')[1].split('(')[0].strip()}")

    # 由于 Supabase REST API 不直接支持 DDL，我们需要在 Dashboard 中手动创建
    # 这里提供 SQL 语句供用户复制到 Dashboard 中执行

    return table_sql


def main():
    """主函数"""
    print("🔧 创建测试执行相关的数据库表")
    print("=" * 60)
    print("⚠️ 由于 REST API 限制，请在 Supabase Dashboard 中手动执行以下 SQL:")
    print()

    # 测试执行表
    test_executions_sql = """
-- 测试执行表
CREATE TABLE IF NOT EXISTS public.test_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    execution_name VARCHAR(200),
    status VARCHAR(20) DEFAULT 'running',
    total_tests INTEGER DEFAULT 0,
    passed_tests INTEGER DEFAULT 0,
    failed_tests INTEGER DEFAULT 0,
    skipped_tests INTEGER DEFAULT 0,
    total_duration DECIMAL(10,3),
    started_by UUID,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT
);
    """.strip()

    # 测试结果表
    test_results_sql = """
-- 测试结果表
CREATE TABLE IF NOT EXISTS public.test_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    execution_id UUID REFERENCES public.test_executions(id) ON DELETE CASCADE,
    test_case_id UUID REFERENCES public.test_cases(id),
    status VARCHAR(20) NOT NULL,
    duration DECIMAL(10,3),
    error_message TEXT,
    request_info JSONB,
    response_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
    """.strip()

    # 索引
    indexes_sql = """
-- 创建索引
CREATE INDEX IF NOT EXISTS idx_test_executions_project_id ON public.test_executions(project_id);
CREATE INDEX IF NOT EXISTS idx_test_executions_status ON public.test_executions(status);
CREATE INDEX IF NOT EXISTS idx_test_executions_started_at ON public.test_executions(started_at);

CREATE INDEX IF NOT EXISTS idx_test_results_execution_id ON public.test_results(execution_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_case_id ON public.test_results(test_case_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON public.test_results(status);
    """.strip()

    print("1️⃣ 测试执行表 (test_executions):")
    print("```sql")
    print(test_executions_sql)
    print("```")
    print()

    print("2️⃣ 测试结果表 (test_results):")
    print("```sql")
    print(test_results_sql)
    print("```")
    print()

    print("3️⃣ 索引:")
    print("```sql")
    print(indexes_sql)
    print("```")
    print()

    print("📋 执行步骤:")
    print("1. 访问 Supabase Dashboard: https://nxxkgjrbpzhjpdkiiflp.supabase.co")
    print("2. 打开 SQL Editor")
    print("3. 复制并执行上面的 SQL 语句")
    print("4. 完成后运行: python test_supabase_recording.py")
    print()


if __name__ == "__main__":
    main()