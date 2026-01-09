# Tarsight Backend - Python 测试执行引擎

专注于 Supabase 数据库集成的 API 测试框架，支持测试结果持久化存储和云端数据分析。

## 🚀 快速开始

### 基本使用

```bash
# 前端 API 调用（生产模式）
# 通过前端 Web 界面执行测试

# CLI 模式（开发/调试）
python run.py

# 指定测试执行名称
python run.py --name "登录模块测试"

# 详细输出模式
python run.py --verbose
```

### 工具脚本

所有工具脚本已移至 `scripts-archive/` 目录：

```bash
# 测试 Supabase 连接
python scripts-archive/testing/test_supabase_connection.py

# 生成测试报告
python scripts-archive/testing/quick_enhanced_report_database.py

# 设置 Supabase 数据库
python scripts-archive/setup/setup_supabase.py

# 清理测试报告
bash scripts-archive/ops/cleanup_reports.sh
```

详见：[Scripts Archive 文档](scripts-archive/README.md)

## 📁 项目结构

```
backend/
├── 🚀 execute_test.py            # 前端 API 调用入口（生产）
├── 🎯 run.py                     # CLI 执行入口（开发）
├── ⚙️ config.py                  # 配置管理
├── 📦 pyproject.toml             # Python 项目配置
│
├── 🧪 testcases/                 # 测试用例
│   ├── test_tarsight.py          # 测试实现
│   └── table_test_data.py        # 测试数据
│
├── 🔧 utils/                     # 核心工具模块
│   ├── supabase_client.py        # Supabase 客户端
│   ├── json_test_recorder.py     # JSON 记录器
│   ├── file_test_recorder.py     # 文件记录器
│   ├── env_config.py             # 环境配置
│   ├── request_util.py           # HTTP 工具
│   ├── assertion_engine.py       # 断言引擎
│   ├── token_validator.py        # Token 验证
│   ├── conftest.py               # Pytest fixtures
│   └── test_tarsight.py          # Pytest 配置
│
├── 🗄️ database/                  # 数据库相关
│   ├── schema/                   # 数据库架构参考
│   ├── archive/                  # 历史架构
│   └── migrations/               # ⚠️ 已废弃，使用 supabase/migrations/
│
├── 📚 docs/                      # 后端文档
├── 📦 archive/                   # 归档代码
├── 📊 reports/                   # 测试报告
│
├── 🛠️ scripts/                   # （已移至 scripts-archive/）
└── 🗃️ scripts-archive/           # 工具脚本归档
    ├── setup/                    # 设置脚本
    ├── testing/                  # 测试脚本
    ├── migration/                # 迁移脚本
    ├── ops/                      # 运维工具
    └── debug/                    # 调试工具
```

## 🔧 环境配置

### 环境变量

在 `.env` 文件中配置：

```bash
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API 配置
BASE_URL=https://your-api-endpoint.com
API_TOKEN=Bearer YOUR_API_TOKEN

# 数据源配置
DATA_SOURCE=supabase

# 日志配置
LOG_LEVEL=INFO
JSON_RECORDING=true
```

### Python 依赖

```bash
# 使用 uv（推荐）
uv sync

# 或使用 pip
pip install -r requirements.txt
```

## 📊 核心功能

### 1. 测试执行

**前端 API 模式**（生产）:
- 前端通过 `execute_test.py` 执行测试
- 支持异步队列执行
- 实时状态更新

**CLI 模式**（开发）:
```bash
python run.py
```

### 2. 结果存储

- **执行记录**: 每次测试运行的完整记录
- **结果详情**: 测试用例的详细结果
- **API 请求**: 完整的请求响应数据

### 3. 断言系统

- JSONPath 表达式支持
- JSON Schema 验证
- 自定义断言规则

详见：[断言系统文档](../docs/assertions-guide.md)

## 🔗 与前端集成

### API 端点

前端通过以下 API 端点调用后端：

```
POST /api/test/execute
```

### 执行流程

1. 前端创建执行记录（Supabase）
2. 前端调用 `execute_test.py`（spawn 子进程）
3. Python 从 Supabase 读取测试用例
4. 执行 API 测试
5. 结果写回 Supabase
6. 前端轮询获取状态

### 环境变量

前端容器需要配置：

```yaml
PROJECT_ROOT=/app/backend
PYTHON_PATH=/usr/bin/python3
PYTHONPATH=/app/backend
```

## 📚 文档

- [数据库迁移指南](../docs/database-migrations-guide.md)
- [断言系统指南](../docs/assertions-guide.md)
- [故障排查文档](../docs/troubleshooting.md)
- [Scripts Archive](scripts-archive/README.md)

## 🛠️ 开发指南

### 添加新测试用例

1. 在 Supabase 中创建测试用例记录
2. 前端自动加载用例配置
3. 后端 `test_tarsight.py` 执行测试

### 添加新工具脚本

工具脚本应放在 `scripts-archive/` 下对应分类目录：
- `setup/` - 一次性设置脚本
- `testing/` - 测试验证脚本
- `migration/` - 数据迁移脚本
- `ops/` - 运维工具
- `debug/` - 调试工具

### 修改核心功能

核心功能文件：
- `execute_test.py` - 执行逻辑
- `utils/supabase_client.py` - 数据库操作
- `utils/assertion_engine.py` - 断言处理

## ⚠️ 重要说明

### 数据库迁移

**不再使用** `backend/database/migrations/`，所有迁移已统一到：

```
supabase/migrations/
```

详见：[数据库迁移指南](../docs/database-migrations-guide.md)

### Scripts 目录

`backend/scripts/` 已移至 `backend/scripts-archive/`，详见：
[Scripts Archive README](scripts-archive/README.md)

## 🐛 故障排查

### 连接问题

```bash
# 测试 Supabase 连接
python scripts-archive/testing/test_supabase_connection.py
```

### 执行卡住

```bash
# 修复卡住的执行
python scripts-archive/debug/fix_stuck_executions.py
```

### 环境问题

```bash
# 测试环境配置
python scripts-archive/debug/test_env.py
```

更多故障排查：[docs/troubleshooting.md](../docs/troubleshooting.md)

## 📞 获取帮助

- 查看文档：[docs/](../docs/)
- 后端文档：[backend/docs/](docs/)
- 工具脚本：[scripts-archive/](scripts-archive/)

---

**Tarsight Backend** - 让 API 测试更简单！ 🚀
