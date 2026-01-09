-- ============================================================================
-- Tarsight API测试平台 - Supabase数据库完整架构
-- 版本: 2.0
-- 创建时间: 2025-12-30
-- 说明: 这是完整的数据库架构,包含所有表、索引、RLS策略、触发器和视图
--
-- 使用方法:
--   1. 在Supabase Dashboard的SQL Editor中执行此脚本
--   2. 或使用psql命令: psql -h db.xxx.supabase.co -U postgres -d postgres -f 01_complete_schema.sql
-- ============================================================================

-- ============================================================================
-- 1. 用户管理表
-- ============================================================================

-- 用户表 (扩展Supabase Auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'tester' CHECK (role IN ('admin', 'tester', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.user_profiles IS '用户资料表,扩展auth.users';
COMMENT ON COLUMN public.user_profiles.role IS '用户角色: admin-管理员, tester-测试员, viewer-查看者';

-- ============================================================================
-- 2. 项目管理表
-- ============================================================================

-- 项目表
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.projects IS '测试项目表';
COMMENT ON COLUMN public.projects.base_url IS '项目的基础URL,用于API测试';

-- 环境表
CREATE TABLE IF NOT EXISTS public.environments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    base_url TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.environments IS '项目环境表(如dev/staging/prod)';

-- ============================================================================
-- 3. 测试管理表
-- ============================================================================

-- 测试模块表
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.modules IS '测试模块表,用于组织测试用例';

-- 测试用例表
CREATE TABLE IF NOT EXISTS public.test_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    case_id VARCHAR(20) NOT NULL,
    test_name VARCHAR(200) NOT NULL,
    description TEXT,
    method VARCHAR(10) NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS')),
    url TEXT NOT NULL,
    request_body JSONB,
    expected_status INTEGER DEFAULT 200,
    headers JSONB,
    variables JSONB,
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, module_id, case_id)
);

COMMENT ON TABLE public.test_cases IS 'API测试用例表';
COMMENT ON COLUMN public.test_cases.case_id IS '用例编号,如TC001';
COMMENT ON COLUMN public.test_cases.request_body IS 'JSON格式的请求体';
COMMENT ON COLUMN public.test_cases.variables IS '测试变量,用于参数化测试';

-- 测试套件表 (测试用例集合)
CREATE TABLE IF NOT EXISTS public.test_suites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    test_case_ids UUID[] DEFAULT '{}',
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.test_suites IS '测试套件,用于组织测试用例集合';

-- ============================================================================
-- 4. 测试执行表
-- ============================================================================

-- 测试执行记录表
CREATE TABLE IF NOT EXISTS public.test_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    environment_id UUID REFERENCES public.environments(id),
    suite_id UUID REFERENCES public.test_suites(id) ON DELETE SET NULL,
    execution_name VARCHAR(200),
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    total_tests INTEGER DEFAULT 0,
    passed_tests INTEGER DEFAULT 0,
    failed_tests INTEGER DEFAULT 0,
    skipped_tests INTEGER DEFAULT 0,
    total_duration DECIMAL(10,3),
    started_by UUID REFERENCES public.user_profiles(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE public.test_executions IS '测试执行记录表';
COMMENT ON COLUMN public.test_executions.status IS '执行状态: running-运行中, completed-已完成, failed-失败, cancelled-已取消';

-- 测试结果详情表
CREATE TABLE IF NOT EXISTS public.test_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    execution_id UUID REFERENCES public.test_executions(id) ON DELETE CASCADE,
    test_case_id UUID REFERENCES public.test_cases(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('passed', 'failed', 'skipped', 'error')),
    duration DECIMAL(10,3),
    error_message TEXT,
    request_info JSONB,
    response_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.test_results IS '单个测试用例的执行结果详情';

-- ============================================================================
-- 5. 配置管理表
-- ============================================================================

-- 项目配置表
CREATE TABLE IF NOT EXISTS public.project_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, config_key)
);

COMMENT ON TABLE public.project_configs IS '项目级配置表';

-- 全局配置表
CREATE TABLE IF NOT EXISTS public.global_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.global_configs IS '全局配置表';

-- ============================================================================
-- 6. 通知管理表
-- ============================================================================

-- 通知配置表
CREATE TABLE IF NOT EXISTS public.notification_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'wechat', 'email', 'slack', 'webhook'
    config JSONB NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.notification_configs IS '通知配置表,支持多种通知方式';

-- ============================================================================
-- 7. 索引优化
-- ============================================================================

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);

-- 项目表索引
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_is_active ON public.projects(is_active);

