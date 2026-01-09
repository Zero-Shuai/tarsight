-- Migration 007: Enhanced Assertion System (v2.0)
-- This migration adds support for advanced assertions including status code,
-- response time, headers, JSON schema, and JavaScript assertions.

-- Step 1: Add new assertions column with JSONB type
ALTER TABLE public.test_cases
ADD COLUMN IF NOT EXISTS assertions JSONB;

-- Step 2: Add comment for documentation
COMMENT ON COLUMN public.test_cases.assertions IS
'Enhanced assertion rules v2.0 with support for status_code, response_time, headers, json_body, json_schema, and javascript assertions. Structure: {version: "2.0", stopOnFailure: boolean, assertions: Array}';

-- Step 3: Migrate existing validation_rules to new format
-- This converts the old validation_rules format to the new assertions format
UPDATE public.test_cases
SET assertions = CASE
    WHEN validation_rules IS NOT NULL AND validation_rules::text != '' THEN
        jsonb_build_object(
            'version', '2.0',
            'stopOnFailure', true,
            'assertions', CASE
                -- If validation_rules is already in array format
                WHEN jsonb_typeof(validation_rules) = 'array' THEN
                    validation_rules
                -- If validation_rules has the old structure with 'checks'
                WHEN validation_rules ? 'checks' THEN
                    (SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', gen_random_uuid()::text,
                            'type', 'json_body',
                            'enabled', true,
                            'critical', true,
                            'target', 'body',
                            'jsonPath', check_item->>'path',
                            'operator', check_item->>'operator',
                            'expectedValue', check_item->>'value'
                        )
                    )
                    FROM jsonb_array_elements(validation_rules->'checks') AS check_item)
                -- Fallback: treat as single json_body assertion
                ELSE
                    jsonb_build_array(
                        jsonb_build_object(
                            'id', gen_random_uuid()::text,
                            'type', 'json_body',
                            'enabled', true,
                            'critical', true,
                            'target', 'body',
                            'jsonPath', '$.code',
                            'operator', 'equals',
                            'expectedValue', validation_rules
                        )
                    )
            END
        )
    ELSE NULL
END
WHERE validation_rules IS NOT NULL
AND validation_rules::text != ''
AND assertions IS NULL;  -- Only migrate if not already migrated

-- Step 4: Add GIN index for better query performance on assertions
CREATE INDEX IF NOT EXISTS idx_test_cases_assertions
ON public.test_cases USING GIN (assertions);

-- Step 5: Add index on assertions for faster lookups by assertion type
CREATE INDEX IF NOT EXISTS idx_test_cases_assertions_type
ON public.test_cases USING GIN ((assertions->'assertions') jsonb_path_ops);

-- Step 6: Create a helper function to query test cases by assertion type
CREATE OR REPLACE FUNCTION get_test_cases_by_assertion_type(p_assertion_type TEXT)
RETURNS TABLE (
    id UUID,
    case_id VARCHAR,
    test_name VARCHAR,
    assertion_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        tc.id,
        tc.case_id,
        tc.test_name,
        jsonb_array_length(tc.assertions->'assertions') as assertion_count
    FROM public.test_cases tc
    WHERE tc.assertions IS NOT NULL
      AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements(tc.assertions->'assertions') as assertion
          WHERE assertion->>'type' = p_assertion_type
            AND assertion->>'enabled' = 'true'
      )
    ORDER BY tc.case_id;
END;
$$ LANGUAGE plpgsql;

-- Add comment for the helper function
COMMENT ON FUNCTION get_test_cases_by_assertion_type IS
'Returns all test cases that have at least one enabled assertion of the specified type';

-- Migration verification query (run this to verify the migration):
-- SELECT
--     COUNT(*) as total_test_cases,
--     COUNT(assertions) as cases_with_assertions,
--     COUNT(validation_rules) as cases_with_validation_rules
-- FROM public.test_cases;
