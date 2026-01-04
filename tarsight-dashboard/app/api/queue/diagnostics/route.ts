import { NextResponse } from 'next/server'
import { executionQueue } from '@/lib/test-execution-queue'

/**
 * 获取队列诊断信息
 */
export async function GET() {
  try {
    const diagnostics = executionQueue.getDiagnostics()
    return NextResponse.json(diagnostics)
  } catch (error: any) {
    return NextResponse.json(
      { error: '获取队列诊断信息失败', details: error.message },
      { status: 500 }
    )
  }
}
