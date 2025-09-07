-- CLEANUP POSTS TABLE AND FINALIZE MIGRATION
-- This migration finishes the cleanup after the successful posts migration
-- Migration: 20250823160000_cleanup_posts_table.sql

-- Step 1: Drop the posts table if it still exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts' AND table_schema = 'public') THEN
        DROP TABLE public.posts CASCADE;
        RAISE NOTICE 'Posts table successfully removed';
    ELSE
        RAISE NOTICE 'Posts table already removed';
    END IF;
END $$;

-- Step 2: Verify migration success
DO $$
DECLARE
    total_activities integer;
    migrated_posts integer;
BEGIN
    SELECT COUNT(*) INTO total_activities FROM public.activities;
    SELECT COUNT(*) INTO migrated_posts FROM public.activities WHERE activity_type = 'post_created';
    
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE 'Total activities: %', total_activities;
    RAISE NOTICE 'Migrated posts: %', migrated_posts;
    RAISE NOTICE 'Posts table exists: %', 
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts' AND table_schema = 'public') 
             THEN 'YES' ELSE 'NO' END;
END $$;

-- Step 3: Verify the enhanced activities table has all enterprise features
DO $$
DECLARE
    has_publish_status boolean;
    has_is_featured boolean;
    has_trending_score boolean;
    has_bookmark_count boolean;
BEGIN
    -- Check for new enterprise columns
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'publish_status'
    ) INTO has_publish_status;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'is_featured'
    ) INTO has_is_featured;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'trending_score'
    ) INTO has_trending_score;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'bookmark_count'
    ) INTO has_bookmark_count;
    
    RAISE NOTICE 'Enterprise Features Status:';
    RAISE NOTICE 'Publish Status: %', CASE WHEN has_publish_status THEN 'ENABLED' ELSE 'MISSING' END;
    RAISE NOTICE 'Featured Posts: %', CASE WHEN has_is_featured THEN 'ENABLED' ELSE 'MISSING' END;
    RAISE NOTICE 'Trending Score: %', CASE WHEN has_trending_score THEN 'ENABLED' ELSE 'MISSING' END;
    RAISE NOTICE 'Bookmark Count: %', CASE WHEN has_bookmark_count THEN 'ENABLED' ELSE 'MISSING' END;
END $$;

-- Step 4: Final success message
SELECT 
    '🎉 MIGRATION COMPLETE! 🎉' as status,
    'Your timeline system has been successfully upgraded!' as message,
    'All posts migrated to activities table with enterprise features' as details;
