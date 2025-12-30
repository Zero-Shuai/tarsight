#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Pytest 配置文件 - Supabase 集成
自动记录测试执行到 Supabase 数据库
"""

import pytest
import logging
import time
import json
import os
import sys
from datetime import datetime
from typing import Dict, Any

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

from utils.test_execution_recorder import get_test_recorder, start_test_execution, finish_test_execution
from utils.json_test_recorder import get_json_recorder

logger = logging.getLogger(__name__)


def pytest_configure(config):
    """pytest 配置钩子"""
    # 只有在没有环境变量时才开始测试执行记录（避免与run.py重复）
    if not os.environ.get('TARSIGHT_EXECUTION_ID'):
        execution_name = f"测试执行 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"

        # 检查是否有命令行参数指定执行名称
        if hasattr(config, 'option') and hasattr(config.option, 'supabase_execution_name'):
            execution_name = config.option.supabase_execution_name

        start_test_execution(execution_name)


def pytest_unconfigure(config):
    """pytest 清理钩子"""
    # 只有在没有环境变量时才完成测试执行记录（避免与run.py重复）
    if not os.environ.get('TARSIGHT_EXECUTION_ID'):
        finish_test_execution()

    # 保存JSON记录器（如果启用）
    json_recorder = get_json_recorder()
    if json_recorder and json_recorder.json_file_path and json_recorder.test_results:
        logger.info(f"\n💾 正在保存测试结果到 JSON 文件...")
        json_recorder.save_to_file()


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """pytest 测试报告钩子"""
    outcome = yield

    # 获取测试结果
    if call.when == 'call':
        # 获取测试用例信息
        test_case = getattr(item.function, '_test_case_data', {})
        if not test_case and hasattr(item, 'callspec'):
            # 从参数化测试中获取测试用例数据
            test_case = item.callspec.params.get('test_case', {})

        # 如果没有测试用例数据，跳过记录
        if not test_case:
            return

        # 获取请求和响应信息
        request_info = getattr(item, '_last_request_info', {})
        response_info = getattr(item, '_last_response_info', {})

        # 确定测试状态
        status = 'passed'
        error_message = None
        duration = 0.0

        if call.excinfo is not None:
            if call.excinfo.typename == 'Skipped':
                status = 'skipped'
                error_message = str(call.excinfo.value)
            else:
                status = 'failed'
                error_message = f"{call.excinfo.typename}: {call.excinfo.value}"

        # 尝试获取测试执行时间
        if hasattr(call, 'duration'):
            duration = call.duration
        elif hasattr(item, 'test_execution_time'):
            duration = item.test_execution_time

        # 记录到JSON记录器（如果启用）
        json_recorder = get_json_recorder()
        if json_recorder and json_recorder.json_file_path:
            json_recorder.add_test_result(
                test_case=test_case,
                request_info=request_info,
                response_info=response_info,
                status=status,
                error_message=error_message,
                duration=duration
            )

        # 记录到Supabase记录器（如果启用）
        if os.environ.get('SUPABASE_URL'):
            try:
                recorder = get_test_recorder()
                recorder.record_test_result(
                    test_case=test_case,
                    request_info=request_info,
                    response_info=response_info,
                    status=status,
                    error_message=error_message,
                    duration=duration
                )
            except Exception as e:
                # 如果Supabase记录器失败,记录但不影响测试
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Supabase记录器失败: {e}")


def pytest_addoption(parser):
    """添加 pytest 命令行选项"""
    parser.addoption(
        '--supabase-execution-name',
        action='store',
        default=None,
        help='指定 Supabase 测试执行名称'
    )


# 保存测试用例数据到测试项
@pytest.fixture(autouse=True)
def capture_test_case_data(request):
    """捕获测试用例数据"""
    # 获取测试用例数据
    if hasattr(request, 'callspec') and 'test_case' in request.callspec.params:
        test_case = request.callspec.params['test_case']
        request.function._test_case_data = test_case


# 保存请求响应信息
@pytest.fixture(autouse=True)
def capture_request_response(request):
    """捕获请求响应信息"""
    def save_info(test_instance):
        """保存测试实例的请求响应信息"""
        request.node._last_request_info = getattr(test_instance, '_last_request_info', {})
        request.node._last_response_info = getattr(test_instance, '_last_response_info', {})

    # 这里需要在测试执行后调用
    return save_info