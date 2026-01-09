# Tarsight 数据库管理

这个目录包含 Tarsight API 测试平台的数据库架构文件和迁移脚本。

## 📁 目录结构

```
database/
├── README.md                    # 本文件
├── init.sql                     # 快速初始化脚本
├── schema/                      # 数据库架构文件
│   └── 01_complete_schema.sql   # 完整数据库架构 (v2.0)
├── migrations/                  # 数据库迁移文件
│   ├── README.md                # 迁移说明文档
│   └── 001_example_migration.sql # 迁移模板
└── archive/                     # 旧版SQL文件存档
    ├── supabase_schema.sql      # 旧版完整架构
    ├── create_tables_step1.sql  # 旧版分步创建
    └── ...                      # 其他旧文件
```

## 🚀 快速开始

### 首次安装

#### 方法 1: 使用Supabase Dashboard (推荐)

1. 打开 Supabase Dashboard
2. 进入 **SQL Editor**
3. 复制 [`schema/01_complete_schema.sql`](schema/01_complete_schema.sql) 的内容
4. 粘贴到SQL编辑器
5. 点击 **Run** 执行

#### 方法 2: 使用命令行

```bash
# 设置环境变量
export SUPABASE_DB_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"

# 执行初始化脚本
psql $SUPABASE_DB_URL -f database/init.sql
```

### 验证安装

执行以下SQL验证表是否创建成功:

```sql
-- 查看所有表
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 应该看到以下表:
-- - user_profiles
-- - projects
-- - environments
-- - modules
-- - test_cases
-- - test_suites
-- - test_executions
-- - test_results
-- - project_configs
-- - global_configs
-- - notification_configs
```

## 📊 数据库架构

### 核心表

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| `projects` | 测试项目 | name, base_url, is_active |
| `test_cases` | 测试用例 | case_id, test_name, method, url, request_body |
| `test_executions` | 测试执行记录 | execution_name, status, total_tests, passed_tests |
| `test_results` | 测试结果详情 | status, duration, error_message |

### 配置表

| 表名 | 说明 |
|------|------|
| `global_configs` | 全局配置 |
| `project_configs` | 项目级配置 |

### 辅助表

| 表名 | 说明 |
|------|------|
| `user_profiles` | 用户资料 (扩展auth.users) |
| `environments` | 测试环境 (dev/staging/prod) |
| `modules` | 测试模块 |
| `test_suites` | 测试套件 |
| `notification_configs` | 通知配置 |

## 🔄 数据库迁移

### 创建新迁移

1. 复制迁移模板:
   ```bash
   cp database/migrations/001_example_migration.sql database/migrations/002_your_migration.sql
   ```

2. 编辑文件,添加你的SQL语句

3. 更新文件头部的注释信息

4. 执行迁移

### 迁移最佳实践

- ✅ 使用 `IF NOT EXISTS` 避免重复创建
- ✅ 使用事务确保原子性
- ✅ 添加注释说明迁移目的
- ✅ 先在测试环境验证
- ✅ 准备回滚脚本

## 🛠️ 常用操作

### 查看项目列表

```sql
SELECT id, name, base_url, is_active, created_at
FROM public.projects
ORDER BY created_at DESC;
```

### 查看测试用例统计

```sql
SELECT
    m.name as module,
    COUNT(tc.id) as test_case_count
FROM public.modules m
LEFT JOIN public.test_cases tc ON m.id = tc.module_id
GROUP BY m.id, m.name
ORDER BY m.name;
```

### 查看最近的测试执行

```sql
SELECT
    execution_name,
    status,
    total_tests,
    passed_tests,
    failed_tests,
    started_at
FROM public.test_executions
ORDER BY started_at DESC
LIMIT 10;
```

### 重置数据库 (⚠️ 危险操作)

```sql
-- ⚠️ 警告: 此操作会删除所有数据!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- 重新执行完整架构
\ir database/schema/01_complete_schema.sql
```

## 📈 性能优化

### 索引

数据库已创建以下索引:

- `idx_test_cases_project_id` - 加速按项目查询用例
- `idx_test_executions_project_status` - 加速按项目和状态查询
- `idx_test_results_execution_id` - 加速查询执行结果
- 更多索引详见 [`01_complete_schema.sql`](schema/01_complete_schema.sql)

### 视图

- `project_stats` - 项目统计信息
- `execution_details` - 测试执行详情
- `test_results_summary` - 测试结果汇总

### 函数

- `get_project_test_stats(project_uuid)` - 获取项目统计
- `get_test_cases_by_module(project_uuid)` - 按模块获取用例数

## 🔐 安全策略

数据库启用了 Row Level Security (RLS):

- ✅ 用户只能访问自己创建的项目
- ✅ 测试用例仅项目成员可见
- ✅ 执行记录仅创建者可见

## 🗂️ Archive目录

`archive/` 目录包含旧版SQL文件,已弃用但保留用于参考:

- `supabase_schema.sql` - v1.0 完整架构
- `create_tables_step1*.sql` - 分步创建脚本
- `simple_setup.sql` - 简化设置脚本
- 等等...

**注意**: 这些文件仅供参考,请勿在生产环境使用。

## 📝 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 2.0 | 2025-12-30 | 重构数据库架构,统一SQL文件 |
| 1.0 | 2025-12-22 | 初始版本 |

## 🆘 故障排除

### 问题: 表已存在错误

**解决**: 使用 `IF NOT EXISTS` 语句,或先删除表

```sql
DROP TABLE IF EXISTS public.table_name CASCADE;
```

### 问题: 外键约束错误

**解决**: 先创建被引用的表,再创建引用表

### 问题: 权限不足

**解决**: 确保使用 Supabase admin key 或在 Dashboard 中执行

## 📚 相关文档

- [Supabase 文档](https://supabase.com/docs)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [项目主 README](../README.md)

## 🤝 贡献

修改数据库架构时:

1. 创建新的迁移文件
2. 更新本 README
3. 更新版本历史
4. 通知团队成员

## 📞 支持

如有问题,请联系项目维护者或在 Issues 中提问。
