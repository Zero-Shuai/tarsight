import { api } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

async function getAnalyticsData() {
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '8786c21f-7437-4a2d-8486-9365a382b38e'

  const [executions, modules, testCases] = await Promise.all([
    api.getTestExecutions(projectId, 100),
    api.getModules(projectId),
    api.getTestCases(projectId)
  ])

  return {
    executions,
    modules,
    testCases,
    projectId
  }
}

export default async function AnalyticsPage() {
  const { executions, modules, testCases } = await getAnalyticsData()

  // 计算统计数据
  const totalExecutions = executions.length
  const completedExecutions = executions.filter(e => e.status === 'completed')
  const avgPassRate = completedExecutions.length > 0
    ? completedExecutions.reduce((sum, e) => sum + (e.passed_tests / e.total_tests * 100), 0) / completedExecutions.length
    : 0

  // 按模块统计用例数量
  const moduleTestCaseCount = modules.reduce((acc, module) => {
    acc[module.name] = testCases.filter(tc => tc.module_id === module.id).length
    return acc
  }, {} as Record<string, number>)

  // 最近7天的执行趋势
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toISOString().split('T')[0]
  })

  const executionTrend = last7Days.map(day => {
    const dayExecutions = executions.filter(e =>
      e.started_at.split('T')[0] === day
    )
    return {
      date: day,
      count: dayExecutions.length,
      passed: dayExecutions.reduce((sum, e) => sum + e.passed_tests, 0),
      failed: dayExecutions.reduce((sum, e) => sum + e.failed_tests, 0)
    }
  })

  // 状态分布
  const statusDistribution = executions.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">统计分析</h1>
        <p className="text-muted-foreground mt-2">测试执行统计和趋势分析</p>
      </div>

      {/* 概览卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总执行次数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExecutions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              全部测试执行记录
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均通过率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPassRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              基于已完成执行
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">测试模块</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modules.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              活跃模块数量
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">测试用例</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testCases.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              活跃用例总数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 执行趋势 */}
      <Card>
        <CardHeader>
          <CardTitle>最近7天执行趋势</CardTitle>
          <CardDescription>每日测试执行数量和结果统计</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {executionTrend.map(item => (
              <div key={item.date} className="flex items-center gap-4">
                <div className="w-24 text-sm text-muted-foreground">
                  {new Date(item.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                </div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-100 rounded overflow-hidden">
                    {item.count > 0 && (
                      <div
                        className="h-full flex"
                        style={{
                          width: `${(item.count / Math.max(...executionTrend.map(e => e.count))) * 100}%`
                        }}
                      >
                        <div
                          className="bg-green-500"
                          style={{ width: item.passed > 0 ? `${(item.passed / (item.passed + item.failed)) * 100}%` : 0 }}
                        />
                        <div
                          className="bg-red-500"
                          style={{ width: item.failed > 0 ? `${(item.failed / (item.passed + item.failed)) * 100}%` : 0 }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-32 text-right text-sm">
                  <span className="font-medium">{item.count}</span> 次
                  {item.count > 0 && (
                    <span className="text-muted-foreground ml-2">
                      (通过 {item.passed} / 失败 {item.failed})
                    </span>
                  )}
                </div>
              </div>
            ))}
            {executionTrend.every(item => item.count === 0) && (
              <p className="text-center text-muted-foreground py-8">暂无执行数据</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 模块用例分布 */}
      <Card>
        <CardHeader>
          <CardTitle>模块用例分布</CardTitle>
          <CardDescription>各模块包含的测试用例数量</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(moduleTestCaseCount)
              .sort(([, a], [, b]) => b - a)
              .map(([moduleName, count]) => (
                <div key={moduleName} className="flex items-center gap-4">
                  <div className="w-48 text-sm font-medium truncate">{moduleName}</div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-100 rounded overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{
                          width: `${(count / Math.max(...Object.values(moduleTestCaseCount))) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm font-medium">{count}</div>
                </div>
              ))}
            {modules.length === 0 && (
              <p className="text-center text-muted-foreground py-8">暂无模块数据</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 执行状态分布 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>运行中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {statusDistribution['running'] || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>已完成</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {statusDistribution['completed'] || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>失败</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {statusDistribution['failed'] || 0}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
