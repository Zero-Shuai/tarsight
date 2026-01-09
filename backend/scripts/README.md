# Scripts 目录说明

> ⚠️ **注意**: 此目录下的脚本已全部移至 `scripts-archive/` 目录

## 新位置

👉 **所有脚本**: [`backend/scripts-archive/`](../scripts-archive/)

## 分类

### 📦 Setup 脚本
[`scripts-archive/setup/`](../scripts-archive/setup/)
- `setup_auth_and_rls.py` - Auth 和 RLS 设置
- `setup_global_configs_rls.py` - 全局配置 RLS
- `setup_supabase.py` - Supabase 初始化
- `setup_test_cases_table.py` - 测试用例表设置
- `setup_user_account.py` - 用户账户设置

### 🧪 测试脚本
[`scripts-archive/testing/`](../scripts-archive/testing/)
- `test_supabase_connection.py` - 连接测试
- `run_database_tests.py` - 数据库测试
- `run_tests_database.py` - 测试执行
- `quick_enhanced_report_database.py` - 报告生成

### 🔄 迁移脚本
[`scripts-archive/migration/`](../scripts-archive/migration/)
- `migrate_csv_to_database.py` - CSV 到数据库迁移
- `archive/` - 历史迁移脚本

### 🔧 运维工具
[`scripts-archive/ops/`](../scripts-archive/ops/)
- `cleanup_reports.sh` - 报告清理
- `generate_auth_rls_sql.sh` - RLS SQL 生成
- `update_supabase_config.py` - 配置更新

### 🐛 调试工具
[`scripts-archive/debug/`](../scripts-archive/debug/)
- `fix_stuck_executions.py` - 修复卡住的执行
- `fix_stuck_executions_v2.py` - 修复工具 v2
- `run_simple.py` - 简单执行
- `test_env.py` - 环境测试

## 为什么移动？

1. **简化结构** - 生产代码不需要这些脚本
2. **清晰职责** - 核心功能和工具分离
3. **易于维护** - 减少目录混乱

## 如何使用？

```bash
# 使用归档的脚本
cd backend/scripts-archive
python setup/setup_supabase.py

# 或从 backend 根目录
python scripts-archive/setup/setup_supabase.py
```

## 前端实际使用

前端通过 API 调用 `backend/execute_test.py`，不使用 scripts 目录下的任何脚本。

---

**最后更新**: 2025-01-09
**状态**: ⚠️ 已移至 scripts-archive
