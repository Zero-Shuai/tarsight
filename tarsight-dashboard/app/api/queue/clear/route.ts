import { NextResponse } from 'next/server'
import { executionQueue } from '@/lib/test-execution-queue'

/**
 * 清空队列
 */
export async function POST() {
  try {
    const clearedCount = executionQueue.clearQueue()
    return NextResponse.json({
      success: true,
      message: `已清空队列，移除了 ${clearedCount} 个任务`,
      clearedCount
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: '清空队列失败', details: error.message },
      { status: 500 }
    )
  }
}
