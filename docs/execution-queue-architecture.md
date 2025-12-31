# 测试执行优化方案

## 方案对比

### 方案 1: 消息队列 + Worker Pool（推荐）⭐⭐⭐⭐⭐

**优点**:
- 可控并发数
- 支持排队和优先级
- 失败重试机制
- 执行状态可追踪
- 适合生产环境

**实现**:
```typescript
// 使用 Bull/BullMQ 或 PostgreSQL 作为队列
interface TestJob {
  executionId: string
  testCaseIds: string[]
  priority: number
  createdAt: Date
}

// Worker 进程处理队列
// 支持 2-3 个并发 worker
```

**适合**: 生产环境、大量测试用例

---

### 方案 2: Supabase Edge Functions ⭐⭐⭐⭐

**优点**:
- 无服务器架构
- 自动扩展
- 成本低（按使用付费）
- 与 Supabase 深度集成

**实现**:
```typescript
// /supabase/functions/execute-tests/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { testCaseIds } = await req.json()

  // 执行测试逻辑
  // 可以调用 Docker 容器或直接运行 pytest

  return Response.json({ success: true })
})
```

**适合**: 中小规模、不常执行

---

### 方案 3: 改进当前实现（短期方案）⭐⭐⭐

**优化点**:
1. 使用 `spawn` 替代 `exec`（更轻量）
2. 添加执行队列控制并发数
3. 实时推送到客户端（Server-Sent Events）
4. 添加取消执行功能

**实现**:

```typescript
// 队列管理器
class ExecutionQueue {
  private queue: Array<() => Promise<void>> = []
  private running = 0
  private maxConcurrent = 2  // 最多2个并发

  async add(fn: () => Promise<void>) {
    this.queue.push(fn)
    this.process()
  }

  async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    this.running++
    const task = this.queue.shift()!

    try {
      await task()
    } finally {
      this.running--
      this.process()  // 处理下一个
    }
  }
}

const queue = new ExecutionQueue()

// API 中使用
queue.add(async () => {
  await executeTestAsync(command, executionId)
})
```

**适合**: 快速优化、不改变架构

---

### 方案 4: Docker + Job Queue ⭐⭐⭐⭐

**优点**:
- 完全隔离的执行环境
- 可以限制资源（CPU/内存）
- 易于扩展和监控

**实现**:
```yaml
# docker-compose.yml
services:
  test-runner:
    image: tarsight/executor
    deploy:
      replicas: 2  # 2个worker
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
```

**适合**: 已有 Docker 部署、需要资源隔离

---

## 推荐实施步骤

### 阶段 1: 立即改进（1天）
- ✅ 改用 `spawn` 替代 `exec`
- ✅ 添加并发限制
- ✅ 添加执行超时控制

### 阶段 2: 中期优化（1周）
- 实现执行队列
- 添加 SSE 实时推送
- 支持取消执行

### 阶段 3: 长期方案（1个月）
- 迁移到 Supabase Edge Functions
- 或实现完整的消息队列

---

## 性能对比

| 方案 | 并发控制 | 资源占用 | 实现难度 | 扩展性 |
|------|---------|---------|---------|-------|
| 当前实现 | ❌ 无 | 🔴 高 | 🟢 低 | ❌ 差 |
| 改进方案3 | ✅ 有 | 🟡 中 | 🟢 低 | 🟡 中 |
| Edge Functions | ✅ 自动 | 🟢 低 | 🟡 中 | 🟢 好 |
| 消息队列 | ✅ 强 | 🟢 低 | 🔴 高 | 🟢 优 |
| Docker Pool | ✅ 有 | 🟡 中 | 🟡 中 | 🟢 好 |

---

## 快速实现：改进当前方案

```typescript
// lib/test-execution-queue.ts
import { spawn } from 'child_process'

export class TestExecutionQueue {
  private running = 0
  private maxConcurrent = 2
  private queue: Array<{
    executionId: string
    command: string
    resolve: () => void
    reject: (error: Error) => void
  }> = []

  async enqueue(executionId: string, command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push({ executionId, command, resolve, reject })
      this.process()
    })
  }

  private async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    const task = this.queue.shift()!
    this.running++

    try {
      await this.execute(task.command, task.executionId)
      task.resolve()
    } catch (error) {
      task.reject(error as Error)
    } finally {
      this.running--
      this.process()
    }
  }

  private async execute(command: string, executionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, {
        shell: true,
        env: { ...process.env, EXECUTION_ID: executionId }
      })

      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`执行失败，退出码: ${code}`))
        }
      })

      // 10分钟超时
      setTimeout(() => {
        child.kill()
        reject(new Error('执行超时'))
      }, 10 * 60 * 1000)
    })
  }
}

// 单例模式
export const executionQueue = new TestExecutionQueue()
```

**使用**:
```typescript
// API 中
await executionQueue.enqueue(executionId, command)
```

---

## 总结

**短期**: 实现方案3（改进当前实现）
**中期**: 考虑方案2（Edge Functions）
**长期**: 方案1（完整消息队列）或方案4（Docker Pool）

当前最紧急的是添加**并发控制**，防止系统资源耗尽。
