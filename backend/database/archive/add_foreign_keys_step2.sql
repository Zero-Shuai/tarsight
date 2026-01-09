-- 步骤 2: 添加外键约束
-- 在成功创建表之后运行这个脚本

-- 注意：如果某些表还不存在，外键约束会创建失败
-- 请确保先成功运行了 create_tables_step1.sql

-- 添加外键约束
ALTER TABLE public.user_profiles
    ADD CONSTRAINT IF NOT EXISTS fk_user_profiles_auth_users
    FOREIGN KEY (id) REFERENCES auth.users(id);

ALTER TABLE public.projects
    ADD CONSTRAINT IF NOT EXISTS fk_projects_created_by
    FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);

ALTER TABLE public.environments
    ADD CONSTRAINT IF NOT EXISTS fk_environments_project_id
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.modules
    ADD CONSTRAINT IF NOT EXISTS fk_modules_project_id
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.test_cases
    ADD CONSTRAINT IF NOT EXISTS fk_test_cases_project_id
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.test_cases
    ADD CONSTRAINT IF NOT EXISTS fk_test_cases_module_id
    FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;

ALTER TABLE public.test_cases
    ADD CONSTRAINT IF NOT EXISTS fk_test_cases_created_by
    FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);

ALTER TABLE public.test_suites
    ADD CONSTRAINT IF NOT EXISTS fk_test_suites_project_id
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.test_suites
    ADD CONSTRAINT IF NOT EXISTS fk_test_suites_created_by
    FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);

ALTER TABLE public.test_executions
    ADD CONSTRAINT IF NOT EXISTS fk_test_executions_project_id
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.test_executions
    ADD CONSTRAINT IF NOT EXISTS fk_test_executions_environment_id
    FOREIGN KEY (environment_id) REFERENCES public.environments(id);

ALTER TABLE public.test_executions
    ADD CONSTRAINT IF NOT EXISTS fk_test_executions_suite_id
    FOREIGN KEY (suite_id) REFERENCES public.test_suites(id) ON DELETE SET NULL;

ALTER TABLE public.test_executions
    ADD CONSTRAINT IF NOT EXISTS fk_test_executions_started_by
    FOREIGN KEY (started_by) REFERENCES public.user_profiles(id);

ALTER TABLE public.test_results
    ADD CONSTRAINT IF NOT EXISTS fk_test_results_execution_id
    FOREIGN KEY (execution_id) REFERENCES public.test_executions(id) ON DELETE CASCADE;

ALTER TABLE public.test_results
    ADD CONSTRAINT IF NOT EXISTS fk_test_results_test_case_id
    FOREIGN KEY (test_case_id) REFERENCES public.test_cases(id);

ALTER TABLE public.project_configs
    ADD CONSTRAINT IF NOT EXISTS fk_project_configs_project_id
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.notification_configs
    ADD CONSTRAINT IF NOT EXISTS fk_notification_configs_project_id
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;