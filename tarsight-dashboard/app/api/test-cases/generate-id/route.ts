import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/test-cases/generate-id?module_id=xxx
 *
 * 自动生成测试用例编号
 * 格式: PRJ001-MOD001-001
 */
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

    // 获取当前模块下最大的序号
    const { data: lastCase } = await supabase
      .from('test_cases')
      .select('case_id')
      .eq('module_id', moduleId)
      .order('case_id', { ascending: false })
      .limit(1)

    let nextSeq = 1
    if (lastCase && lastCase.length > 0 && lastCase[0].case_id) {
      // 从 case_id 中提取序号部分（格式：PRJ001-MOD001-序号）
      const match = lastCase[0].case_id.match(/-(\d{3})$/)
      if (match) {
        nextSeq = parseInt(match[1], 10) + 1
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
