-- PHASE 1: ENTERPRISE UPGRADE FOR ACTIVITIES TABLE
-- This migration adds essential enterprise features to the activities table
-- Migration: 20250823120000_phase1_enterprise_upgrade.sql

-- Step 1: Add essential enterprise features
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS content_summary text,
ADD COLUMN IF NOT EXISTS publish_status text DEFAULT 'published',
ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS published_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bookmark_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS trending_score numeric DEFAULT 0;

-- Step 2: Add constraints for new fields (using proper PostgreSQL syntax)
DO $$ 
BEGIN
    -- Add publish_status constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_publish_status_values') THEN
        ALTER TABLE public.activities 
        ADD CONSTRAINT check_publish_status_values 
        CHECK (publish_status IN ('draft', 'scheduled', 'published', 'archived', 'deleted'));
    END IF;
    
    -- Add bookmark_count constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_bookmark_count_positive') THEN
        ALTER TABLE public.activities 
        ADD CONSTRAINT check_bookmark_count_positive 
        CHECK (bookmark_count >= 0);
    END IF;
    
    -- Add trending_score constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_trending_score_range') THEN
        ALTER TABLE public.activities 
        ADD CONSTRAINT check_trending_score_range 
        CHECK (trending_score >= 0 AND trending_score <= 100);
    END IF;
END $$;

-- Step 3: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_publish_status ON public.activities(publish_status);
CREATE INDEX IF NOT EXISTS idx_activities_scheduled_at ON public.activities(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_activities_is_featured ON public.activities(is_featured);
CREATE INDEX IF NOT EXISTS idx_activities_is_pinned ON public.activities(is_pinned);
CREATE INDEX IF NOT EXISTS idx_activities_trending_score ON public.activities(trending_score DESC);

-- Step 4: Add column comments for documentation
COMMENT ON COLUMN public.activities.content_summary IS 'Auto-generated or manual summary of activity content';
COMMENT ON COLUMN public.activities.publish_status IS 'Current publication status (draft, scheduled, published, archived, deleted)';
COMMENT ON COLUMN public.activities.scheduled_at IS 'When the activity is scheduled to be published';
COMMENT ON COLUMN public.activities.published_at IS 'When the activity was actually published';
COMMENT ON COLUMN public.activities.is_featured IS 'Whether this activity is featured/promoted';
COMMENT ON COLUMN public.activities.is_pinned IS 'Whether this activity is pinned to the top';
COMMENT ON COLUMN public.activities.bookmark_count IS 'Number of times this activity has been bookmarked';
COMMENT ON COLUMN public.activities.trending_score IS 'Calculated trending score based on recent activity';

-- Step 5: Update existing activities to have proper publish status
UPDATE public.activities 
SET publish_status = 'published', 
    published_at = created_at 
WHERE publish_status IS NULL;
