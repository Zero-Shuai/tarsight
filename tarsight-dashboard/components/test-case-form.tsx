'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Trash2, Sparkles } from 'lucide-react'
import { supabase as supabaseClient } from '@/lib/supabase/client'
import { AssertionBuilder } from './assertion-builder'
import type { AssertionsConfig, Assertion } from '@/lib/types/database'

interface TestCaseFormProps {
  testCase?: any
  modules: any[]
  onSuccess: () => void
  onCancel: () => void
}

// Move helper function outside component to avoid recreation
const parseJsonField = (field: any) => {
  if (!field) return {}
  if (typeof field === 'object') return field
  try {
    return JSON.parse(field)
  } catch {
    return {}
  }
}

// Migrate legacy validation_rules to new assertions format
const migrateValidationRulesToAssertions = (validationRules: any): AssertionsConfig => {
  if (!validationRules || !validationRules.checks || validationRules.checks.length === 0) {
    return {
      version: '2.0',
      stopOnFailure: true,
      assertions: []
    }
  }

  const assertions: Assertion[] = validationRules.checks.map((check: any, index: number) => ({
    id: crypto.randomUUID(),
    type: 'json_body',
    enabled: true,
    critical: true,
    target: 'body',
    jsonPath: check.path,
    operator: check.operator,
    expectedValue: check.value
  }))

  return {
    version: '2.0',
    stopOnFailure: true,
    assertions
  }
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
    headers: parseJsonField(testCase?.headers) || null,
    request_body: parseJsonField(testCase?.request_body) || null,
    variables: parseJsonField(testCase?.variables) || null,
    validation_rules: parseJsonField(testCase?.validation_rules) || null,
    level: testCase?.level || 'P2',
    is_active: testCase?.is_active !== undefined ? testCase.is_active : true
  })

  // New assertions config state
  const [assertionsConfig, setAssertionsConfig] = useState<AssertionsConfig>({
    version: '2.0',
    stopOnFailure: true,
    assertions: []
  })

  const [newTag, setNewTag] = useState('')
  const [previewCaseId, setPreviewCaseId] = useState('')
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  // 监听模块变化，自动生成预览编号
  useEffect(() => {
    const fetchPreviewId = async () => {
      if (formData.module_id && !testCase) {  // 只在新增时预览
        setIsLoadingPreview(true)
        try {
          const response = await fetch(`/api/test-cases/generate-id?module_id=${formData.module_id}`)
          if (!response.ok) {
            const errorData = await response.json()
            console.error('生成编号失败:', errorData)
            setPreviewCaseId('')
            return
          }
          const data = await response.json()
          setPreviewCaseId(data.case_id || '')
        } catch (error) {
          console.error('生成编号失败:', error)
          setPreviewCaseId('')
        } finally {
          setIsLoadingPreview(false)
        }
      } else {
        setPreviewCaseId('')
      }
    }
    fetchPreviewId()
  }, [formData.module_id, testCase])

  // Migrate legacy validation_rules to new assertions format on component mount
  useEffect(() => {
    if (testCase) {
      // Check if we have new assertions format
      if (testCase.assertions) {
        setAssertionsConfig(testCase.assertions)
      } else if (testCase.validation_rules) {
        // Migrate old validation_rules to new format
        const migrated = migrateValidationRulesToAssertions(testCase.validation_rules)
        setAssertionsConfig(migrated)
      }
    }
  }, [testCase])

  // 新验证规则的状态
  const [newValidationRule, setNewValidationRule] = useState({
    path: '',
    operator: 'equals',
    value: ''
  })

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 获取当前用户信息
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
      if (userError || !user) {
        throw new Error('无法获取用户信息，请重新登录')
      }

      // 处理数据：将对象字段转换为 JSON 字符串
      const processedFormData = {
        ...formData,
        headers: typeof formData.headers === 'string'
          ? formData.headers
          : (formData.headers ? JSON.stringify(formData.headers) : null),
        request_body: typeof formData.request_body === 'string'
          ? formData.request_body
          : (formData.request_body ? JSON.stringify(formData.request_body) : null),
        variables: typeof formData.variables === 'string'
          ? formData.variables
          : (formData.variables ? JSON.stringify(formData.variables) : null),
        // Add new assertions format
        assertions: assertionsConfig.assertions.length > 0
          ? JSON.stringify(assertionsConfig)
          : null,
        // Clear old validation_rules when assertions are present
        validation_rules: assertionsConfig.assertions.length > 0
          ? null
          : (typeof formData.validation_rules === 'string'
            ? formData.validation_rules
            : (formData.validation_rules ? JSON.stringify(formData.validation_rules) : null))
      }

      const { error } = testCase
        ? await supabaseClient
            .from('test_cases')
            .update(processedFormData)
            .eq('id', testCase.id)
        : await supabaseClient
            .from('test_cases')
            .insert({
              ...processedFormData,
              project_id: process.env.NEXT_PUBLIC_PROJECT_ID,
              user_id: user.id
            })

      if (error) throw error
      onSuccess()
    } catch (error: any) {
      alert('操作失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [formData, testCase, onSuccess, assertionsConfig])

  const addTag = useCallback(() => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] })
      setNewTag('')
    }
  }, [newTag, formData.tags])

  const removeTag = useCallback((tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t: string) => t !== tag) })
  }, [formData.tags])

  // 添加验证规则
  const addValidationRule = useCallback(() => {
    if (!newValidationRule.path || !newValidationRule.value) {
      alert('请填写完整的验证规则（字段路径和期望值）')
      return
    }

    // 尝试解析值类型（数字、布尔值等）
    let parsedValue: string | boolean | number = newValidationRule.value
    if (parsedValue === 'true') parsedValue = true
    else if (parsedValue === 'false') parsedValue = false
    else if (!isNaN(Number(parsedValue))) parsedValue = Number(parsedValue)

    const newRule = {
      path: newValidationRule.path,
      operator: newValidationRule.operator,
      value: parsedValue
    }

    // 初始化或更新 validation_rules
    const currentRules = formData.validation_rules || { type: 'json_path', checks: [] }
    const updatedRules = {
      ...currentRules,
      checks: [...(currentRules.checks || []), newRule]
    }

    setFormData({ ...formData, validation_rules: updatedRules })

    // 清空输入
    setNewValidationRule({ path: '', operator: 'equals', value: '' })
  }, [formData, newValidationRule])

  // 删除验证规则
  const removeValidationRule = useCallback((index: number) => {
    if (!formData.validation_rules || !formData.validation_rules.checks) return

    const updatedRules = {
      ...formData.validation_rules,
      checks: formData.validation_rules.checks.filter((_: any, i: number) => i !== index)
    }

    // 如果没有规则了，设置为 null
    setFormData({
      ...formData,
      validation_rules: updatedRules.checks.length > 0 ? updatedRules : null
    })
  }, [formData.validation_rules])

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
              <Label htmlFor="case_id">用例编号 *</Label>
              <div className="flex gap-2">
                <Input
                  id="case_id"
                  value={formData.case_id || previewCaseId}
                  onChange={(e) => setFormData({ ...formData, case_id: e.target.value })}
                  required
                  placeholder={testCase ? '' : previewCaseId || "PRJ001-MOD001-001"}
                  disabled={!testCase && isLoadingPreview}
                  className="flex-1"
                />
                {!testCase && previewCaseId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, case_id: previewCaseId })}
                    title="使用自动生成的编号"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {previewCaseId && !testCase && (
                <p className="text-xs text-muted-foreground mt-1">
                  预览编号: {previewCaseId}（点击 ✨ 按钮）
                </p>
              )}
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
                    {module.name} {module.module_code ? `(${module.module_code})` : ''}
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

          {/* Headers */}
          <div>
            <Label htmlFor="headers">请求头 (Headers - JSON格式)</Label>
            <Textarea
              id="headers"
              value={(() => {
                if (!formData.headers) return ''
                if (typeof formData.headers === 'string') return formData.headers
                const json = JSON.stringify(formData.headers, null, 2)
                return json === '{}' ? '' : json
              })()}
              onChange={(e) => {
                const value = e.target.value.trim()
                if (!value) {
                  setFormData({ ...formData, headers: null })
                } else {
                  try {
                    const parsed = JSON.parse(value)
                    setFormData({ ...formData, headers: parsed })
                  } catch {
                    setFormData({ ...formData, headers: value })
                  }
                }
              }}
              placeholder='{"Content-Type": "application/json", "Accept": "application/json"}'
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              留空则使用默认 headers（包含 Authorization 和 Accept-Language）
            </p>
          </div>

          {/* Request Body */}
          <div>
            <Label htmlFor="request_body">请求体 (Request Body - JSON格式)</Label>
            <Textarea
              id="request_body"
              value={(() => {
                if (!formData.request_body) return ''
                if (typeof formData.request_body === 'string') return formData.request_body
                const json = JSON.stringify(formData.request_body, null, 2)
                return json === '{}' ? '' : json
              })()}
              onChange={(e) => {
                const value = e.target.value.trim()
                if (!value) {
                  setFormData({ ...formData, request_body: null })
                } else {
                  try {
                    const parsed = JSON.parse(value)
                    setFormData({ ...formData, request_body: parsed })
                  } catch {
                    setFormData({ ...formData, request_body: value })
                  }
                }
              }}
              placeholder='{"key": "value"}'
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              GET 请求通常不需要请求体，留空则发送空对象 {}
            </p>
          </div>

          {/* Variables (可选) */}
          <div>
            <Label htmlFor="variables">变量 (Variables - JSON格式，可选)</Label>
            <Textarea
              id="variables"
              value={(() => {
                if (!formData.variables) return ''
                if (typeof formData.variables === 'string') return formData.variables
                const json = JSON.stringify(formData.variables, null, 2)
                return json === '{}' ? '' : json
              })()}
              onChange={(e) => {
                const value = e.target.value.trim()
                if (!value) {
                  setFormData({ ...formData, variables: null })
                } else {
                  try {
                    const parsed = JSON.parse(value)
                    setFormData({ ...formData, variables: parsed })
                  } catch {
                    setFormData({ ...formData, variables: value })
                  }
                }
              }}
              placeholder='{"userId": "123"}'
              rows={3}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              可选：变量会合并到请求体中
            </p>
          </div>

          {/* Enhanced Assertions */}
          <div>
            <AssertionBuilder
              assertionsConfig={assertionsConfig}
              onChange={setAssertionsConfig}
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
