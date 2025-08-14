-- Fix get_user_feed_activities stored procedure to return all necessary columns
-- This will allow image posts to display correctly in the feed

-- First drop the existing function
DROP FUNCTION IF EXISTS "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer);

-- Now create the new function with all necessary columns
CREATE OR REPLACE FUNCTION "public"."get_user_feed_activities"(
    "p_user_id" "uuid", 
    "p_limit" integer DEFAULT 50, 
    "p_offset" integer DEFAULT 0
) RETURNS TABLE(
    "id" "uuid", 
    "user_id" "uuid", 
    "user_name" character varying, 
    "user_avatar_url" character varying, 
    "activity_type" "text", 
    "data" "jsonb",
    "created_at" timestamp with time zone, 
    "is_public" boolean, 
    "like_count" integer, 
    "comment_count" integer, 
    "is_liked" boolean, 
    "entity_type" "text", 
    "entity_id" "text",
    -- Add missing columns that are needed for image posts
    "content_type" "text",
    "image_url" "text",
    "text" "text",
    "visibility" "text",
    "content_summary" "text",
    "link_url" "text",
    "hashtags" "text"[],
    "share_count" integer,
    "view_count" integer,
    "engagement_score" numeric,
    "metadata" "jsonb"
) LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.user_id,
        u.name::character varying as user_name,
        '/placeholder.svg?height=200&width=200'::character varying as user_avatar_url,
        a.activity_type,
        a.data,
        a.created_at,
        true as is_public,
        COALESCE(a.like_count, 0) as like_count,
        COALESCE(a.comment_count, 0) as comment_count,
        false as is_liked,
        COALESCE(a.entity_type, 'user') as entity_type,
        COALESCE(a.entity_id::text, a.user_id::text) as entity_id,
        -- Return the actual table columns for image posts
        a.content_type,
        a.image_url,
        a.text,
        a.visibility,
        a.content_summary,
        a.link_url,
        a.hashtags,
        COALESCE(a.share_count, 0) as share_count,
        COALESCE(a.view_count, 0) as view_count,
        COALESCE(a.engagement_score, 0) as engagement_score,
        a.metadata
    FROM public.activities a
    LEFT JOIN public.users u ON a.user_id = u.id
    WHERE a.user_id = p_user_id
    ORDER BY a.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Update function owner
ALTER FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";

-- Grant permissions
GRANT ALL ON FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";
