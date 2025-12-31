import { NextResponse } from 'next/server'
import { executionQueue } from '@/lib/test-execution-queue'

/**
 * 获取队列状态
 */
export async function GET() {
  try {
    const status = executionQueue.getStatus()
    return NextResponse.json(status)
  } catch (error: any) {
    console.error('获取队列状态失败:', error)
    return NextResponse.json(
      { error: '获取队列状态失败: ' + error.message },
      { status: 500 }
    )
  }
}
