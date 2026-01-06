'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Eye, EyeOff, Key, Save, RefreshCw, ShieldCheck, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import type { Project } from '@/lib/types/database'

interface ProjectConfig {
  id: string
  project_id: string
  project_code: string
  name: string
  description?: string
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

  // 编辑模式状态
  const [projectEditMode, setProjectEditMode] = useState(false)
  const [tokenEditMode, setTokenEditMode] = useState(false)

  // 权限检查（预留接口）
  const canEditProject = true  // TODO: 从用户权限中获取

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

      // 从环境变量读取默认项目ID
      const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '8786c21f-7437-4a2d-8486-9365a382b38e'

      // 从数据库加载项目信息
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError) {
        console.error('获取项目信息失败:', projectError)
        throw new Error('获取项目信息失败: ' + projectError.message)
      }

      // 尝试从数据库加载 API Token
      let apiToken = ''
      try {
        const { data: tokenData, error: tokenError } = await supabase
          .from('user_configs')
          .select('api_token')
          .eq('user_id', user.id)
          .single()

        if (tokenError) {
          if (tokenError.code !== 'PGRST116') {
            console.warn('获取 token 数据失败:', tokenError)
          }
        } else {
          apiToken = tokenData?.api_token || ''
        }
      } catch (err) {
        console.warn('查询 user_configs 时出错:', err)
      }

      setConfig({
        id: user.id,
        project_id: projectId,
        project_code: project.project_code || '',
        name: project.name || '',
        description: project.description || '',
        base_url: project.base_url || '',
        api_token: apiToken,
        updated_at: project.updated_at || new Date().toISOString()
      })
    } catch (error: any) {
      console.error('加载配置失败:', error)
      setMessage({ type: 'error', text: '加载配置失败: ' + error.message })
    } finally {
      setIsLoading(false)
    }
  }

  // 重新加载
  const handleRefresh = () => {
    loadConfig()
  }

  // 进入项目编辑模式
  const handleEnterProjectEdit = () => {
    if (!canEditProject) {
      setMessage({ type: 'error', text: '您没有权限编辑项目信息' })
      return
    }
    setProjectEditMode(true)
    setMessage(null)
  }

  // 取消项目编辑
  const handleCancelProjectEdit = () => {
    setProjectEditMode(false)
    // 重新加载数据以恢复原始值
    loadConfig()
  }

  // 完成项目编辑
  const handleCompleteProjectEdit = async () => {
    if (!config) return

    setIsSaving(true)
    setMessage(null)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('未登录或用户信息获取失败')
      }

      // 只保存项目信息
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          project_code: config.project_code,
          name: config.name,
          description: config.description,
          base_url: config.base_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.project_id)

      if (projectError) {
        console.error('保存项目信息失败:', projectError)
        throw new Error('保存项目信息失败: ' + projectError.message)
      }

      setProjectEditMode(false)
      setMessage({ type: 'success', text: '项目信息保存成功！' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error('保存项目信息失败:', error)
      setMessage({ type: 'error', text: '保存失败: ' + error.message })
    } finally {
      setIsSaving(false)
    }
  }

  // 进入 Token 编辑模式
  const handleEnterTokenEdit = () => {
    setTokenEditMode(true)
    setMessage(null)
  }

  // 取消 Token 编辑
  const handleCancelTokenEdit = () => {
    setTokenEditMode(false)
    loadConfig()
  }

  // 完成 Token 编辑（保存 Token）
  const handleCompleteTokenEdit = async () => {
    if (!config) return

    setIsSaving(true)
    setMessage(null)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('未登录或用户信息获取失败')
      }

      // 只保存 Token
      const { error: tokenError } = await supabase
        .from('user_configs')
        .upsert({
          user_id: user.id,
          api_token: config.api_token,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (tokenError) {
        console.warn('保存 Token 失败:', tokenError)
        throw new Error('保存 Token 失败: ' + tokenError.message)
      }

      setTokenEditMode(false)
      setMessage({ type: 'success', text: 'Token 保存成功！' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error('保存 Token 失败:', error)
      setMessage({ type: 'error', text: '保存失败: ' + error.message })
    } finally {
      setIsSaving(false)
    }
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
      // 使用实际的 API 端点验证 Token
      const response = await fetch(`${config.base_url}/api/charts/post_category/all_enums`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.api_token}`,
          'Content-Type': 'application/json',
          'accept': 'application/json, text/plain, */*'
        },
        signal: AbortSignal.timeout(10000) // 10秒超时
      })

      // 检查响应状态码
      if (response.status === 404) {
        setValidationStatus('invalid')
        setValidationMessage('❌ API 端点不存在，请检查 API 地址配置')
        return
      }

      if (response.status >= 500) {
        setValidationStatus('invalid')
        setValidationMessage(`❌ API 服务器错误，状态码: ${response.status}`)
        return
      }

      // 对于 200 OK 响应，还要检查响应内容
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        setValidationStatus('invalid')
        setValidationMessage('❌ API 返回了非 JSON 格式的数据，请检查 API 地址配置')
        return
      }

      // 尝试解析响应体
      const data = await response.json()

      // 检查响应体中的 code 字段
      if (data.code === 1001) {
        // code 1001 表示 token 失效
        setValidationStatus('invalid')
        setValidationMessage(`❌ Token 已失效: ${data.message || 'User session has expired or been logged out'}`)
        return
      }

      // 检查 success 字段
      if (data.success === false) {
        setValidationStatus('invalid')
        setValidationMessage(`❌ API 返回错误: ${data.message || 'Unknown error'} (code: ${data.code})`)
        return
      }

      // Token 有效
      setValidationStatus('valid')
      setValidationMessage('✅ Token 有效，可以正常使用')
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>项目信息</CardTitle>
              <CardDescription>编辑项目的基本信息和编号</CardDescription>
            </div>
            {!projectEditMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEnterProjectEdit}
                disabled={!canEditProject}
              >
                编辑
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 项目 UUID (只读) */}
          <div>
            <Label htmlFor="project_id">项目 UUID</Label>
            <Input
              id="project_id"
              value={config?.project_id || ''}
              disabled
              className="bg-gray-50 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              项目的唯一标识符（不可修改）
            </p>
          </div>

          {/* 项目编号 */}
          <div>
            <Label htmlFor="project_code">项目编号 *</Label>
            <Input
              id="project_code"
              value={config?.project_code || ''}
              onChange={(e) => {
                const value = e.target.value
                setConfig({ ...config!, project_code: value })
              }}
              disabled={!projectEditMode}
              placeholder="例如: PRJ, Project, Project1, TEST-099"
              pattern="^[A-Za-z][A-Za-z0-9]{0,19}$"
              title="1-20位字符，必须以字母开头"
              required
              className={!projectEditMode ? 'bg-gray-50' : ''}
            />
            <p className="text-xs text-muted-foreground mt-1">
              1-20位字符，必须以字母开头，可包含数字
            </p>
          </div>

          {/* 项目名称 */}
          <div>
            <Label htmlFor="name">项目名称 *</Label>
            <Input
              id="name"
              value={config?.name || ''}
              onChange={(e) => setConfig({ ...config!, name: e.target.value })}
              disabled={!projectEditMode}
              placeholder="例如: Tarsight 测试项目"
              required
              className={!projectEditMode ? 'bg-gray-50' : ''}
            />
          </div>

          {/* 项目描述 */}
          <div>
            <Label htmlFor="description">项目描述</Label>
            <Textarea
              id="description"
              value={config?.description || ''}
              onChange={(e) => setConfig({ ...config!, description: e.target.value })}
              disabled={!projectEditMode}
              placeholder="简要描述项目的用途和范围..."
              rows={3}
              className={!projectEditMode ? 'bg-gray-50' : ''}
            />
          </div>

          {/* API 基础 URL */}
          <div>
            <Label htmlFor="base_url">API 基础 URL</Label>
            <Input
              id="base_url"
              value={config?.base_url || ''}
              onChange={(e) => setConfig({ ...config!, base_url: e.target.value })}
              disabled={!projectEditMode}
              placeholder="https://api.example.com"
              className={!projectEditMode ? 'bg-gray-50' : ''}
            />
            <p className="text-xs text-muted-foreground mt-1">
              测试目标 API 的基础地址
            </p>
          </div>

          {/* 编辑模式操作按钮 */}
          {projectEditMode && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleCancelProjectEdit}
                disabled={isSaving}
              >
                取消
              </Button>
              <Button
                onClick={handleCompleteProjectEdit}
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : '完成'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Token 管理 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Token 管理
              </CardTitle>
              <CardDescription>
                管理用于 API 测试的访问令牌，Token 将安全存储在数据库中
              </CardDescription>
            </div>
            {!tokenEditMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEnterTokenEdit}
              >
                编辑
              </Button>
            )}
          </div>
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
                  disabled={!tokenEditMode}
                  className={`flex-1 px-3 py-2 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !tokenEditMode ? 'bg-gray-50' : ''
                  }`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowToken(!showToken)}
                  disabled={!tokenEditMode}
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
                  className="relative"
                >
                  {validationStatus === 'validating' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : validationStatus === 'valid' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : validationStatus === 'invalid' ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
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

          {/* 编辑模式操作按钮 */}
          {tokenEditMode && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleCancelTokenEdit}
                disabled={isSaving}
              >
                取消
              </Button>
              <Button
                onClick={handleCompleteTokenEdit}
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : '保存 Token'}
              </Button>
            </div>
          )}
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
