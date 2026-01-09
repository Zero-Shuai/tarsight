-- 步骤 1: 创建基础表 (不包含外键约束)
-- 这��脚本会先创建所有表，然后再添加外键

-- 用户表 (不包含外键)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'tester' CHECK (role IN ('admin', 'tester', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 项目表 (不包含外键)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 环境表 (不包含外键)
CREATE TABLE IF NOT EXISTS public.environments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID,
    name VARCHAR(50) NOT NULL,
    base_url TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 模块表 (不包含外键)
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 测试用例表 (不包含外键)
CREATE TABLE IF NOT EXISTS public.test_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID,
    module_id UUID,
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
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 测试套件表 (不包含外键)
CREATE TABLE IF NOT EXISTS public.test_suites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    test_case_ids UUID[] DEFAULT '{}',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 测试执行表 (不包含外键)
CREATE TABLE IF NOT EXISTS public.test_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID,
    environment_id UUID,
    suite_id UUID,
    execution_name VARCHAR(200),
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    total_tests INTEGER DEFAULT 0,
    passed_tests INTEGER DEFAULT 0,
    failed_tests INTEGER DEFAULT 0,
    skipped_tests INTEGER DEFAULT 0,
    total_duration DECIMAL(10,3),
    started_by UUID,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT
);

-- 测试结果表 (不包含外键)
CREATE TABLE IF NOT EXISTS public.test_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    execution_id UUID,
    test_case_id UUID,
    status VARCHAR(20) NOT NULL CHECK (status IN ('passed', 'failed', 'skipped', 'error')),
    duration DECIMAL(10,3),
    error_message TEXT,
    request_info JSONB,
    response_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 项目配置表 (不包含外键)
CREATE TABLE IF NOT EXISTS public.project_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID,
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- 通知配置表 (不包含外键)
CREATE TABLE IF NOT EXISTS public.notification_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID,
    notification_type VARCHAR(50) NOT NULL,
    config JSONB NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加唯一约束
ALTER TABLE public.test_cases ADD CONSTRAINT IF NOT EXISTS unique_test_case
    UNIQUE(project_id, module_id, case_id);

ALTER TABLE public.project_configs ADD CONSTRAINT IF NOT EXISTS unique_project_config
    UNIQUE(project_id, config_key);