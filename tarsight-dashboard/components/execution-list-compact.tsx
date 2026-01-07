'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Clock, PlayCircle, Copy, X, Eye } from 'lucide-react'
import type { TestExecution } from '@/lib/types/database'

interface ExecutionListCompactProps {
  executions: TestExecution[]
}

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

function getStatusInfo(status: string) {
  const info = {
    running: {
      text: '运行中',
      className: 'bg-blue-50 text-blue-600 border-blue-100',
      icon: PlayCircle,
      iconColor: 'text-[#3B82F6]', // Blue-500
      barColor: 'bg-[#3B82F6]'
    },
    completed: {
      text: '已完成',
      className: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      icon: CheckCircle2,
      iconColor: 'text-[#10B981]', // Emerald-500
      barColor: 'bg-[#10B981]'
    },
    failed: {
      text: '失败',
      className: 'bg-rose-50 text-rose-600 border-rose-100',
      icon: XCircle,
      iconColor: 'text-[#EF4444]', // Red-500
      barColor: 'bg-[#EF4444]'
    }
  }
  return info[status as keyof typeof info] || {
    text: status,
    className: 'bg-slate-50 text-slate-600 border-slate-100',
    icon: Clock,
    iconColor: 'text-slate-400',
    barColor: 'bg-slate-400'
  }
}

export function ExecutionListCompact({ executions }: ExecutionListCompactProps) {
  const [selectedExecution, setSelectedExecution] = useState<TestExecution | null>(null)

  return (
    <>
      {/* List Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-50 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-3 border-b border-slate-100">
          <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider items-center">
            <div className="col-span-4 pl-2">执行信息</div>
            <div className="col-span-2 text-center">总用例</div>
            <div className="col-span-2 text-center">通过</div>
            <div className="col-span-2 text-center">失败</div>
            <div className="col-span-2 text-center">通过率</div>
          </div>
        </div>

        {/* List Rows */}
        <div className="divide-y divide-slate-50">
          {executions.map((execution) => {
            const passRate = execution.total_tests > 0
              ? (execution.passed_tests / execution.total_tests) * 100
              : 0
            const statusInfo = getStatusInfo(execution.status)
            const StatusIcon = statusInfo.icon

            return (
              <div
                key={execution.id}
                onClick={() => setSelectedExecution(execution)}
                className="group relative flex items-center px-6 py-3 hover:bg-[#F8FAFC] transition-colors duration-150 cursor-pointer"
              >
                {/* Status Indicator Bar - Match icon color exactly */}
                <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${statusInfo.barColor}`} />

                {/* Content Grid - Match header layout exactly */}
                <div className="grid grid-cols-12 gap-4 items-center flex-1 ml-2">
                  {/* Execution Name & Timestamp */}
                  <div className="col-span-4 min-w-0 pl-2">
                    <div className="flex items-center gap-2.5">
                      <StatusIcon className={`h-4 w-4 flex-shrink-0 ${statusInfo.iconColor}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#1E293B] truncate group-hover:text-blue-600 transition-colors">
                          {execution.execution_name}
                        </p>
                        <p className="text-[12px] text-[#64748B] font-mono mt-0.5">
                          {formatDate(execution.started_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Total Count - Centered */}
                  <div className="col-span-2 text-center">
                    <p className="text-lg font-bold text-slate-900">{execution.total_tests}</p>
                  </div>

                  {/* Pass Count - Centered */}
                  <div className="col-span-2 text-center">
                    <p className="text-lg font-bold text-emerald-600">{execution.passed_tests}</p>
                  </div>

                  {/* Fail Count - Centered */}
                  <div className="col-span-2 text-center">
                    <p className="text-lg font-bold text-rose-600">{execution.failed_tests}</p>
                  </div>

                  {/* Success Rate Badge - Dynamic colors: <50% red, 50-99% orange, 100% green */}
                  <div className="col-span-2 flex justify-center">
                    <Badge
                      variant="outline"
                      className={`font-semibold ${
                        passRate === 100
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : passRate >= 50
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}
                    >
                      {passRate.toFixed(1)}%
                    </Badge>
                  </div>
                </div>

                {/* Ghost "View" Button - Only on Hover */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-sm font-medium"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedExecution(execution)
                  }}
                >
                  <Eye className="h-4 w-4 mr-1.5" />
                  查看
                </Button>
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
}

// Drawer Component for Execution Details
function ExecutionDetailsDrawer({
  execution,
  onClose
}: {
  execution: TestExecution
  onClose: () => void
}) {
  const passRate = execution.total_tests > 0
    ? (execution.passed_tests / execution.total_tests) * 100
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
              <p className="text-3xl font-bold text-emerald-600">{execution.passed_tests}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">通过</p>
            </div>
            <div className="text-center py-3">
              <p className="text-3xl font-bold text-rose-600">{execution.failed_tests}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">失败</p>
            </div>
            <div className="text-center py-3">
              <p className="text-3xl font-bold text-amber-600">{execution.skipped_tests}</p>
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

          {/* Success Rate Progress - Dynamic colors: <50% red, 50-99% orange, 100% green */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">通过率</span>
              <span className="text-sm font-bold text-slate-900">{passRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  passRate === 100
                    ? 'bg-emerald-500'
                    : passRate >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
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

        {/* Drawer Footer - Primary CTA Button with Shadow */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
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
