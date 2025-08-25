-- COMPLETE POSTS MIGRATION AND CLEANUP
-- This migration completes the posts to activities migration and removes the posts table
-- Migration: 20250823150000_complete_posts_migration.sql

-- Step 1: Mark already migrated posts as deleted to avoid duplicates
UPDATE public.posts 
SET is_deleted = true, 
    publish_status = 'deleted',
    updated_at = now()
WHERE id IN (
    SELECT DISTINCT p.id 
    FROM public.posts p
    INNER JOIN public.activities a ON (
        a.activity_type = 'post_created' 
        AND a.user_id = p.user_id
        AND a.created_at = p.created_at
    )
    WHERE p.is_deleted = false 
    AND p.publish_status != 'deleted'
);

-- Step 2: Migrate any remaining posts that weren't caught by the previous migration
DO $$
DECLARE
    post_record RECORD;
    new_activity_id uuid;
    posts_count integer := 0;
    activities_count integer := 0;
    error_count integer := 0;
BEGIN
    RAISE NOTICE 'Starting migration of any remaining posts...';
    
    -- Loop through any remaining unmigrated posts
    FOR post_record IN 
        SELECT * FROM public.posts 
        WHERE is_deleted = false 
        AND publish_status != 'deleted'
    LOOP
        BEGIN
            -- Insert into activities table
            INSERT INTO public.activities (
                user_id,
                activity_type,
                entity_type,
                entity_id,
                content_type,
                visibility,
                text,
                image_url,
                link_url,
                hashtags,
                like_count,
                comment_count,
                share_count,
                view_count,
                engagement_score,
                publish_status,
                published_at,
                created_at,
                updated_at,
                metadata,
                content_summary
            ) VALUES (
                post_record.user_id,
                'post_created',
                COALESCE(post_record.entity_type, 'user'),
                COALESCE(post_record.entity_id, post_record.user_id),
                COALESCE(post_record.content_type, 'text'),
                COALESCE(post_record.visibility, 'public'),
                CASE 
                    WHEN post_record.content IS NOT NULL THEN
                        COALESCE(
                            post_record.content->>'text', 
                            post_record.content->>'content', 
                            post_record.content->>'body', 
                            'Post content'
                        )
                    ELSE 'Post content'
                END,
                post_record.image_url,
                post_record.link_url,
                COALESCE(post_record.tags, ARRAY[]::text[]),
                COALESCE(post_record.like_count, 0),
                COALESCE(post_record.comment_count, 0),
                COALESCE(post_record.share_count, 0),
                COALESCE(post_record.view_count, 0),
                COALESCE(post_record.engagement_score, 0),
                COALESCE(post_record.publish_status, 'published'),
                COALESCE(post_record.published_at, post_record.created_at),
                post_record.created_at,
                post_record.updated_at,
                COALESCE(post_record.metadata, '{}'::jsonb),
                COALESCE(post_record.content_summary, '')
            ) RETURNING id INTO new_activity_id;
            
            -- Mark this post as migrated
            UPDATE public.posts 
            SET is_deleted = true, 
                publish_status = 'deleted',
                updated_at = now()
            WHERE id = post_record.id;
            
            activities_count := activities_count + 1;
            RAISE NOTICE 'Successfully migrated post % to activity %', post_record.id, new_activity_id;
            
        EXCEPTION WHEN OTHERS THEN
            -- Log error and continue
            error_count := error_count + 1;
            RAISE NOTICE 'Error migrating post %: %', post_record.id, SQLERRM;
        END;
        
        posts_count := posts_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Migration complete: % posts processed, % activities created, % errors', 
                 posts_count, activities_count, error_count;
END $$;

-- Step 3: Verify all active posts are now migrated
DO $$
DECLARE
    active_posts_remaining integer;
    total_migrated_activities integer;
BEGIN
    SELECT COUNT(*) INTO active_posts_remaining
    FROM public.posts 
    WHERE is_deleted = false AND publish_status != 'deleted';
    
    SELECT COUNT(*) INTO total_migrated_activities
    FROM public.activities 
    WHERE activity_type = 'post_created';
    
    RAISE NOTICE 'Final verification: % active posts remaining, % total migrated activities', 
                 active_posts_remaining, total_migrated_activities;
    
    IF active_posts_remaining > 0 THEN
        RAISE EXCEPTION 'Migration failed: % active posts still remain', active_posts_remaining;
    END IF;
    
    RAISE NOTICE 'Migration verification successful. All active posts have been migrated.';
