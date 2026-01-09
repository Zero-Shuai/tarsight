#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
从数据库执行测试
从Supabase数据库中读取测试用例并执行
"""

import os
import sys
import json
import tempfile
import time
from datetime import datetime
from typing import Dict, List, Any, Optional

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from utils.supabase_config_manager import SupabaseConfigManager
from utils.request_util import api_request
from config import config
from utils.test_execution_recorder import start_test_execution, finish_test_execution


class DatabaseTestExecutor:
    """数据库测试执行器"""

    def __init__(self):
        self.supabase = None
        self.config_manager = SupabaseConfigManager(project_id="db_test_execution")
        self.execution_id = None
        self.test_results = []

    def connect_to_database(self):
        """连接到数据库"""
        self.supabase = self.config_manager.get_supabase_client()
        return self.supabase is not None

    def load_test_cases_from_database(self, module_filter=None, case_id_filter=None, tags_filter=None) -> List[Dict[str, Any]]:
        """
        从数据库加载测试用例

        Args:
            module_filter: 模块过滤器
            case_id_filter: 测试用例ID过滤器
            tags_filter: 标签过滤器
        """
        if not self.supabase:
            print("❌ 未连接到数据库")
            return []

        try:
            # 构建查询参数
            params = {'is_active': 'eq.true'}

            # 应用过滤器
            if module_filter:
                params['module'] = f'eq.{module_filter}'

            # 执行查询
            response = self.supabase._make_request('GET', 'test_cases', params=params)
            cases = response.get('data', []) if response else []

            # 如果指定了case_id_filter，在客户端过滤
            if case_id_filter:
                if isinstance(case_id_filter, str):
                    case_id_filter = [case_id_filter]
                cases = [case for case in cases if case.get('case_id') in case_id_filter]

            # 标签过滤（需要在客户端处理，因为Supabase可能不支持数组查询）
            if tags_filter:
                if isinstance(tags_filter, str):
                    tags_filter = [tags_filter]

                filtered_cases = []
                for case in cases:
                    case_tags = json.loads(case.get('tags', '[]'))
                    if any(tag in case_tags for tag in tags_filter):
                        filtered_cases.append(case)
                cases = filtered_cases

            # 解析JSON字段（已经是Python对象的直接使用，字符串的才需要解析）
            for case in cases:
                request_body = case.get('request_body', {})
                headers = case.get('headers', {})
                variables = case.get('variables', {})
                tags = case.get('tags', [])

                # 如果是字符串，则解析为JSON
                if isinstance(request_body, str):
                    case['request_body'] = json.loads(request_body)
                else:
                    case['request_body'] = request_body or {}

                if isinstance(headers, str):
                    case['headers'] = json.loads(headers)
                else:
                    case['headers'] = headers or {}

                if isinstance(variables, str):
                    case['variables'] = json.loads(variables)
                else:
                    case['variables'] = variables or {}

                if isinstance(tags, str):
                    case['tags'] = json.loads(tags)
                else:
                    case['tags'] = tags or []

            return cases

        except Exception as e:
            print(f"❌ 从数据库加载测试用例失败: {e}")
            return []

    def execute_test_case(self, test_case: Dict[str, Any]) -> Dict[str, Any]:
        """执行单个测试用例"""
        start_time = time.time()

        result = {
            'case_id': test_case['case_id'],
            'test_name': test_case['test_name'],
            'module': test_case.get('module', 'unknown'),
            'status': 'failed',
            'error_message': None,
            'duration': 0,
            'request_info': {},
            'response_info': {}
        }

        try:
            print(f"\n🧪 执行测试: {test_case['case_id']} - {test_case['test_name']}")
            print(f"📁 模块: {test_case.get('module', 'unknown')}")

            # 构建请求URL
            url = test_case.get('url', '')
            if not url.startswith('http'):
                base_url = config.base_url.rstrip('/')
                url = url.lstrip('/')
                url = f"{base_url}/{url}"

            # 合并variables到request_body
            request_body = (test_case.get('request_body') or {}).copy()
            variables = test_case.get('variables') or {}
            if variables:
                request_body.update(variables)

            # 构建headers
            headers = config.headers.copy()
            case_headers = test_case.get('headers') or {}
            if case_headers:
                headers.update(case_headers)

            # 记录请求信息
            request_info = {
                'URL': url,
                'Method': test_case.get('method', 'GET'),
                'Headers': headers,
                'Body': request_body
            }
            result['request_info'] = request_info

            print(f"📡 请求: {test_case.get('method', 'GET')} {url}")
            if request_body:
                print(f"📦 请求体: {json.dumps(request_body, ensure_ascii=False)}")

            # 获取模块用于显示
            module = test_case.get('module', 'unknown')
            print(f"📁 模块: {module}")

            # 发送API请求
            resp = api_request(test_case.get('method', 'GET'), url, headers=headers, json_data=request_body)
            response_time = time.time() - start_time
            result['duration'] = response_time

            print(f"📊 响应状态: {resp.status_code}")
            print(f"⏱️  响应时间: {response_time:.2f}s")

            # 记录响应信息
            response_info = {
                'Status Code': resp.status_code,
                'Headers': dict(resp.headers),
                'Response Time': response_time
            }
            result['response_info'] = response_info

            # 验证状态码
            expected_status = test_case.get('expected_status', 200)
            if resp.status_code != expected_status:
                result['status'] = 'failed'
                result['error_message'] = f"状态码不匹配: 预期 {expected_status}, 实际 {resp.status_code}"
                print(f"❌ 状态码不匹配: 预期 {expected_status}, 实际 {resp.status_code}")
                return result

            # 验证响应结构
            if resp.status_code == 200:
                try:
                    data = resp.json()
                    response_info['Response Data'] = data

                    # 基础结构验证
                    if "success" not in data:
                        result['status'] = 'failed'
                        result['error_message'] = "响应缺少success字段"
                        print("❌ 响应缺少success字段")
                        return result

                    if "message" not in data:
                        result['status'] = 'failed'
                        result['error_message'] = "响应缺少message字段"
                        print("❌ 响应缺少message字段")
                        return result

                    # 检查API是否返回成功
                    if data.get("success") is not True:
                        result['status'] = 'failed'
                        result['error_message'] = f"API返回失败: {data.get('message', '未知错误')}"
                        print(f"❌ API返回失败: {data.get('message', '未知错误')}")
                        return result

                    print(f"✅ 测试通过: {data.get('message', '成功')}")

                except json.JSONDecodeError:
                    result['status'] = 'failed'
                    result['error_message'] = "响应不是有效的JSON格式"
                    print("❌ 响应不是有效的JSON格式")
                    return result

            # 测试成功
            result['status'] = 'passed'
            print(f"✅ 测试执行成功")

        except Exception as e:
            result['status'] = 'failed'
            result['error_message'] = str(e)
            print(f"❌ 测试执行异常: {e}")

        finally:
            result['duration'] = time.time() - start_time

        return result

    def execute_tests(self, test_cases: List[Dict[str, Any]], execution_name: str = None) -> bool:
        """批量执行测试"""
        if not test_cases:
            print("❌ 没有要执行的测试用例")
            return False

        print(f"🚀 开始执行测试: {execution_name or '数据库测试'}")
        print(f"📊 测试用例数量: {len(test_cases)}")
        print("=" * 60)

        # 开始执行记录
        self.execution_id = start_test_execution(execution_name or f"数据库测试 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        if self.execution_id:
            print(f"✅ 执行记录已创建: {self.execution_id[:8]}...")

        # 执行测试
        self.test_results = []
        passed_count = 0
        failed_count = 0

        for i, test_case in enumerate(test_cases, 1):
            print(f"\n[{i}/{len(test_cases)}] ", end="")

            result = self.execute_test_case(test_case)
            self.test_results.append(result)

            if result['status'] == 'passed':
                passed_count += 1
            else:
                failed_count += 1

        # 执行结果总结
        print("\n" + "=" * 60)
        print("📊 测试执行结果:")
        print(f"   ✅ 通过: {passed_count} 个")
        print(f"   ❌ 失败: {failed_count} 个")
        print(f"   📈 总计: {len(test_cases)} 个")
        print(f"   📊 通过率: {(passed_count/len(test_cases)*100):.1f}%")

        # 完成执行记录
        if self.execution_id:
            print(f"\n💾 正在保存测试结果到数据库...")
            success = finish_test_execution()
            if success:
                print("✅ 测试结果已保存到Supabase")
            else:
                print("⚠️ 保存测试结果到Supabase失败")

        return failed_count == 0

    def show_test_cases_summary(self, test_cases: List[Dict[str, Any]]):
        """显示测试用例摘要"""
        print(f"\n📋 测试用例摘要 (共 {len(test_cases)} 个)")
        print("-" * 60)

        # 按模块分组
        modules = {}
        for case in test_cases:
            module = case.get('module', 'unknown')
            if module not in modules:
                modules[module] = []
            modules[module].append(case)

        for module, module_cases in sorted(modules.items()):
            print(f"\n📁 {module} ({len(module_cases)} 个):")
            for case in module_cases:
                case_id = case['case_id']
                test_name = case['test_name']
                method = case['method']
                url = case['url'][:50] + '...' if len(case['url']) > 50 else case['url']
                print(f"   🧪 {case_id}: {test_name}")
                print(f"      📡 {method} {url}")


def main():
    """主函数"""
    import argparse

    parser = argparse.ArgumentParser(description="从数据库执行测试")
    parser.add_argument(
        '--module', '-m',
        help='指定模块名过滤器'
    )
    parser.add_argument(
        '--case-id', '-c',
        action='append',
        help='指定测试用例ID过滤器（可多次使用）'
    )
    parser.add_argument(
        '--tags', '-t',
        action='append',
        help='指定标签过滤器（可多次使用）'
    )
    parser.add_argument(
        '--name', '-n',
        help='指定测试执行名称'
    )
    parser.add_argument(
        '--summary', '-s',
        action='store_true',
        help='只显示测试用例摘要，不执行'
    )
    parser.add_argument(
        '--list-modules', '-l',
        action='store_true',
        help='列出所有可用模块'
    )

    args = parser.parse_args()

    # 创建执行器
    executor = DatabaseTestExecutor()

    # 连接数据库
    if not executor.connect_to_database():
        print("❌ 无法连接到数据库")
        exit(1)

    print("✅ 已连接到数据库")

    # 列出模块
    if args.list_modules:
        try:
            response = executor.supabase._make_request('GET', 'test_cases', params={'is_active': 'eq.true'})
            cases = response.get('data', []) if response else []
            modules = list(set(item.get('module', 'unknown') for item in cases if item.get('module')))
            print(f"\n📁 可用模块 ({len(modules)} 个):")
            for module in sorted(modules):
                module_cases = [case for case in cases if case.get('module') == module]
                count = len(module_cases)
                print(f"   {module}: {count} 个测试用例")
        except Exception as e:
            print(f"❌ 查询模块失败: {e}")
        exit(0)

    # 加载测试用例
    test_cases = executor.load_test_cases_from_database(
        module_filter=args.module,
        case_id_filter=args.case_id,
        tags_filter=args.tags
    )

    if not test_cases:
        print("❌ 没有找到符合条件的测试用例")
        print("💡 使用 --list-modules 查看可用模块")
        exit(1)

    # 显示摘要
    executor.show_test_cases_summary(test_cases)

    if args.summary:
        exit(0)

    # 确认执行
    print(f"\n🤔 确定要执行 {len(test_cases)} 个测试用例吗？(y/N)", end=" ")
    try:
        response = input().strip().lower()
        if response not in ['y', 'yes']:
            print("❌ 测试执行已取消")
            exit(0)
    except KeyboardInterrupt:
        print("\n❌ 测试执行已取消")
        exit(0)

    # 执行测试
    success = executor.execute_tests(test_cases, args.name)
    exit(0 if success else 1)


if __name__ == "__main__":
    main()