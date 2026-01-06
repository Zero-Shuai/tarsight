import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlayCircle, CheckCircle2, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'

function formatDate(dateString: string): string {
  // 确保使用中国时区 (UTC+8)
  const date = new Date(dateString)

  // 检查是否是有效的日期
  if (isNaN(date.getTime())) {
    return '无效时间'
  }

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai'
  })
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) {
    return `${seconds}秒`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`
}

function getStatusInfo(status: string) {
  const info = {
    running: {
      text: '运行中',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: PlayCircle
    },
    completed: {
      text: '已完成',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2
    },
    failed: {
      text: '失败',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: XCircle
    }
  }
  return info[status as keyof typeof info] || {
    text: status,
    className: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: Clock
  }
}

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
  const { executions, projectId } = await getExecutions()

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">执行历史</h1>
          <p className="text-slate-500">查看所有测试执行记录</p>
        </div>

        {/* 执行列表 */}
        <div className="space-y-4">
          {executions.map((execution) => {
            const passRate = execution.total_tests > 0
              ? (execution.passed_tests / execution.total_tests) * 100
              : 0
            const statusInfo = getStatusInfo(execution.status)
            const StatusIcon = statusInfo.icon

            return (
              <Link href={`/executions/${execution.id}`} key={execution.id}>
                <Card className="rounded-xl shadow-sm border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer group">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <PlayCircle className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                              {execution.execution_name}
                            </CardTitle>
                            <CardDescription className="text-slate-500 text-xs font-mono mt-1">
                              {formatDate(execution.started_at)}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                      <Badge className={`${statusInfo.className} font-medium flex items-center gap-1`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.text}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* 错误信息提示 */}
                      {execution.error_message && (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
                          <p className="text-sm text-rose-800 font-medium flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            {execution.error_message}
                          </p>
                        </div>
                      )}

                      {/* 统计数据 */}
                      <div className="grid gap-6 md:grid-cols-5">
                        <div className="space-y-1">
                          <p className="text-xs text-slate-500 font-medium">总用例</p>
                          <p className="text-2xl font-bold text-slate-900">{execution.total_tests}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-slate-500 font-medium">通过</p>
                          <p className="text-2xl font-bold text-emerald-600">{execution.passed_tests}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-slate-500 font-medium">失败</p>
                          <p className="text-2xl font-bold text-rose-600">{execution.failed_tests}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-slate-500 font-medium">跳过</p>
                          <p className="text-2xl font-bold text-amber-600">{execution.skipped_tests}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-slate-500 font-medium">通过率</p>
                          <p className="text-2xl font-bold text-slate-900">{passRate.toFixed(1)}%</p>
                        </div>
                      </div>

                      {/* 执行时长 */}
                      {execution.completed_at && execution.started_at && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-xs text-slate-500 flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            执行时长: {formatDuration(
                              new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}

          {/* 空状态 */}
          {executions.length === 0 && (
            <Card className="rounded-xl shadow-sm border-slate-200">
              <CardContent className="py-16">
                <div className="text-center">
                  <PlayCircle className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">暂无执行记录</h3>
                  <p className="text-sm text-slate-500">执行测试后，记录将显示在这里</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
