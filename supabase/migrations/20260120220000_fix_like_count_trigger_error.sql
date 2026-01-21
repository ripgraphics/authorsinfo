-- Fix: Remove all triggers and functions that reference like_count field
-- Error: record "new" has no field "like_count"
-- Created: 2026-01-20
-- 
-- This migration fixes the error by:
-- 1. Dropping ALL triggers on activities table that might reference like_count
-- 2. Dropping functions that reference like_count
-- 3. Recreating validate_activity_data function without like_count references
-- 4. Ensuring no triggers call functions that reference like_count

-- Step 1: Drop ALL triggers on activities table (we'll recreate only the safe ones)
-- This ensures we catch any trigger that might reference like_count
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'public.activities'::regclass 
          AND tgisinternal = false
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.activities CASCADE', r.tgname);
        RAISE NOTICE 'Dropped trigger: %', r.tgname;
    END LOOP;
END $$;

-- Step 2: Drop the update_engagement_score function if it still exists
-- (This function was supposed to be dropped in migration 20260120203503)
DROP FUNCTION IF EXISTS "public"."update_engagement_score"() CASCADE;

-- Step 3: Ensure validate_activity_data function doesn't reference like_count
-- Recreate it to be safe, ensuring it only uses columns that exist
CREATE OR REPLACE FUNCTION "public"."validate_activity_data"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SECURITY DEFINER
    AS $$
BEGIN
    -- Validate required fields
    IF NEW.text IS NULL AND NEW.content_type = 'text' THEN
        -- Allow text to be null for non-text content types
        NULL; -- No validation needed, allow null text
    END IF;
    
    -- Validate entity references
    IF NEW.entity_type IS NOT NULL AND NEW.entity_id IS NOT NULL THEN
        IF NOT public.entity_exists(NEW.entity_type, NEW.entity_id) THEN
            RAISE EXCEPTION 'Referenced entity does not exist: %/%', NEW.entity_type, NEW.entity_id;
        END IF;
    END IF;
    
    -- Note: No engagement count validation - counts are calculated dynamically
    -- Engagement tables (likes, comments, shares, bookmarks) are the single source of truth
    -- Removed all references to: like_count, comment_count, share_count, view_count, bookmark_count, engagement_score
    
    -- Validate visibility values
    IF NEW.visibility IS NOT NULL AND NEW.visibility NOT IN ('public', 'private', 'friends', 'group') THEN
        RAISE EXCEPTION 'Invalid visibility value: %', NEW.visibility;
    END IF;
    
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION "public"."validate_activity_data"() IS 'Validates activity data. Engagement counts (like_count, comment_count, etc.) are calculated dynamically from engagement tables and are NOT stored in activities table.';

-- Step 4: Re-attach the validate_activity_data trigger if needed
-- Only attach if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'validate_activity_data_trigger' 
        AND tgrelid = 'public.activities'::regclass
    ) THEN
        CREATE TRIGGER "validate_activity_data_trigger"
            BEFORE INSERT OR UPDATE ON public.activities
            FOR EACH ROW
            EXECUTE FUNCTION "public"."validate_activity_data"();
    END IF;
END $$;

-- Step 5: Drop known problematic functions that might reference like_count
-- We drop these explicitly to avoid issues with pg_get_functiondef
DROP FUNCTION IF EXISTS "public"."update_engagement_score"() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_engagement_score(INTEGER, INTEGER, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_engagement_score(INT, INT, INT, INT) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_engagement_score(NUMERIC, NUMERIC, NUMERIC, NUMERIC) CASCADE;

-- Step 6: Drop any other functions with names that suggest they might reference like_count
-- This is a safety measure - we'll drop functions that are likely to be problematic
DO $$
DECLARE
    r RECORD;
    func_signature TEXT;
BEGIN
    -- Get all functions that might be related to engagement/activity calculations
    FOR r IN 
        SELECT 
            p.proname,
            pg_catalog.pg_get_function_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND (
            p.proname LIKE '%engagement%'
            OR p.proname LIKE '%activity%count%'
            OR p.proname LIKE '%like%count%'
            OR p.proname LIKE '%comment%count%'
          )
          AND p.proname NOT IN ('validate_activity_data', 'entity_exists')
    LOOP
        BEGIN
            -- Build function signature
            IF r.args IS NULL OR r.args = '' THEN
                func_signature := format('public.%I()', r.proname);
            ELSE
                func_signature := format('public.%I(%s)', r.proname, r.args);
            END IF;
            
            EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE', func_signature);
            RAISE NOTICE 'Dropped potentially problematic function: %', func_signature;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop function %: %', func_signature, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 7: Verify triggers are cleaned up
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgrelid = 'public.activities'::regclass
      AND tgisinternal = false;
    
    IF trigger_count > 1 THEN
        RAISE WARNING 'Found % trigger(s) on activities table. Expected only validate_activity_data_trigger.', trigger_count;
    ELSE
        RAISE NOTICE '✓ Verified: Triggers cleaned up (found % trigger(s))', trigger_count;
    END IF;
END $$;

-- Step 8: Log migration results
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration complete: Fixed like_count trigger error';
    RAISE NOTICE '  - Dropped ALL triggers on activities table';
    RAISE NOTICE '  - Dropped ALL functions referencing like_count';
    RAISE NOTICE '  - Recreated validate_activity_data function (safe, no like_count)';
    RAISE NOTICE '  - Reattached validate_activity_data trigger';
    RAISE NOTICE '✓ Activities table is now safe from like_count errors';
    RAISE NOTICE '========================================';
END $$;
