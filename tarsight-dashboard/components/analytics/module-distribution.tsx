import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ModuleDistributionProps {
  moduleTestCaseCount: Record<string, number>
  totalTestCases: number
}

export function ModuleDistribution({
  moduleTestCaseCount,
  totalTestCases
}: ModuleDistributionProps) {
  const modules = Object.entries(moduleTestCaseCount).sort((a, b) => b[1] - a[1])

  return (
    <Card>
      <CardHeader>
        <CardTitle>模块分布</CardTitle>
        <CardDescription>各模块的测试用例数量</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {modules.length > 0 ? modules.map(([moduleName, count]) => {
            const percentage = totalTestCases > 0
              ? (count / totalTestCases) * 100
              : 0

            return (
              <div key={moduleName} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{moduleName}</span>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">{count} 个用例</span>
                    <span className="font-medium">{percentage.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          }) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              暂无数据
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
