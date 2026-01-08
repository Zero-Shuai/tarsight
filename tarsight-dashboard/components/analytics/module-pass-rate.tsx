'use client'

import { memo, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Target } from 'lucide-react'

interface ModulePassRateProps {
  modulePassRates: Array<{
    moduleName: string
    passRate: number
    totalTests: number
    passedTests: number
    failedTests: number
  }>
}

// Get color based on pass rate - transitions from red to green
const getPassRateColor = (rate: number): string => {
  if (rate >= 95) return '#10B981' // emerald-500 - Excellent
  if (rate >= 90) return '#22C55E' // green-600 - Very Good
  if (rate >= 80) return '#84CC16' // lime-500 - Good
  if (rate >= 70) return '#F59E0B' // amber-500 - Fair
  if (rate >= 50) return '#FB923C' // orange-400 - Warning
  return '#EF4444' // red-500 - Critical
}

// Progress bar row component
interface ProgressBarRowProps {
  moduleName: string
  passRate: number
  totalTests: number
  index: number
}

const ProgressBarRow = memo(function ProgressBarRow({ moduleName, passRate, totalTests, index }: ProgressBarRowProps) {
  const color = getPassRateColor(passRate)

  return (
    <div className="flex items-center gap-4 py-3" style={{ animationDelay: `${index * 50}ms` }}>
      {/* Module name */}
      <div className="w-28 text-sm font-medium tracking-tight truncate" style={{ color: '#64748B' }}>
        {moduleName}
      </div>

      {/* Progress bar */}
      <div className="flex-1">
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${passRate}%`,
              backgroundColor: color
            }}
          />
        </div>
      </div>

      {/* Percentage */}
      <div className="w-16 text-sm font-bold tracking-tight text-right" style={{ color: '#0F172A' }}>
        {passRate.toFixed(1)}%
      </div>

      {/* Total tests */}
      <div className="w-16 text-xs text-right" style={{ color: '#94A3B8' }}>
        {totalTests} tests
      </div>
    </div>
  )
})

export const ModulePassRate = memo(function ModulePassRate({ modulePassRates }: ModulePassRateProps) {
  // Memoize sorted data
  const sortedData = useMemo(() => {
    return [...modulePassRates]
      .sort((a, b) => a.passRate - b.passRate)
  }, [modulePassRates])

  // Take top 8 modules for cleaner display
  const displayData = sortedData.slice(0, 8)

  const hasData = displayData.length > 0

  if (!hasData) {
    return (
      <Card className="bg-white border-0 shadow-xl shadow-slate-200/50 rounded-2xl animate-in fade-in duration-500">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F59E0B15' }}>
              <Target strokeWidth={2.5} className="w-5 h-5" style={{ color: '#F59E0B' }} />
            </div>
            <span style={{ color: '#0F172A' }}>模块通过率</span>
          </CardTitle>
          <CardDescription className="tracking-tight">各模块的测试通过率排名（从低到高）</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-5">
              <Target className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
            </div>
            <p className="text-base font-medium tracking-tight" style={{ color: '#64748B' }}>
              暂无通过率数据
            </p>
            <p className="text-sm mt-1 tracking-tight" style={{ color: '#94A3B8' }}>
              执行测试后将显示通过率统计
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-0 shadow-xl shadow-slate-200/50 rounded-2xl animate-in fade-in duration-500 delay-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 tracking-tight">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F59E0B15' }}>
            <Target strokeWidth={2.5} className="w-5 h-5" style={{ color: '#F59E0B' }} />
          </div>
          <span style={{ color: '#0F172A' }}>模块通过率</span>
        </CardTitle>
        <CardDescription className="tracking-tight">各模块的测试通过率排名（从低到高）</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Header row */}
        <div className="flex items-center gap-4 pb-3 mb-2 border-b" style={{ borderColor: '#F1F5F9' }}>
          <div className="w-28 text-xs font-semibold tracking-tight" style={{ color: '#94A3B8' }}>
            模块名称
          </div>
          <div className="flex-1 text-xs font-semibold tracking-tight" style={{ color: '#94A3B8' }}>
            通过率
          </div>
          <div className="w-16 text-xs font-semibold tracking-tight text-right" style={{ color: '#94A3B8' }}>
            百分比
          </div>
          <div className="w-16 text-xs font-semibold tracking-tight text-right" style={{ color: '#94A3B8' }}>
            测试数
          </div>
        </div>

        {/* Progress bar rows */}
        <div className="space-y-1">
          {displayData.map((item, index) => (
            <ProgressBarRow
              key={item.moduleName}
              moduleName={item.moduleName}
              passRate={item.passRate}
              totalTests={item.totalTests}
              index={index}
            />
          ))}
        </div>

        {/* Legend/Status indicators */}
        <div className="flex flex-wrap gap-5 mt-6 pt-5 border-t" style={{ borderColor: '#F1F5F9' }}>
          {[
            { label: '优秀 (≥95%)', color: '#10B981' },
            { label: '良好 (90-95%)', color: '#22C55E' },
            { label: '一般 (80-90%)', color: '#84CC16' },
            { label: '需关注 (70-80%)', color: '#F59E0B' },
            { label: '高风险 (<70%)', color: '#EF4444' }
          ].map((status, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              <span className="text-xs font-medium tracking-tight" style={{ color: '#64748B' }}>
                {status.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
})
