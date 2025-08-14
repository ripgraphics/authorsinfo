-- Fix conflicting RLS policies on activities table
-- This migration cleans up duplicate policies and ensures proper access control

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS activities_insert_policy ON activities;
DROP POLICY IF EXISTS activities_select_policy ON activities;
DROP POLICY IF EXISTS activities_update_policy ON activities;
DROP POLICY IF EXISTS activities_delete_policy ON activities;
DROP POLICY IF EXISTS users_insert_own_activities ON activities;
DROP POLICY IF EXISTS users_update_own_activities ON activities;
DROP POLICY IF EXISTS users_delete_own_activities ON activities;

-- Create clean, non-conflicting RLS policies
CREATE POLICY activities_insert_policy ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY activities_select_policy ON activities
  FOR SELECT USING (
    -- Users can see their own activities
    auth.uid() = user_id
    OR
    -- Users can see public activities (based on metadata->privacy_level)
    COALESCE(metadata->>'privacy_level', 'public') = 'public'
    OR
    -- Users can see activities from friends if privacy allows
    (COALESCE(metadata->>'privacy_level', 'public') = 'friends' AND EXISTS (
      SELECT 1 FROM user_friends 
      WHERE (user_id = auth.uid() AND friend_id = activities.user_id)
      OR (friend_id = auth.uid() AND user_id = activities.user_id)
    ))
    OR
    -- Users can see group activities if they are members
    (COALESCE(metadata->>'privacy_level', 'public') = 'group' AND group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = activities.group_id AND user_id = auth.uid()
    ))
  );

CREATE POLICY activities_update_policy ON activities
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY activities_delete_policy ON activities
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON activities TO authenticated;
