'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

export default function TestStylesPage() {
  const tests = [
    { name: 'Tailwind CSS 基础类', status: 'ok', desc: 'flex, grid, p-4, m-2 等' },
    { name: 'Card 组件', status: 'ok', desc: '圆角、边框、阴影' },
    { name: 'Button 组件', status: 'ok', desc: '主色调、悬停效果' },
    { name: '颜色变量', status: 'ok', desc: 'primary, secondary, muted 等' },
    { name: '图标组件', status: 'ok', desc: 'lucide-react 图标' },
  ]

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">样式测试页面</h1>
          <p className="text-muted-foreground">用于诊断前端样式加载问题</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>组件样式测试</CardTitle>
            <CardDescription>检查各个 UI 组件是否正常显示</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tests.map((test) => (
              <div key={test.name} className="flex items-center gap-3 p-3 border rounded-lg">
                {test.status === 'ok' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : test.status === 'warning' ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{test.name}</div>
                  <div className="text-sm text-muted-foreground">{test.desc}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                  {test.status === 'ok' ? '正常' : '异常'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>颜色测试</CardTitle>
            <CardDescription>检查主题颜色是否正确显示</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-medium">
                  Primary
                </div>
                <div className="text-xs text-center text-muted-foreground">主色调</div>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-secondary rounded-lg flex items-center justify-center text-secondary-foreground font-medium">
                  Secondary
                </div>
                <div className="text-xs text-center text-muted-foreground">次要色</div>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-destructive rounded-lg flex items-center justify-center text-destructive-foreground font-medium">
                  Destructive
                </div>
                <div className="text-xs text-center text-muted-foreground">危险色</div>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-muted rounded-lg flex items-center justify-center text-muted-foreground font-medium">
                  Muted
                </div>
                <div className="text-xs text-center text-muted-foreground">柔和色</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>按钮测试</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <Button>默认按钮</Button>
              <Button variant="outline">次要按钮</Button>
              <Button variant="destructive">危险按钮</Button>
              <Button variant="outline">轮廓按钮</Button>
              <Button variant="ghost">幽灵按钮</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="sm">小按钮</Button>
              <Button size="default">默认大小</Button>
              <Button size="lg">大按钮</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>图标测试</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <span className="text-sm">CheckCircle2</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-6 w-6 text-red-500" />
                <span className="text-sm">XCircle</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                <span className="text-sm">AlertTriangle</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
