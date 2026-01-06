'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

type ExecutionType = 'specific' | 'all' | 'modules' | 'levels'

interface ExecutionPreview {
  total_cases: number
  estimated_duration: number
  modules: string[]
  levels: string[]
}

interface TestExecutionFormProps {
  // 用于 specific 模式
  selectedTestCaseIds?: string[]
  allModules?: Array<{ id: string; name: string }>
}

export function TestExecutionForm({ selectedTestCaseIds = [], allModules = [] }: TestExecutionFormProps) {
  const router = useRouter()
  const [executionType, setExecutionType] = useState<ExecutionType>('specific')
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [preview, setPreview] = useState<ExecutionPreview | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)

  // 获取执行预览
  const handlePreview = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/test/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          execution_type: executionType,
          module_ids: selectedModules,
          levels: selectedLevels,
          test_case_ids: selectedTestCaseIds
        })
      })

      if (!response.ok) {
        throw new Error('获取预览失败')
      }

      const data = await response.json()
      setPreview(data)
    } catch (error) {
      console.error('预览失败:', error)
      alert('获取执行预览失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 执行测试
  const handleExecute = async () => {
    if (!preview || preview.total_cases === 0) {
      alert('请先获取执行预览')
      return
    }

    const confirmed = confirm(`确认执行 ${preview.total_cases} 条用例？\n预计耗时: ${Math.ceil(preview.estimated_duration / 60)} 分钟`)
    if (!confirmed) return

    setIsExecuting(true)
    try {
      const response = await fetch('/api/test/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          execution_type: executionType,
          module_ids: selectedModules,
          levels: selectedLevels,
          test_case_ids: selectedTestCaseIds
        })
      })

      if (!response.ok) {
        throw new Error('执行失败')
      }

      const data = await response.json()
      console.log('执行已提交:', data)

      // 跳转到执行历史页面
      router.push('/executions')
    } catch (error) {
      console.error('执行失败:', error)
      alert('执行测试失败，请稍后重试')
    } finally {
      setIsExecuting(false)
    }
  }

  // 切换模块选择
  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    )
    // 清除预览
    setPreview(null)
  }

  // 切换等级选择
  const toggleLevel = (level: string) => {
    setSelectedLevels(prev =>
      prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level]
    )
    // 清除预览
    setPreview(null)
  }

  const isPreviewDisabled =
    (executionType === 'modules' && selectedModules.length === 0) ||
    (executionType === 'levels' && selectedLevels.length === 0) ||
    (executionType === 'specific' && selectedTestCaseIds.length === 0)

  return (
    <div className="space-y-6">
      {/* 执行模式选择 */}
      <div>
        <label className="text-sm font-medium mb-2 block">执行模式</label>
        <Select value={executionType} onValueChange={(value: ExecutionType) => {
          setExecutionType(value)
          setPreview(null)
          setSelectedModules([])
          setSelectedLevels([])
        }}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="specific">指定用例</SelectItem>
            <SelectItem value="all">全部用例</SelectItem>
            <SelectItem value="modules">按模块</SelectItem>
            <SelectItem value="levels">按等级</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 根据模式显示不同选项 */}
      {executionType === 'modules' && (
        <div>
          <label className="text-sm font-medium mb-2 block">选择模块</label>
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-4">
            {allModules.map(module => (
              <div key={module.id} className="flex items-center space-x-2">
                <Checkbox
                  id={module.id}
                  checked={selectedModules.includes(module.id)}
                  onCheckedChange={() => toggleModule(module.id)}
                />
                <label
                  htmlFor={module.id}
                  className="flex-1 text-sm cursor-pointer"
                >
                  {module.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {executionType === 'levels' && (
        <div>
          <label className="text-sm font-medium mb-2 block">选择等级</label>
          <div className="flex flex-wrap gap-4">
            {['P0', 'P1', 'P2', 'P3'].map(level => (
              <div key={level} className="flex items-center space-x-2">
                <Checkbox
                  id={level}
                  checked={selectedLevels.includes(level)}
                  onCheckedChange={() => toggleLevel(level)}
                />
                <label
                  htmlFor={level}
                  className="text-sm cursor-pointer"
                >
                  {level}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {executionType === 'specific' && (
        <Alert>
          <AlertTitle>指定用例</AlertTitle>
          <AlertDescription>
            将执行 {selectedTestCaseIds.length} 个已选择的测试用例
          </AlertDescription>
        </Alert>
      )}

      {executionType === 'all' && (
        <Alert>
          <AlertTitle>全部用例</AlertTitle>
          <AlertDescription>
            将执行项目中的所有活跃测试用例
          </AlertDescription>
        </Alert>
      )}

      {/* 预览按钮 */}
      <Button
        onClick={handlePreview}
        disabled={isPreviewDisabled || isLoading}
        className="w-full"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? '获取预览中...' : '预览执行'}
      </Button>

      {/* 预览结果 */}
      {preview && (
        <Alert>
          <AlertTitle>执行预览</AlertTitle>
          <AlertDescription className="space-y-2">
            <div className="text-2xl font-bold">
              将执行 {preview.total_cases} 条用例
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">预计耗时:</span>{' '}
                {Math.ceil(preview.estimated_duration / 60)} 分钟
              </div>
              <div>
                <span className="font-medium">涉及模块:</span>{' '}
                {preview.modules.length > 0 ? preview.modules.join(', ') : '无'}
              </div>
              <div className="col-span-2">
                <span className="font-medium">涉及等级:</span>{' '}
                {preview.levels.length > 0 ? preview.levels.join(', ') : '无'}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* 执行按钮 */}
      <Button
        onClick={handleExecute}
        disabled={!preview || isExecuting}
        className="w-full"
        size="lg"
      >
        {isExecuting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isExecuting ? '执行中...' : '开始执行'}
      </Button>
    </div>
  )
}
