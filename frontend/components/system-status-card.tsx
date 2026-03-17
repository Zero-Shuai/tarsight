'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type SystemStatus = {
  status: string
  service: string
  version: string
  deployedAt: string
  environment: string
  timestamp: string
}

export function SystemStatusCard() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadStatus() {
      try {
        const response = await fetch('/api/status', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = (await response.json()) as SystemStatus
        if (!cancelled) {
          setStatus(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'unknown error')
        }
      }
    }

    loadStatus()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-xl">
          <span>系统状态</span>
          <Badge variant={error ? 'destructive' : 'secondary'}>
            {error ? '异常' : status?.status || '加载中'}
          </Badge>
        </CardTitle>
        <CardDescription>查看当前线上版本、部署时间和运行环境</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">版本</div>
          <div className="mt-2 font-mono text-sm text-slate-900">
            {status?.version || 'loading'}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">部署时间</div>
          <div className="mt-2 text-sm text-slate-900">
            {status?.deployedAt || 'loading'}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">环境</div>
          <div className="mt-2 text-sm text-slate-900">
            {status?.environment || 'loading'}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">服务</div>
          <div className="mt-2 text-sm text-slate-900">
            {status?.service || error || 'loading'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
