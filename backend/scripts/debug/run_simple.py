#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
简化的测试运行器 - 直接从 CSV 运行测试
不依赖数据库查询，直接读取 CSV 文件并执行
"""

import os
import sys
import subprocess
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

def run_tests():
    """直接运行 pytest 测试"""
    print("🚀 Tarsight 测试执行器")
    print("=" * 50)

    # 检查环境变量
    if not os.getenv('BASE_URL'):
        print("❌ 未配置 BASE_URL 环境变量")
        return

    if not os.getenv('API_TOKEN'):
        print("❌ 未配置 API_TOKEN 环境变量")
        return

    print(f"✅ Base URL: {os.getenv('BASE_URL')}")
    print(f"✅ API Token: {'***已设置***'}")
    print()

    # 运行 pytest
    print("🧪 开始执行测试...")
    print()

    # 使用 pytest 运行测试
    test_file = project_root / "utils" / "test_tarsight.py"

    if not test_file.exists():
        print(f"❌ 测试文件不存在: {test_file}")
        return

    # 构建 pytest 命令
    cmd = [
        "python", "-m", "pytest",
        str(test_file),
        "-v",
        "--tb=short",
        "-s"
    ]

    print(f"📝 执行命令: {' '.join(cmd)}")
    print()

    # 执行测试
    result = subprocess.run(cmd, cwd=project_root)

    print()
    print("=" * 50)
    if result.returncode == 0:
        print("✅ 测试完成")
    else:
        print(f"❌ 测试失败 (退出码: {result.returncode})")

    return result.returncode

if __name__ == "__main__":
    run_tests()
