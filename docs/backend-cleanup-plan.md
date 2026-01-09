# Backend 目录精简计划

## 📊 当前状态

```
backend/
├── execute_test.py          ✅ 前端调用 - 必需
├── run.py                   ✅ CLI 模式 - 保留
├── config.py                ✅ 配置 - 必需
├── pyproject.toml           ✅ 项目配置 - 必需
├── utils/                   ✅ 工具模块 - 必需
│   ├── supabase_client.py
│   ├── json_test_recorder.py
│   ├── file_test_recorder.py
│   ├── env_config.py
│   ├── token_validator.py
│   ├── request_util.py
│   ├── test_tarsight.py
│   ├── conftest.py
│   └── assertion_engine.py
├── testcases/               ✅ 测试用例 - 必需
│   ├── test_tarsight.py
│   └── table_test_data.py
├── scripts/                 ⚠️ 需要清理
│   ├── debug/              → scripts-archive/debug/
│   ├── archive/            → scripts-archive/（已归档）
│   ├── setup_*.py          → scripts-archive/setup/
│   ├── test_*.py           → scripts-archive/testing/
│   └── cleanup_reports.sh  → scripts-archive/ops/
├── database/                ⚠️ 需要清理
│   ├── migrations/         ✅ 已移至 supabase/migrations（保留废弃标记）
│   ├── schema/             ✅ 保留（参考用）
│   └── archive/            ✅ 保留（历史）
├── docs/                    ✅ 保留（文档）
├── archive/                 ✅ 保留（已归档代码）
└── reports/                 ✅ 保留（测试报告）
```

## 🎯 精简目标

### 1. 创建 scripts-archive 目录

将所有非必需的脚本移至 `backend/scripts-archive/`：

```bash
backend/scripts-archive/
├── README.md               # 本文档
├── setup/                  # 一次性设置脚本
│   ├── setup_auth_and_rls.py
│   ├── setup_global_configs_rls.py
│   ├── setup_supabase.py
│   ├── setup_test_cases_table.py
│   └── setup_user_account.py
├── testing/                # 测试脚本
│   ├── test_supabase_connection.py
│   ├── run_database_tests.py
│   ├── run_tests_database.py
│   └── quick_enhanced_report_database.py
├── migration/              # 数据迁移脚本
│   ├── migrate_csv_to_database.py
│   └── archive/
│       ├── migrate_data_final.py
│       └── quick_migrate.py
├── ops/                    # 运维工具
│   ├── cleanup_reports.sh
│   ├── generate_auth_rls_sql.sh
│   └── update_supabase_config.py
└── debug/                  # 调试工具
    ├── fix_stuck_executions.py
    ├── fix_stuck_executions_v2.py
    ├── run_simple.py
    └── test_env.py
```

### 2. 保留的结构

```
backend/
├── execute_test.py          # 前端 API 调用
├── run.py                   # CLI 执行入口
├── config.py                # 配置
├── pyproject.toml           # Python 项目配置
├── .env.example             # 环境变量示例
├── utils/                   # 核心工具
├── testcases/               # 测试用例
├── scripts/                 # 生产工具（精简后）
│   └── README.md            # 说明脚本已移至 scripts-archive
├── scripts-archive/         # 归档的脚本
├── database/                # 数据库相关
│   ├── schema/              # 数据库架构参考
│   ├── archive/             # 历史架构
│   └── migrations/          # ⚠️ 已废弃，指向 supabase/migrations
├── docs/                    # 文档
├── archive/                 # 归档代码
└── reports/                 # 测试报告
```

## 📝 执行步骤

### Step 1: 创建 scripts-archive 目录结构

```bash
cd backend
mkdir -p scripts-archive/{setup,testing,migration,ops,debug}
```

### Step 2: 移动脚本

```bash
# Setup scripts
mv scripts/setup_*.py scripts-archive/setup/

# Testing scripts
mv scripts/test_*.py scripts-archive/testing/
mv scripts/run_database_tests.py scripts-archive/testing/
mv scripts/quick_enhanced_report_database.py scripts-archive/testing/

# Migration scripts
mv scripts/migrate_*.py scripts-archive/migration/
mv scripts/archive scripts-archive/migration/

# Ops scripts
mv scripts/cleanup_reports.sh scripts-archive/ops/
mv scripts/generate_*.sh scripts-archive/ops/
mv scripts/update_supabase_config.py scripts-archive/ops/

# Debug scripts
mv scripts/debug scripts-archive/debug/
```

### Step 3: 创建 README

在 `backend/scripts/README.md` 和 `backend/scripts-archive/README.md` 中添加说明。

### Step 4: 更新文档

更新 `backend/README.md` 反映新的结构。

## ✅ 预期收益

1. **更清晰的结构**
   - 生产代码和工具脚本分离
   - 易于找到需要的文件

2. **降低维护成本**
   - 减少不必要的文件浏览
   - 清晰的职责划分

3. **更好的可维护性**
   - 核心代码集中在根目录
   - 工具脚本归档但可访问

4. **向后兼容**
   - 所有脚本仍然可用
   - 只是位置改变

## ⚠️ 注意事项

1. **不删除任何代码** - 只移动位置
2. **添加说明文档** - 帮助找到移走的文件
3. **更新引用** - 如果有文档引用这些脚本，需要更新
4. **Git 历史** - 使用 `git mv` 保留历史

## 📚 相关文档

- [数据库迁移指南](../database-migrations-guide.md)
- [后端开发指南](README.md)
- [项目重构总结](project-management/REFACTOR_SUMMARY.md)
