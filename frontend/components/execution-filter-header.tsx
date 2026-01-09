'use client'

import { memo } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface FilterHeaderProps {
  totalCases: number
  passedCount: number
  failedCount: number
  skippedCount: number
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: 'all' | 'passed' | 'failed' | 'skipped'
  onStatusFilterChange: (status: 'all' | 'passed' | 'failed' | 'skipped') => void
  modules: string[]
  selectedModule: string | 'all'
  onModuleChange: (module: string | 'all') => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}

function FilterHeaderComponent({
  totalCases,
  passedCount,
  failedCount,
  skippedCount,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  modules,
  selectedModule,
  onModuleChange,
  onClearFilters,
  hasActiveFilters
}: FilterHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
      <div className="px-6 py-4 space-y-4">
        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="搜索用例名称、ID 或 URL..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-8"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="rounded-lg"
            >
              <X className="h-4 w-4 mr-2" />
              清除筛选
            </Button>
          )}
        </div>

        {/* Status Filters & Module Filter */}
        <div className="flex items-center gap-6">
          {/* Status Quick-Filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">
              状态
            </span>
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStatusFilterChange('all')}
              className="rounded-lg"
            >
              全部
              <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-700">
                {totalCases}
              </Badge>
            </Button>
            <Button
              variant={statusFilter === 'passed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStatusFilterChange('passed')}
              className={`rounded-lg ${statusFilter === 'passed' ? 'bg-[#10B981] hover:bg-[#059669]' : ''}`}
            >
              通过
              <Badge variant="secondary" className="ml-2 bg-[#DCFCE7] text-[#10B981]">
                {passedCount}
              </Badge>
            </Button>
            <Button
              variant={statusFilter === 'failed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStatusFilterChange('failed')}
              className={`rounded-lg ${statusFilter === 'failed' ? 'bg-[#EF4444] hover:bg-[#DC2626]' : ''}`}
            >
              失败
              <Badge variant="secondary" className="ml-2 bg-[#FEE2E2] text-[#EF4444]">
                {failedCount}
              </Badge>
            </Button>
            <Button
              variant={statusFilter === 'skipped' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStatusFilterChange('skipped')}
              className={`rounded-lg ${statusFilter === 'skipped' ? 'bg-[#F59E0B] hover:bg-[#D97706]' : ''}`}
            >
              跳过
              <Badge variant="secondary" className="ml-2 bg-[#FEF3C7] text-[#F59E0B]">
                {skippedCount}
              </Badge>
            </Button>
          </div>

          {/* Module Filter Dropdown */}
          {modules.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">
                模块
              </span>
              <select
                value={selectedModule}
                onChange={(e) => onModuleChange(e.target.value)}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部模块</option>
                {modules.map((module) => (
                  <option key={module} value={module}>
                    {module}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const FilterHeader = memo(FilterHeaderComponent, (prevProps, nextProps) => {
  return (
    prevProps.totalCases === nextProps.totalCases &&
    prevProps.passedCount === nextProps.passedCount &&
    prevProps.failedCount === nextProps.failedCount &&
    prevProps.skippedCount === nextProps.skippedCount &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.statusFilter === nextProps.statusFilter &&
    prevProps.selectedModule === nextProps.selectedModule &&
    prevProps.hasActiveFilters === nextProps.hasActiveFilters &&
    prevProps.modules.length === nextProps.modules.length &&
    prevProps.onSearchChange === nextProps.onSearchChange &&
    prevProps.onStatusFilterChange === nextProps.onStatusFilterChange &&
    prevProps.onModuleChange === nextProps.onModuleChange &&
    prevProps.onClearFilters === nextProps.onClearFilters
  )
})
