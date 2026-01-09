import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { previewCache as cache } from '@/lib/cache/query-cache'

/**
 * 测试执行预览 API
 * 返回将要执行的测试用例数量、预计耗时、涉及模块和等级
 */

const CACHE_PREFIX = 'preview_query'
export async function POST(request: NextRequest) {
  console.log('===== 测试执行预览 API =====')
  console.log('时间:', new Date().toISOString())

  try {
    const {
      execution_type,  // 执行类型：specific | all | modules | levels
      module_ids,      // 模块ID列表
      levels,          // 等级列表
      test_case_ids    // 测试用例UUID列表（specific 模式）
    } = await request.json()

    console.log('接收到的参数:', { execution_type, module_ids, levels, test_case_ids })

    // 参数验证
    if (!execution_type) {
      return NextResponse.json({ error: '请指定执行模式' }, { status: 400 })
    }

    const supabase = await createClient()
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

    console.log('Project ID:', projectId)

    let total_cases = 0
    let modules: string[] = []
    let levels_found: string[] = []

    // 根据执行类型查询测试用例
    switch (execution_type) {
      case 'all': {
        // 全部用例 - try cache first
        const cacheKeyAll = { type: 'all' }
        let allCases = cache.get(CACHE_PREFIX, cacheKeyAll)

        if (!allCases) {
          const { data, error } = await supabase
            .from('test_cases')
            .select('id, level, module_id, modules(name)')
            .eq('project_id', projectId)
            .eq('is_active', true)

          console.log('All cases query result:', { data, error })

          if (error) throw error
          allCases = data
          cache.set(CACHE_PREFIX, cacheKeyAll, allCases)
        }

        total_cases = allCases?.length || 0
        // c.modules 是一个数组，需要取第一个元素的 name
        modules = [...new Set(allCases?.map((c: any) => c.modules?.[0]?.name).filter(Boolean) as string[] || [])]
        levels_found = [...new Set(allCases?.map((c: any) => c.level).filter(Boolean) as string[] || [])]
        break
      }

      case 'modules': {
        // 多模块用例
        if (!module_ids || module_ids.length === 0) {
          return NextResponse.json({ error: '请选择要执行的模块' }, { status: 400 })
        }

        // Try cache first
        const cacheKeyModules = { type: 'modules', ids: module_ids.sort() }
        let moduleCases = cache.get(CACHE_PREFIX, cacheKeyModules)

        if (!moduleCases) {
          const { data, error } = await supabase
            .from('test_cases')
            .select('id, level, module_id, modules(name)')
            .eq('project_id', projectId)
            .in('module_id', module_ids)
            .eq('is_active', true)

          if (error) throw error
          moduleCases = data
          cache.set(CACHE_PREFIX, cacheKeyModules, moduleCases)
        }

        total_cases = moduleCases?.length || 0
        // c.modules 是一个数组，需要取第一个元素的 name
        modules = [...new Set(moduleCases?.map((c: any) => c.modules?.[0]?.name).filter(Boolean) as string[] || [])]
        levels_found = [...new Set(moduleCases?.map((c: any) => c.level).filter(Boolean) as string[] || [])]
        break
      }

      case 'levels': {
        // 按等级用例
        if (!levels || levels.length === 0) {
          return NextResponse.json({ error: '请选择要执行的等级' }, { status: 400 })
        }

        // Try cache first
        const cacheKeyLevels = { type: 'levels', levels: levels.sort() }
        let levelCases = cache.get(CACHE_PREFIX, cacheKeyLevels)

        if (!levelCases) {
          const { data, error } = await supabase
            .from('test_cases')
            .select('id, level, module_id, modules(name)')
            .eq('project_id', projectId)
            .in('level', levels)
            .eq('is_active', true)

          if (error) throw error
          levelCases = data
          cache.set(CACHE_PREFIX, cacheKeyLevels, levelCases)
        }

        total_cases = levelCases?.length || 0
        // c.modules 是一个数组，需要取第一个元素的 name
        modules = [...new Set(levelCases?.map((c: any) => c.modules?.[0]?.name).filter(Boolean) as string[] || [])]
        levels_found = [...new Set(levelCases?.map((c: any) => c.level).filter(Boolean) as string[] || [])]
        break
      }

      case 'specific': {
        // 指定用例
        if (!test_case_ids || test_case_ids.length === 0) {
          return NextResponse.json({ error: '请指定要执行的测试用例' }, { status: 400 })
        }

        total_cases = test_case_ids.length

        // Try cache first
        const cacheKeySpecific = { type: 'specific', ids: test_case_ids.sort() }
        let specificCases = cache.get(CACHE_PREFIX, cacheKeySpecific)

        if (!specificCases) {
          // 查询指定用例的详细信息
          const { data, error } = await supabase
            .from('test_cases')
            .select('level, module_id, modules(name)')
            .eq('project_id', projectId)
            .in('id', test_case_ids)
            .eq('is_active', true)

          if (error) throw error
          specificCases = data
          cache.set(CACHE_PREFIX, cacheKeySpecific, specificCases)
        }

        // c.modules 是一个数组，需要取第一个元素的 name
        modules = [...new Set(specificCases?.map((c: any) => c.modules?.[0]?.name).filter(Boolean) as string[] || [])]
        levels_found = [...new Set(specificCases?.map((c: any) => c.level).filter(Boolean) as string[] || [])]
        break
      }

      default:
        return NextResponse.json({ error: '无效的执行类型' }, { status: 400 })
    }

    // 假设每个用例平均2秒
    const estimated_duration = total_cases * 2

    console.log('预览结果:', {
      total_cases,
      estimated_duration,
      modules,
      levels_found
    })

    return NextResponse.json({
      total_cases,
      estimated_duration,
      modules: modules.sort(),
      levels: levels_found.sort()
    })

  } catch (error: any) {
    console.error('获取执行预览失败:', error)
    return NextResponse.json(
      { error: '获取执行预览失败: ' + error.message },
      { status: 500 }
    )
  }
}
