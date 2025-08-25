-- INVESTIGATE POSTS MIGRATION ISSUE
-- This script investigates why some posts weren't migrated and fixes the issue

-- Step 1: Check what posts remain and why
SELECT 
    id,
    user_id,
    content_type,
    publish_status,
    is_deleted,
    created_at,
    content
FROM public.posts 
WHERE is_deleted = false 
AND publish_status != 'deleted'
ORDER BY created_at DESC;

-- Step 2: Check the migration function manually
CREATE OR REPLACE FUNCTION manual_migrate_remaining_posts()
RETURNS TABLE(
    posts_processed integer,
    activities_created integer,
    errors_encountered integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_record RECORD;
    new_activity_id uuid;
    posts_count integer := 0;
    activities_count integer := 0;
    error_count integer := 0;
BEGIN
    -- Loop through all remaining posts
    FOR post_record IN 
        SELECT * FROM public.posts 
        WHERE is_deleted = false 
        AND publish_status != 'deleted'
    LOOP
        BEGIN
            -- Insert into activities table with better error handling
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
            
            activities_count := activities_count + 1;
            RAISE NOTICE 'Successfully migrated post % to activity %', post_record.id, new_activity_id;
            
        EXCEPTION WHEN OTHERS THEN
            -- Log error and continue
            error_count := error_count + 1;
            RAISE NOTICE 'Error migrating post %: %', post_record.id, SQLERRM;
        END;
        
        posts_count := posts_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT posts_count, activities_count, error_count;
END;
$$;

-- Step 3: Execute the manual migration
SELECT * FROM manual_migrate_remaining_posts();

-- Step 4: Verify all posts are now migrated
SELECT 
    'Final Verification' as status,
    (SELECT COUNT(*) FROM public.posts WHERE is_deleted = false AND publish_status != 'deleted') as posts_remaining,
    (SELECT COUNT(*) FROM public.activities WHERE activity_type = 'post_created') as total_migrated_activities,
    (SELECT COUNT(*) FROM public.activities WHERE activity_type = 'post_created' AND publish_status = 'published') as published_activities;

-- Step 5: Clean up
DROP FUNCTION IF EXISTS manual_migrate_remaining_posts();
