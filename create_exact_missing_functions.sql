-- CREATE EXACT MISSING FUNCTIONS - Based on Actual API Code Analysis
-- These are the exact functions your API endpoints are trying to call

-- =====================================================
-- STEP 1: CREATE toggle_entity_like FUNCTION (Called by /api/engagement/like)
-- =====================================================

CREATE OR REPLACE FUNCTION public.toggle_entity_like(
    p_user_id uuid,
    p_entity_type text,
    p_entity_id uuid
)
RETURNS boolean
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
    
    -- Return boolean as expected by the API
    RETURN is_liked;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error and return false
        RAISE LOG 'Error in toggle_entity_like: %', SQLERRM;
        RETURN false;
END;
$$;

-- =====================================================
-- STEP 2: CREATE add_engagement_comment FUNCTION (Called by /api/engagement/comment)
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_engagement_comment(
    p_user_id uuid,
    p_entity_type text,
    p_entity_id uuid,
    p_comment_text text,
    p_parent_comment_id uuid DEFAULT NULL
)
RETURNS uuid
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
        parent_comment_id,
        created_at
    ) VALUES (
        p_user_id, 
        p_entity_type, 
        p_entity_id, 
        p_comment_text, 
        p_parent_comment_id,
        NOW()
    ) RETURNING id INTO new_comment_id;
    
    -- Update comment count in activities table (only if it's an activity)
    IF p_entity_type = 'activity' THEN
        UPDATE public.activities 
        SET comment_count = COALESCE(comment_count, 0) + 1
        WHERE id = p_entity_id;
    END IF;
    
    -- Return the comment ID as expected by the API
    RETURN new_comment_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error and return NULL
        RAISE LOG 'Error in add_engagement_comment: %', SQLERRM;
        RETURN NULL;
END;
$$;
