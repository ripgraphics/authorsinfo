-- Check EXACTLY what columns exist in activities table
-- No more assumptions - let's see the real structure

-- 1. Check ALL columns in activities table
SELECT 'Activities table - ALL columns:' as info, 
       column_name, 
       data_type, 
       is_nullable
FROM information_schema.columns 
WHERE table_name = 'activities' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if specific columns exist
SELECT 'Column existence check:' as info,
       column_name,
       'EXISTS' as status
FROM information_schema.columns 
WHERE table_name = 'activities' 
  AND table_schema = 'public'
  AND column_name IN ('is_public', 'like_count', 'comment_count', 'is_liked', 'entity_type', 'entity_id')
ORDER BY column_name;

-- 3. Show sample data structure
SELECT 'Sample activity data:' as info,
       id,
       user_id,
       activity_type,
       created_at,
       data
FROM public.activities 
WHERE user_id = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3'
ORDER BY created_at DESC
LIMIT 1;
