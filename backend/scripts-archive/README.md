# Backend Scripts Archive

此目录包含后端项目的所有工具脚本，按功能分类存放在不同子目录中。

## 📁 目录结构

```
scripts-archive/
├── setup/          # 一次性设置脚本
├── testing/        # 测试和验证脚本
├── migration/      # 数据迁移脚本
├── ops/            # 运维工具脚本
├── debug/          # 调试工具
└── archive/        # 历史归档脚本
```

## 📦 Setup (设置脚本)

初始化和配置项目的脚本。

| 脚本 | 说明 | 使用频率 |
|-----|------|---------|
| `setup_auth_and_rls.py` | 设置 Supabase Auth 和 RLS | 一次性 |
| `setup_global_configs_rls.py` | 设置全局配置 RLS | 一次性 |
| `setup_supabase.py` | Supabase 项目初始化 | 一次性 |
| `setup_test_cases_table.py` | 创建测试用例表 | 一次性 |
| `setup_user_account.py` | 创建用户账户 | 一次性 |

**使用示例**:
```bash
cd backend
python scripts-archive/setup/setup_supabase.py
```

## 🧪 Testing (测试脚本)

用于测试和验证的脚本。

| 脚本 | 说明 | 使用场景 |
|-----|------|---------|
| `test_supabase_connection.py` | 测试 Supabase 连接 | 连接问题排查 |
| `run_database_tests.py` | 运行数据库测试 | 数据库验证 |
| `run_tests_database.py` | 数据库集成测试 | 集成测试 |
| `quick_enhanced_report_database.py` | 快速生成数据库报告 | 报告生成 |

**使用示例**:
```bash
cd backend
python scripts-archive/testing/test_supabase_connection.py
```

## 🔄 Migration (迁移脚本)

数据迁移和转换脚本。

| 脚本 | 说明 | 使用场景 |
|-----|------|---------|
| `migrate_csv_to_database.py` | CSV 数据导入数据库 | 数据导入 |
| `archive/` | 历史迁移脚本 | 参考 |

**使用示例**:
```bash
cd backend
python scripts-archive/migration/migrate_csv_to_database.py
```

## 🔧 Ops (运维工具)

运维和日常管理脚本。

| 脚本 | 说明 | 使用场景 |
|-----|------|---------|
| `cleanup_reports.sh` | 清理测试报告 | 定期维护 |
| `generate_auth_rls_sql.sh` | 生成 Auth RLS SQL | 权限配置 |
| `update_supabase_config.py` | 更新 Supabase 配置 | 配置更新 |

**使用示例**:
```bash
cd backend
bash scripts-archive/ops/cleanup_reports.sh
```

## 🐛 Debug (调试工具)

调试和问题排查工具。

| 脚本 | 说明 | 使用场景 |
|-----|------|---------|
| `fix_stuck_executions.py` | 修复卡住的测试执行 | 生产故障 |
| `fix_stuck_executions_v2.py` | 修复工具 v2 | 生产故障 |
| `run_simple.py` | 简单测试执行 | 快速测试 |
| `test_env.py` | 测试环境配置 | 环境验证 |

**使用示例**:
```bash
cd backend
python scripts-archive/debug/fix_stuck_executions.py
```

## 📚 Archive (历史归档)

已废弃的旧版本脚本，保留用于参考。

## 🎯 与生产代码的区别

### 生产代码（backend 根目录）
- `execute_test.py` - 前端 API 调用
- `run.py` - CLI 执行入口
- `utils/` - 核心工具模块
- `testcases/` - 测试用例

### 工具脚本（此目录）
- 一次性设置
- 开发调试
- 运维管理
- 数据迁移

## ⚠️ 注意事项

1. **运行前检查**
   - 确保 `.env` 文件已配置
   - 检查 Python 环境（`uv sync` 或 `pip install`）
   - 验证 Supabase 连接

2. **备份优先**
   - 运行迁移脚本前备份数据
   - 在测试环境先验证
   - 准备回滚方案

3. **权限要求**
   - 某些脚本需要数据库管理员权限
   - 确保有足够的权限执行操作

## 🔗 相关文档

- [数据库迁移指南](../../docs/database-migrations-guide.md)
- [后端开发指南](../README.md)
- [故障排查文档](../../docs/troubleshooting.md)

---

**最后更新**: 2025-01-09
**维护者**: Tarsight Team
