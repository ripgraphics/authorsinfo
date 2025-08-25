-- FIX add_entity_comment FUNCTION - SIMPLE VERSION THAT WILL WORK
-- This creates a basic, working version without complex logic

-- =====================================================
-- STEP 1: DROP THE BROKEN FUNCTION
-- =====================================================

DROP FUNCTION IF EXISTS public.add_entity_comment(uuid, text, uuid, text);

-- =====================================================
-- STEP 2: CREATE A SIMPLE WORKING FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_entity_comment(
    p_user_id uuid,
    p_entity_type text,
    p_entity_id uuid,
    p_comment_text text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_comment_id uuid;
BEGIN
    -- Add comment to engagement_comments table
    INSERT INTO public.engagement_comments (
        user_id, 
        entity_type, 
        entity_id, 
        comment_text, 
        created_at
    ) VALUES (
        p_user_id, 
        p_entity_type, 
        p_entity_id, 
        p_comment_text, 
        NOW()
    ) RETURNING id INTO new_comment_id;
    
    -- Update comment count in activities table (only if it's an activity)
    IF p_entity_type = 'activity' THEN
        UPDATE public.activities 
        SET comment_count = COALESCE(comment_count, 0) + 1
        WHERE id = p_entity_id;
    END IF;
    
    -- Return simple success response
    RETURN jsonb_build_object(
        'success', true,
        'comment_id', new_comment_id,
        'message', 'Comment added successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error response
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'message', 'Failed to add comment'
        );
END;
$$;
