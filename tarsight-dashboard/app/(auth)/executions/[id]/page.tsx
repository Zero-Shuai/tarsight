import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import { ExecutionDetailPage as ExecutionDetailPageClient, ExecutionDetailPageWrapper } from '@/components/execution-detail-page'
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

  // 扁平化数据，将嵌套的 test_case 和 module 字段提取到顶层
  const flattenedResults = (testResults || []).map((result: any) => {
    const flattened = {
      ...result,
      // 从嵌套对象中提取便捷访问字段
      case_id: result.test_case?.case_id,
      test_name: result.test_case?.test_name,
      module_name: result.test_case?.module?.name || 'Unknown',
      method: result.test_case?.method,
      url: result.test_case?.url,
      // 修复字段映射和数据类型转换
      response_time: result.duration ? Math.round(Number(result.duration) * 1000) : 0,  // 转秒为毫秒
      response_code: result.response_info?.Code || result.response_info?.Status_Code,  // 兼容两种字段名
      request_headers: result.request_info?.Headers,
      request_body: result.request_info?.Body,
      response_headers: result.response_info?.Headers,
      response_body: result.response_info?.Body || result.response_info?.Data  // Body 或 Data
    }

    // Debug: Log the first result to see the structure
    if (!result._logged) {
      console.log('📊 Flattening test result:', {
        original_result: result,
        flattened_result: flattened,
        has_request_info: !!result.request_info,
        has_response_info: !!result.response_info,
        request_info_keys: result.request_info ? Object.keys(result.request_info) : [],
        response_info_keys: result.response_info ? Object.keys(result.response_info) : []
      })
      result._logged = true
    }

    return flattened
  })

  return {
    execution,
    testResults: flattenedResults
  }
}

export default async function ExecutionDetailPageRoute({
  params
}: {
  params: { id: string }
}) {
  const { execution, testResults } = await getExecutionDetails(params.id)

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
      <ExecutionDetailPageClient execution={execution} testResults={testResults} />
    </Suspense>
  )
}
