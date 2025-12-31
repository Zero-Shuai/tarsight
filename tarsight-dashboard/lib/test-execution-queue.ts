import { spawn } from 'child_process'

export interface QueueTask {
  executionId: string
  command: string
  resolve: () => void
  reject: (error: Error) => void
}

/**
 * 测试执行队列
 *
 * 功能:
 * - 控制并发执行数量 (默认最多2个)
 * - 队列管理,避免资源耗尽
 * - 使用 spawn 替代 exec,更轻量
 * - 执行超时控制 (默认10分钟)
 */
export class TestExecutionQueue {
  private running = 0
  private maxConcurrent: number
  private queue: QueueTask[] = []
  private timeoutMs: number

  constructor(maxConcurrent: number = 2, timeoutMinutes: number = 10) {
    this.maxConcurrent = maxConcurrent
    this.timeoutMs = timeoutMinutes * 60 * 1000
  }

  /**
   * 获取当前队列状态
   */
  getStatus() {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent
    }
  }

  /**
   * 添加任务到队列
   */
  async enqueue(executionId: string, command: string): Promise<void> {
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

      const child = spawn(command, {
        shell: true,
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
export const executionQueue = new TestExecutionQueue(2, 10)
