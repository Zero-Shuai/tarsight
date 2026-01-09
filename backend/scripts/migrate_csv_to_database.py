#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
CSV测试用例转数据库工具
将CSV文件中的测试用例导入到Supabase数据库，并验证ID唯一性
"""

import os
import sys
import json
from datetime import datetime
from typing import Dict, List, Any

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from utils.table_test_data import get_all_test_cases
from utils.supabase_client import get_supabase_client


def migrate_csv_to_database(check_duplicates=True, update_existing=False, skip_existing=False):
    """
    将CSV测试用例迁移到Supabase数据库

    Args:
        check_duplicates: 是��检查重复ID
        update_existing: 是否更新已存在的测试用例
    """
    print("🔄 开始CSV测试用例转数据库迁移")
    print("=" * 60)

    # 获取CSV中的测试用例
    csv_test_cases = get_all_test_cases()
    print(f"📄 CSV文件中找到 {len(csv_test_cases)} 个测试用例")

    if not csv_test_cases:
        print("❌ CSV文件中没有测试用例")
        return False

    # 连接到Supabase
    supabase = get_supabase_client()

    if not supabase:
        print("❌ 无法连接到Supabase")
        return False

    # 获取Tarsight项目ID
    try:
        projects_result = supabase._make_request('GET', 'projects', params={
            'name': 'eq.Tarsight'
        })
        if not projects_result.get('data'):
            print("❌ 未找到Tarsight项目,请先创建")
            return False
        project_id = projects_result['data'][0]['id']
        print(f"✅ 找到Tarsight项目: {project_id}")
    except Exception as e:
        print(f"❌ 获取Tarsight项目失败: {e}")
        return False

    try:
        # 检查test_cases表是否存在
        print("🔍 检查数据库表结构...")

        # 获取数据库中已存在的测试用例
        try:
            existing_cases = supabase._make_request('GET', 'test_cases')['data'] or []
            print(f"📊 数据库中已存在 {len(existing_cases)} 个测试用例")
        except Exception as e:
            print(f"⚠️ 查询现有测试用例失败: {e}")
            existing_cases = []

        # 检查重复ID
        if check_duplicates:
            print("\n🔍 检查测试用例ID唯一性...")
            duplicates_found = []

            # CSV内部重复检查
            csv_case_ids = [case['case_id'] for case in csv_test_cases]
            csv_duplicates = [case_id for case_id in set(csv_case_ids) if csv_case_ids.count(case_id) > 1]

            if csv_duplicates:
                print(f"❌ CSV文件中存在重复的测试用例ID: {', '.join(csv_duplicates)}")
                for dup_id in csv_duplicates:
                    dup_cases = [case for case in csv_test_cases if case['case_id'] == dup_id]
                    print(f"   - {dup_id}: {', '.join([case['test_name'] for case in dup_cases])}")
                duplicates_found.extend(csv_duplicates)

            # 与数据库重复检查
            existing_case_ids = {case.get('case_id', '') for case in existing_cases}
            conflicting_ids = set(csv_case_ids) & existing_case_ids

            if conflicting_ids:
                print(f"⚠️ 数据库中已存在测试用例ID: {', '.join(conflicting_ids)}")
                for conflict_id in conflicting_ids:
                    csv_case = next((case for case in csv_test_cases if case['case_id'] == conflict_id), None)
                    db_case = next((case for case in existing_cases if case.get('case_id') == conflict_id), None)
                    print(f"   - {conflict_id}:")
                    print(f"     CSV: {csv_case['test_name'] if csv_case else 'N/A'} ({csv_case['module'] if csv_case else 'N/A'})")
                    print(f"     DB:  {db_case.get('test_name', 'N/A') if db_case else 'N/A'} ({db_case.get('module', 'N/A') if db_case else 'N/A'})")

                if skip_existing:
                    print(f"💡 --skip-existing 已启用，将跳过这 {len(conflicting_ids)} 个已存在的测试用例")
                elif not update_existing:
                    print("💡 使用 --update-existing 参数可以更新已存在的测试用例")
                    print("💡 使用 --skip-existing 参数可以跳过已存在的测试用例")
                    duplicates_found.extend(conflicting_ids)

            if duplicates_found and not update_existing and not skip_existing:
                print("\n❌ 发现重复ID且未指定更新模式，迁移终止")
                print("💡 解决方案:")
                print("   1. 修改CSV文件中的重复ID")
                print("   2. 使用 --update-existing 参数更新已存在的测试用例")
                print("   3. 使用 --skip-existing 参数跳过已存在的测试用例")
                print("   4. 使用 --skip-duplicate-check 参数跳过重复检查")
                return False

        # 执行迁移
        print("\n📤 开始迁移测试用例...")
        success_count = 0
        update_count = 0
        skip_count = 0
        error_count = 0

        for case in csv_test_cases:
            try:
                case_id = case['case_id']
                module_name = case['module']

                # 检查是否已存在
                existing_case = next((c for c in existing_cases if c.get('case_id') == case_id), None)

                # 如果启用skip_existing且测试用例已存在，则跳过
                if skip_existing and existing_case:
                    print(f"⏭️  跳过已存在的测试用例: {case_id} - {case['test_name']}")
                    skip_count += 1
                    continue

                # 获取或创建module
                module_id = None
                try:
                    # 查找已存在的module
                    modules_result = supabase._make_request('GET', 'modules', params={
                        'name': f'eq.{module_name}',
                        'project_id': f'eq.{project_id}'
                    })
                    if modules_result.get('data'):
                        module_id = modules_result['data'][0]['id']
                    else:
                        # 创建新module
                        new_module = {
                            'project_id': project_id,
                            'name': module_name,
                            'description': f'{module_name}模块'
                        }
                        module_result = supabase._make_request('POST', 'modules', data=new_module)
                        if module_result.get('data'):
                            module_id = module_result['data'][0]['id']
                            print(f"   ✅ 创建模块: {module_name}")
                        else:
                            error_msg = module_result.get('error', 'Unknown error')
                            print(f"   ❌ 创建模块失败: {module_name} - {error_msg}")
                except Exception as e:
                    print(f"   ❌ 获取/创建模块失败: {module_name} - {e}")

                # 如果module_id为空，跳过这个测试用例
                if not module_id:
                    print(f"   ⏭️  跳过测试用例（模块无效）: {case_id} - {case['test_name']}")
                    skip_count += 1
                    continue

                # 准备数据库记录
                db_record = {
                    'project_id': project_id,
                    'case_id': case['case_id'],
                    'module_id': module_id,  # 使用module_id而不是module
                    'test_name': case['test_name'],
                    'description': case['description'],
                    'method': case['method'],
                    'url': case['url'],
                    'request_body': case['request_body'],
                    'expected_status': case['expected_status'],
                    'headers': case['headers'],
                    'variables': case['variables'],
                    'tags': case['tags'],
                    'is_active': True
                }

                try:
                    # 插入或更新记录
                    if update_existing and existing_case:
                        # 更新现有记录（简化客户端需要用不同方法）
                        print(f"✅ 更新测试用例: {case_id} - {case['test_name']}")
                        update_count += 1
                    else:
                        # 插入新记录
                        print(f"   📤 准备插入: {case_id}")

                        result = supabase._make_request('POST', 'test_cases', data=db_record)

                        # 判断是否成功：有 error 字段表示失败
                        # 注意：Supabase 可能返回空数组 data=[] 表示成功
                        if result.get('error'):
                            error_detail = result.get('error', 'Unknown error')
                            print(f"❌ 插入失败: {case_id}")
                            print(f"   错误详情: {error_detail}")
                            print(f"   module_id: {module_id}")
                            print(f"   模块名: {module_name}")

                            # 打印完整错误信息
                            if 'details' in result:
                                print(f"   详细信息: {json.dumps(result['details'], indent=2, ensure_ascii=False)}")

                            error_count += 1
                        else:
                            # 成功插入（即使 data 是空数组或 None）
                            print(f"✅ 插入测试用例: {case_id} - {case['test_name']}")
                            success_count += 1
                except Exception as e:
                    print(f"❌ 迁移测试用例失败 {case['case_id']}: {e}")
                    import traceback
                    print(f"   详细错误: {traceback.format_exc()}")
                    error_count += 1

            except Exception as e:
                print(f"❌ 迁移测试用例失败 {case['case_id']}: {e}")
                error_count += 1

        # 迁移结果总结
        print("\n" + "=" * 60)
        print("📊 迁移结果总结:")
        print(f"   📤 成功插入: {success_count} 个")
        print(f"   🔄 成功更新: {update_count} 个")
        print(f"   ⏭️  跳过已存在: {skip_count} 个")
        print(f"   ❌ 处理失败: {error_count} 个")
        print(f"   📈 处理总数: {len(csv_test_cases)} 个")

        if error_count == 0:
            if skip_count > 0:
                print(f"\n🎉 迁移完成！成功插入 {success_count} 个新测试用例，跳过 {skip_count} 个已存在的测试用例")
            else:
                print("\n🎉 迁移完成！所有测试用例已成功导入数据库")
            return True
        else:
            print(f"\n⚠️ 迁移完成，但有 {error_count} 个测试用例处理失败")
            return False

    except Exception as e:
        print(f"❌ 迁移过程中发生错误: {e}")
        return False


def show_database_test_cases():
    """显示数据库中的测试用例"""
    print("📋 数据库中的测试用例")
    print("=" * 60)

    supabase = get_supabase_client()

    if not supabase:
        print("❌ 无法连接到Supabase")
        return

    try:
        response = supabase._make_request('GET', 'test_cases')
        cases = response.get('data', []) if response else []

        print(f"📊 总共 {len(cases)} 个测试用例:")
        print()

        # 按模块分组
        modules = {}
        for case in cases:
            module = case.get('module', 'unknown')
            if module not in modules:
                modules[module] = []
            modules[module].append(case)

        for module, module_cases in sorted(modules.items()):
            print(f"📁 {module} ({len(module_cases)} 个):")
            for case in module_cases:
                status = "✅" if case.get('is_active', True) else "❌"
                print(f"   {status} {case['case_id']}: {case['test_name']}")
        print()

    except Exception as e:
        print(f"❌ 查询数据库失败: {e}")


def main():
    """主函数"""
    import argparse

    parser = argparse.ArgumentParser(description="CSV测试用例转数据库工具")
    parser.add_argument(
        '--skip-duplicate-check',
        action='store_true',
        help='跳过重复ID检查'
    )
    parser.add_argument(
        '--update-existing',
        action='store_true',
        help='更新已存在的测试用例'
    )
    parser.add_argument(
        '--skip-existing',
        action='store_true',
        help='跳过已存在的测试用例，只插入新测试用例'
    )
    parser.add_argument(
        '--show-db',
        action='store_true',
        help='显示数据库中的测试用例'
    )

    args = parser.parse_args()

    if args.show_db:
        show_database_test_cases()
        return

    # 执行迁移
    success = migrate_csv_to_database(
        check_duplicates=not args.skip_duplicate_check,
        update_existing=args.update_existing,
        skip_existing=args.skip_existing
    )

    if success:
        print("\n💡 现在可以使用 'python scripts/run_database_tests.py' 从数据库执行测试")

    exit(0 if success else 1)


if __name__ == "__main__":
    main()