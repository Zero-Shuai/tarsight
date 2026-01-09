#!/usr/bin/env python3
"""修复卡住的执行记录"""
import os
import sys
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from utils.supabase_client import get_supabase_client

load_dotenv()

def fix_stuck_executions():
    """将所有 'running' 状态且超时的执行记录标记为 'failed'"""
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    client = get_supabase_client(access_token=service_key)

    # 查询所有 running 状态的执行记录
    query = """
    SELECT * FROM test_executions
    WHERE status = 'running'
    ORDER BY started_at DESC
    """
    response = client.execute_sql(query)

    executions = response.get('data', [])
    if not executions:
        print("✅ 没有卡住的执行记录")
        return

    print(f"📋 找到 {len(executions)} 个 'running' 状态的执行记录")

    fixed_count = 0
    for execution in executions:
        print(f"\n处理执行记录: {execution['execution_name']} ({execution['id'][:8]}...)")

        # 检查是否超时（超过 5 分钟）
        from datetime import datetime, timedelta
        started_at = datetime.fromisoformat(execution['started_at'].replace('Z', '+00:00'))
        timeout = datetime.now(started_at.tzinfo) - started_at > timedelta(minutes=5)

        if timeout:
            # 更新为 failed 状态
            update_query = f"""
            UPDATE test_executions
            SET status = 'failed',
                completed_at = '{datetime.now().isoformat()}'
            WHERE id = '{execution['id']}'
            """
            result = client.execute_sql(update_query)

            if not result.get('error'):
                print(f"  ✅ 已标记为失败（超时）")
                fixed_count += 1
            else:
                print(f"  ❌ 更新失败: {result.get('error')}")
        else:
            duration = datetime.now(started_at.tzinfo) - started_at
            print(f"  ⏳ 还在运行中（已运行: {duration.seconds}秒）")

    print(f"\n✅ 总共修复了 {fixed_count} 个卡住的执行记录")

if __name__ == '__main__':
    fix_stuck_executions()
