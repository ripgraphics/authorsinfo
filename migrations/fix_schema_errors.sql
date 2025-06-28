-- Migration: Fix Database Schema Issues
-- This migration addresses the errors found in info.txt
-- Run this in your Supabase SQL Editor

-- 1. Add missing author_id column to activities table
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS author_id uuid;

-- 2. Add missing created_at and updated_at columns to publishers table
ALTER TABLE public.publishers 
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 3. Create a trigger to automatically update the updated_at column for publishers
CREATE OR REPLACE FUNCTION public.update_publishers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_publishers_updated_at_trigger ON public.publishers;
CREATE TRIGGER update_publishers_updated_at_trigger
    BEFORE UPDATE ON public.publishers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_publishers_updated_at();

-- 4. Fix the create_book_update_activity function to not use the placeholder user ID
CREATE OR REPLACE FUNCTION public.create_book_update_activity()
RETURNS TRIGGER AS $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get an admin user ID (first user with admin role or first user)
    SELECT user_id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
    
    -- If no admin found, use the first user
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM users ORDER BY created_at LIMIT 1;
    END IF;
    
    -- Only create activity if we have a valid user
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.activities (
            user_id,
            activity_type,
            book_id,
            data,
            created_at
        ) VALUES (
            admin_user_id,
            'book_updated',
            NEW.id,
            jsonb_build_object(
                'book_title', NEW.title,
                'book_id', NEW.id
            ),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Fix the create_user_profile_activity function to not use the placeholder user ID
CREATE OR REPLACE FUNCTION public.create_user_profile_activity()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT := 'Unknown User';
    changed_fields TEXT[] := '{}';
BEGIN
    -- Only create activity if significant fields changed
    IF OLD.bio != NEW.bio THEN
        -- Get user name
        SELECT name INTO user_name FROM users WHERE id = NEW.user_id;
        
        -- Build changed fields array
        IF OLD.bio != NEW.bio THEN
            changed_fields := array_append(changed_fields, 'bio');
        END IF;
        
        -- Insert profile_updated activity
        INSERT INTO activities (
            user_id,
            activity_type,
            user_profile_id,
            data,
            created_at
        ) VALUES (
            NEW.user_id,
            'profile_updated',
            NEW.user_id,
            jsonb_build_object(
                'user_id', NEW.user_id,
                'user_name', user_name,
                'updated_fields', changed_fields
            ),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Update existing publishers records to have created_at and updated_at values
UPDATE public.publishers 
SET 
    created_at = COALESCE(created_at, now()),
    updated_at = COALESCE(updated_at, now())
WHERE created_at IS NULL OR updated_at IS NULL;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activities_author_id ON public.activities(author_id);
CREATE INDEX IF NOT EXISTS idx_publishers_created_at ON public.publishers(created_at);

-- 8. Add comments to document the changes
COMMENT ON COLUMN public.activities.author_id IS 'Reference to the author associated with this activity';
COMMENT ON COLUMN public.publishers.created_at IS 'Timestamp when the publisher was created';
COMMENT ON COLUMN public.publishers.updated_at IS 'Timestamp when the publisher was last updated';

-- 9. Verify the fixes
DO $$
BEGIN
    -- Check if author_id column exists in activities
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'author_id' 
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'author_id column was not added to activities table';
    END IF;
    
    -- Check if created_at column exists in publishers
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'publishers' 
        AND column_name = 'created_at' 
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'created_at column was not added to publishers table';
    END IF;
    
    -- Check if updated_at column exists in publishers
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'publishers' 
        AND column_name = 'updated_at' 
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'updated_at column was not added to publishers table';
    END IF;
    
    RAISE NOTICE 'All schema fixes have been applied successfully!';
END $$; 