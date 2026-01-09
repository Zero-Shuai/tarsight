-- ============================================================================
-- Migration: Add level and assertions columns to test_cases table
-- Date: 2026-01-08
-- Purpose: Fix schema mismatch error when saving test cases
-- ============================================================================

-- Add level column (priority field)
ALTER TABLE public.test_cases
ADD COLUMN IF NOT EXISTS level VARCHAR(5)
CHECK (level IN ('P0', 'P1', 'P2', 'P3'));

COMMENT ON COLUMN public.test_cases.level IS 'Test case priority level: P0=Critical, P1=High, P2=Medium, P3=Low';

-- Set default value for existing records
UPDATE public.test_cases
SET level = 'P2'
WHERE level IS NULL;

-- Add assertions column (validation rules)
ALTER TABLE public.test_cases
ADD COLUMN IF NOT EXISTS assertions JSONB;

COMMENT ON COLUMN public.test_cases.assertions IS 'Assertion rules for validating test responses (JSON format)';

-- Verification query
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '   - Added level column (VARCHAR(5)) with CHECK constraint';
    RAISE NOTICE '   - Added assertions column (JSONB)';
    RAISE NOTICE '   - Set default level=P2 for existing records';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next: Restart your development server';
END $$;
