import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import { ExecutionDetailPage, ExecutionDetailPageWrapper } from '@/components/execution-detail-page'
import { ExecutionDetailSkeleton } from '@/components/execution-detail-skeleton'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

async function getExecutionDetails(executionId: string) {
  const supabase = await createClient()

  // 获取执行记录
  const { data: execution } = await supabase
    .from('test_executions')
    .select('*')
    .eq('id', executionId)
    .single()

  if (!execution) {
    return { execution: null, testResults: [] }
  }

  // 获取该执行的所有测试结果，并关联 test_cases 和 modules 表
  const { data: testResults } = await supabase
    .from('test_results')
    .select('*, test_case:test_cases(*, module:modules(name))')
    .eq('execution_id', executionId)
    .order('created_at', { ascending: true })

  return {
    execution,
    testResults: testResults || []
  }
}

export default async function ExecutionDetailPage({
  params
}: {
  params: { id: string } | Promise<{ id: string }>
}) {
  // Handle both sync and async params
  const resolvedParams = await Promise.resolve(params)
  const id = resolvedParams?.id

  if (!id) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-slate-50 p-12 text-center">
            <p className="text-slate-500">无效的执行 ID</p>
            <Link href="/executions">
              <Button variant="outline" className="mt-4 rounded-lg">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回执行历史
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { execution, testResults } = await getExecutionDetails(id)

  if (!execution) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-slate-50 p-12 text-center">
            <p className="text-slate-500">未找到执行记录</p>
            <Link href="/executions">
              <Button variant="outline" className="mt-4 rounded-lg">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回执行历史
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<ExecutionDetailPageWrapper />}>
      <ExecutionDetailPage execution={execution} testResults={testResults} />
    </Suspense>
  )
}
