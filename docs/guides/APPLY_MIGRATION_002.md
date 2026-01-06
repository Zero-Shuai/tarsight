# 应用 Migration 002 - 操作指南

## 📋 操作步骤

### 方法 1: 通过 Supabase Dashboard (推荐)

1. **打开 SQL Editor**
   - 访问: https://supabase.com/dashboard/project/gtdzmawwckvpzbbsgssv/sql
   - 或者：Dashboard → SQL Editor

2. **执行 Migration 002**

   复制以下完整 SQL 代码到 SQL Editor：

   ```sql
   -- Migration: Add project_code and module_code fields
   -- Version: 002

   -- Step 1: Add project_code to projects table
   ALTER TABLE public.projects
   ADD COLUMN IF NOT EXISTS project_code VARCHAR(20);

   ALTER TABLE public.projects
   DROP CONSTRAINT IF EXISTS projects_project_code_key;

   ALTER TABLE public.projects
   ADD CONSTRAINT projects_project_code_key UNIQUE (project_code);

   COMMENT ON COLUMN public.projects.project_code IS 'Project code in format PRJ001, PRJ002, etc.';

   -- Step 2: Add module_code to modules table
   ALTER TABLE public.modules
   ADD COLUMN IF NOT EXISTS module_code VARCHAR(20);

   ALTER TABLE public.modules
   DROP CONSTRAINT IF EXISTS modules_module_code_key;

   ALTER TABLE public.modules
   ADD CONSTRAINT modules_project_module_code_key UNIQUE (project_id, module_code);

   COMMENT ON COLUMN public.modules.module_code IS 'Module code in format MOD001, MOD002, etc. (unique within project)';

   -- Step 3: Extend case_id length
   ALTER TABLE public.test_cases
   ALTER COLUMN case_id TYPE VARCHAR(50);

   COMMENT ON COLUMN public.test_cases.case_id IS 'Test case ID in format PROJECT_CODE-MODULE_CODE-SEQUENCE (e.g., PRJ001-MOD001-001)';

   -- Step 4: Create indexes
   CREATE INDEX IF NOT EXISTS idx_projects_project_code ON public.projects(project_code);
   CREATE INDEX IF NOT EXISTS idx_modules_project_module_code ON public.modules(project_id, module_code);

   -- Step 5: Create auto-generation function for sequence
   CREATE OR REPLACE FUNCTION public.generate_next_case_sequence(
       p_project_id UUID,
       p_module_id UUID
   )
   RETURNS INTEGER AS $$
   DECLARE
       v_max_sequence INTEGER;
       v_next_sequence INTEGER;
   BEGIN
       SELECT COALESCE(MAX(
           CASE
               WHEN case_id ~ 'PRJ\d{3}-MOD\d{3}-(\d{3})'
               THEN CAST(REGEXP_REPLACE(case_id, '.*-', '') AS INTEGER)
               ELSE 0
           END
       ), 0)
       INTO v_max_sequence
       FROM public.test_cases
       WHERE project_id = p_project_id
         AND module_id = p_module_id
         AND case_id ~ '^PRJ\d{3}-MOD\d{3}-\d{3}$';

       v_next_sequence := v_max_sequence + 1;
       RETURN v_next_sequence;
   END;
   $$ LANGUAGE plpgsql;

   -- Step 6: Create auto-generation function for full case ID
   CREATE OR REPLACE FUNCTION public.generate_case_id(
       p_project_id UUID,
       p_module_id UUID
   )
   RETURNS VARCHAR(50) AS $$
   DECLARE
       v_project_code VARCHAR(20);
       v_module_code VARCHAR(20);
       v_sequence INTEGER;
       v_case_id VARCHAR(50);
   BEGIN
       SELECT project_code INTO v_project_code
       FROM public.projects
       WHERE id = p_project_id;

       IF v_project_code IS NULL THEN
           RAISE EXCEPTION 'Project code not found for project %', p_project_id;
       END IF;

       SELECT module_code INTO v_module_code
       FROM public.modules
       WHERE id = p_module_id;

       IF v_module_code IS NULL THEN
           RAISE EXCEPTION 'Module code not found for module %', p_module_id;
       END IF;

       v_sequence := public.generate_next_case_sequence(p_project_id, p_module_id);
       v_case_id := format('%s-%s-%03d', v_project_code, v_module_code, v_sequence);

       RETURN v_case_id;
   END;
   $$ LANGUAGE plpgsql;

   COMMENT ON FUNCTION public.generate_case_id IS 'Generate auto-incrementing case ID in format PRJ001-MOD001-001';
   COMMENT ON FUNCTION public.generate_next_case_sequence IS 'Get next sequence number for test cases within a module';
   ```

