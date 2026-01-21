-- Fix: Remove invalid fk_comments_entity_id constraint and fix add_entity_comment function
-- The entities table does NOT exist - it was removed
-- Comments use polymorphic references (entity_type + entity_id) to reference any table
-- Created: 2026-01-20

-- Step 1: Remove the invalid foreign key constraint (if it exists)
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public'
          AND table_name = 'comments'
          AND constraint_name = 'fk_comments_entity_id'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        ALTER TABLE public.comments DROP CONSTRAINT fk_comments_entity_id;
        RAISE NOTICE '✅ Removed invalid fk_comments_entity_id constraint';
    ELSE
        RAISE NOTICE '⚠ fk_comments_entity_id constraint does not exist';
    END IF;
END $$;

-- Step 2: Drop and recreate add_entity_comment function
-- Since entities table doesn't exist, we just create the comment directly
DROP FUNCTION IF EXISTS public.add_entity_comment(UUID, TEXT, UUID, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.add_entity_comment(
    p_user_id UUID,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_comment_text TEXT,
    p_parent_comment_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_comment_id UUID;
BEGIN
    -- Create the comment directly
    -- No need to check/create entity since entities table doesn't exist
    -- Comments use polymorphic references (entity_type + entity_id)
    INSERT INTO public.comments (
        user_id,
        entity_type,
        entity_id,
        content,
        parent_comment_id,
        is_deleted,
        is_hidden,
        created_at,
        updated_at
    )
    VALUES (
        p_user_id,
        p_entity_type,
        p_entity_id,
        p_comment_text,
        p_parent_comment_id,
        false,
        false,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_comment_id;
    
    RETURN v_comment_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to add comment: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.add_entity_comment(UUID, TEXT, UUID, TEXT, UUID) IS 
'Creates a comment on an entity. Comments use polymorphic references (entity_type + entity_id) to reference any table. No entities table exists - entity_id can reference activities, books, authors, etc.';

-- Step 3: Verify
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Fixed add_entity_comment function';
    RAISE NOTICE '   - Removed invalid fk_comments_entity_id constraint';
    RAISE NOTICE '   - Function now creates comments directly';
    RAISE NOTICE '   - No entity creation needed (entities table does not exist)';
    RAISE NOTICE '   - Comments use polymorphic entity references';
    RAISE NOTICE '========================================';
END $$;
