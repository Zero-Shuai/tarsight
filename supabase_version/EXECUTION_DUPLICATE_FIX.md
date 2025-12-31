# 修复执行记录重复创建问题

## 问题现象
用户点击执行按钮后，出现两条或多条"测试中"状态的执行记录。

## 根本原因

1. **前端按钮无防抖保护**
   - 用户可能快速多次点击执行按钮
   - 每次点击都会发送独立的后端请求

2. **执行记录卡住**
   - 之前的 token 验证问题导致进程卡住
   - 状态一直保持 "running"，无法自动完成

## 解决方案

### 1. 前端防护（主要方案）

#### 添加执行状态锁
```typescript
const [executing, setExecuting] = useState(false)

const handleExecute = async () => {
  // 如果正在执行，直接返回
  if (executing) {
    alert('测试正在执行中，请稍候...')
    return
  }

  setExecuting(true)
  setLoading(true)

  try {
    // 执行逻辑...
  } catch (error) {
    // 失败时重置状态
    setLoading(false)
    setExecuting(false)
  }
}
```

#### 视觉反馈
- 执行时按钮显示加载动画
- 按钮在执行期间被禁用 (`disabled={loading}`)
- 更新 tooltip 提示用户当前状态

#### 延迟页面跳转
```typescript
setTimeout(() => {
  window.location.href = '/executions'
}, 500)
```
给用户500ms时间看到成功提示。

### 2. 清理历史卡住记录

使用修复脚本清理卡住的执行记录：
```bash
PYTHONPATH=. .venv/bin/python fix_stuck_executions_v2.py
```

### 3. Token 验证问题修复（已完成）

添加 `--skip-token-check` 参数，避免自动化执行时的交互式验证卡住。

## 实施的更改

### 文件：test-case-actions.tsx
- [x] 添加 `executing` 状态追踪
- [x] 在 `handleExecute` 开始时检查执行状态
- [x] 执行前设置 `executing=true`
- [x] 失败时重置 `executing=false`
- [x] 按钮显示加载动画
- [x] 延迟页面跳转（500ms）

### 文件：app/api/test/execute/route.ts
- [x] 添加 `--skip-token-check` 到执行命令
- [x] 移除服务端防重复检查（前端已保护）

## 测试验证

1. **正常执行测试**
   - 点击执行按钮
   - 按钮应显示加载动画
   - 500ms后跳转到执行历史页面
   - 只有一条执行记录

2. **快速多次点击测试**
   - 快速连续点击执行按钮多次
   - 第一次点击后，后续点击应提示"测试正在执行中"
   - 只创建一条执行记录

3. **执行失败测试**
   - 模拟网络错误或API错误
   - 按钮应恢复可点击状态
   - `executing` 状态应重置

## 注意事项

1. **执行状态隔离**
   - `executing` 状态是每个测试用例独立的
   - 不同测试用例的执行按钮互不影响

2. **页面刷新后状态重置**
   - 如果用户刷新页面，`executing` 状态会重置
   - 这是预期行为，因为状态是组件级别的

3. **异步执行特性**
   - 前端API立即返回，测试在后台执行
   - 执行记录会先显示"running"，然后更新为"completed"或"failed"

## 未来改进建议

1. **全局执行状态管理**
   - 使用 Context 或 Zustand 管理全局执行状态
   - 在整个应用中共享执行状态

2. **WebSocket 实时更新**
   - 使用 WebSocket 推送执行状态更新
   - 用户可以实时看到测试执行进度

3. **执行队列**
   - 如果用户快速点击多次，可以创建队列
   - 按顺序执行而不是拒绝后续请求

4. **数据库约束**
   - 在数据库层面添加唯一约束
   - 防止同时创建多条执行记录
