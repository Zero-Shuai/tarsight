#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
测试执行记录管理器
负责将测试执行结果记录到 Supabase 数据库
"""

import os
import sys
import json
import uuid
import logging
import time
from datetime import datetime
from typing import Dict, List, Optional, Any

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from dotenv import load_dotenv
from utils.file_test_recorder import get_file_recorder

# 加载环境变量
load_dotenv('.env.supabase')

logger = logging.getLogger(__name__)


class TestExecutionRecorder:
    """测试执行记录器"""

    def __init__(self):
        """初始化记录器"""
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_ANON_KEY')

        self.enabled = bool(self.supabase_url and self.supabase_key)
        # 从环境变量获取 execution_id（如果有的话）
        self.execution_id = os.getenv('TARSIGHT_EXECUTION_ID')
        self.project_id = None
        self.test_results = []
        self.file_recorder = get_file_recorder()

        if self.enabled:
            logger.info("✅ 测试执行记录器已启用 (Supabase)")
            if self.execution_id:
                logger.info(f"✅ 从环境变量获取执行ID: {self.execution_id[:8]}...")
        else:
            logger.warning("⚠️ 测试执行记录器已禁用 (缺少 Supabase 配置)")

    def start_execution(self, execution_name: str = None) -> Optional[str]:
        """开始一次测试执行"""
        if not self.enabled:
            return None

        try:
            import requests

            # 获取 Tarsight 项目
            projects_response = requests.get(
                f"{self.supabase_url}/rest/v1/projects",
                headers={
                    'apikey': self.supabase_key,
                    'Authorization': f'Bearer {self.supabase_key}',
                    'Content-Type': 'application/json'
                },
                timeout=10
            )

            if projects_response.status_code != 200:
                logger.error(f"❌ 获取项目失败: {projects_response.status_code}")
                return None

            projects = projects_response.json()
            tarsight_project = next((p for p in projects if p['name'] == 'Tarsight'), None)

            if not tarsight_project:
                logger.error("❌ 未找到 Tarsight 项目")
                return None

            self.project_id = tarsight_project['id']

            # 创建测试执行记录
            execution_data = {
                'project_id': self.project_id,
                'execution_name': execution_name or f"测试执行 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                'status': 'running',
                'total_tests': 0,
                'passed_tests': 0,
                'failed_tests': 0,
                'skipped_tests': 0
            }

            response = requests.post(
                f"{self.supabase_url}/rest/v1/test_executions",
                headers={
                    'apikey': self.supabase_key,
                    'Authorization': f'Bearer {self.supabase_key}',
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                json=execution_data,
                timeout=10
            )

            if response.status_code in [200, 201]:
                execution = response.json()[0]
                self.execution_id = execution['id']

                logger.info(f"✅ 开始测试执行: {execution['execution_name']} (ID: {self.execution_id[:8]}...)")
                return self.execution_id
            else:
                logger.error(f"❌ 创建执行记录失败: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            logger.error(f"❌ 开始执行记录失败: {e}")
            return None

    def record_test_result(self, test_case: Dict[str, Any],
                          request_info: Dict[str, Any],
                          response_info: Dict[str, Any],
                          status: str = "passed",
                          error_message: str = None,
                          duration: float = 0.0) -> bool:
        """记录单个测试结果"""
        if not self.enabled or not self.execution_id:
            return False

        try:
            import requests

            # 获取测试用例 ID
            test_case_response = requests.get(
                f"{self.supabase_url}/rest/v1/test_cases",
                params={
                    'case_id': f'eq.{test_case.get("case_id")}',
                    'project_id': f'eq.{self.project_id}'
                },
                headers={
                    'apikey': self.supabase_key,
                    'Authorization': f'Bearer {self.supabase_key}',
                    'Content-Type': 'application/json'
                },
                timeout=10
            )

            test_case_id = None
            if test_case_response.status_code == 200:
                test_cases = test_case_response.json()
                if test_cases:
                    test_case_id = test_cases[0]['id']

            # 构建测试结果数据
            result_data = {
                'execution_id': self.execution_id,
                'test_case_id': test_case_id,
                'status': status,
                'duration': duration,
                'error_message': error_message,
                'request_info': request_info,
                'response_info': response_info
            }

            # 添加到结果列表，稍后批量插入
            self.test_results.append(result_data)

            # 同时添加到文件记录器，供主进程使用
            shared_result = {
                'test_case_id': test_case.get('case_id'),
                'test_name': test_case.get('test_name'),
                'module': test_case.get('module'),
                'status': status,
                'duration': duration,
                'error_message': error_message,
                'request_info': request_info,
                'response_info': response_info,
                'recorded_at': datetime.now().isoformat()
            }
            self.file_recorder.add_test_result(shared_result)

            # 更新统计信息
            if status == 'passed':
                self._increment_passed()
            elif status == 'failed':
                self._increment_failed()
            elif status == 'skipped':
                self._increment_skipped()

            self._increment_total()

            return True

        except Exception as e:
            logger.error(f"❌ 记录测试结果失败: {e}")
            return False

    def finish_execution(self) -> bool:
        """完成测试执行，更新执行记录"""
        if not self.enabled or not self.execution_id:
            return False

        try:
            import requests

            # 从共享文件读取测试结果
            shared_data = self.file_recorder.read_shared_file()
            test_results = shared_data.get('test_results', [])

            # 批量插入测试结果
            if test_results:
                logger.info(f"📊 正在保存 {len(test_results)} 个测试结果...")

                # 转换共享数据格式为数据库格式
                db_results = []
                for result in test_results:
                    # 获取测试用例 ID
                    test_case_response = requests.get(
                        f"{self.supabase_url}/rest/v1/test_cases",
                        params={
                            'case_id': f'eq.{result.get("test_case_id", "")}',
                            'project_id': f'eq.{self.project_id}'
                        },
                        headers={
                            'apikey': self.supabase_key,
                            'Authorization': f'Bearer {self.supabase_key}',
                            'Content-Type': 'application/json'
                        },
                        timeout=10
                    )

                    test_case_id = None
                    if test_case_response.status_code == 200:
                        test_cases = test_case_response.json()
                        if test_cases:
                            test_case_id = test_cases[0]['id']

                    db_result = {
                        'execution_id': self.execution_id,
                        'test_case_id': test_case_id,
                        'status': result.get('status', 'unknown'),
                        'duration': result.get('duration', 0.0),
                        'error_message': result.get('error_message'),
                        'request_info': result.get('request_info', {}),
                        'response_info': result.get('response_info', {})
                    }
                    db_results.append(db_result)

                # 分批插入，避免请求过大
                batch_size = 50
                for i in range(0, len(db_results), batch_size):
                    batch = db_results[i:i + batch_size]

                    response = requests.post(
                        f"{self.supabase_url}/rest/v1/test_results",
                        headers={
                            'apikey': self.supabase_key,
                            'Authorization': f'Bearer {self.supabase_key}',
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal'
                        },
                        json=batch,
                        timeout=30
                    )

                    if response.status_code not in [200, 201, 204]:
                        logger.warning(f"⚠️ 批量插入测试结果失败: {response.status_code}")

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
                'status': 'completed',
                'total_tests': stats['total'],
                'passed_tests': stats['passed'],
                'failed_tests': stats['failed'],
                'skipped_tests': stats['skipped'],
                'total_duration': stats.get('duration', 0.0),
                'completed_at': datetime.now().isoformat()
            }

            response = requests.patch(
                f"{self.supabase_url}/rest/v1/test_executions",
                params={'id': f'eq.{self.execution_id}'},
                headers={
                    'apikey': self.supabase_key,
                    'Authorization': f'Bearer {self.supabase_key}',
                    'Content-Type': 'application/json'
                },
                json=update_data,
                timeout=10
            )

            if response.status_code in [200, 204]:
                logger.info(f"✅ 测试执行完成: {stats['total']} 个测试, 成功 {stats['passed']} 个")
                return True
            else:
                logger.error(f"❌ 更新执行记录失败: {response.status_code}")
                return False

        except Exception as e:
            logger.error(f"❌ 完成执行记录失败: {e}")
            return False

    def _increment_total(self):
        """增加总测试数"""
        self._increment_stat('total')

    def _increment_passed(self):
        """增加通过测试数"""
        self._increment_stat('passed')

    def _increment_failed(self):
        """增加失败测试数"""
        self._increment_stat('failed')

    def _increment_skipped(self):
        """增加跳过测试数"""
        self._increment_stat('skipped')

    def _increment_stat(self, stat_type: str):
        """增加统计数量"""
        try:
            import requests

            response = requests.rpc(
                f"{self.supabase_url}/rest/v1/rpc/increment_execution_stat",
                headers={
                    'apikey': self.supabase_key,
                    'Authorization': f'Bearer {self.supabase_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'execution_id': self.execution_id,
                    'stat_type': stat_type
                },
                timeout=10
            )
        except Exception as e:
            # 如果 RPC 调用失败，记录警告但不影响主流程
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"RPC调用失败，统计更新跳过: {e}")

    def _get_current_stats(self) -> Dict[str, Any]:
        """获取当前统计信息"""
        stats = {
            'total': len(self.test_results),
            'passed': 0,
            'failed': 0,
            'skipped': 0,
            'duration': 0.0
        }

        for result in self.test_results:
            status = result.get('status', 'unknown')
            if status == 'passed':
                stats['passed'] += 1
            elif status == 'failed':
                stats['failed'] += 1
            elif status == 'skipped':
                stats['skipped'] += 1

            duration = result.get('duration', 0.0)
            if isinstance(duration, (int, float)):
                stats['duration'] += duration

        return stats


# 全局实例
_test_recorder: Optional[TestExecutionRecorder] = None


def get_test_recorder() -> TestExecutionRecorder:
    """获取全局测试记录器实例"""
    global _test_recorder
    if _test_recorder is None:
        _test_recorder = TestExecutionRecorder()
    return _test_recorder


def start_test_execution(execution_name: str = None) -> Optional[str]:
    """开始测试执行的便捷函数"""
    return get_test_recorder().start_execution(execution_name)


def record_test_result(test_case: Dict[str, Any],
                     request_info: Dict[str, Any],
                     response_info: Dict[str, Any],
                     status: str = "passed",
                     error_message: str = None,
                     duration: float = 0.0) -> bool:
    """记录测试结果的便捷函数"""
    return get_test_recorder().record_test_result(
        test_case, request_info, response_info, status, error_message, duration
    )


def finish_test_execution() -> bool:
    """完成测试执行的便捷函数"""
    return get_test_recorder().finish_execution()