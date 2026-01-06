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
    const {
      test_case_ids,  // 用于 specific 模式
      case_ids,       // 业务ID数组
      mode = 'full',  // 执行模式：full | simple
      // 新增参数
      execution_type = 'specific',  // 执行类型：specific | all | modules | levels
      module_ids,                 // 模块ID列表（modules 模式）
      module_names,               // 模块名称列表（便于显示）
      levels                      // 等级列表（levels 模式，如 ['P0','P1']）
    } = await request.json()

    console.log('接收到的参数:', {
      execution_type,
      module_ids,
      module_names,
      levels,
      test_case_ids,
      case_ids,
      mode
    })

    // 参数验证
    if (!execution_type) {
      return NextResponse.json({ error: '请指定执行模式' }, { status: 400 })
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

    // 根据执行类型获取测试用例
    let selectedCaseIds: string[] = []
    let testCases: any[] = []

    switch (execution_type) {
      case 'specific':
        // 单个或多个指定用例
        if (!test_case_ids || test_case_ids.length === 0) {
          return NextResponse.json({ error: '请指定要执行的测试用例' }, { status: 400 })
        }
        selectedCaseIds = test_case_ids

        const { data: specificCases, error: specificError } = await supabase
          .from('test_cases')
          .select('*')
          .in('id', selectedCaseIds)
          .eq('is_active', true)

        if (specificError) throw specificError
        testCases = specificCases || []
        break

      case 'all':
        // 全部用例
        const { data: allCases, error: allError } = await supabase
          .from('test_cases')
          .select('id, case_id')
          .eq('is_active', true)

        if (allError) throw allError
        testCases = allCases || []
        selectedCaseIds = testCases.map(c => c.id)
        break

      case 'modules':
        // 多模块用例
        if (!module_ids || module_ids.length === 0) {
          return NextResponse.json({ error: '请选择要执行的模块' }, { status: 400 })
        }

        const { data: moduleCases, error: moduleError } = await supabase
          .from('test_cases')
          .select('id, case_id, module_id, modules(name)')
          .in('module_id', module_ids)
          .eq('is_active', true)

        if (moduleError) throw moduleError
        testCases = moduleCases || []
        selectedCaseIds = testCases.map(c => c.id)
        break

      case 'levels':
        // 按等级用例
        if (!levels || levels.length === 0) {
          return NextResponse.json({ error: '请选择要执行的等级' }, { status: 400 })
        }

        const { data: levelCases, error: levelError } = await supabase
          .from('test_cases')
          .select('id, case_id, level')
          .in('level', levels)
          .eq('is_active', true)

        if (levelError) throw levelError
        testCases = levelCases || []
        selectedCaseIds = testCases.map(c => c.id)
        break

      default:
        return NextResponse.json({ error: '无效的执行类型' }, { status: 400 })
    }

    if (selectedCaseIds.length === 0) {
      return NextResponse.json({ error: '未找到符合条件的测试用例' }, { status: 404 })
    }

    // 创建执行记录
    const executionTypeNames = {
      'specific': '指定用例',
      'all': '全部用例',
      'modules': `模块(${module_names?.join(',') || module_ids?.join(',')})`,
      'levels': `等级(${levels?.join(',')})`
    }
    const executionName = `${executionTypeNames[execution_type]}执行 - ${new Date().toLocaleString('zh-CN')}`
    console.log(`[${new Date().toISOString()}] 准备创建执行记录: ${executionName}`)

    const { data: execution, error: execError } = await supabase
      .from('test_executions')
      .insert({
        project_id: projectId,
        execution_name: executionName,
        total_tests: selectedCaseIds.length,
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

    // 构建模块名称和等级的环境变量
    const moduleNamesStr = module_names?.join(',') || ''
    const levelsStr = levels?.join(',') || ''

    // 构建环境变量
    const envVars = [
      `DATA_SOURCE=supabase`,
      `EXECUTION_ID="${execution.id}"`,
      `CASE_IDS="${caseIdsStr}"`,
      `TARGET_PROJECT="${projectId}"`,
      `USER_ID="${userId}"`
    ]

    // 添加模块过滤环境变量（如果有）
    if (moduleNamesStr) {
      envVars.push(`TARGET_MODULES="${moduleNamesStr}"`)
    }

    // 添加等级过滤环境变量（如果有）
    if (levelsStr) {
      envVars.push(`TARGET_LEVELS="${levelsStr}"`)
    }

    // 构建执行命令
    const command = `cd ${projectRoot} && ${envVars.join(' ')} ${pythonCmd} execute_test.py`

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
