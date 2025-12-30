import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ListChecks, TrendingUp, Clock, AlertCircle } from 'lucide-react'

async function getDashboardData() {
  const supabase = await createClient()
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '8786c21f-7437-4a2d-8486-9365a382b38e'

  // 获取项目列表（用户只能看到自己的项目）
  const { data: projects } = await supabase
    .from('projects')
    .select('*')

  // 如果用户有项目，使用第一个；否则使用默认项目 ID
  const project = projects && projects.length > 0 ? projects[0] : null
  const actualProjectId = project?.id || projectId

  const [moduleStats, recentExecutions, totalTestCases] = await Promise.all([
    // 获取模块统计
    supabase
      .from('modules')
      .select('name')
      .eq('project_id', actualProjectId),

    // 获取最近的执行记录
    supabase
      .from('test_executions')
      .select('*')
      .eq('project_id', actualProjectId)
      .order('started_at', { ascending: false })
      .limit(5),

    // 获取测试用例总数
    supabase
      .from('test_cases')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', actualProjectId)
      .eq('is_active', true)
  ])

  // 计算模块统计
  const moduleStatsMap: Record<string, number> = {}
  if (moduleStats.data) {
    moduleStats.data.forEach((m: any) => {
      moduleStatsMap[m.name] = (moduleStatsMap[m.name] || 0) + 1
    })
  }

  return {
    project,
    moduleStats: moduleStatsMap,
    recentExecutions: recentExecutions.data || [],
    totalTestCases: totalTestCases.count || 0
  }
}

export default async function HomePage() {
  const { project, moduleStats, recentExecutions, totalTestCases } = await getDashboardData()

  const totalModules = Object.keys(moduleStats).length
  const totalExecutions = recentExecutions.length
  const avgPassRate = totalExecutions > 0
    ? recentExecutions.reduce((sum, ex) => {
        const total = ex.total_tests || 0
        const passed = ex.passed_tests || 0
        return sum + (total > 0 ? (passed / total) * 100 : 0)
      }, 0) / totalExecutions
    : 0

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{project?.name || 'Tarsight'}</h1>
        <p className="text-muted-foreground mt-2">{project?.description || '测试用例管理和执行平台'}</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">测试用例</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTestCases}</div>
            <p className="text-xs text-muted-foreground">
              分布在 {totalModules} 个模块中
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">执行次数</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExecutions}</div>
            <p className="text-xs text-muted-foreground">
              最近执行记录
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均通过率</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPassRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              基于最近 {totalExecutions} 次执行
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">模块数量</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalModules}</div>
            <p className="text-xs text-muted-foreground">
              活跃测试模块
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 模块分布 */}
      <Card>
        <CardHeader>
          <CardTitle>模块分布</CardTitle>
          <CardDescription>各模块测试用例数量</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(moduleStats).map(([module, count]) => (
              <div key={module} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{module}</span>
                    <span className="text-sm text-muted-foreground">{count} 个用例</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${(count / Math.max(...Object.values(moduleStats))) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 最近执行 */}
      <Card>
        <CardHeader>
          <CardTitle>最近执行</CardTitle>
          <CardDescription>最近的测试执行记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentExecutions.map((execution) => {
              const passRate = execution.total_tests > 0
                ? (execution.passed_tests / execution.total_tests) * 100
                : 0

              return (
                <div key={execution.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{execution.execution_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(execution.started_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{passRate.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">
                        {execution.passed_tests}/{execution.total_tests} 通过
                      </p>
                    </div>
                    <div className={`h-2 w-2 rounded-full ${
                      execution.status === 'completed' ? 'bg-green-500' :
                      execution.status === 'failed' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`} />
                  </div>
                </div>
              )
            })}
            {recentExecutions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">暂无执行记录</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
