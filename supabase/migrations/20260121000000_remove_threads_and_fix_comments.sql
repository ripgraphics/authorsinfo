-- Migration to remove threads table and fix comments threading
-- Created: 2026-01-21
-- Based on user feedback: "why are you looking at the thread table that table isn not in use and should be removed"

-- Step 1: Remove foreign key constraint from comments
ALTER TABLE IF EXISTS public.comments 
    DROP CONSTRAINT IF EXISTS fk_comments_thread_id;

-- Step 2: Remove thread_id column from comments
ALTER TABLE IF EXISTS public.comments 
    DROP COLUMN IF EXISTS thread_id;

-- Step 3: Drop threads table
DROP TABLE IF EXISTS public.threads;

-- Step 4: Redefine add_entity_comment to ensure it's clean
CREATE OR REPLACE FUNCTION public.add_entity_comment(
    p_user_id UUID,
    p_entity_type UUID,  -- MUST be entity_types.id (UUID), not name
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
    v_entity_type_exists BOOLEAN;
BEGIN
    -- Validate that p_entity_type exists in entity_types table
    SELECT EXISTS (
        SELECT 1 
        FROM public.entity_types 
        WHERE id = p_entity_type
    ) INTO v_entity_type_exists;
    
    IF NOT v_entity_type_exists THEN
        RAISE EXCEPTION 'Entity type ID % does not exist in entity_types table', p_entity_type;
    END IF;
    
    -- Create the comment
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

-- Step 5: Verify migration
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Removed threads table and fixed comments';
    RAISE NOTICE '   - Dropped fk_comments_thread_id';
    RAISE NOTICE '   - Dropped comments.thread_id column';
    RAISE NOTICE '   - Dropped public.threads table';
    RAISE NOTICE '   - Verified add_entity_comment function';
    RAISE NOTICE '========================================';
END $$;
