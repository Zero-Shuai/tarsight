#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
数据库模式快速生成增强HTML报告
从 Supabase 数据库加载测试用例并生成报告
"""

import asyncio
import os
import sys
import argparse
from datetime import datetime

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from supabase.client import get_supabase_client
from config.supabase_config_manager import get_supabase_config
from scripts.enhanced_html_reporter import EnhancedHTMLReporter
from utils.request_util import api_request


class DatabaseReportGenerator:
    """数据库模式报告生成器"""

    def __init__(self, project_id: str, execution_id: Optional[str] = None):
        """
        初始化报告生成器

        Args:
            project_id: 项目ID
            execution_id: 执行记录ID（可选，如果提供则基于历史执行生成报告）
        """
        self.project_id = project_id
        self.execution_id = execution_id

        self.supabase_client = get_supabase_client()
        self.config_manager = get_supabase_config(project_id)
        self.reporter = None

    async def generate_report(self) -> bool:
        """生成增强HTML报告"""
        try:
            print("🚀 生成数据库模式增强HTML报告...")

            # 1. 获取项目信息
            project_info = await self._get_project_info()
            if not project_info:
                print("❌ 无法获取项目信息")
                return False

            print(f"📋 项目: {project_info['name']}")

            # 2. 初始化报告生成器
            self._init_reporter()

            # 3. 获取测试数据
            if self.execution_id:
                # 基于历史执行生成报告
                success = await self._generate_report_from_execution()
            else:
                # 基于实时测试生成报告
                success = await self._generate_report_from_live_tests()

            return success

        except Exception as e:
            print(f"❌ 报告生成失败: {e}")
            import traceback
            traceback.print_exc()
            return False

    async def _get_project_info(self) -> Optional[dict]:
        """获取项目信息"""
        try:
            return await self.supabase_client.get_project_by_id(self.project_id)
        except Exception as e:
            print(f"获取项目信息失败: {e}")
            return None

    def _init_reporter(self):
        """初始化报告生成器"""
        os.makedirs("reports", exist_ok=True)
        self.reporter = EnhancedHTMLReporter("reports/enhanced_api_report.html")

    async def _generate_report_from_execution(self) -> bool:
        """基于历史执行记录生成报告"""
        try:
            print(f"📊 基于执行记录生成报告: {self.execution_id}")

            # 获取执行记录信息
            execution_info = await self._get_execution_info()
            if not execution_info:
                print("❌ 无法获取执行记录信息")
                return False

            print(f"🎯 执行名称: {execution_info['execution_name']}")
            print(f"📊 状态: {execution_info['status']}")
            print(f"🧪 测试数量: {execution_info['total_tests']}")
            print(f"✅ 通过: {execution_info['passed_tests']}")
            print(f"❌ 失败: {execution_info['failed_tests']}")

            # 获取测试结果
            test_results = await self._get_test_results(self.execution_id)
            if not test_results:
                print("⚠️ 没有找到测试结果")
                return False

            print(f"📝 找到 {len(test_results)} 个测试结果")

            # 为每个测试结果生成报告条目
            for result in test_results:
                await self._add_result_to_report(result)

            # 生成HTML报告
            self.reporter.generate_html()
            print("✅ 增强HTML报告生成完成!")
            print("💡 报告基于历史执行记录")

            # 在macOS上自动打开报告
            if sys.platform == "darwin":
                os.system("open reports/enhanced_api_report.html")
                print("🌐 报告已在浏览器中打开")

            return True

        except Exception as e:
            print(f"基于执行记录生成报告失败: {e}")
            return False

    async def _generate_report_from_live_tests(self) -> bool:
        """基于实时测试生成报告"""
        try:
            print("🧪 执行实时测试并生成报告...")

            # 获取项目环境
            environment_info = await self._get_default_environment()
            if environment_info:
                print(f"🌐 环境: {environment_info['name']}")
                print(f"🔗 URL: {environment_info['base_url']}")
                await self.config_manager.set("BASE_URL", environment_info['base_url'])

            # 获取测试用例
            test_cases = await self._get_all_test_cases()
            if not test_cases:
                print("❌ 没有找到测试用例")
                return False

            print(f"📊 找到 {len(test_cases)} 个测试用例")

            # 创建执行记录
            execution_data = {
                'project_id': self.project_id,
                'execution_name': f"实时测试报告 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                'status': 'running',
                'total_tests': len(test_cases)
            }

            execution_result = await self.supabase_client.create_test_execution(execution_data)
            execution_id = execution_result['id'] if execution_result else None

            # 执行测试
            results = []
            for i, test_case in enumerate(test_cases):
                print(f"\n🧪 执行测试 {i+1}/{len(test_cases)}: {test_case['test_name']}")

                try:
                    # 准备请求
                    url = test_case['url']
                    method = test_case['method']
                    headers = await self.config_manager.headers()

                    # 合并测试用例头部
                    case_headers = test_case.get('headers', {})
                    if case_headers:
                        headers.update(case_headers)

                    request_body = test_case.get('request_body')
                    variables = test_case.get('variables', {})

                    # 替换变量
                    url = self._replace_variables(url, variables)
                    if request_body:
                        request_body = self._replace_variables_in_json(request_body, variables)

                    # 发送请求
                    start_time = datetime.now()
                    response = api_request(method, url, headers=headers, json_data=request_body)
                    duration = (datetime.now() - start_time).total_seconds()

                    # 检查结果
                    expected_status = test_case.get('expected_status', 200)
                    success = response.status_code == expected_status

                    status = 'passed' if success else 'failed'
                    error_msg = None if success else f"状态码不匹配: {response.status_code} != {expected_status}"

                    print(f"   {'✅' if success else '❌'} {status} ({response.status_code})")

                    # 构建结果数据
                    result = {
                        'test_case': test_case,
                        'status': status,
                        'duration': duration,
                        'error_msg': error_msg,
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
                        result['response_info']['Response Body'] = response.text

                    # 保存结果到数据库
                    if execution_id:
                        await self._save_test_result(execution_id, test_case['id'], result)

                    # 添加到报告
                    await self._add_result_to_report(result)
                    results.append(result)

                except Exception as e:
                    print(f"   ❌ 异常: {str(e)}")
                    error_result = {
                        'test_case': test_case,
                        'status': 'error',
                        'duration': 0,
                        'error_msg': str(e),
                        'request_info': {'Error': '执行异常'},
                        'response_info': None
                    }

                    if execution_id:
                        await self._save_test_result(execution_id, test_case['id'], error_result)

                    await self._add_result_to_report(error_result)
                    results.append(error_result)

            # 更新执行记录
            if execution_id:
                await self._update_execution_record(execution_id, results)

            # 生成HTML报告
            self.reporter.generate_html()
            print("✅ 增强HTML报告生成完成!")
            print("💡 报告基于实时测试执行")

            # 在macOS上自动打开报告
            if sys.platform == "darwin":
                os.system("open reports/enhanced_api_report.html")
                print("🌐 报告已在浏览器中打开")

            return True

        except Exception as e:
            print(f"实时测试生成报告失败: {e}")
            return False

    async def _get_execution_info(self) -> Optional[dict]:
        """获取执行记录信息"""
        try:
            execution = await self.supabase_client.table('test_executions').select('*').eq('id', self.execution_id).execute()
            return execution.data[0] if execution.data else None
        except Exception as e:
            print(f"获取执行记录失败: {e}")
            return None

    async def _get_test_results(self, execution_id: str) -> list:
        """获取测试结果"""
        try:
            # 获取测试结果
            results = await self.supabase_client.get_test_results_by_execution(execution_id)

            # 获取测试用例详情
            enriched_results = []
            for result in results:
                test_case = await self.supabase_client.table('test_cases').select('*').eq('id', result['test_case_id']).execute()
                if test_case.data:
                    result['test_case'] = test_case.data[0]
                    enriched_results.append(result)

            return enriched_results
        except Exception as e:
            print(f"获取测试结果失败: {e}")
            return []

    async def _get_default_environment(self) -> Optional[dict]:
        """获取默认环境"""
        try:
            environments = await self.supabase_client.get_environments(self.project_id)
            for env in environments:
                if env.get('is_default'):
                    return env
            return environments[0] if environments else None
        except Exception as e:
            print(f"获取默认环境失败: {e}")
            return None

    async def _get_all_test_cases(self) -> list:
        """获取所有测试用例"""
        try:
            modules = await self.supabase_client.get_modules(self.project_id)
            all_cases = []

            for module in modules:
                module_cases = await self.supabase_client.get_test_cases(self.project_id, module['id'])
                for case in module_cases:
                    case['module_name'] = module['name']
                all_cases.extend(module_cases)

            return all_cases
        except Exception as e:
            print(f"获取测试用例失败: {e}")
            return []

    def _replace_variables(self, text: str, variables: dict) -> str:
        """替换字符串中的变量"""
        if not variables:
            return text

        for key, value in variables.items():
            placeholder = f"${{{key}}}"
            if placeholder in text:
                text = text.replace(placeholder, str(value))

        return text

    def _replace_variables_in_json(self, data: any, variables: dict) -> any:
        """递归替换JSON中的变量"""
        if isinstance(data, str):
            return self._replace_variables(data, variables)
        elif isinstance(data, dict):
            return {k: self._replace_variables_in_json(v, variables) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._replace_variables_in_json(item, variables) for item in data]
        else:
            return data

    async def _save_test_result(self, execution_id: str, test_case_id: str, result: dict):
        """保存测试结果到数据库"""
        try:
            result_data = {
                'execution_id': execution_id,
                'test_case_id': test_case_id,
                'status': result['status'],
                'duration': result['duration'],
                'error_message': result['error_msg'],
                'request_info': result['request_info'],
                'response_info': result['response_info']
            }
            await self.supabase_client.create_test_result(result_data)
        except Exception as e:
            print(f"保存测试结果失败: {e}")

    async def _update_execution_record(self, execution_id: str, results: list):
        """更新执行记录"""
        try:
            total = len(results)
            passed = sum(1 for r in results if r['status'] == 'passed')
            failed = sum(1 for r in results if r['status'] == 'failed')
            total_duration = sum(r['duration'] for r in results)

            update_data = {
                'status': 'completed',
                'total_tests': total,
                'passed_tests': passed,
                'failed_tests': failed,
                'total_duration': total_duration,
                'completed_at': datetime.now().isoformat()
            }

            await self.supabase_client.update_test_execution(execution_id, update_data)
        except Exception as e:
            print(f"更新执行记录失败: {e}")

    async def _add_result_to_report(self, result: dict):
        """添加结果到报告"""
        if not self.reporter:
            return

        test_case = result['test_case']
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


async def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='数据库模式快速生成增强HTML报告')
    parser.add_argument('--project-id', required=True, help='Supabase项目ID')
    parser.add_argument('--execution-id', help='基于指定执行记录生成报告')

    args = parser.parse_args()

    # 初始化Supabase客户端
    try:
        supabase_client = get_supabase_client()
    except Exception as e:
        print(f"❌ 初始化Supabase客户端失败: {e}")
        print("请检查环境变量 SUPABASE_URL 和 SUPABASE_ANON_KEY")
        sys.exit(1)

    # 生成报告
    generator = DatabaseReportGenerator(
        project_id=args.project_id,
        execution_id=args.execution_id
    )

    success = await generator.generate_report()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())