-- Add missing columns to reading_challenges table
-- Run this in Supabase SQL Editor

-- Add missing columns to reading_challenges
DO $$
BEGIN
    -- Add challenge_year if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reading_challenges' AND column_name = 'challenge_year') THEN
        ALTER TABLE reading_challenges ADD COLUMN challenge_year INTEGER;
    END IF;
    
    -- Add start_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reading_challenges' AND column_name = 'start_date') THEN
        ALTER TABLE reading_challenges ADD COLUMN start_date TIMESTAMPTZ;
    END IF;
    
    -- Add end_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reading_challenges' AND column_name = 'end_date') THEN
        ALTER TABLE reading_challenges ADD COLUMN end_date TIMESTAMPTZ;
    END IF;
    
    -- Add goal_type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reading_challenges' AND column_name = 'goal_type') THEN
        ALTER TABLE reading_challenges ADD COLUMN goal_type TEXT;
    END IF;
    
    -- Add goal_value if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reading_challenges' AND column_name = 'goal_value') THEN
        ALTER TABLE reading_challenges ADD COLUMN goal_value INTEGER;
    END IF;
    
    -- Add current_value if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reading_challenges' AND column_name = 'current_value') THEN
        ALTER TABLE reading_challenges ADD COLUMN current_value INTEGER DEFAULT 0;
    END IF;
    
    -- Add status if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reading_challenges' AND column_name = 'status') THEN
        ALTER TABLE reading_challenges ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    
    -- Add description if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reading_challenges' AND column_name = 'description') THEN
        ALTER TABLE reading_challenges ADD COLUMN description TEXT;
    END IF;
    
    -- Add completed_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reading_challenges' AND column_name = 'completed_at') THEN
        ALTER TABLE reading_challenges ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;
    
    -- Add user_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reading_challenges' AND column_name = 'user_id') THEN
        ALTER TABLE reading_challenges ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add missing columns to reading_sessions
DO $$
BEGIN
    -- Add session_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reading_sessions' AND column_name = 'session_date') THEN
        ALTER TABLE reading_sessions ADD COLUMN session_date TIMESTAMPTZ;
    END IF;
    
    -- Add duration_minutes if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reading_sessions' AND column_name = 'duration_minutes') THEN
        ALTER TABLE reading_sessions ADD COLUMN duration_minutes INTEGER;
    END IF;
    
    -- Add pages_read if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reading_sessions' AND column_name = 'pages_read') THEN
        ALTER TABLE reading_sessions ADD COLUMN pages_read INTEGER;
    END IF;
    
    -- Add user_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reading_sessions' AND column_name = 'user_id') THEN
        ALTER TABLE reading_sessions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

