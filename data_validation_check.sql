-- 🚀 COMPREHENSIVE DATA VALIDATION SCRIPT
-- This script checks for data inconsistencies, constraint violations, and orphaned records
-- Run this to identify any issues that need to be resolved

-- 1. CHECK FOR ORPHANED RECORDS
-- Check for activities with non-existent users
SELECT 'Orphaned activities' as issue_type, COUNT(*) as count
FROM public.activities a
LEFT JOIN public.users u ON a.user_id = u.id
WHERE u.id IS NULL;

-- Check for engagement records with non-existent users
SELECT 'Orphaned engagement comments' as issue_type, COUNT(*) as count
FROM public.engagement_comments ec
LEFT JOIN public.users u ON ec.user_id = u.id
WHERE u.id IS NULL;

SELECT 'Orphaned engagement likes' as issue_type, COUNT(*) as count
FROM public.engagement_likes el
LEFT JOIN public.users u ON el.user_id = u.id
WHERE u.id IS NULL;

SELECT 'Orphaned engagement shares' as issue_type, COUNT(*) as count
FROM public.engagement_shares es
LEFT JOIN public.users u ON es.user_id = u.id
WHERE u.id IS NULL;

-- Check for activities with non-existent entities
SELECT 'Activities with invalid entity references' as issue_type, COUNT(*) as count
FROM public.activities a
WHERE a.entity_type IS NOT NULL 
  AND a.entity_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.entities e 
    WHERE e.id = a.entity_id AND e.type = a.entity_type
  );

-- 2. CHECK CONSTRAINT VIOLATIONS
-- Check for invalid activity types
SELECT 'Invalid activity types' as issue_type, activity_type, COUNT(*) as count
FROM public.activities
WHERE activity_type NOT IN ('member_joined', 'book_added', 'review_posted', 'list_created', 'post_created')
GROUP BY activity_type;

-- Check for invalid content types
SELECT 'Invalid content types' as issue_type, content_type, COUNT(*) as count
FROM public.activities
WHERE content_type IS NOT NULL 
  AND content_type NOT IN ('text', 'image', 'video', 'link', 'poll', 'event', 'book', 'author')
GROUP BY content_type;

-- Check for invalid visibility values
SELECT 'Invalid visibility values' as issue_type, visibility, COUNT(*) as count
FROM public.activities
WHERE visibility IS NOT NULL 
  AND visibility NOT IN ('public', 'friends', 'private', 'group')
GROUP BY visibility;

-- 3. CHECK DATA INTEGRITY
-- Check for negative counts
SELECT 'Negative view counts' as issue_type, COUNT(*) as count
FROM public.activities
WHERE view_count < 0;

SELECT 'Negative like counts' as issue_type, COUNT(*) as count
FROM public.activities
WHERE like_count < 0;

SELECT 'Negative comment counts' as issue_type, COUNT(*) as count
FROM public.activities
WHERE comment_count < 0;

-- Check for invalid engagement scores
SELECT 'Invalid engagement scores' as issue_type, COUNT(*) as count
FROM public.activities
WHERE engagement_score < 0 OR engagement_score > 100;

-- 4. CHECK REFERENTIAL INTEGRITY
-- Check for orphaned photo albums
SELECT 'Orphaned photo albums' as issue_type, COUNT(*) as count
FROM public.photo_albums pa
LEFT JOIN public.users u ON pa.owner_id = u.id
WHERE u.id IS NULL;

-- Check for orphaned images
SELECT 'Orphaned images' as issue_type, COUNT(*) as count
FROM public.images i
LEFT JOIN public.users u ON i.uploader_id = u.id
WHERE i.uploader_id IS NOT NULL AND u.id IS NULL;

-- 5. CHECK FOR DUPLICATE DATA
-- Check for duplicate engagement records
SELECT 'Duplicate engagement likes' as issue_type, COUNT(*) as count
FROM (
  SELECT user_id, entity_type, entity_id, COUNT(*)
  FROM public.engagement_likes
  GROUP BY user_id, entity_type, entity_id
  HAVING COUNT(*) > 1
) duplicates;

-- 6. CHECK FOR INCONSISTENT METADATA
-- Check for activities with empty metadata
SELECT 'Activities with empty metadata' as issue_type, COUNT(*) as count
FROM public.activities
WHERE metadata IS NULL OR metadata = '{}'::jsonb;

-- 7. SUMMARY REPORT
SELECT 
  'DATA VALIDATION SUMMARY' as summary,
  (SELECT COUNT(*) FROM public.activities) as total_activities,
  (SELECT COUNT(*) FROM public.users) as total_users,
  (SELECT COUNT(*) FROM public.engagement_comments) as total_comments,
  (SELECT COUNT(*) FROM public.engagement_likes) as total_likes,
  (SELECT COUNT(*) FROM public.photo_albums) as total_albums,
  (SELECT COUNT(*) FROM public.images) as total_images;
