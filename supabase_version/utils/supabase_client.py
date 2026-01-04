#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Supabase 客户��工具
用于查询和管理 Supabase 中的测试数据
"""

import logging
import requests
from typing import Dict, List, Any, Optional
from utils.env_config import get_env_config

logger = logging.getLogger(__name__)


class SupabaseClient:
    """Supabase 客户端"""

    def __init__(self, access_token: Optional[str] = None, use_service_role: bool = True):
        """
        初始化客户端

        Args:
            access_token: 用户访问令牌（可选，用于 RLS）
            use_service_role: 是否使用 service_role key（默认True，绕过 RLS）
        """
        env_config = get_env_config()

        self.supabase_url = env_config.supabase_url
        self.supabase_key = env_config.supabase_anon_key
        self.service_key = env_config.supabase_service_role_key

        # 优先使用 service_role key（绕过 RLS），其次使用提供的 token，最后使用 anon_key
        if use_service_role and self.service_key:
            token = self.service_key
            logger.info(f"✅ 使用 service_role key（绕过 RLS）: {token[:20]}...")
        elif access_token:
            token = access_token
            logger.debug("使用用户 access_token")
        else:
            token = self.supabase_key
            logger.debug("使用 anon key")

        # 对于 service_role，使用 service_key 作为 apikey
        apikey = self.service_key if (use_service_role and self.service_key) else self.supabase_key

        self.headers = {
            'apikey': apikey,
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

        # 创建会话池以复用HTTP连接
        self.session = requests.Session()
        self.session.headers.update(self.headers)

    def _make_request(self, method: str, table: str, data: Optional[Dict] = None,
                     params: Optional[Dict] = None) -> Dict:
        """
        发起 HTTP 请求的通用方法

        Args:
            method: HTTP 方法 (GET, POST, PATCH, DELETE)
            table: 表名
            data: 请求体数据 (用于 POST, PATCH)
            params: 查询参数

        Returns:
            Dict: {'data': [...]} 或 {'data': None, 'error': '...', 'details': {...}}
        """
        url = f"{self.supabase_url}/rest/v1/{table}"

        try:
            if method.upper() == 'GET':
                response = self.session.get(url, params=params, timeout=10)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, params=params, timeout=10)
            elif method.upper() == 'PATCH':
                response = self.session.patch(url, json=data, params=params, timeout=10)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, params=params, timeout=10)
            else:
                raise ValueError(f"不支持的 HTTP 方法: {method}")

            # 检查 HTTP 状态码
            if response.status_code >= 400:
                error_info = {
                    'status_code': response.status_code,
                    'url': url,
                    'method': method,
                    'message': response.text or 'Unknown error'
                }
                logger.error(f"Supabase API 错误: {error_info}")
                return {
                    'data': None,
                    'error': f"HTTP {response.status_code}: {response.text[:200]}",
                    'details': error_info
                }

            if response.text:
                return {'data': response.json()}
            else:
                return {'data': []}

        except Exception as e:
            logger.error(f"Supabase API 请求失败: {e}")
            return {
                'data': None,
                'error': str(e),
                'details': {'exception': str(e)}
            }

    def get_projects(self) -> List[Dict[str, Any]]:
        """获取所有项目"""
        try:
            response = self.session.get(
                f"{self.supabase_url}/rest/v1/projects",
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"❌ 获取项目失败: {e}")
            return []

    def get_tarsight_project(self) -> Optional[Dict[str, Any]]:
        """获取 Tarsight 项目"""
        projects = self.get_projects()
        return next((p for p in projects if p['name'] == 'Tarsight'), None)

    def get_test_cases_by_module(self, project_id: str) -> Dict[str, int]:
        """
        获取按模块分组的测试用例数量
        优化版本：使用2个查询代替N+1个查询，在内存中高效统计
        """
        try:
            # 第1个查询：获取所有模块
            modules_response = self.session.get(
                f"{self.supabase_url}/rest/v1/modules",
                params={
                    'project_id': f'eq.{project_id}',
                    'select': 'id,name'
                },
                timeout=10
            )
            modules_response.raise_for_status()
            modules = modules_response.json()

            if not modules:
                return {}

            # 第2个查询：获取所有测试用例（只查询module_id字段）
            all_test_cases_response = self.session.get(
                f"{self.supabase_url}/rest/v1/test_cases",
                params={
                    'project_id': f'eq.{project_id}',
                    'select': 'module_id'
                },
                timeout=10
            )
            all_test_cases_response.raise_for_status()
            all_test_cases = all_test_cases_response.json()

            # 创建模块ID到名称的映射（O(1)查找）
            module_id_to_name = {m['id']: m['name'] for m in modules}

            # 在内存中统计每个模块的测试用例数量
            module_stats = {name: 0 for name in module_id_to_name.values()}

            # 高效统计：O(n)时间复杂度
            for test_case in all_test_cases:
                module_id = test_case.get('module_id')
                if module_id in module_id_to_name:
                    module_name = module_id_to_name[module_id]
                    module_stats[module_name] += 1

            return module_stats

        except Exception as e:
            logger.error(f"❌ 获取测试用例失败: {e}")
            return {}

    def get_test_cases_by_module_names(self, project_id: str, modules: List[str]) -> List[Dict[str, Any]]:
        """获取指定模块的测试用例"""
        try:
            # 构建 IN 查询
            module_filter = ','.join([f'"{module}"' for module in modules])

            response = self.session.get(
                f"{self.supabase_url}/rest/v1/test_cases",
                params={
                    'project_id': f'eq.{project_id}',
                    'module': f'in.({module_filter})',
                    'select': '*'
                },
                headers=self.headers,
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"❌ 获取测试用例失败: {e}")
            return []

    def create_test_execution(self, project_id: str, execution_name: str) -> Optional[str]:
        """创建测试执行记录"""
        try:
            execution_data = {
                'project_id': project_id,
                'execution_name': execution_name,
                'status': 'running',
                'total_tests': 0,
                'passed_tests': 0,
                'failed_tests': 0,
                'skipped_tests': 0
            }

            response = self.session.post(
                f"{self.supabase_url}/rest/v1/test_executions",
                headers={
                    **self.headers,
                    'Prefer': 'return=representation'
                },
                json=execution_data,
                timeout=10
            )
            response.raise_for_status()
            execution = response.json()[0]
            return execution['id']
        except Exception as e:
            logger.error(f"❌ 创建执行记录失败: {e}")
            return None

    def import_json_results(self, execution_id: str, json_file_path: str) -> bool:
        """从 JSON 文件导入测试结果到 Supabase"""
        try:
            import json

            # 读取 JSON 文件
            with open(json_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            test_results = data.get('test_results', [])
            if not test_results:
                logger.warning("⚠️ JSON 文件中没有测试结果")
                return False

            logger.info(f"📊 开始导入 {len(test_results)} 个测试结果...")

            # 转换并插入测试结果
            db_results = []
            for result in test_results:
                # 获取测试用例 ID
                case_id = result.get("test_case_id", "")
                test_case_response = self.session.get(
                    f"{self.supabase_url}/rest/v1/test_cases",
                    params={
                        'case_id': f'eq.{case_id}',
                        'select': 'id'
                    },
                    headers=self.headers,
                    timeout=10
                )

                test_case_db_id = None
                if test_case_response.status_code == 200:
                    test_cases = test_case_response.json()
                    if test_cases:
                        test_case_db_id = test_cases[0]['id']

                db_result = {
                    'execution_id': execution_id,
                    'test_case_id': test_case_db_id,
                    'status': result.get('status', 'unknown'),
                    'duration': result.get('duration', 0.0),
                    'error_message': result.get('error_message'),
                    'request_info': result.get('request_info', {}),
                    'response_info': result.get('response_info', {})
                }
                db_results.append(db_result)

            # 分批插入测试结果
            batch_size = 50
            for i in range(0, len(db_results), batch_size):
                batch = db_results[i:i + batch_size]

                response = self.session.post(
                    f"{self.supabase_url}/rest/v1/test_results",
                    headers={
                        **self.headers,
                        'Prefer': 'return=minimal'
                    },
                    json=batch,
                    timeout=30
                )

                if response.status_code not in [200, 201, 204]:
                    logger.warning(f"⚠️ 批量插入失败: {response.status_code}")
                    return False

            # 计算统计信息
            stats = {
                'total': len(test_results),
                'passed': len([r for r in test_results if r.get('status') == 'passed']),
                'failed': len([r for r in test_results if r.get('status') == 'failed']),
                'skipped': len([r for r in test_results if r.get('status') == 'skipped']),
                'duration': sum([r.get('duration', 0.0) for r in test_results])
            }

            # 更新执行记录
            from datetime import datetime
            update_data = {
                'status': 'completed',
                'total_tests': stats['total'],
                'passed_tests': stats['passed'],
                'failed_tests': stats['failed'],
                'skipped_tests': stats['skipped'],
                'total_duration': stats.get('duration', 0.0),
                'completed_at': datetime.now().isoformat()
            }

            response = self.session.patch(
                f"{self.supabase_url}/rest/v1/test_executions",
                params={'id': f'eq.{execution_id}'},
                headers=self.headers,
                json=update_data,
                timeout=10
            )

            if response.status_code in [200, 204]:
                logger.info(f"✅ 测试结果导入成功: {stats['total']} 个测试, 成功 {stats['passed']} 个")
                return True
            else:
                logger.error(f"❌ 更新执行记录失败: {response.status_code}")
                return False

        except Exception as e:
            logger.error(f"❌ 导入 JSON 结果失败: {e}")
            return False

    def execute_sql(self, sql: str) -> Dict[str, Any]:
        """
        执行原始 SQL 语句（通过 RPC 或使用 Supabase SQL API）

        注意：此方法需要 Supabase 项目启用 SQL Editor API 或使用 RPC

        Args:
            sql: SQL 查询语句

        Returns:
            执行结果
        """
        try:
            # Supabase 使用 PostgreSQL RPC 端点执行 SQL
            # 首先需要在 Supabase 中创建一个 SQL 函数来执行 SQL
            # 这里我们使用一个简化的方法：通过 /rest/v1/rpc/exec_sql

            response = self.session.post(
                f"{self.supabase_url}/rest/v1/rpc/exec_sql",
                json={"sql": sql},
                headers=self.headers,
                timeout=30
            )

            if response.status_code == 200:
                return {'data': response.json(), 'error': None}
            else:
                error_detail = response.text
                logger.error(f"❌ 执行 SQL 失败: {response.status_code} - {error_detail}")
                return {
                    'data': None,
                    'error': f"HTTP {response.status_code}",
                    'details': error_detail
                }

        except Exception as e:
            logger.error(f"❌ 执行 SQL 异常: {str(e)}")
            return {
                'data': None,
                'error': str(e)
            }


    def update_execution_status(self, execution_id: str, json_file_path: str, status: str = 'completed') -> bool:
        """
        根据JSON文件更新执行记录的状态和统计信息

        Args:
            execution_id: 执行记录ID
            json_file_path: JSON结果文件路径
            status: 执行状态 ('completed', 'failed', 'cancelled')

        Returns:
            bool: 是否更新成功
        """
        try:
            import json
            from datetime import datetime

            # 读取JSON文件
            with open(json_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            test_results = data.get('test_results', [])

            # 计算统计信息
            stats = {
                'total': len(test_results),
                'passed': len([r for r in test_results if r.get('status') == 'passed']),
                'failed': len([r for r in test_results if r.get('status') == 'failed']),
                'skipped': len([r for r in test_results if r.get('status') == 'skipped']),
                'duration': sum([r.get('duration', 0.0) for r in test_results])
            }

            # 更新执行记录
            update_data = {
                'status': status,
                'total_tests': stats['total'],
                'passed_tests': stats['passed'],
                'failed_tests': stats['failed'],
                'skipped_tests': stats['skipped'],
                'total_duration': stats.get('duration', 0.0),
                'completed_at': datetime.now().isoformat()
            }

            response = self.session.patch(
                f"{self.supabase_url}/rest/v1/test_executions",
                params={'id': f'eq.{execution_id}'},
                headers=self.headers,
                json=update_data,
                timeout=10
            )

            if response.status_code not in [200, 204]:
                logger.warning(f"⚠️ 更新执行记录失败: {response.status_code}")
                return False

            logger.info(f"✅ 执行记录已更新: {stats}")
            return True

        except Exception as e:
            logger.error(f"❌ 更新执行记录时出错: {e}")
            return False


def get_supabase_client(access_token: Optional[str] = None) -> SupabaseClient:
    """
    获取 Supabase 客户端实例

    Args:
        access_token: 用户访问令牌（可选，用于 RLS）

    Returns:
        SupabaseClient 实例
    """
    return SupabaseClient(access_token)