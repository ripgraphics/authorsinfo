-- MIGRATE POSTS TO ACTIVITIES TABLE
-- This migration moves all content from the posts table to the activities table
-- Migration: 20250823130000_migrate_posts_to_activities.sql

-- Step 1: Create a function to migrate posts to activities
CREATE OR REPLACE FUNCTION migrate_posts_to_activities()
RETURNS TABLE(
    posts_migrated integer,
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
    -- Loop through all posts that haven't been deleted
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
                post_record.content_type,
                post_record.visibility,
                COALESCE(post_record.content->>'text', post_record.content->>'content', post_record.content->>'body', 'Post content'),
                post_record.image_url,
                post_record.link_url,
                COALESCE(post_record.tags, ARRAY[]::text[]),
                COALESCE(post_record.like_count, 0),
                COALESCE(post_record.comment_count, 0),
                COALESCE(post_record.share_count, 0),
                COALESCE(post_record.view_count, 0),
                COALESCE(post_record.engagement_score, 0),
                post_record.publish_status,
                COALESCE(post_record.published_at, post_record.created_at),
                post_record.created_at,
                post_record.updated_at,
                post_record.metadata,
                post_record.content_summary
            ) RETURNING id INTO new_activity_id;
            
            activities_count := activities_count + 1;
            
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

-- Step 2: Execute the migration
SELECT * FROM migrate_posts_to_activities();

-- Step 3: Verify migration results
SELECT 
    'Migration Results' as status,
    (SELECT COUNT(*) FROM public.posts WHERE is_deleted = false AND publish_status != 'deleted') as posts_remaining,
    (SELECT COUNT(*) FROM public.activities WHERE activity_type = 'post_created') as migrated_activities,
    (SELECT COUNT(*) FROM public.activities WHERE activity_type = 'post_created' AND publish_status = 'published') as published_activities;

-- Step 4: Clean up the function
DROP FUNCTION IF EXISTS migrate_posts_to_activities();
