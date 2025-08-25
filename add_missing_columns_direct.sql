-- ADD MISSING ENGAGEMENT COLUMNS DIRECTLY
-- Run this script directly in your database to add the missing columns

-- Add like_count column
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS like_count integer DEFAULT 0;

-- Add comment_count column  
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS comment_count integer DEFAULT 0;

-- Add share_count column
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS share_count integer DEFAULT 0;

-- Add bookmark_count column
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS bookmark_count integer DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_like_count ON public.activities(like_count);
CREATE INDEX IF NOT EXISTS idx_activities_comment_count ON public.activities(comment_count);
CREATE INDEX IF NOT EXISTS idx_activities_share_count ON public.activities(share_count);
CREATE INDEX IF NOT EXISTS idx_activities_bookmark_count ON public.activities(bookmark_count);

-- Verify the columns were added
SELECT 
    'COLUMNS ADDED SUCCESSFULLY' as status,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'activities' 
  AND table_schema = 'public'
  AND column_name IN ('like_count', 'comment_count', 'share_count', 'bookmark_count')
ORDER BY column_name;
