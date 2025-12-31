import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatsCardsProps {
  totalExecutions: number
  avgPassRate: number
  totalTestCases: number
  activeModules: number
}

export function StatsCards({
  totalExecutions,
  avgPassRate,
  totalTestCases,
  activeModules
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">总执行次数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalExecutions}</div>
          <p className="text-xs text-muted-foreground mt-1">
            全部测试执行记录
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">平均通过率</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgPassRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            基于已完成的执行
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">测试用例数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTestCases}</div>
          <p className="text-xs text-muted-foreground mt-1">
            活跃的测试用例
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">测试模块数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeModules}</div>
          <p className="text-xs text-muted-foreground mt-1">
            活跃的测试模块
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
