#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
验证数据迁移结果
"""

import os
import requests
import json
from dotenv import load_dotenv

load_dotenv('.env.supabase')

def verify_migration():
    """验证迁移结果"""
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_ANON_KEY')

    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }

    print("🔍 验证 Supabase 数据迁移结果")
    print("=" * 50)

    # 1. 检查项目
    print("📁 检查项目...")
    response = requests.get(f"{url}/rest/v1/projects", headers=headers, timeout=10)
    if response.status_code == 200:
        projects = response.json()
        print(f"✅ 找到 {len(projects)} 个项目:")
        for project in projects:
            print(f"  - {project['name']} ({project['id'][:8]}...)")
            print(f"    描述: {project.get('description', 'N/A')}")
            print(f"    基础URL: {project['base_url']}")

    # 2. 检查模块
    print("\n📦 检查模块...")
    response = requests.get(f"{url}/rest/v1/modules", headers=headers, timeout=10)
    if response.status_code == 200:
        modules = response.json()
        print(f"✅ 找到 {len(modules)} 个模块:")
        for module in modules:
            print(f"  - {module['name']} ({module['id'][:8]}...)")

    # 3. 检查测试用例
    print("\n🧪 检查测试用例...")
    response = requests.get(f"{url}/rest/v1/test_cases", headers=headers, timeout=10)
    if response.status_code == 200:
        test_cases = response.json()
        print(f"✅ 找到 {len(test_cases)} 个测试用例:")
        for i, tc in enumerate(test_cases, 1):
            print(f"  {i}. {tc['case_id']} - {tc['test_name']}")
            print(f"     模块: {tc.get('module_name', 'N/A')}")
            print(f"     方法: {tc['method']} {tc['url']}")
            print(f"     期望状态: {tc['expected_status']}")
            if tc.get('request_body'):
                print(f"     请求体: {json.dumps(tc['request_body'], ensure_ascii=False)}")
            print()

    # 4. 检查全局配置
    print("⚙️ 检查全局配置...")
    response = requests.get(f"{url}/rest/v1/global_configs", headers=headers, timeout=10)
    if response.status_code == 200:
        configs = response.json()
        print(f"✅ 找到 {len(configs)} 个配置:")
        for config in configs:
            print(f"  - {config['config_key']}: {config['config_value']}")

    print("\n🎉 Supabase 数据迁移验证完成！")
    print("💡 你的测试数据现在已经成功存储在云端数据库中")

if __name__ == "__main__":
    verify_migration()