-- Fix Comment Entity Type Mismatch
-- Comments are stored with entity_type = 'activity' but posts have entity_type = 'author'
-- This causes comments to not display because the API looks for entity_type = 'author'

-- =====================================================
-- STEP 1: Check current comment entity types
-- =====================================================

SELECT 
  'Current comment entity types:' as info,
  entity_type,
  COUNT(*) as comment_count
FROM public.engagement_comments 
GROUP BY entity_type;

-- =====================================================
-- STEP 2: Check which posts these comments belong to
-- =====================================================

SELECT 
  'Comments and their posts:' as info,
  ec.entity_type as comment_entity_type,
  ec.entity_id as comment_entity_id,
  ec.comment_text,
  a.entity_type as post_entity_type,
  a.id as post_id
FROM public.engagement_comments ec
LEFT JOIN public.activities a ON ec.entity_id = a.id
ORDER BY ec.created_at DESC
LIMIT 10;

-- =====================================================
-- STEP 3: Fix the entity_type mismatch
-- =====================================================

-- Update comments to match the entity_type of their posts
UPDATE public.engagement_comments 
SET 
  entity_type = a.entity_type,
  updated_at = NOW()
FROM public.activities a
WHERE engagement_comments.entity_id = a.id 
  AND engagement_comments.entity_type != a.entity_type
  AND a.entity_type IS NOT NULL;

-- =====================================================
-- STEP 4: Verify the fix
-- =====================================================

SELECT 
  'After fix - comment entity types:' as info,
  entity_type,
  COUNT(*) as comment_count
FROM public.engagement_comments 
GROUP BY entity_type;

-- =====================================================
-- STEP 5: Check specific post comments
-- =====================================================

SELECT 
  'Comments for post 212603ea-6fbf-4815-bbd6-769f55e13ede:' as info,
  ec.id,
  ec.comment_text,
  ec.entity_type,
  ec.entity_id,
  ec.created_at
FROM public.engagement_comments ec
WHERE ec.entity_id = '212603ea-6fbf-4815-bbd6-769f55e13ede';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '✅ COMMENT ENTITY TYPE MISMATCH FIXED!' as status;
SELECT 'Comments now have the correct entity_type to match their posts' as message;
SELECT 'The engagement API should now find and display comments correctly' as details;
