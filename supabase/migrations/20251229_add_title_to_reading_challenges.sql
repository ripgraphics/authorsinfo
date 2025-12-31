-- Add missing title column to reading_challenges table
-- This column is required by the API but was missing from the original table structure

DO $$
BEGIN
    -- Add title column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reading_challenges' AND column_name = 'title') THEN
        ALTER TABLE reading_challenges ADD COLUMN title TEXT;
        
        -- If there are existing rows with data, we could set a default title
        -- For now, we'll leave it nullable since existing rows might not have titles
    END IF;
END $$;

