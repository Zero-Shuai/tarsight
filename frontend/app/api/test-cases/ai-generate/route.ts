import { NextRequest, NextResponse } from 'next/server'
import type { AITestCaseDraft, AssertionsConfig, Assertion } from '@/lib/types/database'

type Provider = 'openai' | 'deepseek' | 'openai_compatible'

type OpenAIResponsesOutput = {
  output_text?: string
  output?: Array<{
    content?: Array<{
      type?: string
      text?: string
    }>
  }>
  error?: {
    message?: string
  }
}

type ChatCompletionsOutput = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  error?: {
    message?: string
  }
}

const CASE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    cases: {
      type: 'array',
      minItems: 1,
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          test_name: { type: 'string' },
          description: { type: 'string' },
          method: { type: 'string' },
          url: { type: 'string' },
          expected_status: { type: 'integer' },
          headers: {
            anyOf: [
              { type: 'null' },
              { type: 'object', additionalProperties: { type: 'string' } }
            ]
          },
          request_body: {
            anyOf: [
              { type: 'null' },
              { type: 'object', additionalProperties: true }
            ]
          },
          variables: {
            anyOf: [
              { type: 'null' },
              { type: 'object', additionalProperties: true }
            ]
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 8
          },
          level: {
            type: 'string',
            enum: ['P0', 'P1', 'P2', 'P3']
          },
          rationale: { type: 'string' },
          assertions: {
            type: 'object',
            additionalProperties: false,
            properties: {
              version: { type: 'string' },
              stopOnFailure: { type: 'boolean' },
              assertions: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    type: {
                      type: 'string',
                      enum: ['status_code', 'header', 'json_body']
                    },
                    target: {
                      type: 'string',
                      enum: ['status_code', 'header', 'body']
                    },
                    operator: { type: 'string' },
                    expectedValue: {},
                    headerName: { type: 'string' },
                    jsonPath: { type: 'string' },
                    description: { type: 'string' }
                  },
                  required: ['type', 'target']
                }
              }
            },
            required: ['version', 'stopOnFailure', 'assertions']
          }
        },
        required: [
          'test_name',
          'description',
          'method',
          'url',
          'expected_status',
          'headers',
          'request_body',
          'variables',
          'tags',
          'level',
          'rationale',
          'assertions'
        ]
      }
    }
  },
  required: ['summary', 'cases']
} as const

function extractOutputText(payload: OpenAIResponsesOutput): string {
  if (payload.output_text) {
    return payload.output_text
  }

  return payload.output
    ?.flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text' || item.type === 'text')
    .map((item) => item.text || '')
    .join('')
    .trim() || ''
}

function extractChatCompletionText(payload: ChatCompletionsOutput): string {
  return payload.choices?.[0]?.message?.content?.trim() || ''
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

function normalizeAssertions(config: AssertionsConfig | null | undefined): AssertionsConfig {
  const rawAssertions = Array.isArray(config?.assertions) ? config.assertions : []
  const assertions: Assertion[] = []

  rawAssertions.forEach((assertion, index) => {
    const id = crypto.randomUUID()
    const base = {
      id,
      enabled: true,
      critical: index === 0,
      description: assertion.description,
    }

    if (assertion.type === 'status_code') {
      const expectedValue = typeof assertion.expectedValue === 'number'
        ? assertion.expectedValue
        : Array.isArray(assertion.expectedValue)
          ? assertion.expectedValue.map((item) => Number(item)).filter((item) => !Number.isNaN(item))
          : 200

      assertions.push({
        ...base,
        type: 'status_code',
        target: 'status_code',
        operator: assertion.operator === 'one_of' ? 'one_of' : 'equals',
        expectedValue,
      })
      return
    }

    if (assertion.type === 'header' && 'headerName' in assertion && assertion.headerName) {
      assertions.push({
        ...base,
        type: 'header',
        target: 'header',
        headerName: assertion.headerName,
        operator: assertion.operator || 'contains',
        expectedValue: assertion.expectedValue ?? 'application/json',
      })
      return
    }

    if (assertion.type === 'json_body' && 'jsonPath' in assertion && assertion.jsonPath) {
      assertions.push({
        ...base,
        type: 'json_body',
        target: 'body',
        jsonPath: assertion.jsonPath,
        operator: assertion.operator || 'exists',
        expectedValue: assertion.expectedValue,
      })
    }
  })

  return {
    version: '2.0',
    stopOnFailure: config?.stopOnFailure ?? true,
    assertions,
  }
}

function normalizeCase(raw: Record<string, unknown>): AITestCaseDraft {
  return {
    test_name: String(raw.test_name || 'AI 生成测试用例'),
    description: String(raw.description || ''),
    method: String(raw.method || 'GET').toUpperCase(),
    url: String(raw.url || '/'),
    expected_status: Number(raw.expected_status || 200),
    headers: (() => {
      const record = toRecord(raw.headers)
      if (!record) return null
      return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, String(value)]))
    })(),
    request_body: toRecord(raw.request_body),
    variables: toRecord(raw.variables),
    tags: Array.isArray(raw.tags) ? raw.tags.map((tag) => String(tag)).slice(0, 8) : [],
    level: ['P0', 'P1', 'P2', 'P3'].includes(String(raw.level)) ? String(raw.level) as AITestCaseDraft['level'] : 'P2',
    rationale: String(raw.rationale || ''),
    assertions: normalizeAssertions(raw.assertions as AssertionsConfig),
  }
}

