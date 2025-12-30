# 数据库迁移文件

本目录包含数据库的版本化迁移文件。

## 迁移命名规范

`版本号_描述.sql`

示例:
- `001_add_test_results_table.sql`
- `002_add_performance_indexes.sql`
- `003_add_notification_system.sql`

## 使用方法

### 在Supabase Dashboard中执行

1. 打开Supabase Dashboard
2. 进入SQL Editor
3. 复制迁移文件内容
4. 执行SQL

### 使用命令行

```bash
# 使用psql执行迁移
psql -h db.xxx.supabase.co -U postgres -d postgres -f migrations/001_add_test_results_table.sql
```

## 迁移历史

当前版本: v2.0

| 版本 | 文件 | 描述 | 日期 |
|------|------|------|------|
| 2.0 | (完整schema) | 重构数据库架构 | 2025-12-30 |

## 注意事项

1. **备份数据**: 执行迁移前务必备份数据库
2. **测试环境**: 先在测试环境验证迁移
3. **顺序执行**: 按版本号顺序执行迁移
4. **回滚计划**: 准备回滚脚本以防迁移失败
