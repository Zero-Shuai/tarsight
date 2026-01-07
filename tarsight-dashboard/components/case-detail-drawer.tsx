'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle2, XCircle, Circle, Copy, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { TestCaseResult } from '@/lib/types/database'

interface CaseDetailDrawerProps {
  caseResult: TestCaseResult | null
  allCases: TestCaseResult[]
  onClose: () => void
  onNavigate: (direction: 'up' | 'down') => void
}

// Simple syntax highlighting for JSON with better contrast
function syntaxHighlight(json: string) {
  if (!json) return null

  // Check if it's an empty object or array
  const trimmed = json.trim()
  if (trimmed === '{}' || trimmed === '[]') {
    return `<span class="text-slate-400 italic">${trimmed}</span>`
  }

  try {
    const obj = JSON.parse(json)
    const jsonString = JSON.stringify(obj, null, 2)

    return jsonString
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, (match) => {
        // Use high contrast colors
        let cls = 'text-[#8B5CF6]' // purple for keys (better contrast)
        if (match.endsWith(':')) {
          cls = 'text-[#3B82F6]' // blue for keys with colon
        }
        return `<span class="${cls}">${match}</span>`
      })
      .replace(/\b(true|false|null)\b/g, '<span class="text-amber-600">$1</span>')
      .replace(/\b(-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)\b/g, '<span class="text-emerald-600">$1</span>')
  } catch (error) {
    // Return escaped HTML string (not JSX) for dangerouslySetInnerHTML
    console.error('JSON parsing error:', error, 'Input:', json)
    const escaped = json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    return `<span class="text-slate-500">${escaped}</span>`
  }
}

// Helper to safely stringify data for syntax highlighting
function safeStringify(data: any): string | null {
  if (!data) return null

  // If already a string, check if it's valid JSON
  if (typeof data === 'string') {
    try {
      JSON.parse(data)
      return data // It's valid JSON string, use as-is
    } catch {
      // Not a JSON string, escape and return as plain text
      return data
    }
  }

  // If an object, stringify it
  try {
    return JSON.stringify(data, null, 2)
  } catch (error) {
    console.error('Stringification error:', error, 'Data:', data)
    return String(data)
  }
}

