-- =====================================================
-- Supabase 认证和行级安全（RLS）配置脚本
-- =====================================================
-- 使用说明：
-- 1. 打开 Supabase Dashboard
-- 2. 进入 SQL Editor
-- 3. 复制并执行此脚本
-- =====================================================

-- 1. 为 projects 表添加 user_id 列（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE projects ADD COLUMN user_id TEXT;
        RAISE NOTICE '✅ 已添加 user_id 列到 projects 表';
    ELSE
        RAISE NOTICE 'ℹ️  user_id 列已存在于 projects 表';
    END IF;
END
$$;

-- 2. 启用所有表的 RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

SELECT '✅ 所有表已启用 RLS' AS status;

-- 3. 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

DROP POLICY IF EXISTS "Users can view modules of their projects" ON modules;
DROP POLICY IF EXISTS "Users can insert modules into their projects" ON modules;
DROP POLICY IF EXISTS "Users can update modules of their projects" ON modules;
DROP POLICY IF EXISTS "Users can delete modules from their projects" ON modules;

DROP POLICY IF EXISTS "Users can view test cases of their projects" ON test_cases;
DROP POLICY IF EXISTS "Users can insert test cases into their projects" ON test_cases;
DROP POLICY IF EXISTS "Users can update test cases of their projects" ON test_cases;
DROP POLICY IF EXISTS "Users can delete test cases from their projects" ON test_cases;

DROP POLICY IF EXISTS "Users can view test executions of their projects" ON test_executions;
DROP POLICY IF EXISTS "Users can insert test executions into their projects" ON test_executions;
DROP POLICY IF EXISTS "Users can update test executions of their projects" ON test_executions;
DROP POLICY IF EXISTS "Users can delete test executions from their projects" ON test_executions;

DROP POLICY IF EXISTS "Users can view test results of their projects" ON test_results;
DROP POLICY IF EXISTS "Users can insert test results into their projects" ON test_results;
DROP POLICY IF EXISTS "Users can update test results of their projects" ON test_results;
DROP POLICY IF EXISTS "Users can delete test results from their projects" ON test_results;

SELECT '✅ 旧策略已删除' AS status;

-- 4. 创建 projects 表策略
CREATE POLICY "Users can view their own projects"
ON projects
FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own projects"
ON projects
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own projects"
ON projects
FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own projects"
ON projects
FOR DELETE
USING (auth.uid()::text = user_id);

SELECT '✅ projects 表策略已创建' AS status;

-- 5. 创建 modules 表策略
CREATE POLICY "Users can view modules of their projects"
ON modules
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = modules.project_id
        AND projects.user_id = auth.uid()::text
    )
);

CREATE POLICY "Users can insert modules into their projects"
ON modules
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_id
        AND projects.user_id = auth.uid()::text
    )
);

CREATE POLICY "Users can update modules of their projects"
ON modules
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = modules.project_id
        AND projects.user_id = auth.uid()::text
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_id
        AND projects.user_id = auth.uid()::text
    )
);

CREATE POLICY "Users can delete modules from their projects"
ON modules
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = modules.project_id
        AND projects.user_id = auth.uid()::text
    )
);

SELECT '✅ modules 表策略已创建' AS status;

-- 6. 创建 test_cases 表策略
CREATE POLICY "Users can view test cases of their projects"
ON test_cases
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = test_cases.project_id
        AND projects.user_id = auth.uid()::text
    )
);

CREATE POLICY "Users can insert test cases into their projects"
ON test_cases
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_id
        AND projects.user_id = auth.uid()::text
    )
);

CREATE POLICY "Users can update test cases of their projects"
ON test_cases
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = test_cases.project_id
        AND projects.user_id = auth.uid()::text
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_id
        AND projects.user_id = auth.uid()::text
    )
);

CREATE POLICY "Users can delete test cases from their projects"
ON test_cases
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = test_cases.project_id
        AND projects.user_id = auth.uid()::text
    )
);

SELECT '✅ test_cases 表策略已创建' AS status;

-- 7. 创建 test_executions 表策略
CREATE POLICY "Users can view test executions of their projects"
ON test_executions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = test_executions.project_id
        AND projects.user_id = auth.uid()::text
    )
);

CREATE POLICY "Users can insert test executions into their projects"
ON test_executions
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_id
        AND projects.user_id = auth.uid()::text
    )
);

CREATE POLICY "Users can update test executions of their projects"
ON test_executions
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = test_executions.project_id
        AND projects.user_id = auth.uid()::text
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_id
        AND projects.user_id = auth.uid()::text
    )
);

CREATE POLICY "Users can delete test executions from their projects"
ON test_executions
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = test_executions.project_id
        AND projects.user_id = auth.uid()::text
    )
);

SELECT '✅ test_executions 表策略已创建' AS status;

-- 8. 创建 test_results 表策略
CREATE POLICY "Users can view test results of their projects"
ON test_results
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM test_executions
        JOIN projects ON projects.id = test_executions.project_id
        WHERE test_executions.id = test_results.execution_id
        AND projects.user_id = auth.uid()::text
    )
);

CREATE POLICY "Users can insert test results into their projects"
ON test_results
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM test_executions
        JOIN projects ON projects.id = test_executions.project_id
        WHERE test_executions.id = execution_id
        AND projects.user_id = auth.uid()::text
    )
);

CREATE POLICY "Users can update test results of their projects"
ON test_results
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM test_executions
        JOIN projects ON projects.id = test_executions.project_id
        WHERE test_executions.id = test_results.execution_id
        AND projects.user_id = auth.uid()::text
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM test_executions
        JOIN projects ON projects.id = test_executions.project_id
        WHERE test_executions.id = execution_id
        AND projects.user_id = auth.uid()::text
    )
);

CREATE POLICY "Users can delete test results from their projects"
ON test_results
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM test_executions
        JOIN projects ON projects.id = test_executions.project_id
        WHERE test_executions.id = test_results.execution_id
        AND projects.user_id = auth.uid()::text
    )
);

SELECT '✅ test_results 表策略已创建' AS status;

-- =====================================================
-- 配置完成！
-- =====================================================
-- 后续步骤：
-- 1. 在 Supabase Dashboard 中启用 Email Auth
-- 2. 可选：配置 SMTP 邮件服务器
-- 3. 测试用户注册和登录功能
-- =====================================================

SELECT '✨ 所有 RLS 策略配置完成！' AS final_status;
