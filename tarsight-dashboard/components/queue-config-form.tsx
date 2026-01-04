'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Loader2, RefreshCw, Trash2, AlertTriangle } from 'lucide-react'
import { supabase as supabaseClient } from '@/lib/supabase/client'

interface QueueConfig {
  max_concurrent: string
  timeout_minutes: string
  queue_enabled: string
}

interface QueueStatus {
  running: number
  queued: number
  maxConcurrent: number
  enabled: boolean
  configLoaded: boolean
}

interface QueuedTask {
  executionId: string
  timestamp: number
  waitTime: number
}

interface QueueDiagnostics {
  status: QueueStatus
  queuedTasks: QueuedTask[]
}

interface QueueConfigFormProps {
  onUpdate?: () => void
}

export function QueueConfigForm({ onUpdate }: QueueConfigFormProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reloading, setReloading] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [config, setConfig] = useState<QueueConfig>({
    max_concurrent: '2',
    timeout_minutes: '10',
    queue_enabled: 'true'
  })
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null)
  const [diagnostics, setDiagnostics] = useState<QueueDiagnostics | null>(null)

  // 加载配置
  const loadConfig = async () => {
    setLoading(true)
    try {
      const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
      const { data: configs } = await supabaseClient
        .from('queue_config')
        .select('key, value')
        .eq('project_id', projectId)

      if (configs) {
        const configMap = Object.fromEntries(
          configs.map(c => [c.key, c.value])
        )
        setConfig({
          max_concurrent: configMap.max_concurrent || '2',
          timeout_minutes: configMap.timeout_minutes || '10',
          queue_enabled: configMap.queue_enabled || 'true'
        })
      }

      // 加载队列状态
      const response = await fetch('/api/queue/status')
      if (response.ok) {
        const status = await response.json()
        setQueueStatus(status)
      }

      // 加载诊断信息
      if (showDiagnostics) {
        await loadDiagnostics()
      }
    } catch (error: any) {
      console.error('加载配置失败:', error)
      alert('加载配置失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 加载诊断信息
  const loadDiagnostics = async () => {
    try {
      const response = await fetch('/api/queue/diagnostics')
      if (response.ok) {
        const data = await response.json()
        setDiagnostics(data)
      }
    } catch (error: any) {
      console.error('加载诊断信息失败:', error)
    }
  }

  // 保存配置
  const handleSave = async () => {
    setSaving(true)
    try {
      const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

      // 更新每个配置项
      const updates = [
        { key: 'max_concurrent', value: config.max_concurrent },
        { key: 'timeout_minutes', value: config.timeout_minutes },
        { key: 'queue_enabled', value: config.queue_enabled }
      ]

      for (const update of updates) {
        const { error } = await supabaseClient
          .from('queue_config')
          .update({ value: update.value })
          .eq('project_id', projectId)
          .eq('key', update.key)

        if (error) throw error
      }

      // 重新加载队列配置
      await fetch('/api/queue/reload', { method: 'POST' })

      alert('配置已保存并生效')
      if (onUpdate) onUpdate()

      // 重新加载状态
      await loadConfig()
    } catch (error: any) {
      console.error('保存配置失败:', error)
      alert('保存配置失败: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  // 重新加载队列状态
  const handleReloadStatus = async () => {
    setReloading(true)
    try {
      const response = await fetch('/api/queue/status')
      if (response.ok) {
        const status = await response.json()
        setQueueStatus(status)
      }
      if (showDiagnostics) {
        await loadDiagnostics()
      }
    } catch (error: any) {
      console.error('加载状态失败:', error)
    } finally {
      setReloading(false)
    }
  }

  // 清空队列
  const handleClearQueue = async () => {
    if (!confirm('确定要清空队列吗？这将取消所有排队等待的任务。')) {
      return
    }

    setClearing(true)
    try {
      const response = await fetch('/api/queue/clear', { method: 'POST' })
      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        await handleReloadStatus()
      }
    } catch (error: any) {
      console.error('清空队列失败:', error)
      alert('清空队列失败: ' + error.message)
    } finally {
      setClearing(false)
    }
  }

  // 重置队列状态
  const handleResetQueue = async () => {
    if (!confirm('确定要重置队列状态吗？\n\n这将中断所有正在运行的任务并清空队列，仅在队列卡住时使用！')) {
      return
    }

    setResetting(true)
    try {
      const response = await fetch('/api/queue/reset', { method: 'POST' })
      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        await handleReloadStatus()
      }
    } catch (error: any) {
      console.error('重置队列失败:', error)
      alert('重置队列失败: ' + error.message)
    } finally {
      setResetting(false)
    }
  }

  // 切换诊断信息显示
  const toggleDiagnostics = async () => {
    const newValue = !showDiagnostics
    setShowDiagnostics(newValue)
    if (newValue) {
      await loadDiagnostics()
    }
  }

  useEffect(() => {
    loadConfig()
    // 每5秒刷新一次状态
    const interval = setInterval(handleReloadStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* 队列状态 */}
      {queueStatus && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>队列状态</CardTitle>
                <CardDescription>实时队列执行情况</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleDiagnostics}
                >
                  {showDiagnostics ? '隐藏' : '显示'}诊断
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReloadStatus}
                  disabled={reloading}
                >
                  <RefreshCw className={`h-4 w-4 ${reloading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <div className="text-sm text-muted-foreground">运行中</div>
                <div className="text-2xl font-bold text-blue-600">{queueStatus.running}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">排队中</div>
                <div className="text-2xl font-bold text-yellow-600">{queueStatus.queued}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">最大并发</div>
                <div className="text-2xl font-bold">{queueStatus.maxConcurrent}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">状态</div>
                <Badge variant={queueStatus.enabled ? 'default' : 'secondary'}>
                  {queueStatus.enabled ? '已启用' : '已禁用'}
                </Badge>
              </div>
            </div>

            {/* 队列管理按钮 */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearQueue}
                disabled={clearing || queueStatus.queued === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {clearing ? '清空中...' : '清空队列'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleResetQueue}
                disabled={resetting}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                {resetting ? '重置中...' : '重置状态'}
              </Button>
            </div>

            {/* 诊断信息 */}
            {showDiagnostics && diagnostics && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-2">队列诊断信息</div>
                {diagnostics.queuedTasks.length > 0 ? (
                  <div className="space-y-2">
                    {diagnostics.queuedTasks.map((task) => (
                      <div key={task.executionId} className="text-xs p-2 bg-background rounded">
                        <div className="font-mono">{task.executionId}</div>
                        <div className="text-muted-foreground">
                          等待时间: {(task.waitTime / 1000).toFixed(1)}秒
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">队列为空</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 配置表单 */}
      <Card>
        <CardHeader>
          <CardTitle>队列配置</CardTitle>
          <CardDescription>配置测试执行队列参数</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* 最大并发数 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="max_concurrent">最大并发数</Label>
                  <div className="text-sm text-muted-foreground">
                    同时执行的最大测试数量（建议 2-3 个）
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Input
                    id="max_concurrent"
                    type="number"
                    min="1"
                    max="10"
                    value={config.max_concurrent}
                    onChange={(e) => setConfig({ ...config, max_concurrent: e.target.value })}
                    className="w-24"
                  />
                </div>
              </div>

              {/* 超时时间 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="timeout_minutes">超时时间</Label>
                  <div className="text-sm text-muted-foreground">
                    单个测试执行的超时时间（分钟）
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Input
                    id="timeout_minutes"
                    type="number"
                    min="1"
                    max="60"
                    value={config.timeout_minutes}
                    onChange={(e) => setConfig({ ...config, timeout_minutes: e.target.value })}
                    className="w-24"
                  />
                </div>
              </div>

              {/* 启用/禁用队列 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="queue_enabled">启用队列管理</Label>
                  <div className="text-sm text-muted-foreground">
                    关闭后测试将直接执行，不经过队列
                  </div>
                </div>
                <Switch
                  id="queue_enabled"
                  checked={config.queue_enabled === 'true'}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, queue_enabled: checked ? 'true' : 'false' })
                  }
                />
              </div>

              {/* 保存按钮 */}
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    '保存配置'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>配置说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong>最大并发数：</strong>控制同时执行的测试数量。增加此值可以提高吞吐量，但会消耗更多系统资源。</p>
          <p><strong>超时时间：</strong>单个测试执行的最长时间。超过此时间测试将被自动终止。</p>
          <p><strong>启用队列管理：</strong>开启后测试将按队列顺序执行，关闭后测试将立即执行（不推荐，可能导致资源耗尽）。</p>
          <p><strong>清空队列：</strong>取消所有排队等待的任务。</p>
          <p><strong>重置状态：</strong>紧急恢复功能，将中断所有运行中的任务并重置队列计数器。仅在队列卡住时使用。</p>
        </CardContent>
      </Card>
    </div>
  )
}
