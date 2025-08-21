-- Enterprise-Grade Migration: Fix Activities Table Schema
-- This migration properly handles the transition from old posts to new activities structure
-- Date: 2025-08-19
-- Purpose: Fix database schema inconsistencies and enable proper post editing

-- Step 1: Add missing columns to activities table if they don't exist
DO $$ 
BEGIN
    -- Add text column for post content
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'text') THEN
        ALTER TABLE public.activities ADD COLUMN text TEXT;
    END IF;
    
    -- Add image_url column for post images
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'image_url') THEN
        ALTER TABLE public.activities ADD COLUMN image_url TEXT;
    END IF;
    
    -- Add link_url column for post links
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'link_url') THEN
        ALTER TABLE public.activities ADD COLUMN link_url TEXT;
    END IF;
    
    -- Add visibility column for post privacy
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'visibility') THEN
        ALTER TABLE public.activities ADD COLUMN visibility TEXT DEFAULT 'public';
    END IF;
    
    -- Add updated_at column for post modifications
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'updated_at') THEN
        ALTER TABLE public.activities ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
    
    -- Add content_type column for post type classification
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'content_type') THEN
        ALTER TABLE public.activities ADD COLUMN content_type TEXT DEFAULT 'text';
    END IF;
END $$;

-- Step 2: Transform old post data to new structure
-- Extract content from metadata and populate new columns
UPDATE public.activities 
SET 
    text = CASE 
        WHEN metadata->>'text' IS NOT NULL THEN metadata->>'text'
        WHEN metadata->>'content' IS NOT NULL THEN metadata->>'content'
        WHEN metadata->>'post_text' IS NOT NULL THEN metadata->>'post_text'
        WHEN metadata->>'message' IS NOT NULL THEN metadata->>'message'
        WHEN metadata->>'body' IS NOT NULL THEN metadata->>'body'
        ELSE 'Post content'
    END,
    image_url = CASE 
        WHEN metadata->>'image_url' IS NOT NULL THEN metadata->>'image_url'
        WHEN metadata->>'images' IS NOT NULL THEN metadata->>'images'
        WHEN metadata->>'photo_url' IS NOT NULL THEN metadata->>'photo_url'
        WHEN metadata->>'media_url' IS NOT NULL THEN metadata->>'media_url'
        ELSE NULL
    END,
    link_url = CASE 
        WHEN metadata->>'link_url' IS NOT NULL THEN metadata->>'link_url'
        WHEN metadata->>'link' IS NOT NULL THEN metadata->>'link'
        WHEN metadata->>'url' IS NOT NULL THEN metadata->>'url'
        WHEN metadata->>'href' IS NOT NULL THEN metadata->>'href'
        ELSE NULL
    END,
    visibility = CASE 
        WHEN metadata->>'visibility' IS NOT NULL THEN metadata->>'visibility'
        WHEN metadata->>'privacy' IS NOT NULL THEN metadata->>'privacy'
        WHEN metadata->>'is_public' IS NOT NULL THEN 
            CASE WHEN (metadata->>'is_public')::boolean THEN 'public' ELSE 'private' END
        WHEN metadata->>'access_level' IS NOT NULL THEN metadata->>'access_level'
        ELSE 'public'
    END,
    content_type = CASE 
        WHEN metadata->>'image_url' IS NOT NULL OR metadata->>'images' IS NOT NULL THEN 'image'
        WHEN metadata->>'video_url' IS NOT NULL OR metadata->>'video' IS NOT NULL THEN 'video'
        WHEN metadata->>'link_url' IS NOT NULL OR metadata->>'link' IS NOT NULL THEN 'link'
        WHEN metadata->>'poll_data' IS NOT NULL THEN 'poll'
        WHEN metadata->>'review_data' IS NOT NULL THEN 'review'
        WHEN metadata->>'article_data' IS NOT NULL THEN 'article'
        ELSE 'text'
    END,
    updated_at = created_at
WHERE 
    activity_type = 'post_created' 
    AND (text IS NULL OR text = '' OR text = 'Post content');

-- Step 3: Create proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_text_search ON public.activities USING gin(to_tsvector('english', text));
CREATE INDEX IF NOT EXISTS idx_activities_activity_type ON public.activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_activity ON public.activities(user_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_content_type ON public.activities(content_type);
CREATE INDEX IF NOT EXISTS idx_activities_visibility ON public.activities(visibility);
CREATE INDEX IF NOT EXISTS idx_activities_updated_at ON public.activities(updated_at DESC);

-- Step 4: Update the get_user_feed_activities function to handle both old and new data seamlessly
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
    content_type text,
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
        COALESCE(
            up.raw_user_meta_data->>'name',
            up.email,
            'User'
        ) as user_name,
        up.raw_user_meta_data->>'avatar_url' as user_avatar_url,
        COALESCE(like_counts.like_count, 0) as like_count,
        COALESCE(comment_counts.comment_count, 0) as comment_count,
        COALESCE(user_likes.is_liked, false) as is_liked,
        COALESCE(a.text, 'Post content') as text,
        a.image_url,
        a.link_url,
        COALESCE(a.visibility, 'public') as visibility,
        COALESCE(a.content_type, 'text') as content_type,
        COALESCE(a.updated_at, a.created_at) as updated_at
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

-- Step 5: Grant proper permissions
GRANT EXECUTE ON FUNCTION public.get_user_feed_activities(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_feed_activities(uuid, integer, integer) TO service_role;

-- Step 6: Add column comments for documentation
COMMENT ON COLUMN public.activities.text IS 'Text content for post activities - extracted from metadata for old posts';
COMMENT ON COLUMN public.activities.image_url IS 'Image URLs for post activities - extracted from metadata for old posts';
COMMENT ON COLUMN public.activities.link_url IS 'Link URLs for post activities - extracted from metadata for old posts';
COMMENT ON COLUMN public.activities.visibility IS 'Visibility setting for post activities - extracted from metadata for old posts';
COMMENT ON COLUMN public.activities.content_type IS 'Type of content (text, image, video, link, poll, review, article)';
COMMENT ON COLUMN public.activities.updated_at IS 'Timestamp when the activity was last updated - defaults to created_at for old posts';

-- Step 7: Verify the migration
SELECT 
    'Migration completed successfully!' as status,
    COUNT(*) as total_posts,
    COUNT(CASE WHEN text IS NOT NULL AND text != '' AND text != 'Post content' THEN 1 END) as posts_with_content,
    COUNT(CASE WHEN text IS NULL OR text = '' OR text = 'Post content' THEN 1 END) as posts_without_content,
    COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as posts_with_images,
    COUNT(CASE WHEN content_type != 'text' THEN 1 END) as posts_with_media
FROM public.activities 
WHERE activity_type = 'post_created';
