-- Update validate_activity_data to support followers visibility
-- Created: 2026-01-21

CREATE OR REPLACE FUNCTION "public"."validate_activity_data"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SECURITY DEFINER
    AS $$
BEGIN
    -- Validate required fields
    IF NEW.content IS NULL AND NEW.content_type = 'text' THEN
        -- Allow content to be null for non-text content types
    END IF;
    
    -- Validate entity references
    IF NEW.entity_type IS NOT NULL AND NEW.entity_id IS NOT NULL THEN
        IF NOT public.entity_exists(NEW.entity_type, NEW.entity_id) THEN
            RAISE EXCEPTION 'Referenced entity does not exist: %/%', NEW.entity_type, NEW.entity_id;
        END IF;
    END IF;
    
    -- Note: Engagement counts are calculated dynamically from engagement tables
    -- Engagement tables (likes, comments, shares, bookmarks) are the single source of truth
    
    -- Validate visibility values
    IF NEW.visibility IS NOT NULL AND NEW.visibility NOT IN ('public', 'private', 'friends', 'followers') THEN
        RAISE EXCEPTION 'Invalid visibility value: %', NEW.visibility;
    END IF;
    
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION "public"."validate_activity_data"() IS 'Validates activity data. Engagement counts are calculated dynamically; visibility supports public, private, friends, followers.';
