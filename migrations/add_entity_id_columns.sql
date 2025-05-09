-- Migration to add dedicated entity ID columns to activities table
-- This provides better performance, data integrity, and query simplicity

-- Add user_profile_id column with foreign key constraint
ALTER TABLE activities 
ADD COLUMN user_profile_id UUID REFERENCES profiles(user_id);

-- Add group_id column with foreign key constraint
ALTER TABLE activities 
ADD COLUMN group_id UUID REFERENCES groups(id);

-- Add event_id column with foreign key constraint
-- Assuming events table will have UUID primary key
ALTER TABLE activities 
ADD COLUMN event_id UUID;

-- Create indexes for performance
CREATE INDEX idx_activities_user_profile_id ON activities(user_profile_id);
CREATE INDEX idx_activities_group_id ON activities(group_id);
CREATE INDEX idx_activities_event_id ON activities(event_id);

-- Migrate any existing data from JSONB to dedicated columns
UPDATE activities
SET user_profile_id = (data->>'user_profile_id')::UUID
WHERE data->>'user_profile_id' IS NOT NULL;

UPDATE activities
SET group_id = (data->>'group_id')::UUID
WHERE data->>'group_id' IS NOT NULL;

-- Note: Can't migrate event data since it doesn't exist yet

-- Update function to use new columns
CREATE OR REPLACE FUNCTION create_user_profile_activity()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get an admin user ID
  SELECT user_id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
  
  -- If no admin found, use the first user
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM users ORDER BY created_at LIMIT 1;
  END IF;
  
  -- Insert user_profile_created activity
  INSERT INTO activities (
    user_id,
    activity_type,
    user_profile_id, -- Use the new column
    data,
    created_at
  ) VALUES (
    NEW.user_id,
    'user_profile_created',
    NEW.user_id, -- Store in dedicated column
    jsonb_build_object(
      'profile_id', NEW.id,
      'user_id', NEW.user_id
    ),
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update function to use new columns for groups
CREATE OR REPLACE FUNCTION create_group_activity()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get an admin user ID
  SELECT user_id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
  
  -- If no admin found, use the first user
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM users ORDER BY created_at LIMIT 1;
  END IF;
  
  -- Insert group_created activity
  INSERT INTO activities (
    user_id,
    activity_type,
    group_id, -- Use the new column
    data,
    created_at
  ) VALUES (
    NEW.created_by,
    'group_created',
    NEW.id, -- Store in dedicated column
    jsonb_build_object(
      'group_id', NEW.id,
      'group_name', NEW.name
    ),
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add a comment explaining the proper usage
COMMENT ON TABLE activities IS 'Stores activity events for various entity types. Use dedicated ID columns (book_id, review_id, list_id, user_profile_id, group_id, event_id) for foreign keys, and the data JSONB field for additional attributes.'; 