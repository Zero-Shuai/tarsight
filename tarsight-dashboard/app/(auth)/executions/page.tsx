import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import { ExecutionListCompact } from '@/components/execution-list-compact'
import { ExecutionListSkeleton } from '@/components/execution-list-skeleton'

async function getExecutions() {
  const supabase = await createClient()
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '8786c21f-7437-4a2d-8486-9365a382b38e'

  const { data: executions } = await supabase
    .from('test_executions')
    .select('*')
    .eq('project_id', projectId)
    .order('started_at', { ascending: false })
    .limit(50)

  return {
    executions: executions || [],
    projectId
  }
}

export default async function ExecutionsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 ease-out">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">执行历史</h1>
          <p className="text-slate-500">查看所有测试执行记录</p>
        </div>

        {/* 执行列表 - 使用 Suspense 加载骨架屏 */}
        <Suspense fallback={<ExecutionListSkeleton />}>
          <ExecutionsListContent />
        </Suspense>
      </div>
    </div>
  )
}

async function ExecutionsListContent() {
  const { executions } = await getExecutions()

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 ease-out">
      <ExecutionListCompact executions={executions} />
    </div>
  )
}
