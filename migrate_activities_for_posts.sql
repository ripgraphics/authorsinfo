-- COMPREHENSIVE MIGRATION: Enable Post Editing/Deleting in Activities Table
-- Run this script manually using: psql -h your-host -U your-user -d your-db -f migrate_activities_for_posts.sql

-- Step 1: Add missing columns for post functionality
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS text TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS link_url TEXT,
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Step 2: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activities_text ON public.activities USING gin(to_tsvector('english', text));
CREATE INDEX IF NOT EXISTS idx_activities_activity_type ON public.activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);

-- Step 3: Add column comments for documentation
COMMENT ON COLUMN public.activities.text IS 'Text content for post activities';
COMMENT ON COLUMN public.activities.image_url IS 'Comma-separated list of image URLs for post activities';
COMMENT ON COLUMN public.activities.link_url IS 'Link URL for post activities';
COMMENT ON COLUMN public.activities.visibility IS 'Visibility setting for post activities (public, friends, private)';
COMMENT ON COLUMN public.activities.updated_at IS 'Timestamp when the activity was last updated';

-- Step 4: Update existing activities to have proper visibility
UPDATE public.activities 
SET visibility = 'public' 
WHERE visibility IS NULL AND activity_type = 'post_created';

-- Step 5: Update the get_user_feed_activities function
DROP FUNCTION IF EXISTS public.get_user_feed_activities(uuid, integer, integer);

CREATE OR REPLACE FUNCTION public.get_user_feed_activities(
    p_user_id uuid,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE(
    id uuid,
    user_id uuid,
    activity_type text,
    entity_type text,
    entity_id text,
    is_public boolean,
    metadata jsonb,
    created_at timestamptz,
    user_name text,
    user_avatar_url text,
    like_count bigint,
    comment_count bigint,
    is_liked boolean,
    -- New post-related columns
    text text,
    image_url text,
    link_url text,
    visibility text,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.user_id,
        a.activity_type,
        a.entity_type,
        a.entity_id,
        a.is_public,
        a.metadata,
        a.created_at,
        up.raw_user_meta_data->>'name' as user_name,
        up.raw_user_meta_data->>'avatar_url' as user_avatar_url,
        COALESCE(like_counts.like_count, 0) as like_count,
        COALESCE(comment_counts.comment_count, 0) as comment_count,
        COALESCE(user_likes.is_liked, false) as is_liked,
        -- New post columns
        a.text,
        a.image_url,
        a.link_url,
        a.visibility,
        a.updated_at
    FROM public.activities a
    LEFT JOIN auth.users up ON a.user_id = up.id
    LEFT JOIN (
        SELECT 
            activity_id,
            COUNT(*) as like_count
        FROM public.activity_likes
        GROUP BY activity_id
    ) like_counts ON a.id = like_counts.activity_id
    LEFT JOIN (
        SELECT 
            activity_id,
            COUNT(*) as comment_count
        FROM public.activity_comments
        GROUP BY activity_id
    ) comment_counts ON a.id = comment_counts.activity_id
    LEFT JOIN (
        SELECT 
            activity_id,
            true as is_liked
        FROM public.activity_likes
        WHERE user_id = p_user_id
    ) user_likes ON a.id = user_likes.activity_id
    WHERE a.user_id = p_user_id
    ORDER BY a.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Step 6: Grant permissions
GRANT ALL ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_feed_activities(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_feed_activities(uuid, integer, integer) TO service_role;

-- Step 7: Add function comment
COMMENT ON FUNCTION public.get_user_feed_activities(uuid, integer, integer) IS 'Get user-specific activities with post content and engagement data for the feed';

-- Step 8: Verify the migration
SELECT 'Migration completed successfully!' as status;

-- Step 9: Test the function (optional - uncomment to test)
-- SELECT * FROM public.get_user_feed_activities('your-user-id-here', 5, 0);
