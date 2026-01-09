import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ListChecks, TrendingUp, Clock, AlertCircle, CheckCircle2, Hand, Settings, PlayCircle } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { DashboardSkeleton } from '@/components/dashboard-skeleton'

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

  // 获取所有模块
  const { data: modules } = await supabase
    .from('modules')
    .select('id, name')
    .eq('project_id', actualProjectId)

  // 获取所有测试用例（用于统计）
  const { data: testCases } = await supabase
    .from('test_cases')
    .select('module_id')
    .eq('project_id', actualProjectId)
    .eq('is_active', true)

  // 获取测试用例总数
  const { count: totalTestCasesCount } = await supabase
    .from('test_cases')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', actualProjectId)
    .eq('is_active', true)

  // 获取最近的执行记录
  const { data: recentExecutions } = await supabase
    .from('test_executions')
    .select('*')
    .eq('project_id', actualProjectId)
    .order('started_at', { ascending: false })
    .limit(5)

  // 计算模块统计
  const moduleStatsMap: Record<string, number> = {}
  if (modules) {
    modules.forEach((m: any) => {
      moduleStatsMap[m.name] = 0
    })
  }

  if (testCases) {
    testCases.forEach((tc: any) => {
      const module = modules?.find((m: any) => m.id === tc.module_id)
      if (module) {
        moduleStatsMap[module.name]++
      }
    })
  }

  return {
    project,
    moduleStats: moduleStatsMap,
    recentExecutions: recentExecutions || [],
    totalTestCases: totalTestCasesCount || 0
  }
}

export default async function HomePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

async function DashboardContent() {
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
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 ease-out">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {project?.name || 'Tarsight'}
          </h1>
          <p className="text-slate-500">{project?.description || '测试用例管理和执行平台'}</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* 测试用例卡片 */}
          <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-5 border border-slate-50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 ease-out">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <ListChecks className="h-5.5 w-5.5 text-blue-600" />
              </div>
              <div className="text-center space-y-0.5">
                <p className="text-4xl font-black text-slate-900 tracking-tight">{totalTestCases}</p>
                <p className="text-sm font-medium text-slate-500">测试用例</p>
              </div>
            </div>
          </div>

          {/* 执行次数卡片 */}
          <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-5 border border-slate-50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 ease-out">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5.5 w-5.5 text-emerald-600" />
              </div>
              <div className="text-center space-y-0.5">
                <p className="text-4xl font-black text-slate-900 tracking-tight">{totalExecutions}</p>
                <p className="text-sm font-medium text-slate-500">执行次数</p>
              </div>
            </div>
          </div>

          {/* 平均通过率卡片 */}
          <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-5 border border-slate-50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400 ease-out">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <AlertCircle className="h-5.5 w-5.5 text-amber-600" />
              </div>
              <div className="text-center space-y-0.5">
                <p className="text-4xl font-black text-slate-900 tracking-tight">{avgPassRate.toFixed(1)}%</p>
                <p className="text-sm font-medium text-slate-500">平均通过率</p>
              </div>
            </div>
          </div>

          {/* 模块数量卡片 */}
          <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-5 border border-slate-50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 ease-out">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="h-11 w-11 rounded-xl bg-violet-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-5.5 w-5.5 text-violet-600" />
              </div>
              <div className="text-center space-y-0.5">
                <p className="text-4xl font-black text-slate-900 tracking-tight">{totalModules}</p>
                <p className="text-sm font-medium text-slate-500">模块数量</p>
              </div>
            </div>
          </div>
        </div>

        {/* 模块分布 */}
        <Link href="/modules" className="block animate-in fade-in slide-in-from-bottom-4 duration-700 delay-600 ease-out">
          <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer bg-white border border-slate-50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">模块分布</CardTitle>
              <CardDescription className="text-slate-500">各模块测试用例数量</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(moduleStats).map(([module, count]) => (
                  <div key={module} className="space-y-2.5 leading-relaxed">
                    {/* 标签和数值行 - 左右对齐 */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">{module}</span>
                      <span className="text-sm font-mono">
                        <span className="font-semibold text-slate-900">{count}</span>
                        <span className="text-slate-400 ml-1">个用例</span>
                      </span>
                    </div>
                    {/* 进度条 */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${(count / Math.max(...Object.values(moduleStats))) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 最近执行 */}
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300 bg-white border border-slate-50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700 ease-out">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">最近执行</CardTitle>
            <CardDescription className="text-slate-500">最近的测试执行记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {recentExecutions.map((execution, index) => {
                const statusConfig = {
                  completed: {
                    text: '已完成',
                    className: 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  },
                  failed: {
                    text: '失败',
                    className: 'bg-rose-50 text-rose-600 border-rose-100'
                  },
                  running: {
                    text: '运行中',
                    className: 'bg-blue-50 text-blue-600 border-blue-100'
                  }
                }

                const config = statusConfig[execution.status as keyof typeof statusConfig] || statusConfig.running

                // 判断执行方式：根据 execution_name 是否包含"自动"或"定时"
                const isSystemExecution = execution.execution_name?.includes('自动') || execution.execution_name?.includes('定时')
                const ExecutionIcon = isSystemExecution ? Settings : Hand
                const executionTypeBg = isSystemExecution ? 'bg-violet-50' : 'bg-blue-50'
                const executionTypeColor = isSystemExecution ? 'text-violet-600' : 'text-blue-600'

                return (
                  <Link key={execution.id} href={`/executions/${execution.id}`}>
                    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-all duration-200 cursor-pointer group border border-slate-50 hover:border-slate-100 leading-relaxed">
                      {/* 执行方式图标 */}
                      <div className={`h-10 w-10 rounded-lg ${executionTypeBg} flex items-center justify-center flex-shrink-0`}>
                        <ExecutionIcon className={`h-5 w-5 ${executionTypeColor}`} />
                      </div>

                      {/* 执行信息 */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-900 transition-colors mb-1">
                          {execution.execution_name}
                        </p>
                        <p className="text-xs text-slate-400 font-mono leading-relaxed">
                          {new Date(execution.started_at).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      {/* 状态 Badge */}
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex-shrink-0 ${config.className}`}>
                        {config.text}
                      </div>
                    </div>
                  </Link>
                )
              })}
              {recentExecutions.length === 0 && (
                <div className="text-center py-20 px-8">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-50 to-slate-100 mb-6">
                    <CheckCircle2 className="h-12 w-12 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">暂无执行记录</h3>
                  <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
                    开始执行测试后，您的测试记录将显示在这里。您可以随时查看每次执行的详细结果。
                  </p>
                  <Link href="/test-cases">
                    <button className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md">
                      <PlayCircle className="h-4 w-4" />
                      执行测试
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
