'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Play } from 'lucide-react'
import { TestCaseForm } from './test-case-form'
import { supabase as supabaseClient } from '@/lib/supabase/client'

interface TestCaseActionsProps {
  testCase: any
  modules: any[]
  onUpdate: () => void
}

export function TestCaseActions({ testCase, modules, onUpdate }: TestCaseActionsProps) {
  const [showEdit, setShowEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('确定要删除这个测试用例吗？')) return

    setLoading(true)
    try {
      const { error } = await supabaseClient
        .from('test_cases')
        .update({ is_active: false })
        .eq('id', testCase.id)

      if (error) throw error
      onUpdate()
    } catch (error: any) {
      alert('删除失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExecute = async () => {
    if (executing) {
      alert('测试正在执行中，请稍候...')
      return
    }

    // 先设置执行状态，禁用按钮
    setExecuting(true)
    setLoading(true)

    // 稍微延迟显示确认对话框，确保UI已经更新
    await new Promise(resolve => setTimeout(resolve, 50))

    if (!confirm('确定要执行这个测试用例吗？这将调用后端API执行测试。')) {
      setExecuting(false)
      setLoading(false)
      return
    }

    try {
      // 调用后端执行 API
      const response = await fetch('/api/test/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_case_ids: [testCase.id],
          case_ids: [testCase.case_id]
        })
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(result.error || '操作过于频繁，请稍后再试')
        }
        throw new Error(result.error || '执行失败')
      }

      alert('测试已提交执行，请稍后查看执行历史')

      // 延迟跳转，给用户时间看到提示
      setTimeout(() => {
        window.location.href = '/executions'
      }, 500)
    } catch (error: any) {
      alert('执行失败: ' + error.message)
      setLoading(false)
      setExecuting(false)
    }
    // 注意：成功时不设置状态，因为会跳转页面
  }

  if (showEdit) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-background max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg">
          <TestCaseForm
            testCase={testCase}
            modules={modules}
            onSuccess={() => {
              setShowEdit(false)
              onUpdate()
            }}
            onCancel={() => setShowEdit(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowEdit(true)}
        title="编辑"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleExecute}
        disabled={loading}
        title={loading ? "正在执行..." : "执行"}
      >
        {loading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={loading}
        title="删除"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )
}
