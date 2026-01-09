# 数据库迁移管理指南

## 📂 迁移文件位置

### 统一位置：`supabase/migrations/`

```
supabase/migrations/
├── 001_example_migration.sql
├── 002_add_project_module_codes.sql
├── 003_migrate_to_new_id_format.sql
├── 004_update_code_format_validation.sql
├── 005_update_code_pattern.sql
├── 006_add_level_and_assertions_columns.sql
├── 007_enhance_validation_rules.sql
├── setup_auth_and_rls.sql
├── setup_global_configs_rls.sql
├── add_validation_rules.sql
└── 20250101000000_create_queue_config_table.sql
```

### 历史位置（已废弃）

- ~~`backend/database/migrations/`~~ - **不再使用**

## 🎯 为什么统一到 `supabase/migrations/`？

1. **Supabase CLI 标准**
   - 官方推荐的迁移目录
   - 支持 `supabase db push` 命令
   - 自动版本管理

2. **前后端统一**
   - 前端和后端使用同一迁移源
   - 避免同步问题
   - 单一事实来源

3. **更好的工具支持**
   - Supabase Dashboard 可视化
   - Git 集成
   - 自动回滚

## 📝 迁移命名规范

### 格式

```
<timestamp>_<description>.sql
或
<number>_<description>.sql
```

### 示例

- ✅ `001_create_test_cases_table.sql`
- ✅ `002_add_indexes.sql`
- ✅ `20250109_add_assertions.sql`

### 不好的命名

- ❌ `migration.sql`
- ❌ `fix.sql`
- ❌ `update.sql`

## 🚀 执行迁移

### 方法 1: Supabase CLI（推荐）

```bash
# 推送所有迁移到远程
supabase db push

# 查看迁移状态
supabase migration list

# 重置数据库（危险！）
supabase db reset
```

### 方法 2: Supabase Dashboard

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制迁移文件内容
4. 执行 SQL

### 方法 3: Python 脚本（本地开发）

```bash
cd backend
python apply_migration.py <migration_file>
```

## 📋 迁移工作流

### 1. 创建新迁移

```bash
# 创建迁移文件
touch supabase/migrations/008_new_feature.sql
```

### 2. 编写 SQL

```sql
-- 008_new_feature.sql
-- Author: Your Name
-- Date: 2025-01-09
-- Description: Add new feature

-- Add your migration SQL here
ALTER TABLE test_cases ADD COLUMN new_field TEXT;
```

### 3. 本地测试

```bash
# 应用到本地开发数据库
supabase db push
```

### 4. 提交代码

```bash
git add supabase/migrations/008_new_feature.sql
git commit -m "feat: add new feature to database"
git push
```

### 5. 生产部署

```bash
# 在生产环境
supabase db push
```

## ⚠️ 注意事项

### 迁移原则

1. **幂等性**
   - 迁移可以重复执行
   - 使用 `IF NOT EXISTS` 等安全语法

2. **向后兼容**
   - 不破坏现有数据
   - 提供回滚脚本

3. **测试优先**
   - 在开发环境测试
   - 在 staging 环境验证
   - 最后应用到生产

4. **文档化**
   - 每个迁移添加注释
   - 说明变更原因
   - 记录影响范围

### 示例：安全的迁移

```sql
-- ✅ 好的迁移
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE tablename = 'new_table'
    ) THEN
        CREATE TABLE new_table (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at TIMESTAMP DEFAULT NOW()
        );
    END IF;
END $$;

-- ❌ 不好的迁移
CREATE TABLE new_table (
    id UUID PRIMARY KEY
); -- 如果表已存在会报错
```

## 📊 迁移历史

| 版本 | 文件 | 描述 | 日期 |
|------|------|------|------|
| 001 | `001_example_migration.sql` | 示例迁移 | 2025-12-30 |
| 002 | `002_add_project_module_codes.sql` | 添加项目模块代码 | 2025-01-06 |
| 003 | `003_migrate_to_new_id_format.sql` | 迁移到新 ID 格式 | 2025-01-06 |
| 004 | `004_update_code_format_validation.sql` | 更新代码格式验证 | 2025-01-06 |
| 005 | `005_update_code_pattern.sql` | 更新代码模式 | 2025-01-06 |
| 006 | `006_add_level_and_assertions_columns.sql` | 添加级别和断言列 | 2025-01-08 |
| 007 | `007_enhance_validation_rules.sql` | 增强验证规则 | 2025-01-09 |

## 🔧 故障排查

### 问题：迁移失败

```bash
# 查看迁移状态
supabase migration list

# 强制重置（危险！会删除所有数据）
supabase db reset
```

### 问题：迁移冲突

```bash
# 查看远程迁移
supabase migration list

# 手动解决冲突后
supabase db push
```

### 问题：需要回滚

```bash
# 创建回滚迁移
# 例如：009_revert_feature_x.sql

# 执行回滚
supabase db push
```

## 📚 相关文档

- [Supabase CLI 文档](https://supabase.com/docs/guides/cli)
- [数据库架构文档](../architecture.md)
- [后端开发指南](../backend/README.md)
