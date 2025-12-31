'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

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

export function TestCaseExecutionHistory({ executionHistory }: { executionHistory: any[] }) {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  if (executionHistory.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        暂无执行记录
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {executionHistory.map((result) => (
        <div key={result.id} className="border rounded-lg overflow-hidden">
          {/* 执行记录头部 - 点击展开详情 */}
          <div
            className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
            onClick={() => toggleExpanded(result.id)}
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2">
                {getStatusIcon(result.status)}
                <span className="font-medium text-sm">
                  {result.execution?.execution_name || `执行 #${result.execution_id.slice(0, 8)}`}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatDate(result.created_at)}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                <Clock className="h-3 w-3 inline mr-1" />
                {result.duration ? (result.duration * 1000).toFixed(0) : '0'}ms
              </div>
              <Badge className={getStatusColor(result.status)}>
                {result.status === 'passed' && '通过'}
                {result.status === 'failed' && '失败'}
                {result.status === 'skipped' && '跳过'}
              </Badge>
            </div>
          </div>

          {/* 详细信息（展开时显示） */}
          {expandedItems.has(result.id) && (
            <div className="p-4 border-t space-y-4 bg-background">
              {/* 错误信息 */}
              {result.error_message && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-1">错误信息:</p>
                  <p className="text-sm text-red-700">{result.error_message}</p>
                </div>
              )}

              {/* 请求信息 */}
              {result.request_info && Object.keys(result.request_info).length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">请求信息:</p>
                  <div className="bg-muted p-3 rounded-lg space-y-2">
                    {result.request_info.URL && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">URL:</p>
                        <p className="text-sm font-mono break-all">{result.request_info.URL}</p>
                      </div>
                    )}
                    {result.request_info.Method && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Method:</p>
                        <Badge variant="outline">{result.request_info.Method}</Badge>
                      </div>
                    )}
                    {result.request_info.Headers && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Headers:</p>
                        <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.request_info.Headers, null, 2)}
                        </pre>
                      </div>
                    )}
                    {result.request_info.Body && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Body:</p>
                        <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.request_info.Body, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 响应信息 */}
              {result.response_info && Object.keys(result.response_info).length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">响应信息:</p>
                  <div className="bg-muted p-3 rounded-lg space-y-2">
                    {result.response_info['Status Code'] && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Status Code:</p>
                        <Badge variant={
                          result.response_info['Status Code'] >= 200 && result.response_info['Status Code'] < 300
                            ? 'default'
                            : 'destructive'
                        }>
                          {result.response_info['Status Code']}
                        </Badge>
                      </div>
                    )}
                    {result.response_info['Response Time'] && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Response Time:</p>
                        <p className="text-sm">{(result.response_info['Response Time'] * 1000).toFixed(0)}ms</p>
                      </div>
                    )}
                    {result.response_info.Headers && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Response Headers:</p>
                        <pre className="text-xs bg-background p-2 rounded overflow-x-auto max-h-40">
                          {JSON.stringify(result.response_info.Headers, null, 2)}
                        </pre>
                      </div>
                    )}
                    {result.response_info.Data && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Response Body:</p>
                        <pre className="text-xs bg-background p-2 rounded overflow-x-auto max-h-60">
                          {JSON.stringify(result.response_info.Data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 跳转到执行详情页的按钮 */}
              <div className="pt-2 border-t">
                <Link
                  href={`/executions/${result.execution_id}`}
                  className="inline-block"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    查看完整执行记录
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* 展开按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleExpanded(result.id)
            }}
            className="w-full px-4 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors border-t"
          >
            {expandedItems.has(result.id) ? '收起详情' : '展开详情'}
          </button>
        </div>
      ))}
    </div>
  )
}
