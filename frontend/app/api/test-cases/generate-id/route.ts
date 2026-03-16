import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/test-cases/generate-id?module_id=xxx
 *
 * 自动生成测试用例编号
 * 格式: {PROJECT_CODE}-{MODULE_CODE}-001
 */

// 简单的内存缓存，用于存储模块的最大序号
const sequenceCache = new Map<string, { sequence: number; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const moduleId = searchParams.get('module_id')

    if (!moduleId) {
      return NextResponse.json(
        { error: 'module_id 参数是必需的' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 获取模块信息（包括关联的项目编号）
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select(`
        module_code,
        project_id,
        projects (
          project_code
        )
      `)
      .eq('id', moduleId)
      .single()

    if (moduleError || !module) {
      return NextResponse.json(
        { error: '未找到模块信息' },
        { status: 404 }
      )
    }

    // Supabase JOIN 返回数组，需要取第一个元素
    const projects = module.projects as any
    const projectCode = Array.isArray(projects) && projects.length > 0 ? projects[0].project_code : null
    const moduleCode = module.module_code

    if (!projectCode || !moduleCode) {
      return NextResponse.json(
        { error: '项目或模块编号未设置，请先设置编号' },
        { status: 400 }
      )
    }

    // 获取当前模块下最大的序号（带缓存）
    let nextSeq = 1
    const cacheKey = `seq_${moduleId}`
    const cached = sequenceCache.get(cacheKey)

    // 检查缓存是否有效
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      nextSeq = cached.sequence + 1
    } else {
      // 缓存失效或不存在，查询数据库
      const { data: lastCase } = await supabase
        .from('test_cases')
        .select('case_id')
        .eq('module_id', moduleId)
        .order('case_id', { ascending: false })
        .limit(1)

      if (lastCase && lastCase.length > 0 && lastCase[0].case_id) {
        // 从 case_id 中提取序号部分（格式：PROJECT_CODE-MODULE_CODE-序号）
        const match = lastCase[0].case_id.match(/-(\d{3})$/)
        if (match) {
          nextSeq = parseInt(match[1], 10) + 1
        }
      }
    }

    // 更新缓存
    sequenceCache.set(cacheKey, { sequence: nextSeq, timestamp: Date.now() })

    // 清理过期缓存（保留最近100条）
    if (sequenceCache.size > 100) {
      const now = Date.now()
      for (const [key, value] of sequenceCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          sequenceCache.delete(key)
        }
      }
    }

    // 生成新的 case_id
    const generatedId = `${projectCode}-${moduleCode}-${String(nextSeq).padStart(3, '0')}`

    return NextResponse.json({
      case_id: generatedId,
      project_code: projectCode,
      module_code: moduleCode,
      sequence: nextSeq
    })

  } catch (error) {
    console.error('生成测试用例编号失败:', error)
    return NextResponse.json(
      { error: '生成测试用例编号失败' },
      { status: 500 }
    )
  }
}
