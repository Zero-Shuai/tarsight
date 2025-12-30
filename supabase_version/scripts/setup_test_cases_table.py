#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
设置测试用例数据库表
在Supabase中创建test_cases表和必要的索引
"""

import os
import sys
from typing import Dict, List, Any

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from utils.supabase_config_manager import SupabaseConfigManager


def create_test_cases_table():
    """创建测试用例表"""
    print("🔧 创建测试用例数据库表")
    print("=" * 60)

    config_manager = SupabaseConfigManager(project_id="setup_check")
    supabase = config_manager.get_supabase_client()

    if not supabase:
        print("❌ 无法连接到Supabase")
        return False

    # SQL语句创建表
    create_table_sql = """
    -- 创建测试用例表
    CREATE TABLE IF NOT EXISTS test_cases (
        id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        case_id VARCHAR(50) NOT NULL,
        module VARCHAR(100) NOT NULL,
        test_name VARCHAR(200) NOT NULL,
        description TEXT,
        method VARCHAR(10) NOT NULL,
        url TEXT NOT NULL,
        request_body JSONB,
        expected_status INTEGER DEFAULT 200,
        headers JSONB,
        variables JSONB,
        tags JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 创建唯一约束
    ALTER TABLE test_cases ADD CONSTRAINT unique_case_id UNIQUE (case_id);

    -- 创建索引以提高查询性能
    CREATE INDEX IF NOT EXISTS idx_test_cases_module ON test_cases(module);
    CREATE INDEX IF NOT EXISTS idx_test_cases_is_active ON test_cases(is_active);
    CREATE INDEX IF NOT EXISTS idx_test_cases_case_id ON test_cases(case_id);

    -- 创建GIN索引用于JSON字段搜索
    CREATE INDEX IF NOT EXISTS idx_test_cases_tags_gin ON test_cases USING GIN (tags);

    -- 创建更新时间触发器
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    DROP TRIGGER IF EXISTS update_test_cases_updated_at ON test_cases;
    CREATE TRIGGER update_test_cases_updated_at
        BEFORE UPDATE ON test_cases
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    """

    try:
        # 使用SQL执行（注意：Supabase Python客户端可能不支持直接执行SQL）
        # 这里需要使用service role key或者通过SQL编辑器执行
        print("📝 表创建SQL:")
        print(create_table_sql)
        print("\n💡 请在Supabase控制台的SQL编辑器中执行上述SQL语句")
        print("   或使用具有管理员权限的客户端执行")

        return True

    except Exception as e:
        print(f"❌ 创建表失败: {e}")
        return False


def check_table_exists():
    """检查表是否存在"""
    print("🔍 检查test_cases表结构")
    print("-" * 60)

    config_manager = SupabaseConfigManager(project_id="setup_check")
    supabase = config_manager.get_supabase_client()

    if not supabase:
        print("❌ 无法连接到Supabase")
        return False

    try:
        # 尝试查询表
        response = supabase._make_request('GET', 'test_cases', params={'limit': '1'})

        if response.get('data') is not None:
            print("✅ test_cases表存在且可访问")

            # 显示表结构
            if response.get('data'):
                sample_record = response['data'][0]
                print("\n📋 表结构:")
                for field, value in sample_record.items():
                    field_type = type(value).__name__
                    if isinstance(value, dict):
                        field_type = "JSON/Dict"
                    elif isinstance(value, list):
                        field_type = "JSON/List"
                    print(f"   {field}: {field_type}")
            else:
                print("📋 表为空，无结构信息")

            return True
        else:
            print("❌ test_cases表不存在")
            return False

    except Exception as e:
        print(f"❌ 检查表失败: {e}")
        print("💡 可能需要先创建表，请运行:")
        print("   python scripts/setup_test_cases_table.py")
        return False


def main():
    """主函数"""
    import argparse

    parser = argparse.ArgumentParser(description="设置测试用例数据库表")
    parser.add_argument(
        '--create',
        action='store_true',
        help='创建测试用例表（输出SQL语句）'
    )
    parser.add_argument(
        '--check',
        action='store_true',
        help='检查测试用例表是否存在'
    )

    args = parser.parse_args()

    if args.create:
        return create_test_cases_table()
    elif args.check:
        return check_table_exists()
    else:
        print("💡 使用说明:")
        print("   --create  : 创建测试用例表（输出SQL语句）")
        print("   --check   : 检查测试用例表是否存在")
        return False


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)