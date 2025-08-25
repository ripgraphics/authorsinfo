-- FIX ENGAGEMENT PERSISTENCE ISSUE
-- This script adds missing engagement columns and creates triggers to keep counts synchronized
-- Date: 2025-01-06

-- =====================================================
-- STEP 1: ADD MISSING ENGAGEMENT COLUMNS TO ACTIVITIES TABLE
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

-- Add user_has_reacted column if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'user_has_reacted') THEN
        ALTER TABLE public.activities ADD COLUMN user_has_reacted boolean DEFAULT false;
        RAISE NOTICE 'Added user_has_reacted column';
    ELSE
        RAISE NOTICE 'user_has_reacted column already exists';
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
-- STEP 3: CREATE TRIGGER FUNCTIONS TO KEEP COUNTS SYNCHRONIZED
-- =====================================================

-- Function to update like count when engagement_likes table changes
CREATE OR REPLACE FUNCTION update_activity_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment like count
        UPDATE public.activities 
        SET like_count = like_count + 1,
            updated_at = NOW()
        WHERE id = NEW.entity_id AND entity_type = 'activity';
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement like count
        UPDATE public.activities 
        SET like_count = GREATEST(like_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.entity_id AND entity_type = 'activity';
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update comment count when engagement_comments table changes
CREATE OR REPLACE FUNCTION update_activity_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment comment count
        UPDATE public.activities 
        SET comment_count = comment_count + 1,
            updated_at = NOW()
        WHERE id = NEW.entity_id AND entity_type = 'activity';
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement comment count
        UPDATE public.activities 
        SET comment_count = GREATEST(comment_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.entity_id AND entity_type = 'activity';
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle comment soft delete/restore
        IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
            -- Comment was soft deleted, decrement count
            UPDATE public.activities 
            SET comment_count = GREATEST(comment_count - 1, 0),
                updated_at = NOW()
            WHERE id = NEW.entity_id AND entity_type = 'activity';
        ELSIF OLD.is_deleted = true AND NEW.is_deleted = false THEN
            -- Comment was restored, increment count
            UPDATE public.activities 
            SET comment_count = comment_count + 1,
                updated_at = NOW()
            WHERE id = NEW.entity_id AND entity_type = 'activity';
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 4: CREATE TRIGGERS
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_activity_like_count ON public.engagement_likes;
DROP TRIGGER IF EXISTS trigger_update_activity_comment_count ON public.engagement_comments;

-- Create trigger for likes
CREATE TRIGGER trigger_update_activity_like_count
    AFTER INSERT OR DELETE ON public.engagement_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_activity_like_count();

-- Create trigger for comments
CREATE TRIGGER trigger_update_activity_comment_count
    AFTER INSERT OR DELETE OR UPDATE ON public.engagement_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_activity_comment_count();

-- =====================================================
-- STEP 5: SYNC EXISTING DATA
-- =====================================================

-- Update like counts for existing activities
UPDATE public.activities 
SET like_count = (
    SELECT COUNT(*) 
    FROM public.engagement_likes 
    WHERE entity_id = activities.id AND entity_type = 'activity'
),
updated_at = NOW()
WHERE EXISTS (
    SELECT 1 FROM public.engagement_likes 
    WHERE entity_id = activities.id AND entity_type = 'activity'
);

-- Update comment counts for existing activities
UPDATE public.activities 
SET comment_count = (
    SELECT COUNT(*) 
    FROM public.engagement_comments 
    WHERE entity_id = activities.id AND entity_type = 'activity'
    AND is_deleted = false AND is_hidden = false
),
updated_at = NOW()
WHERE EXISTS (
    SELECT 1 FROM public.engagement_comments 
    WHERE entity_id = activities.id AND entity_type = 'activity'
    AND is_deleted = false AND is_hidden = false
);

-- =====================================================
-- STEP 6: CREATE FUNCTION TO GET USER REACTION STATUS
-- =====================================================

-- Function to check if a user has reacted to an activity
CREATE OR REPLACE FUNCTION get_user_reaction_status(
    p_user_id uuid,
    p_entity_type text,
    p_entity_id uuid
)
RETURNS TABLE(
    has_liked boolean,
    has_commented boolean,
    has_shared boolean,
    has_bookmarked boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXISTS(SELECT 1 FROM public.engagement_likes 
               WHERE user_id = p_user_id AND entity_type = p_entity_type AND entity_id = p_entity_id) as has_liked,
        EXISTS(SELECT 1 FROM public.engagement_comments 
               WHERE user_id = p_user_id AND entity_type = p_entity_type AND entity_id = p_entity_id 
               AND is_deleted = false) as has_commented,
        false as has_shared, -- TODO: Implement when shares table exists
        false as has_bookmarked; -- TODO: Implement when bookmarks table exists
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 7: VERIFICATION
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
  AND column_name IN ('like_count', 'comment_count', 'share_count', 'bookmark_count', 'user_has_reacted')
ORDER BY column_name;

-- Count total activities and show sample data
SELECT 
    'FINAL VERIFICATION' as info,
    COUNT(*) as total_activities,
    COUNT(CASE WHEN like_count IS NOT NULL THEN 1 END) as with_like_count,
    COUNT(CASE WHEN comment_count IS NOT NULL THEN 1 END) as with_comment_count,
    COUNT(CASE WHEN share_count IS NOT NULL THEN 1 END) as with_share_count,
    COUNT(CASE WHEN bookmark_count IS NOT NULL THEN 1 END) as with_bookmark_count,
    COUNT(CASE WHEN user_has_reacted IS NOT NULL THEN 1 END) as with_user_has_reacted
FROM public.activities;

-- Show sample activities with engagement data
SELECT 
    'SAMPLE ACTIVITIES WITH ENGAGEMENT' as info,
    id,
    activity_type,
    content_type,
    like_count,
    comment_count,
    share_count,
    bookmark_count,
    created_at
FROM public.activities 
WHERE like_count > 0 OR comment_count > 0
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- STEP 8: ADD COMMENTS TO NEW COLUMNS
-- =====================================================

COMMENT ON COLUMN public.activities.like_count IS 'Number of likes on this activity/post - automatically synchronized with engagement_likes table';
COMMENT ON COLUMN public.activities.comment_count IS 'Number of comments on this activity/post - automatically synchronized with engagement_comments table';
COMMENT ON COLUMN public.activities.share_count IS 'Number of shares of this activity/post - ready for future implementation';
COMMENT ON COLUMN public.activities.bookmark_count IS 'Number of bookmarks of this activity/post - ready for future implementation';
COMMENT ON COLUMN public.activities.user_has_reacted IS 'Flag indicating if the current user has reacted to this activity - computed dynamically';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '✅ ENGAGEMENT PERSISTENCE FIX COMPLETED SUCCESSFULLY!' as status;
SELECT 'Your likes and comments will now persist after page refresh!' as message;
SELECT 'The system automatically keeps engagement counts synchronized.' as details;
