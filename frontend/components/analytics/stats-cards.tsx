'use client'

import { memo, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3, TrendingUp, AlertTriangle, Activity } from 'lucide-react'

// Glassmorphism icon container with inline styles
function GlassIcon({ children, bgColor }: { children: React.ReactNode; bgColor: string }) {
  return (
    <div
      style={{
        width: '44px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        backgroundColor: bgColor
      }}
    >
      {children}
    </div>
  )
}

interface StatsCardsProps {
  totalExecutions: number
  avgPassRate: number
  totalTestCases: number
  failedCount: number
}

export const StatsCards = memo(function StatsCards({
  totalExecutions,
  avgPassRate,
  totalTestCases,
  failedCount
}: StatsCardsProps) {
  // Memoized color helpers for pass rate card
  const { passRateColor, passRateIconBg } = useMemo(() => {
    const getPassRateColor = (rate: number) => {
      if (rate >= 90) return '#10B981' // Emerald
      if (rate >= 70) return '#F59E0B' // Amber
      return '#EF4444' // Red
    }

    const getPassRateIconBg = (rate: number) => {
      if (rate >= 90) return '#ECFDF5' // Emerald 50
      if (rate >= 70) return '#FEF3C7' // Amber 100
      return '#FEF2F2' // Red 100
    }

    return {
      passRateColor: getPassRateColor(avgPassRate),
      passRateIconBg: getPassRateIconBg(avgPassRate)
    }
  }, [avgPassRate])

  const cards = useMemo(() => [
    {
      label: '总执行次数',
      value: totalExecutions.toLocaleString(),
      description: '全部测试执行记录',
      icon: <BarChart3 strokeWidth={2.5} className="w-5 h-5" style={{ color: '#3B82F6' }} />,
      iconBg: '#EFF6FF', // Blue 50
      showProgress: false
    },
    {
      label: '平均通过率',
      value: `${avgPassRate.toFixed(1)}%`,
      description: '基于已完成的执行',
      icon: <TrendingUp strokeWidth={2.5} className="w-5 h-5" style={{ color: passRateColor }} />,
      iconBg: passRateIconBg,
      showProgress: true,
      progressValue: avgPassRate,
      progressColor: passRateColor
    },
    {
      label: '活跃用例数',
      value: totalTestCases.toLocaleString(),
      description: '当前活跃的测试用例',
      icon: <Activity strokeWidth={2.5} className="w-5 h-5" style={{ color: '#8B5CF6' }} />,
      iconBg: '#F5F3FF', // Purple 50
      showProgress: false
    },
    {
      label: '异常/失败数',
      value: failedCount.toLocaleString(),
      description: '需要关注的失败用例',
      icon: <AlertTriangle strokeWidth={2.5} className="w-5 h-5" style={{ color: '#EF4444' }} />,
      iconBg: '#FEF2F2', // Red 50
      showProgress: false
    }
  ], [totalExecutions, avgPassRate, totalTestCases, failedCount, passRateColor, passRateIconBg])

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in duration-500">
      {cards.map((card, index) => (
        <Card
          key={index}
          className="relative transition-all duration-300 hover:shadow-xl"
          style={{
            backgroundColor: '#ffffff',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.04)',
            borderRadius: '20px',
            border: 'none'
          }}
        >
          <CardContent
            style={{
              padding: '32px'
            }}
          >
            {/* Top Section: Label & Icon */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                paddingTop: '4px',
                marginBottom: '24px'
              }}
            >
              {/* Label */}
              <p
                style={{
                  color: '#64748B',
                  fontSize: '14px',
                  fontWeight: 500,
                  margin: 0
                }}
              >
                {card.label}
              </p>

              {/* Icon */}
              <GlassIcon bgColor={card.iconBg}>
                {card.icon}
              </GlassIcon>
            </div>

            {/* Middle Section: Hero Value */}
            <div
              style={{
                marginBottom: '24px'
              }}
            >
              <p
                style={{
                  color: '#0F172A',
                  fontSize: '36px',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  margin: 0,
                  lineHeight: 1
                }}
              >
                {card.value}
              </p>
            </div>

            {/* Bottom Section: Metadata with top border */}
            <div
              style={{
                borderTop: '1px solid #F1F5F9',
                paddingTop: '16px'
              }}
            >
              {card.showProgress ? (
                <div>
                  {/* Progress Bar */}
                  <div
                    style={{
                      height: '8px',
                      backgroundColor: '#F1F5F9',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                      marginBottom: '12px'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, Math.max(0, card.progressValue ?? 0))}%`,
                        backgroundColor: card.progressColor,
                        borderRadius: '9999px',
                        transition: 'all 0.7s ease-out'
                      }}
                    />
                  </div>
                  {/* Description */}
                  <p
                    style={{
                      color: '#94A3B8',
                      fontSize: '13px',
                      margin: 0
                    }}
                  >
                    {card.description}
                  </p>
                </div>
              ) : (
                <p
                  style={{
                    color: '#94A3B8',
                    fontSize: '13px',
                    margin: 0
                  }}
                >
                  {card.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
})
