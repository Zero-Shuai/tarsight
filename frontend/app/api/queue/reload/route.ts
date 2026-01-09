import { NextResponse } from 'next/server'
import { executionQueue } from '@/lib/test-execution-queue'

/**
 * 重新加载队列配置
 */
export async function POST() {
  try {
    await executionQueue.reloadConfig()
    return NextResponse.json({
      success: true,
      message: '队列配置已重新加载'
    })
  } catch (error: any) {
    console.error('重新加载队列配置失败:', error)
    return NextResponse.json(
      { error: '重新加载配置失败: ' + error.message },
      { status: 500 }
    )
  }
}
