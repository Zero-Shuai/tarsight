'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Key, Save, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface ProjectConfig {
  id: string
  project_id: string
  base_url: string
  api_token: string
  updated_at: string
}

type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid'

export default function ProjectsPage() {
  const [config, setConfig] = useState<ProjectConfig | null>(null)
  const [showToken, setShowToken] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle')
  const [validationMessage, setValidationMessage] = useState<string>('')

  // 加载配置
  const loadConfig = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('获取用户信息失败:', userError)
        throw new Error('未登录或用户信息获取失败')
      }

      // 从环境变量或用户配置加载
      const projectId = '8786c21f-7437-4a2d-8486-9365a382b38e'
      const baseUrl = 'https://t-stream-iq.tarsv.com'

      // 尝试从数据库加载 API Token（如果有的话）
      let apiToken = ''
      try {
        const { data: tokenData, error: tokenError } = await supabase
          .from('user_configs')
          .select('api_token')
          .eq('user_id', user.id)
          .single()

        if (tokenError) {
          // 如果是 PGRST116 错误（没有找到记录），这是正常的，用户还没有保存过 token
          if (tokenError.code !== 'PGRST116') {
            console.warn('获取 token 数据失败:', tokenError)
          }
        } else {
          apiToken = tokenData?.api_token || ''
        }
      } catch (err) {
        console.warn('查询 user_configs 时出错:', err)
        // 继续执行，只是 token 为空
      }

      setConfig({
        id: user.id,
        project_id: projectId,
        base_url: baseUrl,
        api_token: apiToken,
        updated_at: new Date().toISOString()
      })
    } catch (error: any) {
      console.error('加载配置失败:', error)
      setMessage({ type: 'error', text: '加载配置失败: ' + error.message })
    } finally {
      setIsLoading(false)
    }
  }

  // 保存配置
  const handleSave = async () => {
    if (!config) return

    setIsSaving(true)
    setMessage(null)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('未登录或用户信息获取失败')
      }

      // 保存或更新配置
      const { error } = await supabase
        .from('user_configs')
        .upsert({
          user_id: user.id,
          api_token: config.api_token,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('保存配置数据库错误:', error)
        throw error
      }

      setMessage({ type: 'success', text: '配置保存成功！' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error('保存配置失败:', error)
      setMessage({ type: 'error', text: '保存失败: ' + error.message })
    } finally {
      setIsSaving(false)
    }
  }

  // 重新加载
  const handleRefresh = () => {
    loadConfig()
  }

  // Token 有效性检测
  const handleValidateToken = async () => {
    if (!config?.api_token) {
      setValidationMessage('请先输入 API Token')
      setValidationStatus('invalid')
      return
    }

    setValidationStatus('validating')
    setValidationMessage('正在检测 Token 有效性...')

    try {
      // 调用一个简单的 API 接口来验证 Token
      const response = await fetch(`${config.base_url}/api/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.api_token}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10秒超时
      })

      if (response.ok) {
        setValidationStatus('valid')
        setValidationMessage('✅ Token 有效，可以正常使用')
      } else if (response.status === 401) {
        setValidationStatus('invalid')
        setValidationMessage('❌ Token 无效或已过期，请检查后重新输入')
      } else if (response.status === 404) {
        // 如果 404，尝试其他可能的端点
        setValidationStatus('idle')
        setValidationMessage('⚠️ 无法确定 Token 有效性（健康检查端点不存在），建议保存后实际测试')
      } else {
        setValidationStatus('invalid')
        setValidationMessage(`❌ Token 验证失败，状态码: ${response.status}`)
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setValidationStatus('invalid')
        setValidationMessage('❌ 请求超时，请检查网络连接或 API 地址是否正确')
      } else if (error.message?.includes('fetch')) {
        setValidationStatus('invalid')
        setValidationMessage('❌ 网络错误，请检查 API 地址是否正确')
      } else {
        setValidationStatus('invalid')
        setValidationMessage(`❌ 验证出错: ${error.message}`)
      }
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  // 隐藏 Token（只显示前8位和后4位）
  const maskToken = (token: string) => {
    if (!token || token.length < 12) return '•••••••••'
    return `${token.slice(0, 8)}${'•'.repeat(16)}${token.slice(-4)}`
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">项目管理</h1>
          <p className="text-muted-foreground mt-2">管理项目配置和 API Token</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 项目基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>项目信息</CardTitle>
          <CardDescription>当前项目的配置信息（从环境变量读取）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">项目 ID</label>
            <div className="mt-1 p-3 bg-gray-50 border rounded-md font-mono text-sm break-all">
              {config?.project_id || '未配置'}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">API 基础 URL</label>
            <div className="mt-1 p-3 bg-gray-50 border rounded-md font-mono text-sm break-all">
              {config?.base_url || '未配置'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Token 管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Token 管理
          </CardTitle>
          <CardDescription>
            管理用于 API 测试的访问令牌，Token 将安全存储在数据库中
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">API Token</label>
            <div className="mt-1 space-y-2">
              <div className="flex gap-2">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={config?.api_token || ''}
                  onChange={(e) => {
                    setConfig({ ...config!, api_token: e.target.value })
                    // Token 变更时重置验证状态
                    setValidationStatus('idle')
                    setValidationMessage('')
                  }}
                  placeholder="请输入 API Token"
                  className="flex-1 px-3 py-2 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowToken(!showToken)}
                  title={showToken ? '隐藏' : '显示'}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleValidateToken}
                  disabled={validationStatus === 'validating' || !config?.api_token}
                  title="检测 Token 有效性"
                >
                  {validationStatus === 'validating' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : validationStatus === 'valid' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : validationStatus === 'invalid' ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {showToken
                  ? 'Token 已可见，请注意保护隐私'
                  : `Token 已隐藏: ${maskToken(config?.api_token || '')}`
                }
              </p>
            </div>
          </div>

          {/* Token 验证结果显示 */}
          {validationMessage && (
            <div
              className={`p-4 rounded-lg border ${
                validationStatus === 'valid'
                  ? 'bg-green-50 text-green-800 border-green-200'
                  : validationStatus === 'invalid'
                  ? 'bg-red-50 text-red-800 border-red-200'
                  : 'bg-yellow-50 text-yellow-800 border-yellow-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {validationStatus === 'validating' && (
                  <Loader2 className="h-5 w-5 animate-spin mt-0.5 flex-shrink-0" />
                )}
                {validationStatus === 'valid' && (
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                )}
                {validationStatus === 'invalid' && (
                  <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                )}
                <span className="text-sm">{validationMessage}</span>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">🔒 安全提示</p>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>API Token 将加密存储在数据库中</li>
              <li>只有您可以看到和管理自己的 Token</li>
              <li>建议定期更换 Token 以确保安全</li>
              <li>不要在公共场所或截图中暴露完整 Token</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="min-w-[100px]"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  保存配置
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 配置说明 */}
      <Card>
        <CardHeader>
          <CardTitle>配置说明</CardTitle>
          <CardDescription>如何使用项目配置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="font-medium">项目 ID</p>
              <p className="text-sm text-muted-foreground mt-1">
                用于标识当前 Tarsight 项目，所有测试执行记录都会关联到此项目 ID
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <p className="font-medium">API 基础 URL</p>
              <p className="text-sm text-muted-foreground mt-1">
                测试目标 API 的基础地址，测试请求将发送到此 URL
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <p className="font-medium">API Token</p>
              <p className="text-sm text-muted-foreground mt-1">
                用于访问 API 的认证令牌，会在测试请求中添加到 Authorization 头
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
