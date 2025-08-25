-- FIX add_entity_comment FUNCTION - Resolves Comment Errors
-- This fixes the function for adding comments

-- =====================================================
-- STEP 1: DROP THE BROKEN FUNCTION
-- =====================================================

DROP FUNCTION IF EXISTS public.add_entity_comment(uuid, text, uuid, text);

-- =====================================================
-- STEP 2: CREATE THE FIXED FUNCTION
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
    comment_count integer;
    user_has_reacted boolean;
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
    
    -- Update engagement counts in activities table
    IF p_entity_type = 'activity' THEN
        -- Get current comment count
        SELECT COALESCE(comment_count, 0) INTO comment_count
        FROM public.activities 
        WHERE id = p_entity_id;
        
        -- Update comment count
        UPDATE public.activities 
        SET 
            comment_count = comment_count + 1,
            updated_at = NOW()
        WHERE id = p_entity_id;
        
        -- Check if user has any engagement with this activity
        SELECT EXISTS(
            SELECT 1 FROM public.engagement_likes 
            WHERE user_id = p_user_id AND entity_type = 'activity' AND entity_id = p_entity_id
        ) OR EXISTS(
            SELECT 1 FROM public.engagement_comments 
            WHERE user_id = p_user_id AND entity_type = 'activity' AND entity_id = p_entity_id
        ) INTO user_has_reacted;
        
        -- Update user_has_reacted flag
        UPDATE public.activities 
        SET user_has_reacted = user_has_reacted
        WHERE id = p_entity_id;
    END IF;
    
    -- Return success response
    RETURN jsonb_build_object(
        'success', true,
        'comment_id', new_comment_id,
        'comment_count', comment_count + 1,
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
