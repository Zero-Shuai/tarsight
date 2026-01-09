#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
快速数据迁移脚本
"""

import os
import sys
import json
import requests
from dotenv import load_dotenv

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from testcases.table_test_data import get_all_test_cases

# 加载环境变量
load_dotenv('.env.supabase')

def migrate_test_cases():
    """迁移测试用例"""
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_ANON_KEY')

    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }

    print("🚀 开始快速迁移...")

    # 获取现有项目
    response = requests.get(f"{url}/rest/v1/projects", headers=headers, timeout=10)
    if response.status_code != 200:
        print("❌ 获取项目失败")
        return False

    projects = response.json()
    tarsight_project = next((p for p in projects if p['name'] == 'Tarsight'), None)

    if not tarsight_project:
        print("❌ 未找到 Tarsight 项目")
        return False

    project_id = tarsight_project['id']
    print(f"✅ 找到项目: {project_id}")

    # 获取模块
    response = requests.get(f"{url}/rest/v1/modules", headers=headers, timeout=10)
    if response.status_code != 200:
        print("❌ 获取模块失败")
        return False

    modules = response.json()
    module_map = {m['name']: m['id'] for m in modules if m['project_id'] == project_id}
    print(f"✅ 找到模块: {list(module_map.keys())}")

    # 获取 CSV 数据
    csv_data = get_all_test_cases()
    print(f"📊 读取到 {len(csv_data)} 个测试用例")

    success_count = 0
    for i, test_case in enumerate(csv_data):
        try:
            module_name = test_case.get('module', '')
            if not module_name or module_name not in module_map:
                print(f"⚠️ 跳过未知模块: {test_case.get('case_id')} ({module_name})")
                continue

            test_case_data = {
                'project_id': project_id,
                'module_id': module_map[module_name],
                'case_id': test_case.get('case_id', f'CASE{i:03d}'),
                'test_name': test_case.get('test_name', f'测试用例 {i+1}'),
                'description': test_case.get('description', ''),
                'method': test_case.get('method', 'GET'),
                'url': test_case.get('url', '/'),
                'request_body': test_case.get('request_body', {}),
                'expected_status': test_case.get('expected_status', 200),
                'headers': test_case.get('headers', {}),
                'variables': test_case.get('variables', {}),
                'tags': test_case.get('tags', []),
                'is_active': True
            }

            response = requests.post(f"{url}/rest/v1/test_cases", headers=headers, json=test_case_data, timeout=10)

            if response.status_code in [200, 201]:
                success_count += 1
                print(f"✅ {success_count:2d}. {module_name} - {test_case.get('case_id')} - {test_case.get('test_name')}")
            else:
                print(f"❌ 创建失败 {test_case.get('case_id')}: {response.text}")

        except Exception as e:
            print(f"❌ 处理失败 {test_case.get('case_id')}: {e}")

    print(f"\n🎉 迁移完成: {success_count}/{len(csv_data)} 个测试用例")
    return success_count > 0

if __name__ == "__main__":
    print("🔧 Tarsight 快速迁移工具")
    print("=" * 40)

    try:
        success = migrate_test_cases()

        if success:
            print("\n✅ 数据迁移成功！")
            print("💡 下一步: python run.py --mode database")
        else:
            print("\n❌ 数据迁移失败！")

    except Exception as e:
        print(f"\n❌ 迁移错误: {e}")
        import traceback
        traceback.print_exc()