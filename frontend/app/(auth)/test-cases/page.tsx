import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Play, ListChecks, Layers, CheckCircle2 } from 'lucide-react'
import { TestCasePageClient } from '@/components/test-case-page-client'
import { TestExecutionDialog } from '@/components/test-execution-dialog'
import type { TestCase } from '@/lib/types/database'

async function getTestCases() {
  const supabase = await createClient()
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '8786c21f-7437-4a2d-8486-9365a382b38e'

  console.log('🔍 [DEBUG] PROJECT_ID from env:', process.env.NEXT_PUBLIC_PROJECT_ID)
  console.log('🔍 [DEBUG] Using projectId:', projectId)

  // First, try to get ALL test cases without filters to see if data exists
  const { data: allTestCases, error: allError } = await supabase
    .from('test_cases')
    .select('id, case_id, test_name, project_id, is_active')
    .limit(5)

  console.log('📊 [DEBUG] All test cases (no filters):', {
    count: allTestCases?.length || 0,
    error: allError,
    sample: allTestCases
  })

  // Now get with filters - REMOVED is_active filter to show all test cases
  const [testCases, modules] = await Promise.all([
    supabase
      .from('test_cases')
      .select('*')
      .eq('project_id', projectId)
      // .eq('is_active', true)  // TEMPORARILY REMOVED TO DEBUG
      .order('case_id'),
    supabase
      .from('modules')
      .select('*')
      .eq('project_id', projectId)
      .order('name')
  ])

  console.log('📊 [DEBUG] Filtered test cases:', {
    count: testCases.data?.length || 0,
    error: testCases.error,
    sample: testCases.data?.slice(0, 2)
  })

  console.log('📁 [DEBUG] Modules:', {
    count: modules.data?.length || 0,
    error: modules.error
  })

  const moduleMap = new Map((modules.data || []).map(m => [m.id, m.name]))

  return {
    testCases: (testCases.data || []).map(tc => ({
      ...tc,
      module_name: moduleMap.get(tc.module_id) || 'Unknown'
    })),
    modules: modules.data || []
  }
}

export default async function TestCasesPage() {
  const { testCases, modules } = await getTestCases()

  // 按模块分组
  const groupedCases = testCases.reduce((acc, tc) => {
    if (!acc[tc.module_name]) {
      acc[tc.module_name] = []
    }
    acc[tc.module_name].push(tc)
    return acc
  }, {} as Record<string, TestCase[]>)

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 ease-out">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">测试用例</h1>
            <p className="text-slate-500">高效管理所有测试用例</p>
          </div>
          <div className="flex gap-3">
            <TestExecutionDialog modules={modules} />
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* 总用例数卡片 */}
          <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-5 border border-slate-50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 ease-out">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <ListChecks className="h-5.5 w-5.5 text-blue-600" />
              </div>
              <div className="text-center space-y-0.5">
                <p className="text-4xl font-black text-slate-900 tracking-tight">{testCases.length}</p>
                <p className="text-sm font-medium text-slate-500">总用例数</p>
              </div>
            </div>
          </div>

          {/* 模块数卡片 */}
          <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-5 border border-slate-50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 ease-out">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="h-11 w-11 rounded-xl bg-violet-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Layers className="h-5.5 w-5.5 text-violet-600" />
              </div>
              <div className="text-center space-y-0.5">
                <p className="text-4xl font-black text-slate-900 tracking-tight">{Object.keys(groupedCases).length}</p>
                <p className="text-sm font-medium text-slate-500">模块数</p>
              </div>
            </div>
          </div>

          {/* 活跃用例卡片 */}
          <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-5 border border-slate-50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400 ease-out">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="h-5.5 w-5.5 text-emerald-600" />
              </div>
              <div className="text-center space-y-0.5">
                <p className="text-4xl font-black text-slate-900 tracking-tight">{testCases.filter(tc => tc.is_active).length}</p>
                <p className="text-sm font-medium text-slate-500">活跃用例</p>
                <p className="text-xs text-slate-400">{testCases.filter(tc => !tc.is_active).length} 个非活跃</p>
              </div>
            </div>
          </div>
        </div>

        {/* Workbench */}
        {testCases.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-50 p-12 text-center">
            <p className="text-slate-500 mb-2">未找到测试用例</p>
            <p className="text-sm text-slate-400 mb-4">
              请检查：1) PROJECT_ID 环境变量是否正确 2) 数据库中是否有测试用例 3) 测试用例的 is_active 字段是否为 true
            </p>
            <div className="space-y-2">
              <a
                href="/api/debug/test-cases"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-blue-600 hover:text-blue-700 underline"
              >
                🔍 点击查看调试信息（在新标签页打开）
              </a>
              <p className="text-xs text-slate-400 mt-2">
                或查看服务器控制台日志
              </p>
            </div>
          </div>
        ) : (
          <TestCasePageClient
            groupedCases={groupedCases}
            modules={modules}
            initialTestCases={testCases}
          />
        )}
      </div>
    </div>
  )
}