function normalizeBaseUrl(provider: Provider, baseUrl: string): string {
  const trimmed = baseUrl.trim()
  if (trimmed) {
    return trimmed.replace(/\/+$/, '')
  }

  if (provider === 'openai') {
    return 'https://api.openai.com/v1'
  }

  if (provider === 'deepseek') {
    return 'https://api.deepseek.com'
  }

  return ''
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const provider = body?.provider as Provider | undefined
  const apiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : ''
  const baseUrl = typeof body?.baseUrl === 'string' ? body.baseUrl.trim() : ''
  const model = typeof body?.model === 'string' ? body.model.trim() : ''
  const document = typeof body?.document === 'string' ? body.document.trim() : ''
  const notes = typeof body?.notes === 'string' ? body.notes.trim() : ''
  const moduleName = typeof body?.moduleName === 'string' ? body.moduleName.trim() : ''
  const moduleId = typeof body?.moduleId === 'string' ? body.moduleId.trim() : ''

  if (!provider || !['openai', 'deepseek', 'openai_compatible'].includes(provider)) {
    return NextResponse.json({ error: '请选择有效的 AI 提供商' }, { status: 400 })
  }

  if (!apiKey) {
    return NextResponse.json({ error: '请填写 API Key' }, { status: 400 })
  }

  if (!model) {
    return NextResponse.json({ error: '请填写模型名称' }, { status: 400 })
  }

  if (!document) {
    return NextResponse.json({ error: '请先粘贴接口文档内容' }, { status: 400 })
  }

  const normalizedBaseUrl = normalizeBaseUrl(provider, baseUrl)
  if (!normalizedBaseUrl) {
    return NextResponse.json({ error: '请填写 Base URL' }, { status: 400 })
  }

  const prompt = [
    '你是资深接口测试工程师。',
    '请基于接口文档生成 3 到 5 条高价值接口测试用例。',
    '输出要可直接用于 API 测试平台创建用例。',
    '优先覆盖：主流程、参数缺失/非法、鉴权、边界值、业务失败分支。',
    '如果文档没有给出完整信息，保持保守假设，不要虚构复杂字段。',
    '断言只生成可执行的 status_code/header/json_body 三类。',
    moduleName ? `当前用户选择的模块名称: ${moduleName}` : '',
    notes ? `额外要求: ${notes}` : '',
    '接口文档如下：',
    document,
  ].filter(Boolean).join('\n\n')

  let outputText = ''

  if (provider === 'deepseek') {
    const response = await fetch(`${normalizedBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: '你负责把接口文档转换成高质量的 API 测试用例草稿。输出必须是严格合法的 JSON，并符合用户要求的结构。'
          },
          {
            role: 'user',
            content: `${prompt}\n\n请严格返回 JSON，不要输出 Markdown 代码块。JSON 顶层必须包含 summary 和 cases。`
          }
        ],
        response_format: {
          type: 'json_object'
        }
      })
    })

    const payload = await response.json() as ChatCompletionsOutput
    if (!response.ok) {
      return NextResponse.json({ error: payload.error?.message || 'AI 生成失败' }, { status: response.status })
    }

    outputText = extractChatCompletionText(payload)
  } else {
    const response = await fetch(`${normalizedBaseUrl}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: '你负责把接口文档转换成高质量的 API 测试用例草稿。输出必须严格符合给定 JSON Schema。'
              }
            ]
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: prompt,
              }
            ]
          }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'generated_test_cases',
            strict: true,
            schema: CASE_SCHEMA,
          }
        }
      })
    })

    const payload = await response.json() as OpenAIResponsesOutput
    if (!response.ok) {
      return NextResponse.json({ error: payload.error?.message || 'AI 生成失败' }, { status: response.status })
    }

    outputText = extractOutputText(payload)
  }

  if (!outputText) {
    return NextResponse.json({ error: 'AI 未返回可解析内容' }, { status: 502 })
  }

  let parsed: { summary?: string; cases?: Array<Record<string, unknown>> }
  try {
    parsed = JSON.parse(outputText)
  } catch {
    return NextResponse.json({ error: 'AI 返回内容不是合法 JSON' }, { status: 502 })
  }

  const cases = Array.isArray(parsed.cases)
    ? parsed.cases.map((item) => ({ ...normalizeCase(item), module_id: moduleId || undefined }))
    : []

  if (cases.length === 0) {
    return NextResponse.json({ error: 'AI 未生成任何可用测试用例' }, { status: 502 })
  }

  return NextResponse.json({
    summary: parsed.summary || '已生成候选测试用例',
    cases,
    provider,
    model,
    baseUrl: normalizedBaseUrl,
  })
}
