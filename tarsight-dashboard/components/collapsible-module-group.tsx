'use client'

import { useState } from 'react'
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

export function CollapsibleModuleGroup({
  moduleName,
  cases,
  selectedCaseId,
  onCaseClick
}: CollapsibleModuleGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const passedCount = cases.filter((c) => c.status === 'passed').length
  const failedCount = cases.filter((c) => c.status === 'failed').length
  const skippedCount = cases.filter((c) => c.status === 'skipped').length

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
      {/* Module Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
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
            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-xs">
              通过 {passedCount}
            </Badge>
          )}
          {failedCount > 0 && (
            <Badge className="bg-rose-50 text-rose-600 border-rose-100 text-xs">
              失败 {failedCount}
            </Badge>
          )}
          {skippedCount > 0 && (
            <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-xs">
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
              onClick={() => onCaseClick(caseResult)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
