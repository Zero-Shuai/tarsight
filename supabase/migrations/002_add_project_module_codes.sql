-- Migration: Add project_code and module_code fields
-- Version: 002
-- Date: 2026-01-06
-- Description: Add code fields to projects and modules tables, extend case_id length
--              and create auto-generation functions

-- =====================================================
-- Step 1: Add project_code to projects table
-- =====================================================

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS project_code VARCHAR(20);

-- Add unique constraint for project_code
ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS projects_project_code_key;
ALTER TABLE public.projects
ADD CONSTRAINT projects_project_code_key UNIQUE (project_code);

-- Add comment
COMMENT ON COLUMN public.projects.project_code IS 'Project code in alphanumeric format, starting with a letter (e.g., PRJ001, TARSIGHT)';

-- =====================================================
-- Step 2: Add module_code to modules table
-- =====================================================

ALTER TABLE public.modules
ADD COLUMN IF NOT EXISTS module_code VARCHAR(20);

-- Add unique constraint for module_code within each project
ALTER TABLE public.modules
DROP CONSTRAINT IF EXISTS modules_module_code_key;
ALTER TABLE public.modules
ADD CONSTRAINT modules_project_module_code_key UNIQUE (project_id, module_code);

-- Add comment
COMMENT ON COLUMN public.modules.module_code IS 'Module code in alphanumeric format, starting with a letter (e.g., MOD001, CREATORLIST), unique within project';

-- =====================================================
-- Step 3: Extend case_id length in test_cases table
-- =====================================================

ALTER TABLE public.test_cases
ALTER COLUMN case_id TYPE VARCHAR(50);

-- Update comment
COMMENT ON COLUMN public.test_cases.case_id IS 'Test case ID in format PROJECT_CODE-MODULE_CODE-SEQUENCE (e.g., PROJECT-CODE-001 or TARSIGHT-CREATORLIST-001)';

-- =====================================================
-- Step 4: Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_projects_project_code ON public.projects(project_code);
CREATE INDEX IF NOT EXISTS idx_modules_project_module_code ON public.modules(project_id, module_code);

-- =====================================================
-- Step 5: Create auto-generation functions
-- =====================================================

-- Function to generate next sequence number for a module
CREATE OR REPLACE FUNCTION public.generate_next_case_sequence(
    p_project_id UUID,
    p_module_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_max_sequence INTEGER;
    v_next_sequence INTEGER;
BEGIN
    -- Get the maximum sequence number for this module
    SELECT COALESCE(MAX(
        CASE
            WHEN case_id ~ '^[A-Za-z][A-Za-z0-9]{0,19}-[A-Za-z][A-Za-z0-9]{0,19}-\d{3}$'
            THEN CAST(REGEXP_REPLACE(case_id, '.*-', '') AS INTEGER)
            ELSE 0
        END
    ), 0)
    INTO v_max_sequence
    FROM public.test_cases
    WHERE project_id = p_project_id
      AND module_id = p_module_id
      AND case_id ~ '^[A-Za-z][A-Za-z0-9]{0,19}-[A-Za-z][A-Za-z0-9]{0,19}-\d{3}$';

    -- Increment sequence
    v_next_sequence := v_max_sequence + 1;

    RETURN v_next_sequence;
END;
$$ LANGUAGE plpgsql;

-- Function to generate full case ID
CREATE OR REPLACE FUNCTION public.generate_case_id(
    p_project_id UUID,
    p_module_id UUID
)
RETURNS VARCHAR(50) AS $$
DECLARE
    v_project_code VARCHAR(20);
    v_module_code VARCHAR(20);
    v_sequence INTEGER;
    v_case_id VARCHAR(50);
BEGIN
    -- Get project code
    SELECT project_code INTO v_project_code
    FROM public.projects
    WHERE id = p_project_id;

    IF v_project_code IS NULL THEN
        RAISE EXCEPTION 'Project code not found for project %', p_project_id;
    END IF;

    -- Get module code
    SELECT module_code INTO v_module_code
    FROM public.modules
    WHERE id = p_module_id;

    IF v_module_code IS NULL THEN
        RAISE EXCEPTION 'Module code not found for module %', p_module_id;
    END IF;

    -- Get next sequence
    v_sequence := public.generate_next_case_sequence(p_project_id, p_module_id);

    -- Format: PROJECT_CODE-MODULE_CODE-001 (zero-padded to 3 digits)
    v_case_id := format('%s-%s-%s', v_project_code, v_module_code, LPAD(v_sequence::TEXT, 3, '0'));

    RETURN v_case_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments for functions
COMMENT ON FUNCTION public.generate_case_id IS 'Generate auto-incrementing case ID in format PROJECT_CODE-MODULE_CODE-001';
COMMENT ON FUNCTION public.generate_next_case_sequence IS 'Get next sequence number for test cases within a module using the current project/module code format';

-- =====================================================
-- Step 6: Success message
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration 002 completed successfully!';
    RAISE NOTICE '   - Added project_code field to projects table';
    RAISE NOTICE '   - Added module_code field to modules table';
    RAISE NOTICE '   - Extended case_id field to VARCHAR(50)';
    RAISE NOTICE '   - Created indexes for performance';
    RAISE NOTICE '   - Created auto-generation functions';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next steps:';
    RAISE NOTICE '   1. Run migration 003 to migrate existing data';
    RAISE NOTICE '   2. Update frontend to use new codes';
END $$;
