#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
基于文件的测试记录器 - 使用环境变量共享文件路径
"""

import os
import json
import tempfile
from datetime import datetime
from typing import Dict, List, Any, Optional

class FileTestRecorder:
    """基于文件的测试记录器"""

    def __init__(self):
        """初始化文件记录器"""
        self.shared_file_path = os.environ.get('TARSIGHT_SHARED_RECORDER_FILE')
        if self.shared_file_path:
            print(f"✅ 文件记录器已启用: {self.shared_file_path}")
        else:
            print("⚠️ 文件记录器未启用 (缺少环境变量 TARSIGHT_SHARED_RECORDER_FILE)")

    def add_test_result(self, test_result: Dict[str, Any]):
        """添加测试结果到共享文件"""
        if not self.shared_file_path:
            return False

        try:
            # 读取现有数据
            data = {}
            if os.path.exists(self.shared_file_path):
                with open(self.shared_file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)

            # 添加新的测试结果
            if 'test_results' not in data:
                data['test_results'] = []
            data['test_results'].append(test_result)

            # 写回文件
            with open(self.shared_file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            print(f"📝 测试结果已保存到共享文件 (总计: {len(data['test_results'])})")
            return True

        except Exception as e:
            print(f"⚠️ 保存测试结果失败: {e}")
            return False

    @staticmethod
    def create_shared_file(execution_name: str = None) -> str:
        """创建共享文件并设置环境变量"""
        temp_file = tempfile.mktemp(suffix='.json', prefix='tarsight_test_results_')

        initial_data = {
            'execution_name': execution_name or f"测试执行 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            'created_at': datetime.now().isoformat(),
            'test_results': []
        }

        try:
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump(initial_data, f, ensure_ascii=False, indent=2)

            # 设置环境变量，供子进程使用
            os.environ['TARSIGHT_SHARED_RECORDER_FILE'] = temp_file
            print(f"✅ 共享文件已创建: {temp_file}")
            return temp_file

        except Exception as e:
            print(f"❌ 创建共享文件失败: {e}")
            return None

    def read_shared_file(self) -> Dict[str, Any]:
        """读取共享文件数据（不清理）"""
        file_path = self.shared_file_path or os.environ.get('TARSIGHT_SHARED_RECORDER_FILE')
        if not file_path or not os.path.exists(file_path):
            return {}

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return data

        except Exception as e:
            print(f"⚠️ 读取共享文件失败: {e}")
            return {}

    @staticmethod
    def read_and_cleanup() -> Dict[str, Any]:
        """读取共享文件数据并清理"""
        file_path = os.environ.get('TARSIGHT_SHARED_RECORDER_FILE')
        if not file_path or not os.path.exists(file_path):
            return {}

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # 清理文件
            os.unlink(file_path)
            print(f"🗑️ 共享文件已清理: {file_path}")
            return data

        except Exception as e:
            print(f"⚠️ 读取共享文件失败: {e}")
            return {}


# 全局实例
_file_recorder: Optional[FileTestRecorder] = None

def get_file_recorder() -> FileTestRecorder:
    """获取文件记录器实例"""
    global _file_recorder
    if _file_recorder is None:
        _file_recorder = FileTestRecorder()
    return _file_recorder