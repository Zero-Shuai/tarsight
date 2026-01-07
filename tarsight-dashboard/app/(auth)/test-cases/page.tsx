import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Play } from 'lucide-react'
import Link from 'next/link'
import { TestCaseList } from '@/components/test-case-list'
import { TestExecutionDialog } from '@/components/test-execution-dialog'
import type { TestCase } from '@/lib/types/database'

async function getTestCases() {
  const supabase = await createClient()
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '8786c21f-7437-4a2d-8486-9365a382b38e'

  const [testCases, modules] = await Promise.all([
    supabase
      .from('test_cases')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('case_id'),
    supabase
      .from('modules')
      .select('*')
      .eq('project_id', projectId)
      .order('name')
  ])

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
    <div className="min-h-screen bg-slate-50 py-12 px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">测试用例</h1>
            <p className="text-slate-500">管理所有测试用例</p>
          </div>
          <div className="flex gap-3">
            <TestExecutionDialog modules={modules} />
            <Link href="/test-cases/new">
              <Button className="rounded-lg">
                <Plus className="mr-2 h-4 w-4" />
                新建用例
              </Button>
            </Link>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="rounded-xl shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">总用例数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{testCases.length}</div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">模块数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{Object.keys(groupedCases).length}</div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">活跃用例</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{testCases.filter(tc => tc.is_active).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* 传递数据给客户端组件 */}
        <TestCaseList
          groupedCases={groupedCases}
          modules={modules}
          initialTestCases={testCases}
        />
      </div>
    </div>
  )
}
