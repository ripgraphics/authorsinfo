-- Add event creation permission settings to group_settings
-- This allows group owners to control who can create events in their group

-- Add event_creation_permission field to group_settings if it doesn't exist
-- First check if group_settings table exists
DO $$
BEGIN
    -- Check if group_settings table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'group_settings'
    ) THEN
        -- Add event_creation_permission field (default: 'owner' - only owner can create)
        -- Options: 'owner' (only owner), 'admin' (owner and admins), 'list' (owner, admin, list level), 'member' (all members)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'group_settings' 
            AND column_name = 'event_creation_permission'
        ) THEN
            ALTER TABLE public.group_settings 
            ADD COLUMN event_creation_permission TEXT DEFAULT 'owner';
            
            -- Add check constraint
            ALTER TABLE public.group_settings 
            ADD CONSTRAINT group_settings_event_creation_permission_check 
            CHECK (event_creation_permission IN ('owner', 'admin', 'list', 'member'));
        END IF;
    END IF;
END $$;

-- Update existing group_settings to have default 'owner' permission (only if table exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'group_settings'
    ) THEN
        UPDATE public.group_settings 
        SET event_creation_permission = 'owner' 
        WHERE event_creation_permission IS NULL;
    END IF;
END $$;

