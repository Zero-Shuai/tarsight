#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Tarsight API 通用表格驱动测试用例
支持JSON格式的请求体
集成 Supabase 测试执行记录
"""

import allure
import pytest
import time
import json
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.request_util import api_request
from config import config
from utils.table_test_data import (
    get_test_cases_by_module,
    get_all_test_cases,
    build_request_url,
    build_full_request_body
)
from utils.test_execution_recorder import get_test_recorder


class TestTarsightTable:
    """Tarsight API 通用表格驱动测试"""

    @pytest.fixture(scope="class", autouse=True)
    def setup_class(self):
        """类级别的设置"""
        allure.dynamic.feature("Tarsight API")
        allure.dynamic.story("通用表格驱动测试")

    @pytest.fixture(autouse=True)
    def test_setup(self):
        """每个测试的设置，用于捕获请求响应信息"""
        # 初始化实例变量来存储请求响应信息
        self._last_request_info = {}
        self._last_response_info = {}

    @pytest.mark.parametrize("test_case", get_all_test_cases())
    def test_tarsight_api(self, test_case):
        """通用表格驱动的API测试"""
        module_name = test_case.get('module', 'unknown')
        case_id = test_case.get('case_id', 'unknown')

        # 检查是否需要按模块过滤（通过环境变量）
        import os
        target_module = os.environ.get('TARGET_MODULE')
        if target_module and module_name != target_module:
            pytest.skip(f"跳过非目标模块 '{target_module}' 的测试用例")

        # 检查是否需要按用例ID过滤（通过环境变量）
        target_case_ids = os.environ.get('TARGET_CASE_IDS')
        if target_case_ids:
            target_ids = [cid.strip() for cid in target_case_ids.split(',')]
            if case_id not in target_ids:
                pytest.skip(f"跳过非指定用例ID '{case_id}' 的测试")

        allure.dynamic.title(f"[{module_name}] {case_id} - {test_case['test_name']}")
        allure.dynamic.description(test_case['description'])
        allure.dynamic.tag(*test_case['tags'], module_name)

        with allure.step(f"执行测试: {case_id} [{module_name}]"):
            allure.attach(
                json.dumps(test_case, indent=2, ensure_ascii=False),
                name="测试数据",
                attachment_type=allure.attachment_type.JSON
            )

            # 构建请求URL
            url = build_request_url(test_case, config.base_url)

            # 构建完整的请求体（确保不为 None）
            request_body = build_full_request_body(test_case) or {}

            # 构建headers（确保不为 None）
            headers = config.headers.copy()
            case_headers = test_case.get('headers')
            if case_headers:
                headers.update(case_headers)

            with allure.step("发送API请求"):
                start_time = time.time()
                resp = api_request(test_case['method'], url, headers=headers, json_data=request_body)
                response_time = time.time() - start_time

                request_info = {
                    "URL": url,
                    "Method": test_case['method'],
                    "Headers": headers,
                    "Body": request_body,
                    "响应时间": f"{response_time:.2f}s"
                }

                # 存储请求信息到实例变量，供增强HTML报告使用
                self._last_request_info = request_info

                allure.attach(
                    json.dumps(request_info, indent=2, ensure_ascii=False),
                    name="请求信息",
                    attachment_type=allure.attachment_type.JSON
                )

                # 添加请求详细信息
                print(f"\n🔍 请求详情:")
                print(f"   📡 URL: {url}")
                print(f"   📝 方法: {test_case['method']}")
                print(f"   📋 响应时间: {response_time:.2f}s")
                print(f"   📊 状态码: {resp.status_code}")

                if request_body:
                    print(f"   📦 请求体: {json.dumps(request_body, indent=2, ensure_ascii=False)}")

        # 验证响应状态
        assert resp.status_code == test_case['expected_status'], \
            f"状态码不匹配: 预期 {test_case['expected_status']}, 实际 {resp.status_code}"

        # 响应状态处理
        print(f"\n📝 响应详情:")
        print(f"   📊 状态码: {resp.status_code}")

        # 如果有验证规则，执行内容验证
        validation_rules = test_case.get('validation_rules')
        if validation_rules:
            print(f"\n🔍 执行内容验证...")
            try:
                # 尝试解析 JSON 响应
                response_data = resp.json()
                print(f"   📄 响应数据: {json.dumps(response_data, indent=2, ensure_ascii=False)[:200]}...")

                # 检查验证规则类型
                rule_type = validation_rules.get('type', 'json_path')

                if rule_type == 'json_path':
                    # JSON Path 验证
                    checks = validation_rules.get('checks', [])
                    for check in checks:
                        path = check.get('path')
                        operator = check.get('operator', 'equals')  # 默认为 equals
                        expected_value = check.get('value')

                        # 简单的 JSON Path 实现（支持 $.field 格式）
                        actual_value = response_data
                        if path.startswith('$.'):
                            # 移除 $. 前缀并按点分割
                            path_parts = path[2:].split('.')
                            for part in path_parts:
                                if isinstance(actual_value, dict):
                                    actual_value = actual_value.get(part)
                                elif isinstance(actual_value, list) and part.isdigit():
                                    index = int(part)
                                    if 0 <= index < len(actual_value):
                                        actual_value = actual_value[index]
                                    else:
                                        actual_value = None
                                        break
                                else:
                                    actual_value = None
                                    break

                        # 根据操作符执行验证
                        assert actual_value is not None, f"JSON Path '{path}' 不存在于响应中"

                        # 执行不同类型的验证
                        if operator == 'equals':
                            assert actual_value == expected_value, \
                                f"验证失败: Path '{path}' - 预期 {expected_value}, 实际 {actual_value}"
                            print(f"   ✅ 验证通过: {path} = {actual_value}")
                        elif operator == 'contains':
                            assert str(expected_value) in str(actual_value), \
                                f"验证失败: Path '{path}' - 期望包含 '{expected_value}', 实际 '{actual_value}'"
                            print(f"   ✅ 验证通过: {path} 包含 '{expected_value}'")
                        elif operator == 'not_contains':
                            assert str(expected_value) not in str(actual_value), \
                                f"验证失败: Path '{path}' - 期望不包含 '{expected_value}', 但实际包含 '{actual_value}'"
                            print(f"   ✅ 验证通过: {path} 不包含 '{expected_value}'")
                        elif operator == 'gt':
                            assert actual_value > expected_value, \
                                f"验证失败: Path '{path}' - 期望大于 {expected_value}, 实际 {actual_value}"
                            print(f"   ✅ 验证通过: {path} > {expected_value}")
                        elif operator == 'lt':
                            assert actual_value < expected_value, \
                                f"验证失败: Path '{path}' - 期望小于 {expected_value}, 实际 {actual_value}"
                            print(f"   ✅ 验证通过: {path} < {expected_value}")
                        elif operator == 'gte':
                            assert actual_value >= expected_value, \
                                f"验证失败: Path '{path}' - 期望大于等于 {expected_value}, 实际 {actual_value}"
                            print(f"   ✅ 验证通过: {path} >= {expected_value}")
                        elif operator == 'lte':
                            assert actual_value <= expected_value, \
                                f"验证失败: Path '{path}' - 期望小于等于 {expected_value}, 实际 {actual_value}"
                            print(f"   ✅ 验证通过: {path} <= {expected_value}")
                        else:
                            # 未知操作符，默认使用 equals
                            assert actual_value == expected_value, \
                                f"验证失败: Path '{path}' - 预期 {expected_value}, 实际 {actual_value}"
                            print(f"   ✅ 验证通过: {path} = {actual_value}")

                print(f"   ✅ 所有内容验证通过")
            except json.JSONDecodeError as e:
                print(f"   ⚠️ 响应不是 JSON 格式，跳过内容验证: {e}")
            except AssertionError as e:
                print(f"   ❌ 内容验证失败: {e}")
                raise
            except Exception as e:
                print(f"   ⚠️ 内容验证出错: {e}")
                raise

        # 构建响应信息
        response_info = {
            "Status Code": resp.status_code,
            "Headers": dict(resp.headers),
            "Response Time": response_time,
            "Content-Type": resp.headers.get('content-type', 'N/A'),
            "Content-Length": resp.headers.get('content-length', 'N/A')
        }

        if resp.status_code == 200:
            try:
                data = resp.json()

                # 打印响应摘要
                print(f"   ✅ 请求成功")
                print(f"   📄 响应类型: JSON")
                print(f"   🎯 Success: {data.get('success', 'N/A')}")
                print(f"   💬 Message: {data.get('message', 'N/A')}")
                print(f"   🔢 Code: {data.get('code', 'N/A')}")

                # 添加响应数据到响应信息
                response_info["Success"] = data.get('success', 'N/A')
                response_info["Message"] = data.get('message', 'N/A')
                response_info["Code"] = data.get('code', 'N/A')
                response_info["Data"] = data.get('data', {})

                # 基础结构验证
                assert "success" in data, "响应缺少success字段"
                assert "message" in data, "响应缺少message字段"
                assert "code" in data, "响应缺少code字段"

                # 检查API是否返回成功
                if data["success"] is True:
                    # 成功响应才需���包含data字段
                    assert "data" in data, "成功响应缺少data字段"
                    assert data["code"] == 200, f"状态码不匹配: 预期 200, 实际 {data['code']}"
                else:
                    # 失败响应应该导致测试失败
                    error_msg = data.get('message', '未知错误')
                    error_code = data.get('code', 'N/A')
                    print(f"   ⚠️ API返回失败: {error_msg}")
                    print(f"   🔢 错误代码: {error_code}")
                    # 断言失败，确保测试被标记为 failed
                    assert False, f"API返回失败: {error_msg} (code: {error_code})"

                # 验证数据结构（仅当API返回成功且有data字段时）
                if data.get("success") is True and "data" in data:
                    response_data = data["data"]
                    if isinstance(response_data, dict) and response_data:
                        # 根据测试用例中的action参数验证不同的数据字段
                        action = request_body.get("action", "")

                        if action == "video":
                            assert "videos" in response_data, f"响应缺少预期字段: videos"
                            videos = response_data.get("videos", [])
                            print(f"   🎬 视频数量: {len(videos)}")
                            if videos:
                                print(f"   📺 第一个视频: {videos[0].get('title', 'N/A')}")
                            response_info["Videos Count"] = len(videos)
                        elif action == "sound":
                            assert "sound_list" in response_data, f"响应缺少预期字段: sound_list"
                            sounds = response_data.get("sound_list", [])
                            print(f"   🔊 音频数量: {len(sounds)}")
                            if sounds:
                                print(f"   🎵 第一个音频: {sounds[0].get('title', 'N/A')}")
                            response_info["Sounds Count"] = len(sounds)

                # 记录响应数据到报告
                allure.attach(
                    json.dumps(data, indent=2, ensure_ascii=False),
                    name="响应数据",
                    attachment_type=allure.attachment_type.JSON
                )

                # 打印完整的响应数据（缩略显示）
                print(f"   📋 完整响应: {json.dumps(data, indent=2, ensure_ascii=False)[:500]}...")

            except json.JSONDecodeError:
                print(f"   ❌ 响应不是有效的JSON格式")
                print(f"   📄 响应文本: {resp.text[:200]}...")
                response_info["Raw Response"] = resp.text[:500]
                allure.attach(
                    resp.text,
                    name="响应文本(非JSON)",
                    attachment_type=allure.attachment_type.TEXT
                )
        else:
            print(f"   ❌ 请求失败，状态码: {resp.status_code}")
            print(f"   📄 响应内容: {resp.text[:200]}...")
            response_info["Error Response"] = resp.text[:500]
            allure.attach(
                resp.text,
                name=f"错误响应({resp.status_code})",
                attachment_type=allure.attachment_type.TEXT
            )

        # 存储响应信息到实例变量，供增强HTML报告使用
        self._last_response_info = response_info

        # 注意：不再手动记录测试结果到数据库
        # pytest_runtest_makereport hook 会自动处理，包括验证规则失败的情况
        # 手动记录会导致验证规则失败时，状态被错误地记录为 passed

    def test_all_test_cases_structure(self):
        """验证测试用例结构完整性"""
        with allure.step("验证测试用例完整性"):
            all_cases = get_all_test_cases()

            # 检查测试用例ID唯一性
            test_ids = [case['case_id'] for case in all_cases]
            assert len(test_ids) == len(set(test_ids)), "存在重复的测试ID"

            # 检查必需字段
            for case in all_cases:
                required_fields = ['case_id', 'test_name', 'description', 'method', 'url', 'expected_status']
                for field in required_fields:
                    assert field in case, f"测试用例 {case.get('case_id', '未知')} 缺少必需字段: {field}"

                # 验证URL格式
                url = case.get('url', '')
                assert url, f"测试用例 {case.get('case_id', '未知')} 的URL不能为空"

                # 验证JSON请求体格式
                try:
                    json.dumps(case.get('request_body', {}))
                except (TypeError, ValueError) as e:
                    assert False, f"测试用例 {case.get('case_id', '未知')} 的请求体JSON格式错误: {e}"

            # 按模块统计
            module_stats = {}
            for case in all_cases:
                module = case.get('module', 'unknown')
                module_stats[module] = module_stats.get(module, 0) + 1

            module_summary = ", ".join([f"{module}: {count}" for module, count in sorted(module_stats.items())])

            allure.attach(
                f"验证通过: {len(all_cases)} 个测试用例结构完整\n模块分布: {module_summary}",
                name="完整性检查结果",
                attachment_type=allure.attachment_type.TEXT
            )


if __name__ == "__main__":
    print("🧪 Tarsight 通用表格驱动测试")

    from testcases.table_test_data import print_test_summary
    print_test_summary()