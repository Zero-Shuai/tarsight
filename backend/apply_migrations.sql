-- ============================================================================
-- 快速应用迁移：添加 project_code 和 module_code 字段
-- 执行步骤：复制整个文件到 Supabase SQL Editor 中执行
-- ============================================================================

-- Step 1: 添加 project_code 到 projects 表
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS project_code VARCHAR(20);

COMMENT ON COLUMN public.projects.project_code IS '项目编号：1-20位字符，必须以字母开头，可包含数字';

-- Step 2: 添加 module_code 到 modules 表
ALTER TABLE public.modules
ADD COLUMN IF NOT EXISTS module_code VARCHAR(20);

COMMENT ON COLUMN public.modules.module_code IS '模块编号：1-20位字符，必须以字母开头，可包含数字';

-- Step 3: 添加约束（允许纯英文或英文+数字）
ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS projects_project_code_check;

ALTER TABLE public.projects
ADD CONSTRAINT projects_project_code_check
CHECK (project_code ~ '^[A-Za-z][A-Za-z0-9]{0,19}$');

ALTER TABLE public.modules
DROP CONSTRAINT IF EXISTS modules_module_code_check;

ALTER TABLE public.modules
ADD CONSTRAINT modules_module_code_check
CHECK (module_code ~ '^[A-Za-z][A-Za-z0-9]{0,19}$');

-- Step 4: 验证
DO $$
BEGIN
    RAISE NOTICE '✅ 迁移执行完成！';
    RAISE NOTICE '   - project_code 字段已添加到 projects 表';
    RAISE NOTICE '   - module_code 字段已添加到 modules 表';
    RAISE NOTICE '   - 编号格式规则：必须以字母开头，可包含数字';
    RAISE NOTICE '';
    RAISE NOTICE '📝 下一步：';
    RAISE NOTICE '   1. 在项目管理页面设置项目编号（如：PRJ001）';
    RAISE NOTICE '   2. 在模块管理页面设置模块编号（如：MOD001, MOD002）';
END $$;
