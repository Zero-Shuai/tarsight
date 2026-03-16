#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
前端专用测试执行脚本
职责：执行测试并更新结果到 Supabase
不创建新的执行记录（由前端 API 创建）
"""

import os
import sys
import subprocess
import logging
import requests
from datetime import datetime, timezone

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

from utils.supabase_client import get_supabase_client
from utils.json_test_recorder import JsonTestRecorder, get_json_recorder
from utils.env_config import get_env_config

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


def validate_api_token(base_url: str, api_token: str) -> tuple[bool, str]:
    """
    验证 API Token 是否有效

    Args:
        base_url: API 基础URL
        api_token: API Token

    Returns:
        (is_valid, error_message): 验证结果和错误信息
    """
    try:
        logger.info("🔍 正在验证 API Token...")

        # 使用一个轻量级的端点验证 token
        response = requests.get(
            f"{base_url}/api/charts/post_category/all_enums",
            headers={
                'Authorization': f'Bearer {api_token}',
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            timeout=10
        )

        # 检查 HTTP 状态码
        if response.status_code == 404:
            return False, "❌ API 端点不存在，请检查项目配置中的 API 地址"
        elif response.status_code >= 500:
            return False, f"❌ API 服务器错误，状态码: {response.status_code}"

        # 尝试解析 JSON 响应
        try:
            data = response.json()

            # 检查响应体中的 code 字段
            code = data.get('code')
            if code == 1001:
                # code 1001 表示 token 失效
                message = data.get('message', 'User session has expired or been logged out')
                return False, f"❌ Token 已失效: {message}"

            # 检查 success 字段
            if not data.get('success', True):
                message = data.get('message', 'Unknown error')
                return False, f"❌ API 返回错误: {message} (code: {code})"

        except ValueError:
            # 如果无法解析 JSON，检查 content-type
            content_type = response.headers.get('content-type', '')
            if 'application/json' not in content_type:
                return False, "❌ API 返回了非 JSON 格式的数据，请检查 API 地址配置"

        logger.info("✅ Token 验证通过")
        return True, ""

    except requests.exceptions.Timeout:
        return False, "❌ Token 验证超时，请检查网络连接或 API 地址"
    except requests.exceptions.ConnectionError:
        return False, "❌ 无法连接到 API 服务器，请检查 API 地址是否正确"
    except Exception as e:
        return False, f"❌ Token 验证出错: {str(e)}"


def execute_pytest(case_ids: str, execution_id: str, project_id: str) -> bool:
    """
    执行 pytest 测试

    Args:
        case_ids: 测试用例ID，逗号分隔（如 "TARSIGHT-POSTLIST-001,TARSIGHT-QUICKSEARCH-001"）
        execution_id: 执行记录ID（由前端传入）
        project_id: 项目ID

    Returns:
        bool: 执行是否成功
    """
    try:
        logger.info(f"{'='*60}")
        logger.info(f"开始执行测试")
        logger.info(f"执行ID: {execution_id[:8]}...")
        logger.info(f"测试用例: {case_ids}")
        logger.info(f"{'='*60}")

        # 0. 获取 API Token（优先从用户配置读取，其次从环境变量）
        api_token = None
        user_id = os.getenv('USER_ID')  # 从环境变量获取用户ID（由前端传入）

        if user_id:
            try:
                service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
                client = get_supabase_client(access_token=service_key)
                result = client._make_request(
                    'GET',
                    'user_configs',
                    params={'user_id': f'eq.{user_id}', 'select': 'api_token'}
                )

                if result.get('data') and len(result['data']) > 0:
                    api_token = result['data'][0].get('api_token')
                    if api_token:
                        logger.info("✅ 从用户配置读取 API Token")
                        # 关键：设置到环境变量，确保测试代码能使用
                        os.environ['API_TOKEN'] = api_token
            except Exception as e:
                logger.warning(f"从用户配置读取 token 失败: {e}")

        # 如果没有从用户配置获取到，使用环境变量中的 token
        if not api_token:
            env_config = get_env_config()
            api_token = env_config.api_token
            logger.info("⚠️ 使用环境变量中的 API Token")

        base_url = os.getenv('BASE_URL', 'https://t-stream-iq.tarsv.com')

        # 验证 Token 有效性
        is_valid, error_msg = validate_api_token(base_url, api_token)

        if not is_valid:
            logger.error(error_msg)
            # 更新执行记录状态为失败
            service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            client = get_supabase_client(access_token=service_key)
            client._make_request(
                'PATCH',
                'test_executions',
                data={
                    'status': 'failed',
                    'completed_at': datetime.now(timezone.utc).isoformat(),
                    'error_message': error_msg,
                    'total_tests': 1,  # 标记为计划执行了1个测试
                    'failed_tests': 1  # 标记为失败
                },
                params={'id': f'eq.{execution_id}'}
            )
            return False

        # 1. 创建 JSON 记录器
        json_file = JsonTestRecorder.create_json_file(execution_id)
        logger.info(f"✅ JSON 结果文件: {json_file}")

        # 1.5 创建新的共享结果文件（清空旧数据）
        shared_results_file = os.path.join(project_root, 'reports', f'shared_results_{execution_id}.json')
        import json as json_module
        os.makedirs(os.path.dirname(shared_results_file), exist_ok=True)

        # 初始化空的共享文件
        initial_data = {
            'execution_name': f"测试执行 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            'created_at': datetime.now(timezone.utc).isoformat(),
            'execution_id': execution_id,
            'test_results': []
        }
        with open(shared_results_file, 'w', encoding='utf-8') as f:
            json_module.dump(initial_data, f, ensure_ascii=False, indent=2)

        logger.info(f"✅ 已创建新的共享结果文件: {shared_results_file}")

        # 2. 设置环境变量
        env = os.environ.copy()
        env['EXECUTION_ID'] = execution_id
        env['TARSIGHT_EXECUTION_ID'] = execution_id  # 关键：防止 conftest.py 创建新记录
        env['PROJECT_ID'] = project_id
        env['JSON_OUTPUT'] = json_file
        env['TARGET_CASE_IDS'] = case_ids  # 关键：用环境变量过滤用例
        env['TARSIGHT_JSON_RESULTS_FILE'] = json_file  # 关键：启用 JSON 记录器
        env['DATA_SOURCE'] = 'supabase'  # 关键：从 Supabase 读取测试用例
        env['TARSIGHT_SHARED_RECORDER_FILE'] = shared_results_file  # 关键：使用独立的共享文件

        # 3. 构建 pytest 命令（不使用 -k 参数，通过环境变量过滤）
        pytest_cmd = [
            sys.executable,
            '-m', 'pytest',
            'utils/test_tarsight.py',
            '-v',
            '--tb=short'
        ]

        logger.info(f"📝 执行命令: {' '.join(pytest_cmd)}")
        logger.info(f"📝 TARSIGHT_SHARED_RECORDER_FILE: {env.get('TARSIGHT_SHARED_RECORDER_FILE', 'NOT_SET')}")

        # 4. 执行测试
        result = subprocess.run(
            pytest_cmd,
            cwd=project_root,
            env=env,
            capture_output=True,
            text=True
        )

        # 5. 输出测试结果
        if result.stdout:
            logger.info(result.stdout)

        if result.stderr:
            logger.error(result.stderr)

        # 6. 检查执行状态
        exit_code = result.returncode
        logger.info(f"测试执行完成，退出码: {exit_code}")

        # 6.5 从共享结果文件中提取本次执行的结果
        logger.info("正在提取测试结果...")
        import json
        # 使用环境变量中的共享文件路径（之前创建的独立文件）
        shared_results_file = env.get('TARSIGHT_SHARED_RECORDER_FILE')

        if shared_results_file and os.path.exists(shared_results_file):
            with open(shared_results_file, 'r', encoding='utf-8') as f:
                shared_data = json.load(f)

            # 获取所有测试结果
            all_results = shared_data.get('test_results', [])
            logger.info(f"📊 共享文件中有 {len(all_results)} 个测试结果")

            # 如果有结果，保存到本次执行专用的 JSON 文件
            if all_results:
                # 准备本次执行的数据
                execution_data = {
                    'execution_name': os.environ.get('EXECUTION_NAME', f"测试执行 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"),
                    'created_at': datetime.now(timezone.utc).isoformat(),
                    'execution_id': execution_id,
                    'total_tests': len(all_results),
                    'passed_tests': len([r for r in all_results if r.get('status') == 'passed']),
                    'failed_tests': len([r for r in all_results if r.get('status') == 'failed']),
                    'skipped_tests': len([r for r in all_results if r.get('status') == 'skipped']),
                    'test_results': all_results
                }

                # 保存到本次执行专用的文件
                os.makedirs(os.path.dirname(json_file), exist_ok=True)
                with open(json_file, 'w', encoding='utf-8') as f:
                    json.dump(execution_data, f, ensure_ascii=False, indent=2)

                logger.info(f"✅ 测试结果已保存到: {json_file}")
                logger.info(f"   📊 总计: {execution_data['total_tests']} 个测试")
                logger.info(f"   ✅ 成功: {execution_data['passed_tests']} 个")
                logger.info(f"   ❌ 失败: {execution_data['failed_tests']} 个")
                logger.info(f"   ⏭️ 跳过: {execution_data['skipped_tests']} 个")
            else:
                logger.warning("⚠️ 共享文件中没有测试结果")
        else:
            logger.warning(f"⚠️ 共享结果文件不存在: {shared_results_file}")

        # 7. 导入结果到 Supabase
        logger.info(f"正在导入测试结果到 Supabase...")
        service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        client = get_supabase_client(access_token=service_key)

        success = True
        has_results = os.path.exists(json_file) and os.path.getsize(json_file) > 0

        if has_results:
            success = client.import_json_results(execution_id, json_file)
            if success:
                logger.info("✅ 测试结果已成功导入 Supabase")
            else:
                logger.error("❌ 测试结果导入失败")
                success = False
        else:
            logger.info("ℹ️ 没有测试结果需要导入，标记执行完成")

        # 8. 更新执行记录状态（无论成功或失败都要更新）
        logger.info(f"正在更新执行记录状态...")

        # 确定最终状态
        final_status = 'completed' if exit_code == 0 else 'failed'

        if has_results:
            # 有测试结果的情况，使用 update_execution_status 更新统计信息
            update_success = client.update_execution_status(
                execution_id=execution_id,
                json_file_path=json_file,
                status=final_status
            )
            if not update_success:
                logger.error(f"❌ 更新执行状态失败")
            else:
                logger.info(f"✅ 执行状态已更新为: {final_status}")
        else:
            # 没有测试结果的情况
            result = client._make_request(
                'PATCH',
                'test_executions',
                data={
                    'status': final_status,
                    'completed_at': datetime.now(timezone.utc).isoformat(),
                    'total_tests': 0,
                    'passed_tests': 0,
                    'failed_tests': 0,
                    'skipped_tests': 0
                },
                params={'id': f'eq.{execution_id}'}
            )
            if result.get('error'):
                logger.error(f"❌ 更新执行记录失败: {result.get('error')}")
            else:
                logger.info(f"✅ 执行状态已更新为: {final_status}（0个测试）")

        # 如果测试执行成功（退出码为0），则返回成功
        # 即使导入或更新失败，只要测试本身通过了就算成功
        return exit_code == 0

    except Exception as e:
        logger.error(f"❌ 执行测试失败: {e}")
        import traceback
        traceback.print_exc()

        # 异常情况下也要更新执行记录为失败状态
        try:
            service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            client = get_supabase_client(access_token=service_key)
            client._make_request(
                'PATCH',
                'test_executions',
                data={
                    'status': 'failed',
                    'completed_at': datetime.now(timezone.utc).isoformat(),
                    'error_message': str(e),
                    'total_tests': 1,  # 标记为计划执行了1个测试
                    'failed_tests': 1  # 标记为失败
                },
                params={'id': f'eq.{execution_id}'}
            )
            logger.info("✅ 已将执行记录标记为失败")
        except Exception as update_error:
            logger.error(f"❌ 更新执行记录失败: {update_error}")

        return False


def main():
    """主函数"""
    # 从环境变量获取参数
    execution_id = os.getenv('EXECUTION_ID')
    case_ids = os.getenv('CASE_IDS', '')
    project_id = os.getenv('TARGET_PROJECT')

    # 验证必要参数
    if not execution_id:
        logger.error("❌ 缺少必要参数: EXECUTION_ID")
        logger.error("提示：此脚本需要由前端 API 调用，不应手动执行")
        return False

    if not case_ids:
        logger.error("❌ 缺少必要参数: CASE_IDS")
        return False

    if not project_id:
        logger.error("❌ 缺少必要参数: TARGET_PROJECT")
        return False

    # 执行测试
    success = execute_pytest(case_ids, execution_id, project_id)

    return success


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
