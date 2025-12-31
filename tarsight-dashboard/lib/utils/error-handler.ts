/**
 * 统一的错误处理工具
 */

export class ExecutionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ExecutionError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'NetworkError'
  }
}

/**
 * 睡眠函数（用于重试间隔）
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 带重试的异步函数执行器
 * @param fn 要执行的异步函数
 * @param options 重试选项
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    delay?: number
    backoff?: boolean
    onRetry?: (error: Error, attempt: number) => void
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = true,
    onRetry
  } = options

  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      // 最后一次尝试失败，不再重试
      if (attempt === maxRetries) {
        break
      }

      // 计算延迟时间（指数退避）
      const currentDelay = backoff ? delay * Math.pow(2, attempt) : delay

      // 调用回调
      if (onRetry) {
        onRetry(error, attempt + 1)
      }

      // 等待后重试
      await sleep(currentDelay)
    }
  }

  throw lastError!
}

/**
 * 安全地执行异步函数，捕获错误
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  defaultValue?: T
): Promise<{ data?: T; error?: Error }> {
  try {
    const data = await fn()
    return { data }
  } catch (error: any) {
    return { error: error instanceof Error ? error : new Error(String(error)) }
  }
}

/**
 * 格式化错误信息
 */
export function formatError(error: any): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  if (error?.message) {
    return error.message
  }
  return '未知错误'
}

/**
 * 记录错误到控制台（可扩展为发送到日志服务）
 */
export function logError(context: string, error: any, meta?: Record<string, any>) {
  const errorMessage = formatError(error)
  const errorDetails = {
    context,
    error: errorMessage,
    ...meta,
    timestamp: new Date().toISOString()
  }

  console.error(`[${context}]`, errorDetails)

  // TODO: 未来可以发送到 Sentry、LogRocket 等服务
  // if (typeof window !== 'undefined') {
  //   window.Sentry?.captureException(error, { context, ...meta })
  // }
}
