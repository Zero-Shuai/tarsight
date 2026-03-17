'use client'

import { useState, useMemo, useEffect, memo, useCallback } from 'react'
import { ChevronDown, ChevronRight, Play, Edit, Trash2, Search, Plus, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Circle, XCircle } from 'lucide-react'
import type { AITestCaseDraft, TestCase, Module } from '@/lib/types/database'
import { supabase as supabaseClient } from '@/lib/supabase/client'
import { TestCaseFormDrawer } from './test-case-form-drawer'
import { TestCaseRunDrawer } from './test-case-run-drawer'
import { AITestCaseGeneratorDrawer } from './ai-test-case-generator-drawer'

interface TestCaseWorkbenchProps {
  groupedCases: Record<string, TestCase[]>
  modules: Module[]
  initialTestCases: TestCase[]
  onUpdate: () => void
}

// Priority badge styles - using inline styles to override all CSS
function getPriorityStyle(level: string) {
  const styles: Record<string, { backgroundColor: string; color: string }> = {
    P0: { backgroundColor: '#FEE2E2', color: '#991B1B' },
    P1: { backgroundColor: '#FFEDD5', color: '#9A3412' },
    P2: { backgroundColor: '#DBEAFE', color: '#1E40AF' },
    P3: { backgroundColor: '#F3F4F6', color: '#374151' }
  }
  return styles[level as keyof typeof styles] || styles.P2
}

// Method badge colors (using unified color system)
function getMethodBadge(method: string) {
  const methods = {
    GET: 'bg-[#DBEAFE] text-[#3B82F6] border-[#3B82F6]/20',
    POST: 'bg-[#DCFCE7] text-[#10B981] border-[#10B981]/20',
    PUT: 'bg-[#FEF3C7] text-[#F59E0B] border-[#F59E0B]/20',
    DELETE: 'bg-[#FEE2E2] text-[#EF4444] border-[#EF4444]/20',
    PATCH: 'bg-[#EDE9FE] text-[#8B5CF6] border-[#8B5CF6]/20'
  }
  return methods[method as keyof typeof methods] || methods.GET
}

