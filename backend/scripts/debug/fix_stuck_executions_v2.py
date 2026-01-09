#!/usr/bin/env python3
"""修复卡住的执行记录 - 使用正确的API"""
import os
import sys
from dotenv import load_dotenv
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from utils.supabase_client import get_supabase_client

load_dotenv()

def fix_stuck_executions():
    """将所有 'running' 状态且超时的执行记录标记为 'failed'"""
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    client = get_supabase_client(access_token=service_key)

    # 查询所有 running 状态的执行记录
    result = client._make_request('GET', 'test_executions', params={
        'status': 'eq.running',
        'order': 'started_at.desc'
    })

    executions = result.get('data', [])
    if not executions:
        print("✅ 没有卡住的执行记录")
        return

    print(f"📋 找到 {len(executions)} 个 'running' 状态的执行记录")

    fixed_count = 0
    for execution in executions:
        exec_id = execution['id']
        exec_name = execution['execution_name']
        started_at = execution['started_at']

        print(f"\n处理执行记录: {exec_name} ({exec_id[:8]}...)")

        # 检查是否超时（超过 5 分钟）
        start_time = datetime.fromisoformat(started_at.replace('Z', '+00:00'))
        now = datetime.now(start_time.tzinfo)
        duration = now - start_time

        if duration > timedelta(minutes=5):
            print(f"  运行时长: {duration.seconds}秒")
            print(f"  状态: 已超时，标记为失败")

            # 更新为 failed
            update_result = client._make_request(
                'PATCH',
                'test_executions',
                data={
                    'status': 'failed',
                    'completed_at': datetime.now().isoformat()
                },
                params={'id': f'eq.{exec_id}'}
            )

            if not update_result.get('error'):
                print(f"  ✅ 已更新为失败状态")
                fixed_count += 1
            else:
                print(f"  ❌ 更新失败: {update_result.get('error')}")
        else:
            print(f"  ⏳ 还在运行中（已运行: {duration.seconds}秒）")

    print(f"\n✅ 总共修复了 {fixed_count} 个卡住的执行记录")

if __name__ == '__main__':
    fix_stuck_executions()
