import { QueueConfigForm } from '@/components/queue-config-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: '系统设置',
  description: '配置测试执行队列和系统参数'
}

export default function SettingsPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">系统设置</h1>
        <p className="text-muted-foreground mt-2">配置测试执行队列和系统参数</p>
      </div>

      <QueueConfigForm />
    </div>
  )
}
