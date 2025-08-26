CREATE OR REPLACE FUNCTION "public"."add_engagement_comment"("p_user_id" "uuid", "p_entity_type" "text", "p_entity_id" "uuid", "p_comment_text" "text", "p_parent_comment_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_comment_id uuid;

CREATE OR REPLACE FUNCTION "public"."add_entity_comment"("p_user_id" "uuid", "p_entity_type" "text", "p_entity_id" "uuid", "p_comment_text" "text", "p_parent_comment_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    new_comment_id uuid;

CREATE OR REPLACE FUNCTION "public"."anonymize_user_data_enhanced"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Anonymize user data instead of deletion for compliance
    UPDATE "public"."reading_progress" 
    SET "user_id" = NULL, "updated_at" = "now"()
    WHERE "user_id" = p_user_id;

CREATE OR REPLACE FUNCTION "public"."calculate_engagement_score"("p_like_count" integer, "p_comment_count" integer, "p_share_count" integer, "p_view_count" integer) RETURNS numeric
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  -- Calculate engagement score based on interaction rates
  -- Formula: (likes + comments*2 + shares*3) / (views + 1) * 100
  -- This gives higher weight to more meaningful interactions
  RETURN LEAST(
    ((p_like_count + p_comment_count * 2 + p_share_count * 3)::NUMERIC / GREATEST(p_view_count, 1)) * 100,
    100
  );

CREATE OR REPLACE FUNCTION "public"."calculate_profile_completion"("user_profile_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    completion_score INTEGER := 0;

CREATE OR REPLACE FUNCTION "public"."check_data_health"() RETURNS TABLE("health_check" "text", "issue_count" bigint, "severity" "text", "recommendation" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check for books without publishers
    RETURN QUERY
    SELECT 
        'Books without publishers'::text,
        COUNT(*)::bigint,
        CASE WHEN COUNT(*) > 100 THEN 'HIGH' WHEN COUNT(*) > 10 THEN 'MEDIUM' ELSE 'LOW' END,
        'Run fix_missing_publisher_relationships()'::text
    FROM "public"."books"
    WHERE publisher_id IS NULL;

CREATE OR REPLACE FUNCTION "public"."check_data_integrity_health"() RETURNS TABLE("issue_type" "text", "issue_count" bigint, "severity" "text", "recommendation" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check for books with missing publisher_id
    RETURN QUERY
    SELECT 
        'Books with missing publisher_id'::text,
        COUNT(*)::bigint,
        CASE 
            WHEN COUNT(*) > 0 THEN 'CRITICAL'
            ELSE 'GOOD'
        END,
        CASE 
            WHEN COUNT(*) > 0 THEN 'Fix publisher relationships'
            ELSE 'No issues found'
        END
    FROM "public"."books" 
    WHERE publisher_id IS NULL;

CREATE OR REPLACE FUNCTION "public"."check_data_quality_issues_enhanced"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_issues "jsonb" := '[]'::"jsonb";

CREATE OR REPLACE FUNCTION "public"."check_existing_follow"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") RETURNS TABLE("follow_exists" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT EXISTS(
    SELECT 1 FROM public.follows 
    WHERE follower_id = p_follower_id 
    AND following_id = p_following_id
    AND target_type_id = p_target_type_id
  );

CREATE OR REPLACE FUNCTION "public"."check_is_following"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") RETURNS TABLE("is_following" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT EXISTS(
    SELECT 1 FROM public.follows 
    WHERE follower_id = p_follower_id 
    AND following_id = p_following_id
    AND target_type_id = p_target_type_id
  );

CREATE OR REPLACE FUNCTION "public"."check_permalink_availability"("permalink" "text", "entity_type" "text", "exclude_id" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    CASE entity_type
        WHEN 'user' THEN
            IF exclude_id IS NOT NULL THEN
                RETURN NOT EXISTS (SELECT 1 FROM users WHERE permalink = permalink AND id != exclude_id);

CREATE OR REPLACE FUNCTION "public"."check_publisher_data_health"() RETURNS TABLE("metric_name" "text", "current_value" bigint, "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Count books with missing publisher_id
    RETURN QUERY SELECT 
        'Books with missing publisher_id'::text,
        COUNT(*)::bigint,
        CASE WHEN COUNT(*) = 0 THEN 'GOOD' ELSE 'NEEDS_FIX' END
    FROM "public"."books" 
    WHERE publisher_id IS NULL;

CREATE OR REPLACE FUNCTION "public"."check_rate_limit_enhanced"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer DEFAULT 10, "p_window_minutes" integer DEFAULT 5) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_attempt_count integer;

CREATE OR REPLACE FUNCTION "public"."check_reading_privacy_access"("target_user_id" "uuid", "requesting_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- User can always access their own data
    IF target_user_id = requesting_user_id THEN
        RETURN true;

CREATE OR REPLACE FUNCTION "public"."cleanup_old_audit_trail"("p_days_to_keep" integer DEFAULT 365) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    deleted_count integer;

CREATE OR REPLACE FUNCTION "public"."cleanup_old_monitoring_data"("p_days_to_keep" integer DEFAULT 90) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Clean old user activity logs
    DELETE FROM "public"."user_activity_log" 
    WHERE "created_at" < "now"() - (p_days_to_keep || ' days')::interval;

CREATE OR REPLACE FUNCTION "public"."cleanup_orphaned_records"() RETURNS TABLE("table_name" "text", "records_deleted" bigint, "cleanup_type" "text", "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    deleted_count bigint;

CREATE OR REPLACE FUNCTION "public"."comprehensive_system_health_check_enhanced"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_health_report "jsonb";

CREATE OR REPLACE FUNCTION "public"."create_data_version"("p_table_name" "text", "p_record_id" "uuid", "p_change_reason" "text" DEFAULT NULL::"text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_next_version integer;

CREATE OR REPLACE FUNCTION "public"."create_enterprise_audit_trail"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_old_values jsonb;

CREATE OR REPLACE FUNCTION "public"."create_entity_album"("p_name" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_description" "text" DEFAULT NULL::"text", "p_is_public" boolean DEFAULT false, "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_album_id uuid;

CREATE OR REPLACE FUNCTION "public"."decrement_activity_like_count"("p_activity_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.activities 
    SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
    WHERE id = p_activity_id;

CREATE OR REPLACE FUNCTION "public"."decrypt_sensitive_data_enhanced"("p_encrypted_data" "text", "p_key" "text" DEFAULT 'default_key'::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- In production, use proper decryption libraries
    -- This is a placeholder for demonstration
    RETURN SUBSTRING(p_encrypted_data FROM 11);

CREATE OR REPLACE FUNCTION "public"."delete_follow_record"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") RETURNS TABLE("success" boolean, "error_message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Delete follow record
  DELETE FROM public.follows 
  WHERE follower_id = p_follower_id 
  AND following_id = p_following_id
  AND target_type_id = p_target_type_id;

CREATE OR REPLACE FUNCTION "public"."encrypt_sensitive_data_enhanced"("p_data" "text", "p_key" "text" DEFAULT 'default_key'::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- In production, use proper encryption libraries
    -- This is a placeholder for demonstration
    RETURN 'encrypted_' || encode(digest(p_data || p_key, 'sha256'), 'hex');

CREATE OR REPLACE FUNCTION "public"."ensure_reading_progress_consistency"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Validate status values
    IF NEW.status NOT IN ('want_to_read', 'currently_reading', 'read', 'not_started', 'in_progress', 'completed', 'on_hold', 'abandoned') THEN
        RAISE EXCEPTION 'Invalid status value: %', NEW.status;

CREATE OR REPLACE FUNCTION "public"."export_user_data_enhanced"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_export_data "jsonb";

CREATE OR REPLACE FUNCTION "public"."extract_book_dimensions"("book_uuid" "uuid", "dimensions_json" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    width_val NUMERIC;

CREATE OR REPLACE FUNCTION "public"."fix_missing_publisher_relationships"() RETURNS TABLE("book_id" "uuid", "book_title" "text", "action_taken" "text", "publisher_id" "uuid", "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    book_record RECORD;

CREATE OR REPLACE FUNCTION "public"."flag_content"("p_flagged_by" "uuid", "p_content_type" character varying, "p_content_id" "uuid", "p_flag_reason" character varying, "p_flag_details" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_flag_id UUID;

CREATE OR REPLACE FUNCTION "public"."generate_data_health_report"() RETURNS TABLE("report_section" "text", "metric_name" "text", "metric_value" "text", "status" "text", "recommendation" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Publisher relationship health
    RETURN QUERY SELECT 
        'Data Integrity'::text,
        'Books with missing publisher_id'::text,
        COUNT(*)::text,
        CASE WHEN COUNT(*) = 0 THEN 'GOOD' ELSE 'NEEDS_FIX' END,
        CASE WHEN COUNT(*) = 0 THEN 'All books have publishers' ELSE 'Run safe_fix_missing_publishers()' END
    FROM "public"."books" 
    WHERE publisher_id IS NULL;

CREATE OR REPLACE FUNCTION "public"."generate_friend_suggestions"("target_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Clear existing suggestions
    DELETE FROM "public"."friend_suggestions" WHERE user_id = target_user_id;

CREATE OR REPLACE FUNCTION "public"."generate_intelligent_content"("p_content_type" "text", "p_input_data" "jsonb", "p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("generated_content" "text", "confidence_score" numeric, "metadata" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_job_id UUID;

CREATE OR REPLACE FUNCTION "public"."generate_monitoring_report"("p_days_back" integer DEFAULT 7) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_report "jsonb";

CREATE OR REPLACE FUNCTION "public"."generate_permalink"("input_text" "text", "entity_type" "text" DEFAULT 'user'::"text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    base_permalink text;

CREATE OR REPLACE FUNCTION "public"."generate_smart_notification"("p_user_id" "uuid", "p_notification_type" "text", "p_context_data" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_notification_id UUID;

CREATE OR REPLACE FUNCTION "public"."generate_system_alerts_enhanced"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_alerts "jsonb" := '[]'::"jsonb";

CREATE OR REPLACE FUNCTION "public"."get_aggregated_like_activities"("p_entity_type" "text", "p_entity_id" "uuid", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "text", "user_id" "text", "user_name" "text", "user_avatar_url" "text", "activity_type" "text", "data" "jsonb", "created_at" "text", "is_public" boolean, "like_count" integer, "comment_count" integer, "share_count" integer, "view_count" integer, "is_liked" boolean, "entity_type" "text", "entity_id" "text", "content_type" "text", "text" "text", "image_url" "text", "link_url" "text", "content_summary" "text", "hashtags" "text"[], "visibility" "text", "engagement_score" numeric, "updated_at" "text", "cross_posted_to" "text"[], "collaboration_type" "text", "ai_enhanced" boolean, "ai_enhanced_text" "text", "ai_enhanced_performance" numeric, "metadata" "jsonb", "aggregated_likes_count" integer, "recent_likers" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Return aggregated like activities for better timeline performance
    RETURN QUERY
    SELECT 
        a.id::text,
        a.user_id::text,
        COALESCE(u.name, u.email, 'Unknown User')::text as user_name,
        '/placeholder.svg?height=200&width=200'::text as user_avatar_url,
        a.activity_type::text,
        a.data,
        a.created_at::text,
        (COALESCE(a.visibility, 'public') = 'public')::boolean as is_public,
        COALESCE(a.like_count, 0)::integer as like_count,
        COALESCE(a.comment_count, 0)::integer as comment_count,
        COALESCE(a.share_count, 0)::integer as share_count,
        COALESCE(a.view_count, 0)::integer as view_count,
        false::boolean as is_liked,
        COALESCE(a.entity_type, 'user')::text as entity_type,
        COALESCE(a.entity_id::text, a.user_id::text) as entity_id,
        'like'::text as content_type,
        COALESCE(u.name, u.email, 'User') || ' and others liked a post'::text as text,
        COALESCE(a.data->>'liked_activity_image', '')::text as image_url,
        ''::text as link_url,
        COALESCE(u.name, u.email, 'User') || ' and others liked a post'::text as content_summary,
        '{}'::text[] as hashtags,
        COALESCE(a.visibility, 'public')::text as visibility,
        COALESCE(a.engagement_score, 0)::numeric as engagement_score,
        COALESCE(a.updated_at, a.created_at)::text as updated_at,
        '{}'::text[] as cross_posted_to,
        a.collaboration_type,
        a.ai_enhanced,
        a.ai_enhanced_text,
        a.ai_enhanced_performance,
        a.metadata,
        COUNT(al.id)::integer as aggregated_likes_count,
        ARRAY_AGG(DISTINCT COALESCE(u2.name, u2.email, 'User'))::text[] as recent_likers
    FROM (
        -- Get unique liked activities for this entity
        SELECT DISTINCT
            a.data->>'liked_activity_id' as liked_activity_id,
            a.data->>'liked_entity_type' as liked_entity_type,
            a.data->>'liked_entity_id' as liked_entity_id,
            a.data->>'liked_activity_content' as liked_activity_content,
            a.data->>'liked_activity_image' as liked_activity_image,
            MIN(a.created_at) as created_at,
            MAX(a.updated_at) as updated_at,
            a.visibility,
            a.engagement_score,
            a.collaboration_type,
            a.ai_enhanced,
            a.ai_enhanced_text,
            a.ai_enhanced_performance,
            a.metadata
        FROM public.activities a
        WHERE a.activity_type = 'like'
        AND a.data->>'liked_entity_type' = p_entity_type
        AND a.data->>'liked_entity_id' = p_entity_id::text
        GROUP BY 
            a.data->>'liked_activity_id',
            a.data->>'liked_entity_type',
            a.data->>'liked_entity_id',
            a.data->>'liked_activity_content',
            a.data->>'liked_activity_image',
            a.visibility,
            a.engagement_score,
            a.collaboration_type,
            a.ai_enhanced,
            a.ai_enhanced_text,
            a.ai_enhanced_performance,
            a.metadata
    ) a
    LEFT JOIN public.activity_likes al ON al.activity_id = a.liked_activity_id::uuid
    LEFT JOIN public.users u2 ON al.user_id = u2.id
    LEFT JOIN public.users u ON u.id = (
        SELECT user_id FROM public.activities 
        WHERE activity_type = 'like' 
        AND data->>'liked_activity_id' = a.liked_activity_id
        ORDER BY created_at ASC 
        LIMIT 1
    )
    GROUP BY 
        a.liked_activity_id,
        a.liked_entity_type,
        a.liked_entity_id,
        a.liked_activity_content,
        a.liked_activity_image,
        a.created_at,
        a.updated_at,
        a.visibility,
        a.engagement_score,
        a.collaboration_type,
        a.ai_enhanced,
        a.ai_enhanced_text,
        a.ai_enhanced_performance,
        a.metadata,
        u.name,
        u.email
    ORDER BY a.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;

CREATE OR REPLACE FUNCTION "public"."get_aggregated_user_feed_likes"("p_user_id" "uuid", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "text", "user_id" "text", "user_name" "text", "user_avatar_url" "text", "activity_type" "text", "data" "jsonb", "created_at" "text", "is_public" boolean, "like_count" integer, "comment_count" integer, "share_count" integer, "view_count" integer, "is_liked" boolean, "entity_type" "text", "entity_id" "text", "content_type" "text", "text" "text", "image_url" "text", "link_url" "text", "content_summary" "text", "hashtags" "text"[], "visibility" "text", "engagement_score" numeric, "updated_at" "text", "cross_posted_to" "text"[], "collaboration_type" "text", "ai_enhanced" boolean, "ai_enhanced_text" "text", "ai_enhanced_performance" numeric, "metadata" "jsonb", "aggregated_likes_count" integer, "recent_likers" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Return aggregated like activities for user feeds
    RETURN QUERY
    SELECT 
        a.id::text,
        a.user_id::text,
        COALESCE(u.user_metadata->>'full_name', u.email, 'Unknown User')::text as user_name,
        COALESCE(u.user_metadata->>'avatar_url', '/placeholder.svg?height=200&width=200')::text as user_avatar_url,
        a.activity_type::text,
        a.data,
        a.created_at::text,
        (COALESCE(a.visibility, 'public') = 'public')::boolean as is_public,
        COALESCE(a.like_count, 0)::integer as like_count,
        COALESCE(a.comment_count, 0)::integer as comment_count,
        COALESCE(a.share_count, 0)::integer as share_count,
        COALESCE(a.view_count, 0)::integer as view_count,
        EXISTS (SELECT 1 FROM public.activity_likes l WHERE l.activity_id = a.id::uuid AND l.user_id = p_user_id)::boolean as is_liked,
        COALESCE(a.entity_type, 'user')::text as entity_type,
        COALESCE(a.entity_id::text, a.user_id::text) as entity_id,
        'like'::text as content_type,
        a.user_name || ' and others liked a post'::text as text,
        COALESCE(a.data->>'liked_activity_image', '')::text as image_url,
        ''::text as link_url,
        a.user_name || ' and others liked a post'::text as content_summary,
        '{}'::text[] as hashtags,
        COALESCE(a.visibility, 'public')::text as visibility,
        COALESCE(a.engagement_score, 0)::numeric as engagement_score,
        COALESCE(a.updated_at, a.created_at)::text as updated_at,
        '{}'::text[] as cross_posted_to,
        a.collaboration_type,
        a.ai_enhanced,
        a.ai_enhanced_text,
        a.ai_enhanced_performance,
        a.metadata,
        COUNT(al.id)::integer as aggregated_likes_count,
        ARRAY_AGG(DISTINCT COALESCE(u2.user_metadata->>'full_name', u2.email, 'User'))::text[] as recent_likers
    FROM (
        -- Get unique liked activities from followed users
        SELECT DISTINCT
            a.data->>'liked_activity_id' as liked_activity_id,
            a.data->>'liked_entity_type' as liked_entity_type,
            a.data->>'liked_entity_id' as liked_entity_id,
            a.data->>'liked_activity_content' as liked_activity_content,
            a.data->>'liked_activity_image' as liked_activity_image,
            MIN(a.created_at) as created_at,
            MAX(a.updated_at) as updated_at,
            a.visibility,
            a.engagement_score,
            a.collaboration_type,
            a.ai_enhanced,
            a.ai_enhanced_text,
            a.ai_enhanced_performance,
            a.metadata
        FROM public.activities a
        INNER JOIN public.follows f ON f.follower_id = p_user_id AND f.following_id = a.user_id
        WHERE a.activity_type = 'like'
        AND a.user_id != p_user_id
        AND a.is_public = true
        GROUP BY 
            a.data->>'liked_activity_id',
            a.data->>'liked_entity_type',
            a.data->>'liked_entity_id',
            a.data->>'liked_activity_content',
            a.data->>'liked_activity_image',
            a.visibility,
            a.engagement_score,
            a.collaboration_type,
            a.ai_enhanced,
            a.ai_enhanced_text,
            a.ai_enhanced_performance,
            a.metadata
    ) a
    LEFT JOIN public.activity_likes al ON al.activity_id = a.liked_activity_id::uuid
    LEFT JOIN public.users u2 ON al.user_id = u2.id
    LEFT JOIN public.users u ON u.id = (
        SELECT user_id FROM public.activities 
        WHERE activity_type = 'like' 
        AND data->>'liked_activity_id' = a.liked_activity_id
        ORDER BY created_at ASC 
        LIMIT 1
    )
    GROUP BY 
        a.liked_activity_id,
        a.liked_entity_type,
        a.liked_entity_id,
        a.liked_activity_content,
        a.liked_activity_image,
        a.created_at,
        a.updated_at,
        a.visibility,
        a.engagement_score,
        a.collaboration_type,
        a.ai_enhanced,
        a.ai_enhanced_text,
        a.ai_enhanced_performance,
        a.metadata,
        u.user_metadata
    ORDER BY a.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;

CREATE OR REPLACE FUNCTION "public"."get_ai_book_recommendations"("p_user_id" "uuid", "p_limit" integer DEFAULT 10) RETURNS TABLE("book_id" "uuid", "title" "text", "author_name" "text", "recommendation_score" numeric, "recommendation_reason" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id as book_id,
        b.title,
        a.name as author_name,
        COALESCE(pr.recommendation_score, 0.5) as recommendation_score,
        pr.recommendation_reason
    FROM public.books b
    LEFT JOIN public.book_authors ba ON b.id = ba.book_id
    LEFT JOIN public.authors a ON ba.author_id = a.id
    LEFT JOIN public.personalized_recommendations pr ON b.id = pr.item_id AND pr.user_id = p_user_id
    WHERE pr.recommendation_type = 'book'
    ORDER BY pr.recommendation_score DESC NULLS LAST
    LIMIT p_limit;

CREATE OR REPLACE FUNCTION "public"."get_data_lineage"("p_table_name" "text") RETURNS TABLE("source_table" "text", "source_column" "text", "target_table" "text", "target_column" "text", "transformation_type" "text", "data_flow_description" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dl."source_table",
        dl."source_column",
        dl."target_table",
        dl."target_column",
        dl."transformation_type",
        dl."data_flow_description"
    FROM "public"."enterprise_data_lineage" dl
    WHERE dl."source_table" = p_table_name OR dl."target_table" = p_table_name
    ORDER BY dl."source_table", dl."target_table";

CREATE OR REPLACE FUNCTION "public"."get_data_quality_report"("p_table_name" "text" DEFAULT NULL::"text") RETURNS TABLE("table_name" "text", "total_rules" integer, "passed_rules" integer, "failed_rules" integer, "critical_issues" integer, "overall_score" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    rule_count integer;

CREATE OR REPLACE FUNCTION "public"."get_engagement_stats"("p_entity_type" "text", "p_entity_id" "uuid") RETURNS TABLE("likes_count" bigint, "comments_count" bigint, "recent_likes" "jsonb", "recent_comments" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.engagement_likes
     WHERE entity_type = p_entity_type AND entity_id = p_entity_id) as likes_count,
    (SELECT COUNT(*) FROM public.engagement_comments
     WHERE entity_type = p_entity_type AND entity_id = p_entity_id
     AND is_deleted = false AND is_hidden = false) as comments_count,
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id', el.id,
        'user_id', el.user_id,
        'created_at', el.created_at
      )
    ) FROM (
      SELECT el.id, el.user_id, el.created_at
      FROM public.engagement_likes el
      WHERE el.entity_type = p_entity_type AND el.entity_id = p_entity_id
      ORDER BY el.created_at DESC
      LIMIT 5
    ) el) as recent_likes,
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id', ec.id,
        'user_id', ec.user_id,
        'comment_text', ec.comment_text,
        'created_at', ec.created_at,
        'parent_comment_id', ec.parent_comment_id,
        'comment_depth', ec.comment_depth,
        'thread_id', ec.thread_id
      )
    ) FROM (
      SELECT ec.id, ec.user_id, ec.comment_text, ec.created_at, 
             ec.parent_comment_id, ec.comment_depth, ec.thread_id
      FROM public.engagement_comments ec
      WHERE ec.entity_type = p_entity_type AND ec.entity_id = p_entity_id
      AND ec.is_deleted = false AND ec.is_hidden = false
      ORDER BY ec.created_at DESC
      LIMIT 5
    ) ec) as recent_comments;

CREATE OR REPLACE FUNCTION "public"."get_entity_albums"("p_entity_type" "text", "p_entity_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS TABLE("album_id" "uuid", "album_name" "text", "album_description" "text", "is_public" boolean, "photo_count" bigint, "created_at" timestamp with time zone, "owner_id" "uuid", "can_edit" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.id as album_id,
    pa.name as album_name,
    pa.description as album_description,
    pa.is_public,
    COALESCE(img_counts.photo_count, 0) as photo_count,
    pa.created_at,
    pa.owner_id,
    (pa.owner_id = p_user_id) as can_edit
  FROM "public"."photo_albums" pa
  LEFT JOIN (
    SELECT 
      ai.album_id,
      COUNT(*) as photo_count
    FROM "public"."album_images" ai
    GROUP BY ai.album_id
  ) img_counts ON img_counts.album_id = pa.id
  WHERE 
    pa.entity_type = p_entity_type 
    AND pa.entity_id = p_entity_id
    AND (
      pa.is_public = true 
      OR pa.owner_id = p_user_id
      OR EXISTS (
        SELECT 1 FROM "public"."album_shares" 
        WHERE "album_shares"."album_id" = pa.id 
        AND "album_shares"."shared_with" = p_user_id
      )
    );

CREATE OR REPLACE FUNCTION "public"."get_entity_by_permalink"("permalink" "text", "entity_type" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    entity_id uuid;

CREATE OR REPLACE FUNCTION "public"."get_entity_engagement"("p_entity_type" "text", "p_entity_id" "uuid") RETURNS TABLE("likes_count" bigint, "comments_count" bigint, "recent_likes" "jsonb", "recent_comments" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM "public"."engagement_likes" 
         WHERE "entity_type" = p_entity_type AND "entity_id" = p_entity_id) as "likes_count",
        
        (SELECT COUNT(*) FROM "public"."engagement_comments" 
         WHERE "entity_type" = p_entity_type AND "entity_id" = p_entity_id 
         AND "is_deleted" = false AND "is_hidden" = false) as "comments_count",
        
        (SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'user_id', el.user_id,
                'created_at', el.created_at
            )
        ), '[]'::jsonb) FROM (
            SELECT el.user_id, el.created_at
            FROM "public"."engagement_likes" el
            WHERE el.entity_type = p_entity_type AND el.entity_id = p_entity_id
            ORDER BY el.created_at DESC
            LIMIT 5
        ) el) as "recent_likes",
        
        (SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', ec.id,
                'user_id', ec.user_id,
                'comment_text', ec.comment_text,
                'created_at', ec.created_at
            )
        ), '[]'::jsonb) FROM (
            SELECT ec.id, ec.user_id, ec.comment_text, ec.created_at
            FROM "public"."engagement_comments" ec
            WHERE ec.entity_type = p_entity_type AND ec.entity_id = p_entity_id
            AND ec.is_deleted = false AND ec.is_hidden = false
            ORDER BY ec.created_at DESC
            LIMIT 5
        ) ec) as "recent_comments";

CREATE OR REPLACE FUNCTION "public"."get_entity_images"("p_entity_type" "text", "p_entity_id" "uuid") RETURNS TABLE("image_id" "uuid", "image_url" "text", "thumbnail_url" "text", "alt_text" "text", "file_size" integer, "created_at" timestamp with time zone, "album_name" "text", "album_id" "uuid")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id as image_id,
        i.url as image_url,
        i.thumbnail_url,
        i.alt_text,
        i.file_size,
        i.created_at,
        pa.name as album_name,
        pa.id as album_id
    FROM public.images i
    JOIN public.album_images ai ON i.id = ai.image_id
    JOIN public.photo_albums pa ON ai.album_id = pa.id
    WHERE pa.entity_type = p_entity_type
    AND pa.entity_id = p_entity_id
    AND i.deleted_at IS NULL
    ORDER BY i.created_at DESC;

CREATE OR REPLACE FUNCTION "public"."get_entity_social_stats"("p_entity_type" character varying, "p_entity_id" "uuid", "p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("like_count" bigint, "comment_count" bigint, "share_count" bigint, "bookmark_count" bigint, "tag_count" bigint, "is_liked" boolean, "is_bookmarked" boolean, "user_reaction_type" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM "public"."likes" 
         WHERE entity_type = p_entity_type AND entity_id = p_entity_id)::BIGINT,
        
        (SELECT COUNT(*) FROM "public"."comments" 
         WHERE entity_type = p_entity_type AND entity_id = p_entity_id 
         AND is_deleted = false AND is_hidden = false)::BIGINT,
        
        (SELECT COUNT(*) FROM "public"."shares" 
         WHERE entity_type = p_entity_type AND entity_id = p_entity_id)::BIGINT,
        
        (SELECT COUNT(*) FROM "public"."bookmarks" 
         WHERE entity_type = p_entity_type AND entity_id = p_entity_id)::BIGINT,
        
        (SELECT COUNT(*) FROM "public"."entity_tags" 
         WHERE entity_type = p_entity_type AND entity_id = p_entity_id)::BIGINT,
        
        CASE WHEN p_user_id IS NOT NULL THEN
            EXISTS(SELECT 1 FROM "public"."likes" 
                   WHERE entity_type = p_entity_type AND entity_id = p_entity_id 
                   AND user_id = p_user_id)
        ELSE false END,
        
        CASE WHEN p_user_id IS NOT NULL THEN
            EXISTS(SELECT 1 FROM "public"."bookmarks" 
                   WHERE entity_type = p_entity_type AND entity_id = p_entity_id 
                   AND user_id = p_user_id)
        ELSE false END,
        
        CASE WHEN p_user_id IS NOT NULL THEN
            (SELECT reaction_type FROM "public"."comment_reactions" cr
             JOIN "public"."comments" c ON cr.comment_id = c.id
             WHERE c.entity_type = p_entity_type AND c.entity_id = p_entity_id 
             AND cr.user_id = p_user_id
             ORDER BY cr.created_at DESC LIMIT 1)
        ELSE NULL END;

CREATE OR REPLACE FUNCTION "public"."get_entity_timeline_activities"("p_entity_type" "text", "p_entity_id" "uuid", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "text", "user_id" "text", "user_name" "text", "user_avatar_url" "text", "activity_type" "text", "data" "jsonb", "created_at" "text", "is_public" boolean, "like_count" integer, "comment_count" integer, "share_count" integer, "view_count" integer, "is_liked" boolean, "entity_type" "text", "entity_id" "text", "content_type" "text", "text" "text", "image_url" "text", "link_url" "text", "content_summary" "text", "hashtags" "text"[], "visibility" "text", "engagement_score" numeric, "updated_at" "text", "cross_posted_to" "text"[], "collaboration_type" "text", "ai_enhanced" boolean, "ai_enhanced_text" "text", "ai_enhanced_performance" numeric, "metadata" "jsonb", "publish_status" "text", "published_at" "text", "is_featured" boolean, "is_pinned" boolean, "bookmark_count" integer, "trending_score" numeric)
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
        COALESCE(act.like_count, 0) as like_count,
        COALESCE(act.comment_count, 0) as comment_count,
        COALESCE(act.share_count, 0) as share_count,
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
        COALESCE(act.bookmark_count, 0) as bookmark_count,
        COALESCE(act.trending_score, 0) as trending_score
    FROM activities act
    LEFT JOIN users usr ON act.user_id = usr.id
    WHERE (act.entity_type = p_entity_type AND act.entity_id = p_entity_id)
    OR (act.user_id = p_entity_id AND p_entity_type = 'user')
    AND (act.visibility = 'public' OR act.visibility IS NULL)
    ORDER BY act.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;

CREATE OR REPLACE FUNCTION "public"."get_moderation_stats"("p_days_back" integer DEFAULT 30) RETURNS TABLE("total_flags" bigint, "pending_flags" bigint, "resolved_flags" bigint, "avg_resolution_time_hours" numeric, "top_flag_reasons" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_flags,
        COUNT(CASE WHEN moderation_status = 'pending' THEN 1 END)::BIGINT as pending_flags,
        COUNT(CASE WHEN moderation_status IN ('approved', 'rejected', 'action_taken') THEN 1 END)::BIGINT as resolved_flags,
        AVG(EXTRACT(EPOCH FROM (moderated_at - created_at)) / 3600)::NUMERIC as avg_resolution_time_hours,
        jsonb_object_agg(flag_reason, flag_count) as top_flag_reasons
    FROM (
        SELECT 
            flag_reason,
            COUNT(*) as flag_count
        FROM "public"."content_flags"
        WHERE created_at >= now() - INTERVAL '1 day' * p_days_back
        GROUP BY flag_reason
        ORDER BY flag_count DESC
        LIMIT 5
    ) reasons
    CROSS JOIN (
        SELECT 
            COUNT(*) as total_count,
            COUNT(CASE WHEN moderation_status = 'pending' THEN 1 END) as pending_count,
            COUNT(CASE WHEN moderation_status IN ('approved', 'rejected', 'action_taken') THEN 1 END) as resolved_count,
            AVG(EXTRACT(EPOCH FROM (moderated_at - created_at)) / 3600) as avg_time
        FROM "public"."content_flags"
        WHERE created_at >= now() - INTERVAL '1 day' * p_days_back
    ) stats;

CREATE OR REPLACE FUNCTION "public"."get_mutual_friends_count"("user1_id" "uuid", "user2_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    mutual_count integer;

CREATE OR REPLACE FUNCTION "public"."get_performance_recommendations"() RETURNS TABLE("recommendation_type" "text", "priority" "text", "description" "text", "estimated_impact" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check for missing indexes on frequently queried columns
    RETURN QUERY
    SELECT 
        'Missing Indexes'::text,
        'HIGH'::text,
        'Add indexes on frequently queried columns'::text,
        '20-50% query improvement'::text
    WHERE EXISTS (
        SELECT 1 FROM pg_stat_user_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('reading_progress', 'books', 'follows')
    );

CREATE OR REPLACE FUNCTION "public"."get_privacy_audit_summary"("days_back" integer DEFAULT 30) RETURNS TABLE("action" "text", "count" bigint, "last_occurrence" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pal.action,
        COUNT(*) as count,
        MAX(pal.created_at) as last_occurrence
    FROM "public"."privacy_audit_log" pal
    WHERE pal.user_id = auth.uid()
    AND pal.created_at >= now() - (days_back || ' days')::interval
    GROUP BY pal.action
    ORDER BY count DESC;

CREATE OR REPLACE FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "text", "user_id" "text", "user_name" "text", "user_avatar_url" "text", "activity_type" "text", "data" "jsonb", "created_at" "text", "is_public" boolean, "like_count" integer, "comment_count" integer, "share_count" integer, "bookmark_count" integer, "user_has_reacted" boolean, "entity_type" "text", "entity_id" "text", "content_type" "text", "text" "text", "image_url" "text", "link_url" "text", "content_summary" "text", "hashtags" "text"[], "visibility" "text", "engagement_score" numeric, "updated_at" "text", "cross_posted_to" "text"[], "collaboration_type" "text", "ai_enhanced" boolean, "ai_enhanced_text" "text", "ai_enhanced_performance" numeric, "metadata" "jsonb", "publish_status" "text", "published_at" "text", "is_featured" boolean, "is_pinned" boolean, "trending_score" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        act.id::text as id,
        act.user_id::text as user_id,
        COALESCE(usr.name, 'Unknown User') as user_name,
        '/placeholder.svg?height=200&width=200' as user_avatar_url,
        act.activity_type,
        COALESCE(act.data, '{}'::jsonb) as data,
        act.created_at::text as created_at,
        (COALESCE(act.visibility, 'public') = 'public') as is_public,
        COALESCE(act.like_count, 0) as like_count,
        COALESCE(act.comment_count, 0) as comment_count,
        COALESCE(act.share_count, 0) as share_count,
        COALESCE(act.bookmark_count, 0) as bookmark_count,
        COALESCE(act.user_has_reacted, false) as user_has_reacted,
        COALESCE(act.entity_type, 'user') as entity_type,
        COALESCE(act.entity_id::text, act.user_id::text) as entity_id,
        COALESCE(act.content_type, '') as content_type,
        COALESCE(act.text, '') as text,
        COALESCE(act.image_url, '') as image_url,
        COALESCE(act.link_url, '') as link_url,
        COALESCE(act.content_summary, '') as content_summary,
        COALESCE(act.hashtags, '{}'::text[]) as hashtags,
        COALESCE(act.visibility, 'public') as visibility,
        COALESCE(act.engagement_score, 0) as engagement_score,
        COALESCE(act.updated_at, act.created_at)::text as updated_at,
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
        COALESCE(act.trending_score, 0) as trending_score
    FROM public.activities act
    LEFT JOIN public.users usr ON act.user_id = usr.id
    WHERE act.user_id = p_user_id
    AND (act.visibility = 'public' OR act.visibility IS NULL)
    ORDER BY act.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;

CREATE OR REPLACE FUNCTION "public"."get_user_privacy_settings"("user_id_param" "uuid" DEFAULT "auth"."uid"()) RETURNS TABLE("default_privacy_level" "text", "allow_friends_to_see_reading" boolean, "allow_followers_to_see_reading" boolean, "allow_public_reading_profile" boolean, "show_reading_stats_publicly" boolean, "show_currently_reading_publicly" boolean, "show_reading_history_publicly" boolean, "show_reading_goals_publicly" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ups.default_privacy_level,
        ups.allow_friends_to_see_reading,
        ups.allow_followers_to_see_reading,
        ups.allow_public_reading_profile,
        ups.show_reading_stats_publicly,
        ups.show_currently_reading_publicly,
        ups.show_reading_history_publicly,
        ups.show_reading_goals_publicly
    FROM "public"."user_privacy_settings" ups
    WHERE ups.user_id = user_id_param;

CREATE OR REPLACE FUNCTION "public"."get_user_profile_stats"("user_uuid" "uuid") RETURNS TABLE("total_books_read" bigint, "total_reviews" bigint, "total_friends" bigint, "total_followers" bigint, "total_following" bigint, "profile_completion" integer, "last_activity" timestamp with time zone, "reading_streak_days" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(books_read.count, 0)::BIGINT as total_books_read,
        COALESCE(reviews.count, 0)::BIGINT as total_reviews,
        COALESCE(friends.count, 0)::BIGINT as total_friends,
        COALESCE(followers.count, 0)::BIGINT as total_followers,
        COALESCE(following.count, 0)::BIGINT as total_following,
        COALESCE(prof.profile_completion_percentage, 0) as profile_completion,
        COALESCE(activity.last_activity, u.created_at) as last_activity,
        COALESCE(streak.streak_days, 0) as reading_streak_days
    FROM users u
    LEFT JOIN profiles prof ON u.id = prof.user_id
    LEFT JOIN (
        SELECT user_id, COUNT(*) as count
        FROM reading_progress 
        WHERE status = 'completed' AND user_id = user_uuid
        GROUP BY user_id
    ) books_read ON u.id = books_read.user_id
    LEFT JOIN (
        SELECT user_id, COUNT(*) as count
        FROM book_reviews 
        WHERE user_id = user_uuid
        GROUP BY user_id
    ) reviews ON u.id = reviews.user_id
    LEFT JOIN (
        SELECT user_id, COUNT(*) as count
        FROM user_friends 
        WHERE (user_id = user_uuid OR friend_id = user_uuid) AND status = 'accepted'
        GROUP BY user_id
    ) friends ON u.id = friends.user_id
    LEFT JOIN (
        SELECT target_id, COUNT(*) as count
        FROM follows 
        WHERE target_type = 'user' AND target_id = user_uuid
        GROUP BY target_id
    ) followers ON u.id = followers.target_id
    LEFT JOIN (
        SELECT follower_id, COUNT(*) as count
        FROM follows 
        WHERE target_type = 'user' AND follower_id = user_uuid
        GROUP BY follower_id
    ) following ON u.id = following.follower_id
    LEFT JOIN (
        SELECT user_id, MAX(created_at) as last_activity
        FROM user_activity_log 
        WHERE user_id = user_uuid
        GROUP BY user_id
    ) activity ON u.id = activity.user_id
    LEFT JOIN (
        SELECT user_id, COUNT(DISTINCT DATE(created_at)) as streak_days
        FROM user_activity_log 
        WHERE user_id = user_uuid 
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY user_id
    ) streak ON u.id = streak.user_id
    WHERE u.id = user_uuid;

CREATE OR REPLACE FUNCTION "public"."get_user_reaction_status"("p_user_id" "uuid", "p_entity_type" "text", "p_entity_id" "uuid") RETURNS TABLE("has_liked" boolean, "has_commented" boolean, "has_shared" boolean, "has_bookmarked" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXISTS(SELECT 1 FROM public.engagement_likes 
               WHERE user_id = p_user_id AND entity_type = p_entity_type AND entity_id = p_entity_id) as has_liked,
        EXISTS(SELECT 1 FROM public.engagement_comments 
               WHERE user_id = p_user_id AND entity_type = p_entity_type AND entity_id = p_entity_id 
               AND is_deleted = false) as has_commented,
        false as has_shared, -- TODO: Implement when shares table exists
        false as has_bookmarked; -- TODO: Implement when bookmarks table exists
END;

CREATE OR REPLACE FUNCTION "public"."get_user_timeline_posts"("target_user_id" "uuid", "limit_count" integer DEFAULT 20, "offset_count" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "user_id" "uuid", "content" "text", "content_type" "text", "visibility" "text", "created_at" timestamp with time zone, "engagement_score" numeric, "like_count" integer, "comment_count" integer, "share_count" integer, "view_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.user_id, p.content, p.content_type, p.visibility, 
           p.created_at, p.engagement_score, p.like_count, p.comment_count, 
           p.share_count, p.view_count
    FROM "public"."posts" p
    WHERE p.user_id = target_user_id
      AND p.publish_status = 'published'
      AND NOT p.is_deleted
      AND (p.visibility = 'public' OR p.visibility = 'friends' OR p.visibility = 'followers')
    ORDER BY p.created_at DESC
    LIMIT limit_count OFFSET offset_count;

CREATE OR REPLACE FUNCTION "public"."grant_reading_permission"("target_user_id" "uuid", "permission_type" "text" DEFAULT 'view_reading_progress'::"text", "expires_at" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Insert or update permission
    INSERT INTO "public"."custom_permissions" (user_id, target_user_id, permission_type, expires_at)
    VALUES (auth.uid(), target_user_id, permission_type, expires_at)
    ON CONFLICT (user_id, target_user_id, permission_type) 
    DO UPDATE SET 
        expires_at = EXCLUDED.expires_at,
        updated_at = now();

CREATE OR REPLACE FUNCTION "public"."handle_album_privacy_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- When album privacy changes, update related feed entries
    IF OLD.is_public != NEW.is_public THEN
        IF NEW.is_public = true THEN
            -- Album became public, create feed entry
            INSERT INTO feed_entries (
                user_id, 
                activity_type, 
                entity_type, 
                entity_id, 
                visibility,
                metadata
            ) VALUES (
                NEW.owner_id,
                'album_made_public',
                'photo_album',
                NEW.id::text,
                'public',
                jsonb_build_object('album_name', NEW.name, 'album_id', NEW.id)
            );

CREATE OR REPLACE FUNCTION "public"."handle_privacy_level_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update boolean flags based on privacy_level
    NEW.allow_friends := (NEW.privacy_level = 'friends');

CREATE OR REPLACE FUNCTION "public"."handle_public_album_creation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- When a public album is created, create a feed entry
    IF NEW.is_public = true AND OLD.is_public = false THEN
        INSERT INTO feed_entries (
            user_id, 
            activity_type, 
            entity_type, 
            entity_id, 
            visibility,
            metadata
        ) VALUES (
            NEW.owner_id,
            'album_created',
            'photo_album',
            NEW.id::text,
            'public',
            jsonb_build_object('album_name', NEW.name, 'album_id', NEW.id)
        );

CREATE OR REPLACE FUNCTION "public"."has_user_liked_entity"("p_user_id" "uuid", "p_entity_type" character varying, "p_entity_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM "public"."likes" 
        WHERE user_id = p_user_id 
        AND entity_type = p_entity_type 
        AND entity_id = p_entity_id
    );

CREATE OR REPLACE FUNCTION "public"."increment_activity_like_count"("p_activity_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.activities 
    SET like_count = COALESCE(like_count, 0) + 1
    WHERE id = p_activity_id;

CREATE OR REPLACE FUNCTION "public"."increment_post_view_count"("post_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE "public"."posts" 
    SET view_count = view_count + 1,
        last_activity_at = now()
    WHERE id = post_id;

CREATE OR REPLACE FUNCTION "public"."initialize_user_privacy_settings"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Create default privacy settings for new users
    INSERT INTO "public"."user_privacy_settings" (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION "public"."insert_follow_record"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") RETURNS TABLE("success" boolean, "error_message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check if follow already exists
  IF EXISTS (
    SELECT 1 FROM public.follows 
    WHERE follower_id = p_follower_id 
    AND following_id = p_following_id
    AND target_type_id = p_target_type_id
  ) THEN
    RETURN QUERY SELECT FALSE, 'Already following this entity';

CREATE OR REPLACE FUNCTION "public"."log_sensitive_operation_enhanced"("p_operation_type" "text", "p_table_name" "text", "p_record_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"(), "p_details" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_audit_id "uuid";

CREATE OR REPLACE FUNCTION "public"."log_social_action"("p_user_id" "uuid", "p_action_type" character varying, "p_entity_type" character varying, "p_entity_id" "uuid", "p_target_id" "uuid" DEFAULT NULL::"uuid", "p_action_details" "jsonb" DEFAULT '{}'::"jsonb", "p_ip_address" "inet" DEFAULT NULL::"inet", "p_user_agent" "text" DEFAULT NULL::"text", "p_session_id" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_audit_id UUID;

CREATE OR REPLACE FUNCTION "public"."log_user_activity"("p_user_id" "uuid", "p_activity_type" "text", "p_activity_details" "jsonb" DEFAULT NULL::"jsonb", "p_ip_address" "inet" DEFAULT NULL::"inet", "p_user_agent" "text" DEFAULT NULL::"text", "p_session_id" "text" DEFAULT NULL::"text", "p_response_time_ms" integer DEFAULT NULL::integer, "p_status_code" integer DEFAULT NULL::integer) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_activity_id "uuid";

CREATE OR REPLACE FUNCTION "public"."map_progress_to_reading_status"("status" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
    RETURN CASE status
        WHEN 'not_started' THEN 'want_to_read'
        WHEN 'in_progress' THEN 'currently_reading'
        WHEN 'completed' THEN 'read'
        WHEN 'on_hold' THEN 'on_hold'
        WHEN 'abandoned' THEN 'abandoned'
        ELSE 'want_to_read'
    END;

CREATE OR REPLACE FUNCTION "public"."map_reading_status_to_progress"("status" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
    RETURN CASE status
        WHEN 'want_to_read' THEN 'not_started'
        WHEN 'currently_reading' THEN 'in_progress'
        WHEN 'read' THEN 'completed'
        WHEN 'on_hold' THEN 'on_hold'
        WHEN 'abandoned' THEN 'abandoned'
        WHEN 'not_started' THEN 'not_started'
        WHEN 'in_progress' THEN 'in_progress'
        WHEN 'completed' THEN 'completed'
        ELSE 'not_started'
    END;

CREATE OR REPLACE FUNCTION "public"."mask_sensitive_data"("input_text" "text", "mask_type" "text" DEFAULT 'PARTIAL'::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    CASE mask_type
        WHEN 'FULL' THEN
            RETURN '***MASKED***';

CREATE OR REPLACE FUNCTION "public"."monitor_data_health"() RETURNS TABLE("health_metric" "text", "current_value" bigint, "threshold_value" bigint, "status" "text", "last_check" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Monitor books with missing publisher_id
    RETURN QUERY
    SELECT 
        'Books with missing publisher_id'::text,
        COUNT(*)::bigint,
        0::bigint,
        CASE 
            WHEN COUNT(*) = 0 THEN 'GOOD'
            ELSE 'CRITICAL'
        END,
        now()
    FROM "public"."books" 
    WHERE publisher_id IS NULL;

CREATE OR REPLACE FUNCTION "public"."monitor_database_performance_enhanced"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_performance_data "jsonb";

CREATE OR REPLACE FUNCTION "public"."monitor_entity_storage_usage"() RETURNS TABLE("entity_type" "text", "entity_id" "uuid", "storage_usage_mb" numeric, "image_count" bigint, "warning_level" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pa.entity_type,
        pa.entity_id,
        ROUND(SUM(i.file_size) / 1024.0 / 1024.0, 2) as storage_usage_mb,
        COUNT(i.id) as image_count,
        CASE 
            WHEN SUM(i.file_size) > 100 * 1024 * 1024 THEN 'CRITICAL' -- 100MB
            WHEN SUM(i.file_size) > 50 * 1024 * 1024 THEN 'WARNING'   -- 50MB
            WHEN SUM(i.file_size) > 10 * 1024 * 1024 THEN 'INFO'      -- 10MB
            ELSE 'OK'
        END as warning_level
    FROM public.images i
    JOIN public.album_images ai ON i.id = ai.image_id
    JOIN public.photo_albums pa ON ai.album_id = pa.id
    WHERE i.deleted_at IS NULL
    GROUP BY pa.entity_type, pa.entity_id
    HAVING SUM(i.file_size) > 5 * 1024 * 1024 -- Only show entities using >5MB
    ORDER BY storage_usage_mb DESC;

CREATE OR REPLACE FUNCTION "public"."monitor_query_performance"() RETURNS TABLE("query_pattern" "text", "avg_execution_time" numeric, "total_calls" bigint, "performance_status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN query LIKE '%reading_progress%' THEN 'Reading Progress Queries'
            WHEN query LIKE '%books%' AND query LIKE '%publisher%' THEN 'Book-Publisher Queries'
            WHEN query LIKE '%follows%' THEN 'Follow Queries'
            WHEN query LIKE '%auth.users%' THEN 'User Authentication Queries'
            ELSE 'Other Queries'
        END as query_pattern,
        AVG(mean_time) as avg_execution_time,
        SUM(calls) as total_calls,
        CASE 
            WHEN AVG(mean_time) > 1000 THEN 'CRITICAL'
            WHEN AVG(mean_time) > 500 THEN 'WARNING'
            WHEN AVG(mean_time) > 100 THEN 'ATTENTION'
            ELSE 'GOOD'
        END as performance_status
    FROM pg_stat_statements 
    WHERE query LIKE '%public%'
    GROUP BY 
        CASE 
            WHEN query LIKE '%reading_progress%' THEN 'Reading Progress Queries'
            WHEN query LIKE '%books%' AND query LIKE '%publisher%' THEN 'Book-Publisher Queries'
            WHEN query LIKE '%follows%' THEN 'Follow Queries'
            WHEN query LIKE '%auth.users%' THEN 'User Authentication Queries'
            ELSE 'Other Queries'
        END
    ORDER BY avg_execution_time DESC;

CREATE OR REPLACE FUNCTION "public"."perform_database_maintenance_enhanced"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_maintenance_result "jsonb";

CREATE OR REPLACE FUNCTION "public"."perform_system_health_check"("p_check_name" "text", "p_status" "text", "p_details" "jsonb" DEFAULT NULL::"jsonb", "p_response_time_ms" integer DEFAULT NULL::integer, "p_error_message" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_check_id "uuid";

CREATE OR REPLACE FUNCTION "public"."populate_album_images_entity_context"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update album_images with entity context from photo_albums
    UPDATE public.album_images 
    SET 
        entity_type_id = (
            SELECT et.id 
            FROM public.entity_types et 
            WHERE et.entity_category = pa.entity_type
            LIMIT 1
        ),
        entity_id = pa.entity_id
    FROM public.photo_albums pa
    WHERE album_images.album_id = pa.id
    AND pa.entity_type IS NOT NULL
    AND pa.entity_id IS NOT NULL;

CREATE OR REPLACE FUNCTION "public"."populate_dewey_decimal_classifications"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Insert major Dewey Decimal categories (simplified version)
    INSERT INTO dewey_decimal_classifications (code, description, level) VALUES
    ('000', 'Computer science, information & general works', 1),
    ('100', 'Philosophy & psychology', 1),
    ('200', 'Religion', 1),
    ('300', 'Social sciences', 1),
    ('400', 'Language', 1),
    ('500', 'Pure Science', 1),
    ('600', 'Technology', 1),
    ('700', 'Arts & recreation', 1),
    ('800', 'Literature', 1),
    ('900', 'History & geography', 1)
    ON CONFLICT (code) DO NOTHING;

CREATE OR REPLACE FUNCTION "public"."populate_images_entity_type_id"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update images with entity_type_id from album_images
    UPDATE public.images 
    SET entity_type_id = ai.entity_type_id
    FROM public.album_images ai
    WHERE images.id = ai.image_id
    AND ai.entity_type_id IS NOT NULL;

CREATE OR REPLACE FUNCTION "public"."process_complete_isbndb_book_data"("book_uuid" "uuid", "isbndb_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    excerpt_text TEXT;

CREATE OR REPLACE FUNCTION "public"."process_dewey_decimal_classifications"("book_uuid" "uuid", "dewey_array" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    dewey_code TEXT;

CREATE OR REPLACE FUNCTION "public"."process_image_with_ai"("p_image_id" "uuid", "p_analysis_types" "text"[] DEFAULT ARRAY['content'::"text", 'quality'::"text", 'sentiment'::"text"]) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result "jsonb";

CREATE OR REPLACE FUNCTION "public"."process_other_isbns"("book_uuid" "uuid", "other_isbns_json" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    isbn_record JSONB;

CREATE OR REPLACE FUNCTION "public"."process_related_books"("book_uuid" "uuid", "related_json" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    relation_type TEXT;

CREATE OR REPLACE FUNCTION "public"."record_performance_metric"("p_metric_name" "text", "p_metric_value" numeric, "p_metric_unit" "text" DEFAULT NULL::"text", "p_category" "text" DEFAULT 'general'::"text", "p_additional_data" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_metric_id "uuid";

CREATE OR REPLACE FUNCTION "public"."refresh_materialized_views"() RETURNS TABLE("view_name" "text", "refresh_status" "text", "refresh_time" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Refresh book popularity summary
    REFRESH MATERIALIZED VIEW "public"."book_popularity_summary";

CREATE OR REPLACE FUNCTION "public"."revoke_reading_permission"("target_user_id" "uuid", "permission_type" "text" DEFAULT 'view_reading_progress'::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Delete permission
    DELETE FROM "public"."custom_permissions" 
    WHERE user_id = auth.uid() 
    AND target_user_id = target_user_id 
    AND permission_type = permission_type;

CREATE OR REPLACE FUNCTION "public"."run_data_maintenance"() RETURNS TABLE("maintenance_step" "text", "records_processed" bigint, "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    processed_count bigint;

CREATE OR REPLACE FUNCTION "public"."run_performance_maintenance"() RETURNS TABLE("maintenance_step" "text", "records_processed" bigint, "performance_improvement" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    table_record record;

CREATE OR REPLACE FUNCTION "public"."safe_cleanup_orphaned_records"() RETURNS TABLE("table_name" "text", "orphaned_count" bigint, "action_taken" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    orphaned_count bigint;

CREATE OR REPLACE FUNCTION "public"."safe_fix_missing_publishers"() RETURNS TABLE("book_id" "uuid", "book_title" character varying, "action_taken" "text", "publisher_id" "uuid", "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    book_record RECORD;

CREATE OR REPLACE FUNCTION "public"."set_image_uploader"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Set uploader_id to current user if not provided
    IF NEW.uploader_id IS NULL THEN
        NEW.uploader_id := auth.uid();

CREATE OR REPLACE FUNCTION "public"."simple_check_publisher_health"() RETURNS TABLE("metric_name" "text", "current_value" bigint, "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Count books with missing publisher_id
    RETURN QUERY SELECT 
        'Books with missing publisher_id'::text,
        COUNT(*)::bigint,
        CASE WHEN COUNT(*) = 0 THEN 'GOOD' ELSE 'NEEDS_FIX' END
    FROM "public"."books" 
    WHERE publisher_id IS NULL;

CREATE OR REPLACE FUNCTION "public"."simple_fix_missing_publishers"() RETURNS TABLE("book_id" "uuid", "book_title" character varying, "action_taken" "text", "publisher_id" "uuid", "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    book_record RECORD;

CREATE OR REPLACE FUNCTION "public"."standardize_reading_status_mappings"() RETURNS TABLE("old_status" "text", "new_status" "text", "updated_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    status_mapping record;

CREATE OR REPLACE FUNCTION "public"."standardize_reading_statuses"() RETURNS TABLE("old_status" "text", "new_status" "text", "updated_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    status_mapping RECORD;

CREATE OR REPLACE FUNCTION "public"."toggle_entity_like"("p_user_id" "uuid", "p_entity_type" "text", "p_entity_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    existing_like_id uuid;

CREATE OR REPLACE FUNCTION "public"."toggle_entity_like"("p_user_id" "uuid", "p_entity_type" character varying, "p_entity_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_is_liked BOOLEAN;

CREATE OR REPLACE FUNCTION "public"."track_photo_analytics_event"("p_album_id" "uuid", "p_event_type" "text", "p_image_id" "uuid" DEFAULT NULL::"uuid", "p_user_id" "uuid" DEFAULT NULL::"uuid", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    event_id "uuid";

CREATE OR REPLACE FUNCTION "public"."trigger_content_processing"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Automatically process new content for NLP analysis
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.nlp_analysis (
            content_id,
            content_type,
            analysis_type,
            original_text
        ) VALUES (
            NEW.id,
            TG_TABLE_NAME,
            'sentiment',
            COALESCE(NEW.description, NEW.title, NEW.content, '')
        );

CREATE OR REPLACE FUNCTION "public"."trigger_recommendation_generation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Generate AI recommendations when user activity changes
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- This would integrate with your recommendation engine
        -- For now, we'll just log the activity
        INSERT INTO public.user_activity_log (
            user_id,
            activity_type,
            activity_data
        ) VALUES (
            NEW.user_id,
            'recommendation_trigger',
            jsonb_build_object('trigger_table', TG_TABLE_NAME, 'trigger_operation', TG_OP)
        );

CREATE OR REPLACE FUNCTION "public"."trigger_social_audit_log"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Log the action based on the operation
    IF TG_OP = 'INSERT' THEN
        PERFORM "public"."log_social_action"(
            NEW.user_id,
            CASE 
                WHEN TG_TABLE_NAME = 'comments' THEN 'comment_added'
                WHEN TG_TABLE_NAME = 'likes' THEN 'like_toggled'
                WHEN TG_TABLE_NAME = 'shares' THEN 'share_added'
                WHEN TG_TABLE_NAME = 'bookmarks' THEN 'bookmark_toggled'
                WHEN TG_TABLE_NAME = 'comment_reactions' THEN 'reaction_added'
                ELSE 'unknown_action'
            END,
            NEW.entity_type,
            NEW.entity_id,
            NEW.id,
            jsonb_build_object('content', CASE WHEN TG_TABLE_NAME = 'comments' THEN NEW.content ELSE NULL END)
        );

CREATE OR REPLACE FUNCTION "public"."trigger_update_book_popularity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM "public"."update_book_popularity_metrics"(NEW."book_id");

CREATE OR REPLACE FUNCTION "public"."update_activity_bookmark_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment bookmark count for ANY entity type
        UPDATE public.activities 
        SET bookmark_count = COALESCE(bookmark_count, 0) + 1,
            updated_at = NOW()
        WHERE id = NEW.entity_id;

CREATE OR REPLACE FUNCTION "public"."update_activity_comment_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment comment count for ANY entity type (activity, author, book, etc.)
        UPDATE public.activities 
        SET comment_count = COALESCE(comment_count, 0) + 1,
            updated_at = NOW()
        WHERE id = NEW.entity_id;  -- Removed entity_type restriction
        RETURN NEW;

CREATE OR REPLACE FUNCTION "public"."update_activity_like_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment like count for ANY entity type
        UPDATE public.activities 
        SET like_count = COALESCE(like_count, 0) + 1,
            updated_at = NOW()
        WHERE id = NEW.entity_id;  -- Removed entity_type restriction
        RETURN NEW;

CREATE OR REPLACE FUNCTION "public"."update_activity_share_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment share count for ANY entity type
        UPDATE public.activities 
        SET share_count = COALESCE(share_count, 0) + 1,
            updated_at = NOW()
        WHERE id = NEW.entity_id;

CREATE OR REPLACE FUNCTION "public"."update_album_revenue_from_monetization"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update photo_albums revenue_generated based on monetization
    UPDATE "public"."photo_albums" 
    SET revenue_generated = (
        SELECT COALESCE(SUM(amount), 0)
        FROM "public"."photo_monetization" 
        WHERE album_id = NEW.album_id AND status = 'completed'
    )
    WHERE id = NEW.album_id;

CREATE OR REPLACE FUNCTION "public"."update_album_statistics_from_analytics"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update photo_albums view_count, like_count, share_count based on analytics
    UPDATE "public"."photo_albums" 
    SET 
        view_count = (
            SELECT COUNT(*) 
            FROM "public"."photo_analytics" 
            WHERE album_id = NEW.album_id AND event_type = 'view'
        ),
        like_count = (
            SELECT COUNT(*) 
            FROM "public"."photo_analytics" 
            WHERE album_id = NEW.album_id AND event_type = 'like'
        ),
        share_count = (
            SELECT COUNT(*) 
            FROM "public"."photo_analytics" 
            WHERE album_id = NEW.album_id AND event_type = 'share'
        )
    WHERE id = NEW.album_id;

CREATE OR REPLACE FUNCTION "public"."update_book_popularity_metrics"("p_book_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO "public"."book_popularity_metrics" (
        "book_id", "views_count", "reviews_count", "avg_rating", 
        "reading_progress_count", "reading_list_count"
    )
    SELECT 
        b."id",
        COALESCE(COUNT(DISTINCT bv."id"), 0) as views_count,
        COALESCE(COUNT(DISTINCT br."id"), 0) as reviews_count,
        COALESCE(AVG(br."rating"), 0) as avg_rating,
        COALESCE(COUNT(DISTINCT rp."id"), 0) as reading_progress_count,
        COALESCE(COUNT(DISTINCT rli."id"), 0) as reading_list_count
    FROM "public"."books" b
    LEFT JOIN "public"."book_views" bv ON b."id" = bv."book_id"
    LEFT JOIN "public"."book_reviews" br ON b."id" = br."book_id"
    LEFT JOIN "public"."reading_progress" rp ON b."id" = rp."book_id"
    LEFT JOIN "public"."reading_list_items" rli ON b."id" = rli."book_id"
    WHERE b."id" = p_book_id
    GROUP BY b."id"
    ON CONFLICT ("book_id") DO UPDATE SET
        "views_count" = EXCLUDED."views_count",
        "reviews_count" = EXCLUDED."reviews_count",
        "avg_rating" = EXCLUDED."avg_rating",
        "reading_progress_count" = EXCLUDED."reading_progress_count",
        "reading_list_count" = EXCLUDED."reading_list_count",
        "last_updated" = "now"();

CREATE OR REPLACE FUNCTION "public"."update_engagement_reply_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NOT NULL THEN
    -- Increment reply count on parent comment
    UPDATE public.engagement_comments 
    SET reply_count = reply_count + 1 
    WHERE id = NEW.parent_comment_id;

CREATE OR REPLACE FUNCTION "public"."update_engagement_score"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.engagement_score = calculate_engagement_score(
    COALESCE(NEW.like_count, 0),
    COALESCE(NEW.comment_count, 0),
    COALESCE(NEW.share_count, 0),
    COALESCE(NEW.view_count, 0)
  );

CREATE OR REPLACE FUNCTION "public"."update_friend_analytics"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update analytics for both users involved
    INSERT INTO "public"."friend_analytics" (user_id, total_friends, friend_requests_sent, friend_requests_received, friend_requests_accepted, friend_requests_rejected, last_activity_at)
    VALUES 
        (NEW.user_id, 
         (SELECT COUNT(*) FROM "public"."friends" WHERE (user_id = NEW.user_id OR friend_id = NEW.user_id) AND status = 'accepted'),
         (SELECT COUNT(*) FROM "public"."friends" WHERE user_id = NEW.user_id AND requested_by = NEW.user_id),
         (SELECT COUNT(*) FROM "public"."friends" WHERE friend_id = NEW.user_id AND requested_by != NEW.user_id),
         (SELECT COUNT(*) FROM "public"."friends" WHERE (user_id = NEW.user_id OR friend_id = NEW.user_id) AND status = 'accepted'),
         (SELECT COUNT(*) FROM "public"."friends" WHERE (user_id = NEW.user_id OR friend_id = NEW.user_id) AND status = 'rejected'),
         NEW.updated_at),
        (NEW.friend_id,
         (SELECT COUNT(*) FROM "public"."friends" WHERE (user_id = NEW.friend_id OR friend_id = NEW.friend_id) AND status = 'accepted'),
         (SELECT COUNT(*) FROM "public"."friends" WHERE user_id = NEW.friend_id AND requested_by = NEW.friend_id),
         (SELECT COUNT(*) FROM "public"."friends" WHERE friend_id = NEW.friend_id AND requested_by != NEW.friend_id),
         (SELECT COUNT(*) FROM "public"."friends" WHERE (user_id = NEW.friend_id OR friend_id = NEW.friend_id) AND status = 'accepted'),
         (SELECT COUNT(*) FROM "public"."friends" WHERE (user_id = NEW.friend_id OR friend_id = NEW.friend_id) AND status = 'rejected'),
         NEW.updated_at)
    ON CONFLICT (user_id) DO UPDATE SET
        total_friends = EXCLUDED.total_friends,
        friend_requests_sent = EXCLUDED.friend_requests_sent,
        friend_requests_received = EXCLUDED.friend_requests_received,
        friend_requests_accepted = EXCLUDED.friend_requests_accepted,
        friend_requests_rejected = EXCLUDED.friend_requests_rejected,
        last_activity_at = EXCLUDED.last_activity_at,
        updated_at = NOW();

CREATE OR REPLACE FUNCTION "public"."update_photo_albums_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;

CREATE OR REPLACE FUNCTION "public"."update_photo_counters"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_TABLE_NAME = 'photo_likes' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE "public"."images" SET like_count = like_count + 1 WHERE id = NEW.photo_id;

CREATE OR REPLACE FUNCTION "public"."update_post_engagement_score"("post_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE "public"."posts" 
    SET engagement_score = (
        (like_count * 1.0) + 
        (comment_count * 2.0) + 
        (share_count * 3.0) + 
        (view_count * 0.1)
    ),
    last_activity_at = now()
    WHERE id = post_id;

CREATE OR REPLACE FUNCTION "public"."update_post_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();

CREATE OR REPLACE FUNCTION "public"."update_profile_completion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.profile_completion_percentage := calculate_profile_completion(NEW.id);

CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();

CREATE OR REPLACE FUNCTION "public"."update_user_privacy_settings"("default_privacy_level" "text" DEFAULT NULL::"text", "allow_friends_to_see_reading" boolean DEFAULT NULL::boolean, "allow_followers_to_see_reading" boolean DEFAULT NULL::boolean, "allow_public_reading_profile" boolean DEFAULT NULL::boolean, "show_reading_stats_publicly" boolean DEFAULT NULL::boolean, "show_currently_reading_publicly" boolean DEFAULT NULL::boolean, "show_reading_history_publicly" boolean DEFAULT NULL::boolean, "show_reading_goals_publicly" boolean DEFAULT NULL::boolean) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    old_settings jsonb;

CREATE OR REPLACE FUNCTION "public"."upsert_reading_progress"("p_user_id" "uuid", "p_book_id" "uuid", "p_status" "text", "p_progress_percentage" integer DEFAULT NULL::integer, "p_privacy_level" "text" DEFAULT 'private'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    normalized_status text;

CREATE OR REPLACE FUNCTION "public"."validate_and_repair_data"() RETURNS TABLE("validation_type" "text", "issue_count" bigint, "fixed_count" bigint, "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    issue_count bigint;

CREATE OR REPLACE FUNCTION "public"."validate_book_data"("book_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    validation_errors text[] := '{}';

CREATE OR REPLACE FUNCTION "public"."validate_book_data_enhanced"("p_title" "text", "p_author" "text", "p_isbn" "text" DEFAULT NULL::"text", "p_publication_year" integer DEFAULT NULL::integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
    v_validation_result "jsonb";

CREATE OR REPLACE FUNCTION "public"."validate_enterprise_data_quality"("p_table_name" "text" DEFAULT NULL::"text") RETURNS TABLE("rule_name" "text", "table_name" "text", "column_name" "text", "rule_type" "text", "validation_result" "text", "error_count" bigint, "severity" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    rule_record RECORD;

CREATE OR REPLACE FUNCTION "public"."validate_follow_entity"("p_entity_id" "uuid", "p_target_type" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    entity_exists boolean := false;

CREATE OR REPLACE FUNCTION "public"."validate_follow_entity_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    target_type_name text;

CREATE OR REPLACE FUNCTION "public"."validate_permalink"("permalink" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    -- Check if permalink is valid (alphanumeric and hyphens only, 3-100 chars)
    IF permalink ~ '^[a-z0-9-]{3,100}$' AND permalink NOT LIKE '%-' AND permalink NOT LIKE '-%' THEN
        RETURN true;

CREATE OR REPLACE FUNCTION "public"."validate_user_data_enhanced"("p_email" "text", "p_name" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
    v_validation_result "jsonb";
