/**
 * Supabase 数据库类型定义
 * 这些类型对应数据库表的schema
 */

// ============================================
// Projects
// ============================================
export type Project = {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at?: string
}

// ============================================
// Modules
// ============================================
export type Module = {
  id: string
  project_id: string
  name: string
  description?: string
  created_at: string
}

// ============================================
// Test Cases
// ============================================
export type TestCase = {
  id: string
  project_id: string
  module_id: string
  case_id: string
  test_name: string
  description?: string
  method: string
  url: string
  expected_status: number
  headers?: Record<string, string>
  body?: Record<string, any>
  variables?: Record<string, any>
  tags?: string[]
  level: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

// ============================================
// Test Executions
// ============================================
export type TestExecution = {
  id: string
  project_id: string
  execution_name: string
  total_tests: number
  passed_tests?: number
  failed_tests?: number
  skipped_tests?: number
  total_duration?: number
  status: 'running' | 'completed' | 'failed'
  started_at: string
  completed_at?: string
  created_at: string
}

// ============================================
// Test Results
// ============================================
export type TestResult = {
  id: string
  execution_id: string
  test_case_id: string
  status: 'passed' | 'failed' | 'skipped' | 'running'
  duration: number
  error_message?: string
  request_info?: {
    URL?: string
    Method?: string
    Headers?: Record<string, string>
    Body?: Record<string, any>
    [key: string]: any
  }
  response_info?: {
    Status_Code?: number
    Headers?: Record<string, string>
    Body?: Record<string, any>
    Success?: boolean
    Message?: string
    Code?: number
    Data?: any
    [key: string]: any
  }
  created_at: string
}

// ============================================
// API Request/Response Types
// ============================================

// 执行测试请求
export type ExecuteTestRequest = {
  test_case_ids: string[]
  case_ids?: string[]
  mode?: 'full' | 'simple'
}

// 执行测试响应
export type ExecuteTestResponse = {
  success: boolean
  execution_id: string
  mode: 'full' | 'simple'
  message: string
}

// 测试用例表单数据
export type TestCaseFormData = {
  module_id: string
  case_id: string
  test_name: string
  description?: string
  method: string
  url: string
  expected_status: number
  headers?: Record<string, string>
  body?: Record<string, any>
  variables?: Record<string, any>
  tags?: string[]
  level: string
  is_active: boolean
}

// ============================================
// 统计相关类型
// ============================================

// 模块统计
export type ModuleStats = {
  moduleName: string
  totalCases: number
}

// 执行统计
export type ExecutionStats = {
  totalExecutions: number
  averagePassRate: number
  totalTestCases: number
  activeModules: number
}

// 近期执行趋势
export type ExecutionTrend = {
  date: string
  executions: number
  passRate: number
}

// ============================================
// 类型保护函数
// ============================================

export function isTestExecution(execution: any): execution is TestExecution {
  return (
    typeof execution === 'object' &&
    typeof execution.id === 'string' &&
    typeof execution.project_id === 'string' &&
    ['running', 'completed', 'failed'].includes(execution.status)
  )
}

export function isTestCase(testCase: any): testCase is TestCase {
  return (
    typeof testCase === 'object' &&
    typeof testCase.id === 'string' &&
    typeof testCase.case_id === 'string' &&
    typeof testCase.test_name === 'string'
  )
}
