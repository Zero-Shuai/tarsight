'use client'

import { useState, memo, useMemo, useCallback } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { CompactCaseRow } from './compact-case-row'
import { Badge } from '@/components/ui/badge'
import type { TestCaseResult } from '@/lib/types/database'

interface CollapsibleModuleGroupProps {
  moduleName: string
  cases: TestCaseResult[]
  selectedCaseId: string | null
  onCaseClick: (caseResult: TestCaseResult) => void
}

export const CollapsibleModuleGroup = memo(function CollapsibleModuleGroup({
  moduleName,
  cases,
  selectedCaseId,
  onCaseClick
}: CollapsibleModuleGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const { passedCount, failedCount, skippedCount } = useMemo(() => {
    return {
      passedCount: cases.filter((c) => c.status === 'passed').length,
      failedCount: cases.filter((c) => c.status === 'failed').length,
      skippedCount: cases.filter((c) => c.status === 'skipped').length
    }
  }, [cases])

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  const handleCaseClick = useCallback((caseResult: TestCaseResult) => {
    onCaseClick(caseResult)
  }, [onCaseClick])

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
      {/* Module Header */}
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors duration-150"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-500" />
          )}
          <span className="text-sm font-semibold text-slate-900">{moduleName}</span>
          <span className="text-xs text-slate-500">({cases.length} 个用例)</span>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2">
          {passedCount > 0 && (
            <Badge className="bg-[#DCFCE7] text-[#10B981] border-[#10B981]/20 text-xs">
              通过 {passedCount}
            </Badge>
          )}
          {failedCount > 0 && (
            <Badge className="bg-[#FEE2E2] text-[#EF4444] border-[#EF4444]/20 text-xs">
              失败 {failedCount}
            </Badge>
          )}
          {skippedCount > 0 && (
            <Badge className="bg-[#FEF3C7] text-[#F59E0B] border-[#F59E0B]/20 text-xs">
              跳过 {skippedCount}
            </Badge>
          )}
        </div>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="bg-white">
          {cases.map((caseResult) => (
            <CompactCaseRow
              key={caseResult.id}
              caseResult={caseResult}
              isSelected={selectedCaseId === caseResult.id}
              onClick={() => handleCaseClick(caseResult)}
            />
          ))}
        </div>
      )}
    </div>
  )
})
