import { Button } from '@/components/ui/button'
import { Filter, FileSearch } from 'lucide-react'

interface EmptyStateProps {
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function ExecutionDetailEmptyState({ hasActiveFilters, onClearFilters }: EmptyStateProps) {
  if (hasActiveFilters) {
    return (
      <div className="py-20 px-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-6">
          <Filter className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-3">未找到匹配的测试用例</h3>
        <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
          当前筛选条件下没有找到相关测试用例。请尝试调整筛选条件或清除所有筛选。
        </p>
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="rounded-lg"
        >
          <Filter className="h-4 w-4 mr-2" />
          清除筛选
        </Button>
      </div>
    )
  }

  return (
    <div className="py-20 px-8 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-6">
        <FileSearch className="h-10 w-10 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-3">暂无测试结果</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
        该执行记录中没有测试结果数据。这可能是因为执行仍在进行中或数据加载失败。
      </p>
    </div>
  )
}
