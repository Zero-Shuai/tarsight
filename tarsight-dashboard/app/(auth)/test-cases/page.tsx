import { supabase, api, TestCase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

async function getTestCases() {
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '8786c21f-7437-4a2d-8486-9365a382b38e'

  const [testCases, modules] = await Promise.all([
    api.getTestCases(projectId),
    api.getModules(projectId)
  ])

  const moduleMap = new Map(modules.map(m => [m.id, m.name]))

  return {
    testCases: testCases.map(tc => ({
      ...tc,
      module_name: moduleMap.get(tc.module_id) || 'Unknown'
    })),
    modules
  }
}

export default async function TestCasesPage() {
  const { testCases, modules } = await getTestCases()

  // 按模块分组
  const groupedCases = testCases.reduce((acc, tc) => {
    if (!acc[tc.module_name]) {
      acc[tc.module_name] = []
    }
    acc[tc.module_name].push(tc)
    return acc
  }, {} as Record<string, TestCase[]>)

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">测试用例</h1>
        <p className="text-muted-foreground mt-2">管理所有测试用例</p>
      </div>

      {/* 统计信息 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">总用例数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testCases.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">模块数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(groupedCases).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">活跃用例</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testCases.filter(tc => tc.is_active).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* 测试用例列表 */}
      <div className="space-y-6">
        {Object.entries(groupedCases).map(([moduleName, cases]) => (
          <Card key={moduleName}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{moduleName}</CardTitle>
                  <CardDescription>{cases.length} 个测试用例</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cases.map((testCase) => (
                  <div
                    key={testCase.id}
                    className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{testCase.case_id}</span>
                        <Badge variant="outline">{testCase.method}</Badge>
                        {testCase.is_active && (
                          <Badge variant="default" className="bg-green-500">活跃</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{testCase.test_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{testCase.url}</p>
                      {testCase.description && (
                        <p className="text-sm text-muted-foreground mt-1">{testCase.description}</p>
                      )}
                      {testCase.tags && testCase.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {testCase.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>预期: {testCase.expected_status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
