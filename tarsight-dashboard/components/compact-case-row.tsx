'use client'

import { memo } from 'react'
import { CheckCircle2, XCircle, Circle, Eye, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { TestCaseResult } from '@/lib/types/database'

interface CompactCaseRowProps {
  caseResult: TestCaseResult
  isSelected: boolean
  onClick: () => void
}

function getResponseTimeColor(responseTime: number): string {
  if (responseTime < 200) return 'text-[#10B981]'
  if (responseTime < 800) return 'text-[#F59E0B]'
  return 'text-[#EF4444]'
}

function getResponseTimeBg(responseTime: number): string {
  if (responseTime < 200) return 'bg-[#DCFCE7]'
  if (responseTime < 800) return 'bg-[#FEF3C7]'
  return 'bg-[#FEE2E2]'
}

export const CompactCaseRow = memo(function CompactCaseRow({ caseResult, isSelected, onClick }: CompactCaseRowProps) {
  const statusIcon =
    caseResult.status === 'passed' ? (
      <CheckCircle2 className="h-4 w-4 text-[#10B981]" strokeWidth={2.5} />
    ) : caseResult.status === 'failed' ? (
      <XCircle className="h-4 w-4 text-[#EF4444]" strokeWidth={2.5} />
    ) : (
      <Circle className="h-4 w-4 text-[#F59E0B]" strokeWidth={2.5} />
    )

  const responseTime = caseResult.response_time || 0
  const responseTimeColor = getResponseTimeColor(responseTime)
  const responseTimeBg = getResponseTimeBg(responseTime)

  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-4 px-4 py-2.5 hover:bg-[#F8FAFC] transition-colors duration-150 cursor-pointer border-b border-slate-50 last:border-0 ${
        isSelected ? 'bg-blue-50/50' : ''
      }`}
    >
      {/* ID */}
      <div className="w-20 flex-shrink-0">
        <span className="text-xs font-mono text-slate-600">{caseResult.case_id}</span>
      </div>

      {/* Status Icon */}
      <div className="w-8 flex-shrink-0 flex justify-center">{statusIcon}</div>

      {/* Case Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate" title={caseResult.test_name}>
          {caseResult.test_name}
        </p>
      </div>

      {/* Module Tag */}
      <div className="w-32 flex-shrink-0">
        <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">
          {caseResult.module_name}
        </Badge>
      </div>

      {/* Response Time */}
      <div className="w-24 flex-shrink-0 text-right">
        <span className={`text-xs font-semibold font-mono ${responseTimeColor}`}>
          {responseTime}ms
        </span>
      </div>

      {/* Action Buttons - Only on Hover */}
      <div className="w-32 flex-shrink-0 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs hover:bg-blue-50 hover:text-blue-600 rounded-md"
          onClick={(e) => {
            e.stopPropagation()
            // Re-run functionality
          }}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          重跑
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs hover:bg-blue-50 hover:text-blue-600 rounded-md"
        >
          <Eye className="h-3 w-3 mr-1" />
          详情
        </Button>
      </div>
    </div>
  )
})
