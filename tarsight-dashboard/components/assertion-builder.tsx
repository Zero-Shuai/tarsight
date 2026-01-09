'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Trash2, Plus, GripVertical } from 'lucide-react'
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
          headerName: '',
          operator: 'equals',
          expectedValue: ''
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
          schema: {}
        } as Assertion
        break
      case 'javascript':
        assertion = {
          ...baseAssertion,
          type: 'javascript',
          target: 'body',
          script: '// Write your assertion here\nreturn true;',
          timeout: 5000
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

  const updateAssertion = (index: number, field: string, value: any) => {
    const updated = { ...assertionsConfig }
    const assertions = [...updated.assertions]
    assertions[index] = { ...assertions[index], [field]: value }
    updated.assertions = assertions
    onChange(updated)
  }

  const removeAssertion = (index: number) => {
    onChange({
      ...assertionsConfig,
      assertions: assertionsConfig.assertions.filter((_, i) => i !== index)
    })
  }

  const renderAssertionForm = (assertion: Assertion, index: number) => {
    return (
      <Card key={assertion.id} className="relative">
        <div className="absolute left-2 top-4 cursor-grab text-muted-foreground">
          <GripVertical className="h-4 w-4" />
        </div>

        <CardHeader className="pl-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-mono">
              {assertion.type.replace('_', ' ').toUpperCase()}
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Label htmlFor={`enabled-${assertion.id}`} className="text-xs">
                  启用
                </Label>
                <Switch
                  id={`enabled-${assertion.id}`}
                  checked={assertion.enabled}
                  onCheckedChange={(checked) => updateAssertion(index, 'enabled', checked)}
                />
              </div>
              <div className="flex items-center gap-1">
                <Label htmlFor={`critical-${assertion.id}`} className="text-xs">
                  关键
                </Label>
                <Switch
                  id={`critical-${assertion.id}`}
                  checked={assertion.critical}
                  onCheckedChange={(checked) => updateAssertion(index, 'critical', checked)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeAssertion(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pl-10 space-y-4">
          {assertion.type === 'status_code' && (
            <>
              <div>
                <Label>操作符</Label>
                <Select
                  value={assertion.operator as string}
                  onValueChange={(value) => updateAssertion(index, 'operator', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">等于 (==)</SelectItem>
                    <SelectItem value="one_of">其中一个</SelectItem>
                    <SelectItem value="gt">大于 (&gt;)</SelectItem>
                    <SelectItem value="lt">小于 (&lt;)</SelectItem>
                    <SelectItem value="gte">大于等于 (&gt;=)</SelectItem>
                    <SelectItem value="lte">小于等于 (&lt;=)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>期望值</Label>
                <Input
                  type="number"
                  value={(assertion as any).expectedValue as number}
                  onChange={(e) => updateAssertion(index, 'expectedValue', parseInt(e.target.value))}
                  placeholder="200"
                />
              </div>
            </>
          )}

          {assertion.type === 'response_time' && (
            <>
              <div>
                <Label>操作符</Label>
                <Select
                  value={assertion.operator as string}
                  onValueChange={(value) => updateAssertion(index, 'operator', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lt">小于 (&lt;)</SelectItem>
                    <SelectItem value="gt">大于 (&gt;)</SelectItem>
                    <SelectItem value="lte">小于等于 (&lt;=)</SelectItem>
                    <SelectItem value="gte">大于等于 (&gt;=)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>期望值 (毫秒)</Label>
                <Input
                  type="number"
                  value={(assertion as any).expectedValue as number}
                  onChange={(e) => updateAssertion(index, 'expectedValue', parseInt(e.target.value))}
                  placeholder="1000"
                />
              </div>
            </>
          )}

          {assertion.type === 'header' && (
            <>
              <div>
                <Label>Header 名称</Label>
                <Input
                  value={(assertion as any).headerName}
                  onChange={(e) => updateAssertion(index, 'headerName', e.target.value)}
                  placeholder="Content-Type"
                />
              </div>
              <div>
                <Label>操作符</Label>
                <Select
                  value={assertion.operator as string}
                  onValueChange={(value) => updateAssertion(index, 'operator', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exists">存在</SelectItem>
                    <SelectItem value="equals">等于</SelectItem>
                    <SelectItem value="contains">包含</SelectItem>
                    <SelectItem value="regex">正则匹配</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>期望值</Label>
                <Input
                  value={(assertion as any).expectedValue as string}
                  onChange={(e) => updateAssertion(index, 'expectedValue', e.target.value)}
                  placeholder="application/json"
                />
              </div>
            </>
          )}

          {assertion.type === 'json_body' && (
            <>
              <div>
                <Label>JSONPath 表达式</Label>
                <Input
                  value={(assertion as any).jsonPath}
                  onChange={(e) => updateAssertion(index, 'jsonPath', e.target.value)}
                  placeholder="$.data.user.id"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  支持: $.field, $.array[0], $.field.* 等
                </p>
              </div>
              <div>
                <Label>操作符</Label>
                <Select
                  value={assertion.operator as string}
                  onValueChange={(value) => updateAssertion(index, 'operator', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">等于</SelectItem>
                    <SelectItem value="not_equals">不等于</SelectItem>
                    <SelectItem value="contains">包含</SelectItem>
                    <SelectItem value="not_contains">不包含</SelectItem>
                    <SelectItem value="gt">大于</SelectItem>
                    <SelectItem value="lt">小于</SelectItem>
                    <SelectItem value="gte">大于等于</SelectItem>
                    <SelectItem value="lte">小于等于</SelectItem>
                    <SelectItem value="type">类型检查</SelectItem>
                    <SelectItem value="exists">存在</SelectItem>
                    <SelectItem value="empty">为空</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>期望值</Label>
                <Input
                  value={(assertion as any).expectedValue as string}
                  onChange={(e) => updateAssertion(index, 'expectedValue', e.target.value)}
                  placeholder="期望值"
                />
              </div>
            </>
          )}

          {assertion.type === 'json_schema' && (
            <div>
              <Label>JSON Schema</Label>
              <textarea
                className="w-full min-h-[200px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                value={JSON.stringify((assertion as any).schema, null, 2)}
                onChange={(e) => {
                  try {
                    updateAssertion(index, 'schema', JSON.parse(e.target.value))
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder='{"type": "object", "properties": {...}}'
              />
              <p className="text-xs text-muted-foreground mt-1">
                JSON Schema draft-07 格式
              </p>
            </div>
          )}

          {assertion.type === 'javascript' && (
            <>
              <div>
                <Label>目标</Label>
                <Select
                  value={assertion.target}
                  onValueChange={(value) => updateAssertion(index, 'target', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="body">响应体 (Response Body)</SelectItem>
                    <SelectItem value="header">响应头 (Headers)</SelectItem>
                    <SelectItem value="full_response">完整响应</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>JavaScript 代码</Label>
                <textarea
                  className="w-full min-h-[200px] px-3 py-2 text-sm rounded-md border border-input bg-background font-mono"
                  value={(assertion as any).script}
                  onChange={(e) => updateAssertion(index, 'script', e.target.value)}
                  placeholder="// 可用变量: response, headers
// 返回 true/false 或 {passed: boolean, message: string}
return response.code === 200;"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  JavaScript 断言暂未实现，请使用其他断言类型
                </p>
              </div>
              <div>
                <Label>超时 (毫秒)</Label>
                <Input
                  type="number"
                  value={(assertion as any).timeout || 5000}
                  onChange={(e) => updateAssertion(index, 'timeout', parseInt(e.target.value))}
                  placeholder="5000"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">断言配置</h3>
        <div className="flex items-center gap-2">
          <Select value={newAssertionType} onValueChange={(v) => setNewAssertionType(v as AssertionType)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="选择断言类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status_code">状态码</SelectItem>
              <SelectItem value="response_time">响应时间</SelectItem>
              <SelectItem value="header">响应头</SelectItem>
              <SelectItem value="json_body">JSON Body</SelectItem>
              <SelectItem value="json_schema">JSON Schema</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={addAssertion} type="button">
            <Plus className="h-4 w-4 mr-1" />
            添加断言
          </Button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Switch
          id="stopOnFailure"
          checked={assertionsConfig.stopOnFailure}
          onCheckedChange={(checked) =>
            onChange({ ...assertionsConfig, stopOnFailure: checked })
          }
        />
        <Label htmlFor="stopOnFailure" className="text-sm cursor-pointer">
          遇到失败立即停止
        </Label>
      </div>

      {assertionsConfig.assertions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            未配置断言。点击"添加断言"按钮开始添加。
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assertionsConfig.assertions.map((assertion, index) => renderAssertionForm(assertion, index))}
        </div>
      )}
    </div>
  )
}
