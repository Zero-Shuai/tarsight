#!/usr/bin/env python3
"""
验证 Migration 003 是否成功执行
"""
import re
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent

# Add backend root to path so archived scripts can reuse shared utils.
sys.path.insert(0, str(BACKEND_ROOT))

from utils.supabase_client import get_supabase_client
from utils.env_config import get_env_config

CASE_ID_NEW_FORMAT = re.compile(r"^[A-Za-z][A-Za-z0-9]{0,19}-[A-Za-z][A-Za-z0-9]{0,19}-\d{3}$")


def format_result_error(result):
    """Format Supabase client errors so connectivity failures stay visible."""
    if not result:
        return "Unknown error"

    details = result.get("details") or {}
    return (
        details.get("exception")
        or result.get("message")
        or result.get("error")
        or "Unknown error"
    )


def is_missing_table_error(error_text):
    """Return True when PostgREST reports a table missing from schema cache."""
    return bool(error_text and "PGRST205" in error_text)


def print_section(title):
    """打印分节标题"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def get_client():
    """Create a shared Supabase client."""
    env_config = get_env_config()
    return get_supabase_client(access_token=env_config.supabase_service_role_key)


def fetch_table(client, table_name, select, limit="1000"):
    """Fetch rows from a table with consistent error handling."""
    result = client._make_request(
        "GET",
        table_name,
        params={
            "select": select,
            "limit": limit,
        },
    )
    if result.get("error"):
        return None, format_result_error(result)
    return result.get("data", []), None


def check_backups(client):
    """Check whether backup tables created by migration 003 are accessible."""
    print_section("1. 检查备份表")

    tables = [
        ("test_cases_backup_20260106", "id,case_id"),
        ("modules_backup_20260106", "id,module_code"),
        ("projects_backup_20260106", "id,project_code"),
    ]
    results = {}

    for table_name, select in tables:
        rows, error = fetch_table(client, table_name, select, limit="5")
        if error:
            if is_missing_table_error(error):
                print(f"❌ {table_name}: 表不存在，说明 Migration 003 备份步骤尚未执行")
                results[table_name] = False
            else:
                print(f"⚠️  {table_name}: {error}")
                results[table_name] = None
            continue
        if rows:
            print(f"✅ {table_name}: 可访问，样本数 {len(rows)}")
            results[table_name] = True
        else:
            print(f"⚠️  {table_name}: 可访问但为空")
            results[table_name] = False

    return results


def check_codes(client):
    """Check project/module codes after migration."""
    print_section("2. 检查项目和模块编号")

    projects, project_error = fetch_table(client, "projects", "id,name,project_code", limit="100")
    modules, module_error = fetch_table(client, "modules", "id,name,module_code,project_id", limit="200")

    if project_error:
        print(f"❌ 查询项目失败: {project_error}")
        return None
    if module_error:
        print(f"❌ 查询模块失败: {module_error}")
        return None

    project_ok = all(project.get("project_code") for project in projects)
    module_ok = all(module.get("module_code") for module in modules)

    print(f"项目数量: {len(projects)}")
    for project in projects[:5]:
        print(f"  - {project.get('name', 'N/A')}: {project.get('project_code', '❌ 未设置')}")

    print(f"\n模块数量: {len(modules)}")
    for module in modules[:5]:
        print(f"  - {module.get('name', 'N/A')}: {module.get('module_code', '❌ 未设置')}")

    print(f"\n{'✅' if project_ok else '❌'} 所有项目均已设置 project_code")
    print(f"{'✅' if module_ok else '❌'} 所有模块均已设置 module_code")

    return project_ok and module_ok


def check_case_ids(client):
    """Check whether test case IDs have been migrated to the new format."""
    print_section("3. 检查测试用例 ID 格式")

    cases, error = fetch_table(client, "test_cases", "id,case_id,project_id,module_id,created_at", limit="1000")
    if error:
        print(f"❌ 查询测试用例失败: {error}")
        return None

    total_cases = len(cases)
    migrated_cases = [case for case in cases if CASE_ID_NEW_FORMAT.match(case.get("case_id", ""))]
    legacy_cases = [case for case in cases if not CASE_ID_NEW_FORMAT.match(case.get("case_id", ""))]
    duplicate_case_ids = len({case["case_id"] for case in cases}) != total_cases

    print(f"总测试用例数: {total_cases}")
    print(f"新格式数量: {len(migrated_cases)}")
    print(f"旧格式数量: {len(legacy_cases)}")
    print(f"{'❌' if duplicate_case_ids else '✅'} case_id 唯一性检查")

    if legacy_cases:
        print("\n旧格式样本:")
        for case in legacy_cases[:10]:
            print(f"  - {case.get('case_id', 'N/A')}")
    else:
        print("\n✅ 所有测试用例都已迁移到新格式")

    return {
        "all_migrated": len(legacy_cases) == 0,
        "total_cases": total_cases,
        "legacy_count": len(legacy_cases),
        "duplicate_case_ids": duplicate_case_ids,
    }


def check_mapping_table(client):
    """Check whether the mapping table exists and contains migrated rows."""
    print_section("4. 检查映射表")

    backup_cases, backup_error = fetch_table(client, "test_cases_backup_20260106", "id,case_id", limit="1000")
    rows, error = fetch_table(client, "case_id_mapping", "old_case_id,new_case_id,migration_date", limit="1000")
    current_cases, current_error = fetch_table(client, "test_cases", "id,case_id", limit="1000")

    if backup_error:
        if is_missing_table_error(backup_error):
            print("❌ 备份表不存在，说明 Migration 003 尚未执行到备份步骤")
            return False
        print(f"⚠️  查询 test_cases_backup_20260106 失败: {backup_error}")
        return None
    if error:
        if is_missing_table_error(error):
            print("❌ case_id_mapping 不存在，说明 Migration 003 尚未执行到映射表步骤")
            return False
        print(f"⚠️  查询 case_id_mapping 失败: {error}")
        return None
    if current_error:
        print(f"⚠️  查询 test_cases 失败: {current_error}")
        return None

    backup_map = {row["id"]: row["case_id"] for row in backup_cases}
    current_map = {row["id"]: row["case_id"] for row in current_cases}
    expected_count = sum(
        1 for row_id, old_case_id in backup_map.items()
        if row_id in current_map and old_case_id != current_map[row_id]
    )

    mapping_count = len(rows)
    print(f"预期映射记录数: {expected_count}")
    print(f"映射记录数: {mapping_count}")

    for row in rows[:5]:
        print(f"  - {row.get('old_case_id')} -> {row.get('new_case_id')}")

    if mapping_count >= expected_count:
        print("✅ 映射表已写入迁移记录")
        return True

    print("⚠️  映射表记录数少于预期")
    return False


def print_summary(backup_results, code_ok, case_result, mapping_ok):
    """Print final migration summary."""
    print_section("验证总结")

    backup_accessible = all(value is True for value in backup_results.values())
    backup_unknown = any(value is None for value in backup_results.values())

    print(f"{'✅' if backup_accessible else '⚠️ ' if backup_unknown else '❌'} 备份表检查")
    print(f"{'✅' if code_ok is True else '⚠️ ' if code_ok is None else '❌'} 项目/模块编号检查")

    if isinstance(case_result, dict):
        case_ok = case_result["all_migrated"] and not case_result["duplicate_case_ids"]
        print(f"{'✅' if case_ok else '❌'} 测试用例 ID 检查")
    else:
        case_ok = False
        print(f"{'⚠️ ' if case_result is None else '❌'} 测试用例 ID 检查")

    print(f"{'✅' if mapping_ok is True else '⚠️ ' if mapping_ok is None else '❌'} 映射表检查")

    if backup_unknown or code_ok is None or case_result is None or mapping_ok is None:
        print("\n🎯 Migration 003 状态:")
        print("  ⚠️  当前无法完整确认 Migration 003 状态")
        print("  请先检查网络/Supabase 连通性后重试")
        return

    if backup_accessible and code_ok and case_ok and mapping_ok:
        print("\n🎯 Migration 003 状态:")
        print("  ✅ Migration 003 执行成功！")
        print("\n📝 下一步操作:")
        print("  1. 抽样检查前端/后端是否都能识别新的 case_id")
        print("  2. 若尚未执行约束迁移，继续评估 Migration 004/005")
        print("  3. 保留 backup 表与 case_id_mapping 以便回滚")
        return

    print("\n🎯 Migration 003 状态:")
    print("  ❌ Migration 003 未完全执行")
    if isinstance(case_result, dict):
        print(f"  - 仍有 {case_result['legacy_count']} 条旧格式 case_id")
        if case_result["duplicate_case_ids"]:
            print("  - 检测到重复 case_id")
    if backup_accessible is False:
        print("  - 备份表不存在")
    if mapping_ok is False:
        print("  - case_id_mapping 不存在或未按预期写入")


def main():
    """Main entrypoint."""
    print("\n🔍 Migration 003 验证工具")
    print("   检查备份表、编号字段、case_id 格式和映射表\n")

    try:
        client = get_client()
        backup_results = check_backups(client)
        code_ok = check_codes(client)
        case_result = check_case_ids(client)
        mapping_ok = check_mapping_table(client)
        print_summary(backup_results, code_ok, case_result, mapping_ok)
    except KeyboardInterrupt:
        print("\n\n⚠️  验证被用户中断")
        sys.exit(1)
    except Exception as exc:
        print(f"\n\n❌ 验证过程出错: {exc}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
