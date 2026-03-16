'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Trash2, Plus, GripVertical, AlertTriangle } from 'lucide-react'
import type {
  Assertion,
  AssertionType,
  AssertionsConfig,
  AssertionOperator
} from '@/lib/types/database'

interface AssertionBuilderProps {
  assertionsConfig: AssertionsConfig
  onChange: (config: AssertionsConfig) => void
}

// Assertion type definitions
const assertionTypes: { value: AssertionType; label: string; description: string }[] = [
  { value: 'status_code', label: '状态码', description: 'HTTP 响应状态码验证' },
  { value: 'response_time', label: '响应时间', description: 'API 响应性能验证' },
  { value: 'header', label: '响应头', description: 'HTTP 响应头验证' },
  { value: 'json_body', label: 'JSON 响应体', description: 'JSON 字段验证（支持 JSONPath）' },
  { value: 'json_schema', label: 'JSON Schema', description: '完整 JSON 结构验证' },
  { value: 'javascript', label: 'JavaScript', description: '自定义 JavaScript 验证逻辑' }
]

// Operator definitions by assertion type
const operatorsByType: Record<AssertionType, { value: AssertionOperator; label: string }[]> = {
  status_code: [
    { value: 'equals', label: '等于' },
    { value: 'not_equals', label: '不等于' },
    { value: 'one_of', label: '其中之一' }
  ],
  response_time: [
    { value: 'lt', label: '小于' },
    { value: 'lte', label: '小于等于' },
    { value: 'gt', label: '大于' },
    { value: 'gte', label: '大于等于' }
  ],
  header: [
    { value: 'exists', label: '存在' },
    { value: 'equals', label: '等于' },
    { value: 'contains', label: '包含' },
    { value: 'not_contains', label: '不包含' },
    { value: 'regex', label: '匹配正则' }
  ],
  json_body: [
    { value: 'equals', label: '等于' },
    { value: 'not_equals', label: '不等于' },
    { value: 'contains', label: '包含' },
    { value: 'not_contains', label: '不包含' },
    { value: 'gt', label: '大于' },
    { value: 'lt', label: '小于' },
    { value: 'gte', label: '大于等于' },
    { value: 'lte', label: '小于等于' },
    { value: 'regex', label: '匹配正则' },
    { value: 'type', label: '类型检查' },
    { value: 'exists', label: '存在' },
    { value: 'empty', label: '为空' },
    { value: 'one_of', label: '其中之一' },
    { value: 'length_equals', label: '长度等于' },
    { value: 'length_gt', label: '长度大于' },
    { value: 'length_lt', label: '长度小于' }
  ],
  json_schema: [
    { value: 'equals', label: '符合 Schema' }
  ],
  javascript: [
    { value: 'equals', label: '返回 true' }
  ]
}

