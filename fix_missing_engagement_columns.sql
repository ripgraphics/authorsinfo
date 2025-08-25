-- FIX MISSING ENGAGEMENT COLUMNS
-- This script adds the missing columns that the migration failed to add
-- Date: 2025-08-23

-- =====================================================
-- STEP 1: ADD MISSING ENGAGEMENT COLUMNS
-- =====================================================

-- Add like_count column if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'like_count') THEN
        ALTER TABLE public.activities ADD COLUMN like_count integer DEFAULT 0;
        RAISE NOTICE 'Added like_count column';
    ELSE
        RAISE NOTICE 'like_count column already exists';
    END IF;
END $$;

-- Add comment_count column if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'comment_count') THEN
        ALTER TABLE public.activities ADD COLUMN comment_count integer DEFAULT 0;
        RAISE NOTICE 'Added comment_count column';
    ELSE
        RAISE NOTICE 'comment_count column already exists';
    END IF;
END $$;

-- Add share_count column if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'share_count') THEN
        ALTER TABLE public.activities ADD COLUMN share_count integer DEFAULT 0;
        RAISE NOTICE 'Added share_count column';
    ELSE
        RAISE NOTICE 'share_count column already exists';
    END IF;
END $$;

-- Add bookmark_count column if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'bookmark_count') THEN
        ALTER TABLE public.activities ADD COLUMN bookmark_count integer DEFAULT 0;
        RAISE NOTICE 'Added bookmark_count column';
    ELSE
        RAISE NOTICE 'bookmark_count column already exists';
    END IF;
END $$;

-- =====================================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_activities_like_count ON public.activities(like_count);
CREATE INDEX IF NOT EXISTS idx_activities_comment_count ON public.activities(comment_count);
CREATE INDEX IF NOT EXISTS idx_activities_share_count ON public.activities(share_count);
CREATE INDEX IF NOT EXISTS idx_activities_bookmark_count ON public.activities(bookmark_count);

-- =====================================================
-- STEP 3: ADD COMMENTS TO NEW COLUMNS
-- =====================================================

COMMENT ON COLUMN public.activities.like_count IS 'Number of likes on this activity/post';
COMMENT ON COLUMN public.activities.comment_count IS 'Number of comments on this activity/post';
COMMENT ON COLUMN public.activities.share_count IS 'Number of shares of this activity/post';
COMMENT ON COLUMN public.activities.bookmark_count IS 'Number of bookmarks of this activity/post';

-- =====================================================
-- STEP 4: VERIFY COLUMNS WERE ADDED
-- =====================================================

-- Show the current activities table structure
SELECT 
    'ACTIVITIES TABLE STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'activities' 
  AND table_schema = 'public'
  AND column_name IN ('like_count', 'comment_count', 'share_count', 'bookmark_count')
ORDER BY column_name;

-- =====================================================
-- STEP 5: FINAL VERIFICATION
-- =====================================================

-- Count total activities and show sample data
SELECT 
    'FINAL VERIFICATION' as info,
    COUNT(*) as total_activities,
    COUNT(CASE WHEN like_count IS NOT NULL THEN 1 END) as with_like_count,
    COUNT(CASE WHEN comment_count IS NOT NULL THEN 1 END) as with_comment_count,
    COUNT(CASE WHEN share_count IS NOT NULL THEN 1 END) as with_share_count,
    COUNT(CASE WHEN bookmark_count IS NOT NULL THEN 1 END) as with_bookmark_count
FROM public.activities;
