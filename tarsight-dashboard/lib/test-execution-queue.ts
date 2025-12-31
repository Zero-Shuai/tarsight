import { spawn } from 'child_process'
import { createClient } from '@/lib/supabase/server'

export interface QueueTask {
  executionId: string
  command: string
  resolve: () => void
  reject: (error: Error) => void
}

export interface QueueConfig {
  maxConcurrent: number
  timeoutMinutes: number
  enabled: boolean
}

/**
 * 从 Supabase 加载队列配置
 */
async function loadQueueConfig(): Promise<QueueConfig> {
  try {
    const supabase = await createClient()
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

    const { data: configs } = await supabase
      .from('queue_config')
      .select('key, value')
      .eq('project_id', projectId)

    if (!configs) {
      console.warn('未找到队列配置，使用默认值')
      return {
        maxConcurrent: 2,
        timeoutMinutes: 10,
        enabled: true
      }
    }

    const configMap = Object.fromEntries(
      configs.map(c => [c.key, c.value])
    )

    return {
      maxConcurrent: parseInt(configMap.max_concurrent || '2'),
      timeoutMinutes: parseInt(configMap.timeout_minutes || '10'),
      enabled: configMap.queue_enabled === 'true'
    }
  } catch (error) {
    console.error('加载队列配置失败，使用默认值:', error)
    return {
      maxConcurrent: 2,
      timeoutMinutes: 10,
      enabled: true
    }
  }
}

/**
 * 测试执行队列
 *
 * 功能:
 * - 从 Supabase 读取配置
 * - 控制并发执行数量
 * - 队列管理,避免资源耗尽
 * - 使用 spawn 替代 exec,更轻量
 * - 执行超时控制
 */
export class TestExecutionQueue {
  private running = 0
  private maxConcurrent: number
  private queue: QueueTask[] = []
  private timeoutMs: number
  private enabled: boolean
  private configLoaded: boolean = false
  private configPromise: Promise<void> | null = null

  constructor() {
    // 先使用默认值初始化
    this.maxConcurrent = 2
    this.timeoutMs = 10 * 60 * 1000
    this.enabled = true
    this.configPromise = null
  }

  /**
   * 从 Supabase 加载配置
   */
  private async loadConfig() {
    const config = await loadQueueConfig()
    this.maxConcurrent = config.maxConcurrent
    this.timeoutMs = config.timeoutMinutes * 60 * 1000
    this.enabled = config.enabled
    this.configLoaded = true

    console.log('队列配置已加载:', {
      maxConcurrent: this.maxConcurrent,
      timeoutMinutes: config.timeoutMinutes,
      enabled: this.enabled
    })
  }

  /**
   * 确保配置已加载（懒加载）
   */
  private async ensureConfigLoaded() {
    if (!this.configPromise && !this.configLoaded) {
      this.configPromise = this.loadConfig().finally(() => {
        this.configPromise = null
      })
    }
    if (this.configPromise) {
      await this.configPromise
    }
  }

  /**
   * 重新加载配置（用于配置更新后）
   */
  async reloadConfig() {
    await this.loadConfig()
  }

  /**
   * 获取当前队列状态
   */
  getStatus() {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      enabled: this.enabled,
      configLoaded: this.configLoaded
    }
  }

  /**
   * 添加任务到队列
   */
  async enqueue(command: string, executionId: string): Promise<void> {
    // 确保配置已加载
    await this.ensureConfigLoaded()

    // 如果队列被禁用，直接执行
    if (!this.enabled) {
      return this.execute(command, executionId)
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ executionId, command, resolve, reject })
      this.process()
    })
  }

  /**
   * 处理队列中的任务
   */
  private async process() {
    // 如果已达到最大并发数或队列为空,则等待
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    // 取出下一个任务
    const task = this.queue.shift()!
    this.running++

    try {
      await this.execute(task.command, task.executionId)
      task.resolve()
    } catch (error) {
      task.reject(error as Error)
    } finally {
      this.running--
      // 处理下一个任务
      this.process()
    }
  }

  /**
   * 执行单个测试任务
   */
  private async execute(command: string, executionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`[${new Date().toISOString()}] 开始执行测试: ${executionId}`)
      console.log(`[${new Date().toISOString()}] 执行命令: ${command}`)

      const child = spawn('/bin/bash', ['-c', command], {
        env: { ...process.env, EXECUTION_ID: executionId }
      })

      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => {
        const output = data.toString()
        stdout += output
        // 可选: 实时输出日志
        // console.log(`[${executionId}] ${output}`)
      })

      child.stderr?.on('data', (data) => {
        const output = data.toString()
        stderr += output
        console.error(`[${executionId}] Error: ${output}`)
      })

      child.on('close', (code) => {
        console.log(`[${new Date().toISOString()}] 测试执行完成: ${executionId}, 退出码: ${code}`)

        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`执行失败,退出码: ${code}\n${stderr}`))
        }
      })

      child.on('error', (error) => {
        console.error(`[${executionId}] 执行错误:`, error)
        reject(error)
      })

      // 设置超时
      const timeout = setTimeout(() => {
        console.error(`[${executionId}] 执行超时 (${this.timeoutMs}ms), 正在终止...`)
        child.kill('SIGTERM')

        // 如果5秒后还没终止,强制杀死
        setTimeout(() => {
          if (child.pid) {
            child.kill('SIGKILL')
          }
        }, 5000)

        reject(new Error(`执行超时 (${this.timeoutMs}ms)`))
      }, this.timeoutMs)

      // 清理定时器
      child.on('close', () => {
        clearTimeout(timeout)
      })
    })
  }
}

// 单例模式
export const executionQueue = new TestExecutionQueue()
