import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
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

function getStatusColor(status: string): string {
  const colors = {
    running: 'bg-blue-600 text-white border-blue-600',
    completed: 'bg-green-600 text-white border-green-600',
    failed: 'bg-red-600 text-white border-red-600'
  }
  return colors[status as keyof typeof colors] || 'bg-gray-600 text-white border-gray-600'
}

function getStatusText(status: string): string {
  const texts = {
    running: '运行中',
    completed: '已完成',
    failed: '失败'
  }
  return texts[status as keyof typeof texts] || status
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
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">执行历史</h1>
        <p className="text-muted-foreground mt-2">查看所有测试执行记录</p>
      </div>

      <div className="space-y-4">
        {executions.map((execution) => {
          const passRate = execution.total_tests > 0
            ? (execution.passed_tests / execution.total_tests) * 100
            : 0

          return (
            <Link href={`/executions/${execution.id}`} key={execution.id}>
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{execution.execution_name}</CardTitle>
                      <CardDescription>{formatDate(execution.started_at)}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(execution.status)}>
                      {getStatusText(execution.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-5">
                    <div>
                      <p className="text-sm text-muted-foreground">总用例</p>
                      <p className="text-2xl font-bold">{execution.total_tests}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">通过</p>
                      <p className="text-2xl font-bold text-green-600">{execution.passed_tests}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">失败</p>
                      <p className="text-2xl font-bold text-red-600">{execution.failed_tests}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">跳过</p>
                      <p className="text-2xl font-bold text-yellow-600">{execution.skipped_tests}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">通过率</p>
                      <p className="text-2xl font-bold">{passRate.toFixed(1)}%</p>
                    </div>
                  </div>

                  {execution.completed_at && execution.started_at && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        执行时长: {formatDuration(
                          new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()
                        )}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}

        {executions.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">暂无执行记录</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
