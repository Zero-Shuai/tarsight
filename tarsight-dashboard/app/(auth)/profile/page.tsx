'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, User, Mail, Shield } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    email: ''
  })

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const userData = await auth.getUser()
      setUser(userData)
      setFormData({
        fullName: userData?.user_metadata?.full_name || userData?.user_metadata?.name || '',
        email: userData?.email || ''
      })
    } catch (error) {
      console.error('获取用户信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      // 更新用户元数据
      const { error } = await (auth as any).supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          name: formData.fullName
        }
      })

      if (error) throw error

      setMessage('✅ 个人信息已更新')
      setTimeout(() => setMessage(''), 3000)

      // 重新加载用户信息
      await loadUserProfile()
    } catch (error: any) {
      setMessage('❌ 更新失败：' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">个人资料</h1>
        <p className="text-muted-foreground mt-2">管理您的账户信息和偏好设置</p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* 个人信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              基本信息
            </CardTitle>
            <CardDescription>
              更新您的个人信息和联系方式
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-medium">
                    姓名
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="请输入您的姓名"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    邮箱地址
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{formData.email}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    邮箱地址无法更改，如需更新请联系管理员
                  </p>
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-md text-sm ${
                  message.startsWith('✅')
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {message}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={saving}
                  className="min-w-[100px]"
                >
                  {saving ? (
                    <div className="flex items-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      保存中...
                    </div>
                  ) : (
                    '保存更改'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 账户安全卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              账户安全
            </CardTitle>
            <CardDescription>
              管理您的密码和账户安全设置
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-3">密码</h4>
                <Button variant="outline" type="button">
                  修改密码
                </Button>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3 text-red-600">危险区域</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  登出后您需要重新登录才能访问您的账户
                </p>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={handleSignOut}
                >
                  登出账户
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 账户信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>账户信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">用户 ID</span>
              <span className="font-mono text-xs">{user?.id}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">注册时间</span>
              <span>{new Date(user?.created_at || '').toLocaleDateString('zh-CN')}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">最后登录</span>
              <span>{new Date(user?.last_sign_in_at || '').toLocaleString('zh-CN')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
