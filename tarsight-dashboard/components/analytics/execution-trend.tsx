import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ExecutionTrendProps {
  executionTrend: Array<{
    date: string
    count: number
    passed: number
    failed: number
  }>
}

export function ExecutionTrend({ executionTrend }: ExecutionTrendProps) {
  const maxCount = Math.max(...executionTrend.map(d => d.count), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>近7天执行趋势</CardTitle>
        <CardDescription>最近7天的测试执行统计</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {executionTrend.map((day) => {
            const passRate = day.count > 0
              ? ((day.passed / (day.passed + day.failed)) * 100).toFixed(1)
              : '0'

            return (
              <div key={day.date} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{day.date}</span>
                  <div className="flex gap-4">
                    <span className="text-green-600">通过: {day.passed}</span>
                    <span className="text-red-600">失败: {day.failed}</span>
                    <span className="font-medium">{day.count} 次</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${(day.count / maxCount) * 100}%`
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
