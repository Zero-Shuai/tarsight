-- ============================================================================
-- Migration 004: 更新项目/模块编号验证规则
-- Created: 2026-01-06
-- Description: 支持自定义编号，不限制为 PRJ/MOD 前缀；允许纯英文或英文+数字
-- ============================================================================

-- 1. 添加 CHECK 约束到 projects 表
ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS projects_project_code_check;

ALTER TABLE public.projects
ADD CONSTRAINT projects_project_code_check
CHECK (
  project_code ~ '^[A-Za-z][A-Za-z0-9]{0,19}$'
);

COMMENT ON COLUMN public.projects.project_code IS
'项目编号：1-20位字符，必须以字母开头，可包含数字';

-- 2. 添加 CHECK 约束到 modules 表
ALTER TABLE public.modules
DROP CONSTRAINT IF EXISTS modules_module_code_check;

ALTER TABLE public.modules
ADD CONSTRAINT modules_module_code_check
CHECK (
  module_code ~ '^[A-Za-z][A-Za-z0-9]{0,19}$'
);

COMMENT ON COLUMN public.modules.module_code IS
'模块编号：1-20位字符，必须以字母开头，可包含数字';

-- 3. 验证现有数据（检查是否有不符合新规则的数据）
DO $$
DECLARE
  invalid_project_count INTEGER;
  invalid_module_count INTEGER;
BEGIN
  -- 检查项目编号
  SELECT COUNT(*) INTO invalid_project_count
  FROM public.projects
  WHERE project_code !~ '^[A-Za-z][A-Za-z0-9]{0,19}$';

  -- 检查模块编号
  SELECT COUNT(*) INTO invalid_module_count
  FROM public.modules
  WHERE module_code !~ '^[A-Za-z][A-Za-z0-9]{0,19}$';

  RAISE NOTICE '✅ Migration 004 执行完成';
  RAISE NOTICE '📊 验证结果:';
  RAISE NOTICE '   - 不符合新规则的项目: %', invalid_project_count;
  RAISE NOTICE '   - 不符合新规则的模块: %', invalid_module_count;

  IF invalid_project_count = 0 AND invalid_module_count = 0 THEN
    RAISE NOTICE '🎉 所有现有数据都符合新规则！';
  END IF;

  IF invalid_project_count > 0 OR invalid_module_count > 0 THEN
    RAISE WARNING '⚠️  存在不符合新规则的编号，请手动修复';
  END IF;
END $$;

-- 4. 更新测试用例ID的注释（说明支持新格式）
COMMENT ON COLUMN public.test_cases.case_id IS
'测试用例ID：格式为 {项目编号}-{模块编号}-{3位序号}（项目编号和模块编号支持纯英文或英文+数字组合）';
