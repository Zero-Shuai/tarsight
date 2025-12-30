import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function SettingsPage() {
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '8786c21f-7437-4a2d-8486-9365a382b38e'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">系统设置</h1>
        <p className="text-muted-foreground mt-2">查看和管理系统配置</p>
      </div>

      {/* 项目信息 */}
      <Card>
        <CardHeader>
          <CardTitle>项目配置</CardTitle>
          <CardDescription>当前项目的基本信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">项目 ID</p>
              <p className="text-sm font-mono mt-1 bg-gray-100 p-2 rounded break-all">
                {projectId}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Supabase URL</p>
              <p className="text-sm font-mono mt-1 bg-gray-100 p-2 rounded break-all">
                {supabaseUrl}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 环境变量说明 */}
      <Card>
        <CardHeader>
          <CardTitle>环境变量配置</CardTitle>
          <CardDescription>需要在 .env.local 文件中配置的环境变量</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="font-medium">NEXT_PUBLIC_SUPABASE_URL</p>
              <p className="text-sm text-muted-foreground mt-1">
                Supabase 项目的 URL 地址
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                示例: https://your-project.supabase.co
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <p className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
              <p className="text-sm text-muted-foreground mt-1">
                Supabase 项目的匿名公钥
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                示例: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <p className="font-medium">NEXT_PUBLIC_PROJECT_ID</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tarsight 项目的唯一标识符
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                示例: 8786c21f-7437-4a2d-8486-9365a382b38e
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 数据库表结构 */}
      <Card>
        <CardHeader>
          <CardTitle>数据库表结构</CardTitle>
          <CardDescription>Supabase 中的主要数据表</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border rounded-lg p-4">
              <p className="font-medium">projects</p>
              <p className="text-sm text-muted-foreground mt-1">项目基本信息</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="font-medium">modules</p>
              <p className="text-sm text-muted-foreground mt-1">测试模块信息</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="font-medium">test_cases</p>
              <p className="text-sm text-muted-foreground mt-1">测试用例详情</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="font-medium">test_executions</p>
              <p className="text-sm text-muted-foreground mt-1">测试执行记录</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="font-medium">test_results</p>
              <p className="text-sm text-muted-foreground mt-1">测试结果详情</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 技术栈 */}
      <Card>
        <CardHeader>
          <CardTitle>技术栈</CardTitle>
          <CardDescription>本项目使用的主要技术</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border rounded-lg p-4">
              <p className="font-medium mb-2">前端框架</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Next.js 14 (App Router)</li>
                <li>• React 18</li>
                <li>• TypeScript</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <p className="font-medium mb-2">样式与 UI</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• TailwindCSS</li>
                <li>• Lucide Icons</li>
                <li>• CVA (Class Variance Authority)</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <p className="font-medium mb-2">数据与后端</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Supabase (PostgreSQL)</li>
                <li>• Supabase JS Client</li>
                <li>• Server Components</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 快速链接 */}
      <Card>
        <CardHeader>
          <CardTitle>快速链接</CardTitle>
          <CardDescription>常用资源和文档</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            <a
              href="https://supabase.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              → Supabase 官方文档
            </a>
            <a
              href="https://nextjs.org/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              → Next.js 官方文档
            </a>
            <a
              href="https://tailwindcss.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              → TailwindCSS 官方文档
            </a>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              → Supabase Dashboard
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
