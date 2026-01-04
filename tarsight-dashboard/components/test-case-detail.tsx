'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
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

export function TestCaseDetail({ result, index }: { result: any, index: number }) {
  const [expanded, setExpanded] = React.useState(false)
  const [responseExpanded, setResponseExpanded] = React.useState(true) // 默认展开

  // 格式化 Response Body 数据
  const formatResponseBody = (data: any, indent: number = 0): string => {
    if (data === null || data === undefined) {
      return 'null'
    }

    if (typeof data === 'string') {
      return data
    }

    if (typeof data === 'number' || typeof data === 'boolean') {
      return String(data)
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return '[]'
      }
      // 只显示前 3 个元素，其余用省略号
      const preview = data.slice(0, 3).map(item =>
        typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)
      ).join('\n')
      const more = data.length > 3 ? `\n... (还有 ${data.length - 3} 项)` : ''
      return `[\n${preview}\n${more}]`
    }

    if (typeof data === 'object') {
      const keys = Object.keys(data)
      if (keys.length === 0) {
        return '{}'
      }

      const preview = keys.slice(0, 5).map(key => {
        const value = data[key]
        const valueStr = typeof value === 'object'
          ? `{...}`
          : JSON.stringify(value)
        return `  "${key}": ${valueStr}`
      }).join('\n')
      const more = keys.length > 5 ? `\n... (还有 ${keys.length - 5} 个字段)` : ''
      return `{\n${preview}\n${more}`
    }

    return String(data)
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 测试用例头部 */}
      <div
        className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4 flex-1">
          <span className="text-sm font-medium text-muted-foreground w-8">
            {index}
          </span>
          <div className="flex items-center gap-2">
            {getStatusIcon(result.status)}
            <span className="font-medium">{result.test_case?.case_id || 'N/A'}</span>
            <Badge variant="outline" className="text-xs">
              {result.test_case?.module?.name || result.test_case?.module || 'N/A'}
            </Badge>
          </div>
          <span className="text-sm text-muted-foreground flex-1 ml-4">
            {result.test_case?.test_name || 'N/A'}
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
      {expanded && (
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
                {/* 1. 验证情况 */}
                <div className="p-2 rounded bg-background">
                  <p className="text-xs text-muted-foreground mb-2">验证情况:</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Status Code:</span>
                      <Badge variant={
                        result.response_info['Status Code'] >= 200 && result.response_info['Status Code'] < 300
                          ? 'default'
                          : 'destructive'
                      }>
                        {result.response_info['Status Code']}
                      </Badge>
                    </div>
                    {result.response_info['Success'] !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Success:</span>
                        <Badge variant={result.response_info['Success'] === true ? 'default' : 'destructive'}>
                          {result.response_info['Success'] ? 'true' : 'false'}
                        </Badge>
                      </div>
                    )}
                    {result.response_info['Code'] !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Code:</span>
                        <span className="font-mono">{result.response_info['Code']}</span>
                      </div>
                    )}
                    {result.response_info['Message'] && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Message:</span>
                        <span>{result.response_info['Message']}</span>
                      </div>
                    )}
                    {result.response_info['Response Time'] && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Response Time:</span>
                        <span>{(result.response_info['Response Time'] * 1000).toFixed(0)}ms</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. 响应头 */}
                {result.response_info.Headers && (
                  <div className="p-2 rounded bg-background">
                    <p className="text-xs text-muted-foreground mb-1">Response Headers:</p>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-40">
                      {JSON.stringify(result.response_info.Headers, null, 2)}
                    </pre>
                  </div>
                )}

                {/* 3. Response Body - 可折叠 */}
                <div className="p-2 rounded bg-background">
                  <div
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-1 rounded"
                    onClick={() => setResponseExpanded(!responseExpanded)}
                  >
                    <p className="text-xs text-muted-foreground">Response Body:</p>
                    <span className="text-xs text-muted-foreground">
                      {responseExpanded ? '▼' : '▶'}
                    </span>
                  </div>
                  {responseExpanded && (
                    <div className="mt-2 space-y-2">
                      {/* 显示 Success */}
                      {result.response_info['Success'] !== undefined && (
                        <div className="text-xs bg-muted p-2 rounded">
                          <span className="font-mono">"Success": </span>
                          <Badge variant={result.response_info['Success'] === true ? 'default' : 'destructive'} className="ml-2">
                            {result.response_info['Success'] ? 'true' : 'false'}
                          </Badge>
                        </div>
                      )}

                      {/* 显示 Message */}
                      {result.response_info['Message'] && (
                        <div className="text-xs bg-muted p-2 rounded">
                          <span className="font-mono">"Message": </span>
                          <span className="ml-2">"{result.response_info['Message']}"</span>
                        </div>
                      )}

                      {/* 显示 Code */}
                      {result.response_info['Code'] !== undefined && (
                        <div className="text-xs bg-muted p-2 rounded">
                          <span className="font-mono">"Code": </span>
                          <span className="font-mono ml-2">{result.response_info['Code']}</span>
                        </div>
                      )}

                      {/* 显示 Data */}
                      {result.response_info.Data && (
                        <div className="text-xs bg-muted p-2 rounded">
                          <span className="font-mono block mb-2">"Data":</span>
                          <pre className="text-xs bg-background p-2 rounded overflow-x-auto max-h-60">
                            {JSON.stringify(result.response_info.Data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 时间戳 */}
          <div className="text-xs text-muted-foreground">
            执行时间: {formatDate(result.created_at)}
          </div>
        </div>
      )}
    </div>
  )
}
