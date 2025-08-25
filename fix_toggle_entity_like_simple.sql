-- FIX toggle_entity_like FUNCTION - SIMPLE VERSION THAT WILL WORK
-- This creates a basic, working version without complex logic

-- =====================================================
-- STEP 1: DROP THE BROKEN FUNCTION
-- =====================================================

DROP FUNCTION IF EXISTS public.toggle_entity_like(uuid, text, uuid);

-- =====================================================
-- STEP 2: CREATE A SIMPLE WORKING FUNCTION
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
    
    -- Update engagement counts in activities table (only if it's an activity)
    IF p_entity_type = 'activity' THEN
        -- Simple update - just increment/decrement the like count
        IF is_liked THEN
            UPDATE public.activities 
            SET like_count = COALESCE(like_count, 0) + 1
            WHERE id = p_entity_id;
        ELSE
            UPDATE public.activities 
            SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
            WHERE id = p_entity_id;
        END IF;
    END IF;
    
    -- Return simple success response
    RETURN jsonb_build_object(
        'success', true,
        'is_liked', is_liked,
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
