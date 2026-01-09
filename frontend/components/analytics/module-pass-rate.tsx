'use client'

import { memo, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Target } from 'lucide-react'
import { getPassRateColor, CARD_STYLES, PASS_RATE_STATUS, COLOR_VALUES } from '@/lib/constants/chart'

interface ModulePassRateProps {
  modulePassRates: Array<{
    moduleName: string
    passRate: number
    totalTests: number
    passedTests: number
    failedTests: number
  }>
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
      <div className="w-28 text-sm font-medium tracking-tight truncate" style={{ color: COLOR_VALUES.slate500 }}>
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
      <div className="w-16 text-sm font-bold tracking-tight text-right" style={{ color: COLOR_VALUES.slate900 }}>
        {passRate.toFixed(1)}%
      </div>

      {/* Total tests */}
      <div className="w-16 text-xs text-right" style={{ color: COLOR_VALUES.slate400 }}>
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
      <Card className={CARD_STYLES.base}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F59E0B15' }}>
              <Target strokeWidth={2.5} className="w-5 h-5" style={{ color: COLOR_VALUES.amber500 }} />
            </div>
            <span style={{ color: COLOR_VALUES.slate900 }}>模块通过率</span>
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
    <Card className={CARD_STYLES.delay200}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 tracking-tight">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F59E0B15' }}>
            <Target strokeWidth={2.5} className="w-5 h-5" style={{ color: COLOR_VALUES.amber500 }} />
          </div>
          <span style={{ color: COLOR_VALUES.slate900 }}>模块通过率</span>
        </CardTitle>
        <CardDescription className="tracking-tight">各模块的测试通过率排名（从低到高）</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Header row */}
        <div className="flex items-center gap-4 pb-3 mb-2 border-b" style={{ borderColor: COLOR_VALUES.slate100 }}>
          <div className="w-28 text-xs font-semibold tracking-tight" style={{ color: COLOR_VALUES.slate400 }}>
            模块名称
          </div>
          <div className="flex-1 text-xs font-semibold tracking-tight" style={{ color: COLOR_VALUES.slate400 }}>
            通过率
          </div>
          <div className="w-16 text-xs font-semibold tracking-tight text-right" style={{ color: COLOR_VALUES.slate400 }}>
            百分比
          </div>
          <div className="w-16 text-xs font-semibold tracking-tight text-right" style={{ color: COLOR_VALUES.slate400 }}>
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
        <div className="flex flex-wrap gap-5 mt-6 pt-5 border-t" style={{ borderColor: COLOR_VALUES.slate100 }}>
          {PASS_RATE_STATUS.map((status, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              <span className="text-xs font-medium tracking-tight" style={{ color: COLOR_VALUES.slate500 }}>
                {status.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
})
