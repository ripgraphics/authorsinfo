-- Add user_has_reacted column to activities table
-- This column tracks whether the current user has liked/reacted to each activity

-- First, check if the column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'user_has_reacted'
    ) THEN
        -- Add the column
        ALTER TABLE public.activities 
        ADD COLUMN user_has_reacted boolean DEFAULT false;
        
        -- Add comment
        COMMENT ON COLUMN public.activities.user_has_reacted IS 'Whether the current user has reacted to this activity (used for UI state)';
        
        RAISE NOTICE 'Added user_has_reacted column to activities table';
    ELSE
        RAISE NOTICE 'user_has_reacted column already exists in activities table';
    END IF;
END $$;

-- Update the get_entity_timeline_activities function to include user_has_reacted
-- This will require the function to accept a user_id parameter to check if they've reacted

-- For now, we'll keep the existing function but note that it needs to be updated
-- to properly handle user-specific engagement state
