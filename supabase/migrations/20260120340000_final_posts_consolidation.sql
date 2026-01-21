-- Final migration to consolidate everything into posts table - FIXED
-- Created: 2026-01-20

-- Step 1: Drop existing functions first
DROP FUNCTION IF EXISTS public.get_user_feed_activities(uuid, integer, integer);
DROP FUNCTION IF EXISTS public.get_public_feed_activities(uuid, integer, integer);

-- Step 2: Redefine get_user_feed_activities to use posts table
CREATE OR REPLACE FUNCTION public.get_user_feed_activities(
    p_user_id uuid,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
) RETURNS SETOF public.posts AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.posts
    WHERE (
        user_id = p_user_id 
        OR visibility = 'public'
    )
    AND publish_status = 'published'
    ORDER BY created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Redefine get_public_feed_activities to use posts table
CREATE OR REPLACE FUNCTION public.get_public_feed_activities(
    p_current_user_id uuid,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
) RETURNS SETOF public.posts AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.posts
    WHERE visibility = 'public'
    AND publish_status = 'published'
    ORDER BY created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Redefine validate_activity_data trigger function for posts table
CREATE OR REPLACE FUNCTION public.validate_post_data() RETURNS trigger AS $$
BEGIN
    -- Validate visibility values
    IF NEW.visibility IS NOT NULL AND NEW.visibility NOT IN ('public', 'private', 'friends', 'group') THEN
        RAISE EXCEPTION 'Invalid visibility value: %', NEW.visibility;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Attach trigger to posts table
DROP TRIGGER IF EXISTS validate_post_data_trigger ON public.posts;
CREATE TRIGGER validate_post_data_trigger
    BEFORE INSERT OR UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_post_data();

-- Step 6: Remove triggers from activities table
DROP TRIGGER IF EXISTS validate_activity_data_trigger ON public.activities;
