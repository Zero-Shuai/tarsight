'use client'

import { useState, memo, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Clock, PlayCircle, Copy, X } from 'lucide-react'
import type { TestExecution } from '@/lib/types/database'

interface ExecutionListCompactProps {
  executions: TestExecution[]
}

// Memoized helper functions - defined outside component to avoid recreation
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '无效时间'

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai'
  })
}

const statusInfoMap = {
  running: {
    text: '运行中',
    className: 'bg-blue-50 text-blue-600 border-blue-100',
    icon: PlayCircle,
    iconColor: 'text-[#3B82F6]',
    barColor: 'bg-[#3B82F6]'
  },
  completed: {
    text: '已完成',
    className: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    icon: CheckCircle2,
    iconColor: 'text-[#10B981]',
    barColor: 'bg-[#10B981]'
  },
  failed: {
    text: '失败',
    className: 'bg-rose-50 text-rose-600 border-rose-100',
    icon: XCircle,
    iconColor: 'text-[#EF4444]',
    barColor: 'bg-[#EF4444]'
  }
} as const

function getStatusInfo(status: string) {
  return statusInfoMap[status as keyof typeof statusInfoMap] || {
    text: status,
    className: 'bg-slate-50 text-slate-600 border-slate-100',
    icon: Clock,
    iconColor: 'text-slate-400',
    barColor: 'bg-slate-400'
  }
}

// 缓存计算统计数据
function calculateExecutionStats(execution: TestExecution) {
  const passedTests = execution.passed_tests || 0
  const failedTests = execution.failed_tests || 0
  const skippedTests = execution.skipped_tests || 0
  const executedTests = execution.total_tests - skippedTests
  const passRate = executedTests > 0
    ? (passedTests / executedTests) * 100
    : 0
  return { passedTests, failedTests, skippedTests, executedTests, passRate }
}

