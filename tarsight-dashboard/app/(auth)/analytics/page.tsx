import { createClient } from '@/lib/supabase/server'
import { StatsCards } from '@/components/analytics/stats-cards'
import { ExecutionTrend } from '@/components/analytics/execution-trend'
import { ModuleDistribution } from '@/components/analytics/module-distribution'

async function getAnalyticsData() {
  const supabase = await createClient()
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '8786c21f-7437-4a2d-8486-9365a382b38e'

  const [executions, modules, testCases] = await Promise.all([
    supabase
      .from('test_executions')
      .select('*')
      .eq('project_id', projectId)
      .order('started_at', { ascending: false })
      .limit(100),
    supabase
      .from('modules')
      .select('*')
      .eq('project_id', projectId)
      .order('name'),
    supabase
      .from('test_cases')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('case_id')
  ])

  return {
    executions: executions.data || [],
    modules: modules.data || [],
    testCases: testCases.data || [],
    projectId
  }
}

export default async function AnalyticsPage() {
  const { executions, modules, testCases } = await getAnalyticsData()

  // 计算统计数据
  const totalExecutions = executions.length
  const completedExecutions = executions.filter(e => e.status === 'completed')
  const avgPassRate = completedExecutions.length > 0
    ? completedExecutions.reduce((sum, e) => {
        const total = e.total_tests || 0
        const passed = e.passed_tests || 0
        return sum + (total > 0 ? (passed / total) * 100 : 0)
      }, 0) / completedExecutions.length
    : 0

  // 按模块统计用例数量
  const moduleTestCaseCount = modules.reduce((acc, module) => {
    acc[module.name] = testCases.filter(tc => tc.module_id === module.id).length
    return acc
  }, {} as Record<string, number>)

  // 最近7天的执行趋势（从今天到7天前，由新到旧）
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toISOString().split('T')[0]
  })

  const executionTrend = last7Days.map(day => {
    const dayExecutions = executions.filter(e =>
      e.started_at.split('T')[0] === day
    )
    return {
      date: day,
      count: dayExecutions.length,
      passed: dayExecutions.reduce((sum, e) => sum + (e.passed_tests || 0), 0),
      failed: dayExecutions.reduce((sum, e) => sum + (e.failed_tests || 0), 0)
    }
  })

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">统计分析</h1>
        <p className="text-muted-foreground mt-2">测试执行统计和趋势分析</p>
      </div>

      {/* 概览卡片 */}
      <StatsCards
        totalExecutions={totalExecutions}
        avgPassRate={avgPassRate}
        totalTestCases={testCases.length}
        activeModules={modules.length}
      />

      {/* 执行趋势和模块分布 */}
      <div className="grid gap-4 md:grid-cols-2">
        <ExecutionTrend executionTrend={executionTrend} />
        <ModuleDistribution
          moduleTestCaseCount={moduleTestCaseCount}
          totalTestCases={testCases.length}
        />
      </div>
    </div>
  )
}