export function TestCaseWorkbench({
  groupedCases,
  modules,
  initialTestCases,
  onUpdate
}: TestCaseWorkbenchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [testCases, setTestCases] = useState(initialTestCases)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(Object.keys(groupedCases)))
  const [editingCase, setEditingCase] = useState<TestCase | null>(null)
  const [runningCase, setRunningCase] = useState<TestCase | null>(null)
  const [aiDraft, setAiDraft] = useState<AITestCaseDraft | null>(null)
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false)

  // Filter cases based on search query
  const filteredGroupedCases = useMemo(() => {
    if (!searchQuery.trim()) {
      return testCases.reduce((acc, tc) => {
        const module = modules.find(m => m.id === tc.module_id)
        const moduleName = module?.name || 'Unknown'
        if (!acc[moduleName]) {
          acc[moduleName] = []
        }
        acc[moduleName].push(tc)
        return acc
      }, {} as Record<string, TestCase[]>)
    }

    const query = searchQuery.toLowerCase()
    return testCases
      .filter(tc =>
        tc.case_id?.toLowerCase().includes(query) ||
        tc.test_name?.toLowerCase().includes(query) ||
        tc.url?.toLowerCase().includes(query) ||
        tc.tags?.some((tag: string) => tag.toLowerCase().includes(query))
      )
      .reduce((acc, tc) => {
        const module = modules.find(m => m.id === tc.module_id)
        const moduleName = module?.name || 'Unknown'
        if (!acc[moduleName]) {
          acc[moduleName] = []
        }
        acc[moduleName].push(tc)
        return acc
      }, {} as Record<string, TestCase[]>)
  }, [testCases, searchQuery, modules])

  const toggleModule = useCallback((moduleName: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleName)) {
        next.delete(moduleName)
      } else {
        next.add(moduleName)
      }
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    if (expandedModules.size === Object.keys(filteredGroupedCases).length) {
      setExpandedModules(new Set())
    } else {
      setExpandedModules(new Set(Object.keys(filteredGroupedCases)))
    }
  }, [expandedModules.size, filteredGroupedCases])

  const handleDelete = useCallback(async (testCase: TestCase) => {
    if (!confirm(`确定要删除测试用例 "${testCase.test_name}" 吗？`)) return

    try {
      const { error } = await supabaseClient
        .from('test_cases')
        .update({ is_active: false })
        .eq('id', testCase.id)

      if (error) throw error

      // Update local state
      setTestCases(prev => prev.filter(tc => tc.id !== testCase.id))
      onUpdate()
    } catch (error: any) {
      alert('删除失败: ' + error.message)
    }
  }, [onUpdate])

  return (
    <>
      {/* Search and Action Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-50 p-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="搜索用例 ID、名称、URL 或标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-lg transition-all duration-200"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAll}
              className="rounded-lg transition-all duration-200"
            >
              {expandedModules.size === Object.keys(filteredGroupedCases).length ? '全部折叠' : '全部展开'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setAiDrawerOpen(true)}
              className="rounded-lg transition-all duration-200"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI 生成
            </Button>
            <Button
              onClick={() => {
                setAiDraft(null)
                setEditingCase({} as TestCase)
              }}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              新建用例
            </Button>
          </div>
        </div>
      </div>

      {/* Module Groups */}
      <div className="space-y-4">
        {Object.entries(filteredGroupedCases).length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-50 p-12 text-center">
            <p className="text-slate-500">未找到匹配的测试用例</p>
          </div>
        ) : (
          Object.entries(filteredGroupedCases).map(([moduleName, cases]) => (
            <ModuleGroup
              key={moduleName}
              moduleName={moduleName}
              cases={cases}
              isExpanded={expandedModules.has(moduleName)}
              onToggle={() => toggleModule(moduleName)}
              onEdit={(testCase) => setEditingCase(testCase)}
              onRun={(testCase) => setRunningCase(testCase)}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Edit/Create Drawer */}
      {editingCase !== null && (
        <TestCaseFormDrawer
          testCase={editingCase.id ? editingCase : undefined}
          modules={modules}
          initialDraft={editingCase.id ? null : aiDraft}
          onClose={() => {
            setEditingCase(null)
            setAiDraft(null)
          }}
          onSuccess={() => {
            setEditingCase(null)
            setAiDraft(null)
            onUpdate()
          }}
        />
      )}

      {aiDrawerOpen && (
        <AITestCaseGeneratorDrawer
          modules={modules}
          onClose={() => setAiDrawerOpen(false)}
          onApply={(draft) => {
            setAiDraft(draft)
            setAiDrawerOpen(false)
            setEditingCase({} as TestCase)
          }}
        />
      )}

      {/* Run Drawer */}
      {runningCase && (
        <TestCaseRunDrawer
          testCase={runningCase}
          onClose={() => setRunningCase(null)}
        />
      )}
    </>
  )
}

// Module Group Component
interface ModuleGroupProps {
  moduleName: string
  cases: TestCase[]
  isExpanded: boolean
  onToggle: () => void
  onEdit: (testCase: TestCase) => void
  onRun: (testCase: TestCase) => void
  onDelete: (testCase: TestCase) => void
}

const ModuleGroup = memo(function ModuleGroup({
  moduleName,
  cases,
  isExpanded,
  onToggle,
  onEdit,
  onRun,
  onDelete
}: ModuleGroupProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-50 overflow-hidden">
      {/* Module Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-slate-500 transition-transform duration-200" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-500 transition-transform duration-200" />
          )}
          <span className="text-sm font-semibold text-slate-900">{moduleName}</span>
          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-xs rounded-lg">
            {cases.length}
          </Badge>
        </div>

        {/* Active Cases Badge */}
        <div className="flex items-center gap-2">
          <Badge className="bg-[#DCFCE7] text-[#10B981] border-[#10B981]/20 text-xs rounded-lg">
            活跃 {cases.filter(c => c.is_active).length}
          </Badge>
        </div>
      </button>

      {/* Cases Table */}
      {isExpanded && (
        <div className="border-t border-slate-100">
          {/* Table Header */}
          <div
            className="grid gap-3 px-4 py-2 bg-slate-50 border-b border-slate-100"
            style={{ gridTemplateColumns: '70px 90px 1.5fr 80px 1fr 120px' }}
          >
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">优先级</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">用例名称</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">方法</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">URL</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">操作</div>
          </div>

          {/* Table Rows */}
          {cases.map((testCase) => (
            <TestCaseRow
              key={testCase.id}
              testCase={testCase}
              onEdit={onEdit}
              onRun={onRun}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
})

// Test Case Row Component
interface TestCaseRowProps {
  testCase: TestCase
  onEdit: (testCase: TestCase) => void
  onRun: (testCase: TestCase) => void
  onDelete: (testCase: TestCase) => void
}

const TestCaseRow = memo(function TestCaseRow({ testCase, onEdit, onRun, onDelete }: TestCaseRowProps) {
  const priorityStyle = getPriorityStyle(testCase.level || 'P2')

  return (
    <div
      className="group grid gap-3 px-4 py-3 hover:bg-[#F8FAFC] transition-all duration-200 border-b border-slate-50 last:border-0 items-center"
      style={{ gridTemplateColumns: '70px 90px 1.5fr 80px 1fr 120px' }}
    >
      {/* ID */}
      <div className="text-xs font-mono text-slate-600 truncate" title={testCase.case_id}>
        {testCase.case_id}
      </div>

      {/* Priority Badge */}
      <div>
        <span
          style={priorityStyle}
          className="px-2.5 py-0.5 rounded-full font-semibold text-xs inline-block"
        >
          {testCase.level || 'P2'}
        </span>
      </div>

      {/* Case Name */}
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate" title={testCase.test_name}>
          {testCase.test_name}
        </p>
        {testCase.tags && testCase.tags.length > 0 && (
          <AdaptiveTags tags={testCase.tags} />
        )}
      </div>

      {/* Method Badge */}
      <div>
        <Badge className={`text-xs px-2.5 py-1 ${getMethodBadge(testCase.method || 'GET')} transition-all duration-200`}>
          {testCase.method || 'GET'}
        </Badge>
      </div>

      {/* URL */}
      <div className="text-xs font-mono text-[#475569] truncate" title={testCase.url}>
        {testCase.url}
      </div>

      {/* Actions */}
      <div
        className="flex opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ alignItems: 'center', gap: '12px', width: '100%', justifyContent: 'flex-end' }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRun(testCase)}
          className="text-slate-400 hover:text-[#10B981] rounded-full transition-all duration-200"
          title="运行"
          style={{ width: '32px !important', height: '32px !important', minWidth: '32px !important', maxWidth: '32px !important', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 !important' }}
        >
          <Play strokeWidth={2.5} style={{ width: '18px', height: '18px', minWidth: '18px', maxWidth: '18px' }} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(testCase)}
          className="text-slate-400 hover:text-blue-600 rounded-full transition-all duration-200"
          title="编辑"
          style={{ width: '32px !important', height: '32px !important', minWidth: '32px !important', maxWidth: '32px !important', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 !important' }}
        >
          <Edit strokeWidth={2.5} style={{ width: '18px', height: '18px', minWidth: '18px', maxWidth: '18px' }} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(testCase)}
          className="text-slate-400 hover:text-[#EF4444] rounded-full transition-all duration-200"
          title="删除"
          style={{ width: '32px !important', height: '32px !important', minWidth: '32px !important', maxWidth: '32px !important', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 !important' }}
        >
          <Trash2 strokeWidth={2.5} style={{ width: '18px', height: '18px', minWidth: '18px', maxWidth: '18px' }} />
        </Button>
      </div>
    </div>
  )
})

// Adaptive Tags Component - Shows as many tags as fit
const AdaptiveTags = memo(function AdaptiveTags({ tags }: { tags: string[] }) {
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)
  const [visibleCount, setVisibleCount] = useState(tags.length)

  useEffect(() => {
    if (!containerRef) return

    const calculateVisible = () => {
      const containerWidth = containerRef.offsetWidth
      const availableWidth = containerWidth * 0.4 // 40% of row width
      let totalWidth = 0
      let count = 0

      // Create temporary elements to measure
      const temp = document.createElement('div')
      temp.style.visibility = 'hidden'
      temp.style.position = 'absolute'
      document.body.appendChild(temp)

      for (let i = 0; i < tags.length; i++) {
        const tag = document.createElement('span')
        tag.className = 'inline-flex items-center px-1.5 py-0 text-[10px] bg-[#F1F5F9] text-slate-500 rounded'
        tag.textContent = tags[i]
        temp.appendChild(tag)

        if (totalWidth + tag.offsetWidth > availableWidth) {
          break
        }

        totalWidth += tag.offsetWidth + 4 // gap
        count++
      }

      document.body.removeChild(temp)
      setVisibleCount(count)
    }

    calculateVisible()
    window.addEventListener('resize', calculateVisible)
    return () => window.removeEventListener('resize', calculateVisible)
  }, [tags, containerRef])

  return (
    <div ref={setContainerRef} className="flex gap-1 mt-1 items-center">
      {tags.slice(0, visibleCount).map((tag: string) => (
        <Badge
          key={tag}
          variant="outline"
          className="text-[10px] px-1.5 py-0 bg-[#F1F5F9] text-slate-500 border-transparent rounded-lg transition-all duration-200"
        >
          {tag}
        </Badge>
      ))}
      {tags.length > visibleCount && (
        <Badge className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-400 border-transparent rounded-lg">
          +{tags.length - visibleCount}
        </Badge>
      )}
    </div>
  )
})
