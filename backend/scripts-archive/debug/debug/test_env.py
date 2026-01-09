#!/usr/bin/env python3
import os
import sys

print("环境变量测试脚本")
print("=" * 60)

# 检查EXECUTION_ID
execution_id = os.getenv("EXECUTION_ID")
if execution_id:
    print(f"✅ EXECUTION_ID存在: {execution_id[:8]}...")
else:
    print("❌ EXECUTION_ID不存在")

# 检查其他环境变量
print(f"EXECUTION_NAME: {os.getenv('EXECUTION_NAME', '不存在')}")
print(f"DATA_SOURCE: {os.getenv('DATA_SOURCE', '不存在')}")
print("=" * 60)
