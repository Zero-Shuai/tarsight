/**
 * 统一的日志系统
 * 支持不同级别的日志输出，便于调试和监控
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  level: LogLevel
  message: string
  context?: string
  data?: Record<string, any>
  timestamp: string
}

class Logger {
  private minLevel: LogLevel
  private enableConsole: boolean

  constructor(
    minLevel: LogLevel = LogLevel.INFO,
    enableConsole: boolean = true
  ) {
    this.minLevel = minLevel
    this.enableConsole = enableConsole
  }

  /**
   * 格式化日志条目
   */
  private formatLog(entry: LogEntry): string {
    const levelStr = LogLevel[entry.level]
    const contextStr = entry.context ? `[${entry.context}]` : ''
    const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : ''
    return `[${entry.timestamp}] ${levelStr} ${contextStr} ${entry.message}${dataStr}`
  }

  /**
   * 输出日志
   */
  private log(entry: LogEntry) {
    if (entry.level < this.minLevel) {
      return
    }

    entry.timestamp = new Date().toISOString()

    if (this.enableConsole) {
      const message = this.formatLog(entry)

      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(message)
          break
        case LogLevel.INFO:
          console.log(message)
          break
        case LogLevel.WARN:
          console.warn(message)
          break
        case LogLevel.ERROR:
          console.error(message)
          break
      }
    }

    // TODO: 未来可以发送到日志服务
    // this.sendToLogService(entry)
  }

  debug(message: string, context?: string, data?: Record<string, any>) {
    this.log({ level: LogLevel.DEBUG, message, context, data, timestamp: new Date().toISOString() })
  }

  info(message: string, context?: string, data?: Record<string, any>) {
    this.log({ level: LogLevel.INFO, message, context, data, timestamp: new Date().toISOString() })
  }

  warn(message: string, context?: string, data?: Record<string, any>) {
    this.log({ level: LogLevel.WARN, message, context, data, timestamp: new Date().toISOString() })
  }

  error(message: string, context?: string, data?: Record<string, any>) {
    this.log({ level: LogLevel.ERROR, message, context, data, timestamp: new Date().toISOString() })
  }

  /**
   * 设置最小日志级别
   */
  setMinLevel(level: LogLevel) {
    this.minLevel = level
  }

  /**
   * 启用/禁用控制台输出
   */
  setConsoleEnabled(enabled: boolean) {
    this.enableConsole = enabled
  }
}

// 创建全局 logger 实例
const logLevelFromEnv = (): LogLevel => {
  const level = process.env.LOG_LEVEL?.toUpperCase()
  switch (level) {
    case 'DEBUG':
      return LogLevel.DEBUG
    case 'INFO':
      return LogLevel.INFO
    case 'WARN':
      return LogLevel.WARN
    case 'ERROR':
      return LogLevel.ERROR
    default:
      return LogLevel.INFO
  }
}

export const logger = new Logger(logLevelFromEnv(), true)

// 便捷的日志函数导出
export const debug = (message: string, context?: string, data?: Record<string, any>) =>
  logger.debug(message, context, data)

export const info = (message: string, context?: string, data?: Record<string, any>) =>
  logger.info(message, context, data)

export const warn = (message: string, context?: string, data?: Record<string, any>) =>
  logger.warn(message, context, data)

export const error = (message: string, context?: string, data?: Record<string, any>) =>
  logger.error(message, context, data)
