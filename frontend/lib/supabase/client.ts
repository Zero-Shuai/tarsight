import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 使用 SSR 客户端以确保与 Middleware 兼容
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// 认证相关函数
export const auth = {
  /**
   * 用户注册
   */
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) throw error
    return data
  },

  /**
   * 用户登录
   */
  async signIn(email: string, password: string) {
    console.log('auth.signIn 被调用', { email })

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    console.log('signInWithPassword 响应:', { data, error })

    if (error) {
      console.error('登录错误:', error)
      throw error
    }

    console.log('登录成功，返回 data:', data)
    return data
  },

  /**
   * 用户登出
   */
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /**
   * 获取当前用户
   */
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  /**
   * 获取当前会话
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },

  /**
   * 监听认证状态变化
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// 类型定义
export interface Project {
  id: string
  name: string
  description: string
  base_url: string
  created_at: string
  updated_at?: string
}

export interface Module {
  id: string
  project_id: string
  name: string
  description: string
  created_at: string
}

export interface TestCase {
  id: string
  project_id: string
  module_id: string
  case_id: string
  test_name: string
  description: string
  method: string
  url: string
  request_body?: Record<string, any>
  expected_status: number
  headers?: Record<string, string>
  variables?: Record<string, any>
  tags?: string[]
  level?: string  // Made optional - doesn't exist in database yet
  is_active: boolean
  created_at: string
}

export interface TestExecution {
  id: string
  project_id: string
  execution_name: string
  status: 'running' | 'completed' | 'failed'
  total_tests: number
  passed_tests: number
  failed_tests: number
  skipped_tests: number
  started_at: string
  completed_at?: string
}

export interface TestResult {
  id: string
  execution_id: string
  test_case_id: string
  module_name: string
  case_id: string
  test_name: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  error_message?: string
  stack_trace?: string
  created_at: string
}

// API 函数
export const api = {
  // 获取项目
  async getProject(projectId: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle()  // 使用 maybeSingle 而不是 single，允许没有结果

    if (error) {
      console.error('获取项目失败:', error)
      return null
    }
    return data
  },

  // 获取所有模块
  async getModules(projectId: string): Promise<Module[]> {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('project_id', projectId)
      .order('name')

    if (error) throw error
    return data || []
  },

  // 获取模块统计
  async getModuleStats(projectId: string): Promise<Record<string, number>> {
    const modules = await this.getModules(projectId)
    const moduleIds = modules.map(m => m.id)

    const { data, error } = await supabase
      .from('test_cases')
      .select('module_id')
      .eq('project_id', projectId)
      .eq('is_active', true)

    if (error) throw error

    const stats: Record<string, number> = {}
    modules.forEach(m => stats[m.name] = 0)

    data?.forEach(tc => {
      const module = modules.find(m => m.id === tc.module_id)
      if (module) {
        stats[module.name]++
      }
    })

    return stats
  },

  // 获取测试用例
  async getTestCases(projectId: string, moduleId?: string): Promise<TestCase[]> {
    let query = supabase
      .from('test_cases')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('case_id')

    if (moduleId) {
      query = query.eq('module_id', moduleId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  // 获取测试执行记录
  async getTestExecutions(projectId: string, limit = 20): Promise<TestExecution[]> {
    const { data, error } = await supabase
      .from('test_executions')
      .select('*')
      .eq('project_id', projectId)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  // 获取测试结果
  async getTestResults(executionId: string): Promise<TestResult[]> {
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('execution_id', executionId)
      .order('created_at')

    if (error) throw error
    return data || []
  },

  // 获取执行统计
  async getExecutionStats(executionId: string) {
    const results = await this.getTestResults(executionId)

    return {
      total: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      avgDuration: results.length > 0
        ? results.reduce((sum, r) => sum + r.duration, 0) / results.length
        : 0
    }
  }
}

// 工具函数
export function formatDate(dateString: string): string {
  // 确保使用中国时区 (UTC+8)
  const date = new Date(dateString)

  // 检查是否是有效的日期
  if (isNaN(date.getTime())) {
    return '无效时间'
  }

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai'
  })
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) {
    return `${seconds}秒`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`
}

export function getStatusColor(status: string): string {
  const colors = {
    running: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    passed: 'bg-green-100 text-green-800',
    skipped: 'bg-yellow-100 text-yellow-800'
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

export function getStatusText(status: string): string {
  const texts = {
    running: '运行中',
    completed: '已完成',
    failed: '失败',
    passed: '通过',
    skipped: '跳过'
  }
  return texts[status as keyof typeof texts] || status
}
