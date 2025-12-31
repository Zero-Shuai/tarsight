import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { executionQueue } from '@/lib/test-execution-queue'
import { logError } from '@/lib/utils/error-handler'

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

    if (execError) throw execError

    // 获取环境配置
    const projectRoot = process.env.PROJECT_ROOT || '/Users/zhangshuai/WorkSpace/Tarsight/supabase_version'
    const pythonCmd = process.env.PYTHON_PATH || 'python3'
    // 检查 Python 是否可用（支持虚拟环境和系统 Python）
    const venvExists = require('fs').existsSync(pythonCmd) || pythonCmd === 'python3' || pythonCmd === '/usr/bin/python3'

    // 构建测试用例参数
    const testCaseArgs = case_ids || testCases.map(tc => tc.case_id)
    const caseIdsStr = testCaseArgs.join(',')

    // 根据模式选择执行命令
    let command: string
    if (mode === 'simple') {
      // 简化模式：直接调用 pytest
      command = venvExists
        ? `cd ${projectRoot} && EXECUTION_ID="${execution.id}" ${pythonCmd} -m pytest utils/test_tarsight.py -v --tb=short -k "${caseIdsStr}"`
        : `cd ${projectRoot} && EXECUTION_ID="${execution.id}" PYTHONPATH=. python3 -m pytest utils/test_tarsight.py -v --tb=short -k "${caseIdsStr}"`
    } else {
      // 完整模式：使用 run.py
      command = venvExists
        ? `cd ${projectRoot} && ${pythonCmd} run.py --case-ids="${caseIdsStr}" --name="${executionName}" --skip-token-check`
        : `cd ${projectRoot} && PYTHONPATH=. python3 run.py --case-ids="${caseIdsStr}" --name="${executionName}" --skip-token-check`
    }

    // 日志
    console.log('=== 开始执行测试 ===')
    console.log('执行ID:', execution.id)
    console.log('执行模式:', mode)
    console.log('用例IDs:', caseIdsStr)
    console.log('执行名称:', executionName)
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
      mode: mode,
      queue_status: {
        running: queueStatus.running,
        queued: queueStatus.queued + 1
      },
      message: mode === 'simple'
        ? `测试已加入队列（简化模式），当前排队: ${queueStatus.queued + 1}`
        : `测试已加入队列，请稍后查看执行历史。当前排队: ${queueStatus.queued + 1}`
    })

  } catch (error: any) {
    console.error('执行测试失败:', error)
    return NextResponse.json(
      { error: '执行测试失败: ' + error.message },
      { status: 500 }
    )
  }
}
