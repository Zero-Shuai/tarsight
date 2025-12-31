# 重复执行记录问题 - 最终完整解决方案

## 问题完整分析

### 症状
用户点击一次执行按钮，却创建**两条**执行记录，且都卡在"running"状态。

### 根本原因（三个层面）

#### 1. 前端按钮防抖问题
- **问题**：确认对话框弹出时，按钮未禁用
- **现象**：用户可以在确认对话框期间快速多次点击
- **修复**：在显示确认对话框**之前**就设置`executing=true`

#### 2. 后端双重创建记录
- **问题1**：前端API创建执行记录（`total_tests=1`）
- **问题2**：run.py又创建执行记录（`total_tests=0`）
- **原因**：run.py没有接收到`EXECUTION_ID`环境变量
- **修复**：
  - 前端API通过`env.EXECUTION_ID`传递ID
  - run.py检查`EXECUTION_ID`，如果存在就复用

#### 3. 环境变量传递链断裂
- **问题**：`EXECUTION_ID`在Node.js→Python主进程→pytest子进程的传递链中丢失
- **修复**：在run.py中明确将`EXECUTION_ID`添加到pytest的`env`中

## 完整的解决方案

### 修改1：前端按钮防抖（test-case-actions.tsx）

```typescript
const handleExecute = async () => {
  // 1️⃣ 首先检查是否已在执行
  if (executing) {
    alert('测试正在执行中，请稍候...')
    return
  }

  // 2️⃣ 立即设置执行状态，禁用按钮
  setExecuting(true)
  setLoading(true)

  // 3️⃣ 延迟显示确认对话框，确保UI已更新
  await new Promise(resolve => setTimeout(resolve, 50))

  // 4️⃣ 显示确认对话框（此时按钮已禁用）
  if (!confirm('确定要执行这个测试用例吗？')) {
    // 用户取消，恢复状态
    setExecuting(false)
    setLoading(false)
    return
  }

  // 5️⃣ 执行API调用...
}
```

### 修改2：前端API传递EXECUTION_ID（route.ts）

```typescript
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

### 修改3：run.py传递EXECUTION_ID给pytest

```python
def run_tests_and_save_to_json(selected_modules, execution_name, case_ids=None):
    env = os.environ.copy()
    env['JSON_RECORDING'] = 'true'
    env['TARSIGHT_JSON_RESULTS_FILE'] = json_file
    env['EXECUTION_NAME'] = execution_name
    env['DATA_SOURCE'] = 'supabase'

    # ✅ 传递EXECUTION_ID给pytest进程
    execution_id = os.getenv("EXECUTION_ID")
    if execution_id:
        env['EXECUTION_ID'] = execution_id
        logger.info(f"✅ EXECUTION_ID已传递: {execution_id[:8]}...")

    # 运行pytest...
    result = subprocess.run(cmd, env=env, ...)
```

### 修改4：run.py复用执行记录

```python
def import_json_to_supabase(json_file_path, project_id, execution_name):
    # ✅ 检查是否有EXECUTION_ID
    execution_id = os.getenv("EXECUTION_ID")

    if execution_id:
        # 复用前端创建的记录
        logger.info(f"✅ 使用已创建的执行记录: {execution_id[:8]}...")
    else:
        # 手动执行模式，创建新记录
        execution_id = client.create_test_execution(project_id, execution_name)
        logger.info(f"✅ 创建执行记录: {execution_id[:8]}...")

    # 导入测试结果
    client.import_json_results(execution_id, json_file_path)
```

## 数据流图

### 正常流程（单次点击）

```
用户点击执行按钮
    ↓
[前端] 按钮立即禁用 (executing=true, loading=true)
    ↓
[前端] 50ms延迟后显示确认对话框
    ↓
[用户] 点击"确定"
    ↓
[前端API] 创建执行记录 → execution_id="abc-123"
    ↓
[前端API] 启动run.py，传递 EXECUTION_ID=abc-123
    ↓
[run.py] 检测到EXECUTION_ID
    ↓
[run.py] 传递EXECUTION_ID给pytest子进程
    ↓
[pytest] 执行测试，保存JSON
    ↓
[run.py] 导入JSON到execution_id="abc-123"
    ↓
[数据库] 只有1条执行记录 ✅
```

### 异常流程（多次点击）- 现已修复

```
用户快速多次点击执行按钮
    ↓
第1次点击: executing=true, 按钮禁用 ✅
第2次点击: 检测到executing=true，直接返回 ✅
第3次点击: 检测到executing=true，直接返回 ✅
    ↓
只创建1条执行记录 ✅
```

## 验证清单

### ✅ 前端验证
- [ ] 点击执行按钮，按钮立即显示加载动画
- [ ] 在确认对话框期间，按钮保持禁用状态
- [ ] 快速多次点击，后续点击被忽略

### ✅ 后端验证
- [ ] 日志显示"EXECUTION_ID已传递"
- [ ] 日志显示"使用已创建的执行记录"
- [ ] 数据库中只有1条执行记录

### ✅ 端到端验证
1. 刷新测试用例页面
2. 点击执行按钮
3. 查看执行历史页面
4. **预期结果**：只有1条执行记录，状态从"running"变为"completed"

## 常见问题排查

### Q: 还是看到两条记录？
**检查**：
1. 浏览器控制台是否有多个网络请求？
2. 前端日志是否显示"executing=true"？
3. run.py日志是否显示"EXECUTION_ID已传递"？

### Q: 记录一直是"running"状态？
**检查**：
1. 是否有run.py进程在运行？`ps aux | grep run.py`
2. 测试结果JSON文件是否生成？
3. run.py日志是否显示导入成功？

### Q: 手动执行run.py也创建了两条记录？
**检查**：
手动执行run.py时没有`EXECUTION_ID`，这是正常的，只会创建1条记录。如果创建了2条，说明有其他问题。

## 清理脚本

```bash
# 清理所有卡住的running记录
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
    print(f'已清理 {len(result[\"data\"])} 条记录')
"
```

## 总结

这个问题涉及**前端状态管理**、**跨进程通信**、**环境变量传递**等多个层面。最终的解决方案通过：

1. ✅ **前端早期状态设置** - 在确认对话框前就禁用按钮
2. ✅ **环境变量正确传递** - Node.js → Python主进程 → pytest子进程
3. ✅ **后端记录复用** - 检查EXECUTION_ID，避免重复创建

现在应该不会再出现重复执行记录的问题了！
