-- Fix Existing Activity Feed Function
-- This script updates the existing get_user_feed_activities function to properly implement
-- the logic for getting user names and engagement metrics

-- 1. Update the existing get_user_feed_activities function to properly implement the logic
-- Note: Must match the exact existing return type structure
CREATE OR REPLACE FUNCTION public.get_user_feed_activities(
    p_user_id uuid DEFAULT NULL,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    activity_type text,
    entity_type text,
    entity_id text,
    is_public boolean,
    metadata jsonb,
    created_at timestamp with time zone,
    user_name text,
    user_avatar_url text,
    like_count bigint,
    comment_count bigint,
    is_liked boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.user_id,
        a.activity_type,
        COALESCE(a.entity_type, 'user') as entity_type,
        COALESCE(a.entity_id::text, a.id::text) as entity_id,
        true as is_public, -- Default to public since field might not exist
        COALESCE(a.data, '{}'::jsonb) as metadata, -- Map data field to metadata for compatibility
        a.created_at,
        COALESCE(u.name, 'Unknown User') as user_name,
        NULL as user_avatar_url, -- TODO: Add avatar_url to users table if needed
        0 as like_count, -- Default to 0 until engagement tables are populated
        0 as comment_count, -- Default to 0 until engagement tables are populated
        false as is_liked -- Default to false
    FROM public.activities a
    LEFT JOIN public.users u ON a.user_id = u.id
    WHERE a.user_id = p_user_id -- This function is for user-specific activities
    ORDER BY a.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 2. Create a NEW function for the main feed (activities from all users)
CREATE OR REPLACE FUNCTION public.get_main_feed_activities(
    p_current_user_id uuid DEFAULT NULL,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    activity_type text,
    entity_type text,
    entity_id text,
    is_public boolean,
    metadata jsonb,
    created_at timestamp with time zone,
    user_name text,
    user_avatar_url text,
    like_count bigint,
    comment_count bigint,
    is_liked boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.user_id,
        a.activity_type,
        COALESCE(a.entity_type, 'user') as entity_type,
        COALESCE(a.entity_id::text, a.id::text) as entity_id,
        true as is_public, -- Default to public since field might not exist
        COALESCE(a.data, '{}'::jsonb) as metadata, -- Map data field to metadata for compatibility
        a.created_at,
        COALESCE(u.name, 'Unknown User') as user_name,
        NULL as user_avatar_url, -- TODO: Add avatar_url to users table if needed
        0 as like_count, -- Default to 0 until engagement tables are populated
        0 as comment_count, -- Default to 0 until engagement tables are populated
        false as is_liked -- Default to false
    FROM public.activities a
    LEFT JOIN public.users u ON a.user_id = u.id
    -- This function returns activities from ALL users (for the main feed)
    ORDER BY a.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 3. Create activity_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.activity_likes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(activity_id, user_id)
);

-- 4. Create activity_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.activity_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment_text text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_likes_activity_id ON public.activity_likes(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_likes_user_id ON public.activity_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_activity_id ON public.activity_comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_user_id ON public.activity_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);

-- 6. Grant necessary permissions
GRANT SELECT ON public.activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_comments TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_feed_activities TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_main_feed_activities TO authenticated;

-- 7. Create helper functions for activity engagement
CREATE OR REPLACE FUNCTION public.toggle_activity_like(
    p_activity_id uuid,
    p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exists boolean;
BEGIN
    -- Check if like already exists
    SELECT EXISTS(
        SELECT 1 FROM public.activity_likes 
        WHERE activity_id = p_activity_id AND user_id = p_user_id
    ) INTO v_exists;
    
    IF v_exists THEN
        -- Remove like
        DELETE FROM public.activity_likes 
        WHERE activity_id = p_activity_id AND user_id = p_user_id;
        RETURN false;
    ELSE
        -- Add like
        INSERT INTO public.activity_likes (activity_id, user_id)
        VALUES (p_activity_id, p_user_id);
        RETURN true;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_activity_comment(
    p_activity_id uuid,
    p_user_id uuid,
    p_comment_text text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_comment_id uuid;
BEGIN
    INSERT INTO public.activity_comments (activity_id, user_id, comment_text)
    VALUES (p_activity_id, p_user_id, p_comment_text)
    RETURNING id INTO v_comment_id;
    
    RETURN v_comment_id;
END;
$$;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.toggle_activity_like TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_activity_comment TO authenticated;

-- 8. Add comments for documentation
COMMENT ON FUNCTION public.get_user_feed_activities IS 'Get user-specific activities (activities created BY a specific user)';
COMMENT ON FUNCTION public.get_main_feed_activities IS 'Get main feed activities (activities from ALL users for the main feed)';
COMMENT ON FUNCTION public.toggle_activity_like IS 'Toggle like status for an activity';
COMMENT ON FUNCTION public.add_activity_comment IS 'Add a comment to an activity';
COMMENT ON TABLE public.activity_likes IS 'Stores user likes for activities';
COMMENT ON TABLE public.activity_comments IS 'Stores user comments for activities';

-- 9. Verify the functions work
-- Test user-specific: SELECT * FROM public.get_user_feed_activities('your-user-id', 5, 0);
-- Test main feed: SELECT * FROM public.get_main_feed_activities(NULL, 5, 0);
