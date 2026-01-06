import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 页面标题骨架 */}
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-5 w-64 bg-slate-100 rounded animate-pulse" />
        </div>

        {/* 统计卡片骨架 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="rounded-xl shadow-sm border border-slate-50 bg-white">
              <CardContent className="p-5">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="h-11 w-11 rounded-xl bg-slate-100 animate-pulse" />
                  <div className="text-center space-y-2 w-full">
                    <div className="h-10 w-20 mx-auto bg-slate-200 rounded animate-pulse" />
                    <div className="h-4 w-16 mx-auto bg-slate-100 rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 模块分布骨架 */}
        <Card className="rounded-xl shadow-sm border border-slate-50 bg-white">
          <CardHeader>
            <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                    <div className="h-4 w-12 bg-slate-100 rounded animate-pulse" />
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-slate-200 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 最近执行骨架 */}
        <Card className="rounded-xl shadow-sm border border-slate-50 bg-white">
          <CardHeader>
            <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-50">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
                  </div>
                  <div className="h-7 w-16 bg-slate-100 rounded-lg animate-pulse flex-shrink-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
