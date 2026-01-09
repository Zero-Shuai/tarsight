#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
类型定义模块
统一管理项目中使用的所有类型注解
"""

from typing import Dict, List, Any, Optional, Union, TypedDict
from datetime import datetime


# ==================== 测试用例相关类型 ====================

class TestCase(TypedDict, total=False):
    """测试用例数据结构"""
    module: str
    case_id: str
    test_name: str
    description: str
    method: str
    url: str
    request_body: Dict[str, Any]
    expected_status: int
    headers: Dict[str, str]
    variables: Dict[str, Any]
    tags: List[str]


class TestCaseDict(Dict[str, Any]):
    """测试用例字典类型（向后兼容）"""
    pass


# ==================== 模块相关类型 ====================

class Module(TypedDict):
    """模块数据结构"""
    id: str
    name: str
    description: str
    project_id: str
    created_at: str
    updated_at: Optional[str]


# ==================== 项目相关类型 ====================

class Project(TypedDict):
    """项目数据结构"""
    id: str
    name: str
    description: str
    base_url: str
    created_at: str
    updated_at: Optional[str]


# ==================== 测试执行相关类型 ====================

class TestExecution(TypedDict):
    """测试执行记录数据结构"""
    id: str
    project_id: str
    execution_name: str
    start_time: str
    end_time: Optional[str]
    status: str
    total_tests: int
    passed_tests: int
    failed_tests: int
    skipped_tests: int
    created_at: str


class TestResult(TypedDict, total=False):
    """测试结果数据结构"""
    id: str
    execution_id: str
    test_case_id: str
    module_name: str
    case_id: str
    test_name: str
    status: str
    duration: float
    error_message: Optional[str]
    stack_trace: Optional[str]
    created_at: str


# ==================== HTTP 响应相关类型 ====================

class HttpResponse(TypedDict):
    """HTTP 响应数据结构"""
    status_code: int
    headers: Dict[str, str]
    body: Union[Dict[str, Any], str, None]
    response_time: float


# ==================== 统计相关类型 ====================

class ModuleStats(Dict[str, int]):
    """模块统计数据类型 {模块名: 测试用例数量}"""
    pass


class ExecutionStats(TypedDict):
    """执行统计数据"""
    total: int
    passed: int
    failed: int
    skipped: int
    pass_rate: float
    duration: float


# ==================== JSON 结果相关类型 ====================

class JsonTestResult(TypedDict, total=False):
    """JSON 测试结果数据结构"""
    execution_name: str
    start_time: str
    end_time: str
    total_tests: int
    results: List[TestResult]


# ==================== 配置相关类型 ====================

class DataSourceType(str):
    """数据源类型枚举"""
    CSV = "csv"
    SUPABASE = "supabase"


class TestStatus(str):
    """测试状态枚举"""
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    ERROR = "error"


# ==================== 类型别名 ====================

# 环境变量值类型
EnvValue = Union[str, int, float, bool, None]

# JSON 数据类型
JsonData = Union[Dict[str, Any], List[Any], str, int, float, bool, None]

# HTTP 方法类型
HttpMethod = str

# 模块名称类型
ModuleName = str

# 项目 ID 类型
ProjectId = str

# 模块 ID 类型
ModuleId = str

# 测试用例 ID 类型
CaseId = str

# 执行 ID 类型
ExecutionId = str


# ==================== 工具函数 ====================

def is_valid_test_case(data: Dict[str, Any]) -> bool:
    """验证数据是否为有效的测试用例"""
    required_fields = ['module', 'case_id', 'test_name', 'method', 'url']
    return all(field in data for field in required_fields)


def is_valid_http_method(method: str) -> bool:
    """验证 HTTP 方法是否有效"""
    return method.upper() in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']


if __name__ == "__main__":
    # 类型定义测试
    print("📋 类型定义模块")
    print("=" * 50)
    print("✅ TestCase - 测试用例数据结构")
    print("✅ Module - 模块数据结构")
    print("✅ Project - 项目数据结构")
    print("✅ TestExecution - 测试执行记录")
    print("✅ TestResult - 测试结果")
    print("✅ HttpResponse - HTTP 响应")
    print("✅ ModuleStats - 模块统计")
    print("✅ ExecutionStats - 执行统计")
    print("✅ JsonTestResult - JSON 测试结果")
    print("=" * 50)
