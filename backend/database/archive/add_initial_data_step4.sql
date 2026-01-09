-- 步骤 4: 添加初始数据和触发器
-- 在成功创建表、外键和索引之后运行这个脚本

-- 插入全局默认配置
INSERT INTO public.global_configs (config_key, config_value, description) VALUES
('default_timeout', '30', '默认请求超时时间（秒）'),
('max_retries', '3', '最大重试次数'),
('default_headers', '{"Content-Type": "application/json", "Accept": "application/json"}', '默认请求头'),
('report_retention_days', '90', '报告保留天数'),
('enable_performance_monitoring', 'true', '是否启用性能监控')
ON CONFLICT (config_key) DO NOTHING;

-- 更新时间戳触发器函数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

-- 创建项目统计视图
CREATE OR REPLACE VIEW public.project_stats AS
SELECT
    p.id,
    p.name,
    p.created_at,
    p.is_active,
    COUNT(DISTINCT tc.id) as total_test_cases,
    COUNT(DISTINCT m.id) as total_modules,
    COUNT(DISTINCT te.id) as total_executions
FROM public.projects p
LEFT JOIN public.test_cases tc ON p.id = tc.project_id AND tc.is_active = true
LEFT JOIN public.modules m ON p.id = m.project_id
LEFT JOIN public.test_executions te ON p.id = te.project_id
GROUP BY p.id, p.name, p.created_at, p.is_active;