-- Migration: Migrate existing data to new ID format
-- Version: 003
-- Date: 2026-01-06
-- Description: Generate project_code and module_code, migrate existing test_cases to new format
-- WARNING: This migration will modify all existing test case IDs

-- =====================================================
-- Step 1: Backup existing data
-- =====================================================

CREATE TABLE IF NOT EXISTS public.test_cases_backup_20260106 AS
SELECT * FROM public.test_cases;

CREATE TABLE IF NOT EXISTS public.modules_backup_20260106 AS
SELECT * FROM public.modules;

CREATE TABLE IF NOT EXISTS public.projects_backup_20260106 AS
SELECT * FROM public.projects;

DO $$
BEGIN
    RAISE NOTICE '✅ Backup tables created';
    RAISE NOTICE '   - test_cases_backup_20260106';
    RAISE NOTICE '   - modules_backup_20260106';
    RAISE NOTICE '   - projects_backup_20260106';
END $$;

-- =====================================================
-- Step 2: Generate project codes for existing projects
-- Format: PRJ001, PRJ002, etc. based on creation order
-- =====================================================

WITH ranked_projects AS (
    SELECT
        id,
        'PRJ' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 3, '0') AS project_code
    FROM public.projects
    WHERE project_code IS NULL OR project_code = ''
)
UPDATE public.projects p
SET project_code = rp.project_code
FROM ranked_projects rp
WHERE p.id = rp.id;

DO $$
BEGIN
    RAISE NOTICE '✅ Project codes generated';
END $$;

-- =====================================================
-- Step 3: Generate module codes for existing modules
-- Format: MOD001, MOD002, etc. (per project)
-- =====================================================

WITH ranked_modules AS (
    SELECT
        id,
        project_id,
        'MOD' || LPAD(ROW_NUMBER() OVER (
            PARTITION BY project_id
            ORDER BY created_at
        )::TEXT, 3, '0') AS module_code
    FROM public.modules
    WHERE module_code IS NULL OR module_code = ''
)
UPDATE public.modules m
SET module_code = rm.module_code
FROM ranked_modules rm
WHERE m.id = rm.id;

DO $$
BEGIN
    RAISE NOTICE '✅ Module codes generated';
END $$;

-- =====================================================
-- Step 4: Migrate existing test_cases to new format
-- Format: PRJ001-MOD001-001
-- =====================================================

WITH migrated_cases AS (
    SELECT
        tc.id,
        p.project_code,
        m.module_code,
        ROW_NUMBER() OVER (
            PARTITION BY tc.project_id, tc.module_id
            ORDER BY tc.created_at
        ) AS new_sequence
    FROM public.test_cases tc
    JOIN public.projects p ON tc.project_id = p.id
    JOIN public.modules m ON tc.module_id = m.id
    WHERE tc.case_id NOT ~ '^PRJ\d{3}-MOD\d{3}-\d{3}$'
)
UPDATE public.test_cases tc
SET case_id = format('%s-%s-%03d', mc.project_code, mc.module_code, mc.new_sequence)
FROM migrated_cases mc
WHERE tc.id = mc.id;

DO $$
BEGIN
    RAISE NOTICE '✅ Test case IDs migrated to new format';
END $$;

-- =====================================================
-- Step 5: Add NOT NULL constraints
-- =====================================================

ALTER TABLE public.projects
ALTER COLUMN project_code SET NOT NULL;

ALTER TABLE public.modules
ALTER COLUMN module_code SET NOT NULL;

DO $$
BEGIN
    RAISE NOTICE '✅ NOT NULL constraints added';
END $$;

-- =====================================================
-- Step 6: Create mapping table for reference (optional)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.case_id_mapping (
    old_case_id VARCHAR(50),
    new_case_id VARCHAR(50),
    migration_date TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (old_case_id)
);

DO $$
BEGIN
    RAISE NOTICE '✅ Case ID mapping table created';
END $$;

-- =====================================================
-- Step 7: Verification queries
-- =====================================================

DO $$
DECLARE
    v_project_count INTEGER;
    v_module_count INTEGER;
    v_case_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_project_count FROM public.projects;
    SELECT COUNT(*) INTO v_module_count FROM public.modules;
    SELECT COUNT(*) INTO v_case_count FROM public.test_cases;

    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '       MIGRATION SUMMARY';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '📊 Migration Statistics:';
    RAISE NOTICE '   Total Projects: %', v_project_count;
    RAISE NOTICE '   Total Modules: %', v_module_count;
    RAISE NOTICE '   Total Test Cases: %', v_case_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Migration 003 completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Important Notes:';
    RAISE NOTICE '   1. All tables have been backed up with _backup_20260106 suffix';
    RAISE NOTICE '   2. Project codes generated: PRJ001, PRJ002, etc.';
    RAISE NOTICE '   3. Module codes generated: MOD001, MOD002, etc.';
    RAISE NOTICE '   4. Test case IDs migrated: PRJ001-MOD001-001 format';
    RAISE NOTICE '   5. A mapping table has been created for reference';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Rollback Information:';
    RAISE NOTICE '   If you need to rollback, use the backup tables:';
    RAISE NOTICE '   - test_cases_backup_20260106';
    RAISE NOTICE '   - modules_backup_20260106';
    RAISE NOTICE '   - projects_backup_20260106';
    RAISE NOTICE '════════════════════════════════════════';
END $$;
