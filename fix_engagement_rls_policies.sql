-- FIX ENGAGEMENT RLS POLICIES - IMMEDIATE TIMEOUT SOLUTION
-- This script fixes the circular reference RLS policies that cause timeouts

-- Step 1: Drop the problematic RLS policies
SELECT 'Dropping problematic RLS policies...' as info;

DROP POLICY IF EXISTS "engagement_likes_select_policy" ON "public"."engagement_likes";
DROP POLICY IF EXISTS "engagement_comments_select_policy" ON "public"."engagement_comments";

-- Step 2: Create simple, performant RLS policies
SELECT 'Creating simple, performant RLS policies...' as info;

-- Allow reading all likes (no complex EXISTS queries)
CREATE POLICY "engagement_likes_select_policy" ON "public"."engagement_likes"
FOR SELECT USING (true);

-- Allow reading all comments (no complex EXISTS queries)  
CREATE POLICY "engagement_comments_select_policy" ON "public"."engagement_comments"
FOR SELECT USING (true);

-- Keep the existing insert/update/delete policies as they are already optimized
-- (These don't cause performance issues)

-- Step 3: Verify the new policies
SELECT 'Verifying new RLS policies...' as info;

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  qual
FROM pg_policies 
WHERE tablename IN ('engagement_likes', 'engagement_comments')
  AND policyname LIKE '%select%'
ORDER BY tablename, policyname;

-- Step 4: Test query performance
SELECT 'Testing query performance...' as info;

-- This should now execute quickly
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
  user_id,
  created_at
FROM engagement_likes 
WHERE entity_type = 'activity' 
  AND entity_id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb'
ORDER BY created_at DESC
LIMIT 10;

-- Step 5: Final verification
SELECT 'RLS policy fix complete! The timeout issue should now be resolved.' as result;
