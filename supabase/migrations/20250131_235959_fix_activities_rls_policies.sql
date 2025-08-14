-- Fix RLS policies to allow users to create posts
-- This migration removes the problematic service_role-only policies

-- Drop the conflicting policies that only allow service_role
DROP POLICY IF EXISTS "System can insert activities" ON activities;
DROP POLICY IF EXISTS "System can update activities" ON activities;
DROP POLICY IF EXISTS "System can delete activities" ON activities;

-- Create policy for users to insert their own activities
CREATE POLICY "users_insert_own_activities" ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own activities  
CREATE POLICY "users_update_own_activities" ON activities
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for users to delete their own activities
CREATE POLICY "users_delete_own_activities" ON activities
  FOR DELETE USING (auth.uid() = user_id);
