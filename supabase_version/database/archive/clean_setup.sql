-- 清理的数据库设置 - 逐个创建表，避免语法错误

-- 1. 先创建全局配置表
CREATE TABLE public.global_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建项目表
CREATE TABLE public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建模块表
CREATE TABLE public.modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建测试用例表
CREATE TABLE public.test_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID,
    module_id UUID,
    case_id VARCHAR(20) NOT NULL,
    test_name VARCHAR(200) NOT NULL,
    description TEXT,
    method VARCHAR(10) NOT NULL,
    url TEXT NOT NULL,
    request_body JSONB,
    expected_status INTEGER DEFAULT 200,
    headers JSONB,
    variables JSONB,
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 插入初始数据
INSERT INTO public.global_configs (config_key, config_value, description)
VALUES
    ('default_timeout', '30', '默认请求超时时间（秒）'),
    ('max_retries', '3', '最大重试次数'),
    ('default_headers', '{"Content-Type": "application/json", "Accept": "application/json"}', '默认请求头'),
    ('report_retention_days', '90', '报告保留天数'),
    ('enable_performance_monitoring', 'true', '是否启用性能监控');