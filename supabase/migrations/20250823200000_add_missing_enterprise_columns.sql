-- =============================================================================
-- MIGRATION: Add Missing Enterprise Columns to Activities Table
-- =============================================================================
-- 
-- This migration adds the missing enterprise columns that our functions expect
-- but are not currently in the activities table.
--
-- =============================================================================

-- Add missing enterprise columns to activities table
DO $$ BEGIN
    -- Add publish_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'publish_status') THEN
        ALTER TABLE public.activities ADD COLUMN publish_status text DEFAULT 'published';
    END IF;
    
    -- Add published_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'published_at') THEN
        ALTER TABLE public.activities ADD COLUMN published_at timestamptz DEFAULT now();
    END IF;
    
    -- Add is_featured column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'is_featured') THEN
        ALTER TABLE public.activities ADD COLUMN is_featured boolean DEFAULT false;
    END IF;
    
    -- Add is_pinned column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'is_pinned') THEN
        ALTER TABLE public.activities ADD COLUMN is_pinned boolean DEFAULT false;
    END IF;
    
    -- Add bookmark_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'bookmark_count') THEN
        ALTER TABLE public.activities ADD COLUMN bookmark_count integer DEFAULT 0;
    END IF;
    
    -- Add trending_score column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'trending_score') THEN
        ALTER TABLE public.activities ADD COLUMN trending_score numeric DEFAULT 0;
    END IF;
END $$;

-- Update existing records to set default values
UPDATE public.activities 
SET 
    publish_status = COALESCE(publish_status, 'published'),
    published_at = COALESCE(published_at, created_at),
    is_featured = COALESCE(is_featured, false),
    is_pinned = COALESCE(is_pinned, false),
    bookmark_count = COALESCE(bookmark_count, 0),
    trending_score = COALESCE(trending_score, 0)
WHERE 
    publish_status IS NULL 
    OR published_at IS NULL 
    OR is_featured IS NULL 
    OR is_pinned IS NULL 
    OR bookmark_count IS NULL 
    OR trending_score IS NULL;

-- Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_activities_publish_status ON public.activities(publish_status);
CREATE INDEX IF NOT EXISTS idx_activities_is_featured ON public.activities(is_featured);
CREATE INDEX IF NOT EXISTS idx_activities_is_pinned ON public.activities(is_pinned);
CREATE INDEX IF NOT EXISTS idx_activities_trending_score ON public.activities(trending_score);

-- Add comments to the new columns
COMMENT ON COLUMN public.activities.publish_status IS 'Publication status: draft, published, scheduled, archived';
COMMENT ON COLUMN public.activities.published_at IS 'When the activity was published';
COMMENT ON COLUMN public.activities.is_featured IS 'Whether this activity is featured';
COMMENT ON COLUMN public.activities.is_pinned IS 'Whether this activity is pinned';
COMMENT ON COLUMN public.activities.bookmark_count IS 'Number of times this activity has been bookmarked';
COMMENT ON COLUMN public.activities.trending_score IS 'Trending score for ranking activities';

-- Verify the columns were added
SELECT 'Enterprise columns added successfully' as status,
       COUNT(*) as total_activities,
       COUNT(CASE WHEN publish_status IS NOT NULL THEN 1 END) as with_publish_status,
       COUNT(CASE WHEN published_at IS NOT NULL THEN 1 END) as with_published_at,
       COUNT(CASE WHEN is_featured IS NOT NULL THEN 1 END) as with_is_featured,
       COUNT(CASE WHEN is_pinned IS NOT NULL THEN 1 END) as with_is_pinned,
       COUNT(CASE WHEN bookmark_count IS NOT NULL THEN 1 END) as with_bookmark_count,
       COUNT(CASE WHEN trending_score IS NOT NULL THEN 1 END) as with_trending_score
FROM public.activities;
