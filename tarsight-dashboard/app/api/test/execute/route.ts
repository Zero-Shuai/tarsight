import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { retryAsync, sleep, logError, ExecutionError } from '@/lib/utils/error-handler'

const execAsync = promisify(exec)

/**
 * 统一的测试执行 API
 * 支持两种执行模式：
 * - full: 完整执行模式，使用 run.py (默认)
 * - simple: 简化执行模式，直接调用 pytest
 */
export async function POST(request: NextRequest) {
  try {
    const { test_case_ids, case_ids, mode = 'full' } = await request.json()

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

    // 异步执行测试
    executeTestAsync(command, execution.id, projectRoot, supabase)

    return NextResponse.json({
      success: true,
      execution_id: execution.id,
      mode: mode,
      message: mode === 'simple' ? '测试已提交执行（简化模式）' : '测试已提交执行，请稍后查看执行历史'
    })

  } catch (error: any) {
    console.error('执行测试失败:', error)
    return NextResponse.json(
      { error: '执行测试失败: ' + error.message },
      { status: 500 }
    )
  }
}

/**
 * 异步执行测试命令（带重试机制）
 */
async function executeTestAsync(
  command: string,
  executionId: string,
  projectRoot: string,
  supabase: any
) {
  try {
    console.log('=== 开始异步执行测试 ===')
    console.log('执行命令:', command)
    console.log('工作目录:', projectRoot)
    console.log('执行ID:', executionId)

    // 使用重试机制执行命令
    const { stdout, stderr } = await retryAsync(
      async () => {
        const result = await execAsync(command, {
          env: {
            ...process.env,
            PYTHONPATH: projectRoot,
            NODE_ENV: process.env.NODE_ENV,
            EXECUTION_ID: executionId,
            TARSIGHT_EXECUTION_ID: executionId
          },
          timeout: 300000 // 5分钟超时
        })
        console.log('=== Python 执行输出 ===')
        console.log('STDOUT:', result.stdout)
        if (result.stderr) {
          console.log('STDERR:', result.stderr)
        }
        return result
      },
      {
        maxRetries: 2, // 最多重试2次
        delay: 2000,   // 初始延迟2秒
        backoff: true, // 指数退避
        onRetry: (error, attempt) => {
          console.error(`第 ${attempt} 次重试...`, error)
          logError('TestExecution', error, {
            executionId,
            attempt,
            message: `测试执行失败，正在进行第 ${attempt} 次重试...`
          })
        }
      }
    )

    console.log('=== 测试执行完成 ===')
    console.log('最终输出:', stdout)

  } catch (err: any) {
    // 所有重试都失败，记录错误并更新状态
    console.error('=== 测试执行失败 ===')
    console.error('错误信息:', err.message)
    console.error('错误堆栈:', err.stack)
    logError('TestExecution', err, {
      executionId,
      message: '测试执行失败，已达到最大重试次数'
    })

    // 更新执行状态为失败
    try {
      await supabase
        .from('test_executions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString()
        })
        .eq('id', executionId)
      console.log('已更新执行状态为失败')
    } catch (updateErr) {
      logError('DatabaseUpdate', updateErr, {
        executionId,
        message: '更新执行状态失败'
      })
    }
  }
}
