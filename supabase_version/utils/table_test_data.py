#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
通用表格测试数据读取模块
支持JSON格式的请求体，适用于各种API测试
支持从CSV文件和Supabase数据库读取测试用例
"""

import csv
import json
import os
import logging
from typing import List, Dict, Any, Optional
from utils.types import TestCase, ModuleName

logger = logging.getLogger(__name__)

# CSV文件在项目根目录
CSV_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'test_cases.csv')

# 数据源模式：'csv' 或 'supabase'
DATA_SOURCE = os.environ.get('DATA_SOURCE', 'csv')


def load_test_cases_from_csv() -> List[TestCase]:
    """从CSV文件加载测试用例

    Returns:
        测试用例列表
    """
    test_cases: List[TestCase] = []

    if not os.path.exists(CSV_FILE_PATH):
        logger.error(f"❌ CSV文件不存在: {CSV_FILE_PATH}")
        return test_cases

    try:
        with open(CSV_FILE_PATH, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)

            for row in reader:
                # 解析JSON格式的请求体
                try:
                    request_body: Dict[str, Any] = json.loads(row['request_body']) if row['request_body'] else {}
                except json.JSONDecodeError as e:
                    logger.warning(f"⚠️ 测试用例 {row.get('case_id', '未知')} 的JSON请求体解析失败: {e}")
                    request_body = {}

                # 解析headers
                try:
                    headers: Dict[str, str] = json.loads(row['headers']) if row['headers'] else {}
                except json.JSONDecodeError:
                    headers = {}

                # 解析variables
                try:
                    variables: Dict[str, Any] = json.loads(row['variables']) if row['variables'] else {}
                except json.JSONDecodeError:
                    variables = {}

                test_case = {
                    'module': row.get('module', ''),
                    'case_id': row.get('case_id', ''),
                    'test_name': row.get('test_name', ''),
                    'description': row.get('description', ''),
                    'method': row.get('method', 'GET').upper(),
                    'url': row.get('url', ''),
                    'request_body': request_body,
                    'expected_status': int(row.get('expected_status', 200)),
                    'headers': headers,
                    'variables': variables,
                    'tags': [tag.strip() for tag in row.get('tags', '').split(',') if tag.strip()]
                }
                test_cases.append(test_case)

    except Exception as e:
        logger.error(f"❌ 读取CSV文件失败: {e}")

    return test_cases


def get_test_cases_by_module(module: ModuleName) -> List[TestCase]:
    """根据模块获取测试用例

    Args:
        module: 模块名称

    Returns:
        该模块的测试用例列表
    """
    all_cases = load_test_cases_from_csv()
    return [case for case in all_cases if case.get('module') == module]


def get_test_cases_by_project(project_name: str = None) -> List[Dict[str, Any]]:
    """根据项目名获取测试用例（如果project_name为空，返回所有测试用例）"""
    all_cases = load_test_cases_from_csv()
    if project_name is None:
        return all_cases
    # 这里可以根据实际需求扩展项目级别的过滤逻辑
    # 目前返回所有测试用例，因为所有模块都属于Tarsight项目
    return all_cases


def get_test_cases_by_tag(tag: str) -> List[TestCase]:
    """根据标签获取测试用例

    Args:
        tag: 标签名称

    Returns:
        包含该标签的测试用例列表
    """
    all_cases = load_test_cases_from_csv()
    return [case for case in all_cases if tag in case.get("tags", [])]


def get_all_test_cases() -> List[TestCase]:
    """获取所有测试用例

    Returns:
        所有测试用例列表
    """
    if DATA_SOURCE == 'supabase':
        return load_test_cases_from_supabase()
    return load_test_cases_from_csv()


def load_test_cases_from_supabase() -> List[TestCase]:
    """从Supabase数据库加载测试用例

    Returns:
        测试用例列表
    """
    try:
        from utils.supabase_client import get_supabase_client

        client = get_supabase_client()
        project = client.get_tarsight_project()

        if not project:
            logger.warning("⚠️ 未找到Tarsight项目，使用CSV数据源")
            return load_test_cases_from_csv()

        project_id = project['id']

        # 获取所有模块
        modules_response = client._make_request('GET', 'modules', params={
            'project_id': f'eq.{project_id}'
        })

        if not modules_response.get('data'):
            logger.warning("⚠️ 数据库中没有模块，使用CSV数据源")
            return load_test_cases_from_csv()

        modules = {m['id']: m['name'] for m in modules_response['data']}

        # 获取所有测试用例
        test_cases_response = client._make_request('GET', 'test_cases', params={
            'project_id': f'eq.{project_id}',
            'is_active': 'eq.true'
        })

        if not test_cases_response.get('data'):
            logger.warning("⚠️ 数据库中没有测试用例，使用CSV数据源")
            return load_test_cases_from_csv()

        # 转换数据库格式到测试用例格式
        test_cases: List[TestCase] = []
        for db_case in test_cases_response['data']:
            module_id = db_case.get('module_id')
            module_name = modules.get(module_id, 'unknown')

            # 解析JSON字段
            try:
                request_body = db_case.get('request_body', {})
                if isinstance(request_body, str):
                    request_body = json.loads(request_body)
            except (json.JSONDecodeError, TypeError):
                request_body = {}

            try:
                headers = db_case.get('headers', {})
                if isinstance(headers, str):
                    headers = json.loads(headers)
            except (json.JSONDecodeError, TypeError):
                headers = {}

            try:
                variables = db_case.get('variables', {})
                if isinstance(variables, str):
                    variables = json.loads(variables)
            except (json.JSONDecodeError, TypeError):
                variables = {}

            try:
                validation_rules = db_case.get('validation_rules')
                if validation_rules and isinstance(validation_rules, str):
                    validation_rules = json.loads(validation_rules)
            except (json.JSONDecodeError, TypeError):
                validation_rules = None

            # 解析tags
            tags = db_case.get('tags', [])
            if isinstance(tags, str):
                tags = [tag.strip() for tag in tags.split(',') if tag.strip()]
            elif not isinstance(tags, list):
                tags = []

            test_case = {
                'module': module_name,
                'case_id': db_case.get('case_id', ''),
                'test_name': db_case.get('test_name', ''),
                'description': db_case.get('description', ''),
                'method': db_case.get('method', 'GET').upper(),
                'url': db_case.get('url', ''),
                'request_body': request_body,
                'expected_status': db_case.get('expected_status', 200),
                'headers': headers,
                'variables': variables,
                'validation_rules': validation_rules,
                'tags': tags
            }
            test_cases.append(test_case)

        logger.info(f"✅ 从Supabase加载了 {len(test_cases)} 个测试用例")
        return test_cases

    except Exception as e:
        logger.warning(f"⚠️ 从Supabase加载测试用例失败: {e}")
        logger.info(f"💡 回退到CSV数据源")
        return load_test_cases_from_csv()


def get_modules_list() -> List[ModuleName]:
    """获取所有可用的模块列表

    Returns:
        模块名称列表
    """
    all_cases = get_all_test_cases()
    modules = list(set(case.get('module', '') for case in all_cases))
    return sorted([module for module in modules if module])


def build_request_url(test_case: TestCase, base_url: str = "") -> str:
    """构建完整的请求URL

    Args:
        test_case: 测试用例
        base_url: 基础URL

    Returns:
        完整的请求URL
    """
    url = test_case.get('url', '')

    # 如果URL是相对路径，添加base_url
    if url and not url.startswith('http') and base_url:
        # 移除base_url末尾的斜杠和URL开头的斜杠
        base_url = base_url.rstrip('/')
        url = url.lstrip('/')
        url = f"{base_url}/{url}"

    return url


def build_full_request_body(test_case: TestCase) -> Dict[str, Any]:
    """构建完整的请求体（合并variables）

    Args:
        test_case: 测试用例

    Returns:
        完整的请求体
    """
    # 确保 request_body 不为 None，如果是 None 或不是 dict，使用空 dict
    request_body = test_case.get('request_body')
    if not isinstance(request_body, dict):
        request_body = {}
    else:
        request_body = request_body.copy()

    # 确保 variables 不为 None
    variables = test_case.get('variables')
    if not isinstance(variables, dict):
        variables = {}

    # 将variables合并到request_body中
    if variables:
        request_body.update(variables)

    return request_body


def print_test_summary() -> None:
    """打印测试用例汇总"""
    all_cases = get_all_test_cases()

    logger.info("📊 通用表格测试用例汇总")
    logger.info("=" * 50)
    logger.info(f"CSV文件: {CSV_FILE_PATH}")
    logger.info(f"总测试用例数: {len(all_cases)}")

    if not all_cases:
        logger.warning("❌ 没有找到测试用例")
        return

    # 按模块统计
    module_stats: Dict[str, int] = {}
    for case in all_cases:
        module = case.get('module', 'unknown')
        module_stats[module] = module_stats.get(module, 0) + 1

    logger.info("按模块分布:")
    for module, count in sorted(module_stats.items()):
        logger.info(f"  {module}: {count} 个")

    # 按标签统计
    tag_stats: Dict[str, int] = {}
    for case in all_cases:
        for tag in case.get("tags", []):
            tag_stats[tag] = tag_stats.get(tag, 0) + 1

    logger.info("按标签分布:")
    for tag, count in sorted(tag_stats.items()):
        logger.info(f"  {tag}: {count} 个")


def show_table_content() -> None:
    """以表格形式显示CSV内容"""
    all_cases = get_all_test_cases()

    if not all_cases:
        logger.error("❌ CSV文件为空或不存在")
        return

    logger.info("📋 测试用例表格内容:")
    logger.info("=" * 140)

    # 表头
    header = f"{'模块':<10} {'ID':<8} {'测试名称':<15} {'方法':<6} {'URL':<25} {'预期状态':<8} {'标签'}"
    logger.info(header)
    logger.info("-" * 140)

    # 数据行
    for case in all_cases:
        module = case['module'][:8]
        case_id = case['case_id']
        test_name = case['test_name'][:13]
        method = case['method']
        url = case['url'][:23]
        expected_status = str(case['expected_status'])
        tags = ','.join(case['tags'])[:15]

        logger.info(f"{module:<10} {case_id:<8} {test_name:<15} {method:<6} {url:<25} {expected_status:<8} {tags}")


if __name__ == "__main__":
    print_test_summary()
    print()
    show_table_content()