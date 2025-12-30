import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    passed: 'text-green-600 bg-green-50',
    failed: 'text-red-600 bg-red-50',
    skipped: 'text-yellow-600 bg-yellow-50',
    running: 'text-blue-600 bg-blue-50',
    completed: 'text-green-600 bg-green-50',
  }
  return colors[status] || 'text-gray-600 bg-gray-50'
}

export function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    passed: '通过',
    failed: '失败',
    skipped: '跳过',
    running: '运行中',
    completed: '已完成',
  }
  return texts[status] || status
}
