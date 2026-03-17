import { NextRequest, NextResponse } from 'next/server'
import type { AssertionsConfig, Assertion } from '@/lib/types/database'

type GeneratedCaseDraft = {
  test_name: string
  description: string
  method: string
  url: string
  expected_status: number
  headers: Record<string, string> | null
  request_body: Record<string, unknown> | null
  variables: Record<string, unknown> | null
  tags: string[]
  level: 'P0' | 'P1' | 'P2' | 'P3'
  rationale?: string
  assertions: AssertionsConfig
}

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
              {
                type: 'object',
                additionalProperties: { type: 'string' }
              }
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

  const text = payload.output
    ?.flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text' || item.type === 'text')
    .map((item) => item.text || '')
    .join('')
    .trim()

  return text || ''
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

function normalizeCase(raw: Record<string, unknown>): GeneratedCaseDraft {
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
    level: ['P0', 'P1', 'P2', 'P3'].includes(String(raw.level)) ? String(raw.level) as GeneratedCaseDraft['level'] : 'P2',
    rationale: String(raw.rationale || ''),
    assertions: normalizeAssertions(raw.assertions as AssertionsConfig),
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL || 'gpt-5-mini'

  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY 未配置' }, { status: 500 })
  }

  const body = await request.json().catch(() => null)
  const document = typeof body?.document === 'string' ? body.document.trim() : ''
  const notes = typeof body?.notes === 'string' ? body.notes.trim() : ''
  const moduleName = typeof body?.moduleName === 'string' ? body.moduleName.trim() : ''

  if (!document) {
    return NextResponse.json({ error: '请先粘贴接口文档内容' }, { status: 400 })
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

  const response = await fetch('https://api.openai.com/v1/responses', {
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
    return NextResponse.json(
      { error: payload.error?.message || 'AI 生成失败' },
      { status: response.status }
    )
  }

  const outputText = extractOutputText(payload)
  if (!outputText) {
    return NextResponse.json({ error: 'AI 未返回可解析内容' }, { status: 502 })
  }

  let parsed: { summary?: string; cases?: Array<Record<string, unknown>> }
  try {
    parsed = JSON.parse(outputText)
  } catch {
    return NextResponse.json({ error: 'AI 返回内容不是合法 JSON' }, { status: 502 })
  }

  const cases = Array.isArray(parsed.cases) ? parsed.cases.map(normalizeCase) : []
  if (cases.length === 0) {
    return NextResponse.json({ error: 'AI 未生成任何可用测试用例' }, { status: 502 })
  }

  return NextResponse.json({
    summary: parsed.summary || '已生成候选测试用例',
    cases,
    model,
  })
}
