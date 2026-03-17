import { QueueConfigForm } from '@/components/queue-config-form'
import { SystemStatusCard } from '@/components/system-status-card'

export const metadata = {
  title: '系统设置',
  description: '配置测试执行队列和系统参数'
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 ease-out">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">系统设置</h1>
          <p className="text-slate-500">配置测试执行队列和系统参数</p>
        </div>

        {/* 设置表单 */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 ease-out">
          <QueueConfigForm />
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 ease-out">
          <SystemStatusCard />
        </div>
      </div>
    </div>
  )
}
