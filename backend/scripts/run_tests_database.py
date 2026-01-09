#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
数据库模式测试运行器
从 Supabase 数据库加载测试用例并执行测试
"""

import asyncio
import os
import sys
import argparse
from datetime import datetime
from typing import List, Dict, Optional, Any

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

import pytest
from supabase.client import get_supabase_client
from config.supabase_config_manager import get_supabase_config
from scripts.enhanced_html_reporter import EnhancedHTMLReporter
from utils.request_util import api_request


class DatabaseTestRunner:
    """数据库模式测试运行器"""

    def __init__(self, project_id: str, environment_name: Optional[str] = None,
                 module_filter: Optional[str] = None, tag_filter: Optional[str] = None):
        """
        初始化测试运行器

        Args:
            project_id: 项目ID
            environment_name: 环境名称
            module_filter: 模块过滤器
            tag_filter: 标签过滤器
        """
        self.project_id = project_id
        self.environment_name = environment_name
        self.module_filter = module_filter
        self.tag_filter = tag_filter

        self.supabase_client = get_supabase_client()
        self.config_manager = get_supabase_config(project_id)
        self.reporter = None

        # 测试统计
        self.stats = {
            'total': 0,
            'passed': 0,
            'failed': 0,
            'skipped': 0,
            'errors': []
        }

    async def run_tests(self) -> bool:
        """运行测试"""
        try:
            print("🚀 启动数据库模式API测试...")
            print(f"📋 项目ID: {self.project_id}")
            if self.environment_name:
                print(f"🌍 环境: {self.environment_name}")
            if self.module_filter:
                print(f"📦 模块过滤: {self.module_filter}")
            if self.tag_filter:
                print(f"🏷️ 标签过滤: {self.tag_filter}")

            # 1. 获取项目和环境信息
            project_info = await self._get_project_info()
            if not project_info:
                print("❌ 无法获取项目信息")
                return False

            environment_info = await self._get_environment_info()
            if environment_info:
                print(f"🌐 API基础URL: {environment_info['base_url']}")
                # 更新配置中的基础URL
                await self.config_manager.set("BASE_URL", environment_info['base_url'])

            # 2. 获取测试用例
            test_cases = await self._get_test_cases()
            if not test_cases:
                print("❌ 没有找到符合条件的测试用例")
                return False

            print(f"📊 找到 {len(test_cases)} 个测试用例")
            self.stats['total'] = len(test_cases)

            # 3. 初始化报告生成器
            self._init_reporter()

            # 4. 执行测试用例
            execution_id = await self._create_execution_record()
            print(f"🎯 测试执行ID: {execution_id}")

            results = await self._execute_test_cases(test_cases, execution_id)

            # 5. 更新执行记录
            await self._update_execution_record(execution_id, results)

            # 6. 生成报告
            await self._generate_report(results, project_info, environment_info)

            # 7. 打印结果
            self._print_results()

            return self.stats['failed'] == 0

        except Exception as e:
            print(f"❌ 测试执行过程中发生错误: {e}")
            import traceback
            traceback.print_exc()
            return False

    async def _get_project_info(self) -> Optional[Dict]:
        """获取项目信息"""
        try:
            return await self.supabase_client.get_project_by_id(self.project_id)
        except Exception as e:
            print(f"获取项目信息失败: {e}")
            return None

    async def _get_environment_info(self) -> Optional[Dict]:
        """获取环境信息"""
        try:
            environments = await self.supabase_client.get_environments(self.project_id)
            if not environments:
                return None

            if self.environment_name:
                # 查找指定环境
                for env in environments:
                    if env['name'] == self.environment_name:
                        return env
                print(f"⚠️ 未找到环境 '{self.environment_name}'，使用默认环境")
                self.environment_name = None

            # 查找默认环境
            for env in environments:
                if env.get('is_default'):
                    return env

            # 如果没有默认环境，返回第一个
            return environments[0]

        except Exception as e:
            print(f"获取环境信息失败: {e}")
            return None

    async def _get_test_cases(self) -> List[Dict]:
        """获取测试用例"""
        try:
            test_cases = []

            # 获取所有模块（如果需要模块过滤）
            if self.module_filter:
                modules = await self.supabase_client.get_modules(self.project_id)
                target_module_id = None
                for module in modules:
                    if module['name'] == self.module_filter:
                        target_module_id = module['id']
                        break

                if target_module_id:
                    test_cases = await self.supabase_client.get_test_cases(self.project_id, target_module_id)
                else:
                    print(f"⚠️ 未找到模块 '{self.module_filter}'")
            else:
                # 获取所有模块的测试用例
                modules = await self.supabase_client.get_modules(self.project_id)
                for module in modules:
                    module_cases = await self.supabase_client.get_test_cases(self.project_id, module['id'])
                    for case in module_cases:
                        case['module_name'] = module['name']
                    test_cases.extend(module_cases)

            # 标签过滤
            if self.tag_filter:
                filtered_cases = []
                for case in test_cases:
                    tags = case.get('tags', [])
                    if self.tag_filter in tags:
                        filtered_cases.append(case)
                test_cases = filtered_cases

            return test_cases

        except Exception as e:
            print(f"获取测试用例失败: {e}")
            return []

    def _init_reporter(self):
        """初始化报告生成器"""
        os.makedirs("reports", exist_ok=True)
        self.reporter = EnhancedHTMLReporter("reports/enhanced_api_report.html")

    async def _create_execution_record(self) -> str:
        """创建测试执行记录"""
        try:
            execution_data = {
                'project_id': self.project_id,
                'execution_name': f"数据库测试 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                'status': 'running',
                'total_tests': self.stats['total'],
                'passed_tests': 0,
                'failed_tests': 0,
                'skipped_tests': 0,
                'started_by': 'system'  # 可以从认证信息获取实际用户
            }

            result = await self.supabase_client.create_test_execution(execution_data)
            return result['id'] if result else None

        except Exception as e:
            print(f"创建执行记录失败: {e}")
            return None

    async def _execute_test_cases(self, test_cases: List[Dict], execution_id: str) -> List[Dict]:
        """执行测试用例"""
        results = []

        for i, test_case in enumerate(test_cases):
            print(f"\n🧪 执行测试用例 {i+1}/{len(test_cases)}:")
            print(f"   📦 模块: {test_case.get('module_name', 'Unknown')}")
            print(f"   🆔 ID: {test_case['case_id']}")
            print(f"   📝 名称: {test_case['test_name']}")
            print(f"   🌐 方法: {test_case['method']} {test_case['url']}")

            try:
                # 准备请求信息
                url = test_case['url']
                method = test_case['method']
                headers = await self.config_manager.headers()

                # 合并测试用例特定的头部
                case_headers = test_case.get('headers', {})
                if case_headers:
                    headers.update(case_headers)

                request_body = test_case.get('request_body')
                variables = test_case.get('variables', {})

                # 替换URL中的变量
                url = self._replace_variables(url, variables)

                # 替换请求体中的变量
                if request_body:
                    request_body = self._replace_variables_in_json(request_body, variables)

                # 发送API请求
                start_time = datetime.now()
                response = api_request(method, url, headers=headers, json_data=request_body)
                end_time = datetime.now()
                duration = (end_time - start_time).total_seconds()

                # 检查结果
                expected_status = test_case.get('expected_status', 200)
                success = response.status_code == expected_status

                if success:
                    self.stats['passed'] += 1
                    status = 'passed'
                    print(f"   ✅ 通过 ({response.status_code})")
                else:
                    self.stats['failed'] += 1
                    status = 'failed'
                    print(f"   ❌ 失败 ({response.status_code}, 期望 {expected_status})")

                # 构建结果信息
                result = {
                    'execution_id': execution_id,
                    'test_case_id': test_case['id'],
                    'status': status,
                    'duration': duration,
                    'error_message': None if success else f"状态码不匹配: {response.status_code} != {expected_status}",
                    'request_info': {
                        'URL': url,
                        'Method': method,
                        'Headers': headers,
                        'Body': request_body,
                        'Variables': variables
                    },
                    'response_info': {
                        'Status Code': response.status_code,
                        'Headers': dict(response.headers),
                        'Response Time': f"{duration:.3f}s"
                    }
                }

                # 尝试解析响应内容
                try:
                    response_json = response.json()
                    result['response_info']['Response Body'] = response_json
                except:
                    result['response_info']['Response Body'] = response.text[:500] + "..." if len(response.text) > 500 else response.text

                # 保存到数据库
                await self.supabase_client.create_test_result(result)
                results.append(result)

                # 添加到HTML报告
                self._add_to_report(test_case, result)

            except Exception as e:
                self.stats['failed'] += 1
                error_msg = f"测试执行异常: {str(e)}"
                print(f"   ❌ 异常: {error_msg}")
                self.stats['errors'].append(error_msg)

                # 记录错误结果
                result = {
                    'execution_id': execution_id,
                    'test_case_id': test_case['id'],
                    'status': 'error',
                    'duration': 0,
                    'error_message': error_msg,
                    'request_info': {
                        'URL': test_case['url'],
                        'Method': test_case['method'],
                        'Error': '执行异常'
                    },
                    'response_info': None
                }

                await self.supabase_client.create_test_result(result)
                results.append(result)

        return results

    def _replace_variables(self, text: str, variables: Dict) -> str:
        """替换字符串中的变量"""
        if not variables:
            return text

        for key, value in variables.items():
            placeholder = f"${{{key}}}"
            if placeholder in text:
                text = text.replace(placeholder, str(value))

        return text

    def _replace_variables_in_json(self, data: Any, variables: Dict) -> Any:
        """递归替换JSON中的变量"""
        if isinstance(data, str):
            return self._replace_variables(data, variables)
        elif isinstance(data, dict):
            return {k: self._replace_variables_in_json(v, variables) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._replace_variables_in_json(item, variables) for item in data]
        else:
            return data

    def _add_to_report(self, test_case: Dict, result: Dict):
        """添加到HTML报告"""
        if not self.reporter:
            return

        module_name = test_case.get('module_name', 'Unknown')
        case_id = test_case['case_id']
        test_name = test_case['test_name']
        full_test_name = f"[{module_name}] {case_id} - {test_name}"

        self.reporter.add_test_result(
            test_name=full_test_name,
            status=result['status'],
            duration=result['duration'],
            request_info=result['request_info'],
            response_info=result['response_info'],
            error_msg=result['error_msg']
        )

    async def _update_execution_record(self, execution_id: str, results: List[Dict]):
        """更新测试执行记录"""
        try:
            update_data = {
                'status': 'completed',
                'passed_tests': self.stats['passed'],
                'failed_tests': self.stats['failed'],
                'skipped_tests': self.stats['skipped'],
                'total_duration': sum(r['duration'] for r in results),
                'completed_at': datetime.now().isoformat()
            }

            await self.supabase_client.update_test_execution(execution_id, update_data)
            print(f"✅ 执行记录已更新: {execution_id}")

        except Exception as e:
            print(f"更新执行记录失败: {e}")

    async def _generate_report(self, results: List[Dict], project_info: Dict, environment_info: Optional[Dict]):
        """生成HTML报告"""
        try:
            if self.reporter:
                self.reporter.generate_html()
                print("✅ HTML报告生成完成: reports/enhanced_api_report.html")

                # 在macOS上自动打开报告
                if sys.platform == "darwin":
                    os.system("open reports/enhanced_api_report.html")
                    print("🌐 报告已在浏览器中打开")

        except Exception as e:
            print(f"生成HTML报告失败: {e}")

    def _print_results(self):
        """打印测试结果"""
        print("\n" + "=" * 60)
        print("📊 测试结果统计")
        print("=" * 60)
        print(f"🧪 总测试数: {self.stats['total']}")
        print(f"✅ 通过: {self.stats['passed']}")
        print(f"❌ 失败: {self.stats['failed']}")
        print(f"⏭️ 跳过: {self.stats['skipped']}")

        if self.stats['total'] > 0:
            success_rate = (self.stats['passed'] / self.stats['total']) * 100
            print(f"📈 成功率: {success_rate:.1f}%")

        if self.stats['errors']:
            print(f"\n❌ 错误数量: {len(self.stats['errors'])}")
            print("错误详情:")
            for error in self.stats['errors']:
                print(f"  - {error}")

        print("\n" + "=" * 60)

        if self.stats['failed'] == 0:
            print("🎉 所有测试通过!")
        else:
            print("⚠️ 有测试失败，请检查错误信息")


async def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='数据库模式API测试运行器')
    parser.add_argument('--project-id', required=True, help='Supabase项目ID')
    parser.add_argument('--environment', help='环境名称')
    parser.add_argument('--module', help='模块过滤器')
    parser.add_argument('--tag', help='标签过滤器')
    parser.add_argument('--list-projects', action='store_true', help='列出所有项目')
    parser.add_argument('--list-environments', action='store_true', help='列出项目环境')
    parser.add_argument('--list-modules', action='store_true', help='列出项目模块')

    args = parser.parse_args()

    # 初始化Supabase客户端
    try:
        supabase_client = get_supabase_client()
    except Exception as e:
        print(f"❌ 初始化Supabase客户端失败: {e}")
        print("请检查环境变量 SUPABASE_URL 和 SUPABASE_ANON_KEY")
        sys.exit(1)

    # 处理列出选项
    if args.list_projects:
        await list_projects(supabase_client)
        return

    if args.list_environments or args.list_modules:
        if not args.project_id:
            print("❌ 列出环境或模块需要指定项目ID")
            sys.exit(1)

        if args.list_environments:
            await list_environments(supabase_client, args.project_id)

        if args.list_modules:
            await list_modules(supabase_client, args.project_id)
        return

    # 运行测试
    runner = DatabaseTestRunner(
        project_id=args.project_id,
        environment_name=args.environment,
        module_filter=args.module,
        tag_filter=args.tag
    )

    success = await runner.run_tests()
    sys.exit(0 if success else 1)


async def list_projects(client):
    """列出所有项目"""
    try:
        # 这里需要实现获取所有项目的逻辑
        print("📋 可用项目:")
        print("  - 需要实现项目列表功能")
    except Exception as e:
        print(f"获取项目列表失败: {e}")


async def list_environments(client, project_id):
    """列出项目环境"""
    try:
        environments = await client.get_environments(project_id)
        print(f"🌍 项目 '{project_id}' 的环境:")
        if environments:
            for env in environments:
                default_flag = " (默认)" if env.get('is_default') else ""
                print(f"  - {env['name']}: {env['base_url']}{default_flag}")
        else:
            print("  - 暂无环境")
    except Exception as e:
        print(f"获取环境列表失败: {e}")


async def list_modules(client, project_id):
    """列出项目模块"""
    try:
        modules = await client.get_modules(project_id)
        print(f"📦 项目 '{project_id}' 的模块:")
        if modules:
            for module in modules:
                print(f"  - {module['name']}: {module.get('description', '无描述')}")
        else:
            print("  - 暂无模块")
    except Exception as e:
        print(f"获取模块列表失败: {e}")


if __name__ == "__main__":
    asyncio.run(main())