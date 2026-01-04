#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
测试脚本 - 验证修复效果
"""

import os
import sys

# 设置测试环境变量
os.environ['EXECUTION_ID'] = 'test-fix-verification'
os.environ['CASE_IDS'] = 'TS020'
os.environ['TARGET_PROJECT'] = '8786c21f-7437-4a2d-8486-9365a382b38e'
os.environ['DATA_SOURCE'] = 'supabase'
os.environ['TARSIGHT_SHARED_RECORDER_FILE'] = 'reports/test_fix.json'

# 创建一个测试 token（无效的 token，用于测试失败场景）
os.environ['API_TOKEN'] = 'Bearer invalid_test_token_12345'

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

# 导入测试模块
from utils import test_tarsight
from utils.config_manager import config

# 打印当前配置
print("\n" + "="*60)
print("📋 当前配置")
print("="*60)
print(f"API Token: {config.api_token[:20]}...")
print(f"Headers: {config.headers}")
print("="*60 + "\n")

# 验证 token 是否被正确设置
assert config.api_token == 'Bearer invalid_test_token_12345', "Token 未正确设置"
assert config.headers['Authorization'] == 'Bearer invalid_test_token_12345', "Headers 中的 Token 未正确设置"

print("✅ 配置验证通过")
print("\n开始测试 TS020 用例（预期应该失败，因为 token 无效）...")
print("="*60 + "\n")
