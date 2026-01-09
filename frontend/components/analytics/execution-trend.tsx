'use client'

import { memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { TrendingUp } from 'lucide-react'

interface ExecutionTrendProps {
  executionTrend: Array<{
    date: string
    count: number
    passed: number
    failed: number
  }>
}

// Memoized custom tooltip
const CustomTooltip = memo(function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-4 min-w-[160px]">
        <p className="text-sm font-semibold tracking-tight mb-3 pb-3 border-b border-slate-100" style={{ color: '#0F172A' }}>
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium" style={{ color: '#64748B' }}>
                {entry.name === 'passed' ? '通过' : entry.name === 'failed' ? '失败' : entry.name}
              </span>
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: '#0F172A' }}>
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
})

export const ExecutionTrend = memo(function ExecutionTrend({ executionTrend }: ExecutionTrendProps) {
  // Format date to MM-DD
  const formattedData = executionTrend.map(item => ({
    ...item,
    shortDate: new Date(item.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  })).reverse()

  // Check if we have data
  const hasData = executionTrend.some(d => d.count > 0)

  if (!hasData) {
    return (
      <Card className="bg-white border-0 shadow-xl shadow-slate-200/50 rounded-2xl animate-in fade-in duration-500">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3B82F615' }}>
              <TrendingUp strokeWidth={2.5} className="w-5 h-5" style={{ color: '#3B82F6' }} />
            </div>
            <span style={{ color: '#0F172A' }}>执行趋势</span>
          </CardTitle>
          <CardDescription className="tracking-tight">最近7天的测试执行趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-5">
              <TrendingUp className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
            </div>
            <p className="text-base font-medium tracking-tight" style={{ color: '#64748B' }}>
              等待更多测试结果...
            </p>
            <p className="text-sm mt-1 tracking-tight" style={{ color: '#94A3B8' }}>
              执行测试后将显示趋势图表
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-0 shadow-xl shadow-slate-200/50 rounded-2xl animate-in fade-in duration-500 delay-100">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 tracking-tight">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3B82F615' }}>
            <TrendingUp strokeWidth={2.5} className="w-5 h-5" style={{ color: '#3B82F6' }} />
          </div>
          <span style={{ color: '#0F172A' }}>执行趋势</span>
        </CardTitle>
        <CardDescription className="tracking-tight">最近7天的测试执行趋势</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={formattedData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPassed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            {/* Only horizontal grid lines */}
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="#F1F5F9"
              horizontal={true}
              vertical={false}
            />
            <XAxis
              dataKey="shortDate"
              stroke="#94A3B8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              tickCount={4}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              formatter={(value) => (
                <span className="text-sm font-medium tracking-tight" style={{ color: '#64748B' }}>
                  {value === 'passed' ? '通过' : value === 'failed' ? '失败' : value}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="passed"
              stroke="#10B981"
              strokeWidth={2.5}
              fill="url(#colorPassed)"
              name="passed"
              activeDot={{ r: 0 }}
              dot={{ r: 0 }}
            />
            <Area
              type="monotone"
              dataKey="failed"
              stroke="#EF4444"
              strokeWidth={2.5}
              fill="url(#colorFailed)"
              name="failed"
              activeDot={{ r: 0 }}
              dot={{ r: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
})