export const ExecutionListCompact = memo(function ExecutionListCompact({ executions }: ExecutionListCompactProps) {
  const [selectedExecution, setSelectedExecution] = useState<TestExecution | null>(null)

  return (
    <>
      {/* List Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-50 overflow-hidden">
        {/* Header - Fixed-width grid */}
        <div className="px-6 py-3 border-b border-slate-100">
          <div className="grid text-xs font-semibold text-slate-500 uppercase tracking-wider items-center"
               style={{ gridTemplateColumns: '4px 1.5fr 80px 80px 80px 80px 100px' }}>
            <div></div>
            <div>执行信息</div>
            <div className="text-center">总用例</div>
            <div className="text-center">通过</div>
            <div className="text-center">失败</div>
            <div className="text-center">跳过</div>
            <div className="text-center">通过率</div>
          </div>
        </div>

        {/* List Rows */}
        <div className="divide-y divide-slate-50">
          {executions.map((execution) => {
            const stats = calculateExecutionStats(execution)
            const statusInfo = getStatusInfo(execution.status)
            const StatusIcon = statusInfo.icon

            return (
              <div
                key={execution.id}
                onClick={() => setSelectedExecution(execution)}
                className="group relative flex items-center px-6 py-3 hover:bg-[#F8FAFC] transition-colors duration-150 cursor-pointer"
              >
                {/* Status Indicator Bar - Match icon color exactly */}
                <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${statusInfo.barColor}`} />

                {/* Content Grid - Fixed-width columns matching header */}
                <div className="grid items-center flex-1"
                     style={{ gridTemplateColumns: '4px 1.5fr 80px 80px 80px 80px 100px' }}>
                  {/* Status Icon */}
                  <div className="flex justify-center">
                    <StatusIcon className={`h-4 w-4 flex-shrink-0 ${statusInfo.iconColor}`} />
                  </div>

                  {/* Execution Name & Timestamp */}
                  <div className="min-w-0 px-2">
                    <p className="text-sm font-bold text-[#1E293B] truncate group-hover:text-blue-600 transition-colors">
                      {execution.execution_name}
                    </p>
                    <p className="text-[12px] text-[#64748B] font-mono mt-0.5">
                      {formatDate(execution.started_at)}
                    </p>
                  </div>

                  {/* Total Count - Centered */}
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900">{execution.total_tests}</p>
                  </div>

                  {/* Pass Count - Centered */}
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#10B981]">{stats.passedTests}</p>
                  </div>

                  {/* Fail Count - Centered */}
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#EF4444]">{stats.failedTests}</p>
                  </div>

                  {/* Skipped Count - Centered */}
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#F59E0B]">{stats.skippedTests}</p>
                  </div>

                  {/* Success Rate Badge - High contrast pill shape */}
                  <div className="flex justify-center">
                    <Badge
                      variant="outline"
                      className={`font-semibold px-3 py-1 rounded-full ${
                        stats.passRate === 100
                          ? 'bg-[#DCFCE7] text-[#166534] border-emerald-200'
                          : 'bg-[#FEE2E2] text-[#991B1B] border-rose-200'
                      }`}
                    >
                      {stats.passRate.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {executions.length === 0 && (
          <div className="py-20 px-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-50 to-slate-100 mb-6">
                <PlayCircle className="h-12 w-12 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">暂无执行记录</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
                执行测试后，您的测试记录将显示在这里。您可以随时查看每次执行的详细结果。
              </p>
              <Link href="/test-cases">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  立即执行测试
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Execution Details Drawer */}
      {selectedExecution && (
        <ExecutionDetailsDrawer
          execution={selectedExecution}
          onClose={() => setSelectedExecution(null)}
        />
      )}
    </>
  )
})

// Drawer Component for Execution Details
function ExecutionDetailsDrawer({
  execution,
  onClose
}: {
  execution: TestExecution
  onClose: () => void
}) {
  // 通过率 = 通过数 / (总数 - 跳过数) * 100
  // 只计算实际执行的用例（排除跳过的）
  const passedTests = execution.passed_tests || 0
  const failedTests = execution.failed_tests || 0
  const skippedTests = execution.skipped_tests || 0
  const executedTests = execution.total_tests - skippedTests
  const passRate = executedTests > 0
    ? (passedTests / executedTests) * 100
    : 0
  const statusInfo = getStatusInfo(execution.status)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(execution.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl transform transition-transform duration-300 ease-out">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${statusInfo.className}`}>
              <statusInfo.icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{execution.execution_name}</h2>
              <p className="text-[12px] text-[#64748B] font-mono">{formatDate(execution.started_at)}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-lg hover:bg-slate-100 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Statistics Cards - Minimalist Design */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center py-3">
              <p className="text-3xl font-bold text-slate-900">{execution.total_tests}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">总用例</p>
            </div>
            <div className="text-center py-3">
              <p className="text-3xl font-bold text-[#10B981]">{passedTests}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">通过</p>
            </div>
            <div className="text-center py-3">
              <p className="text-3xl font-bold text-[#EF4444]">{failedTests}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">失败</p>
            </div>
            <div className="text-center py-3">
              <p className="text-3xl font-bold text-[#F59E0B]">{skippedTests}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">跳过</p>
            </div>
          </div>

          {/* Error Message (if exists) */}
          {execution.error_message && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg">
              <p className="text-sm font-semibold text-rose-600 mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                错误信息
              </p>
              <p className="text-sm text-rose-700">{execution.error_message}</p>
            </div>
          )}

          {/* Success Rate Progress - Dynamic colors: <50% red, 50-99% amber, 100% green */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">通过率</span>
              <span className="text-sm font-bold text-slate-900">{passRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  passRate === 100
                    ? 'bg-[#10B981]'
                    : passRate >= 50
                    ? 'bg-[#F59E0B]'
                    : 'bg-[#EF4444]'
                }`}
                style={{ width: `${passRate}%` }}
              />
            </div>
          </div>

          {/* Execution Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">执行详情</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">执行 ID</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-700">{execution.id.slice(0, 8)}...</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                    className="h-6 w-6 p-0 hover:bg-slate-100 rounded-md"
                    title="复制 ID"
                  >
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">开始时间</span>
                <span className="font-mono text-slate-700">{formatDate(execution.started_at)}</span>
              </div>
              {execution.completed_at && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">完成时间</span>
                  <span className="font-mono text-slate-700">{formatDate(execution.completed_at)}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-slate-500">状态</span>
                <Badge className={statusInfo.className}>{statusInfo.text}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer - Sticky with border-top */}
        <div className="sticky bottom-0 flex items-center justify-between px-6 py-4 border-t border-[#E2E8F0] bg-white">
          <Button variant="outline" onClick={onClose} className="rounded-lg">
            关闭
          </Button>
          <Link href={`/executions/${execution.id}`}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
              查看完整报告
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
