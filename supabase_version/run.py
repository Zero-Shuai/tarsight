#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Tarsight 测试执行器 - 新版工作流程
1. 显示数据库模块和测试用例数量
2. 用户选择执行全部或指定模块
3. 执行测试并保存到 JSON 文件
4. 将 JSON 结果导入 Supabase
"""

import os
import sys
import subprocess
import argparse
import logging
from datetime import datetime

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

from utils.supabase_client import get_supabase_client
from utils.json_test_recorder import JsonTestRecorder, get_json_recorder
from utils.file_test_recorder import FileTestRecorder
from utils.env_config import get_env_config
from utils.token_validator import validate_token_before_test

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


def show_modules_and_test_cases():
    """显示数据库中的模块和测试用例数量"""
    logger.info("🔍 正在查询数据库中的测试用例...")

    try:
        # 直接从环境变量获取项目ID
        project_id = os.getenv('TARGET_PROJECT')

        if not project_id:
            logger.error("❌ 未配置 TARGET_PROJECT 环境变量")
            return None, None

        logger.info(f"✅ 使用项目 ID: {project_id[:8]}...")

        # 使用 service_role key 绕过 RLS
        service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        client = get_supabase_client(access_token=service_key)

        # 获取模块统计
        module_stats = client.get_test_cases_by_module(project_id)

        if not module_stats:
            logger.warning("⚠️ 数据库中没有测试用例")
            return project_id, {}

        logger.info("\n📊 数据库中的测试用例模块分布:")
        logger.info("=" * 50)

        total_cases = 0
        for module, count in sorted(module_stats.items()):
            logger.info(f"   📁 {module}: {count} 个用例")
            total_cases += count

        logger.info("=" * 50)
        logger.info(f"   📈 总计: {total_cases} 个测试用例")

        return project_id, module_stats

    except Exception as e:
        logger.error(f"❌ 查询数据库失败: {e}")
        return None, None


def get_user_selection(module_stats):
    """获取用户选择的模块"""
    if not module_stats:
        logger.warning("⚠️ 没有可选择的模块")
        return []

    modules = list(module_stats.keys())

    logger.info("\n🎯 请选择要执行的测试模块:")
    logger.info(f"   0. 全部模块 ({len(modules)} 个)")

    for i, module in enumerate(modules, 1):
        count = module_stats[module]
        logger.info(f"   {i}. {module} ({count} 个用例)")

    while True:
        try:
            choice = input("\n请输入选择 (数字): ").strip()

            if choice == '0':
                logger.info(f"✅ 已选择: 全部模块")
                return modules
            elif choice.isdigit() and 1 <= int(choice) <= len(modules):
                selected_module = modules[int(choice) - 1]
                logger.info(f"✅ 已选择: {selected_module}")
                return [selected_module]
            else:
                logger.warning("❌ 无效选择，请重新输入")

        except KeyboardInterrupt:
            logger.info("\n👋 用户取消操作")
            sys.exit(0)
        except Exception as e:
            logger.error(f"❌ 输入错误: {e}")


def run_tests_and_save_to_json(selected_modules, execution_name, case_ids=None):
    """运行测试并保存到 JSON 文件"""
    logger.info(f"\n🚀 开始执行测试: {execution_name}")
    logger.info(f"📋 选择的模块: {', '.join(selected_modules)}")
    if case_ids:
        logger.info(f"📋 指定的用例ID: {case_ids}")

    # 创建 JSON 文件路径并初始化记录器
    json_file = JsonTestRecorder.create_json_file(execution_name)
    json_recorder = JsonTestRecorder()  # 这会自动从环境变量读取文件路径

    # 设置环境变量
    env = os.environ.copy()
    env['JSON_RECORDING'] = 'true'
    env['TARSIGHT_JSON_RESULTS_FILE'] = json_file
    env['EXECUTION_NAME'] = execution_name
    env['DATA_SOURCE'] = 'supabase'  # 使用Supabase作为数据源

    # 传递EXECUTION_ID给pytest进程（如果有）
    execution_id = os.getenv("EXECUTION_ID")
    if execution_id:
        env['EXECUTION_ID'] = execution_id
        logger.info(f"✅ EXECUTION_ID已传递: {execution_id[:8]}...")

    # 如果选择了特定模块，设置过滤
    if len(selected_modules) == 1:
        # 单个模块时设置过滤
        env['TARGET_MODULE'] = selected_modules[0]

    # 如果指定了用例ID，设置过滤
    if case_ids:
        env['TARGET_CASE_IDS'] = case_ids

    logger.info(f"\n📋 执行命令: python -m pytest utils/test_tarsight.py -v --alluredir=reports/allure-results --html=reports/test_report.html --self-contained-html")
    logger.info("=" * 60)

    try:
        # 运行测试 - 优先使用虚拟环境，否则使用系统 Python
        venv_python = os.path.join(project_root, '.venv', 'bin', 'python')
        if not os.path.exists(venv_python):
            venv_python = os.path.join(project_root, '.venv', 'Scripts', 'python.exe')  # Windows

        # 如果虚拟环境不存在，使用系统 Python
        python_cmd = venv_python if os.path.exists(venv_python) else sys.executable
        logger.info(f"🐍 使用 Python: {python_cmd}")

        cmd = [
            python_cmd, "-m", "pytest",
            "utils/test_tarsight.py",
            "-v",
            "--alluredir=reports/allure-results",
            "--html=reports/test_report.html",
            "--self-contained-html"
        ]

        result = subprocess.run(cmd, env=env, cwd=project_root)

        logger.info("=" * 60)

        if result.returncode == 0:
            logger.info("✅ 测试执行完成")
        else:
            logger.warning(f"⚠️ 测试执行完成，但有失败 (退出码: {result.returncode})")

        # 保存结果到 JSON
        logger.info(f"\n💾 正在保存测试结果到 JSON 文件...")

        # 使用全局实例来保存
        global_recorder = get_json_recorder()
        if global_recorder and global_recorder.test_results:
            success = global_recorder.save_to_file()
        else:
            logger.warning("⚠️ 没有测试结果被记录")
            success = False

        if success:
            return json_file
        else:
            return None

    except Exception as e:
        logger.error(f"❌ 测试执行失败: {e}")
        return None


def import_json_to_supabase(json_file_path, project_id, execution_name):
    """将 JSON 结果导入到 Supabase"""
    logger.info(f"\n📥 开始将 JSON 结果导入 Supabase...")

    try:
        # 使用 service_role key 绕过 RLS
        service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        client = get_supabase_client(access_token=service_key)

        # 检查是否已有执行记录（从前端API传入）
        execution_id = os.getenv("EXECUTION_ID")

        if execution_id:
            logger.info(f"✅ 使用已创建的执行记录: {execution_id[:8]}...")
        else:
            # 创建执行记录（手动执行模式）
            execution_id = client.create_test_execution(project_id, execution_name)
            if not execution_id:
                logger.error("❌ 无法创建执行记录")
                return False
            logger.info(f"✅ 创建执行记录: {execution_id[:8]}...")

        # 导入 JSON 结果
        success = client.import_json_results(execution_id, json_file_path)

        if success:
            logger.info("✅ JSON 结果已成功导入 Supabase")
        else:
            logger.error("❌ JSON 结果导入失败")

        return success

    except Exception as e:
        logger.error(f"❌ 导入 Supabase 失败: {e}")
        return False


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="Tarsight 测试执行器 - 新版工作流程")
    parser.add_argument(
        "--name", "-n",
        help="指定测试执行名称"
    )
    parser.add_argument(
        "--no-import",
        action="store_true",
        help="测试执行后不自动导入结果到Supabase"
    )
    parser.add_argument(
        "--all", "-a",
        action="store_true",
        help="自动运行所有模块的测试，跳过交互式选择"
    )
    parser.add_argument(
        "--case-ids",
        help="指定要执行的测试用例ID列表（用逗号分隔），例如: API001,API002"
    )
    parser.add_argument(
        "--skip-token-check",
        action="store_true",
        help="跳过 API Token 验证（用于自动化执行场景）"
    )

    args = parser.parse_args()

    logger.info("🔧 Tarsight 测试执行器 (新版工作流程)")
    logger.info("=" * 60)

    # 0. 验证 API Token（除非指定跳过）
    logger.info("")
    if not args.skip_token_check:
        if not validate_token_before_test():
            logger.error("❌ API Token 无效，无法执行测试")
            logger.info("💡 请更新 .env 文件中的 API_TOKEN 后重试")
            return
    else:
        logger.info("⏭️  跳过 API Token 验证（自动化执行模式）")


    # 检查 Supabase 配置
    try:
        # 使用 service_role key 绕过 RLS
        service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        client = get_supabase_client(access_token=service_key)
        logger.info(f"✅ Supabase 配置已找到: {client.supabase_url}")
    except Exception as e:
        logger.error(f"❌ Supabase 配置错误: {e}")
        logger.info("💡 请确保已设置 .env.supabase 文件中的 SUPABASE_URL 和 SUPABASE_ANON_KEY")
        return

    # 1. 显示模块和测试用例数量
    project_id, module_stats = show_modules_and_test_cases()
    if not project_id:
        return

    # 2. 用户选择模块（如果使用 --all 参数，自动选择所有模块）
    # 如果指定了 --case-ids，则自动选择所有模块
    if args.case_ids:
        selected_modules = list(module_stats.keys()) if module_stats else []
        if selected_modules:
            logger.info(f"\n✅ 指定了用例ID，自动选择所有模块")
    elif args.all:
        selected_modules = list(module_stats.keys()) if module_stats else []
        if selected_modules:
            logger.info(f"\n✅ 自动选择所有模块: {', '.join(selected_modules)}")
    else:
        selected_modules = get_user_selection(module_stats)

    if not selected_modules:
        logger.info("👋 没有选择任何模块，退出")
        return

    # 3. 执行测试并保存到 JSON
    execution_name = args.name or f"测试执行 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"

    # 检查EXECUTION_ID环境变量（调试）
    execution_id_check = os.getenv("EXECUTION_ID")
    if execution_id_check:
        logger.info(f"🔑 主进程检测到EXECUTION_ID: {execution_id_check[:8]}...")
    else:
        logger.info(f"⚠️ 主进程未检测到EXECUTION_ID，将创建新记录")

    json_file = run_tests_and_save_to_json(selected_modules, execution_name, case_ids=args.case_ids)

    if not json_file:
        logger.error("❌ 测试执行失败或没有生成结果文件")
        return

    # 4. 自动导入 JSON 结果到 Supabase（除非指定 --no-import）
    if not args.no_import:
        logger.info(f"\n📥 自动导入测试结果到 Supabase...")
        import_success = import_json_to_supabase(json_file, project_id, execution_name)
    else:
        logger.info(f"\n📄 测试结果已保存到 JSON 文件，跳过导入（使用了 --no-import 参数）")
        import_success = True

    logger.info(f"\n🎉 测试执行器工作完成!")
    if json_file and os.path.exists(json_file):
        logger.info(f"📄 JSON 结果文件: {json_file}")

    return import_success


if __name__ == "__main__":
    main()