export function CaseDetailDrawer({ caseResult, allCases, onClose, onNavigate }: CaseDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('response')
  const [copied, setCopied] = useState(false)

  // Debug: 查看实际数据
  useEffect(() => {
    if (caseResult) {
      console.log('🔍 CaseDetailDrawer received data:', {
        id: caseResult.id,
        status: caseResult.status,
        response_time: caseResult.response_time,
        response_code: caseResult.response_code,
        module_name: caseResult.module_name,
        method: caseResult.method,
        has_request_headers: !!caseResult.request_headers,
        has_request_body: !!caseResult.request_body,
        has_response_headers: !!caseResult.response_headers,
        has_response_body: !!caseResult.response_body,
        request_headers_type: typeof caseResult.request_headers,
        request_body_type: typeof caseResult.request_body,
        response_headers_type: typeof caseResult.response_headers,
        response_body_type: typeof caseResult.response_body,
        request_headers_value: caseResult.request_headers,
        request_body_value: caseResult.request_body,
        response_headers_value: caseResult.response_headers,
        response_body_value: caseResult.response_body,
        original_request_info: (caseResult as any).request_info,
        original_response_info: (caseResult as any).response_info,
        full_data: caseResult
      })
    }
  }, [caseResult])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowUp') {
        onNavigate('up')
      } else if (e.key === 'ArrowDown') {
        onNavigate('down')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onNavigate, onClose])

  if (!caseResult) return null

  const currentIndex = allCases.findIndex((c) => c.id === caseResult.id)
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < allCases.length - 1

  const statusIcon =
    caseResult.status === 'passed' ? (
      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
    ) : caseResult.status === 'failed' ? (
      <XCircle className="h-5 w-5 text-rose-600" />
    ) : (
      <Circle className="h-5 w-5 text-amber-600" />
    )

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-3xl bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3 flex-1">
            {statusIcon}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-slate-900 truncate">
                {caseResult.test_name}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{caseResult.case_id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Navigation Buttons */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('up')}
              disabled={!hasPrevious}
              className="rounded-lg hover:bg-slate-100 disabled:opacity-30"
              title="上一个 (↑)"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('down')}
              disabled={!hasNext}
              className="rounded-lg hover:bg-slate-100 disabled:opacity-30"
              title="下一个 (↓)"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-slate-200 mx-2" />

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-lg hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Quick Info */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center py-3">
              <p className="text-2xl font-bold text-slate-900">{caseResult.response_time || 0}ms</p>
              <p className="text-xs font-medium text-slate-500 mt-1">响应时间</p>
            </div>
            <div className="text-center py-3">
              <Badge className={
                caseResult.status === 'passed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                caseResult.status === 'failed' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                'bg-amber-50 text-amber-600 border-amber-100'
              }>
                {caseResult.status === 'passed' ? '通过' : caseResult.status === 'failed' ? '失败' : '跳过'}
              </Badge>
            </div>
            <div className="text-center py-3">
              <p className="text-sm font-semibold text-slate-900">{caseResult.module_name}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">模块</p>
            </div>
            <div className="text-center py-3">
              <p className="text-sm font-semibold text-slate-900">{caseResult.method}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">方法</p>
            </div>
          </div>

          {/* Error Logs (if failed) */}
          {caseResult.status === 'failed' && caseResult.error_message && (
            <div className="p-4 bg-slate-900 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-rose-400 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  错误日志
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(caseResult.error_message || '')}
                  className="h-6 w-6 p-0 hover:bg-slate-800 rounded"
                  title="复制"
                >
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                </Button>
              </div>
              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap overflow-x-auto">
                {caseResult.error_message}
              </pre>
            </div>
          )}

          {/* Request/Response Tabs */}
          <div>
            <div className="flex items-center gap-2 border-b border-slate-200 mb-4">
              <button
                onClick={() => setActiveTab('request')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'request'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Request
              </button>
              <button
                onClick={() => setActiveTab('response')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'response'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Response
              </button>
            </div>

            {/* Request Content */}
            {activeTab === 'request' && (
              <div className="space-y-4">
                {/* Request Headers */}
                {caseResult.request_headers && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-900">Request Headers</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(caseResult.request_headers, null, 2))}
                        className="h-6 w-6 p-0 hover:bg-slate-100 rounded"
                      >
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                      </Button>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 overflow-x-auto">
                      <pre
                        className="text-xs font-mono"
                        dangerouslySetInnerHTML={{
                          __html: syntaxHighlight(safeStringify(caseResult.request_headers) || '') || ''
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Request Body */}
                {caseResult.request_body && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-900">Request Body</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(caseResult.request_body, null, 2))}
                        className="h-6 w-6 p-0 hover:bg-slate-100 rounded"
                      >
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                      </Button>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 overflow-x-auto">
                      <pre
                        className="text-xs font-mono"
                        dangerouslySetInnerHTML={{
                          __html: syntaxHighlight(safeStringify(caseResult.request_body) || '') || ''
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Response Content */}
            {activeTab === 'response' && (
              <div className="space-y-4">
                {/* Response Headers */}
                {caseResult.response_headers && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-900">Response Headers</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(caseResult.response_headers, null, 2))}
                        className="h-6 w-6 p-0 hover:bg-slate-100 rounded"
                      >
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                      </Button>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 overflow-x-auto">
                      <pre
                        className="text-xs font-mono"
                        dangerouslySetInnerHTML={{
                          __html: syntaxHighlight(safeStringify(caseResult.response_headers) || '') || ''
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Response Body */}
                {caseResult.response_body && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-900">Response Body</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(caseResult.response_body, null, 2))}
                        className="h-6 w-6 p-0 hover:bg-slate-100 rounded"
                      >
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                      </Button>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 overflow-x-auto max-h-96">
                      <pre
                        className="text-xs font-mono overflow-auto"
                        dangerouslySetInnerHTML={{
                          __html: syntaxHighlight(safeStringify(caseResult.response_body) || '') || ''
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Response Info */}
                {caseResult.response_code && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500">Status Code</p>
                      <p className="text-lg font-bold text-slate-900">{caseResult.response_code}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500">Response Time</p>
                      <p className="text-lg font-bold text-slate-900">{caseResult.response_time}ms</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500">Content-Type</p>
                      <p className="text-xs font-mono text-slate-700 truncate">{caseResult.response_headers?.['content-type'] || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer - Keyboard Shortcuts & Sticky Run Button */}
        <div className="sticky bottom-0 px-6 py-3 border-t border-[#E2E8F0] bg-white">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              快捷键: <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs ml-1">↓</kbd>
              切换用例 ·
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs ml-1">Esc</kbd>
              关闭
            </p>
            <Button
              onClick={() => {
                // TODO: Implement re-run functionality
                console.log('Re-run test case:', caseResult.id)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              重新执行
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
