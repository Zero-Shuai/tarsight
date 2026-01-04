import { NextResponse } from 'next/server'
import { executionQueue } from '@/lib/test-execution-queue'

/**
 * 重置队列状态（紧急恢复用）
 */
export async function POST() {
  try {
    await executionQueue.reset()
    return NextResponse.json({
      success: true,
      message: '队列状态已重置'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: '重置队列失败', details: error.message },
      { status: 500 }
    )
  }
}
