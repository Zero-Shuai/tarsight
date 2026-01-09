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

        # 添加缓存支持
        self._project_cache = None
        self._project_cache_time = 0
        self._cache_ttl = 300  # 5分钟缓存

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
        """获取 Tarsight 项目（带缓存）"""
        import time

        # 检查缓存是否有效
        if self._project_cache and (time.time() - self._project_cache_time) < self._cache_ttl:
            return self._project_cache

        # 缓存失效，重新查询
        projects = self.get_projects()
        project = next((p for p in projects if p['name'] == 'Tarsight'), None)

        # 更新缓存
        self._project_cache = project
        self._project_cache_time = time.time()

        return project

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
            # 优化：批量查询所有 test_case_id，避免 N+1 查询问题
            unique_case_ids = list(set(r.get("test_case_id", "") for r in test_results))
            case_id_to_db_id = {}

            if unique_case_ids:
                # 使用 in 查询一次性获取所有 case_id 对应的数据库 ID
                case_ids_str = ','.join(f'"{cid}"' for cid in unique_case_ids)
                test_cases_response = self.session.get(
                    f"{self.supabase_url}/rest/v1/test_cases",
                    params={
                        'case_id': f'in.({case_ids_str})',
                        'select': 'id,case_id'
                    },
                    headers=self.headers,
                    timeout=10
                )

                if test_cases_response.status_code == 200:
                    test_cases = test_cases_response.json()
                    case_id_to_db_id = {tc['case_id']: tc['id'] for tc in test_cases}

            # 构建 db_results，使用缓存的 case_id 映射
            db_results = []
            for result in test_results:
                case_id = result.get("test_case_id", "")
                test_case_db_id = case_id_to_db_id.get(case_id)

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

    def get_test_cases_by_filters(
        self,
        project_id: str,
        module_ids: Optional[List[str]] = None,
        levels: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        按模块和等级筛选测试用例

        Args:
            project_id: 项目ID
            module_ids: 模块ID列表（可选）
            levels: 等级列表（可选）

        Returns:
            符合条件的测试用例列表
        """
        try:
            # 基础查询参数
            params = {
                'project_id': f'eq.{project_id}',
                'is_active': 'eq.true',
                'select': 'id,case_id,level,module_id,modules(name)'
            }

            # 获取测试用例
            response = self._make_request('GET', 'test_cases', params=params)
            test_cases = response.get('data', [])

            # 在内存中过滤（避免复杂的 Supabase 查询）
            if module_ids:
                test_cases = [tc for tc in test_cases if tc.get('module_id') in module_ids]

            if levels:
                test_cases = [tc for tc in test_cases if tc.get('level') in levels]

            return test_cases

        except Exception as e:
            logger.error(f"❌ 按筛选条件查询测试用例失败: {e}")
            return []

    def get_all_active_test_cases(self, project_id: str) -> List[Dict[str, Any]]:
        """
        获取所有活跃的测试用例

        Args:
            project_id: 项目ID

        Returns:
            所有活跃的测试用例列表
        """
        try:
            params = {
                'project_id': f'eq.{project_id}',
                'is_active': 'eq.true',
                'select': 'id,case_id,level,module_id,modules(name)'
            }
            response = self._make_request('GET', 'test_cases', params=params)
            return response.get('data', [])
        except Exception as e:
            logger.error(f"❌ 获取所有测试用例失败: {e}")
            return []

    def get_test_cases_by_case_ids(
        self,
        project_id: str,
        case_ids: List[str]
    ) -> List[Dict[str, Any]]:
        """
        根据用例ID列表获取测试用例

        Args:
            project_id: 项目ID
            case_ids: 用例ID列表（支持新格式 PRJ001-MOD001-001）

        Returns:
            测试用例列表
        """
        try:
            # 处理新格式：用例ID包含连字符，需要用引号包裹
            # 例如：PRJ001-MOD001-001 需要转换为 "PRJ001-MOD001-001"
            escaped_ids = ','.join([f'"{cid}"' for cid in case_ids])

            params = {
                'project_id': f'eq.{project_id}',
                'is_active': 'eq.true',
                'case_id': f'in.({escaped_ids})',
                'select': 'id,case_id,level,module_id,modules(name)'
            }
            response = self._make_request('GET', 'test_cases', params=params)
            return response.get('data', [])
        except Exception as e:
            logger.error(f"❌ 根据用例ID查询失败: {e}")
            return []

    def get_execution_preview(
        self,
        project_id: str,
        execution_type: str,
        module_ids: Optional[List[str]] = None,
        levels: Optional[List[str]] = None,
        case_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        获取执行预览信息

        Args:
            project_id: 项目ID
            execution_type: 执行类型 ('specific', 'all', 'modules', 'levels')
            module_ids: 模块ID列表（可选）
            levels: 等级列表（可选）
            case_ids: 用例ID列表（可选）

        Returns:
            预览信息字典，包含:
            - total_cases: 总用例数
            - estimated_duration: 预计执行时间（秒）
            - modules: 涉及的模块列表
            - levels: 涉及的等级列表
        """
        try:
            # 根据执行类型筛选用例
            if execution_type == 'all':
                # 全部用例
                test_cases = self.get_all_active_test_cases(project_id)
            elif execution_type == 'modules':
                # 按模块筛选
                test_cases = self.get_test_cases_by_filters(project_id, module_ids=module_ids)
            elif execution_type == 'levels':
                # 按等级筛选
                test_cases = self.get_test_cases_by_filters(project_id, levels=levels)
            elif execution_type == 'specific':
                # 指定用例
                if case_ids:
                    test_cases = self.get_test_cases_by_case_ids(project_id, case_ids)
                else:
                    test_cases = []
            else:
                test_cases = []

            # 计算统计信息
            total_cases = len(test_cases)
            estimated_duration = total_cases * 2  # 假设每个用例平均2秒

            # 提取涉及的模块和等级
            modules_set = set()
            levels_set = set()

            for tc in test_cases:
                if tc.get('modules') and tc['modules'].get('name'):
                    modules_set.add(tc['modules']['name'])
                if tc.get('level'):
                    levels_set.add(tc['level'])

            return {
                'total_cases': total_cases,
                'estimated_duration': estimated_duration,
                'modules': sorted(list(modules_set)),
                'levels': sorted(list(levels_set))
            }

        except Exception as e:
            logger.error(f"❌ 获取执行预览失败: {e}")
            return {
                'total_cases': 0,
                'estimated_duration': 0,
                'modules': [],
                'levels': []
            }


def get_supabase_client(access_token: Optional[str] = None) -> SupabaseClient:
    """
    获取 Supabase 客户端实例

    Args:
        access_token: 用户访问令牌（可选，用于 RLS）

    Returns:
        SupabaseClient 实例
    """
    return SupabaseClient(access_token)