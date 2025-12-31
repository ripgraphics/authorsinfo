-- Allow all authenticated users to create events
-- This migration ensures that any logged-in user can create events associated with their profile

-- Enable RLS on events table if not already enabled
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing INSERT policy if it exists (in case it was restrictive)
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
DROP POLICY IF EXISTS "Users can create events" ON events;
DROP POLICY IF EXISTS "Only authorized users can create events" ON events;

-- Create policy allowing all authenticated users to create events
-- Events are automatically associated with the user via created_by field
CREATE POLICY "Authenticated users can create events" ON events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Ensure users can view their own events
DROP POLICY IF EXISTS "Users can view their own events" ON events;
CREATE POLICY "Users can view their own events" ON events
  FOR SELECT TO authenticated
  USING (auth.uid() = created_by);

-- Ensure users can update their own events
DROP POLICY IF EXISTS "Users can update their own events" ON events;
CREATE POLICY "Users can update their own events" ON events
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Ensure users can delete their own events
DROP POLICY IF EXISTS "Users can delete their own events" ON events;
CREATE POLICY "Users can delete their own events" ON events
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

