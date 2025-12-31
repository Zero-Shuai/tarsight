# Tarsight 快速参考指南

## 🚀 快速开始

### 环境配置

```bash
# 1. 配置前端环境
cd tarsight-dashboard
cp .env.example .env.local
# 编辑 .env.local 填入实际配置

# 2. 配置后端环境
cd supabase_version
cp .env.example .env
# 编辑 .env 填入实际配置

# 3. 启动前端
cd tarsight-dashboard
npm run dev

# 4. 访问应用
open http://localhost:3000
```

## 📁 项目结构速查

```
Tarsight/
├── tarsight-dashboard/          # 前端 (Next.js)
│   ├── app/                      # 页面和API
│   ├── components/               # React组件
│   │   ├── analytics/            # 统计组件
│   │   └── ui/                   # 基础UI组件
│   ├── lib/                      # 工具库
│   │   ├── types/                # 类型定义 ⭐
│   │   ├── utils/                # 工具函数 ⭐
│   │   └── supabase/             # Supabase客户端
│   └── .env.example              # 环境变量示例 ⭐
│
├── supabase_version/            # 后端 (Python)
│   ├── utils/                    # 工具模块
│   ├── testcases/                # 测试用例
│   ├── scripts/                  # 脚本 ⭐
│   │   ├── cleanup_reports.sh    # 清理报告
│   │   └── debug/                # 调试工具
│   ├── run.py                    # 主执行器
│   └── .env.example              # 环境变量示例 ⭐
│
└── docs/                        # 文档
    └── troubleshooting/          # 故障排查 ⭐
```

## 🔧 常用命令

### 前端

```bash
cd tarsight-dashboard

# 开发
npm run dev

# 构建
npm run build

# 启动生产
npm run start

# 代码检查
npm run lint
```

### 后端

```bash
cd supabase_version

# 执行所有测试
.venv/bin/python run.py --all

# 执行指定用例
.venv/bin/python run.py --case-ids="API001,API002"

# 执行单个模块
.venv/bin/python run.py --all  # 然后选择模块

# 清理旧报告（7天前）
./scripts/cleanup_reports.sh --keep-days 7

# 验证API Token
.venv/bin/python utils/token_validator.py
```

## 🎯 核心功能

### 1. 测试执行

**通过前端**:
1. 访问 http://localhost:3000/test-cases
2. 点击用例的"执行"按钮
3. 查看执行历史: http://localhost:3000/executions

**通过API**:
```typescript
fetch('/api/test/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    test_case_ids: ['test-case-id'],
    case_ids: ['API001'],
    mode: 'full'  // 或 'simple'
  })
})
```

### 2. 查看统计

访问 http://localhost:3000/analytics 查看：
- 总执行次数
- 平均通过率
- 测试用例数
- 执行趋势
- 模块分布

### 3. 清理报告

```bash
# 查看将要删除的文件（dry-run）
./scripts/cleanup_reports.sh --dry-run --keep-days 7

# 实际清理
./scripts/cleanup_reports.sh --keep-days 7
```

## 🔍 故障排查

### 执行卡住问题

查看: [docs/troubleshooting/INDEX.md](docs/troubleshooting/INDEX.md)

**快速检查**:
```bash
cd supabase_version

# 1. 检查是否有卡住的执行
PYTHONPATH=. .venv/bin/python -c "
from utils.supabase_client import get_supabase_client
from utils.env_config import get_env_config

env_config = get_env_config()
client = get_supabase_client(access_token=env_config.supabase_service_role_key)

result = client._make_request('GET', 'test_executions', params={'status': 'eq.running'})
print(f'Running executions: {len(result.get(\"data\", []))}')
"

# 2. 检查环境变量
.venv/bin/python scripts/debug/test_env.py
```

### API Token 过期

症状: 测试失败，错误信息 "User session has expired"

**解决**:
```bash
# 1. 更新 .env 中的 API_TOKEN
# 2. 验证 token
.venv/bin/python utils/token_validator.py
```

## 📊 环境变量速查

### 前端 (.env.local)

```bash
# Python 环境
PROJECT_ROOT=/path/to/supabase_version
PYTHON_PATH=/path/to/.venv/bin/python

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_PROJECT_ID=...
```

### 后端 (.env)

```bash
# Supabase
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# API
BASE_URL=https://t-stream-iq.tarsv.com
API_TOKEN=...

# 数据源
DATA_SOURCE=supabase
```

## 🛠️ 开发工具

### 类型检查

```typescript
import type { TestCase, TestExecution } from '@/lib/types/database'

// 使用类型
const testCase: TestCase = {
  id: 'xxx',
  case_id: 'API001',
  test_name: '测试名称',
  // ... 自动补全所有字段
}
```

### 错误处理

```typescript
import { retryAsync, logError } from '@/lib/utils/error-handler'

// 带重试的执行
await retryAsync(
  async () => await fetchData(),
  { maxRetries: 3, delay: 1000, backoff: true }
)

// 记录错误
logError('DataContext', error, { userId: 'xxx' })
```

### 日志

```typescript
import { logger, info, error } from '@/lib/utils/logger'

// 使用日志
logger.info('操作成功', 'UserAction', { action: 'login' })
error('操作失败', 'UserAction', { error: 'Invalid credentials' })
```

## 📚 重要文档

- **[ARCHITECTURE_REVIEW.md](ARCHITECTURE_REVIEW.md)** - 架构分析
- **[ARCHITECTURE_OPTIMIZATION_COMPLETE.md](ARCHITECTURE_OPTIMIZATION_COMPLETE.md)** - 高优先级优化报告
- **[FINAL_OPTIMIZATION_COMPLETE.md](FINAL_OPTIMIZATION_COMPLETE.md)** - 全面优化报告
- **[docs/troubleshooting/INDEX.md](docs/troubleshooting/INDEX.md)** - 故障排查索引

## 🎉 项目特点

- ✅ 完整的 TypeScript 类型支持
- ✅ 统一的错误处理和重试机制
- ✅ 清晰的代码组织结构
- ✅ 完善的文档和示例
- ✅ 灵活的环境配置
- ✅ 自动化报告清理
- ✅ 模块化的组件设计

**项目评分**: ⭐⭐⭐⭐⭐ (4.8/5.0)
