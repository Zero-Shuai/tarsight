#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
共享测试记录器 - 使用文件系统在进程间共享测试结果
"""

import os
import json
import tempfile
import threading
from datetime import datetime
from typing import Dict, List, Any, Optional

class SharedTestRecorder:
    """共享测试记录��� - 使用临时文件在进程间共享状态"""

    def __init__(self):
        """初始化共享记录器"""
        # 创建临时文件来存储测试结果
        self.temp_file = tempfile.mktemp(suffix='.json', prefix='tarsight_test_results_')
        self.lock = threading.Lock()
        self.execution_id = None

    def start_execution(self, execution_name: str = None) -> Optional[str]:
        """开始测试执行并记录执行ID"""
        with self.lock:
            # 初始化临时文件
            initial_data = {
                'execution_name': execution_name or f"测试执行 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                'execution_id': None,
                'started_at': datetime.now().isoformat(),
                'test_results': [],
                'completed': False
            }

            with open(self.temp_file, 'w', encoding='utf-8') as f:
                json.dump(initial_data, f, ensure_ascii=False, indent=2)

            print(f"✅ 共享记录器已初始化: {self.temp_file}")
            return self.temp_file

    def set_execution_id(self, execution_id: str):
        """设置执行ID"""
        with self.lock:
            data = self._load_data()
            if data:
                data['execution_id'] = execution_id
                self.execution_id = execution_id
                self._save_data(data)

    def add_test_result(self, test_result: Dict[str, Any]):
        """添加测试结果"""
        with self.lock:
            data = self._load_data()
            if data:
                data['test_results'].append(test_result)
                self._save_data(data)
                print(f"📝 测试结果已添加到共享记录器 (总计: {len(data['test_results'])})")

    def complete_execution(self):
        """标记执行完成"""
        with self.lock:
            data = self._load_data()
            if data:
                data['completed'] = True
                data['completed_at'] = datetime.now().isoformat()
                self._save_data(data)

    def _load_data(self) -> Optional[Dict[str, Any]]:
        """加载数据"""
        try:
            if os.path.exists(self.temp_file):
                with open(self.temp_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            print(f"⚠️ 加载共享数据失败: {e}")
        return None

    def _save_data(self, data: Dict[str, Any]):
        """保存数据"""
        try:
            with open(self.temp_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"⚠️ 保存共享数据失败: {e}")

    def get_results_and_cleanup(self) -> Dict[str, Any]:
        """获取结果并清理文件"""
        with self.lock:
            data = self._load_data()
            if data and os.path.exists(self.temp_file):
                try:
                    os.unlink(self.temp_file)
                    print(f"🗑️ 临时文件已清理: {self.temp_file}")
                except Exception as e:
                    print(f"⚠️ 清理临时文件失败: {e}")
            return data or {}

# 全局共享记录器实例
_shared_recorder: Optional[SharedTestRecorder] = None

def get_shared_recorder() -> SharedTestRecorder:
    """获取全局共享记录器实例"""
    global _shared_recorder
    if _shared_recorder is None:
        _shared_recorder = SharedTestRecorder()
    return _shared_recorder