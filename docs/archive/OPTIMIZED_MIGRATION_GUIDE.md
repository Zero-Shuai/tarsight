# 测试用例编号系统改造 - 优化实施方案

## 🎯 核心改进：优先使用 MCP 服务

### 为什么优先使用 MCP？

传统方案的问题：
- ❌ 需要手动执行 SQL 文件
- ❌ 难以在开发环境快速测试
- ❌ 无法直接验证迁移结果
- ❌ 需要切换到 Supabase Dashboard

MCP 方案的优势：
- ✅ 直接通过 API 操作数据库
- ✅ 可以快速验证和回滚
- ✅ 代码级别的版本控制
- ✅ 自动化测试和验证

---

## 📋 实施步骤（使用 MCP）

### 步骤 1: 检查当前数据库状态

使用 MCP 工具查询现有表结构：

```python
# 通过 MCP 调用
mcp__plugin_supabase_supabase__list_tables(
    project_id="your-project-id",
    schemas=["public"]
)
```

这会返回：
- 所有表名
- 字段信息
- 约束和索引

### 步骤 2: 应用 Migration 002（添加字段）

**方式 A: 使用 MCP apply_migration（推荐）**
```python
mcp__plugin_supabase_supabase__apply_migration(
    project_id="your-project-id",
    name="add_project_module_codes",
    query="""
    -- 添加 project_code
    ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS project_code VARCHAR(20);

    -- 添加 module_code
    ALTER TABLE public.modules
    ADD COLUMN IF NOT EXISTS module_code VARCHAR(20);

    -- 扩展 case_id
    ALTER TABLE public.test_cases
    ALTER COLUMN case_id TYPE VARCHAR(50);

    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_projects_project_code
        ON public.projects(project_code);
    """
)
```

**方式 B: 使用 SQL 文件（生产环境）**
```bash
# 保留 SQL 文件用于版本控制和审计
npx supabase db execute --file database/migrations/002_add_project_module_codes.sql
```

### 步骤 3: 验证 Migration 结果

```python
# 检查表结构
mcp__plugin_supabase_supabase__list_tables(
    project_id="your-project-id",
    schemas=["public"]
)

# 查询示例数据
mcp__plugin_supabase_supabase__execute_sql(
    project_id="your-project-id",
    query="""
    SELECT id, name, project_code
    FROM public.projects
    LIMIT 5;
    """
)
```

### 步骤 4: 应用 Migration 003（数据迁移）

```python
mcp__plugin_supabase_supabase__apply_migration(
    project_id="your-project-id",
    name="migrate_to_new_id_format",
    query="""
    -- 生成项目编号
    WITH ranked_projects AS (
        SELECT id,
               'PRJ' || LPAD(ROW_NUMBER()
                   OVER (ORDER BY created_at)::TEXT, 3, '0') AS project_code
        FROM public.projects
        WHERE project_code IS NULL OR project_code = ''
    )
    UPDATE public.projects p
    SET project_code = rp.project_code
    FROM ranked_projects rp
    WHERE p.id = rp.id;

    -- 生成模块编号
    WITH ranked_modules AS (
        SELECT id, project_id,
               'MOD' || LPAD(ROW_NUMBER()
                   OVER (PARTITION BY project_id ORDER BY created_at)::TEXT, 3, '0')
               AS module_code
        FROM public.modules
        WHERE module_code IS NULL OR module_code = ''
    )
    UPDATE public.modules m
    SET module_code = rm.module_code
    FROM ranked_modules rm
    WHERE m.id = rm.id;

    -- 迁移测试用例编号
    WITH migrated_cases AS (
        SELECT tc.id,
               p.project_code,
               m.module_code,
               ROW_NUMBER() OVER (
                   PARTITION BY tc.project_id, tc.module_id
                   ORDER BY tc.created_at
               ) AS new_sequence
        FROM public.test_cases tc
        JOIN public.projects p ON tc.project_id = p.id
        JOIN public.modules m ON tc.module_id = m.id
        WHERE tc.case_id NOT ~ '^PRJ\\d{3}-MOD\\d{3}-\\d{3}$'
    )
    UPDATE public.test_cases tc
    SET case_id = format('%s-%s-%03d',
                        mc.project_code,
                        mc.module_code,
                        mc.new_sequence)
    FROM migrated_cases mc
    WHERE tc.id = mc.id;
    """
)
```

### 步骤 5: 验证数据迁移

```python
mcp__plugin_supabase_supabase__execute_sql(
    project_id="your-project-id",
    query="""
    -- 检查项目编号
    SELECT COUNT(*) as total_projects,
           COUNT(project_code) as projects_with_code
    FROM public.projects;

    -- 检查模块编号
    SELECT COUNT(*) as total_modules,
           COUNT(module_code) as modules_with_code
    FROM public.modules;

    -- 检查测试用例编号格式
    SELECT COUNT(*) as total_cases,
           COUNT(CASE WHEN case_id ~ '^PRJ\\d{3}-MOD\\d{3}-\\d{3}$'
                THEN 1 END) as cases_with_new_format
    FROM public.test_cases;

    -- 示例：查看迁移后的编号
    SELECT id, name, project_code
    FROM public.projects
    ORDER BY created_at
    LIMIT 10;
    """
)
```

