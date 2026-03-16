#!/usr/bin/env python3
"""
验证 Migration 002 是否成功执行
"""
import sys
from pathlib import Path
import re

BACKEND_ROOT = Path(__file__).resolve().parent.parent

# Add backend root to path so archived scripts can reuse shared utils.
sys.path.insert(0, str(BACKEND_ROOT))

from utils.supabase_client import get_supabase_client
from utils.env_config import get_env_config

CASE_ID_NEW_FORMAT = re.compile(r"^[A-Za-z0-9]+-[A-Za-z0-9]+-\d{3}$")


def format_result_error(result):
    """Format Supabase client errors so connectivity failures stay visible."""
    if not result:
        return "Unknown error"

    details = result.get('details') or {}
    return (
        details.get('exception')
        or result.get('message')
        or result.get('error')
        or "Unknown error"
    )


def print_section(title):
    """打印分节标题"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def check_table_structure():
    """检查表结构"""
    print_section("1. 检查表结构")

    env_config = get_env_config()
    client = get_supabase_client(access_token=env_config.supabase_service_role_key)

    # 使用 PostgreSQL 系统表查询字段信息
    # 注意：Supabase REST API 不直接支持查询 information_schema
    # 我们需要通过 SQL 查询

    checks = {
        'projects': ['project_code'],
        'modules': ['module_code'],
        'test_cases': ['case_id']
    }

    results = {}

    for table_name, columns in checks.items():
        print(f"\n📋 表: {table_name}")

        for column_name in columns:
            # 我们需要查询实际的表数据来推断字段是否存在
            try:
                if table_name == 'projects':
                    result = client._make_request(
                        'GET',
                        table_name,
                        params={
                            'select': f'id,name,{column_name}',
                            'limit': '1'
                        }
                    )
                elif table_name == 'modules':
                    result = client._make_request(
                        'GET',
                        table_name,
                        params={
                            'select': f'id,name,{column_name}',
                            'limit': '1'
                        }
                    )
                elif table_name == 'test_cases':
                    result = client._make_request(
                        'GET',
                        table_name,
                        params={
                            'select': f'id,{column_name}',
                            'limit': '1'
                        }
                    )

                # 如果请求成功，说明字段存在
                if 'error' in result and result['error']:
                    if 'column' in result.get('message', '').lower():
                        print(f"  ❌ {column_name}: 不存在")
                        results[f"{table_name}.{column_name}"] = False
                    else:
                        print(f"  ⚠️  {column_name}: 查询出错 - {format_result_error(result)}")
                        results[f"{table_name}.{column_name}"] = None
                else:
                    print(f"  ✅ {column_name}: 存在")
                    results[f"{table_name}.{column_name}"] = True

            except Exception as e:
                print(f"  ❌ {column_name}: 查询失败 - {e}")
                results[f"{table_name}.{column_name}"] = False

    return results

def check_project_data():
    """检查项目数据"""
    print_section("2. 检查项目数据")

    env_config = get_env_config()
    client = get_supabase_client(access_token=env_config.supabase_service_role_key)

    try:
        result = client._make_request(
            'GET',
            'projects',
            params={
                'select': 'id,name,project_code,base_url,description',
                'limit': '5'
            }
        )

        if result.get('error'):
            print(f"❌ 查询项目数据失败: {format_result_error(result)}")
            return None

        if result.get('data'):
            print(f"\n找到 {len(result['data'])} 个项目:\n")

            for project in result['data']:
                print(f"📌 项目: {project.get('name', 'N/A')}")
                print(f"   ID: {project.get('id', 'N/A')}")
                print(f"   编号: {project.get('project_code', '❌ 未设置')}")
                print(f"   URL: {project.get('base_url', 'N/A')}")
                print()

            # 检查是否设置了 project_code
            has_code = any(p.get('project_code') for p in result['data'])
            if has_code:
                print("✅ 部分项目已设置 project_code")
            else:
                print("⚠️  所有项目都未设置 project_code（需要手动设置）")

            return True
        else:
            print("❌ 没有找到项目数据")
            return False

    except Exception as e:
        print(f"❌ 查询项目数据失败: {e}")
        return False

def check_module_data():
    """检查模块数据"""
    print_section("3. 检查模块数据")

    env_config = get_env_config()
    client = get_supabase_client(access_token=env_config.supabase_service_role_key)

    try:
        result = client._make_request(
            'GET',
            'modules',
            params={
                'select': 'id,name,module_code,project_id',
                'limit': '10'
            }
        )

        if result.get('error'):
            print(f"❌ 查询模块数据失败: {format_result_error(result)}")
            return None

        if result.get('data'):
            print(f"\n找到 {len(result['data'])} 个模块:\n")

            for module in result['data'][:5]:  # 只显示前5个
                print(f"📌 模块: {module.get('name', 'N/A')}")
                print(f"   ID: {module.get('id', 'N/A')}")
                print(f"   编号: {module.get('module_code', '❌ 未设置')}")
                print(f"   项目: {module.get('project_id', 'N/A')}")
                print()

            if len(result['data']) > 5:
                print(f"... 还有 {len(result['data']) - 5} 个模块\n")

            # 检查是否设置了 module_code
            has_code = any(m.get('module_code') for m in result['data'])
            if has_code:
                print("✅ 部分模块已设置 module_code")
            else:
                print("⚠️  所有模块都未设置 module_code（需要手动设置）")

            return True
        else:
            print("❌ 没有找到模块数据")
            return False

    except Exception as e:
        print(f"❌ 查询模块数据失败: {e}")
        return False

def check_case_id_format():
    """检查测试用例 ID 格式"""
    print_section("4. 检查测试用例 ID 格式")

    env_config = get_env_config()
    client = get_supabase_client(access_token=env_config.supabase_service_role_key)

    try:
        result = client._make_request(
            'GET',
            'test_cases',
            params={
                'select': 'id,case_id',
                'limit': '10'
            }
        )

        if result.get('error'):
            print(f"❌ 查询测试用例失败: {format_result_error(result)}")
            return None

        if result.get('data'):
            print(f"\n找到 {len(result['data'])} 个测试用例:\n")

            new_format_count = 0
            old_format_count = 0

            for case in result['data'][:5]:
                case_id = case.get('case_id', 'N/A')
                is_new_format = bool(case_id and CASE_ID_NEW_FORMAT.match(case_id))

                if is_new_format:
                    new_format_count += 1
                    print(f"✅ {case_id} (新格式)")
                else:
                    old_format_count += 1
                    print(f"📝 {case_id} (旧格式)")

            print(f"\n📊 格式统计:")
            print(f"   新格式 ({'{项目编号}-{模块编号}-001'}): {new_format_count}")
            print(f"   旧格式 (TS001, API001...): {old_format_count}")

            if new_format_count > 0:
                print("\n✅ 已有新格式用例")
            else:
                print("\n⚠️  还未迁移到新格式（需要执行 Migration 003）")

            return True
        else:
            print("❌ 没有找到测试用例")
            return False

    except Exception as e:
        print(f"❌ 查询测试用例失败: {e}")
        return False

def print_summary(structure_results, project_ok, module_ok, case_ok):
    """打印验证总结"""
    print_section("验证总结")

    print("\n📊 数据库结构:")
    for check, result in structure_results.items():
        if result is True:
            print(f"  ✅ {check}")
        elif result is False:
            print(f"  ❌ {check} - 缺失")
        else:
            print(f"  ⚠️  {check} - 无法确定")

    print(f"\n📊 数据完整性:")
    print(f"  {'✅' if project_ok is True else '❌' if project_ok is False else '⚠️ '} 项目数据可访问")
    print(f"  {'✅' if module_ok is True else '❌' if module_ok is False else '⚠️ '} 模块数据可访问")
    print(f"  {'✅' if case_ok is True else '❌' if case_ok is False else '⚠️ '} 测试用例数据可访问")

    # 判断 migration 是否成功
    all_structures_ok = all(r is True for r in structure_results.values())
    has_unknown_structure = any(r is None for r in structure_results.values())
    has_access_unknown = any(result is None for result in [project_ok, module_ok, case_ok])

    print(f"\n🎯 Migration 002 状态:")

    if all_structures_ok:
        print("  ✅ Migration 002 执行成功！")
        print("\n📝 下一步操作:")
        print("  1. 访问项目管理页面 (http://localhost:3000/projects)")
        print("  2. 设置项目编号为 PRJ001")
        print("  3. 访问模块管理页面 (http://localhost:3000/modules)")
        print("  4. 为每个模块设置编号 (MOD001, MOD002...)")
        print("  5. 执行 Migration 003 迁移现有测试用例数据")
    elif has_unknown_structure or has_access_unknown:
        print("  ⚠️  当前无法确认 Migration 002 状态")
        print("\n📝 建议先处理以下问题:")
        print("  1. 检查本机到 Supabase 的网络/SSL 连通性")
        print("  2. 确认 .env 中的 Supabase 配置有效")
        print("  3. 网络恢复后重新运行此验证脚本")
    else:
        missing = [k for k, v in structure_results.items() if v is False]
        print(f"  ❌ Migration 002 未完全执行")
        print(f"\n  缺失字段: {', '.join(missing)}")
        print(f"\n📝 需要执行的操作:")
        print(f"  1. 访问: https://supabase.com/dashboard/project/gtdzmawwckvpzbbsgssv/sql")
        print(f"  2. 执行 docs/guides/APPLY_MIGRATION_002.md 中的 SQL")
        print(f"  3. 重新运行此验证脚本")

    print("\n" + "=" * 60)

def main():
    """主函数"""
    print("\n🔍 Migration 002 验证工具")
    print("   检查项目编号和模块编号字段是否已添加\n")

    try:
        # 执行各项检查
        structure_results = check_table_structure()
        project_ok = check_project_data()
        module_ok = check_module_data()
        case_ok = check_case_id_format()

        # 打印总结
        print_summary(structure_results, project_ok, module_ok, case_ok)

    except KeyboardInterrupt:
        print("\n\n⚠️  验证被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ 验证过程出错: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
