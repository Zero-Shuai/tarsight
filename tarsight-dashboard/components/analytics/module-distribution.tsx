'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import { PieChart as PieChartIcon } from 'lucide-react'

interface ModuleDistributionProps {
  moduleTestCaseCount: Record<string, number>
  totalTestCases: number
}

// Color palette for modules
const COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#6366F1', // indigo-500
  '#14B8A6', // teal-500
  '#F97316', // orange-500
  '#84CC16', // lime-500
]

// Custom tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-4 min-w-[160px]">
        <p className="text-sm font-semibold tracking-tight mb-3 pb-3 border-b border-slate-100" style={{ color: '#0F172A' }}>
          {data.moduleName}
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#64748B' }}>用例数量</span>
            <span className="text-lg font-bold tracking-tight" style={{ color: '#0F172A' }}>
              {data.count}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#64748B' }}>占比</span>
            <span className="text-lg font-bold tracking-tight" style={{ color: data.color }}>
              {data.percentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

// Legend item with perfect alignment
interface LegendItemProps {
  color: string
  moduleName: string
  count: number
  percentage: number
}

const LegendItem = ({ color, moduleName, count, percentage }: LegendItemProps) => (
  <div className="flex items-center gap-4 py-2.5">
    {/* Color dot */}
    <div
      className="w-3 h-3 rounded-full flex-shrink-0"
      style={{ backgroundColor: color }}
    />
    {/* Module name */}
    <span className="text-sm font-medium tracking-tight flex-1" style={{ color: '#64748B' }}>
      {moduleName}
    </span>
    {/* Count */}
    <span className="text-sm font-semibold tracking-tight w-12 text-right" style={{ color: '#0F172A' }}>
      {count}
    </span>
    {/* Percentage */}
    <span className="text-sm font-bold tracking-tight w-14 text-right" style={{ color: '#0F172A' }}>
      {percentage.toFixed(0)}%
    </span>
  </div>
)

export function ModuleDistribution({
  moduleTestCaseCount,
  totalTestCases
}: ModuleDistributionProps) {
  // Transform data for chart and sort by count
  const chartData = Object.entries(moduleTestCaseCount)
    .map(([moduleName, count], index) => ({
      moduleName,
      count,
      percentage: totalTestCases > 0 ? (count / totalTestCases) * 100 : 0,
      color: COLORS[index % COLORS.length]
    }))
    .sort((a, b) => b.count - a.count)

  const hasData = chartData.length > 0 && totalTestCases > 0

  if (!hasData) {
    return (
      <Card className="bg-white border-0 shadow-xl shadow-slate-200/50 rounded-2xl animate-in fade-in duration-500">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#8B5CF615' }}>
              <PieChartIcon strokeWidth={2.5} className="w-5 h-5" style={{ color: '#8B5CF6' }} />
            </div>
            <span style={{ color: '#0F172A' }}>模块分布</span>
          </CardTitle>
          <CardDescription className="tracking-tight">各模块的测试用例分布</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-5">
              <PieChartIcon className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
            </div>
            <p className="text-base font-medium tracking-tight" style={{ color: '#64748B' }}>
              暂无模块数据
            </p>
            <p className="text-sm mt-1 tracking-tight" style={{ color: '#94A3B8' }}>
              创建模块和用例后将显示分布图表
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
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#8B5CF615' }}>
            <PieChartIcon strokeWidth={2.5} className="w-5 h-5" style={{ color: '#8B5CF6' }} />
          </div>
          <span style={{ color: '#0F172A' }}>模块分布</span>
        </CardTitle>
        <CardDescription className="tracking-tight">各模块的测试用例分布</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-8">
          {/* Donut Chart */}
          <div className="w-1/2 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="count"
                  stroke="white"
                  strokeWidth={3}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label in donut */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-4xl font-bold tracking-tight leading-none" style={{ color: '#0F172A' }}>
                {totalTestCases}
              </p>
              <p className="text-xs font-medium tracking-tight mt-2" style={{ color: '#94A3B8' }}>
                CASES TOTAL
              </p>
            </div>
          </div>
          {/* Legend */}
          <div className="w-1/2 flex flex-col justify-center">
            <div className="space-y-0.5">
              {chartData.map((entry) => (
                <LegendItem
                  key={entry.moduleName}
                  color={entry.color}
                  moduleName={entry.moduleName}
                  count={entry.count}
                  percentage={entry.percentage}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
