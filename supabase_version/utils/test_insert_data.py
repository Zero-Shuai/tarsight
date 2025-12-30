#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
测试向 Supabase 插入数据
"""

import os
import requests
import json
from dotenv import load_dotenv

# 加载环境变量
load_dotenv('.env.supabase')

def test_insert_project():
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_ANON_KEY')

    if not url or not key:
        print("❌ 缺少环境变量")
        return False

    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }

    try:
        # 插入测试项目
        project_data = {
            'name': 'Tarsight Test Project',
            'description': '用于测试的 Tarsight 项目',
            'base_url': 'https://t-stream-iq.tarsv.com'
        }

        response = requests.post(
            f"{url}/rest/v1/projects",
            headers=headers,
            json=project_data,
            timeout=10
        )

        print(f"状态码: {response.status_code}")

        if response.status_code == 201:
            data = response.json()
            print(f"✅ 项目创建成功: {json.dumps(data, indent=2, ensure_ascii=False)}")
            return data[0]['id'] if data else None
        else:
            print(f"❌ 创建失败: {response.text}")
            return None

    except Exception as e:
        print(f"❌ 插入错误: {e}")
        return None

def test_get_projects():
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_ANON_KEY')

    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }

    try:
        response = requests.get(
            f"{url}/rest/v1/projects",
            headers=headers,
            timeout=10
        )

        print(f"状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"✅ 找到 {len(data)} 个项目:")
            for project in data:
                print(f"  - {project['name']} ({project['id']})")
            return data
        else:
            print(f"❌ 获取失败: {response.text}")
            return []

    except Exception as e:
        print(f"❌ 获取错误: {e}")
        return []

if __name__ == "__main__":
    print("🔧 测试 Supabase 数据插入")
    print("=" * 40)

    # 先获取现有项目
    print("📋 获取现有项目:")
    existing_projects = test_get_projects()

    if existing_projects:
        print(f"\n💡 已经有 {len(existing_projects)} 个项目，可以继续添加测试数据")

    print("\n🆕 尝试创建新项目:")
    project_id = test_insert_project()

    if project_id:
        print(f"\n✅ 测试成功！项目 ID: {project_id}")
        print("💡 现在可以继续迁移测试数据")
    else:
        print("\n❌ 项目创建失败，请检查权限和表结构")