'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

type SystemStatus = {
  status: string
  service: string
  version: string
  revision: string
  releaseTag: string | null
  deployedAt: string
  environment: string
  timestamp: string
}

export function SystemStatusCard() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadStatus = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/status', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = (await response.json()) as SystemStatus
      setStatus(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()

    const timer = window.setInterval(() => {
      loadStatus()
    }, 60000)

    return () => {
      window.clearInterval(timer)
    }
  }, [loadStatus])

  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-xl">
          <span>系统状态</span>
          <div className="flex items-center gap-2">
            <Badge variant={error ? 'destructive' : 'secondary'}>
              {error ? '异常' : status?.status || '加载中'}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadStatus}
              disabled={loading}
              className="h-8 px-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>查看当前线上版本、部署时间和运行环境</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">版本</div>
          <div className="mt-2 font-mono text-sm text-slate-900">
            {status?.version || 'loading'}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">修订</div>
          <div className="mt-2 font-mono text-sm text-slate-900">
            {status?.revision || 'loading'}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">发布标签</div>
          <div className="mt-2 font-mono text-sm text-slate-900">
            {status?.releaseTag || 'none'}
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
        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:col-span-2 xl:col-span-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">检查时间</div>
          <div className="mt-2 text-sm text-slate-900">
            {status?.timestamp || 'loading'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
