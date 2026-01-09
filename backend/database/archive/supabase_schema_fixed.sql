-- Tarsight API测试平台 - Supabase数据库架构 (修复版)
-- 创建时间: 2025-12-22

-- =============================================
-- 1. 用户管理表
-- =============================================

-- 用户表 (扩展Supabase Auth.users)
CREATE TABLE public.user_profiles (
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

-- =============================================
-- 2. 项目管理表
-- =============================================

-- 项目表
CREATE TABLE public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 环境表
CREATE TABLE public.environments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    base_url TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. 测试管理表
-- =============================================

-- 测试模块表
CREATE TABLE public.modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 测试用例表
CREATE TABLE public.test_cases (
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

-- 测试套件表 (测试用例集合)
CREATE TABLE public.test_suites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    test_case_ids UUID[] DEFAULT '{}',
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. 测试执行表
-- =============================================

-- 测试执行记录表
CREATE TABLE public.test_executions (
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
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT
);

-- 测试结果详情表
CREATE TABLE public.test_results (
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

-- =============================================
-- 5. 配置管理表
-- =============================================

-- 项目配置表
CREATE TABLE public.project_configs (
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

-- 全局配置表
CREATE TABLE public.global_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. 通知管理表
-- =============================================

-- 通知配置表
CREATE TABLE public.notification_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    config JSONB NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 7. 索引优化
-- =============================================

-- 用户表索引
CREATE INDEX idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);

-- 项目表索引
CREATE INDEX idx_projects_created_by ON public.projects(created_by);
CREATE INDEX idx_projects_is_active ON public.projects(is_active);

-- 测试用例表索引
CREATE INDEX idx_test_cases_project_id ON public.test_cases(project_id);
CREATE INDEX idx_test_cases_module_id ON public.test_cases(module_id);
CREATE INDEX idx_test_case_case_id ON public.test_cases(case_id);
CREATE INDEX idx_test_cases_tags ON public.test_cases USING GIN(tags);
CREATE INDEX idx_test_cases_is_active ON public.test_cases(is_active);

-- 测试执行表索引
CREATE INDEX idx_test_executions_project_id ON public.test_executions(project_id);
CREATE INDEX idx_test_executions_status ON public.test_executions(status);
CREATE INDEX idx_test_executions_started_at ON public.test_executions(started_at);

-- 测试结果表索引
CREATE INDEX idx_test_results_execution_id ON public.test_results(execution_id);
CREATE INDEX idx_test_results_test_case_id ON public.test_results(test_case_id);
CREATE INDEX idx_test_results_status ON public.test_results(status);
CREATE INDEX idx_test_results_created_at ON public.test_results(created_at);

-- 配置表索引
CREATE INDEX idx_project_configs_project_key ON public.project_configs(project_id, config_key);

-- =============================================
-- 8. 初始数据
-- =============================================

-- 插入全局默认配置
INSERT INTO public.global_configs (config_key, config_value, description) VALUES
('default_timeout', '30', '默认请求超时时间（秒）'),
('max_retries', '3', '最大重试次数'),
('default_headers', '{"Content-Type": "application/json", "Accept": "application/json"}', '默认请求头'),
('report_retention_days', '90', '报告保留天数'),
('enable_performance_monitoring', 'true', '是否启用性能监控');

-- =============================================
-- 9. 更新时间戳触发器函数
-- =============================================

-- 更新时间戳触发器函数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 应用更新时间戳触发器
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_test_cases_updated_at
    BEFORE UPDATE ON public.test_cases
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_configs_updated_at
    BEFORE UPDATE ON public.project_configs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 10. 视图定义 (简化版本)
-- =============================================

-- 项目统计视图 (简化版本，不依赖可能不存在的表)
CREATE VIEW public.project_stats AS
SELECT
    p.id,
    p.name,
    p.created_at,
    p.is_active
FROM public.projects p;

-- =============================================
-- 11. 基础安全设置 (可选，根据需要启用)
-- =============================================

-- 注意：以下 RLS 策略是可选的，你可以根据需要启用
-- 如果启用，需要确保 auth.users 表中有数据

/*
-- 启用 RLS
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
*/