END $$;

-- Step 4: Drop the posts table and all its dependencies
DO $$
BEGIN
    DROP TABLE IF EXISTS public.posts CASCADE;
    RAISE NOTICE 'Posts table successfully removed';
END $$;

-- Step 5: Update the feed function to only use activities table with enterprise features
DROP FUNCTION IF EXISTS public.get_user_feed_activities(uuid, integer, integer);
CREATE OR REPLACE FUNCTION public.get_user_feed_activities(
    p_user_id uuid,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE(
    id uuid,
    user_id uuid,
    user_name text,
    user_avatar_url text,
    activity_type text,
    data jsonb,
    created_at timestamptz,
    is_public boolean,
    like_count integer,
    comment_count integer,
    share_count integer,
    view_count integer,
    is_liked boolean,
    entity_type text,
    entity_id text,
    content_type text,
    text text,
    image_url text,
    link_url text,
    content_summary text,
    hashtags text[],
    visibility text,
    engagement_score numeric,
    updated_at timestamptz,
    cross_posted_to text[],
    collaboration_type text,
    ai_enhanced boolean,
    ai_enhanced_text text,
    ai_enhanced_performance numeric,
    metadata jsonb,
    publish_status text,
    published_at timestamptz,
    is_featured boolean,
    is_pinned boolean,
    bookmark_count integer,
    trending_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.user_id,
        COALESCE(u.name, 'Unknown User') as user_name,
        '/placeholder.svg?height=200&width=200' as user_avatar_url,
        a.activity_type,
        COALESCE(a.data, '{}'::jsonb) as data,
        a.created_at,
        true as is_public,
        COALESCE(a.like_count, 0) as like_count,
        COALESCE(a.comment_count, 0) as comment_count,
        COALESCE(a.share_count, 0) as share_count,
        COALESCE(a.view_count, 0) as view_count,
        false as is_liked,
        COALESCE(a.entity_type, 'user') as entity_type,
        COALESCE(a.entity_id, a.user_id) as entity_id,
        COALESCE(a.content_type, 'text') as content_type,
        COALESCE(a.text, 'Activity content') as text,
        a.image_url,
        a.link_url,
        a.content_summary,
        COALESCE(a.hashtags, ARRAY[]::text[]) as hashtags,
        COALESCE(a.visibility, 'public') as visibility,
        COALESCE(a.engagement_score, 0) as engagement_score,
        COALESCE(a.updated_at, a.created_at) as updated_at,
        COALESCE(a.cross_posted_to, ARRAY[]::text[]) as cross_posted_to,
        COALESCE(a.collaboration_type, 'individual') as collaboration_type,
        COALESCE(a.ai_enhanced, false) as ai_enhanced,
        a.ai_enhanced_text,
        a.ai_enhanced_performance,
        COALESCE(a.metadata, '{}'::jsonb) as metadata,
        COALESCE(a.publish_status, 'published') as publish_status,
        COALESCE(a.published_at, a.created_at) as published_at,
        COALESCE(a.is_featured, false) as is_featured,
        COALESCE(a.is_pinned, false) as is_pinned,
        COALESCE(a.bookmark_count, 0) as bookmark_count,
        COALESCE(a.trending_score, 0) as trending_score
    FROM public.activities a
    LEFT JOIN public.users u ON a.user_id = u.id
    WHERE a.user_id = p_user_id
      AND COALESCE(a.publish_status, 'published') IN ('published', 'scheduled')
      AND COALESCE(a.visibility, 'public') IN ('public', 'friends', 'followers')
    ORDER BY 
        a.is_pinned DESC,
        a.is_featured DESC,
        a.trending_score DESC,
        a.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Step 6: Grant permissions on the updated function
GRANT EXECUTE ON FUNCTION public.get_user_feed_activities(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_feed_activities(uuid, integer, integer) TO service_role;

-- Step 7: Final verification and summary
SELECT 
    'MIGRATION COMPLETE' as status,
    'Posts table removed successfully' as message,
    (SELECT COUNT(*) FROM public.activities WHERE activity_type = 'post_created') as total_migrated_activities,
    (SELECT COUNT(*) FROM public.activities WHERE activity_type = 'post_created' AND publish_status = 'published') as published_activities,
    (SELECT COUNT(*) FROM public.activities WHERE activity_type = 'post_created' AND is_featured = true) as featured_activities;
