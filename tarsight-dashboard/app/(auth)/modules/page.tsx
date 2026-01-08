'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ArrowUpDown,
  Play,
  FolderOpen,
  Box,
  FileText,
  Calendar,
  ChevronRight,
  AlertCircle
} from 'lucide-react'
import { supabase as supabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Module {
  id: string
  project_id: string
  name: string
  module_code: string
  description: string
  created_at: string
}

interface ModuleStats {
  caseCount: number
  activeCases: number
  passRate: number
  hasExecutions: boolean
}

interface ModuleWithStats extends Module {
  stats: ModuleStats
}

interface ModuleFormProps {
  module?: Module
  onSuccess: () => void
  onCancel: () => void
}

function ModuleForm({ module, onSuccess, onCancel }: ModuleFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: module?.name || '',
    module_code: module?.module_code || '',
    description: module?.description || ''
  })
  const [codeError, setCodeError] = useState('')

  const validateModuleCode = (code: string): boolean => {
    if (!code) {
      setCodeError('')
      return true
    }
    // Must start with letter, only alphanumeric, 1-20 chars
    const isValid = /^[A-Za-z][A-Za-z0-9]{0,19}$/.test(code)
    setCodeError(isValid ? '' : '1-20位字符，必须以字母开头，可包含数字')
    return isValid
  }

  const handleCodeChange = (value: string) => {
    setFormData({ ...formData, module_code: value })
    validateModuleCode(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateModuleCode(formData.module_code)) {
      return
    }

    setLoading(true)

    try {
      const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '8786c21f-7437-4a2d-8486-9365a382b38e'

      const { error } = module
        ? await supabaseClient
            .from('modules')
            .update(formData)
            .eq('id', module.id)
        : await supabaseClient
            .from('modules')
            .insert({
              ...formData,
              project_id: projectId
            })

      if (error) throw error
      onSuccess()
    } catch (error: any) {
      alert('操作失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open onOpenChange={onCancel}>
      <SheetContent side="right" className="sm:max-w-[500px] w-full">
        <SheetHeader>
          <SheetTitle>{module ? '编辑模块' : '新增模块'}</SheetTitle>
          <SheetDescription>
            {module ? '修改模块信息' : '创建新的测试模块'}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          <div>
            <Label htmlFor="name">模块名称 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="例如: 用户管理"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="module_code">模块编号 *</Label>
            <Input
              id="module_code"
              value={formData.module_code}
              onChange={(e) => handleCodeChange(e.target.value)}
              required
              placeholder="例如: MOD, Module, ModuleA, TEST-099"
              className="mt-1.5"
              style={{
                borderColor: codeError ? '#EF4444' : undefined
              }}
            />
            {codeError ? (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {codeError}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1.5">
                1-20位字符，必须以字母开头，可包含数字
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="模块功能描述"
              rows={3}
              className="mt-1.5 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button type="submit" disabled={loading || !!codeError} style={{ backgroundColor: '#3B82F6', color: 'white' }}>
              {loading ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// Pass rate color helper (matching Analytics page)
function getPassRateColor(rate: number): string {
  if (rate >= 95) return '#10B981'
  if (rate >= 90) return '#22C55E'
  if (rate >= 80) return '#84CC16'
  if (rate >= 70) return '#F59E0B'
  if (rate >= 50) return '#FB923C'
  return '#EF4444'
}

// Individual Performance Card Component
interface PerformanceCardProps {
  module: ModuleWithStats
  onEdit: (module: Module) => void
  onDelete: (id: string, name: string) => void
  onViewCases: (id: string) => void
  onExecute: (id: string) => void
  index: number
}

function PerformanceCard({
  module,
  onEdit,
  onDelete,
  onViewCases,
  onExecute,
  index
}: PerformanceCardProps) {
  const passRateColor = getPassRateColor(module.stats.passRate)
  const activePercent = module.stats.caseCount > 0
    ? Math.round((module.stats.activeCases / module.stats.caseCount) * 100)
    : 0

  // Determine pass rate icon color
  const getPassRateIconColor = (): string => {
    if (!module.stats.hasExecutions) return '#94A3B8' // Gray-400 for "No Data"
    if (module.stats.passRate >= 90) return '#10B981' // Emerald-500 for >90%
    return '#F59E0B' // Amber-500 for <90%
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .replace(/\//g, '-')
  }

  return (
    <Card
      className="group relative transition-all duration-200 hover:shadow-lg animate-in fade-in duration-300"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #F1F5F9',
        borderLeft: '3px solid transparent',
        borderRadius: '16px',
        animationDelay: `${index * 50}ms`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderLeftColor = '#3B82F6'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderLeftColor = 'transparent'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Card Header - Title and Actions */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between mb-3">
          {/* Left: Module Name */}
          <div className="flex-1 min-w-0 pr-2">
            <h3
              className="font-semibold truncate tracking-tight"
              style={{ color: '#0F172A', fontSize: '16px', lineHeight: '1.3' }}
              title={module.name}
            >
              {module.name}
            </h3>
          </div>

          {/* Right: ID Badge + Ghost Icon Actions */}
          <div className="flex items-center gap-1">
            <Badge
              variant="secondary"
              className="text-xs"
              style={{
                fontFamily: 'monospace',
                backgroundColor: '#F1F5F9',
                color: '#64748B',
                fontWeight: 500,
                fontSize: '10px',
                padding: '4px 8px',
                borderRadius: '6px'
              }}
            >
              {module.module_code || '未设置'}
            </Badge>
            <button
              onClick={() => onEdit(module)}
              className="p-2 rounded-md hover:bg-slate-100 transition-all duration-200"
              title="编辑"
              style={{ width: '32px', height: '32px' }}
            >
              <Pencil className="h-4 w-4" style={{ color: '#94A3B8' }} />
            </button>
            <button
              onClick={() => onDelete(module.id, module.name)}
              className="p-2 rounded-md hover:bg-red-50 transition-all duration-200"
              title="删除"
              style={{ width: '32px', height: '32px' }}
            >
              <Trash2 className="h-4 w-4" style={{ color: '#94A3B8' }} />
            </button>
          </div>
        </div>

        {/* Description */}
        {module.description && (
          <p
            className="line-clamp-2 text-xs"
            style={{ color: '#64748B', lineHeight: '1.5' }}
            title={module.description}
          >
            {module.description}
          </p>
        )}
      </div>

      {/* Central Metric Section - Dashboard Look */}
      <div className="px-4 py-3 mx-4 rounded-md" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="grid grid-cols-3 gap-3">
          {/* Cases Count */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-1.5">
              <Box className="h-3.5 w-3.5 mr-1.5" style={{ color: '#3B82F6' }} />
              <span className="text-xs font-medium" style={{ color: '#64748B' }}>用例</span>
            </div>
            <p className="text-sm font-bold tracking-tight" style={{ color: '#0F172A' }}>
              {module.stats.caseCount}
            </p>
          </div>

          {/* Pass Rate */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-1.5">
              <div
                className="h-2 w-2 rounded-full mr-1.5"
                style={{ backgroundColor: getPassRateIconColor() }}
              />
              <span className="text-xs font-medium" style={{ color: '#64748B' }}>通过率</span>
            </div>
            {module.stats.hasExecutions ? (
              <p className="text-sm font-bold tracking-tight" style={{ color: passRateColor }}>
                {module.stats.passRate.toFixed(0)}%
              </p>
            ) : (
              <p className="text-sm font-bold tracking-tight" style={{ color: '#94A3B8' }}>
                ---
              </p>
            )}
          </div>

          {/* Active % */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-1.5">
              <Play className="h-3.5 w-3.5 mr-1.5" style={{ color: '#10B981' }} />
              <span className="text-xs font-medium" style={{ color: '#64748B' }}>活跃</span>
            </div>
            <p className="text-sm font-bold tracking-tight" style={{ color: '#0F172A' }}>
              {module.stats.caseCount > 0 ? `${activePercent}%` : (
                <span style={{ color: '#94A3B8', fontSize: '13px' }}>-</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 pt-4 flex gap-2">
        <button
          onClick={() => onViewCases(module.id)}
          className="flex-1 text-xs h-9 flex items-center justify-start px-2 rounded transition-all duration-200"
          style={{ color: '#64748B' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          管理用例
          <ChevronRight className="h-3.5 w-3.5 ml-auto" />
        </button>
        <Button
          size="sm"
          className="text-xs h-9 px-4"
          onClick={() => onExecute(module.id)}
          disabled={module.stats.caseCount === 0}
          style={{
            backgroundColor: module.stats.caseCount > 0 ? '#10B981' : '#E5E7EB',
            color: 'white',
            fontWeight: 500
          }}
        >
          <Play className="h-3.5 w-3.5 mr-1.5" />
          执行
        </Button>
      </div>

      {/* Footer - Creation Date */}
      <div className="px-4 pb-3 flex items-center gap-1.5" style={{ borderTop: '1px solid #F8FAFC' }}>
        <Calendar className="h-3 w-3" style={{ color: '#CBD5E1' }} />
        <span className="text-xs" style={{ color: '#CBD5E1' }}>
          {formatDate(module.created_at)}
        </span>
      </div>
    </Card>
  )
}

export default function ModulesPage() {
  const router = useRouter()
  const [modules, setModules] = useState<ModuleWithStats[]>([])
  const [filteredModules, setFilteredModules] = useState<ModuleWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'latest' | 'name' | 'cases' | 'passRate'>('latest')

  // Load modules with stats
  const loadModules = async () => {
    setLoading(true)
    try {
      const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '8786c21f-7437-4a2d-8486-9365a382b38e'

      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabaseClient
        .from('modules')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (modulesError) throw modulesError

      // Fetch test cases for stats
      const { data: testCases } = await supabaseClient
        .from('test_cases')
        .select('id, module_id, is_active')
        .eq('project_id', projectId)

      // Fetch test results for pass rates
      const { data: testResults } = await supabaseClient
        .from('test_results')
        .select('test_case_id, status')
        .eq('project_id', projectId)
        .limit(5000)

      // Calculate stats for each module
      const modulesWithStats: ModuleWithStats[] = (modulesData || []).map(module => {
        const moduleTestCases = testCases?.filter(tc => tc.module_id === module.id) || []
        const activeCases = moduleTestCases.filter(tc => tc.is_active).length
        const caseCount = moduleTestCases.length

        // Calculate pass rate from test results
        const moduleTestResultIds = new Set(moduleTestCases.map(tc => tc.id))
        const relevantResults = testResults?.filter(r => r.test_case_id && moduleTestResultIds.has(r.test_case_id)) || []
        const passedCount = relevantResults.filter(r => r.status === 'passed').length
        const passRate = relevantResults.length > 0 ? (passedCount / relevantResults.length) * 100 : 0

        return {
          ...module,
          stats: {
            caseCount,
            activeCases,
            passRate: Math.round(passRate * 10) / 10,
            hasExecutions: relevantResults.length > 0
          }
        }
      })

      setModules(modulesWithStats)
      setFilteredModules(modulesWithStats)
    } catch (error: any) {
      console.error('加载模块失败:', error)
      alert('加载模块失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle search and sort
  useEffect(() => {
    let filtered = modules

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.module_code.toLowerCase().includes(query)
      )
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'zh-CN')
        case 'cases':
          return b.stats.caseCount - a.stats.caseCount
        case 'passRate':
          return b.stats.passRate - a.stats.passRate
        case 'latest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredModules(filtered)
  }, [modules, searchQuery, sortBy])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除模块"${name}"吗？`)) return

    try {
      const { data: testCases } = await supabaseClient
        .from('test_cases')
        .select('id')
        .eq('module_id', id)
        .limit(1)

      if (testCases && testCases.length > 0) {
        alert('无法删除：该模块下还有测试用例，请先删除或迁移这些用例')
        return
      }

      const { error } = await supabaseClient
        .from('modules')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadModules()
    } catch (error: any) {
      alert('删除失败: ' + error.message)
    }
  }

  const handleViewCases = (moduleId: string) => {
    router.push(`/test-cases?module=${moduleId}`)
  }

  const handleExecute = async (moduleId: string) => {
    try {
      const response = await fetch('/api/test/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_ids: [moduleId],
          mode: 'all'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '执行失败')
      }

      alert('模块测试已提交执行，请前往执行页面查看进度')
      router.push('/executions')
    } catch (error: any) {
      alert(error.message)
    }
  }

  useEffect(() => {
    loadModules()
  }, [])

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#0F172A' }}>模块管理</h1>
          <p className="mt-2 tracking-tight" style={{ color: '#64748B' }}>
            管理测试模块，查看用例统计和执行状态
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingModule(undefined)
            setShowForm(true)
          }}
          style={{ backgroundColor: '#3B82F6', color: 'white' }}
        >
          <Plus className="h-4 w-4 mr-2" />
          新增模块
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="搜索模块名称或编号..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#E2E8F0',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              {sortBy === 'latest' && '最新创建'}
              {sortBy === 'name' && '名称排序'}
              {sortBy === 'cases' && '用例数量'}
              {sortBy === 'passRate' && '通过率'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy('latest')}>
              最新创建
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('name')}>
              名称排序
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('cases')}>
              用例数量
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('passRate')}>
              通过率
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Loading State */}
      {loading ? (
        <Card style={{ backgroundColor: '#ffffff', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <CardContent className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#3B82F6' }}></div>
            <p className="mt-4" style={{ color: '#64748B' }}>加载模块数据中...</p>
          </CardContent>
        </Card>
      ) : filteredModules.length === 0 ? (
        /* Empty State */
        <Card style={{ backgroundColor: '#ffffff', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <CardContent className="py-20 text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-5" style={{ backgroundColor: '#F1F5F9' }}>
              <FolderOpen className="h-10 w-10 mx-auto mt-5" style={{ color: '#94A3B8' }} />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#0F172A' }}>
              {searchQuery ? '未找到匹配的模块' : '暂无模块'}
            </h3>
            <p className="mb-6" style={{ color: '#64748B' }}>
              {searchQuery ? '请尝试其他搜索关键词' : '创建您的第一个测试模块开始使用'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => {
                  setEditingModule(undefined)
                  setShowForm(true)
                }}
                style={{ backgroundColor: '#3B82F6', color: 'white' }}
              >
                <Plus className="h-4 w-4 mr-2" />
                创建第一个模块
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Module Cards Grid */
        <div className="grid gap-y-8 gap-x-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredModules.map((module, index) => (
            <PerformanceCard
              key={module.id}
              module={module}
              index={index}
              onEdit={(m) => {
                setEditingModule(m)
                setShowForm(true)
              }}
              onDelete={handleDelete}
              onViewCases={handleViewCases}
              onExecute={handleExecute}
            />
          ))}
        </div>
      )}

      {/* Module Form Side Drawer */}
      {showForm && (
        <ModuleForm
          module={editingModule}
          onSuccess={() => {
            loadModules()
            setShowForm(false)
            setEditingModule(undefined)
          }}
          onCancel={() => {
            setShowForm(false)
            setEditingModule(undefined)
          }}
        />
      )}
    </div>
  )
}
