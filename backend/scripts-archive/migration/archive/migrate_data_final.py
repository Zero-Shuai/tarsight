#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
最终版数据迁移脚本
使用经过验证的 SSL 配置
"""

import os
import sys
import json
import requests
from dotenv import load_dotenv
from pathlib import Path

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from testcases.table_test_data import get_all_test_cases

# 加载环境变量
load_dotenv('.env.supabase')

class SupabaseDataMigrator:
    def __init__(self):
        self.url = os.getenv('SUPABASE_URL')
        self.key = os.getenv('SUPABASE_ANON_KEY')

        if not self.url or not self.key:
            raise ValueError("SUPABASE_URL 和 SUPABASE_ANON_KEY 环境变量必须设置")

        self.headers = {
            'apikey': self.key,
            'Authorization': f'Bearer {self.key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }

    def make_request(self, method, table, data=None, params=None):
        """发起 HTTP 请求"""
        url = f"{self.url}/rest/v1/{table}"

        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=self.headers, params=params, timeout=10)
            elif method.upper() == 'POST':
                response = requests.post(url, headers=self.headers, json=data, params=params, timeout=10)
            else:
                raise ValueError(f"不支持的 HTTP 方法: {method}")

            if response.status_code in [200, 201]:
                return {'success': True, 'data': response.json()}
            else:
                return {'success': False, 'error': f"HTTP {response.status_code}: {response.text}"}

        except Exception as e:
            return {'success': False, 'error': str(e)}

    def create_project(self, project_data):
        """创建项目"""
        return self.make_request('POST', 'projects', data=project_data)

    def create_module(self, module_data):
        """创建模块"""
        return self.make_request('POST', 'modules', data=module_data)

    def create_test_case(self, test_case_data):
        """创建测试用例"""
        return self.make_request('POST', 'test_cases', data=test_case_data)

    def get_projects(self):
        """获取所有项目"""
        return self.make_request('GET', 'projects')

    def migrate_data(self):
        """迁移数据"""
        print("🚀 开始数据迁移...")

        # 1. 获取现有项目
        print("📋 检查现有项目...")
        existing_projects = self.get_projects()

        if existing_projects['success']:
            projects = existing_projects['data']
            tarsight_project = next((p for p in projects if p['name'] == 'Tarsight'), None)

            if tarsight_project:
                project_id = tarsight_project['id']
                print(f"✅ 找到现有 Tarsight 项目: {project_id}")
            else:
                # 创建新项目
                print("🆕 创建 Tarsight 项目...")
                project_data = {
                    'name': 'Tarsight',
                    'description': 'Tarsight API 测试平台',
                    'base_url': 'https://t-stream-iq.tarsv.com'
                }

                result = self.create_project(project_data)
                if result['success']:
                    project_id = result['data'][0]['id']
                    print(f"✅ 项目创建成功: {project_id}")
                else:
                    print(f"❌ 项目创建失败: {result['error']}")
                    return False
        else:
            print(f"❌ 获取项目失败: {existing_projects['error']}")
            return False

        # 2. 获取 CSV 数据
        print("📊 读取测试用例数据...")
        csv_data = get_all_test_cases()
        if not csv_data:
            print("❌ 没有找到 CSV 测试数据")
            return False

        print(f"✅ 找到 {len(csv_data)} 个测试用例")

        # 3. 分析并创建模块
        modules = set(row.get('module', '').strip() for row in csv_data if row.get('module'))
        modules = [m for m in modules if m]  # 过滤空值
        print(f"📦 发现模块: {', '.join(modules)}")

        module_ids = {}
        for module_name in modules:
            print(f"📦 创建模块: {module_name}")
            module_data = {
                'project_id': project_id,
                'name': module_name,
                'description': f"{module_name} 模块的测试用例"
            }

            result = self.create_module(module_data)
            if result['success']:
                module_id = result['data'][0]['id']
                module_ids[module_name] = module_id
                print(f"✅ 模块创建成功: {module_name} -> {module_id}")
            else:
                print(f"❌ 模块创建失败: {module_name} - {result['error']}")

        # 4. 创建测试用例
        print("🧪 创建测试用例...")
        success_count = 0

        for i, csv_row in enumerate(csv_data):
            try:
                module_name = csv_row.get('module', '').strip()
                if not module_name or module_name not in module_ids:
                    print(f"⚠️ 跳过未知模块的测试用例: {csv_row.get('case_id')}")
                    continue

                # 解请求数据
                request_body = {}
                if csv_row.get('request_body'):
                    try:
                        body_str = csv_row['request_body'].strip()
                        if body_str:
                            request_body = json.loads(body_str)
                    except json.JSONDecodeError:
                        print(f"⚠️ JSON 解析失败，使用空请求体: {csv_row.get('case_id')}")

                headers = {}
                if csv_row.get('headers'):
                    try:
                        headers_str = csv_row['headers'].strip()
                        if headers_str:
                            headers = json.loads(headers_str)
                    except json.JSONDecodeError:
                        pass

                variables = {}
                if csv_row.get('variables'):
                    try:
                        variables_str = csv_row['variables'].strip()
                        if variables_str:
                            variables = json.loads(variables_str)
                    except json.JSONDecodeError:
                        pass

                tags = []
                if csv_row.get('tags'):
                    tags = [tag.strip() for tag in str(csv_row['tags']).split(',') if tag.strip()]

                expected_status = csv_row.get('expected_status', 200)
                try:
                    expected_status = int(expected_status)
                except (ValueError, TypeError):
                    expected_status = 200

                test_case_data = {
                    'project_id': project_id,
                    'module_id': module_ids[module_name],
                    'case_id': csv_row.get('case_id', f'CASE{i:03d}'),
                    'test_name': csv_row.get('test_name', f'测试用例 {i+1}'),
                    'description': csv_row.get('description', ''),
                    'method': csv_row.get('method', 'GET').upper(),
                    'url': csv_row.get('url', '/'),
                    'request_body': request_body if request_body else None,
                    'expected_status': expected_status,
                    'headers': headers if headers else None,
                    'variables': variables if variables else None,
                    'tags': tags if tags else None,
                    'is_active': True
                }

                result = self.create_test_case(test_case_data)
                if result['success']:
                    success_count += 1
                    print(f"✅ 测试用例创建成功: {module_name} - {csv_row.get('case_id')}")
                else:
                    print(f"❌ 测试用例创建失败: {csv_row.get('case_id')} - {result['error']}")

            except Exception as e:
                print(f"❌ 处理测试用例异常 {csv_row.get('case_id', 'unknown')}: {e}")

        # 5. 总结
        print("\n" + "=" * 50)
        print("📊 迁移完成统计:")
        print(f"📁 项目: 1 个 (Tarsight)")
        print(f"📦 模块: {len(module_ids)} 个")
        print(f"🧪 测试用例: {success_count}/{len(csv_data)} 个")

        if success_count == len(csv_data):
            print("🎉 所有测试用例迁移成功！")
        else:
            print(f"⚠️ 部分测试用例迁移失败 ({len(csv_data) - success_count} 个)")

        print("\n💡 下一步:")
        print("  运行测试: python run.py --mode database")

        return success_count > 0

if __name__ == "__main__":
    print("🔧 Tarsight 数据迁移工具")
    print("=" * 50)

    try:
        migrator = SupabaseDataMigrator()
        success = migrator.migrate_data()

        if success:
            print("\n✅ 数据迁移完成！")
        else:
            print("\n❌ 数据迁移失败！")

    except Exception as e:
        print(f"\n❌ 迁移过程发生错误: {e}")
        import traceback
        traceback.print_exc()