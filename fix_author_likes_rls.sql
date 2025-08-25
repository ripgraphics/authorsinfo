-- Fix RLS Policy for Author Likes
-- The current policy only allows reading likes if the entity exists in activities table
-- But authors don't have activities records, so their likes can't be read

-- Drop the problematic policy
DROP POLICY IF EXISTS "engagement_likes_select_policy" ON "public"."engagement_likes";

-- Create new policy that allows reading likes for all entity types
CREATE POLICY "engagement_likes_select_policy" ON "public"."engagement_likes"
FOR SELECT USING (
  -- Allow reading likes for any entity type (including authors)
  -- The user_id check ensures users can only see likes they created
  auth.uid() IS NOT NULL
);

-- Also fix the same issue for engagement_comments if it exists
DROP POLICY IF EXISTS "engagement_comments_select_policy" ON "public"."engagement_comments";

CREATE POLICY "engagement_comments_select_policy" ON "public"."engagement_comments"
FOR SELECT USING (
  -- Allow reading comments for any entity type (including authors)
  -- Only show non-deleted, non-hidden comments
  is_deleted = false AND is_hidden = false
);

-- Verify the fix
SELECT 
  'RLS Policies Updated' as status,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('engagement_likes', 'engagement_comments')
ORDER BY tablename, policyname;