3. **点击 "Run" 按钮执行**

4. **验证执行结果**

   执行以下验证 SQL：

   ```sql
   -- 检查 projects 表
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'projects'
     AND column_name = 'project_code';

   -- 检查 modules 表
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'modules'
     AND column_name = 'module_code';

   -- 检查 test_cases 表 case_id 长度
   SELECT column_name, character_maximum_length
   FROM information_schema.columns
   WHERE table_name = 'test_cases'
     AND column_name = 'case_id';

   -- 检查函数是否存在
   SELECT routine_name
   FROM information_schema.routines
   WHERE routine_schema = 'public'
     AND routine_name IN ('generate_case_id', 'generate_next_case_sequence');
   ```

   预期结果：
   - ✅ projects 表有 `project_code` 字段 (VARCHAR(20))
   - ✅ modules 表有 `module_code` 字段 (VARCHAR(20))
   - ✅ test_cases 表的 `case_id` 长度为 50
   - ✅ 有两个函数：`generate_case_id`, `generate_next_case_sequence`

---

### 方法 2: 使用 psql 命令行

如果你有 PostgreSQL 连接字符串：

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.gtdzmawwckvpzbbsgssv.supabase.co:5432/postgres" \
  -f database/migrations/002_add_project_module_codes.sql
```

---

## ✅ 执行后验证

### 1. 在项目管理页面测试

访问: http://localhost:3000/projects

应该能看到：
- ✅ 项目编号字段（可以编辑）
- ✅ 项目名称字段（可以编辑）
- ✅ 项目描述字段（可以编辑）

### 2. 编辑项目

1. 设置项目编号为: `PRJ001`
2. 设置项目名称为: `Tarsight 测试项目`
3. 点击"保存配置"

### 3. 检查数据库

```sql
SELECT id, name, project_code, base_url
FROM public.projects
WHERE id = '8786c21f-7437-4a2d-8486-9365a382b38e';
```

预期结果：
```
id                  | name                | project_code | base_url
--------------------+---------------------+--------------+------------------
8786c21f-...        | Tarsight 测试项目   | PRJ001       | https://...
```

---

## 📝 下一步

Migration 002 执行成功后：

1. ✅ 测试项目管理页面的编辑功能
2. 📝 为现有项目设置 `project_code`
3. 📝 为现有模块设置 `module_code`（在模块管理页面）
4. 📝 执行 Migration 003 迁移现有测试用例数据

---

## ❓ 常见问题

### Q: 执行时报错 "column already exists"
**A**: 这是正常的，migration 使用了 `IF NOT EXISTS`，可以忽略此错误

### Q: 执行后项目管理页面报错
**A**: 检查浏览器控制台错误，可能是：
   - `project_code` 字段不存在（重新执行 migration）
   - RLS 策略问题（需要更新 RLS 策略）

### Q: 想要回滚怎么办？
**A**: 执行以下 SQL 回滚：

```sql
-- 删除函数
DROP FUNCTION IF EXISTS public.generate_case_id(UUID, UUID);
DROP FUNCTION IF EXISTS public.generate_next_case_sequence(UUID, UUID);

-- 删除索引
DROP INDEX IF EXISTS public.idx_projects_project_code;
DROP INDEX IF EXISTS public.idx_modules_project_module_code;

-- 删除约束
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_project_code_key;
ALTER TABLE public.modules DROP CONSTRAINT IF EXISTS modules_project_module_code_key;

-- 删除字段
ALTER TABLE public.projects DROP COLUMN IF EXISTS project_code;
ALTER TABLE public.modules DROP COLUMN IF EXISTS module_code;

-- 恢复 case_id 长度
ALTER TABLE public.test_cases ALTER COLUMN case_id TYPE VARCHAR(20);
```

---

**创建时间**: 2026-01-06
**Migration 版本**: 002
**状态**: 待执行
