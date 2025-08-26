-- Fix the get_user_feed_activities function to properly calculate engagement counts
-- This function is currently broken because it tries to access act.like_count and act.comment_count
-- which don't exist in the activities table

CREATE OR REPLACE FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) 
RETURNS TABLE(
    "id" "text", 
    "user_id" "text", 
    "user_name" "text", 
    "user_avatar_url" "text", 
    "activity_type" "text", 
    "data" "jsonb", 
    "created_at" "text", 
    "is_public" boolean, 
    "like_count" integer, 
    "comment_count" integer, 
    "share_count" integer, 
    "view_count" integer, 
    "is_liked" boolean, 
    "entity_type" "text", 
    "entity_id" "text", 
    "content_type" "text", 
    "text" "text", 
    "image_url" "text", 
    "link_url" "text", 
    "content_summary" "text", 
    "hashtags" "text"[], 
    "visibility" "text", 
    "engagement_score" numeric, 
    "updated_at" "text", 
    "cross_posted_to" "text"[], 
    "collaboration_type" "text", 
    "ai_enhanced" boolean, 
    "ai_enhanced_text" "text", 
    "ai_enhanced_performance" numeric, 
    "metadata" "jsonb", 
    "publish_status" "text", 
    "published_at" "text", 
    "is_featured" boolean, 
    "is_pinned" boolean, 
    "bookmark_count" integer, 
    "trending_score" numeric
)
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        act.id::text as id,
        act.user_id::text as user_id,
        COALESCE(usr.name::text, 'Unknown User') as user_name,
        '/placeholder.svg?height=200&width=200' as user_avatar_url,
        act.activity_type,
        COALESCE(act.data, '{}'::jsonb) as data,
        act.created_at::text as created_at,
        COALESCE(act.visibility = 'public', true) as is_public,
        -- Calculate like_count from engagement_likes table
        COALESCE((
            SELECT COUNT(*)::integer 
            FROM public.engagement_likes el 
            WHERE el.entity_id = act.id AND el.entity_type = 'activity'
        ), 0) as like_count,
        -- Calculate comment_count from engagement_comments table
        COALESCE((
            SELECT COUNT(*)::integer 
            FROM public.engagement_comments ec 
            WHERE ec.entity_id = act.id AND ec.entity_type = 'activity'
        ), 0) as comment_count,
        COALESCE(act.view_count, 0) as share_count, -- Using view_count as share_count for now
        COALESCE(act.view_count, 0) as view_count,
        false as is_liked,
        COALESCE(act.entity_type, 'user') as entity_type,
        COALESCE(act.entity_id::text, act.user_id::text) as entity_id,
        COALESCE(act.content_type, 'text') as content_type,
        -- Improved text content with better fallbacks
        CASE 
            WHEN act.text IS NOT NULL AND act.text != '' THEN act.text
            WHEN act.data IS NOT NULL AND act.data != '{}'::jsonb THEN
                COALESCE(
                    act.data->>'content',
                    act.data->>'text',
                    act.data->>'description',
                    act.data->>'summary',
                    CASE act.activity_type
                        WHEN 'post' THEN 'Shared a post'
                        WHEN 'book_review' THEN 'Shared a book review'
                        WHEN 'book_share' THEN 'Shared a book'
                        WHEN 'reading_progress' THEN 'Updated reading progress'
                        WHEN 'book_added' THEN 'Added a book to their library'
                        WHEN 'author_follow' THEN 'Started following an author'
                        WHEN 'book_recommendation' THEN 'Recommended a book'
                        ELSE 'Shared an update'
                    END
                )
            ELSE
                CASE act.activity_type
                    WHEN 'post' THEN 'Shared a post'
                    WHEN 'book_review' THEN 'Shared a book review'
                    WHEN 'book_share' THEN 'Shared a book'
                    WHEN 'reading_progress' THEN 'Updated reading progress'
                    WHEN 'book_added' THEN 'Added a book to their library'
                    WHEN 'author_follow' THEN 'Started following an author'
                    WHEN 'book_recommendation' THEN 'Recommended a book'
                    ELSE 'Shared an update'
                END
        END as text,
        COALESCE(act.image_url, '') as image_url,
        COALESCE(act.link_url, '') as link_url,
        COALESCE(act.content_summary, '') as content_summary,
        COALESCE(act.hashtags, '{}'::text[]) as hashtags,
        COALESCE(act.visibility, 'public') as visibility,
        COALESCE(act.engagement_score, 0) as engagement_score,
        act.updated_at::text as updated_at,
        COALESCE(act.cross_posted_to, '{}'::text[]) as cross_posted_to,
        COALESCE(act.collaboration_type, '') as collaboration_type,
        COALESCE(act.ai_enhanced, false) as ai_enhanced,
        COALESCE(act.ai_enhanced_text, '') as ai_enhanced_text,
        COALESCE(act.ai_enhanced_performance, 0) as ai_enhanced_performance,
        COALESCE(act.metadata, '{}'::jsonb) as metadata,
        COALESCE(act.publish_status, 'published') as publish_status,
        COALESCE(act.published_at, act.created_at)::text as published_at,
        COALESCE(act.is_featured, false) as is_featured,
        COALESCE(act.is_pinned, false) as is_pinned,
        0 as bookmark_count, -- Placeholder for now
        COALESCE(act.trending_score, 0) as trending_score
    FROM activities act
    LEFT JOIN users usr ON act.user_id = usr.id
    WHERE act.user_id = p_user_id
    AND (act.visibility = 'public' OR act.visibility IS NULL)
    ORDER BY act.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION "public"."get_user_feed_activities"("uuid", integer, integer) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."get_user_feed_activities"("uuid", integer, integer) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_user_feed_activities"("uuid", integer, integer) TO "service_role";

-- Add comment
COMMENT ON FUNCTION "public"."get_user_feed_activities"("uuid", integer, integer) IS 'Fixed function that properly calculates engagement counts from engagement_likes and engagement_comments tables instead of accessing non-existent columns';
