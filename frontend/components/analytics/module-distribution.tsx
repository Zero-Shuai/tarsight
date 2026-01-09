'use client'

import { memo, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import { PieChart as PieChartIcon } from 'lucide-react'
import { CHART_COLORS, CARD_STYLES, COLOR_VALUES } from '@/lib/constants/chart'

interface ModuleDistributionProps {
  moduleTestCaseCount: Record<string, number>
  totalTestCases: number
}

// Memoized custom tooltip
const CustomTooltip = memo(function CustomTooltip({ active, payload }: any) {
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
})

// Legend item with perfect alignment
interface LegendItemProps {
  color: string
  moduleName: string
  count: number
  percentage: number
}

const LegendItem = memo(function LegendItem({ color, moduleName, count, percentage }: LegendItemProps) {
  return (
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
})

export const ModuleDistribution = memo(function ModuleDistribution({
  moduleTestCaseCount,
  totalTestCases
}: ModuleDistributionProps) {
  // Memoize chart data transformation
  const chartData = useMemo(() => {
    return Object.entries(moduleTestCaseCount)
      .map(([moduleName, count], index) => ({
        moduleName,
        count,
        percentage: totalTestCases > 0 ? (count / totalTestCases) * 100 : 0,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }))
      .sort((a, b) => b.count - a.count)
  }, [moduleTestCaseCount, totalTestCases])

  const hasData = chartData.length > 0 && totalTestCases > 0

  if (!hasData) {
    return (
      <Card className={CARD_STYLES.base}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#8B5CF615' }}>
              <PieChartIcon strokeWidth={2.5} className="w-5 h-5" style={{ color: COLOR_VALUES.violet500 }} />
            </div>
            <span style={{ color: COLOR_VALUES.slate900 }}>模块分布</span>
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
    <Card className={CARD_STYLES.delay100}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 tracking-tight">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#8B5CF615' }}>
            <PieChartIcon strokeWidth={2.5} className="w-5 h-5" style={{ color: COLOR_VALUES.violet500 }} />
          </div>
          <span style={{ color: COLOR_VALUES.slate900 }}>模块分布</span>
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
})