---

## 🔧 快速回滚（如果需要）

```python
# 从备份表恢复
mcp__plugin_supabase_supabase__execute_sql(
    project_id="your-project-id",
    query="""
    -- 回滚项目表
    TRUNCATE TABLE public.projects;
    INSERT INTO public.projects
    SELECT * FROM public.projects_backup_20260106;

    -- 回滚模块表
    TRUNCATE TABLE public.modules;
    INSERT INTO public.modules
    SELECT * FROM public.modules_backup_20260106;

    -- 回滚测试用例表
    TRUNCATE TABLE public.test_cases;
    INSERT INTO public.test_cases
    SELECT * FROM public.test_cases_backup_20260106;
    """
)
```

---

## 📊 完整工作流对比

### 传统方案
```
1. 写 SQL 文件
2. 打开 Supabase Dashboard
3. 复制粘贴 SQL
4. 执行
5. 手动查询验证
6. 切换回编辑器
```

### MCP 方案
```python
# 在同一对话中完成所有步骤
1. list_tables()           # 查看当前状态
2. apply_migration(...)    # 执行迁移
3. execute_sql(...)        # 验证结果
4. 如果有问题 → execute_sql(rollback)  # 立即回滚
```

---

## ⚠️ MCP 使用注意事项

### 1. 权限配置
确保 MCP 服务使用 service_role key：
```python
env_config = get_env_config()
client = SupabaseClient(access_token=env_config.supabase_service_role_key)
```

### 2. 超时处理
大数据迁移可能超时，建议分批执行：
```python
# 分批更新（每批1000条）
for offset in range(0, total_count, 1000):
    execute_sql(
        query=f"""
        UPDATE public.test_cases
        SET case_id = ...
        WHERE id IN (
            SELECT id FROM public.test_cases
            ORDER BY created_at
            LIMIT 1000 OFFSET {offset}
        );
        """
    )
```

### 3. 事务安全
重要迁移使用事务：
```python
execute_sql(
    query="""
    BEGIN;
    -- 你的迁移语句
    ALTER TABLE public.projects ADD COLUMN project_code VARCHAR(20);
    -- 验证
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'projects'
            AND column_name = 'project_code'
        ) THEN
            RAISE EXCEPTION 'Migration failed';
        END IF;
    END $$;
    COMMIT;
    """
)
```

---

## 🚀 开发 vs 生产环境

### 开发环境
使用 MCP 工具快速迭代：
```python
apply_migration(name="dev_test", query="...")
execute_sql(query="SELECT * FROM ...")
# 测试不通过？立即回滚
execute_sql(query="ROLLBACK;")
```

### 生产环境
保留 SQL 文件 + 使用 MCP 验证：
```bash
# 1. 执行 SQL 文件（审计追踪）
npx supabase db execute --file migrations/002_xxx.sql

# 2. 使用 MCP 验证
execute_sql(query="SELECT COUNT(*) FROM ...")

# 3. 如果有问题，用 MCP 快速回滚
execute_sql(query="TRUNCATE ...; INSERT INTO ... SELECT * FROM backup;")
```

---

## 📝 最佳实践总结

1. **开发阶段**：
   - ✅ 使用 `apply_migration()` 快速测试
   - ✅ 使用 `execute_sql()` 验证每个步骤
   - ✅ 失败立即回滚，迭代尝试

2. **生产部署**：
   - ✅ 保留版本化 SQL 文件
   - ✅ 使用 MCP 验证迁移结果
   - ✅ 准备回滚脚本

3. **文档化**：
   - ✅ 记录所有 MCP 调用
   - ✅ 保留 SQL 文件供审计
   - ✅ 更新 TypeScript 类型

---

## 💡 迁移检查清单

### 迁移前
- [ ] 备份数据库（MCP: 创建备份表）
- [ ] 检查当前表结构（MCP: list_tables）
- [ ] 准备回滚方案（MCP: rollback 脚本）
- [ ] 更新 TypeScript 类型
- [ ] 更新前端表单

### 迁移中
- [ ] 执行 Migration 002（MCP: apply_migration）
- [ ] 验证字段添加成功（MCP: execute_sql + list_tables）
- [ ] 执行 Migration 003（MCP: apply_migration）
- [ ] 验证数据迁移成功（MCP: execute_sql）

### 迁移后
- [ ] 前端功能测试（创建模块、创建用例）
- [ ] Python 查询测试（get_test_cases_by_case_ids）
- [ ] 端到端测试（执行测试）
- [ ] 性能检查（索引是否生效）

---

**实施日期**: 2026-01-06
**优先使用 MCP**: ✅ 是
**版本**: v2.0 (优化版)
