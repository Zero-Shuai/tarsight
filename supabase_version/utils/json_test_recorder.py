#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
JSON 测试结果记录器
将测试结果保存到 JSON 文件
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)


class JsonTestRecorder:
    """JSON 测试结果记录器"""

    def __init__(self, json_file_path: str = None):
        """初始化记录器"""
        self.json_file_path = json_file_path or os.environ.get('TARSIGHT_JSON_RESULTS_FILE')
        if self.json_file_path:
            logger.info(f"✅ JSON 记录器已启用: {self.json_file_path}")
        else:
            print("⚠��� JSON 记录器未启用")

        self.test_results = []

        # 如果文件已存在，读取现有结果
        if self.json_file_path and os.path.exists(self.json_file_path):
            try:
                with open(self.json_file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    existing_results = data.get('test_results', [])
                    if existing_results:
                        self.test_results.extend(existing_results)
                        logger.info(f"📖 已读取现有测试结果: {len(existing_results)} 个")
            except Exception as e:
                logger.warning(f"⚠️ 读取现有 JSON 文件失败: {e}")

    def add_test_result(self, test_case: Dict[str, Any],
                       request_info: Dict[str, Any],
                       response_info: Dict[str, Any],
                       status: str = "passed",
                       error_message: str = None,
                       duration: float = 0.0):
        """添加测试结果"""
        result = {
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

        self.test_results.append(result)
        logger.info(f"📝 测试结果已添加到内存 (总计: {len(self.test_results)})")

    def save_to_file(self) -> bool:
        """保存测试结果到 JSON 文件"""
        if not self.json_file_path or not self.test_results:
            logger.warning("⚠️ 没有文件路径或测试结果")
            return False

        try:
            # 准备保存数据
            save_data = {
                'execution_name': os.environ.get('EXECUTION_NAME', f"测试执行 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"),
                'created_at': datetime.now().isoformat(),
                'total_tests': len(self.test_results),
                'passed_tests': len([r for r in self.test_results if r.get('status') == 'passed']),
                'failed_tests': len([r for r in self.test_results if r.get('status') == 'failed']),
                'skipped_tests': len([r for r in self.test_results if r.get('status') == 'skipped']),
                'test_results': self.test_results
            }

            # 确保目录存在
            os.makedirs(os.path.dirname(self.json_file_path), exist_ok=True)

            # 保存到文件
            with open(self.json_file_path, 'w', encoding='utf-8') as f:
                json.dump(save_data, f, ensure_ascii=False, indent=2)

            logger.info(f"✅ 测试结果已保存到 JSON 文件: {self.json_file_path}")
            logger.info(f"   📊 总计: {save_data['total_tests']} 个测试")
            logger.info(f"   ✅ 成功: {save_data['passed_tests']} 个")
            logger.info(f"   ❌ 失败: {save_data['failed_tests']} 个")
            logger.info(f"   ⏭️ 跳过: {save_data['skipped_tests']} 个")
            return True

        except Exception as e:
            logger.error(f"❌ 保存 JSON 文件失败: {e}")
            return False

    @staticmethod
    def create_json_file(execution_name: str = None) -> str:
        """创建 JSON 文件路径"""
        from datetime import datetime

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"test_results_{timestamp}.json"
        json_path = os.path.join("reports", filename)

        # 设置环境变量
        os.environ['TARSIGHT_JSON_RESULTS_FILE'] = json_path
        logger.info(f"✅ JSON 文件路径已设置: {json_path}")
        return json_path


# 全局实例
_json_recorder: Optional[JsonTestRecorder] = None


def get_json_recorder() -> JsonTestRecorder:
    """获取 JSON 记录器实例"""
    global _json_recorder
    if _json_recorder is None:
        _json_recorder = JsonTestRecorder()
    return _json_recorder