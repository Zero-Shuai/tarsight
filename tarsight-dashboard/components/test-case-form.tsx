'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'
import { supabase as supabaseClient } from '@/lib/supabase/client'

interface TestCaseFormProps {
  testCase?: any
  modules: any[]
  onSuccess: () => void
  onCancel: () => void
}

export function TestCaseForm({ testCase, modules, onSuccess, onCancel }: TestCaseFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    case_id: testCase?.case_id || '',
    test_name: testCase?.test_name || '',
    url: testCase?.url || '',
    method: testCase?.method || 'GET',
    expected_status: testCase?.expected_status || 200,
    description: testCase?.description || '',
    module_id: testCase?.module_id || '',
    tags: testCase?.tags || [],
    headers: testCase?.headers || {},
    request_body: testCase?.request_body || {},
    level: testCase?.level || 'P2',
    is_active: testCase?.is_active !== undefined ? testCase.is_active : true
  })
  const [newTag, setNewTag] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = testCase
        ? await supabaseClient
            .from('test_cases')
            .update(formData)
            .eq('id', testCase.id)
        : await supabaseClient
            .from('test_cases')
            .insert({
              ...formData,
              project_id: process.env.NEXT_PUBLIC_PROJECT_ID
            })

      if (error) throw error
      onSuccess()
    } catch (error: any) {
      alert('操作失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] })
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t: string) => t !== tag) })
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{testCase ? '编辑测试用例' : '新增测试用例'}</CardTitle>
        <CardDescription>
          {testCase ? '修改测试用例信息' : '创建新的测试用例'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="case_id">用例ID *</Label>
              <Input
                id="case_id"
                value={formData.case_id}
                onChange={(e) => setFormData({ ...formData, case_id: e.target.value })}
                required
                placeholder="TC001"
              />
            </div>

            <div>
              <Label htmlFor="module">所属模块 *</Label>
              <select
                id="module"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.module_id}
                onChange={(e) => setFormData({ ...formData, module_id: e.target.value })}
                required
              >
                <option value="">选择模块</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="test_name">测试名称 *</Label>
            <Input
              id="test_name"
              value={formData.test_name}
              onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
              required
              placeholder="测试用例名称"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="method">请求方法 *</Label>
              <select
                id="method"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                required
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>

            <div>
              <Label htmlFor="level">用例等级 *</Label>
              <select
                id="level"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                required
              >
                <option value="P0">P0 - 最高优先级</option>
                <option value="P1">P1 - 高优先级</option>
                <option value="P2">P2 - 中优先级</option>
                <option value="P3">P3 - 低优先级</option>
              </select>
            </div>

            <div>
              <Label htmlFor="expected_status">预期状态码 *</Label>
              <Input
                id="expected_status"
                type="number"
                value={formData.expected_status}
                onChange={(e) => setFormData({ ...formData, expected_status: parseInt(e.target.value) })}
                required
                placeholder="200"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="url">请求URL *</Label>
            <Input
              id="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              required
              placeholder="/api/endpoint"
            />
          </div>

          <div>
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="测试用例描述"
              rows={3}
            />
          </div>

          {/* 标签 */}
          <div>
            <Label htmlFor="tags">标签</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="输入标签后按回车"
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {formData.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:bg-destructive hover:text-destructive-foreground rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : testCase ? '更新' : '创建'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
