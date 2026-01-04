import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { executionQueue } from '@/lib/test-execution-queue'
import { logError } from '@/lib/utils/error-handler'

// 简单的请求去重缓存（防止短时间内的重复请求）
const requestCache = new Map<string, number>()
const REQUEST_CACHE_TTL = 2000 // 2秒内相同请求视为重复

/**
 * 统一的测试执行 API
 * 支持两种执行模式：
 * - full: 完整执行模式，使用 run.py (默认)
 * - simple: 简化执行模式，直接调用 pytest
 */
export async function POST(request: NextRequest) {
  console.log('===== API 路由被调用 =====')
  console.log('时间:', new Date().toISOString())

  try {
    const { test_case_ids, case_ids, mode = 'full' } = await request.json()
    console.log('接收到的参数:', { test_case_ids, case_ids, mode })

    // 参数验证
    if (!test_case_ids || !Array.isArray(test_case_ids) || test_case_ids.length === 0) {
      return NextResponse.json({ error: '请提供要执行的测试用例ID' }, { status: 400 })
    }

    // 生成请求缓存键（基于测试用例ID和模式）
    const cacheKey = `${test_case_ids.sort().join('-')}-${mode}`
    const now = Date.now()

    // 检查是否有重复请求（防止2秒内的重复请求）
    const lastRequestTime = requestCache.get(cacheKey)
    if (lastRequestTime && now - lastRequestTime < REQUEST_CACHE_TTL) {
      console.warn('检测到重复请求，已忽略')
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        { status: 429 }
      )
    }

    // 更新缓存
    requestCache.set(cacheKey, now)

    // 清理过期缓存（保留最近100条）
    if (requestCache.size > 100) {
      for (const [key, time] of requestCache.entries()) {
        if (now - time > REQUEST_CACHE_TTL) {
          requestCache.delete(key)
        }
      }
    }

    if (mode !== 'full' && mode !== 'simple') {
      return NextResponse.json({ error: '无效的执行模式，必须是 full 或 simple' }, { status: 400 })
    }

    const supabase = await createClient()
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

    // 获取测试用例信息
    const { data: testCases, error: tcError } = await supabase
      .from('test_cases')
      .select('*')
      .in('id', test_case_ids)
      .eq('is_active', true)

    if (tcError) throw tcError
    if (!testCases || testCases.length === 0) {
      return NextResponse.json({ error: '未找到有效的测试用例' }, { status: 404 })
    }

    // 创建执行记录
    const executionName = `手动执行 - ${new Date().toLocaleString('zh-CN')}`
    console.log(`[${new Date().toISOString()}] 准备创建执行记录: ${executionName}`)

    const { data: execution, error: execError } = await supabase
      .from('test_executions')
      .insert({
        project_id: projectId,
        execution_name: executionName,
        total_tests: testCases.length,
        started_at: new Date().toISOString(),
        status: 'running'
      })
      .select()
      .single()

    if (execError) {
      console.error('创建执行记录失败:', execError)
      throw execError
    }

    console.log(`[${new Date().toISOString()}] 执行记录已创建: ${execution.id}`)

    // 获取当前用户ID
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    // 获取环境配置
    const projectRoot = process.env.PROJECT_ROOT || '/Users/zhangshuai/WorkSpace/Tarsight/supabase_version'
    const pythonCmd = process.env.PYTHON_PATH || 'python3'

    // 构建测试用例参数
    const testCaseArgs = case_ids || testCases.map(tc => tc.case_id)
    const caseIdsStr = testCaseArgs.join(',')

    // 构建执行命令（使用前端专用脚本，传入 USER_ID）
    const command = `cd ${projectRoot} && DATA_SOURCE=supabase EXECUTION_ID="${execution.id}" CASE_IDS="${caseIdsStr}" TARGET_PROJECT="${projectId}" USER_ID="${userId}" ${pythonCmd} execute_test.py`

    // 日志
    console.log('=== 开始执行测试 ===')
    console.log('执行ID:', execution.id)
    console.log('用例IDs:', caseIdsStr)
    console.log('执行命令:', command)

    // 获取队列状态
    const queueStatus = executionQueue.getStatus()
    console.log('当前队列状态:', queueStatus)

    // 使用执行队列异步执行测试（自动控制并发数）
    console.log('提交任务到执行队列...')
    executionQueue.enqueue(command, execution.id).catch(err => {
      console.error('队列执行出错:', err)
      logError('TestExecutionQueue', err, {
        executionId: execution.id,
        message: '执行队列中的任务失败'
      })
    })
    console.log('任务已加入队列（队列中任务数:', queueStatus.queued + 1, '）')

    return NextResponse.json({
      success: true,
      execution_id: execution.id,
      queue_status: {
        running: queueStatus.running,
        queued: queueStatus.queued + 1
      },
      message: `测试已加入队列，请稍后查看执行历史。当前排队: ${queueStatus.queued + 1}`
    })

  } catch (error: any) {
    console.error('执行测试失败:', error)
    return NextResponse.json(
      { error: '执行测试失败: ' + error.message },
      { status: 500 }
    )
  }
}