export function AssertionBuilder({ assertionsConfig, onChange }: AssertionBuilderProps) {
  const [newAssertionType, setNewAssertionType] = useState<AssertionType>('json_body')

  const addAssertion = () => {
    const baseAssertion = {
      id: crypto.randomUUID(),
      type: newAssertionType,
      enabled: true,
      critical: true
    }

    let assertion: Assertion

    switch (newAssertionType) {
      case 'status_code':
        assertion = {
          ...baseAssertion,
          type: 'status_code',
          target: 'status_code',
          operator: 'equals',
          expectedValue: 200
        } as Assertion
        break

      case 'response_time':
        assertion = {
          ...baseAssertion,
          type: 'response_time',
          target: 'response_time',
          operator: 'lt',
          expectedValue: 1000
        } as Assertion
        break

      case 'header':
        assertion = {
          ...baseAssertion,
          type: 'header',
          target: 'header',
          headerName: 'Content-Type',
          operator: 'contains',
          expectedValue: 'application/json'
        } as Assertion
        break

      case 'json_body':
        assertion = {
          ...baseAssertion,
          type: 'json_body',
          target: 'body',
          jsonPath: '$.code',
          operator: 'equals',
          expectedValue: 200
        } as Assertion
        break

      case 'json_schema':
        assertion = {
          ...baseAssertion,
          type: 'json_schema',
          target: 'body',
          operator: 'equals',
          expectedValue: '',
          schema: {}
        } as Assertion
        break

      case 'javascript':
        assertion = {
          ...baseAssertion,
          type: 'javascript',
          target: 'body',
          operator: 'equals',
          expectedValue: 'true',
          script: '// 自定义验证逻辑\nreturn response.code === 200;'
        } as Assertion
        break

      default:
        assertion = baseAssertion as Assertion
    }

    onChange({
      ...assertionsConfig,
      assertions: [...assertionsConfig.assertions, assertion]
    })
  }

  const updateAssertion = (index: number, updates: Partial<Assertion>) => {
    const newAssertions = [...assertionsConfig.assertions]
    newAssertions[index] = { ...newAssertions[index], ...updates } as Assertion
    onChange({
      ...assertionsConfig,
      assertions: newAssertions
    })
  }

  const removeAssertion = (index: number) => {
    const newAssertions = [...assertionsConfig.assertions]
    newAssertions.splice(index, 1)
    onChange({
      ...assertionsConfig,
      assertions: newAssertions
    })
  }

  const renderAssertionConfig = (assertion: Assertion, index: number) => {
    const operators = operatorsByType[assertion.type] || []

    return (
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
        {/* Assertion Type Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {assertionTypes.find(t => t.value === assertion.type)?.label || assertion.type}
            </span>
            {assertion.critical && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                关键
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs">启用</Label>
              <Switch
                checked={assertion.enabled}
                onCheckedChange={(checked) => updateAssertion(index, { enabled: checked })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">关键</Label>
              <Switch
                checked={assertion.critical}
                onCheckedChange={(checked) => updateAssertion(index, { critical: checked })}
              />
            </div>
          </div>
        </div>

        {/* Type-specific configuration */}
        {assertion.type === 'status_code' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">操作符</Label>
              <Select
                value={assertion.operator}
                onValueChange={(value) => updateAssertion(index, { operator: value as AssertionOperator })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operators.map(op => (
                    <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">期望值</Label>
              <Input
                type="number"
                value={Array.isArray(assertion.expectedValue) ? assertion.expectedValue[0] ?? '' : assertion.expectedValue}
                onChange={(e) => updateAssertion(index, { expectedValue: parseInt(e.target.value) })}
                className="h-8"
              />
            </div>
          </div>
        )}

        {assertion.type === 'response_time' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">操作符</Label>
              <Select
                value={assertion.operator}
                onValueChange={(value) => updateAssertion(index, { operator: value as AssertionOperator })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operators.map(op => (
                    <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">期望值 (毫秒)</Label>
              <Input
                type="number"
                value={assertion.expectedValue}
                onChange={(e) => updateAssertion(index, { expectedValue: parseInt(e.target.value) })}
                className="h-8"
              />
            </div>
          </div>
        )}

        {assertion.type === 'header' && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">响应头名称</Label>
              <Input
                value={assertion.headerName}
                onChange={(e) => updateAssertion(index, { headerName: e.target.value })}
                placeholder="Content-Type"
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">操作符</Label>
              <Select
                value={assertion.operator}
                onValueChange={(value) => updateAssertion(index, { operator: value as AssertionOperator })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operators.map(op => (
                    <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">期望值</Label>
              <Input
                value={assertion.expectedValue}
                onChange={(e) => updateAssertion(index, { expectedValue: e.target.value })}
                placeholder="application/json"
                className="h-8"
              />
            </div>
          </div>
        )}

        {assertion.type === 'json_body' && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">JSONPath 表达式</Label>
              <Input
                value={assertion.jsonPath}
                onChange={(e) => updateAssertion(index, { jsonPath: e.target.value })}
                placeholder="$.data.user.id"
                className="h-8 font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">操作符</Label>
                <Select
                  value={assertion.operator}
                  onValueChange={(value) => updateAssertion(index, { operator: value as AssertionOperator })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map(op => (
                      <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">期望值</Label>
                <Input
                  value={assertion.expectedValue}
                  onChange={(e) => updateAssertion(index, { expectedValue: e.target.value })}
                  placeholder="期望的值"
                  className="h-8"
                />
              </div>
            </div>
          </div>
        )}

        {assertion.type === 'json_schema' && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">JSON Schema</Label>
              <textarea
                value={typeof assertion.schema === 'string' ? assertion.schema : JSON.stringify(assertion.schema || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const schema = JSON.parse(e.target.value)
                    updateAssertion(index, { schema })
                  } catch {
                    // Keep the last valid schema until the input becomes valid JSON again.
                  }
                }}
                placeholder='{\n  "type": "object",\n  "required": ["id", "name"]\n}'
                className="w-full h-32 px-3 py-2 text-sm font-mono border rounded-md"
              />
            </div>
          </div>
        )}

        {assertion.type === 'javascript' && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">JavaScript 脚本</Label>
              <p className="text-xs text-gray-500 mb-2">
                可用变量: response (响应对象), headers (响应头), body (响应体)
              </p>
              <textarea
                value={assertion.script}
                onChange={(e) => updateAssertion(index, { script: e.target.value })}
                placeholder="// 示例：验证响应码\nreturn response.code === 200;"
                className="w-full h-32 px-3 py-2 text-sm font-mono border rounded-md"
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            断言配置
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="stopOnFailure" className="text-sm cursor-pointer">
              遇到失败立即停止
            </Label>
            <Switch
              id="stopOnFailure"
              checked={assertionsConfig.stopOnFailure}
              onCheckedChange={(checked) =>
                onChange({ ...assertionsConfig, stopOnFailure: checked })
              }
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Assertions list */}
        {assertionsConfig.assertions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            <p className="text-sm">暂无断言配置</p>
            <p className="text-xs mt-1">点击下方按钮添加断言</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assertionsConfig.assertions.map((assertion, index) => (
              <div key={assertion.id} className="border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">断言 #{index + 1}</span>
                    <span className="text-xs text-gray-500">
                      ({assertionTypes.find(t => t.value === assertion.type)?.label})
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAssertion(index)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-4">
                  {renderAssertionConfig(assertion, index)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add new assertion */}
        <div className="flex gap-2 pt-4 border-t">
          <Select value={newAssertionType} onValueChange={(value) => setNewAssertionType(value as AssertionType)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="选择断言类型" />
            </SelectTrigger>
            <SelectContent>
              {assertionTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex flex-col">
                    <span>{type.label}</span>
                    <span className="text-xs text-gray-500">{type.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            onClick={addAssertion}
            className="min-w-[120px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            添加断言
          </Button>
        </div>

        {/* Summary */}
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
          <p className="font-medium mb-1">断言统计：</p>
          <p>总计: {assertionsConfig.assertions.length} 条</p>
          <p>已启用: {assertionsConfig.assertions.filter(a => a.enabled).length} 条</p>
          <p>关键断言: {assertionsConfig.assertions.filter(a => a.critical).length} 条</p>
        </div>
      </CardContent>
    </Card>
  )
}
