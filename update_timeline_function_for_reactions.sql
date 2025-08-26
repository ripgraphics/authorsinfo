-- UPDATE TIMELINE FUNCTION TO INCLUDE USER REACTION TYPE
-- This script updates the get_entity_timeline_activities function to include user reaction information

-- Step 1: Check if the function exists and see its current structure
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'get_entity_timeline_activities'
AND routine_schema = 'public';

-- Step 2: Drop the existing function if it exists
DROP FUNCTION IF EXISTS "public"."get_entity_timeline_activities"(
    "p_entity_type" "text",
    "p_entity_id" "uuid",
    "p_limit" integer,
    "p_offset" integer
);

-- Step 3: Create the enhanced function with user reaction information
CREATE OR REPLACE FUNCTION "public"."get_entity_timeline_activities"(
    "p_entity_type" "text",
    "p_entity_id" "uuid",
    "p_limit" integer DEFAULT 50,
    "p_offset" integer DEFAULT 0
) RETURNS TABLE(
    "id" "uuid",
    "user_id" "uuid",
    "user_name" "text",
    "user_avatar_url" "text",
    "activity_type" "text",
    "data" "jsonb",
    "created_at" "timestamp with time zone",
    "is_public" boolean,
    "like_count" bigint,
    "comment_count" bigint,
    "share_count" bigint,
    "view_count" bigint,
    "is_liked" boolean,
    "entity_type" "text",
    "entity_id" "uuid",
    "content_type" "text",
    "text" "text",
    "image_url" "text",
    "link_url" "text",
    "content_summary" "text",
    "hashtags" "text"[],
    "visibility" "text",
    "engagement_score" numeric,
    "updated_at" "timestamp with time zone",
    "cross_posted_to" "text"[],
    "collaboration_type" "text",
    "ai_enhanced" boolean,
    "ai_enhanced_text" "text",
    "ai_enhanced_performance" numeric,
    "metadata" "jsonb",
    "user_reaction_type" "text"
) LANGUAGE "plpgsql" SECURITY DEFINER AS $$
DECLARE
    v_current_user_id uuid;
BEGIN
    -- Get the current user ID from auth context
    v_current_user_id := auth.uid();
    
    RETURN QUERY
    SELECT 
        a.id,
        a.user_id,
        COALESCE(up.full_name, up.email) as user_name,
        up.avatar_url as user_avatar_url,
        a.activity_type,
        a.data,
        a.created_at,
        a.is_public,
        COALESCE(a.like_count, 0) as like_count,
        COALESCE(a.comment_count, 0) as comment_count,
        COALESCE(a.share_count, 0) as share_count,
        COALESCE(a.view_count, 0) as view_count,
        CASE 
            WHEN v_current_user_id IS NOT NULL THEN 
                EXISTS (
                    SELECT 1 FROM public.engagement_likes el 
                    WHERE el.entity_type = a.entity_type 
                    AND el.entity_id = a.id 
                    AND el.user_id = v_current_user_id
                )
            ELSE false 
        END as is_liked,
        a.entity_type,
        a.entity_id,
        a.content_type,
        a.text,
        a.image_url,
        a.link_url,
        a.content_summary,
        a.hashtags,
        a.visibility,
        COALESCE(a.engagement_score, 0) as engagement_score,
        a.updated_at,
        a.cross_posted_to,
        a.collaboration_type,
        a.ai_enhanced,
        a.ai_enhanced_text,
        a.ai_enhanced_performance,
        a.metadata,
        -- Get the user's current reaction type
        CASE 
            WHEN v_current_user_id IS NOT NULL THEN 
                (SELECT el.reaction_type 
                 FROM public.engagement_likes el 
                 WHERE el.entity_type = a.entity_type 
                 AND el.entity_id = a.id 
                 AND el.user_id = v_current_user_id
                 LIMIT 1)
            ELSE NULL 
        END as user_reaction_type
    FROM public.activities a
    LEFT JOIN public.user_profiles up ON a.user_id = up.id
    WHERE a.entity_type = p_entity_type 
    AND a.entity_id = p_entity_id
    AND a.is_public = true
    ORDER BY a.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Step 4: Grant execute permissions
GRANT EXECUTE ON FUNCTION "public"."get_entity_timeline_activities"(
    "p_entity_type" "text",
    "p_entity_id" "uuid",
    "p_limit" integer,
    "p_offset" integer
) TO "anon", "authenticated", "service_role";

-- Step 5: Add comment to the function
COMMENT ON FUNCTION "public"."get_entity_timeline_activities"(
    "p_entity_type" "text",
    "p_entity_id" "uuid",
    "p_limit" integer,
    "p_offset" integer
) IS 'Enhanced timeline function that includes user reaction type information';

-- Step 6: Test the function with a sample call
-- SELECT * FROM "public"."get_entity_timeline_activities"('author', '00000000-0000-0000-0000-000000000000', 5, 0);

-- Step 7: Verify the function was created successfully
SELECT 
    routine_name,
    routine_type,
    data_type,
    is_deterministic,
    security_type
FROM information_schema.routines 
WHERE routine_name = 'get_entity_timeline_activities'
AND routine_schema = 'public';