-- 测试用例表索引
CREATE INDEX IF NOT EXISTS idx_test_cases_project_id ON public.test_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_module_id ON public.test_cases(module_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_case_id ON public.test_cases(case_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_tags ON public.test_cases USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_test_cases_is_active ON public.test_cases(is_active);

-- 测试执行表索引
CREATE INDEX IF NOT EXISTS idx_test_executions_project_id ON public.test_executions(project_id);
CREATE INDEX IF NOT EXISTS idx_test_executions_status ON public.test_executions(status);
CREATE INDEX IF NOT EXISTS idx_test_executions_started_at ON public.test_executions(started_at);
CREATE INDEX IF NOT EXISTS idx_test_executions_project_status ON public.test_executions(project_id, status);

-- 测试结果表索引
CREATE INDEX IF NOT EXISTS idx_test_results_execution_id ON public.test_results(execution_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_case_id ON public.test_results(test_case_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON public.test_results(status);
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON public.test_results(created_at);

-- 配置表索引
CREATE INDEX IF NOT EXISTS idx_project_configs_project_key ON public.project_configs(project_id, config_key);

-- ============================================================================
-- 8. Row Level Security (RLS) 策略
-- ============================================================================

-- 启用RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

-- 用户策略 - 只能访问自己的资料
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- 项目策略 - 创建者可以管理自己的项目
CREATE POLICY "Users can view own projects" ON public.projects
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create projects" ON public.projects
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Project owners can update projects" ON public.projects
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Project owners can delete projects" ON public.projects
    FOR DELETE USING (created_by = auth.uid());

-- 测试用例策略 - 项目成员可以访问
CREATE POLICY "Project members can view test cases" ON public.test_cases
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Project members can manage test cases" ON public.test_cases
    FOR ALL USING (
        project_id IN (
            SELECT id FROM public.projects WHERE created_by = auth.uid()
        )
    );

-- 测试执行策略
CREATE POLICY "Users can view own test executions" ON public.test_executions
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create test executions" ON public.test_executions
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects WHERE created_by = auth.uid()
        )
    );

-- 测试结果策略
CREATE POLICY "Users can view own test results" ON public.test_results
    FOR SELECT USING (
        execution_id IN (
            SELECT id FROM public.test_executions
            WHERE project_id IN (
                SELECT id FROM public.projects WHERE created_by = auth.uid()
            )
        )
    );

-- ============================================================================
-- 9. 触发器和函数
-- ============================================================================

-- 更新时间戳触发器函数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用更新时间戳触发器
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_test_cases_updated_at ON public.test_cases;
CREATE TRIGGER update_test_cases_updated_at
    BEFORE UPDATE ON public.test_cases
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_configs_updated_at ON public.project_configs;
CREATE TRIGGER update_project_configs_updated_at
    BEFORE UPDATE ON public.project_configs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_global_configs_updated_at ON public.global_configs;
CREATE TRIGGER update_global_configs_updated_at
    BEFORE UPDATE ON public.global_configs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 10. 视图定义
-- ============================================================================

-- 项目统计视图
CREATE OR REPLACE VIEW public.project_stats AS
SELECT
    p.id,
    p.name,
    COUNT(DISTINCT tc.id)::BIGINT as total_test_cases,
    COUNT(DISTINCT m.id)::BIGINT as total_modules,
    COUNT(DISTINCT te.id)::BIGINT as total_executions,
    COALESCE(AVG(CASE WHEN te.status = 'completed' THEN te.total_duration END), 0) as avg_duration,
    MAX(te.started_at) as last_execution
FROM public.projects p
LEFT JOIN public.test_cases tc ON p.id = tc.project_id AND tc.is_active = true
LEFT JOIN public.modules m ON p.id = m.project_id
LEFT JOIN public.test_executions te ON p.id = te.project_id
GROUP BY p.id, p.name;

COMMENT ON VIEW public.project_stats IS '项目统计信息视图';

-- 测试执行详细视图
CREATE OR REPLACE VIEW public.execution_details AS
SELECT
    te.id as execution_id,
    te.execution_name,
    te.status,
    te.total_tests,
    te.passed_tests,
    te.failed_tests,
    te.skipped_tests,
    te.total_duration,
    te.started_at,
    te.completed_at,
    u.username as started_by_username,
    u.full_name as started_by_name,
    p.name as project_name,
    e.name as environment_name
FROM public.test_executions te
LEFT JOIN public.user_profiles u ON te.started_by = u.id
LEFT JOIN public.projects p ON te.project_id = p.id
LEFT JOIN public.environments e ON te.environment_id = e.id;

COMMENT ON VIEW public.execution_details IS '测试执行详细信息视图';

-- 测试结果汇总视图
CREATE OR REPLACE VIEW public.test_results_summary AS
SELECT
    te.id as execution_id,
    te.execution_name,
    te.status as execution_status,
    tc.case_id,
    tc.test_name,
    tc.module_id,
    m.name as module_name,
    tr.status,
    tr.duration,
    tr.error_message
FROM public.test_executions te
JOIN public.test_results tr ON tr.execution_id = te.id
LEFT JOIN public.test_cases tc ON tr.test_case_id = tc.id
LEFT JOIN public.modules m ON tc.module_id = m.id
ORDER BY te.started_at DESC, m.name, tc.case_id;

COMMENT ON VIEW public.test_results_summary IS '测试结果汇总视图';

-- ============================================================================
-- 11. 初始数据
-- ============================================================================

-- 插入全局默认配置
INSERT INTO public.global_configs (config_key, config_value, description) VALUES
('default_timeout', '30', '默认请求超时时间（秒）'),
('max_retries', '3', '最大重试次数'),
('default_headers', '{"Content-Type": "application/json", "Accept": "application/json"}', '默认请求头'),
('report_retention_days', '90', '报告保留天数'),
('enable_performance_monitoring', 'true', '是否启用性能监控'),
('batch_insert_size', '50', '批量插入大小')
ON CONFLICT (config_key) DO NOTHING;

-- ============================================================================
-- 12. 数据库函数
-- ============================================================================

-- 获取项目测试统计
CREATE OR REPLACE FUNCTION public.get_project_test_stats(project_uuid UUID)
RETURNS TABLE(
    total_cases BIGINT,
    active_cases BIGINT,
    total_executions BIGINT,
    success_rate DECIMAL,
    avg_duration DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(tc.id)::BIGINT as total_cases,
        COUNT(CASE WHEN tc.is_active = true THEN 1 END)::BIGINT as active_cases,
        COUNT(te.id)::BIGINT as total_executions,
        CASE
            WHEN COUNT(te.id) > 0 THEN
                ROUND(SUM(CASE WHEN te.status = 'completed' AND te.failed_tests = 0 THEN 1 ELSE 0 END)::DECIMAL / COUNT(te.id) * 100, 2)
            ELSE 0
        END as success_rate,
        COALESCE(AVG(te.total_duration), 0) as avg_duration
    FROM public.projects p
    LEFT JOIN public.test_cases tc ON p.id = tc.project_id
    LEFT JOIN public.test_executions te ON p.id = te.project_id
    WHERE p.id = project_uuid
    GROUP BY p.id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_project_test_stats IS '获取项目的测试统计信息';

-- 按模块获取测试用例数量
CREATE OR REPLACE FUNCTION public.get_test_cases_by_module(project_uuid UUID)
RETURNS TABLE(module_name TEXT, case_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.name as module_name,
        COUNT(tc.id)::BIGINT as case_count
    FROM public.modules m
    LEFT JOIN public.test_cases tc ON m.id = tc.module_id AND tc.is_active = true
    WHERE m.project_id = project_uuid
    GROUP BY m.id, m.name
    ORDER BY m.name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_test_cases_by_module IS '按模块统计测试用例数量';

-- ============================================================================
-- 完成
-- ============================================================================

-- 输出创建完成信息
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Tarsight数据库架构创建完成!';
    RAISE NOTICE '版本: 2.0';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '已创建的表:';
    RAISE NOTICE '  - user_profiles (用户表)';
    RAISE NOTICE '  - projects (项目表)';
    RAISE NOTICE '  - environments (环境表)';
    RAISE NOTICE '  - modules (模块表)';
    RAISE NOTICE '  - test_cases (测试用例表)';
    RAISE NOTICE '  - test_suites (测试套件表)';
    RAISE NOTICE '  - test_executions (测试执行表)';
    RAISE NOTICE '  - test_results (测试结果表)';
    RAISE NOTICE '  - project_configs (项目配置表)';
    RAISE NOTICE '  - global_configs (全局配置表)';
    RAISE NOTICE '  - notification_configs (通知配置表)';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '已创建的视图:';
    RAISE NOTICE '  - project_stats (项目统计)';
    RAISE NOTICE '  - execution_details (执行详情)';
    RAISE NOTICE '  - test_results_summary (结果汇总)';
    RAISE NOTICE '===========================================';
END $$;
