'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle2, XCircle, Circle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { TestCase } from '@/lib/types/database'
import { JsonViewer } from './json-viewer'

interface TestCaseRunDrawerProps {
  testCase: TestCase
  onClose: () => void
}

export function TestCaseRunDrawer({ testCase, onClose }: TestCaseRunDrawerProps) {
  const [executing, setExecuting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const executeTest = async () => {
    setExecuting(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/test/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_case_ids: [testCase.id],
          case_ids: [testCase.case_id]
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '执行失败')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setExecuting(false)
    }
  }

  useEffect(() => {
    executeTest()
  }, [testCase])

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-3xl bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {executing ? (
              <Loader2 className="h-5 w-5 text-[#3B82F6] animate-spin" />
            ) : result ? (
              result.status === 'passed' ? (
                <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
              ) : result.status === 'failed' ? (
                <XCircle className="h-5 w-5 text-[#EF4444]" />
              ) : (
                <Circle className="h-5 w-5 text-[#F59E0B]" />
              )
            ) : error ? (
              <XCircle className="h-5 w-5 text-[#EF4444]" />
            ) : null}

            <div>
              <h2 className="text-lg font-semibold text-slate-900">{testCase.test_name}</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{testCase.case_id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={executeTest}
              disabled={executing}
              className="rounded-lg hover:bg-slate-100"
              title="重新执行"
            >
              <RefreshCw className={`h-4 w-4 ${executing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-lg hover:bg-slate-100 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {executing ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 text-[#3B82F6] animate-spin mb-4" />
              <p className="text-slate-600">正在执行测试...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-[#FEE2E2] border border-[#EF4444]/20 rounded-lg">
              <p className="text-sm font-semibold text-[#EF4444] mb-2">执行失败</p>
              <p className="text-sm text-[#EF4444]">{error}</p>
            </div>
          ) : result ? (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <Badge className={
                  result.status === 'passed' ? 'bg-[#DCFCE7] text-[#10B981] border-[#10B981]/20' :
                  result.status === 'failed' ? 'bg-[#FEE2E2] text-[#EF4444] border-[#EF4444]/20' :
                  'bg-[#FEF3C7] text-[#F59E0B] border-[#F59E0B]/20'
                }>
                  {result.status === 'passed' ? '通过' : result.status === 'failed' ? '失败' : '跳过'}
                </Badge>

                {result.response_time && (
                  <span className="text-sm text-slate-600">
                    响应时间: <span className="font-mono font-semibold">{result.response_time}ms</span>
                  </span>
                )}

                {result.response_code && (
                  <span className="text-sm text-slate-600">
                    状态码: <span className="font-mono font-semibold">{result.response_code}</span>
                  </span>
                )}
              </div>

              {/* Error Message (if failed) */}
              {result.status === 'failed' && result.error_message && (
                <div className="p-4 bg-slate-900 rounded-lg">
                  <p className="text-sm font-semibold text-rose-400 mb-2">错误日志</p>
                  <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                    {result.error_message}
                  </pre>
                </div>
              )}

              {/* Request Info */}
              {result.request_info && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">请求信息</h3>

                  {result.request_info.Headers && (
                    <div>
                      <p className="text-xs font-medium text-slate-700 mb-2">请求头</p>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <JsonViewer data={result.request_info.Headers} />
                      </div>
                    </div>
                  )}

                  {result.request_info.Body && (
                    <div>
                      <p className="text-xs font-medium text-slate-700 mb-2">请求体</p>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <JsonViewer data={result.request_info.Body} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Response Info */}
              {result.response_info && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">响应信息</h3>

                  {result.response_info.Headers && (
                    <div>
                      <p className="text-xs font-medium text-slate-700 mb-2">响应头</p>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <JsonViewer data={result.response_info.Headers} />
                      </div>
                    </div>
                  )}

                  {(result.response_info.Body || result.response_info.Data) && (
                    <div>
                      <p className="text-xs font-medium text-slate-700 mb-2">响应体</p>
                      <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-auto">
                        <JsonViewer data={result.response_info.Body || result.response_info.Data} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
