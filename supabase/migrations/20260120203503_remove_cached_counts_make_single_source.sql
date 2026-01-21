-- Remove cached count columns to establish single source of truth
-- Engagement tables (likes, comments, shares, bookmarks) are the ONLY source of truth
-- Created: 2026-01-20

-- Step 1: Drop cached count columns from activities table
ALTER TABLE activities 
DROP COLUMN IF EXISTS share_count,
DROP COLUMN IF EXISTS view_count,
DROP COLUMN IF EXISTS bookmark_count,
DROP COLUMN IF EXISTS engagement_score;

-- Note: like_count and comment_count don't exist in live DB, so no need to drop them

-- Step 2: Fix update_engagement_score trigger function to NOT reference non-existent columns
-- Remove the trigger function since we're removing engagement_score column entirely
-- Engagement score will be calculated dynamically in application code
DROP FUNCTION IF EXISTS "public"."update_engagement_score"() CASCADE;

-- Step 3: Fix validate_activity_data trigger to NOT validate removed columns
CREATE OR REPLACE FUNCTION "public"."validate_activity_data"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SECURITY DEFINER
    AS $$
BEGIN
    -- Validate required fields
    IF NEW.text IS NULL AND NEW.content_type = 'text' THEN
        -- Allow text to be null for non-text content types
    END IF;
    
    -- Validate entity references
    IF NEW.entity_type IS NOT NULL AND NEW.entity_id IS NOT NULL THEN
        IF NOT public.entity_exists(NEW.entity_type, NEW.entity_id) THEN
            RAISE EXCEPTION 'Referenced entity does not exist: %/%', NEW.entity_type, NEW.entity_id;
        END IF;
    END IF;
    
    -- Note: No longer validating engagement counts - they are calculated dynamically from source of truth
    -- Engagement tables (likes, comments, shares, bookmarks) are the single source of truth
    -- Removed validation for: share_count, view_count, bookmark_count, engagement_score
    
    -- Validate visibility values
    IF NEW.visibility IS NOT NULL AND NEW.visibility NOT IN ('public', 'private', 'friends') THEN
        RAISE EXCEPTION 'Invalid visibility value: %', NEW.visibility;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Step 4: Add comments for documentation
COMMENT ON FUNCTION "public"."validate_activity_data"() IS 'Validates activity data. Engagement counts are no longer cached - they are calculated dynamically from engagement tables (likes, comments, shares, bookmarks) which are the single source of truth.';

-- Step 5: Log migration results
DO $$
BEGIN
    RAISE NOTICE 'Migration complete: Removed cached count columns from activities table';
    RAISE NOTICE '  - Removed: share_count, view_count, bookmark_count, engagement_score';
    RAISE NOTICE '  - Engagement tables (likes, comments, shares, bookmarks) are now the single source of truth';
    RAISE NOTICE '  - All engagement counts must be calculated dynamically from engagement tables';
    RAISE NOTICE '✓ Using Supabase engagement tables as single source of truth';
END $$;
