'use client'

import { useCallback, useMemo, useState } from 'react'
import { Loader2, Sparkles, Wand2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import type { AITestCaseDraft, Module } from '@/lib/types/database'

type AIProvider = 'openai' | 'openai_compatible'

interface AITestCaseGeneratorDrawerProps {
  modules: Module[]
  onClose: () => void
  onApply: (draft: AITestCaseDraft) => void
}

export function AITestCaseGeneratorDrawer({ modules, onClose, onApply }: AITestCaseGeneratorDrawerProps) {
  const [provider, setProvider] = useState<AIProvider>('openai')
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1')
  const [model, setModel] = useState('gpt-5-mini')
  const [apiKey, setApiKey] = useState('')
  const [moduleId, setModuleId] = useState('')
  const [document, setDocument] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState('')
  const [generatedCases, setGeneratedCases] = useState<AITestCaseDraft[]>([])

  const selectedModule = useMemo(
    () => modules.find((module) => module.id === moduleId),
    [moduleId, modules]
  )

  const handleProviderChange = useCallback((value: AIProvider) => {
    setProvider(value)
    if (value === 'openai') {
      setBaseUrl('https://api.openai.com/v1')
      if (!model) {
        setModel('gpt-5-mini')
      }
    }
  }, [model])

  const handleGenerate = useCallback(async () => {
    if (!apiKey.trim()) {
      setError('请填写 API Key')
      return
    }
    if (!model.trim()) {
      setError('请填写模型名称')
      return
    }
    if (!document.trim()) {
      setError('请先粘贴接口文档')
      return
    }
    if (provider === 'openai_compatible' && !baseUrl.trim()) {
      setError('请填写兼容平台 Base URL')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/test-cases/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider,
          baseUrl,
          model,
          apiKey,
          moduleId,
          moduleName: selectedModule?.name || '',
          document,
          notes,
        })
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'AI 生成失败')
      }

      setSummary(result.summary || '')
      setGeneratedCases(result.cases || [])
      setError('')
    } catch (err) {
      setGeneratedCases([])
      setSummary('')
      setError(err instanceof Error ? err.message : 'AI 生成失败')
    } finally {
      setLoading(false)
    }
  }, [apiKey, baseUrl, document, model, moduleId, notes, provider, selectedModule?.name])

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="fixed right-0 top-0 bottom-0 w-full max-w-4xl bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              AI 生成测试用例
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              粘贴接口文档，生成候选用例，再选择一条应用到新建表单。
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-lg hover:bg-slate-100 h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-slate-50/50">
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="provider">AI 提供商</Label>
                <select
                  id="provider"
                  value={provider}
                  onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                >
                  <option value="openai">OpenAI</option>
                  <option value="openai_compatible">OpenAI-Compatible</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-1 xl:col-span-2">
                <Label htmlFor="base_url">Base URL</Label>
                <Input
                  id="base_url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">模型</Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="gpt-5-mini"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                />
                <p className="text-xs text-slate-500">仅用于当前请求，不保存到服务器或数据库。</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="module_id">所属模块（可选）</Label>
                <select
                  id="module_id"
                  value={moduleId}
                  onChange={(e) => setModuleId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">不指定模块</option>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>{module.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">接口文档</Label>
              <Textarea
                id="document"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                placeholder="粘贴接口路径、请求方法、参数定义、请求示例、响应示例、错误码说明等内容"
                rows={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">额外要求</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例如：优先生成主流程、鉴权失败、参数缺失三类用例"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                支持 OpenAI 和兼容 OpenAI Responses API 的平台。
              </div>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    开始生成
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {error}
              </div>
            )}
          </div>

          {summary && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              {summary}
            </div>
          )}

          {generatedCases.length > 0 && (
            <div className="space-y-4">
              {generatedCases.map((generatedCase, index) => (
                <div key={`${generatedCase.test_name}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{generatedCase.level}</Badge>
                        <span className="font-semibold text-slate-900">{generatedCase.test_name}</span>
                      </div>
                      <p className="text-sm text-slate-500">
                        {generatedCase.method} {generatedCase.url} · 期望 {generatedCase.expected_status}
                      </p>
                    </div>
                    <Button type="button" variant="outline" onClick={() => onApply(generatedCase)}>
                      应用到新建表单
                    </Button>
                  </div>

                  {generatedCase.description && (
                    <p className="text-sm text-slate-600">{generatedCase.description}</p>
                  )}

                  {generatedCase.rationale && (
                    <p className="text-xs text-slate-500">生成说明：{generatedCase.rationale}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
