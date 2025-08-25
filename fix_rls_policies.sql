-- Fix RLS Policies for Engagement Tables
-- The tables exist but RLS is blocking access

-- 1. Create policy for engagement_likes table
CREATE POLICY "engagement_likes_select_policy" ON "public"."engagement_likes"
FOR SELECT USING (
  -- Allow users to see likes for activities they can access
  EXISTS (
    SELECT 1 FROM activities a 
    WHERE a.id = engagement_likes.entity_id 
    AND a.entity_type = engagement_likes.entity_type
  )
);

CREATE POLICY "engagement_likes_insert_policy" ON "public"."engagement_likes"
FOR INSERT WITH CHECK (
  -- Allow authenticated users to insert their own likes
  auth.uid() = user_id
);

CREATE POLICY "engagement_likes_delete_policy" ON "public"."engagement_likes"
FOR DELETE USING (
  -- Allow users to delete their own likes
  auth.uid() = user_id
);

-- 2. Create policy for engagement_comments table
CREATE POLICY "engagement_comments_select_policy" ON "public"."engagement_comments"
FOR SELECT USING (
  -- Allow users to see comments for activities they can access
  EXISTS (
    SELECT 1 FROM activities a 
    WHERE a.id = engagement_comments.entity_id 
    AND a.entity_type = engagement_comments.entity_type
  )
);

CREATE POLICY "engagement_comments_insert_policy" ON "public"."engagement_comments"
FOR INSERT WITH CHECK (
  -- Allow authenticated users to insert their own comments
  auth.uid() = user_id
);

CREATE POLICY "engagement_comments_update_policy" ON "public"."engagement_comments"
FOR UPDATE USING (
  -- Allow users to update their own comments
  auth.uid() = user_id
);

CREATE POLICY "engagement_comments_delete_policy" ON "public"."engagement_comments"
FOR DELETE USING (
  -- Allow users to delete their own comments
  auth.uid() = user_id
);

-- 3. Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('engagement_likes', 'engagement_comments')
ORDER BY tablename, policyname;

-- 4. Test access
SELECT 'Testing access after policies...' as info;
SELECT COUNT(*) as engagement_likes_count FROM engagement_likes;
SELECT COUNT(*) as engagement_comments_count FROM engagement_comments;
