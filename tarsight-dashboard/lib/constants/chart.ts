/**
 * 图表相关共享常量
 */

// 图表颜色配置
export const CHART_COLORS = [
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
] as const

// 通过率颜色映射
export const PASS_RATE_COLORS = {
  excellent: '#10B981', // >= 95%
  very_good: '#22C55E', // >= 90%
  good: '#84CC16',      // >= 80%
  fair: '#F59E0B',      // >= 70%
  warning: '#FB923C',   // >= 50%
  critical: '#EF4444'   // < 50%
} as const

// 通过率状态配置
export const PASS_RATE_STATUS = [
  { label: '优秀 (≥95%)', color: '#10B981', threshold: 95 },
  { label: '良好 (90-95%)', color: '#22C55E', threshold: 90 },
  { label: '一般 (80-90%)', color: '#84CC16', threshold: 80 },
  { label: '需关注 (70-80%)', color: '#F59E0B', threshold: 70 },
  { label: '高风险 (<70%)', color: '#EF4444', threshold: 0 }
] as const

/**
 * 根据通过率获取颜色
 */
export function getPassRateColor(rate: number): string {
  if (rate >= 95) return PASS_RATE_COLORS.excellent
  if (rate >= 90) return PASS_RATE_COLORS.very_good
  if (rate >= 80) return PASS_RATE_COLORS.good
  if (rate >= 70) return PASS_RATE_COLORS.fair
  if (rate >= 50) return PASS_RATE_COLORS.warning
  return PASS_RATE_COLORS.critical
}

// 卡片样式常量
export const CARD_STYLES = {
  base: 'bg-white border-0 shadow-xl shadow-slate-200/50 rounded-2xl animate-in fade-in duration-500',
  delay100: 'bg-white border-0 shadow-xl shadow-slate-200/50 rounded-2xl animate-in fade-in duration-500 delay-100',
  delay200: 'bg-white border-0 shadow-xl shadow-slate-200/50 rounded-2xl animate-in fade-in duration-500 delay-200',
} as const

// 颜色值常量
export const COLOR_VALUES = {
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate900: '#0F172A',
  blue500: '#3B82F6',
  emerald500: '#10B981',
  amber500: '#F59E0B',
  violet500: '#8B5CF6',
  red500: '#EF4444',
} as const
