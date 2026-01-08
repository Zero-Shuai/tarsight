'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { supabase as supabaseClient } from '@/lib/supabase/client'
import type { TestCase, Module } from '@/lib/types/database'

interface TestCaseFormDrawerProps {
  testCase?: TestCase
  modules: Module[]
  onClose: () => void
  onSuccess: () => void
}

export function TestCaseFormDrawer({ testCase, modules, onClose, onSuccess }: TestCaseFormDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [previewCaseId, setPreviewCaseId] = useState('')

  const parseJsonField = (field: any) => {
    if (!field) return {}
    if (typeof field === 'object') return field
    try {
      return JSON.parse(field)
    } catch {
      return {}
    }
  }

  const [formData, setFormData] = useState({
    case_id: testCase?.case_id || '',
    test_name: testCase?.test_name || '',
    url: testCase?.url || '',
    method: testCase?.method || 'GET',
    expected_status: testCase?.expected_status || 200,
    description: testCase?.description || '',
    module_id: testCase?.module_id || '',
    tags: testCase?.tags || [],
    headers: parseJsonField(testCase?.headers) || null,
    request_body: parseJsonField(testCase?.request_body) || null,
    variables: parseJsonField(testCase?.variables) || null,
    // assertions field removed from state - doesn't exist in database schema
    level: testCase?.level || 'P2',
    is_active: testCase?.is_active !== undefined ? testCase.is_active : true
  })

  const [newTag, setNewTag] = useState('')

  // Generate preview case ID when module changes (for new cases only)
  useEffect(() => {
    const fetchPreviewId = async () => {
      if (formData.module_id && !testCase) {
        try {
          const response = await fetch(`/api/test-cases/generate-id?module_id=${formData.module_id}`)
          if (response.ok) {
            const data = await response.json()
            setPreviewCaseId(data.case_id || '')
          }
        } catch (error) {
          console.error('Failed to generate case ID:', error)
        }
      } else {
        setPreviewCaseId('')
      }
    }
    fetchPreviewId()
  }, [formData.module_id, testCase])

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] })
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔵 [Form Submit] Starting submit process...')

    // Validate required fields
    if (!formData.test_name) {
      alert('请输入用例名称')
      return
    }
    if (!formData.url) {
      alert('请输入请求路径')
      return
    }
    if (!formData.module_id) {
      alert('请选择所属模块')
      return
    }

    setLoading(true)
    console.log('🔵 [Form Submit] Loading set to true, formData:', {
      case_id: formData.case_id || previewCaseId,
      test_name: formData.test_name,
      level: formData.level,
      module_id: formData.module_id
    })

    try {
      console.log('🔵 [Form Submit] Getting user...')
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
      console.log('🔵 [Form Submit] User result:', { user: user?.id, userError })
      if (userError || !user) {
        throw new Error('无法获取用户信息，请重新登录')
      }

      // Build payload with all fields
      const payload: Record<string, any> = {
        case_id: formData.case_id || previewCaseId,
        test_name: formData.test_name,
        url: formData.url,
        method: formData.method,
        expected_status: formData.expected_status,
        description: formData.description,
        module_id: formData.module_id,
        tags: formData.tags,
        headers: formData.headers,
        request_body: formData.request_body,
        variables: formData.variables,
        level: formData.level,
        is_active: formData.is_active
        // Note: created_by is handled by database trigger/RLS
        // assertions not included - may not exist in database schema
      }

      console.log('🔵 [Form Submit] Payload prepared:', payload)

      let error
      if (testCase?.id) {
        // Update existing case
        console.log('🔵 [Form Submit] Updating existing case, id:', testCase.id)
        const result = await supabaseClient
          .from('test_cases')
          .update(payload)
          .eq('id', testCase.id)
          .select()
        console.log('🔵 [Form Submit] Update result:', result)
        error = result.error
      } else {
        // Create new case
        console.log('🔵 [Form Submit] Creating new case')
        const result = await supabaseClient
          .from('test_cases')
          .insert({
            ...payload,
            project_id: process.env.NEXT_PUBLIC_PROJECT_ID
            // created_by will be set by database trigger/RLS policy
          })
          .select()
        console.log('🔵 [Form Submit] Insert result:', result)
        error = result.error
      }

      if (error) throw error
      console.log('✅ [Form Submit] Success! Calling onSuccess...')
      onSuccess()
    } catch (error: any) {
      console.error('❌ [Form Submit] Error:', error)
      alert(`${testCase?.id ? '更新' : '创建'}失败: ${error.message}`)
    } finally {
      console.log('🔵 [Form Submit] Setting loading to false')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-3xl bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {testCase?.id ? '编辑测试用例' : '新建测试用例'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {testCase?.case_id || previewCaseId || '自动生成编号'}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-lg hover:bg-slate-100 h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Module & Level */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="module_id">所属模块 *</Label>
              <select
                id="module_id"
                required
                value={formData.module_id}
                onChange={(e) => setFormData({ ...formData, module_id: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
              >
                <option value="">选择模块</option>
                {modules.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">优先级</Label>
              <select
                id="level"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
              >
                <option value="P0">P0 - 关键</option>
                <option value="P1">P1 - 重要</option>
                <option value="P2">P2 - 普通</option>
                <option value="P3">P3 - 低</option>
              </select>
            </div>
          </div>

          {/* Case ID (only show for existing cases) */}
          {testCase?.id && (
            <div className="space-y-2">
              <Label htmlFor="case_id">用例编号</Label>
              <Input
                id="case_id"
                required
                value={formData.case_id}
                onChange={(e) => setFormData({ ...formData, case_id: e.target.value })}
                className="font-mono"
              />
            </div>
          )}

          {/* Test Name */}
          <div className="space-y-2">
            <Label htmlFor="test_name">用例名称 *</Label>
            <Input
              id="test_name"
              required
              value={formData.test_name}
              onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
              placeholder="例如: 用户登录接口测试"
            />
          </div>

          {/* URL & Method */}
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1 space-y-2">
              <Label htmlFor="method">请求方法</Label>
              <select
                id="method"
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            <div className="col-span-3 space-y-2">
              <Label htmlFor="url">请求路径 *</Label>
              <Input
                id="url"
                required
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="/api/v1/users"
                className="font-mono"
              />
            </div>
          </div>

          {/* Expected Status */}
          <div className="space-y-2">
            <Label htmlFor="expected_status">预期状态码</Label>
            <Input
              id="expected_status"
              type="number"
              value={formData.expected_status}
              onChange={(e) => setFormData({ ...formData, expected_status: parseInt(e.target.value) })}
              className="w-32"
            />
          </div>

          {/* Assertion Rules - Hidden Feature (not saved to DB) */}
          {/* The assertions feature is not yet implemented in the database schema */}
          {/* This section is commented out to prevent schema mismatch errors */}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="用例描述..."
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>标签</Label>
            <div className="flex gap-2 items-stretch">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="输入标签后按回车"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={addTag}
                variant="outline"
                size="sm"
                className="whitespace-nowrap min-w-[60px] flex-shrink-0 transition-all duration-200"
              >
                添加
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs rounded-lg transition-all duration-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-500 transition-colors duration-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Headers (JSON) */}
          <div className="space-y-2">
            <Label htmlFor="headers">请求头 (JSON)</Label>
            <Textarea
              id="headers"
              value={formData.headers ? JSON.stringify(formData.headers, null, 2) : ''}
              onChange={(e) => {
                try {
                  const value = e.target.value.trim()
                  setFormData({ ...formData, headers: value ? JSON.parse(value) : null })
                } catch {
                  // Invalid JSON, don't update state
                }
              }}
              placeholder='{"key": "value"}'
              rows={3}
              className="font-mono text-xs"
            />
          </div>

          {/* Request Body (JSON) */}
          <div className="space-y-2">
            <Label htmlFor="request_body">请求体 (JSON)</Label>
            <Textarea
              id="request_body"
              value={formData.request_body ? JSON.stringify(formData.request_body, null, 2) : ''}
              onChange={(e) => {
                try {
                  const value = e.target.value.trim()
                  setFormData({ ...formData, request_body: value ? JSON.parse(value) : null })
                } catch {
                  // Invalid JSON, don't update state
                }
              }}
              placeholder='{"key": "value"}'
              rows={4}
              className="font-mono text-xs"
            />
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 px-6 py-4 border-t border-[#E2E8F0] bg-white -mx-6 -mb-6">
            <div className="flex items-center justify-between">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-lg transition-all duration-200">
                取消
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg shadow-sm transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  testCase?.id ? '保存更改' : '创建用例'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
