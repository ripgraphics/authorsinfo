-- Fix conflicting RLS policies on activities table
-- This script removes conflicting policies and ensures proper user access

-- First, drop all existing policies to start clean
DROP POLICY IF EXISTS "Users can view their own activities" ON activities;
DROP POLICY IF EXISTS "Users can view public activities" ON activities;
DROP POLICY IF EXISTS "System can insert activities" ON activities;
DROP POLICY IF EXISTS "System can update activities" ON activities;
DROP POLICY IF EXISTS "System can delete activities" ON activities;
DROP POLICY IF EXISTS "activities_delete_policy" ON activities;
DROP POLICY IF EXISTS "activities_insert_policy" ON activities;
DROP POLICY IF EXISTS "activities_select_policy" ON activities;
DROP POLICY IF EXISTS "activities_update_policy" ON activities;

-- Now create the correct, non-conflicting policies
-- Users can insert their own activities
CREATE POLICY "users_insert_own_activities" ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own activities
CREATE POLICY "users_view_own_activities" ON activities
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view public activities (for timeline visibility)
CREATE POLICY "users_view_public_activities" ON activities
  FOR SELECT USING (
    -- Allow viewing if it's a public post
    (data->>'visibility' = 'public') OR
    -- Or if it's the user's own post
    (auth.uid() = user_id) OR
    -- Or if it's shared with friends and user is connected
    (data->>'visibility' = 'friends' AND 
     EXISTS (
       SELECT 1 FROM user_friends 
       WHERE (user_id = auth.uid() AND friend_id = activities.user_id) OR
             (friend_id = auth.uid() AND user_id = activities.user_id)
     ))
  );

-- Users can update their own activities
CREATE POLICY "users_update_own_activities" ON activities
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own activities
CREATE POLICY "users_delete_own_activities" ON activities
  FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON activities TO authenticated;

-- Verify the policies are working
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'activities'
ORDER BY policyname;
