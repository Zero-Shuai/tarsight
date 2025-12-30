-- 步骤 3: 添加索引
-- 在成功创建表和外键之后运行这个脚本

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- 项目表索引
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_is_active ON public.projects(is_active);

-- 测试用例表索引
CREATE INDEX IF NOT EXISTS idx_test_cases_project_id ON public.test_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_module_id ON public.test_cases(module_id);
CREATE INDEX IF NOT EXISTS idx_test_case_case_id ON public.test_cases(case_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_tags ON public.test_cases USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_test_cases_is_active ON public.test_cases(is_active);

-- 测试执行表索引
CREATE INDEX IF NOT EXISTS idx_test_executions_project_id ON public.test_executions(project_id);
CREATE INDEX IF NOT EXISTS idx_test_executions_status ON public.test_executions(status);
CREATE INDEX IF NOT EXISTS idx_test_executions_started_at ON public.test_executions(started_at);

-- 测试结果表索引
CREATE INDEX IF NOT EXISTS idx_test_results_execution_id ON public.test_results(execution_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_case_id ON public.test_results(test_case_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON public.test_results(status);
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON public.test_results(created_at);

-- 配置表索引
CREATE INDEX IF NOT EXISTS idx_project_configs_project_key ON public.project_configs(project_id, config_key);