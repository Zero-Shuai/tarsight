# 修复重复执行记录问题 - 最终解决方案

## 问题的真正根源

经过深入分析，发现问题的根本原因是：

### 双重创建执行记录

1. **前端API创建记录** (app/api/test/execute/route.ts)
   ```typescript
   const { data: execution } = await supabase
     .from('test_executions')
     .insert({ ... })  // 第一次创建
   ```

2. **run.py再次创建记录** (run.py:import_json_to_supabase)
   ```python
   execution_id = client.create_test_execution(project_id, execution_name)
   # 第二次创建！
   ```

结果：每次前端执行测试都会创建**两条**执行记录。

## 解决方案

### 核心思路：前端API创建执行记录，run.py复用它

### 实现细节

#### 1. 前端API传递EXECUTION_ID

```typescript
// app/api/test/execute/route.ts
execAsync(command, {
  env: {
    ...process.env,
    PYTHONPATH: '/Users/zhangshuai/WorkSpace/Tarsight/supabase_version',
    NODE_ENV: process.env.NODE_ENV,
    EXECUTION_ID: execution.id  // ✅ 传递执行ID
  },
  timeout: 300000
})
```

#### 2. run.py检查并使用EXECUTION_ID

```python
# run.py:import_json_to_supabase
execution_id = os.getenv("EXECUTION_ID")

if execution_id:
    logger.info(f"✅ 使用已创建的执行记录: {execution_id[:8]}...")
else:
    # 只有在没有EXECUTION_ID时才创建（手动执行模式）
    execution_id = client.create_test_execution(project_id, execution_name)
    logger.info(f"✅ 创建执行记录: {execution_id[:8]}...")
```

### 工作流程

#### 场景1：前端API调用（自动化执行）
1. 前端API创建执行记录 → `execution_id = "abc-123"`
2. 通过环境变量传递给run.py → `EXECUTION_ID=abc-123`
3. run.py检测到EXECUTION_ID，复用它 → **不创建新记录**
4. 结果：**只有1条执行记录** ✅

#### 场景2：手动执行run.py（本地执行）
1. 用户直接运行：`python run.py --all`
2. 没有EXECUTION_ID环境变量
3. run.py创建新的执行记录
4. 结果：**正常工作** ✅

## 修改的文件

### 1. app/api/test/execute/route.ts
- [x] 添加 `EXECUTION_ID` 到环境变量

### 2. run.py
- [x] 在 `import_json_to_supabase` 函数中检查 `EXECUTION_ID`
- [x] 如果存在则使用，不存在则创建

### 3. test-case-actions.tsx（已完成）
- [x] 前端按钮防抖保护
- [x] 执行状态锁
- [x] 加载动画

## 清理历史记录

```bash
# 清理所有卡住的running状态记录
PYTHONPATH=. .venv/bin/python -c "
from utils.supabase_client import get_supabase_client
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
client = get_supabase_client(access_token=service_key)

result = client._make_request('GET', 'test_executions', params={'status': 'eq.running'})

if result.get('data'):
    for exec in result['data']:
        client._make_request(
            'PATCH',
            'test_executions',
            data={'status': 'failed', 'completed_at': datetime.now().isoformat()},
            params={'id': f'eq.{exec[\"id\"]}'}
        )
"
```

## 验证测试

### 测试1：单次执行
1. 刷新测试用例页面
2. 点击单个用例的执行按钮
3. **预期结果**：只创建1条执行记录 ✅

### 测试2：快速多次点击
1. 快速多次点击同一用例的执行按钮
2. **预期结果**：
   - 第一次点击执行成功
   - 后续点击提示"测试正在执行中"
   - 只创建1条执行记录 ✅

### 测试3：执行不同用例
1. 点击用例A的执行按钮
2. 等待完成后，点击用例B的执行按钮
3. **预期结果**：每个用例创建1条记录 ✅

### 测试4：手动执行run.py
```bash
python run.py --all
```
**预期结果**：创建1条执行记录 ✅

## 技术要点

### 环境变量传递
- Node.js的`execAsync`可以通过`env`选项传递环境变量
- Python通过`os.getenv()`读取环境变量
- 这是跨进程通信的简单有效方式

### 执行记录的生命周期
1. **创建**：前端API创建，状态为`running`
2. **执行**：run.py执行测试，保存到JSON
3. **导入**：run.py导入JSON结果，更新状态为`completed`/`failed`
4. **复用**：通过EXECUTION_ID确保复用同一记录

### 为什么不在前端API中直接导入？
- 测试执行是**异步的长任务**（可能需要几分钟）
- 前端API应该**快速响应**，不能等待测试完成
- 使用后台进程执行测试，避免阻塞HTTP请求

## 常见问题

### Q: 为什么不在数据库中添加唯一约束？
A: 因为允许同时执行多个不同的测试用例，只需要防止**同一用例**的重复提交。

### Q: 如果run.py崩溃会怎样？
A: 执行记录会一直保持`running`状态。需要定期清理或添加监控。

### Q: EXECUTION_ID会被用户看到吗？
A: 不会。这是内部实现细节，用户只会看到正常的执行记录。

## 未来改进

1. **添加执行锁**：在数据库层面使用SELECT ... FOR UPDATE
2. **心跳机制**：测试进程定期更新心跳，超时自动标记为失败
3. **WebSocket推送**：实时推送测试执行进度
4. **执行队列**：支持排队执行多个测试任务
