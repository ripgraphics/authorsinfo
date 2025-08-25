-- FIX toggle_entity_like FUNCTION - Resolves 500 Error
-- This fixes the function that's causing the server error

-- =====================================================
-- STEP 1: DROP THE BROKEN FUNCTION
-- =====================================================

DROP FUNCTION IF EXISTS public.toggle_entity_like(uuid, text, uuid);

-- =====================================================
-- STEP 2: CREATE THE FIXED FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.toggle_entity_like(
    p_user_id uuid,
    p_entity_type text,
    p_entity_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_like_id uuid;
    is_liked boolean;
    like_count integer;
    comment_count integer;
    share_count integer;
    bookmark_count integer;
    user_has_reacted boolean;
BEGIN
    -- Check if user already liked this entity
    SELECT id INTO existing_like_id
    FROM public.engagement_likes
    WHERE user_id = p_user_id 
      AND entity_type = p_entity_type
      AND entity_id = p_entity_id;
    
    -- Toggle like status
    IF existing_like_id IS NOT NULL THEN
        -- Remove like
        DELETE FROM public.engagement_likes 
        WHERE id = existing_like_id;
        is_liked := false;
    ELSE
        -- Add like
        INSERT INTO public.engagement_likes (user_id, entity_type, entity_id, created_at)
        VALUES (p_user_id, p_entity_type, p_entity_id, NOW());
        is_liked := true;
    END IF;
    
    -- Update engagement counts in activities table
    IF p_entity_type = 'activity' THEN
        -- Get current counts
        SELECT 
            COALESCE(like_count, 0),
            COALESCE(comment_count, 0),
            COALESCE(share_count, 0),
            COALESCE(bookmark_count, 0)
        INTO like_count, comment_count, share_count, bookmark_count
        FROM public.activities 
        WHERE id = p_entity_id;
        
        -- Update like count
        UPDATE public.activities 
        SET 
            like_count = CASE WHEN is_liked THEN like_count + 1 ELSE GREATEST(like_count - 1, 0) END,
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
        'is_liked', is_liked,
        'like_count', CASE WHEN is_liked THEN like_count + 1 ELSE GREATEST(like_count - 1, 0) END,
        'message', CASE WHEN is_liked THEN 'Post liked successfully' ELSE 'Post unliked successfully' END
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error response
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'message', 'Failed to toggle like'
        );
END;
$$;
