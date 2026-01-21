-- Fix triggers to match LIVE database schema (using Supabase as single source of truth)
-- Removes references to like_count and comment_count columns that don't exist in LIVE database
-- Created: 2026-01-20

-- Step 1: Fix update_engagement_score trigger to only use existing columns
CREATE OR REPLACE FUNCTION "public"."update_engagement_score"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Only use columns that exist in LIVE database: share_count, view_count
  -- Note: like_count and comment_count do NOT exist in LIVE database
  NEW.engagement_score = calculate_engagement_score(
    0, -- like_count (not in database, use 0)
    0, -- comment_count (not in database, use 0)
    COALESCE(NEW.share_count, 0),
    COALESCE(NEW.view_count, 0)
  );
  RETURN NEW;
END;
$$;

-- Step 2: Fix validate_activity_data trigger to only validate existing columns
CREATE OR REPLACE FUNCTION "public"."validate_activity_data"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SECURITY DEFINER
    AS $$
BEGIN
    -- Validate required fields
    IF NEW.text IS NULL AND NEW.content_type = 'text' THEN
        RAISE EXCEPTION 'Text content is required for text type activities';
    END IF;
    
    -- Validate entity references
    IF NEW.entity_type IS NOT NULL AND NEW.entity_id IS NOT NULL THEN
        IF NOT public.entity_exists(NEW.entity_type, NEW.entity_id) THEN
            RAISE EXCEPTION 'Referenced entity does not exist: %/%', NEW.entity_type, NEW.entity_id;
        END IF;
    END IF;
    
    -- Validate engagement counts are non-negative (only for columns that exist in LIVE database)
    -- Note: like_count and comment_count do NOT exist in LIVE database
    IF NEW.share_count < 0 THEN
        RAISE EXCEPTION 'Engagement counts cannot be negative';
    END IF;
    
    -- Validate visibility values
    IF NEW.visibility IS NOT NULL AND NEW.visibility NOT IN ('public', 'private', 'friends') THEN
        RAISE EXCEPTION 'Invalid visibility value: %', NEW.visibility;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Step 3: Add comments for documentation
COMMENT ON FUNCTION "public"."update_engagement_score"() IS 'Updates engagement_score based on existing columns only (share_count, view_count). Note: like_count and comment_count do not exist in LIVE database.';
COMMENT ON FUNCTION "public"."validate_activity_data"() IS 'Validates activity data using only columns that exist in LIVE database. Note: like_count and comment_count validations removed as they do not exist in database.';

-- Step 4: Log migration results
DO $$
BEGIN
    RAISE NOTICE 'Triggers updated to match LIVE database schema:';
    RAISE NOTICE '  - update_engagement_score: Fixed to not reference like_count and comment_count';
    RAISE NOTICE '  - validate_activity_data: Fixed to not validate like_count and comment_count';
    RAISE NOTICE '✓ Using Supabase LIVE database as single source of truth';
END $$;
