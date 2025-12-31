import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { TestCaseExecutionHistory } from '@/components/test-case-execution-history'

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

function getStatusColor(status: string): string {
  const colors = {
    passed: 'bg-green-600 text-white border-green-600',
    failed: 'bg-red-600 text-white border-red-600',
    skipped: 'bg-yellow-500 text-white border-yellow-500'
  }
  return colors[status as keyof typeof colors] || 'bg-gray-600 text-white border-gray-600'
}

function getStatusIcon(status: string) {
  const icons = {
    passed: <CheckCircle className="h-4 w-4 text-green-600" />,
    failed: <XCircle className="h-4 w-4 text-red-600" />,
    skipped: <AlertCircle className="h-4 w-4 text-yellow-600" />
  }
  return icons[status as keyof typeof icons] || <AlertCircle className="h-4 w-4 text-gray-600" />
}

async function getTestCaseDetails(caseId: string) {
  const supabase = await createClient()

  // 获取测试用例信息
  const { data: testCase } = await supabase
    .from('test_cases')
    .select('*, module:modules(*)')
    .eq('id', caseId)
    .single()

  if (!testCase) {
    return { testCase: null, executionHistory: [], statistics: null }
  }

  // 获取该测试用例的所有执行结果
  const { data: executionResults } = await supabase
    .from('test_results')
    .select('*, execution:test_executions(*)')
    .eq('test_case_id', caseId)
    .order('created_at', { ascending: false })

  // 计算统计数据
  const totalRuns = executionResults?.length || 0
  const passedRuns = executionResults?.filter(r => r.status === 'passed').length || 0
  const failedRuns = executionResults?.filter(r => r.status === 'failed').length || 0
  const skippedRuns = executionResults?.filter(r => r.status === 'skipped').length || 0
  const passRate = totalRuns > 0 ? (passedRuns / totalRuns) * 100 : 0

  const statistics = {
    totalRuns,
    passedRuns,
    failedRuns,
    skippedRuns,
    passRate
  }

  return {
    testCase,
    executionHistory: executionResults || [],
    statistics
  }
}

export default async function TestCaseDetailPage({
  params
}: {
  params: { id: string }
}) {
  const { testCase, executionHistory, statistics } = await getTestCaseDetails(params.id)

  if (!testCase) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">未找到测试用例</p>
              <Link href="/test-cases">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回测试用例列表
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      {/* 头部 */}
      <div>
        <Link href="/test-cases">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回测试用例列表
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{testCase.case_id}</h1>
        <p className="text-muted-foreground mt-2">{testCase.test_name}</p>
      </div>

      {/* 测试用例基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>用例信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">模块</p>
              <p className="font-medium">{testCase.module?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">请求方法</p>
              <Badge variant="outline">{testCase.method}</Badge>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">URL</p>
              <p className="font-mono text-sm break-all">{testCase.url}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">预期状态码</p>
              <p className="font-medium">{testCase.expected_status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">状态</p>
              <Badge variant={testCase.is_active ? "default" : "secondary"}>
                {testCase.is_active ? '活跃' : '未激活'}
              </Badge>
            </div>
            {testCase.description && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">描述</p>
                <p className="text-sm">{testCase.description}</p>
              </div>
            )}
            {testCase.tags && testCase.tags.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">标签</p>
                <div className="flex gap-1 mt-1">
                  {testCase.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 执行统计 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">总执行次数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalRuns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">通过次数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.passedRuns}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.passRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600">失败次数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.failedRuns}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.totalRuns > 0 ? ((statistics.failedRuns / statistics.totalRuns) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-600">跳过次数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statistics.skippedRuns}</div>
          </CardContent>
        </Card>
      </div>

      {/* 执行历史 */}
      <Card>
        <CardHeader>
          <CardTitle>执行历史</CardTitle>
          <CardDescription>
            共 {executionHistory.length} 次执行记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TestCaseExecutionHistory executionHistory={executionHistory} />
        </CardContent>
      </Card>
    </div>
  )
}
