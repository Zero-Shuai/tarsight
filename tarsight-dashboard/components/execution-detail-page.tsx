'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FilterHeader } from './execution-filter-header'
import { CollapsibleModuleGroup } from './collapsible-module-group'
import { CaseDetailDrawer } from './case-detail-drawer'
import { ExecutionDetailSkeleton } from './execution-detail-skeleton'
import { ExecutionDetailEmptyState } from './execution-detail-empty-state'
import { Suspense } from 'react'
import type { TestCaseResult, TestExecution } from '@/lib/types/database'

interface ExecutionDetailPageProps {
  execution: TestExecution
  testResults: TestCaseResult[]
}

export function ExecutionDetailPage({ execution, testResults: initialResults }: ExecutionDetailPageProps) {
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed' | 'skipped'>('all')
  const [selectedModule, setSelectedModule] = useState<string | 'all'>('all')
  const [selectedCase, setSelectedCase] = useState<TestCaseResult | null>(null)

  // Derived states
  const modules = useMemo(() => {
    const uniqueModules = [...new Set(initialResults.map((r) => r.module_name).filter((name): name is string => !!name))]
    return uniqueModules.sort()
  }, [initialResults])

  const filteredResults = useMemo(() => {
    let results = initialResults

    // Status filter
    if (statusFilter !== 'all') {
      results = results.filter((r) => r.status === statusFilter)
    }

    // Module filter
    if (selectedModule !== 'all') {
      results = results.filter((r) => r.module_name === selectedModule)
    }

    // Search filter (debounced in real implementation)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      results = results.filter(
        (r) =>
          r.case_id?.toLowerCase().includes(query) ||
          r.test_name?.toLowerCase().includes(query) ||
          r.url?.toLowerCase().includes(query)
      )
    }

    return results
  }, [initialResults, statusFilter, selectedModule, searchQuery])

  // Group by module
  const groupedResults = useMemo(() => {
    const groups: Record<string, TestCaseResult[]> = {}
    filteredResults.forEach((result) => {
      const module = result.module_name || 'Unknown'
      if (!groups[module]) {
        groups[module] = []
      }
      groups[module].push(result)
    })
    return groups
  }, [filteredResults])

  // Statistics
  const stats = useMemo(() => ({
    total: initialResults.length,
    passed: initialResults.filter((r) => r.status === 'passed').length,
    failed: initialResults.filter((r) => r.status === 'failed').length,
    skipped: initialResults.filter((r) => r.status === 'skipped').length
  }), [initialResults])

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || selectedModule !== 'all'

  const handleClearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setSelectedModule('all')
  }

  const handleCaseNavigate = useCallback((direction: 'up' | 'down') => {
    if (!selectedCase) return

    const currentIndex = filteredResults.findIndex((c) => c.id === selectedCase.id)
    let newIndex = currentIndex

    if (direction === 'up' && currentIndex > 0) {
      newIndex = currentIndex - 1
    } else if (direction === 'down' && currentIndex < filteredResults.length - 1) {
      newIndex = currentIndex + 1
    }

    if (newIndex >= 0 && newIndex < filteredResults.length && newIndex !== currentIndex) {
      setSelectedCase(filteredResults[newIndex])
    }
  }, [selectedCase, filteredResults])

  // Close drawer when Escape is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedCase(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-6 py-4">
          <Link href="/executions">
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回执行历史
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">{execution.execution_name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            执行时间: {new Date(execution.started_at).toLocaleString('zh-CN')}
          </p>
        </div>
      </div>

      {/* Filter Header */}
      <FilterHeader
        totalCases={stats.total}
        passedCount={stats.passed}
        failedCount={stats.failed}
        skippedCount={stats.skipped}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        modules={modules}
        selectedModule={selectedModule}
        onModuleChange={setSelectedModule}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Content */}
      <div className="px-6 py-6">
        {/* Error Message (if exists) */}
        {execution.error_message && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-lg">
            <p className="text-sm font-semibold text-rose-600 mb-2">⚠️ 执行失败</p>
            <p className="text-sm text-rose-700">{execution.error_message}</p>
          </div>
        )}

        {/* Test Cases Grouped by Module */}
        {Object.keys(groupedResults).length > 0 ? (
          <div>
            {Object.entries(groupedResults).map(([moduleName, cases]) => (
              <CollapsibleModuleGroup
                key={moduleName}
                moduleName={moduleName}
                cases={cases}
                selectedCaseId={selectedCase?.id || null}
                onCaseClick={setSelectedCase}
              />
            ))}
          </div>
        ) : (
          <ExecutionDetailEmptyState
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />
        )}
      </div>

      {/* Detail Drawer */}
      {selectedCase && (
        <CaseDetailDrawer
          caseResult={selectedCase}
          allCases={filteredResults}
          onClose={() => setSelectedCase(null)}
          onNavigate={handleCaseNavigate}
        />
      )}
    </div>
  )
}

// Loading wrapper component
export function ExecutionDetailPageWrapper() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-6">
      <ExecutionDetailSkeleton />
    </div>
  )
}
