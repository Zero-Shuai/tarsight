import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { TestCaseDetail } from '@/components/test-case-detail'

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

function getStatusColor(status: string): string {
  const colors = {
    completed: 'bg-green-600 text-white border-green-600',
    failed: 'bg-red-600 text-white border-red-600',
    running: 'bg-blue-600 text-white border-blue-600'
  }
  return colors[status as keyof typeof colors] || 'bg-gray-600 text-white border-gray-600'
}

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
  params: { id: string }
}) {
  const { execution, testResults } = await getExecutionDetails(params.id)

  if (!execution) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">未找到执行记录</p>
              <Link href="/executions">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回执行历史
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // 从实际测试结果计算统计数据（更准确）
  const totalTests = testResults.length > 0 ? testResults.length : execution.total_tests
  const passedTests = testResults.length > 0 ? testResults.filter(r => r.status === 'passed').length : execution.passed_tests
  const failedTests = testResults.length > 0 ? testResults.filter(r => r.status === 'failed').length : execution.failed_tests
  const skippedTests = testResults.length > 0 ? testResults.filter(r => r.status === 'skipped').length : execution.skipped_tests
  const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0

  // 计算执行时长
  const duration = execution.completed_at && execution.started_at
    ? new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()
    : null

  return (
    <div className="p-8 space-y-8">
      {/* 头部 */}
      <div>
        <Link href="/executions">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回执行历史
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{execution.execution_name}</h1>
        <p className="text-muted-foreground mt-2">
          执行时间: {formatDate(execution.started_at)}
          {duration && ` · 执行时长: ${formatDuration(duration)}`}
        </p>
      </div>

      {/* 统计概览 */}
      {execution.error_message && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 text-2xl">⚠️</div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">执行失败</h3>
                <p className="text-sm text-red-800">{execution.error_message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">总用例</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">通过</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{passedTests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {passRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600">失败</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedTests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalTests > 0 ? ((failedTests / totalTests) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-600">跳过</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{skippedTests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">状态</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(execution.status)}>
              {execution.status === 'completed' && '已完成'}
              {execution.status === 'failed' && '失败'}
              {execution.status === 'running' && '运行中'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* 测试用例列表 */}
      <Card>
        <CardHeader>
          <CardTitle>测试用例详情</CardTitle>
          <CardDescription>
            共 {testResults.length} 个测试用例的执行结果
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <TestCaseDetail key={result.id} result={result} index={index + 1} />
            ))}

            {testResults.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              暂无测试结果
            </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
