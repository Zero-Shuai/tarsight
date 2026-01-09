-- 添加测试执行相关的表

-- 测试执行表
CREATE TABLE IF NOT EXISTS public.test_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID,
    execution_name VARCHAR(200),
    status VARCHAR(20) DEFAULT 'running',
    total_tests INTEGER DEFAULT 0,
    passed_tests INTEGER DEFAULT 0,
    failed_tests INTEGER DEFAULT 0,
    skipped_tests INTEGER DEFAULT 0,
    total_duration DECIMAL(10,3),
    started_by UUID,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT
);

-- 测试结果表
CREATE TABLE IF NOT EXISTS public.test_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    execution_id UUID,
    test_case_id UUID,
    status VARCHAR(20) NOT NULL,
    duration DECIMAL(10,3),
    error_message TEXT,
    request_info JSONB,
    response_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_test_executions_project_id ON public.test_executions(project_id);
CREATE INDEX IF NOT EXISTS idx_test_executions_status ON public.test_executions(status);
CREATE INDEX IF NOT EXISTS idx_test_executions_started_at ON public.test_executions(started_at);

CREATE INDEX IF NOT EXISTS idx_test_results_execution_id ON public.test_results(execution_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_case_id ON public.test_results(test_case_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON public.test_results(status);