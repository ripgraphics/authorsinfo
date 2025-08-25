-- CREATE MISSING ENGAGEMENT FUNCTIONS
-- This creates the functions that your existing API endpoints are trying to call
-- No database schema changes - just adding missing functions

-- =====================================================
-- STEP 1: CREATE toggle_entity_like FUNCTION
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
    
    IF existing_like_id IS NOT NULL THEN
        -- User already liked, so unlike
        DELETE FROM public.engagement_likes 
        WHERE id = existing_like_id;
        
        -- Update the activities table like_count
        UPDATE public.activities 
        SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
        WHERE id = p_entity_id::uuid;
        
        is_liked := false;
    ELSE
        -- User hasn't liked, so like
        INSERT INTO public.engagement_likes (user_id, entity_type, entity_id, created_at)
        VALUES (p_user_id, p_entity_type, p_entity_id, NOW());
        
        -- Update the activities table like_count
        UPDATE public.activities 
        SET like_count = COALESCE(like_count, 0) + 1
        WHERE id = p_entity_id::uuid;
        
        is_liked := true;
    END IF;
    
    RETURN is_liked;
END;
$$;

-- =====================================================
-- STEP 2: CREATE add_entity_comment FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_entity_comment(
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
    comment_depth integer;
    thread_id uuid;
BEGIN
    -- Set comment depth
    IF p_parent_comment_id IS NULL THEN
        comment_depth := 0;
        thread_id := gen_random_uuid();
    ELSE
        -- Get parent comment depth and thread_id
        SELECT comment_depth + 1, thread_id INTO comment_depth, thread_id
        FROM public.engagement_comments
        WHERE id = p_parent_comment_id;
        
        IF thread_id IS NULL THEN
            thread_id := gen_random_uuid();
        END IF;
    END IF;
    
    -- Insert the comment
    INSERT INTO public.engagement_comments (
        user_id, 
        entity_type, 
        entity_id, 
        comment_text, 
        parent_comment_id,
        comment_depth,
        thread_id,
        created_at
    ) VALUES (
        p_user_id, 
        p_entity_type, 
        p_entity_id, 
        p_comment_text, 
        p_parent_comment_id,
        comment_depth,
        thread_id,
        NOW()
    ) RETURNING id INTO new_comment_id;
    
    -- Update the activities table comment_count
    UPDATE public.activities 
    SET comment_count = COALESCE(comment_count, 0) + 1
    WHERE id = p_entity_id::uuid;
    
    RETURN new_comment_id;
END;
$$;

-- =====================================================
-- STEP 3: GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.toggle_entity_like(uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_entity_comment(uuid, text, uuid, text, uuid) TO authenticated;

-- =====================================================
-- STEP 4: VERIFICATION
-- =====================================================

-- Check if functions were created
SELECT 
    'FUNCTIONS STATUS' as info,
    routine_name,
    routine_type,
    '✅ EXISTS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('toggle_entity_like', 'add_entity_comment')
ORDER BY routine_name;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '✅ MISSING ENGAGEMENT FUNCTIONS CREATED SUCCESSFULLY!' as status;
SELECT 'Your existing API endpoints should now work properly.' as message;
SELECT 'Try liking and commenting on a post - it should now persist after refresh!' as details;
