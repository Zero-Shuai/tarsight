'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { supabase as supabaseClient } from '@/lib/supabase/client'

interface Module {
  id: string
  project_id: string
  name: string
  module_code: string
  description: string
  created_at: string
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>{module ? '编辑模块' : '新增模块'}</CardTitle>
          <CardDescription>
            {module ? '修改模块信息' : '创建新的测试模块'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">模块名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="例如: 用户管理"
              />
            </div>

            <div>
              <Label htmlFor="module_code">模块编号 *</Label>
              <Input
                id="module_code"
                value={formData.module_code}
                onChange={(e) => {
                  // 保持用户输入的大小写
                  const value = e.target.value
                  setFormData({ ...formData, module_code: value })
                }}
                required
                placeholder="例如: MOD, Module, ModuleA, TEST-099"
                pattern="^[A-Za-z][A-Za-z0-9]{0,19}$"
                title="1-20位字符，必须以字母开头"
              />
              <p className="text-xs text-muted-foreground mt-1">
                1-20位字符，必须以字母开头，可包含数字
              </p>
            </div>

            <div>
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="模块功能描述"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '保存中...' : '保存'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | undefined>(undefined)

  const loadModules = async () => {
    setLoading(true)
    try {
      const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '8786c21f-7437-4a2d-8486-9365a382b38e'
      const { data, error } = await supabaseClient
        .from('modules')
        .select('*')
        .eq('project_id', projectId)
        .order('name')

      if (error) throw error
      setModules(data || [])
    } catch (error: any) {
      console.error('加载模块失败:', error)
      alert('加载模块失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除模块"${name}"吗？`)) return

    try {
      // 先检查是否有测试用例使用此模块
      const { data: testCases, error: checkError } = await supabaseClient
        .from('test_cases')
        .select('id')
        .eq('module_id', id)
        .limit(1)

      if (checkError) throw checkError

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

  useEffect(() => {
    loadModules()
  }, [])

  if (showForm) {
    return (
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
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">模块管理</h1>
          <p className="text-muted-foreground mt-2">管理测试模块，支持增删改查</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新增模块
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">加载中...</p>
          </CardContent>
        </Card>
      ) : modules.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">暂无模块，点击"新增模块"创建第一个模块</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Card key={module.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{module.name}</CardTitle>
                      <Badge variant="secondary">{module.module_code || '未设置'}</Badge>
                    </div>
                    <CardDescription className="mt-2">
                      {module.description || '暂无描述'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">创建时间</span>
                    <span>{new Date(module.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingModule(module)
                        setShowForm(true)
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      编辑
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(module.id, module.name)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      删除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
