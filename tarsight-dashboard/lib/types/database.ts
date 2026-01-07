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
  project_code: string  // 项目编号：1-20位字母+数字，不能纯字母或纯数字
  description?: string
  base_url?: string
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
  module_code: string  // 模块编号：1-20位字母+数字，不能纯字母或纯数字
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
  case_id: string  // 测试用例编号，格式：PRJ001-MOD001-001
  test_name: string
  description?: string
  method: string
  url: string
  expected_status: number
  headers?: Record<string, string>
  request_body?: Record<string, any>
  variables?: Record<string, any>
  tags?: string[]
  level: string
  is_active: boolean
  user_id?: string
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
  user_id?: string
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
// Test Case Result (with joined data)
// ============================================
// 用于执行详情页，包含 test_results + test_cases + modules 的扁平化数据
export type TestCaseResult = {
  // test_results 表字段
  id: string
  execution_id: string
  test_case_id: string
  status: 'passed' | 'failed' | 'skipped'
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

  // test_cases 表字段 (通过 test_case 关联)
  test_case?: {
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
    request_body?: Record<string, any>
    variables?: Record<string, any>
    tags?: string[]
    level: string
    is_active: boolean
    user_id?: string
    created_at: string
    updated_at?: string

    // modules 表字段 (通过 module 关联)
    module?: {
      name: string
    }
  }

  // 便捷访问字段（从嵌套对象中提取）
  case_id?: string  // test_case.case_id
  test_name?: string  // test_case.test_name
  module_name?: string  // test_case.module.name
  method?: string  // test_case.method
  url?: string  // test_case.url
  response_time?: number  // duration 的别名
  response_code?: number  // response_info.Status_Code
  request_headers?: Record<string, string>  // request_info.Headers
  request_body?: Record<string, any>  // request_info.Body
  response_headers?: Record<string, string>  // response_info.Headers
  response_body?: any  // response_info.Body
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
  request_body?: Record<string, any>
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
