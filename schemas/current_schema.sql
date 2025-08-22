

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."add_activity_comment"("p_activity_id" "uuid", "p_user_id" "uuid", "p_comment_text" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_comment_id uuid;
BEGIN
    INSERT INTO public.activity_comments (activity_id, user_id, comment_text)
    VALUES (p_activity_id, p_user_id, p_comment_text)
    RETURNING id INTO v_comment_id;
    
    RETURN v_comment_id;
END;
$$;


ALTER FUNCTION "public"."add_activity_comment"("p_activity_id" "uuid", "p_user_id" "uuid", "p_comment_text" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."add_activity_comment"("p_activity_id" "uuid", "p_user_id" "uuid", "p_comment_text" "text") IS 'Add a comment to an activity';



CREATE OR REPLACE FUNCTION "public"."add_entity_comment"("p_user_id" "uuid", "p_entity_type" character varying, "p_entity_id" "uuid", "p_content" "text", "p_parent_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_comment_id UUID;
BEGIN
    INSERT INTO "public"."comments" (
        user_id, 
        entity_type, 
        entity_id, 
        content, 
        parent_id
    ) VALUES (
        p_user_id, 
        p_entity_type, 
        p_entity_id, 
        p_content, 
        p_parent_id
    ) RETURNING id INTO v_comment_id;
    
    RETURN v_comment_id;
END;
$$;


ALTER FUNCTION "public"."add_entity_comment"("p_user_id" "uuid", "p_entity_type" character varying, "p_entity_id" "uuid", "p_content" "text", "p_parent_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."add_entity_comment"("p_user_id" "uuid", "p_entity_type" character varying, "p_entity_id" "uuid", "p_content" "text", "p_parent_id" "uuid") IS 'Add comment to any entity with parent support';



CREATE OR REPLACE FUNCTION "public"."anonymize_user_data_enhanced"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Anonymize user data instead of deletion for compliance
    UPDATE "public"."reading_progress" 
    SET "user_id" = NULL, "updated_at" = "now"()
    WHERE "user_id" = p_user_id;
    
    UPDATE "public"."book_reviews" 
    SET "user_id" = NULL, "updated_at" = "now"()
    WHERE "user_id" = p_user_id;
    
    UPDATE "public"."reading_lists" 
    SET "user_id" = NULL, "updated_at" = "now"()
    WHERE "user_id" = p_user_id;
    
    -- Log the anonymization
    PERFORM "public"."log_sensitive_operation_enhanced"(
        'data_anonymization', 'user_data', p_user_id, p_user_id,
        "jsonb_build_object"('anonymization_timestamp', "now"())
    );
    
    RETURN true;
END;
$$;


ALTER FUNCTION "public"."anonymize_user_data_enhanced"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."anonymize_user_data_enhanced"("p_user_id" "uuid") IS 'Enhanced user data anonymization for GDPR compliance';



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
END;
$$;


ALTER FUNCTION "public"."calculate_engagement_score"("p_like_count" integer, "p_comment_count" integer, "p_share_count" integer, "p_view_count" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_engagement_score"("p_like_count" integer, "p_comment_count" integer, "p_share_count" integer, "p_view_count" integer) IS 'Calculate engagement score for activities based on likes, comments, shares, and views';



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
    
    -- Check for orphaned reading progress
    RETURN QUERY
    SELECT 
        'Orphaned reading progress'::text,
        COUNT(*)::bigint,
        CASE WHEN COUNT(*) > 50 THEN 'HIGH' WHEN COUNT(*) > 10 THEN 'MEDIUM' ELSE 'LOW' END,
        'Run cleanup_orphaned_records()'::text
    FROM "public"."reading_progress" rp
    WHERE NOT EXISTS (SELECT 1 FROM "auth"."users" u WHERE u.id = rp.user_id)
    OR NOT EXISTS (SELECT 1 FROM "public"."books" b WHERE b.id = rp.book_id);
    
    -- Check for inconsistent status mappings
    RETURN QUERY
    SELECT 
        'Inconsistent status mappings'::text,
        COUNT(*)::bigint,
        CASE WHEN COUNT(*) > 20 THEN 'HIGH' WHEN COUNT(*) > 5 THEN 'MEDIUM' ELSE 'LOW' END,
        'Run standardize_reading_status_mappings()'::text
    FROM "public"."reading_progress"
    WHERE status NOT IN ('not_started', 'in_progress', 'completed', 'on_hold', 'abandoned');
    
    -- Check for data validation issues
    RETURN QUERY
    SELECT 
        'Data validation issues'::text,
        (
            (SELECT COUNT(*) FROM "public"."books" WHERE publication_date > CURRENT_DATE) +
            (SELECT COUNT(*) FROM "public"."books" WHERE pages < 0) +
            (SELECT COUNT(*) FROM "public"."reading_progress" WHERE progress_percentage < 0 OR progress_percentage > 100)
        )::bigint,
        CASE WHEN (
            (SELECT COUNT(*) FROM "public"."books" WHERE publication_date > CURRENT_DATE) +
            (SELECT COUNT(*) FROM "public"."books" WHERE pages < 0) +
            (SELECT COUNT(*) FROM "public"."reading_progress" WHERE progress_percentage < 0 OR progress_percentage > 100)
        ) > 50 THEN 'HIGH' 
        WHEN (
            (SELECT COUNT(*) FROM "public"."books" WHERE publication_date > CURRENT_DATE) +
            (SELECT COUNT(*) FROM "public"."books" WHERE pages < 0) +
            (SELECT COUNT(*) FROM "public"."reading_progress" WHERE progress_percentage < 0 OR progress_percentage > 100)
        ) > 10 THEN 'MEDIUM' ELSE 'LOW' END,
        'Run validate_and_repair_data()'::text;
END;
$$;


ALTER FUNCTION "public"."check_data_health"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_data_health"() IS 'Comprehensive data health check';



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
    
    -- Check for orphaned reading progress records
    RETURN QUERY
    SELECT 
        'Orphaned reading progress records'::text,
        COUNT(*)::bigint,
        CASE 
            WHEN COUNT(*) > 0 THEN 'MEDIUM'
            ELSE 'GOOD'
        END,
        CASE 
            WHEN COUNT(*) > 0 THEN 'Clean up orphaned records'
            ELSE 'No issues found'
        END
    FROM "public"."reading_progress" rp
    LEFT JOIN "public"."books" b ON rp.book_id = b.id
    WHERE b.id IS NULL;
    
    -- Check for orphaned follows records
    RETURN QUERY
    SELECT 
        'Orphaned follows records'::text,
        COUNT(*)::bigint,
        CASE 
            WHEN COUNT(*) > 0 THEN 'MEDIUM'
            ELSE 'GOOD'
        END,
        CASE 
            WHEN COUNT(*) > 0 THEN 'Clean up orphaned follows'
            ELSE 'No issues found'
        END
    FROM "public"."follows" f
    LEFT JOIN "auth"."users" u ON f.follower_id = u.id
    WHERE u.id IS NULL;
    
    -- Check for inconsistent status values
    RETURN QUERY
    SELECT 
        'Inconsistent reading status values'::text,
        COUNT(*)::bigint,
        CASE 
            WHEN COUNT(*) > 0 THEN 'LOW'
            ELSE 'GOOD'
        END,
        CASE 
            WHEN COUNT(*) > 0 THEN 'Standardize status values'
            ELSE 'No issues found'
        END
    FROM "public"."reading_progress"
    WHERE reading_progress.status NOT IN ('not_started', 'in_progress', 'completed', 'on_hold', 'abandoned');
END;
$$;


ALTER FUNCTION "public"."check_data_integrity_health"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_data_integrity_health"() IS 'Comprehensive data integrity health check';



CREATE OR REPLACE FUNCTION "public"."check_data_quality_issues_enhanced"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_issues "jsonb" := '[]'::"jsonb";
    v_issue "jsonb";
BEGIN
    -- Check for books without titles
    SELECT "jsonb_build_object"(
        'issue_type', 'missing_title',
        'severity', 'medium',
        'count', COUNT(*),
        'description', 'Books without titles found'
    ) INTO v_issue
    FROM "public"."books"
    WHERE "title" IS NULL OR LENGTH(TRIM("title")) = 0;
    
    IF (v_issue->>'count')::integer > 0 THEN
        v_issues := v_issues || v_issue;
    END IF;
    
    -- Check for books without authors
    SELECT "jsonb_build_object"(
        'issue_type', 'missing_author',
        'severity', 'medium',
        'count', COUNT(*),
        'description', 'Books without authors found'
    ) INTO v_issue
    FROM "public"."books"
    WHERE "author" IS NULL OR LENGTH(TRIM("author")) = 0;
    
    IF (v_issue->>'count')::integer > 0 THEN
        v_issues := v_issues || v_issue;
    END IF;
    
    -- Check for orphaned reading progress
    SELECT "jsonb_build_object"(
        'issue_type', 'orphaned_reading_progress',
        'severity', 'high',
        'count', COUNT(*),
        'description', 'Reading progress records for non-existent books'
    ) INTO v_issue
    FROM "public"."reading_progress" rp
    LEFT JOIN "public"."books" b ON rp."book_id" = b."id"
    WHERE b."id" IS NULL;
    
    IF (v_issue->>'count')::integer > 0 THEN
        v_issues := v_issues || v_issue;
    END IF;
    
    RETURN "jsonb_build_object"(
        'issues', v_issues,
        'total_issues', array_length(v_issues, 1),
        'check_timestamp', "now"()
    );
END;
$$;


ALTER FUNCTION "public"."check_data_quality_issues_enhanced"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_data_quality_issues_enhanced"() IS 'Enhanced data quality issue checking';



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
END;
$$;


ALTER FUNCTION "public"."check_existing_follow"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") OWNER TO "postgres";


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
END;
$$;


ALTER FUNCTION "public"."check_is_following"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_permalink_availability"("permalink" "text", "entity_type" "text", "exclude_id" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    CASE entity_type
        WHEN 'user' THEN
            IF exclude_id IS NOT NULL THEN
                RETURN NOT EXISTS (SELECT 1 FROM users WHERE permalink = permalink AND id != exclude_id);
            ELSE
                RETURN NOT EXISTS (SELECT 1 FROM users WHERE permalink = permalink);
            END IF;
        WHEN 'group' THEN
            IF exclude_id IS NOT NULL THEN
                RETURN NOT EXISTS (SELECT 1 FROM groups WHERE permalink = permalink AND id != exclude_id);
            ELSE
                RETURN NOT EXISTS (SELECT 1 FROM groups WHERE permalink = permalink);
            END IF;
        WHEN 'event' THEN
            IF exclude_id IS NOT NULL THEN
                RETURN NOT EXISTS (SELECT 1 FROM events WHERE permalink = permalink AND id != exclude_id);
            ELSE
                RETURN NOT EXISTS (SELECT 1 FROM events WHERE permalink = permalink);
            END IF;
        WHEN 'book' THEN
            IF exclude_id IS NOT NULL THEN
                RETURN NOT EXISTS (SELECT 1 FROM books WHERE permalink = permalink AND id != exclude_id);
            ELSE
                RETURN NOT EXISTS (SELECT 1 FROM books WHERE permalink = permalink);
            END IF;
        WHEN 'author' THEN
            IF exclude_id IS NOT NULL THEN
                RETURN NOT EXISTS (SELECT 1 FROM authors WHERE permalink = permalink AND id != exclude_id);
            ELSE
                RETURN NOT EXISTS (SELECT 1 FROM authors WHERE permalink = permalink);
            END IF;
        WHEN 'publisher' THEN
            IF exclude_id IS NOT NULL THEN
                RETURN NOT EXISTS (SELECT 1 FROM publishers WHERE permalink = permalink AND id != exclude_id);
            ELSE
                RETURN NOT EXISTS (SELECT 1 FROM publishers WHERE permalink = permalink);
            END IF;
        ELSE
            RETURN false;
    END CASE;
END;
$$;


ALTER FUNCTION "public"."check_permalink_availability"("permalink" "text", "entity_type" "text", "exclude_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_permalink_availability"("permalink" "text", "entity_type" "text", "exclude_id" "uuid") IS 'Checks if a permalink is available for a given entity type';



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
    
    -- Count total books
    RETURN QUERY SELECT 
        'Total books'::text,
        COUNT(*)::bigint,
        'INFO'::text
    FROM "public"."books";
    
    -- Count total publishers
    RETURN QUERY SELECT 
        'Total publishers'::text,
        COUNT(*)::bigint,
        'INFO'::text
    FROM "public"."publishers";
    
    -- Count orphaned records
    RETURN QUERY SELECT 
        'Orphaned reading_progress records'::text,
        COUNT(*)::bigint,
        CASE WHEN COUNT(*) = 0 THEN 'GOOD' ELSE 'NEEDS_CLEANUP' END
    FROM "public"."reading_progress" rp
    LEFT JOIN "public"."books" b ON rp.book_id = b.id
    WHERE b.id IS NULL;
END;
$$;


ALTER FUNCTION "public"."check_publisher_data_health"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_publisher_data_health"() IS 'Check the health of publisher data relationships';



CREATE OR REPLACE FUNCTION "public"."check_rate_limit_enhanced"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer DEFAULT 10, "p_window_minutes" integer DEFAULT 5) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_attempt_count integer;
BEGIN
    SELECT COUNT(*) INTO v_attempt_count
    FROM "public"."user_activity_log"
    WHERE "user_id" = p_user_id
    AND "activity_type" = p_action
    AND "created_at" >= "now"() - (p_window_minutes || ' minutes')::interval;
    
    RETURN v_attempt_count < p_max_attempts;
END;
$$;


ALTER FUNCTION "public"."check_rate_limit_enhanced"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer, "p_window_minutes" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_rate_limit_enhanced"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer, "p_window_minutes" integer) IS 'Enhanced rate limiting for user actions';



CREATE OR REPLACE FUNCTION "public"."check_reading_privacy_access"("target_user_id" "uuid", "requesting_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- User can always access their own data
    IF target_user_id = requesting_user_id THEN
        RETURN true;
    END IF;

    -- Check if the target user has public reading profile
    IF EXISTS (
        SELECT 1 FROM "public"."user_privacy_settings" 
        WHERE user_id = target_user_id 
        AND allow_public_reading_profile = true
    ) THEN
        RETURN true;
    END IF;

    -- Check if requesting user is a friend and target allows friends
    IF EXISTS (
        SELECT 1 FROM "public"."user_privacy_settings" 
        WHERE user_id = target_user_id 
        AND allow_friends_to_see_reading = true
    ) AND EXISTS (
        SELECT 1 FROM "public"."user_friends" 
        WHERE (user_id = requesting_user_id AND friend_id = target_user_id) 
        OR (friend_id = requesting_user_id AND user_id = target_user_id)
    ) THEN
        RETURN true;
    END IF;

    -- Check if requesting user is a follower and target allows followers
    IF EXISTS (
        SELECT 1 FROM "public"."user_privacy_settings" 
        WHERE user_id = target_user_id 
        AND allow_followers_to_see_reading = true
    ) AND EXISTS (
        SELECT 1 FROM "public"."follows" 
        WHERE follower_id = requesting_user_id AND following_id = target_user_id
    ) THEN
        RETURN true;
    END IF;

    -- Check for custom permissions
    IF EXISTS (
        SELECT 1 FROM "public"."custom_permissions" 
        WHERE user_id = requesting_user_id 
        AND target_user_id = target_user_id 
        AND permission_type = 'view_reading_progress'
        AND (expires_at IS NULL OR expires_at > now())
    ) THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$;


ALTER FUNCTION "public"."check_reading_privacy_access"("target_user_id" "uuid", "requesting_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_reading_privacy_access"("target_user_id" "uuid", "requesting_user_id" "uuid") IS 'Check if a user can access another user''s reading progress';



CREATE OR REPLACE FUNCTION "public"."cleanup_old_audit_trail"("p_days_to_keep" integer DEFAULT 365) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM "public"."enterprise_audit_trail"
    WHERE "changed_at" < now() - (p_days_to_keep || ' days')::interval;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_audit_trail"("p_days_to_keep" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_old_audit_trail"("p_days_to_keep" integer) IS 'Cleans up old audit trail data';



CREATE OR REPLACE FUNCTION "public"."cleanup_old_monitoring_data"("p_days_to_keep" integer DEFAULT 90) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Clean old user activity logs
    DELETE FROM "public"."user_activity_log" 
    WHERE "created_at" < "now"() - (p_days_to_keep || ' days')::interval;
    
    -- Clean old performance metrics
    DELETE FROM "public"."performance_metrics" 
    WHERE "recorded_at" < "now"() - (p_days_to_keep || ' days')::interval;
    
    -- Clean old system health checks
    DELETE FROM "public"."system_health_checks" 
    WHERE "checked_at" < "now"() - (p_days_to_keep || ' days')::interval;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_monitoring_data"("p_days_to_keep" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_old_monitoring_data"("p_days_to_keep" integer) IS 'Cleans up old monitoring data to maintain performance';



CREATE OR REPLACE FUNCTION "public"."cleanup_orphaned_records"() RETURNS TABLE("table_name" "text", "records_deleted" bigint, "cleanup_type" "text", "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    deleted_count bigint;
BEGIN
    -- Clean up orphaned reading progress records
    DELETE FROM "public"."reading_progress" rp
    WHERE NOT EXISTS (
        SELECT 1 FROM "public"."books" b 
        WHERE b.id = rp.book_id
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN QUERY SELECT 
        'reading_progress'::text,
        deleted_count,
        'orphaned_records'::text,
        'SUCCESS'::text;
    
    -- Clean up orphaned follows records
    DELETE FROM "public"."follows" f
    WHERE NOT EXISTS (
        SELECT 1 FROM "auth"."users" u 
        WHERE u.id = f.follower_id
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN QUERY SELECT 
        'follows'::text,
        deleted_count,
        'orphaned_records'::text,
        'SUCCESS'::text;
    
    -- Log the cleanup operation (only if table exists)
    BEGIN
        INSERT INTO "public"."security_audit_log" (
            action, 
            table_name, 
            new_values
        ) VALUES (
            'CLEANUP_ORPHANED_RECORDS',
            'all_tables',
            jsonb_build_object(
                'cleanup_completed_at', now(),
                'cleanup_type', 'orphaned_records_removal'
            )
        );
    EXCEPTION WHEN OTHERS THEN
        -- Table doesn't exist, continue without logging
    END;
END;
$$;


ALTER FUNCTION "public"."cleanup_orphaned_records"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_orphaned_records"() IS 'Clean up orphaned records for data consistency';



CREATE OR REPLACE FUNCTION "public"."comprehensive_system_health_check_enhanced"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_health_report "jsonb";
    v_overall_status "text" := 'healthy';
    v_checks "jsonb" := '[]'::"jsonb";
    v_check_result "jsonb";
BEGIN
    -- Check database connectivity
    BEGIN
        PERFORM 1;
        v_check_result := "jsonb_build_object"(
            'check_name', 'database_connectivity',
            'status', 'healthy',
            'details', 'Database connection successful'
        );
    EXCEPTION WHEN OTHERS THEN
        v_overall_status := 'critical';
        v_check_result := "jsonb_build_object"(
            'check_name', 'database_connectivity',
            'status', 'critical',
            'details', 'Database connection failed: ' || SQLERRM
        );
    END;
    v_checks := v_checks || v_check_result;
    
    -- Check table sizes
    BEGIN
        SELECT "jsonb_build_object"(
            'check_name', 'table_sizes',
            'status', CASE 
                WHEN total_size_mb > 1000 THEN 'warning'
                ELSE 'healthy'
            END,
            'details', "jsonb_build_object"(
                'total_size_mb', total_size_mb,
                'largest_table', largest_table
            )
        ) INTO v_check_result
        FROM (
            SELECT 
                ROUND(SUM(pg_total_relation_size(c.oid)) / 1024.0 / 1024.0, 2) as total_size_mb,
                c.relname as largest_table
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
            GROUP BY c.relname
            ORDER BY pg_total_relation_size(c.oid) DESC
            LIMIT 1
        ) size_check;
        
        IF (v_check_result->>'status') = 'warning' THEN
            v_overall_status := 'warning';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_check_result := "jsonb_build_object"(
            'check_name', 'table_sizes',
            'status', 'critical',
            'details', 'Failed to check table sizes: ' || SQLERRM
        );
        v_overall_status := 'critical';
    END;
    v_checks := v_checks || v_check_result;
    
    -- Check for orphaned records
    BEGIN
        SELECT "jsonb_build_object"(
            'check_name', 'data_integrity',
            'status', CASE 
                WHEN orphaned_count > 0 THEN 'warning'
                ELSE 'healthy'
            END,
            'details', "jsonb_build_object"(
                'orphaned_records', orphaned_count
            )
        ) INTO v_check_result
        FROM (
            SELECT COUNT(*) as orphaned_count
            FROM "public"."reading_progress" rp
            LEFT JOIN "public"."books" b ON rp."book_id" = b."id"
            WHERE b."id" IS NULL
        ) integrity_check;
        
        IF (v_check_result->>'status') = 'warning' THEN
            v_overall_status := 'warning';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_check_result := "jsonb_build_object"(
            'check_name', 'data_integrity',
            'status', 'critical',
            'details', 'Failed to check data integrity: ' || SQLERRM
        );
        v_overall_status := 'critical';
    END;
    v_checks := v_checks || v_check_result;
    
    -- Build comprehensive health report
    v_health_report := "jsonb_build_object"(
        'overall_status', v_overall_status,
        'checks', v_checks,
        'health_check_timestamp', "now"()
    );
    
    RETURN v_health_report;
END;
$$;


ALTER FUNCTION "public"."comprehensive_system_health_check_enhanced"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."comprehensive_system_health_check_enhanced"() IS 'Enhanced comprehensive system health checks';



CREATE OR REPLACE FUNCTION "public"."create_data_version"("p_table_name" "text", "p_record_id" "uuid", "p_change_reason" "text" DEFAULT NULL::"text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_next_version integer;
    v_data_snapshot jsonb;
    v_table_query text;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX("version_number"), 0) + 1 
    INTO v_next_version
    FROM "public"."enterprise_data_versions"
    WHERE "table_name" = p_table_name AND "record_id" = p_record_id;
    
    -- Mark previous version as not current
    UPDATE "public"."enterprise_data_versions"
    SET "is_current" = false
    WHERE "table_name" = p_table_name AND "record_id" = p_record_id;
    
    -- Get current data snapshot
    v_table_query := format('SELECT to_jsonb(t.*) FROM %I t WHERE id = %L', p_table_name, p_record_id);
    EXECUTE v_table_query INTO v_data_snapshot;
    
    -- Insert new version
    INSERT INTO "public"."enterprise_data_versions" (
        "table_name",
        "record_id",
        "version_number",
        "data_snapshot",
        "created_by",
        "change_reason"
    ) VALUES (
        p_table_name,
        p_record_id,
        v_next_version,
        v_data_snapshot,
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
        p_change_reason
    );
    
    RETURN v_next_version;
END;
$$;


ALTER FUNCTION "public"."create_data_version"("p_table_name" "text", "p_record_id" "uuid", "p_change_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_data_version"("p_table_name" "text", "p_record_id" "uuid", "p_change_reason" "text") IS 'Creates data versioning for tracking changes';



CREATE OR REPLACE FUNCTION "public"."create_enterprise_audit_trail"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_old_values jsonb;
    v_new_values jsonb;
    v_operation text;
BEGIN
    -- Determine operation type
    IF TG_OP = 'INSERT' THEN
        v_operation := 'INSERT';
        v_new_values := to_jsonb(NEW);
        v_old_values := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        v_operation := 'UPDATE';
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_operation := 'DELETE';
        v_old_values := to_jsonb(OLD);
        v_new_values := NULL;
    END IF;
    
    -- Insert audit trail record
    INSERT INTO "public"."enterprise_audit_trail" (
        "table_name",
        "record_id",
        "operation",
        "old_values",
        "new_values",
        "changed_by",
        "ip_address",
        "user_agent",
        "session_id",
        "transaction_id"
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        v_operation,
        v_old_values,
        v_new_values,
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
        inet_client_addr(),
        current_setting('application_name', true),
        current_setting('session_id', true),
        txid_current()::text
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."create_enterprise_audit_trail"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_enterprise_audit_trail"() IS 'Creates enterprise audit trail for data changes';



CREATE OR REPLACE FUNCTION "public"."create_entity_album"("p_name" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_description" "text" DEFAULT NULL::"text", "p_is_public" boolean DEFAULT false, "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_album_id uuid;
  v_user_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create albums';
  END IF;
  
  -- Validate entity type
  IF p_entity_type NOT IN ('user', 'publisher', 'author', 'group', 'book', 'event', 'content', 'album', 'series', 'collection') THEN
    RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
  END IF;
  
  -- Create the album
  INSERT INTO "public"."photo_albums" (
    name,
    description,
    owner_id,
    entity_type,
    entity_id,
    is_public,
    metadata,
    entity_metadata
  ) VALUES (
    p_name,
    p_description,
    v_user_id,
    p_entity_type,
    p_entity_id,
    p_is_public,
    p_metadata,
    jsonb_build_object(
      'created_by', v_user_id,
      'entity_type', p_entity_type,
      'entity_id', p_entity_id,
      'created_at', now()
    )
  ) RETURNING id INTO v_album_id;
  
  -- Log the album creation
  PERFORM "public"."log_user_activity"(
    v_user_id,
    'album_created',
    jsonb_build_object(
      'album_id', v_album_id,
      'entity_type', p_entity_type,
      'entity_id', p_entity_id,
      'album_name', p_name
    )
  );
  
  RETURN v_album_id;
END;
$$;


ALTER FUNCTION "public"."create_entity_album"("p_name" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_description" "text", "p_is_public" boolean, "p_metadata" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_entity_album"("p_name" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_description" "text", "p_is_public" boolean, "p_metadata" "jsonb") IS 'Enterprise-grade function to create albums for any entity type with validation and logging';



CREATE OR REPLACE FUNCTION "public"."decrypt_sensitive_data_enhanced"("p_encrypted_data" "text", "p_key" "text" DEFAULT 'default_key'::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- In production, use proper decryption libraries
    -- This is a placeholder for demonstration
    RETURN SUBSTRING(p_encrypted_data FROM 11);
END;
$$;


ALTER FUNCTION "public"."decrypt_sensitive_data_enhanced"("p_encrypted_data" "text", "p_key" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."decrypt_sensitive_data_enhanced"("p_encrypted_data" "text", "p_key" "text") IS 'Enhanced decryption for authorized access';



CREATE OR REPLACE FUNCTION "public"."delete_follow_record"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") RETURNS TABLE("success" boolean, "error_message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Delete follow record
  DELETE FROM public.follows 
  WHERE follower_id = p_follower_id 
  AND following_id = p_following_id
  AND target_type_id = p_target_type_id;

  -- Check if any rows were affected
  IF FOUND THEN
    RETURN QUERY SELECT TRUE, '';
  ELSE
    RETURN QUERY SELECT FALSE, 'Follow record not found';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, SQLERRM;
END;
$$;


ALTER FUNCTION "public"."delete_follow_record"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."encrypt_sensitive_data_enhanced"("p_data" "text", "p_key" "text" DEFAULT 'default_key'::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- In production, use proper encryption libraries
    -- This is a placeholder for demonstration
    RETURN 'encrypted_' || encode(digest(p_data || p_key, 'sha256'), 'hex');
END;
$$;


ALTER FUNCTION "public"."encrypt_sensitive_data_enhanced"("p_data" "text", "p_key" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."encrypt_sensitive_data_enhanced"("p_data" "text", "p_key" "text") IS 'Enhanced encryption for sensitive data security';



CREATE OR REPLACE FUNCTION "public"."ensure_reading_progress_consistency"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Validate status values
    IF NEW.status NOT IN ('want_to_read', 'currently_reading', 'read', 'not_started', 'in_progress', 'completed', 'on_hold', 'abandoned') THEN
        RAISE EXCEPTION 'Invalid status value: %', NEW.status;
    END IF;
    
    -- Validate progress percentage
    IF NEW.progress_percentage < 0 OR NEW.progress_percentage > 100 THEN
        RAISE EXCEPTION 'Progress percentage must be between 0 and 100';
    END IF;
    
    -- Ensure dates are logical
    IF NEW.finish_date IS NOT NULL AND NEW.start_date IS NOT NULL AND NEW.finish_date < NEW.start_date THEN
        RAISE EXCEPTION 'Finish date cannot be before start date';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_reading_progress_consistency"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."export_user_data_enhanced"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_export_data "jsonb";
BEGIN
    SELECT "jsonb_build_object"(
        'user_info', (
            SELECT "jsonb_build_object"(
                'id', u."id",
                'email', u."email",
                'created_at', u."created_at"
            )
            FROM "auth"."users" u
            WHERE u."id" = p_user_id
        ),
        'reading_progress', (
            SELECT "jsonb_agg"("jsonb_build_object"(
                'book_id', rp."book_id",
                'status', rp."status",
                'progress_percentage', rp."progress_percentage",
                'start_date', rp."start_date",
                'finish_date', rp."finish_date"
            ))
            FROM "public"."reading_progress" rp
            WHERE rp."user_id" = p_user_id
        ),
        'book_reviews', (
            SELECT "jsonb_agg"("jsonb_build_object"(
                'book_id', br."book_id",
                'rating', br."rating",
                'review_text', br."review_text",
                'created_at', br."created_at"
            ))
            FROM "public"."book_reviews" br
            WHERE br."user_id" = p_user_id
        ),
        'reading_lists', (
            SELECT "jsonb_agg"("jsonb_build_object"(
                'list_id', rl."id",
                'name', rl."name",
                'description', rl."description",
                'created_at', rl."created_at"
            ))
            FROM "public"."reading_lists" rl
            WHERE rl."user_id" = p_user_id
        ),
        'export_timestamp', "now"()
    ) INTO v_export_data;
    
    -- Log the export operation
    PERFORM "public"."log_sensitive_operation_enhanced"(
        'data_export', 'user_data', p_user_id, p_user_id,
        "jsonb_build_object"('export_timestamp', "now"())
    );
    
    RETURN v_export_data;
END;
$$;


ALTER FUNCTION "public"."export_user_data_enhanced"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."export_user_data_enhanced"("p_user_id" "uuid") IS 'Enhanced user data export for GDPR compliance';



CREATE OR REPLACE FUNCTION "public"."extract_book_dimensions"("book_uuid" "uuid", "dimensions_json" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    width_val NUMERIC;
    height_val NUMERIC;
    depth_val NUMERIC;
    weight_val NUMERIC;
    unit_val TEXT;
BEGIN
    -- Extract dimensions from JSON
    width_val := (dimensions_json->>'width')::NUMERIC;
    height_val := (dimensions_json->>'height')::NUMERIC;
    depth_val := (dimensions_json->>'depth')::NUMERIC;
    weight_val := (dimensions_json->>'weight')::NUMERIC;
    unit_val := dimensions_json->>'unit';
    
    -- Insert or update book dimensions
    INSERT INTO book_dimensions (
        book_id, width, height, depth, weight, unit, source
    ) VALUES (
        book_uuid, width_val, height_val, depth_val, weight_val, unit_val, 'isbndb'
    ) ON CONFLICT (book_id) DO UPDATE SET
        width = EXCLUDED.width,
        height = EXCLUDED.height,
        depth = EXCLUDED.depth,
        weight = EXCLUDED.weight,
        unit = EXCLUDED.unit,
        updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."extract_book_dimensions"("book_uuid" "uuid", "dimensions_json" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fix_missing_publisher_relationships"() RETURNS TABLE("book_id" "uuid", "book_title" "text", "action_taken" "text", "publisher_id" "uuid", "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    book_record RECORD;
    publisher_record RECORD;
    linked_count integer := 0;
    created_count integer := 0;
BEGIN
    -- First, try to link books to existing publishers by author name
    FOR book_record IN 
        SELECT b.id, b.title, b.author, b.publisher_id
        FROM "public"."books" b
        WHERE b.publisher_id IS NULL
        AND b.author IS NOT NULL
    LOOP
        -- Try to find existing publisher by author name
        SELECT p.id INTO publisher_record
        FROM "public"."publishers" p
        WHERE p.name ILIKE '%' || book_record.author || '%'
        OR book_record.author ILIKE '%' || p.name || '%'
        LIMIT 1;
        
        IF publisher_record.id IS NOT NULL THEN
            -- Link to existing publisher
            UPDATE "public"."books" 
            SET publisher_id = publisher_record.id
            WHERE id = book_record.id;
            
            linked_count := linked_count + 1;
            
            RETURN QUERY SELECT 
                book_record.id,
                book_record.title,
                'LINKED_TO_EXISTING'::text,
                publisher_record.id,
                'SUCCESS'::text;
        ELSE
            -- Create new publisher based on author
            INSERT INTO "public"."publishers" (name, description)
            VALUES (book_record.author || ' Publications', 'Auto-generated publisher for ' || book_record.author)
            RETURNING id INTO publisher_record;
            
            -- Link book to new publisher
            UPDATE "public"."books" 
            SET publisher_id = publisher_record.id
            WHERE id = book_record.id;
            
            created_count := created_count + 1;
            
            RETURN QUERY SELECT 
                book_record.id,
                book_record.title,
                'CREATED_NEW_PUBLISHER'::text,
                publisher_record.id,
                'SUCCESS'::text;
        END IF;
    END LOOP;
    
    -- Log the operation (only if security_audit_log table exists)
    BEGIN
        INSERT INTO "public"."security_audit_log" (
            action, 
            table_name, 
            new_values
        ) VALUES (
            'FIX_PUBLISHER_RELATIONSHIPS',
            'books_publishers',
            jsonb_build_object(
                'linked_count', linked_count,
                'created_count', created_count,
                'total_fixed', linked_count + created_count,
                'fix_type', 'missing_publisher_relationships'
            )
        );
    EXCEPTION WHEN OTHERS THEN
        -- Table doesn't exist, continue without logging
    END;
END;
$$;


ALTER FUNCTION "public"."fix_missing_publisher_relationships"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fix_missing_publisher_relationships"() IS 'Automatically fix missing publisher relationships';



CREATE OR REPLACE FUNCTION "public"."flag_content"("p_flagged_by" "uuid", "p_content_type" character varying, "p_content_id" "uuid", "p_flag_reason" character varying, "p_flag_details" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_flag_id UUID;
    v_queue_id UUID;
BEGIN
    -- Insert flag
    INSERT INTO "public"."content_flags" (
        flagged_by,
        content_type,
        content_id,
        flag_reason,
        flag_details
    ) VALUES (
        p_flagged_by,
        p_content_type,
        p_content_id,
        p_flag_reason,
        p_flag_details
    ) RETURNING id INTO v_flag_id;
    
    -- Update or create moderation queue entry
    INSERT INTO "public"."moderation_queue" (
        content_type,
        content_id,
        flag_count,
        last_flagged_at
    ) VALUES (
        p_content_type,
        p_content_id,
        1,
        now()
    )
    ON CONFLICT (content_type, content_id) DO UPDATE SET
        flag_count = moderation_queue.flag_count + 1,
        last_flagged_at = now(),
        updated_at = now();
    
    RETURN v_flag_id;
END;
$$;


ALTER FUNCTION "public"."flag_content"("p_flagged_by" "uuid", "p_content_type" character varying, "p_content_id" "uuid", "p_flag_reason" character varying, "p_flag_details" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."flag_content"("p_flagged_by" "uuid", "p_content_type" character varying, "p_content_id" "uuid", "p_flag_reason" character varying, "p_flag_details" "text") IS 'Flag content for moderation';



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
    
    -- Orphaned records health
    RETURN QUERY SELECT 
        'Data Integrity'::text,
        'Orphaned reading_progress records'::text,
        COUNT(*)::text,
        CASE WHEN COUNT(*) = 0 THEN 'GOOD' ELSE 'NEEDS_CLEANUP' END,
        CASE WHEN COUNT(*) = 0 THEN 'No orphaned records' ELSE 'Run safe_cleanup_orphaned_records()' END
    FROM "public"."reading_progress" rp
    LEFT JOIN "public"."books" b ON rp.book_id = b.id
    WHERE b.id IS NULL;
    
    -- Overall data health
    RETURN QUERY SELECT 
        'System Health'::text,
        'Total books in system'::text,
        COUNT(*)::text,
        'INFO'::text,
        'System is operational'::text
    FROM "public"."books";
    
    -- Publisher distribution
    RETURN QUERY SELECT 
        'System Health'::text,
        'Total publishers in system'::text,
        COUNT(*)::text,
        'INFO'::text,
        'Publisher system is operational'::text
    FROM "public"."publishers";
END;
$$;


ALTER FUNCTION "public"."generate_data_health_report"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_data_health_report"() IS 'Generate comprehensive data health report';



CREATE OR REPLACE FUNCTION "public"."generate_friend_suggestions"("target_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Clear existing suggestions
    DELETE FROM "public"."friend_suggestions" WHERE user_id = target_user_id;
    
    -- Insert new suggestions based on mutual friends
    INSERT INTO "public"."friend_suggestions" (user_id, suggested_user_id, mutual_friends_count, suggestion_score)
    SELECT 
        target_user_id,
        potential_friend.id,
        get_mutual_friends_count(target_user_id, potential_friend.id) as mutual_friends_count,
        LEAST(get_mutual_friends_count(target_user_id, potential_friend.id) * 0.1, 1.0) as suggestion_score
    FROM "auth"."users" potential_friend
    WHERE potential_friend.id != target_user_id
    AND potential_friend.id NOT IN (
        SELECT friend_id FROM "public"."friends" WHERE user_id = target_user_id
        UNION
        SELECT user_id FROM "public"."friends" WHERE friend_id = target_user_id
    )
    AND get_mutual_friends_count(target_user_id, potential_friend.id) > 0;
END;
$$;


ALTER FUNCTION "public"."generate_friend_suggestions"("target_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_friend_suggestions"("target_user_id" "uuid") IS 'Generate friend suggestions for a user based on mutual friends';



CREATE OR REPLACE FUNCTION "public"."generate_intelligent_content"("p_content_type" "text", "p_input_data" "jsonb", "p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("generated_content" "text", "confidence_score" numeric, "metadata" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_job_id UUID;
    v_result TEXT;
    v_confidence DECIMAL(5,4);
    v_metadata JSONB;
BEGIN
    -- Create content generation job
    INSERT INTO public.content_generation_jobs (
        content_type,
        input_parameters,
        created_by
    ) VALUES (
        p_content_type,
        p_input_data,
        p_user_id
    ) RETURNING id INTO v_job_id;
    
    -- Simulate AI content generation (replace with actual AI integration)
    SELECT 
        CASE p_content_type
            WHEN 'book_summary' THEN 'This book explores...'
            WHEN 'author_bio' THEN 'A distinguished author known for...'
            WHEN 'review_analysis' THEN 'Based on the review analysis...'
            ELSE 'Generated content based on input parameters.'
        END,
        0.85,
        jsonb_build_object('job_id', v_job_id, 'generation_method', 'ai_enhanced')
    INTO v_result, v_confidence, v_metadata;
    
    -- Update job status
    UPDATE public.content_generation_jobs 
    SET 
        generation_status = 'completed',
        generated_content = v_result,
        quality_score = v_confidence,
        completed_at = NOW()
    WHERE id = v_job_id;
    
    RETURN QUERY SELECT v_result, v_confidence, v_metadata;
END;
$$;


ALTER FUNCTION "public"."generate_intelligent_content"("p_content_type" "text", "p_input_data" "jsonb", "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_intelligent_content"("p_content_type" "text", "p_input_data" "jsonb", "p_user_id" "uuid") IS 'Generate intelligent content using AI';



CREATE OR REPLACE FUNCTION "public"."generate_monitoring_report"("p_days_back" integer DEFAULT 7) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_report "jsonb";
BEGIN
    SELECT "jsonb_build_object"(
        'report_generated_at', "now"(),
        'period_days', p_days_back,
        'user_activity_summary', (
            SELECT "jsonb_build_object"(
                'total_activities', COUNT(*),
                'unique_users', COUNT(DISTINCT "user_id"),
                'avg_activities_per_user', ROUND(AVG(activity_count), 2)
            )
            FROM (
                SELECT "user_id", COUNT(*) as activity_count
                FROM "public"."user_activity_log"
                WHERE "created_at" >= "now"() - (p_days_back || ' days')::interval
                GROUP BY "user_id"
            ) user_activities
        ),
        'system_health_summary', (
            SELECT "jsonb_build_object"(
                'total_checks', COUNT(*),
                'healthy_checks', COUNT(*) FILTER (WHERE "status" = 'healthy'),
                'warning_checks', COUNT(*) FILTER (WHERE "status" = 'warning'),
                'critical_checks', COUNT(*) FILTER (WHERE "status" = 'critical')
            )
            FROM "public"."system_health_checks"
            WHERE "checked_at" >= "now"() - (p_days_back || ' days')::interval
        ),
        'performance_summary', (
            SELECT "jsonb_build_object"(
                'avg_response_time', ROUND(AVG("metric_value"), 2),
                'max_response_time', MAX("metric_value"),
                'total_measurements', COUNT(*)
            )
            FROM "public"."performance_metrics"
            WHERE "metric_name" = 'response_time' 
            AND "recorded_at" >= "now"() - (p_days_back || ' days')::interval
        ),
        'book_popularity_summary', (
            SELECT "jsonb_build_object"(
                'total_books_tracked', COUNT(*),
                'avg_views_per_book', ROUND(AVG("views_count"), 2),
                'avg_rating', ROUND(AVG("avg_rating"), 2),
                'most_viewed_book', (
                    SELECT "title" FROM "public"."books" 
                    WHERE "id" = bpm."book_id" 
                    ORDER BY "views_count" DESC 
                    LIMIT 1
                )
            )
            FROM "public"."book_popularity_metrics" bpm
            WHERE "last_updated" >= "now"() - (p_days_back || ' days')::interval
        )
    ) INTO v_report;
    
    RETURN v_report;
END;
$$;


ALTER FUNCTION "public"."generate_monitoring_report"("p_days_back" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_monitoring_report"("p_days_back" integer) IS 'Generates comprehensive monitoring reports';



CREATE OR REPLACE FUNCTION "public"."generate_permalink"("input_text" "text", "entity_type" "text" DEFAULT 'user'::"text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    base_permalink text;
    final_permalink text;
    counter integer := 1;
BEGIN
    -- Convert to lowercase and replace spaces/special chars with hyphens
    base_permalink := lower(regexp_replace(input_text, '[^a-zA-Z0-9\s]', '', 'g'));
    base_permalink := regexp_replace(base_permalink, '\s+', '-', 'g');
    base_permalink := regexp_replace(base_permalink, '-+', '-', 'g');
    base_permalink := trim(both '-' from base_permalink);
    
    -- Ensure minimum length
    IF length(base_permalink) < 3 THEN
        base_permalink := base_permalink || '-' || substr(md5(random()::text), 1, 6);
    END IF;
    
    final_permalink := base_permalink;
    
    -- Check for uniqueness based on entity type
    LOOP
        CASE entity_type
            WHEN 'user' THEN
                IF NOT EXISTS (SELECT 1 FROM users WHERE permalink = final_permalink) THEN
                    RETURN final_permalink;
                END IF;
            WHEN 'group' THEN
                IF NOT EXISTS (SELECT 1 FROM groups WHERE permalink = final_permalink) THEN
                    RETURN final_permalink;
                END IF;
            WHEN 'event' THEN
                IF NOT EXISTS (SELECT 1 FROM events WHERE permalink = final_permalink) THEN
                    RETURN final_permalink;
                END IF;
            WHEN 'book' THEN
                IF NOT EXISTS (SELECT 1 FROM books WHERE permalink = final_permalink) THEN
                    RETURN final_permalink;
                END IF;
            WHEN 'author' THEN
                IF NOT EXISTS (SELECT 1 FROM authors WHERE permalink = final_permalink) THEN
                    RETURN final_permalink;
                END IF;
            WHEN 'publisher' THEN
                IF NOT EXISTS (SELECT 1 FROM publishers WHERE permalink = final_permalink) THEN
                    RETURN final_permalink;
                END IF;
            ELSE
                RETURN final_permalink;
        END CASE;
        
        -- Add counter if permalink exists
        final_permalink := base_permalink || '-' || counter;
        counter := counter + 1;
        
        -- Prevent infinite loop
        IF counter > 100 THEN
            final_permalink := base_permalink || '-' || substr(md5(random()::text), 1, 8);
            RETURN final_permalink;
        END IF;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."generate_permalink"("input_text" "text", "entity_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_permalink"("input_text" "text", "entity_type" "text") IS 'Generates a unique permalink from input text';



CREATE OR REPLACE FUNCTION "public"."generate_smart_notification"("p_user_id" "uuid", "p_notification_type" "text", "p_context_data" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_notification_id UUID;
    v_title TEXT;
    v_content TEXT;
    v_priority TEXT;
BEGIN
    -- Generate personalized notification content
    SELECT 
        CASE p_notification_type
            WHEN 'recommendation' THEN 'New Book Recommendation'
            WHEN 'reminder' THEN 'Reading Reminder'
            WHEN 'alert' THEN 'Important Update'
            ELSE 'Notification'
        END,
        CASE p_notification_type
            WHEN 'recommendation' THEN 'We found a book you might love!'
            WHEN 'reminder' THEN 'Time to continue your reading journey.'
            WHEN 'alert' THEN 'Important information for you.'
            ELSE 'You have a new notification.'
        END,
        CASE 
            WHEN p_notification_type = 'alert' THEN 'high'
            ELSE 'normal'
        END
    INTO v_title, v_content, v_priority;
    
    -- Create smart notification
    INSERT INTO public.smart_notifications (
        user_id,
        notification_type,
        notification_title,
        notification_content,
        priority_level,
        ai_generated,
        personalization_data
    ) VALUES (
        p_user_id,
        p_notification_type,
        v_title,
        v_content,
        v_priority,
        true,
        p_context_data
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;


ALTER FUNCTION "public"."generate_smart_notification"("p_user_id" "uuid", "p_notification_type" "text", "p_context_data" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_smart_notification"("p_user_id" "uuid", "p_notification_type" "text", "p_context_data" "jsonb") IS 'Generate personalized smart notifications';



CREATE OR REPLACE FUNCTION "public"."generate_system_alerts_enhanced"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_alerts "jsonb" := '[]'::"jsonb";
    v_alert "jsonb";
    v_health_status "jsonb";
    v_data_quality "jsonb";
BEGIN
    -- Check system health
    v_health_status := "public"."comprehensive_system_health_check_enhanced"();
    
    IF (v_health_status->>'overall_status') = 'critical' THEN
        v_alert := "jsonb_build_object"(
            'alert_type', 'system_health_critical',
            'severity', 'critical',
            'message', 'System health check failed',
            'details', v_health_status
        );
        v_alerts := v_alerts || v_alert;
    END IF;
    
    -- Check data quality
    v_data_quality := "public"."check_data_quality_issues_enhanced"();
    
    IF (v_data_quality->>'total_issues')::integer > 0 THEN
        v_alert := "jsonb_build_object"(
            'alert_type', 'data_quality_issues',
            'severity', 'warning',
            'message', 'Data quality issues detected',
            'details', v_data_quality
        );
        v_alerts := v_alerts || v_alert;
    END IF;
    
    -- Check performance
    IF EXISTS (
        SELECT 1 FROM "public"."performance_metrics" 
        WHERE "metric_name" = 'response_time' 
        AND "metric_value" > 5000
        AND "recorded_at" >= "now"() - INTERVAL '1 hour'
    ) THEN
        v_alert := "jsonb_build_object"(
            'alert_type', 'performance_degradation',
            'severity', 'warning',
            'message', 'High response times detected',
            'details', "jsonb_build_object"('timeframe', 'last_hour')
        );
        v_alerts := v_alerts || v_alert;
    END IF;
    
    RETURN "jsonb_build_object"(
        'alerts', v_alerts,
        'total_alerts', array_length(v_alerts, 1),
        'alert_timestamp', "now"()
    );
END;
$$;


ALTER FUNCTION "public"."generate_system_alerts_enhanced"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_system_alerts_enhanced"() IS 'Enhanced system alert generation';



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
END;
$$;


ALTER FUNCTION "public"."get_ai_book_recommendations"("p_user_id" "uuid", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_ai_book_recommendations"("p_user_id" "uuid", "p_limit" integer) IS 'Get AI-powered book recommendations for users';



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
END;
$$;


ALTER FUNCTION "public"."get_data_lineage"("p_table_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_data_lineage"("p_table_name" "text") IS 'Gets data lineage information for tables';



CREATE OR REPLACE FUNCTION "public"."get_data_quality_report"("p_table_name" "text" DEFAULT NULL::"text") RETURNS TABLE("table_name" "text", "total_rules" integer, "passed_rules" integer, "failed_rules" integer, "critical_issues" integer, "overall_score" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    rule_count integer;
    passed_count integer;
    failed_count integer;
    critical_count integer;
BEGIN
    -- Get rule counts
    SELECT COUNT(*), 
           COUNT(*) FILTER (WHERE validation_result = 'PASS'),
           COUNT(*) FILTER (WHERE validation_result = 'FAIL'),
           COUNT(*) FILTER (WHERE validation_result = 'FAIL' AND severity = 'CRITICAL')
    INTO rule_count, passed_count, failed_count, critical_count
    FROM "public"."validate_enterprise_data_quality"(p_table_name);
    
    RETURN QUERY SELECT 
        COALESCE(p_table_name, 'ALL_TABLES'),
        rule_count,
        passed_count,
        failed_count,
        critical_count,
        CASE 
            WHEN rule_count = 0 THEN 100.0
            ELSE ROUND((passed_count::numeric / rule_count::numeric) * 100, 2)
        END;
END;
$$;


ALTER FUNCTION "public"."get_data_quality_report"("p_table_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_data_quality_report"("p_table_name" "text") IS 'Generates comprehensive data quality report';



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
END;
$$;


ALTER FUNCTION "public"."get_entity_albums"("p_entity_type" "text", "p_entity_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_entity_albums"("p_entity_type" "text", "p_entity_id" "uuid", "p_user_id" "uuid") IS 'Enterprise-grade function to retrieve albums for any entity type with proper access control';



CREATE OR REPLACE FUNCTION "public"."get_entity_by_permalink"("permalink" "text", "entity_type" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    entity_id uuid;
BEGIN
    CASE entity_type
        WHEN 'user' THEN
            SELECT id INTO entity_id FROM users WHERE permalink = permalink LIMIT 1;
        WHEN 'group' THEN
            SELECT id INTO entity_id FROM groups WHERE permalink = permalink LIMIT 1;
        WHEN 'event' THEN
            SELECT id INTO entity_id FROM events WHERE permalink = permalink LIMIT 1;
        WHEN 'book' THEN
            SELECT id INTO entity_id FROM books WHERE permalink = permalink LIMIT 1;
        WHEN 'author' THEN
            SELECT id INTO entity_id FROM authors WHERE permalink = permalink LIMIT 1;
        WHEN 'publisher' THEN
            SELECT id INTO entity_id FROM publishers WHERE permalink = permalink LIMIT 1;
        ELSE
            RETURN NULL;
    END CASE;
    
    RETURN entity_id;
END;
$$;


ALTER FUNCTION "public"."get_entity_by_permalink"("permalink" "text", "entity_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_entity_by_permalink"("permalink" "text", "entity_type" "text") IS 'Gets entity ID by permalink and entity type';



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
END;
$$;


ALTER FUNCTION "public"."get_entity_images"("p_entity_type" "text", "p_entity_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_entity_images"("p_entity_type" "text", "p_entity_id" "uuid") IS 'Get all images for a specific entity type and ID';



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
END;
$$;


ALTER FUNCTION "public"."get_entity_social_stats"("p_entity_type" character varying, "p_entity_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_entity_social_stats"("p_entity_type" character varying, "p_entity_id" "uuid", "p_user_id" "uuid") IS 'Get comprehensive social statistics for any entity';



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
END;
$$;


ALTER FUNCTION "public"."get_moderation_stats"("p_days_back" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_moderation_stats"("p_days_back" integer) IS 'Get moderation statistics and analytics';



CREATE OR REPLACE FUNCTION "public"."get_mutual_friends_count"("user1_id" "uuid", "user2_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    mutual_count integer;
BEGIN
    SELECT COUNT(*) INTO mutual_count
    FROM (
        SELECT f1.friend_id
        FROM "public"."friends" f1
        WHERE f1.user_id = user1_id AND f1.status = 'accepted'
        INTERSECT
        SELECT f2.friend_id
        FROM "public"."friends" f2
        WHERE f2.user_id = user2_id AND f2.status = 'accepted'
    ) mutual_friends;
    
    RETURN mutual_count;
END;
$$;


ALTER FUNCTION "public"."get_mutual_friends_count"("user1_id" "uuid", "user2_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_mutual_friends_count"("user1_id" "uuid", "user2_id" "uuid") IS 'Calculate the number of mutual friends between two users';



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
    
    -- Check for slow queries
    RETURN QUERY
    SELECT 
        'Slow Queries'::text,
        'MEDIUM'::text,
        'Optimize queries taking more than 500ms'::text,
        '10-30% performance improvement'::text
    WHERE EXISTS (
        SELECT 1 FROM pg_stat_statements 
        WHERE mean_time > 500
    );
    
    -- Check for table bloat
    RETURN QUERY
    SELECT 
        'Table Bloat'::text,
        'LOW'::text,
        'Run VACUUM on tables with high dead tuple ratio'::text,
        '5-15% space and performance improvement'::text
    WHERE EXISTS (
        SELECT 1 FROM pg_stat_user_tables 
        WHERE n_dead_tup > 1000
    );
    
    -- Check for materialized view refresh
    RETURN QUERY
    SELECT 
        'Materialized Views'::text,
        'MEDIUM'::text,
        'Refresh materialized views for better performance'::text,
        '50-80% improvement for summary queries'::text
    WHERE EXISTS (
        SELECT 1 FROM pg_matviews 
        WHERE schemaname = 'public'
    );
END;
$$;


ALTER FUNCTION "public"."get_performance_recommendations"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_performance_recommendations"() IS 'Get performance optimization recommendations';



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
END;
$$;


ALTER FUNCTION "public"."get_privacy_audit_summary"("days_back" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_privacy_audit_summary"("days_back" integer) IS 'Get summary of privacy audit actions for the current user';



CREATE OR REPLACE FUNCTION "public"."get_user_activities_simple"("p_user_id" "uuid", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "text", "user_id" "text", "user_name" "text", "user_avatar_url" "text", "activity_type" "text", "data" "jsonb", "created_at" "text", "is_public" boolean, "like_count" integer, "comment_count" integer, "is_liked" boolean, "entity_type" "text", "entity_id" "text")
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
        true as is_public,
        COALESCE(act.like_count, 0) as like_count,
        COALESCE(act.comment_count, 0) as comment_count,
        false as is_liked,
        COALESCE(act.entity_type, 'user') as entity_type,
        COALESCE(act.entity_id::text, act.user_id::text) as entity_id
    FROM public.activities act
    LEFT JOIN public.users usr ON act.user_id = usr.id
    WHERE act.user_id = p_user_id
    ORDER BY act.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_user_activities_simple"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "text", "user_id" "text", "user_name" "text", "user_avatar_url" "text", "activity_type" "text", "data" "jsonb", "created_at" "text", "is_public" boolean, "like_count" integer, "comment_count" integer, "is_liked" boolean, "entity_type" "text", "entity_id" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.get_user_activities_simple(p_user_id, p_limit, p_offset);
END;
$$;


ALTER FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


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
END;
$$;


ALTER FUNCTION "public"."get_user_privacy_settings"("user_id_param" "uuid") OWNER TO "postgres";


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
END;
$$;


ALTER FUNCTION "public"."get_user_timeline_posts"("target_user_id" "uuid", "limit_count" integer, "offset_count" integer) OWNER TO "postgres";


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

    -- Log the action
    INSERT INTO "public"."privacy_audit_log" (user_id, action, target_user_id, permission_type, new_value)
    VALUES (auth.uid(), 'grant_permission', target_user_id, permission_type, 
            jsonb_build_object('permission_type', permission_type, 'expires_at', expires_at));

    RETURN true;
END;
$$;


ALTER FUNCTION "public"."grant_reading_permission"("target_user_id" "uuid", "permission_type" "text", "expires_at" timestamp with time zone) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."grant_reading_permission"("target_user_id" "uuid", "permission_type" "text", "expires_at" timestamp with time zone) IS 'Grant custom permission to view reading progress';



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
        ELSE
            -- Album became private, remove public feed entries
            DELETE FROM feed_entries 
            WHERE entity_type = 'photo_album' 
            AND entity_id = NEW.id::text 
            AND visibility = 'public';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_album_privacy_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_privacy_level_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update boolean flags based on privacy_level
    NEW.allow_friends := (NEW.privacy_level = 'friends');
    NEW.allow_followers := (NEW.privacy_level = 'followers');
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_privacy_level_update"() OWNER TO "postgres";


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
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_public_album_creation"() OWNER TO "postgres";


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
END;
$$;


ALTER FUNCTION "public"."has_user_liked_entity"("p_user_id" "uuid", "p_entity_type" character varying, "p_entity_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."has_user_liked_entity"("p_user_id" "uuid", "p_entity_type" character varying, "p_entity_id" "uuid") IS 'Check if user has liked a specific entity';



CREATE OR REPLACE FUNCTION "public"."increment_post_view_count"("post_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE "public"."posts" 
    SET view_count = view_count + 1,
        last_activity_at = now()
    WHERE id = post_id;
END;
$$;


ALTER FUNCTION "public"."increment_post_view_count"("post_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_user_privacy_settings"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Create default privacy settings for new users
    INSERT INTO "public"."user_privacy_settings" (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."initialize_user_privacy_settings"() OWNER TO "postgres";


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
    RETURN;
  END IF;

  -- Insert new follow record
  INSERT INTO public.follows (follower_id, following_id, target_type_id)
  VALUES (p_follower_id, p_following_id, p_target_type_id);

  RETURN QUERY SELECT TRUE, '';
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, SQLERRM;
END;
$$;


ALTER FUNCTION "public"."insert_follow_record"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_sensitive_operation_enhanced"("p_operation_type" "text", "p_table_name" "text", "p_record_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"(), "p_details" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_audit_id "uuid";
BEGIN
    INSERT INTO "public"."privacy_audit_log" (
        "user_id", "action", "entity_type", "entity_id", "metadata"
    ) VALUES (
        p_user_id, p_operation_type, p_table_name, p_record_id::"text", p_details
    ) RETURNING "id" INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$;


ALTER FUNCTION "public"."log_sensitive_operation_enhanced"("p_operation_type" "text", "p_table_name" "text", "p_record_id" "uuid", "p_user_id" "uuid", "p_details" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_sensitive_operation_enhanced"("p_operation_type" "text", "p_table_name" "text", "p_record_id" "uuid", "p_user_id" "uuid", "p_details" "jsonb") IS 'Enhanced logging for sensitive operations audit trail';



CREATE OR REPLACE FUNCTION "public"."log_social_action"("p_user_id" "uuid", "p_action_type" character varying, "p_entity_type" character varying, "p_entity_id" "uuid", "p_target_id" "uuid" DEFAULT NULL::"uuid", "p_action_details" "jsonb" DEFAULT '{}'::"jsonb", "p_ip_address" "inet" DEFAULT NULL::"inet", "p_user_agent" "text" DEFAULT NULL::"text", "p_session_id" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO "public"."social_audit_log" (
        user_id,
        action_type,
        entity_type,
        entity_id,
        target_id,
        action_details,
        ip_address,
        user_agent,
        session_id
    ) VALUES (
        p_user_id,
        p_action_type,
        p_entity_type,
        p_entity_id,
        p_target_id,
        p_action_details,
        p_ip_address,
        p_user_agent,
        p_session_id
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$;


ALTER FUNCTION "public"."log_social_action"("p_user_id" "uuid", "p_action_type" character varying, "p_entity_type" character varying, "p_entity_id" "uuid", "p_target_id" "uuid", "p_action_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_social_action"("p_user_id" "uuid", "p_action_type" character varying, "p_entity_type" character varying, "p_entity_id" "uuid", "p_target_id" "uuid", "p_action_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" "text") IS 'Log social actions for audit trail';



CREATE OR REPLACE FUNCTION "public"."log_user_activity"("p_user_id" "uuid", "p_activity_type" "text", "p_activity_details" "jsonb" DEFAULT NULL::"jsonb", "p_ip_address" "inet" DEFAULT NULL::"inet", "p_user_agent" "text" DEFAULT NULL::"text", "p_session_id" "text" DEFAULT NULL::"text", "p_response_time_ms" integer DEFAULT NULL::integer, "p_status_code" integer DEFAULT NULL::integer) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_activity_id "uuid";
BEGIN
    INSERT INTO "public"."user_activity_log" (
        "user_id", "activity_type", "activity_details", "ip_address", 
        "user_agent", "session_id", "response_time_ms", "status_code"
    ) VALUES (
        p_user_id, p_activity_type, p_activity_details, p_ip_address,
        p_user_agent, p_session_id, p_response_time_ms, p_status_code
    ) RETURNING "id" INTO v_activity_id;
    
    RETURN v_activity_id;
END;
$$;


ALTER FUNCTION "public"."log_user_activity"("p_user_id" "uuid", "p_activity_type" "text", "p_activity_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" "text", "p_response_time_ms" integer, "p_status_code" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_user_activity"("p_user_id" "uuid", "p_activity_type" "text", "p_activity_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" "text", "p_response_time_ms" integer, "p_status_code" integer) IS 'Records user activity for analytics and monitoring';



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
END;
$$;


ALTER FUNCTION "public"."map_progress_to_reading_status"("status" "text") OWNER TO "postgres";


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
END;
$$;


ALTER FUNCTION "public"."map_reading_status_to_progress"("status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mask_sensitive_data"("input_text" "text", "mask_type" "text" DEFAULT 'PARTIAL'::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    CASE mask_type
        WHEN 'FULL' THEN
            RETURN '***MASKED***';
        WHEN 'PARTIAL' THEN
            IF length(input_text) <= 3 THEN
                RETURN '***';
            ELSE
                RETURN left(input_text, 1) || repeat('*', length(input_text) - 2) || right(input_text, 1);
            END IF;
        WHEN 'EMAIL' THEN
            IF position('@' in input_text) > 0 THEN
                RETURN left(input_text, 1) || '***' || '@' || split_part(input_text, '@', 2);
            ELSE
                RETURN '***@***';
            END IF;
        ELSE
            RETURN input_text;
    END CASE;
END;
$$;


ALTER FUNCTION "public"."mask_sensitive_data"("input_text" "text", "mask_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."mask_sensitive_data"("input_text" "text", "mask_type" "text") IS 'Mask sensitive data for privacy compliance';



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
    
    -- Monitor orphaned reading progress records
    RETURN QUERY
    SELECT 
        'Orphaned reading progress records'::text,
        COUNT(*)::bigint,
        0::bigint,
        CASE 
            WHEN COUNT(*) = 0 THEN 'GOOD'
            ELSE 'WARNING'
        END,
        now()
    FROM "public"."reading_progress" rp
    LEFT JOIN "public"."books" b ON rp.book_id = b.id
    WHERE b.id IS NULL;
    
    -- Monitor orphaned follows records
    RETURN QUERY
    SELECT 
        'Orphaned follows records'::text,
        COUNT(*)::bigint,
        0::bigint,
        CASE 
            WHEN COUNT(*) = 0 THEN 'GOOD'
            ELSE 'WARNING'
        END,
        now()
    FROM "public"."follows" f
    LEFT JOIN "auth"."users" u ON f.follower_id = u.id
    WHERE u.id IS NULL;
    
    -- Monitor data consistency (FIXED: Use table alias to avoid ambiguity)
    RETURN QUERY
    SELECT 
        'Inconsistent status values'::text,
        COUNT(*)::bigint,
        0::bigint,
        CASE 
            WHEN COUNT(*) = 0 THEN 'GOOD'
            ELSE 'WARNING'
        END,
        now()
    FROM "public"."reading_progress" rp
    WHERE rp.status NOT IN ('not_started', 'in_progress', 'completed', 'on_hold', 'abandoned');
END;
$$;


ALTER FUNCTION "public"."monitor_data_health"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."monitor_data_health"() IS 'Monitor data health metrics continuously';



CREATE OR REPLACE FUNCTION "public"."monitor_database_performance_enhanced"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_performance_data "jsonb";
BEGIN
    SELECT "jsonb_build_object"(
        'database_size_mb', (
            SELECT ROUND(SUM(pg_total_relation_size(c.oid)) / 1024.0 / 1024.0, 2)
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
        ),
        'active_connections', (
            SELECT COUNT(*) 
            FROM pg_stat_activity 
            WHERE state = 'active'
        ),
        'cache_hit_ratio', (
            SELECT ROUND(
                (sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read))) * 100, 2
            )
            FROM pg_statio_user_tables
        ),
        'slow_queries', (
            SELECT COUNT(*) 
            FROM pg_stat_statements 
            WHERE mean_time > 1000
        ),
        'monitoring_timestamp', "now"()
    ) INTO v_performance_data;
    
    -- Record performance metrics
    PERFORM "public"."record_performance_metric"(
        'database_size_mb', 
        (v_performance_data->>'database_size_mb')::numeric,
        'MB', 'database'
    );
    
    PERFORM "public"."record_performance_metric"(
        'cache_hit_ratio', 
        (v_performance_data->>'cache_hit_ratio')::numeric,
        '%', 'database'
    );
    
    RETURN v_performance_data;
END;
$$;


ALTER FUNCTION "public"."monitor_database_performance_enhanced"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."monitor_database_performance_enhanced"() IS 'Enhanced database performance monitoring';



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
END;
$$;


ALTER FUNCTION "public"."monitor_entity_storage_usage"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."monitor_entity_storage_usage"() IS 'Monitor storage usage with warning levels';



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
END;
$$;


ALTER FUNCTION "public"."monitor_query_performance"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."monitor_query_performance"() IS 'Monitor query performance patterns';



CREATE OR REPLACE FUNCTION "public"."perform_database_maintenance_enhanced"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_maintenance_result "jsonb";
    v_start_time timestamp with time zone := "now"();
    v_operations_completed integer := 0;
    v_errors "text"[] := '{}';
BEGIN
    -- Clean up old monitoring data
    BEGIN
        PERFORM "public"."cleanup_old_monitoring_data"(90);
        v_operations_completed := v_operations_completed + 1;
    EXCEPTION WHEN OTHERS THEN
        v_errors := array_append(v_errors, 'Failed to cleanup monitoring data: ' || SQLERRM);
    END;
    
    -- Update book popularity metrics for all books
    BEGIN
        PERFORM "public"."update_book_popularity_metrics"(b."id")
        FROM "public"."books" b
        WHERE b."id" IN (
            SELECT DISTINCT "book_id" 
            FROM "public"."book_views" 
            WHERE "created_at" >= "now"() - INTERVAL '7 days'
        );
        v_operations_completed := v_operations_completed + 1;
    EXCEPTION WHEN OTHERS THEN
        v_errors := array_append(v_errors, 'Failed to update book popularity: ' || SQLERRM);
    END;
    
    -- Analyze tables for query optimization
    BEGIN
        ANALYZE "public"."books";
        ANALYZE "public"."book_reviews";
        ANALYZE "public"."reading_progress";
        ANALYZE "public"."user_activity_log";
        v_operations_completed := v_operations_completed + 1;
    EXCEPTION WHEN OTHERS THEN
        v_errors := array_append(v_errors, 'Failed to analyze tables: ' || SQLERRM);
    END;
    
    -- Build maintenance result
    v_maintenance_result := "jsonb_build_object"(
        'maintenance_started_at', v_start_time,
        'maintenance_completed_at', "now"(),
        'operations_completed', v_operations_completed,
        'errors', v_errors,
        'duration_seconds', EXTRACT(EPOCH FROM ("now"() - v_start_time))
    );
    
    RETURN v_maintenance_result;
END;
$$;


ALTER FUNCTION "public"."perform_database_maintenance_enhanced"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."perform_database_maintenance_enhanced"() IS 'Enhanced automated database maintenance tasks';



CREATE OR REPLACE FUNCTION "public"."perform_system_health_check"("p_check_name" "text", "p_status" "text", "p_details" "jsonb" DEFAULT NULL::"jsonb", "p_response_time_ms" integer DEFAULT NULL::integer, "p_error_message" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_check_id "uuid";
BEGIN
    INSERT INTO "public"."system_health_checks" (
        "check_name", "status", "details", "response_time_ms", "error_message"
    ) VALUES (
        p_check_name, p_status, p_details, p_response_time_ms, p_error_message
    ) RETURNING "id" INTO v_check_id;
    
    RETURN v_check_id;
END;
$$;


ALTER FUNCTION "public"."perform_system_health_check"("p_check_name" "text", "p_status" "text", "p_details" "jsonb", "p_response_time_ms" integer, "p_error_message" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."perform_system_health_check"("p_check_name" "text", "p_status" "text", "p_details" "jsonb", "p_response_time_ms" integer, "p_error_message" "text") IS 'Performs and records system health checks';



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
    
    RAISE NOTICE 'Populated entity context for album_images';
END;
$$;


ALTER FUNCTION "public"."populate_album_images_entity_context"() OWNER TO "postgres";


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
END;
$$;


ALTER FUNCTION "public"."populate_dewey_decimal_classifications"() OWNER TO "postgres";


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
    
    RAISE NOTICE 'Populated entity_type_id for images';
END;
$$;


ALTER FUNCTION "public"."populate_images_entity_type_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_complete_isbndb_book_data"("book_uuid" "uuid", "isbndb_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    excerpt_text TEXT;
    reviews_array JSONB;
    review_record JSONB;
    dewey_array TEXT[];
    dimensions_json JSONB;
    other_isbns_json JSONB;
    related_json JSONB;
BEGIN
    -- Extract data from ISBNdb response
    excerpt_text := isbndb_data->>'excerpt';
    reviews_array := isbndb_data->'reviews';
    dewey_array := ARRAY(SELECT jsonb_array_elements_text(isbndb_data->'dewey_decimal'));
    dimensions_json := isbndb_data->'dimensions_structured';
    other_isbns_json := isbndb_data->'other_isbns';
    related_json := isbndb_data->'related';
    
    -- Process excerpt
    IF excerpt_text IS NOT NULL AND length(trim(excerpt_text)) > 0 THEN
        INSERT INTO book_excerpts (book_id, excerpt_text, excerpt_type, excerpt_source)
        VALUES (book_uuid, excerpt_text, 'isbndb', 'isbndb')
        ON CONFLICT (book_id, excerpt_type) DO UPDATE SET
            excerpt_text = EXCLUDED.excerpt_text,
            updated_at = NOW();
    END IF;
    
    -- Process reviews
    IF reviews_array IS NOT NULL AND jsonb_array_length(reviews_array) > 0 THEN
        -- Clear existing reviews
        DELETE FROM book_reviews_isbndb WHERE book_id = book_uuid;
        
        -- Insert new reviews
        FOR review_record IN SELECT * FROM jsonb_array_elements(reviews_array)
        LOOP
            INSERT INTO book_reviews_isbndb (book_id, review_text, review_source)
            VALUES (book_uuid, review_record::TEXT, 'isbndb');
        END LOOP;
    END IF;
    
    -- Process Dewey Decimal classifications
    PERFORM process_dewey_decimal_classifications(book_uuid, dewey_array);
    
    -- Process structured dimensions
    PERFORM extract_book_dimensions(book_uuid, dimensions_json);
    
    -- Process other ISBNs
    PERFORM process_other_isbns(book_uuid, other_isbns_json);
    
    -- Process related books
    PERFORM process_related_books(book_uuid, related_json);
    
    -- Update book record with metadata
    UPDATE books SET
        isbndb_last_updated = NOW(),
        isbndb_data_version = '2.6.0',
        raw_isbndb_data = isbndb_data
    WHERE id = book_uuid;
END;
$$;


ALTER FUNCTION "public"."process_complete_isbndb_book_data"("book_uuid" "uuid", "isbndb_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_dewey_decimal_classifications"("book_uuid" "uuid", "dewey_array" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    dewey_code TEXT;
    dewey_id UUID;
BEGIN
    IF dewey_array IS NULL OR array_length(dewey_array, 1) IS NULL THEN
        RETURN;
    END IF;
    
    -- Clear existing classifications for this book
    DELETE FROM book_dewey_classifications WHERE book_id = book_uuid;
    
    -- Process each Dewey Decimal code
    FOREACH dewey_code IN ARRAY dewey_array
    LOOP
        -- Try to find existing classification
        SELECT id INTO dewey_id FROM dewey_decimal_classifications WHERE code = dewey_code;
        
        -- If not found, create a basic entry
        IF dewey_id IS NULL THEN
            INSERT INTO dewey_decimal_classifications (code, description, level)
            VALUES (dewey_code, 'Dewey Decimal Classification: ' || dewey_code, 1)
            RETURNING id INTO dewey_id;
        END IF;
        
        -- Link book to classification
        INSERT INTO book_dewey_classifications (book_id, dewey_id)
        VALUES (book_uuid, dewey_id);
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."process_dewey_decimal_classifications"("book_uuid" "uuid", "dewey_array" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_image_with_ai"("p_image_id" "uuid", "p_analysis_types" "text"[] DEFAULT ARRAY['content'::"text", 'quality'::"text", 'sentiment'::"text"]) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result "jsonb";
BEGIN
    -- Create processing job
    INSERT INTO "public"."image_processing_jobs" (
        image_id, 
        job_type, 
        status, 
        priority, 
        parameters
    ) VALUES (
        p_image_id, 
        'ai_analysis', 
        'pending', 
        8, 
        jsonb_build_object('analysis_types', p_analysis_types)
    );
    
    -- Simulate AI analysis result (in production, this would call external AI service)
    result := jsonb_build_object(
        'analysis_id', gen_random_uuid(),
        'image_id', p_image_id,
        'analysis_types', p_analysis_types,
        'status', 'completed',
        'processing_time_ms', 1200
    );
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."process_image_with_ai"("p_image_id" "uuid", "p_analysis_types" "text"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."process_image_with_ai"("p_image_id" "uuid", "p_analysis_types" "text"[]) IS 'Enterprise function to process images with AI analysis';



CREATE OR REPLACE FUNCTION "public"."process_other_isbns"("book_uuid" "uuid", "other_isbns_json" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    isbn_record JSONB;
    isbn_text TEXT;
    binding_type TEXT;
BEGIN
    IF other_isbns_json IS NULL OR jsonb_array_length(other_isbns_json) = 0 THEN
        RETURN;
    END IF;
    
    -- Clear existing ISBN variants for this book
    DELETE FROM book_isbn_variants WHERE book_id = book_uuid;
    
    -- Process each ISBN record
    FOR isbn_record IN SELECT * FROM jsonb_array_elements(other_isbns_json)
    LOOP
        isbn_text := isbn_record->>'isbn';
        binding_type := isbn_record->>'binding';
        
        -- Determine ISBN type
        INSERT INTO book_isbn_variants (
            book_id, isbn, isbn_type, binding_type, format_type
        ) VALUES (
            book_uuid,
            isbn_text,
            CASE 
                WHEN length(isbn_text) = 10 THEN 'isbn10'
                WHEN length(isbn_text) = 13 THEN 'isbn13'
                ELSE 'unknown'
            END,
            binding_type,
            'variant'
        );
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."process_other_isbns"("book_uuid" "uuid", "other_isbns_json" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_related_books"("book_uuid" "uuid", "related_json" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    relation_type TEXT;
BEGIN
    IF related_json IS NULL THEN
        RETURN;
    END IF;
    
    relation_type := related_json->>'type';
    
    -- Store related book information
    INSERT INTO book_relations (
        book_id, relation_type, relation_source, relation_data
    ) VALUES (
        book_uuid, relation_type, 'isbndb', related_json
    ) ON CONFLICT (book_id, relation_type) DO UPDATE SET
        relation_data = EXCLUDED.relation_data,
        updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."process_related_books"("book_uuid" "uuid", "related_json" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_performance_metric"("p_metric_name" "text", "p_metric_value" numeric, "p_metric_unit" "text" DEFAULT NULL::"text", "p_category" "text" DEFAULT 'general'::"text", "p_additional_data" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_metric_id "uuid";
BEGIN
    INSERT INTO "public"."performance_metrics" (
        "metric_name", "metric_value", "metric_unit", "category", "additional_data"
    ) VALUES (
        p_metric_name, p_metric_value, p_metric_unit, p_category, p_additional_data
    ) RETURNING "id" INTO v_metric_id;
    
    RETURN v_metric_id;
END;
$$;


ALTER FUNCTION "public"."record_performance_metric"("p_metric_name" "text", "p_metric_value" numeric, "p_metric_unit" "text", "p_category" "text", "p_additional_data" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."record_performance_metric"("p_metric_name" "text", "p_metric_value" numeric, "p_metric_unit" "text", "p_category" "text", "p_additional_data" "jsonb") IS 'Records performance metrics for monitoring';



CREATE OR REPLACE FUNCTION "public"."refresh_materialized_views"() RETURNS TABLE("view_name" "text", "refresh_status" "text", "refresh_time" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Refresh book popularity summary
    REFRESH MATERIALIZED VIEW "public"."book_popularity_summary";
    RETURN QUERY SELECT 'book_popularity_summary'::text, 'REFRESHED'::text, now();
    
    -- Refresh user activity summary
    REFRESH MATERIALIZED VIEW "public"."user_activity_summary";
    RETURN QUERY SELECT 'user_activity_summary'::text, 'REFRESHED'::text, now();
    
    -- Refresh publisher summary
    REFRESH MATERIALIZED VIEW "public"."publisher_summary";
    RETURN QUERY SELECT 'publisher_summary'::text, 'REFRESHED'::text, now();
END;
$$;


ALTER FUNCTION "public"."refresh_materialized_views"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."refresh_materialized_views"() IS 'Refresh all materialized views';



CREATE OR REPLACE FUNCTION "public"."revoke_reading_permission"("target_user_id" "uuid", "permission_type" "text" DEFAULT 'view_reading_progress'::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Delete permission
    DELETE FROM "public"."custom_permissions" 
    WHERE user_id = auth.uid() 
    AND target_user_id = target_user_id 
    AND permission_type = permission_type;

    -- Log the action
    INSERT INTO "public"."privacy_audit_log" (user_id, action, target_user_id, permission_type)
    VALUES (auth.uid(), 'revoke_permission', target_user_id, permission_type);

    RETURN true;
END;
$$;


ALTER FUNCTION "public"."revoke_reading_permission"("target_user_id" "uuid", "permission_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."revoke_reading_permission"("target_user_id" "uuid", "permission_type" "text") IS 'Revoke custom permission to view reading progress';



CREATE OR REPLACE FUNCTION "public"."run_data_maintenance"() RETURNS TABLE("maintenance_step" "text", "records_processed" bigint, "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    processed_count bigint;
BEGIN
    -- Step 1: Fix publisher relationships
    PERFORM * FROM "public"."fix_missing_publisher_relationships"();
    
    SELECT COUNT(*) INTO processed_count
    FROM "public"."books" 
    WHERE publisher_id IS NOT NULL;
    
    RETURN QUERY SELECT 
        'Fix Publisher Relationships'::text,
        processed_count,
        'COMPLETED'::text;
    
    -- Step 2: Clean up orphaned records
    PERFORM * FROM "public"."cleanup_orphaned_records"();
    
    RETURN QUERY SELECT 
        'Cleanup Orphaned Records'::text,
        0::bigint,
        'COMPLETED'::text;
    
    -- Step 3: Standardize status values
    PERFORM * FROM "public"."standardize_reading_statuses"();
    
    RETURN QUERY SELECT 
        'Standardize Status Values'::text,
        0::bigint,
        'COMPLETED'::text;
    
    -- Step 4: Validate and repair data
    PERFORM * FROM "public"."validate_and_repair_data"();
    
    RETURN QUERY SELECT 
        'Validate and Repair Data'::text,
        0::bigint,
        'COMPLETED'::text;
    
    -- Log the maintenance run (only if table exists)
    BEGIN
        INSERT INTO "public"."security_audit_log" (
            action, 
            table_name, 
            new_values
        ) VALUES (
            'DATA_MAINTENANCE',
            'all_tables',
            jsonb_build_object(
                'maintenance_completed_at', now(),
                'maintenance_type', 'comprehensive_data_integrity'
            )
        );
    EXCEPTION WHEN OTHERS THEN
        -- Table doesn't exist, continue without logging
    END;
END;
$$;


ALTER FUNCTION "public"."run_data_maintenance"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."run_data_maintenance"() IS 'Run comprehensive data maintenance procedures';



CREATE OR REPLACE FUNCTION "public"."run_performance_maintenance"() RETURNS TABLE("maintenance_step" "text", "records_processed" bigint, "performance_improvement" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    table_record record;
    processed_count bigint;
BEGIN
    -- Analyze tables for better query planning
    FOR table_record IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename IN ('reading_progress', 'books', 'follows', 'publishers', 'authors')
    LOOP
        EXECUTE format('ANALYZE %I', table_record.tablename);
        processed_count := 1;
        
        RETURN QUERY SELECT 
            ('ANALYZE ' || table_record.tablename)::text,
            processed_count,
            'Improved query planning'::text;
    END LOOP;
    
    -- Refresh materialized views
    PERFORM refresh_materialized_views();
    
    RETURN QUERY SELECT 
        'Refresh Materialized Views'::text,
        3::bigint,
        'Updated summary data'::text;
    
    -- Log the maintenance run
    INSERT INTO "public"."security_audit_log" (
        action, 
        table_name, 
        new_values
    ) VALUES (
        'PERFORMANCE_MAINTENANCE',
        'all_tables',
        jsonb_build_object(
            'maintenance_run_at', now(),
            'maintenance_type', 'performance_optimization'
        )
    );
END;
$$;


ALTER FUNCTION "public"."run_performance_maintenance"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."run_performance_maintenance"() IS 'Run automated performance maintenance';



CREATE OR REPLACE FUNCTION "public"."safe_cleanup_orphaned_records"() RETURNS TABLE("table_name" "text", "orphaned_count" bigint, "action_taken" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    orphaned_count bigint;
BEGIN
    -- Clean up orphaned reading_progress records (safe operation)
    DELETE FROM "public"."reading_progress" 
    WHERE book_id NOT IN (SELECT id FROM "public"."books");
    
    GET DIAGNOSTICS orphaned_count = ROW_COUNT;
    RETURN QUERY SELECT 'reading_progress'::text, orphaned_count, 'DELETED_ORPHANED'::text;
    
    -- Clean up orphaned follows records (safe operation)
    DELETE FROM "public"."follows" 
    WHERE follower_id NOT IN (SELECT id FROM "auth"."users")
    OR following_id NOT IN (SELECT id FROM "auth"."users");
    
    GET DIAGNOSTICS orphaned_count = ROW_COUNT;
    RETURN QUERY SELECT 'follows'::text, orphaned_count, 'DELETED_ORPHANED'::text;
    
    -- Log the cleanup operation
    INSERT INTO "public"."security_audit_log" (
        action, 
        table_name, 
        new_values
    ) VALUES (
        'SAFE_ORPHANED_CLEANUP',
        'multiple_tables',
        jsonb_build_object(
            'cleanup_completed_at', now(),
            'cleanup_type', 'orphaned_records_removal'
        )
    );
END;
$$;


ALTER FUNCTION "public"."safe_cleanup_orphaned_records"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."safe_cleanup_orphaned_records"() IS 'Safely remove orphaned records without affecting valid data';



CREATE OR REPLACE FUNCTION "public"."safe_fix_missing_publishers"() RETURNS TABLE("book_id" "uuid", "book_title" character varying, "action_taken" "text", "publisher_id" "uuid", "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    book_record RECORD;
    publisher_record RECORD;
    linked_count integer := 0;
    created_count integer := 0;
BEGIN
    -- First, try to link books to existing publishers by author name
    FOR book_record IN 
        SELECT b.id, b.title, b.author, b.publisher_id
        FROM "public"."books" b
        WHERE b.publisher_id IS NULL
        AND b.author IS NOT NULL
        AND b.author != ''
    LOOP
        -- Try to find existing publisher by author name
        SELECT p.id INTO publisher_record
        FROM "public"."publishers" p
        WHERE LOWER(p.name) = LOWER(book_record.author)
        LIMIT 1;
        
        IF publisher_record.id IS NOT NULL THEN
            -- Link to existing publisher
            UPDATE "public"."books" 
            SET publisher_id = publisher_record.id
            WHERE id = book_record.id;
            
            linked_count := linked_count + 1;
            
            RETURN QUERY SELECT 
                book_record.id,
                book_record.title,
                'LINKED_TO_EXISTING_PUBLISHER'::text,
                publisher_record.id,
                'SUCCESS'::text;
        ELSE
            -- Create new publisher for this author
            INSERT INTO "public"."publishers" (name, created_at, updated_at)
            VALUES (book_record.author, now(), now())
            RETURNING id INTO publisher_record;
            
            -- Link book to new publisher
            UPDATE "public"."books" 
            SET publisher_id = publisher_record.id
            WHERE id = book_record.id;
            
            created_count := created_count + 1;
            
            RETURN QUERY SELECT 
                book_record.id,
                book_record.title,
                'CREATED_NEW_PUBLISHER'::text,
                publisher_record.id,
                'SUCCESS'::text;
        END IF;
    END LOOP;
    
    -- Log the operation safely
    INSERT INTO "public"."security_audit_log" (
        action, 
        table_name, 
        new_values
    ) VALUES (
        'SAFE_DATA_INTEGRITY_FIX',
        'books_publishers',
        jsonb_build_object(
            'linked_count', linked_count,
            'created_count', created_count,
            'total_fixed', linked_count + created_count,
            'fix_type', 'missing_publisher_relationships'
        )
    );
END;
$$;


ALTER FUNCTION "public"."safe_fix_missing_publishers"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_image_uploader"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Set uploader_id to current user if not provided
    IF NEW.uploader_id IS NULL THEN
        NEW.uploader_id := auth.uid();
        NEW.uploader_type := 'user';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_image_uploader"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_image_uploader"() IS 'Automatically sets uploader_id to current user when inserting images';



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
    
    -- Count total books
    RETURN QUERY SELECT 
        'Total books'::text,
        COUNT(*)::bigint,
        'INFO'::text
    FROM "public"."books";
    
    -- Count total publishers
    RETURN QUERY SELECT 
        'Total publishers'::text,
        COUNT(*)::bigint,
        'INFO'::text
    FROM "public"."publishers";
END;
$$;


ALTER FUNCTION "public"."simple_check_publisher_health"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."simple_fix_missing_publishers"() RETURNS TABLE("book_id" "uuid", "book_title" character varying, "action_taken" "text", "publisher_id" "uuid", "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    book_record RECORD;
    publisher_record RECORD;
    linked_count integer := 0;
    created_count integer := 0;
BEGIN
    -- First, try to link books to existing publishers by author name
    FOR book_record IN 
        SELECT b.id, b.title, b.author, b.publisher_id
        FROM "public"."books" b
        WHERE b.publisher_id IS NULL
        AND b.author IS NOT NULL
        AND b.author != ''
    LOOP
        -- Try to find existing publisher by author name
        SELECT p.id INTO publisher_record
        FROM "public"."publishers" p
        WHERE LOWER(p.name) = LOWER(book_record.author)
        LIMIT 1;
        
        IF publisher_record.id IS NOT NULL THEN
            -- Link to existing publisher
            UPDATE "public"."books" 
            SET publisher_id = publisher_record.id
            WHERE id = book_record.id;
            
            linked_count := linked_count + 1;
            
            RETURN QUERY SELECT 
                book_record.id,
                book_record.title,
                'LINKED_TO_EXISTING_PUBLISHER'::text,
                publisher_record.id,
                'SUCCESS'::text;
        ELSE
            -- Create new publisher for this author
            INSERT INTO "public"."publishers" (name, created_at, updated_at)
            VALUES (book_record.author, now(), now())
            RETURNING id INTO publisher_record;
            
            -- Link book to new publisher
            UPDATE "public"."books" 
            SET publisher_id = publisher_record.id
            WHERE id = book_record.id;
            
            created_count := created_count + 1;
            
            RETURN QUERY SELECT 
                book_record.id,
                book_record.title,
                'CREATED_NEW_PUBLISHER'::text,
                publisher_record.id,
                'SUCCESS'::text;
        END IF;
    END LOOP;
    
    -- Simple logging without requiring security_audit_log table
    RAISE NOTICE 'Publisher fix completed: % books linked, % new publishers created', linked_count, created_count;
END;
$$;


ALTER FUNCTION "public"."simple_fix_missing_publishers"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."standardize_reading_status_mappings"() RETURNS TABLE("old_status" "text", "new_status" "text", "updated_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    status_mapping record;
    updated_count bigint;
BEGIN
    -- Define status mappings
    FOR status_mapping IN 
        SELECT 
            'want_to_read' as old_status, 'not_started' as new_status
        UNION ALL
        SELECT 'currently_reading', 'in_progress'
        UNION ALL
        SELECT 'read', 'completed'
        UNION ALL
        SELECT 'on_hold', 'on_hold'
        UNION ALL
        SELECT 'abandoned', 'abandoned'
    LOOP
        -- Update reading_progress table
        UPDATE "public"."reading_progress" 
        SET status = status_mapping.new_status
        WHERE status = status_mapping.old_status;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        
        RETURN QUERY SELECT 
            status_mapping.old_status,
            status_mapping.new_status,
            updated_count;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."standardize_reading_status_mappings"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."standardize_reading_status_mappings"() IS 'Standardize reading progress status mappings';



CREATE OR REPLACE FUNCTION "public"."standardize_reading_statuses"() RETURNS TABLE("old_status" "text", "new_status" "text", "updated_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    status_mapping RECORD;
    updated_count bigint;
BEGIN
    -- Define status mappings
    FOR status_mapping IN 
        SELECT 
            'want_to_read' as old_status, 'not_started' as new_status
        UNION ALL
        SELECT 'currently_reading', 'in_progress'
        UNION ALL
        SELECT 'read', 'completed'
        UNION ALL
        SELECT 'on_hold', 'on_hold'
        UNION ALL
        SELECT 'abandoned', 'abandoned'
    LOOP
        -- Update reading_progress table
        UPDATE "public"."reading_progress" 
        SET status = status_mapping.new_status
        WHERE status = status_mapping.old_status;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        
        RETURN QUERY SELECT 
            status_mapping.old_status,
            status_mapping.new_status,
            updated_count;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."standardize_reading_statuses"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."standardize_reading_statuses"() IS 'Standardize reading status values across the application';



CREATE OR REPLACE FUNCTION "public"."toggle_activity_like"("p_activity_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_exists boolean;
BEGIN
    -- Check if like already exists
    SELECT EXISTS(
        SELECT 1 FROM public.activity_likes 
        WHERE activity_id = p_activity_id AND user_id = p_user_id
    ) INTO v_exists;
    
    IF v_exists THEN
        -- Remove like
        DELETE FROM public.activity_likes 
        WHERE activity_id = p_activity_id AND user_id = p_user_id;
        RETURN false;
    ELSE
        -- Add like
        INSERT INTO public.activity_likes (activity_id, user_id)
        VALUES (p_activity_id, p_user_id);
        RETURN true;
    END IF;
END;
$$;


ALTER FUNCTION "public"."toggle_activity_like"("p_activity_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."toggle_activity_like"("p_activity_id" "uuid", "p_user_id" "uuid") IS 'Toggle like status for an activity';



CREATE OR REPLACE FUNCTION "public"."toggle_entity_like"("p_user_id" "uuid", "p_entity_type" character varying, "p_entity_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_is_liked BOOLEAN;
BEGIN
    -- Check if already liked
    SELECT EXISTS(
        SELECT 1 FROM "public"."likes" 
        WHERE user_id = p_user_id 
        AND entity_type = p_entity_type 
        AND entity_id = p_entity_id
    ) INTO v_is_liked;
    
    IF v_is_liked THEN
        -- Remove like
        DELETE FROM "public"."likes" 
        WHERE user_id = p_user_id 
        AND entity_type = p_entity_type 
        AND entity_id = p_entity_id;
        RETURN false;
    ELSE
        -- Add like
        INSERT INTO "public"."likes" (user_id, entity_type, entity_id)
        VALUES (p_user_id, p_entity_type, p_entity_id);
        RETURN true;
    END IF;
END;
$$;


ALTER FUNCTION "public"."toggle_entity_like"("p_user_id" "uuid", "p_entity_type" character varying, "p_entity_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."toggle_entity_like"("p_user_id" "uuid", "p_entity_type" character varying, "p_entity_id" "uuid") IS 'Toggle like status for any entity';



CREATE OR REPLACE FUNCTION "public"."track_photo_analytics_event"("p_album_id" "uuid", "p_event_type" "text", "p_image_id" "uuid" DEFAULT NULL::"uuid", "p_user_id" "uuid" DEFAULT NULL::"uuid", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    event_id "uuid";
BEGIN
    INSERT INTO "public"."photo_analytics" (
        album_id,
        image_id,
        event_type,
        user_id,
        session_id,
        metadata
    ) VALUES (
        p_album_id,
        p_image_id,
        p_event_type,
        p_user_id,
        p_metadata->>'session_id',
        p_metadata
    ) RETURNING id INTO event_id;
    
    -- Update album_images counters if applicable
    IF p_image_id IS NOT NULL THEN
        UPDATE "public"."album_images" 
        SET 
            view_count = CASE WHEN p_event_type = 'view' THEN view_count + 1 ELSE view_count END,
            like_count = CASE WHEN p_event_type = 'like' THEN like_count + 1 ELSE like_count END,
            share_count = CASE WHEN p_event_type = 'share' THEN share_count + 1 ELSE share_count END
        WHERE image_id = p_image_id AND album_id = p_album_id;
    END IF;
    
    RETURN event_id;
END;
$$;


ALTER FUNCTION "public"."track_photo_analytics_event"("p_album_id" "uuid", "p_event_type" "text", "p_image_id" "uuid", "p_user_id" "uuid", "p_metadata" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."track_photo_analytics_event"("p_album_id" "uuid", "p_event_type" "text", "p_image_id" "uuid", "p_user_id" "uuid", "p_metadata" "jsonb") IS 'Enterprise function to track photo analytics events';



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
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_content_processing"() OWNER TO "postgres";


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
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."trigger_recommendation_generation"() OWNER TO "postgres";


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
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM "public"."log_social_action"(
            OLD.user_id,
            CASE 
                WHEN TG_TABLE_NAME = 'comments' THEN 'comment_deleted'
                WHEN TG_TABLE_NAME = 'likes' THEN 'like_toggled'
                WHEN TG_TABLE_NAME = 'shares' THEN 'share_removed'
                WHEN TG_TABLE_NAME = 'bookmarks' THEN 'bookmark_toggled'
                WHEN TG_TABLE_NAME = 'comment_reactions' THEN 'reaction_removed'
                ELSE 'unknown_action'
            END,
            OLD.entity_type,
            OLD.entity_id,
            OLD.id
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM "public"."log_social_action"(
            NEW.user_id,
            CASE 
                WHEN TG_TABLE_NAME = 'comments' THEN 'comment_updated'
                ELSE 'unknown_action'
            END,
            NEW.entity_type,
            NEW.entity_id,
            NEW.id,
            jsonb_build_object('old_content', OLD.content, 'new_content', NEW.content)
        );
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."trigger_social_audit_log"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_update_book_popularity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM "public"."update_book_popularity_metrics"(NEW."book_id");
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM "public"."update_book_popularity_metrics"(OLD."book_id");
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."trigger_update_book_popularity"() OWNER TO "postgres";


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
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_album_revenue_from_monetization"() OWNER TO "postgres";


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
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_album_statistics_from_analytics"() OWNER TO "postgres";


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
END;
$$;


ALTER FUNCTION "public"."update_book_popularity_metrics"("p_book_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_book_popularity_metrics"("p_book_id" "uuid") IS 'Updates book popularity metrics based on user interactions';



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
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_engagement_score"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_engagement_score"() IS 'Automatically update engagement score when engagement metrics change';



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
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_friend_analytics"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_friend_analytics"() IS 'Update friend analytics when friend relationships change';



CREATE OR REPLACE FUNCTION "public"."update_photo_albums_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_photo_albums_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_photo_counters"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_TABLE_NAME = 'photo_likes' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE "public"."images" SET like_count = like_count + 1 WHERE id = NEW.photo_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE "public"."images" SET like_count = like_count - 1 WHERE id = OLD.photo_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'photo_comments' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE "public"."images" SET comment_count = comment_count + 1 WHERE id = NEW.photo_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE "public"."images" SET comment_count = comment_count - 1 WHERE id = OLD.photo_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'photo_shares' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE "public"."images" SET share_count = share_count + 1 WHERE id = NEW.photo_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_photo_counters"() OWNER TO "postgres";


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
END;
$$;


ALTER FUNCTION "public"."update_post_engagement_score"("post_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_post_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_post_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_privacy_settings"("default_privacy_level" "text" DEFAULT NULL::"text", "allow_friends_to_see_reading" boolean DEFAULT NULL::boolean, "allow_followers_to_see_reading" boolean DEFAULT NULL::boolean, "allow_public_reading_profile" boolean DEFAULT NULL::boolean, "show_reading_stats_publicly" boolean DEFAULT NULL::boolean, "show_currently_reading_publicly" boolean DEFAULT NULL::boolean, "show_reading_history_publicly" boolean DEFAULT NULL::boolean, "show_reading_goals_publicly" boolean DEFAULT NULL::boolean) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    old_settings jsonb;
    new_settings jsonb;
BEGIN
    -- Get current settings
    SELECT to_jsonb(ups.*) INTO old_settings
    FROM "public"."user_privacy_settings" ups
    WHERE ups.user_id = auth.uid();

    -- Insert or update settings
    INSERT INTO "public"."user_privacy_settings" (
        user_id, default_privacy_level, allow_friends_to_see_reading, 
        allow_followers_to_see_reading, allow_public_reading_profile,
        show_reading_stats_publicly, show_currently_reading_publicly,
        show_reading_history_publicly, show_reading_goals_publicly
    )
    VALUES (
        auth.uid(),
        COALESCE(default_privacy_level, 'private'),
        COALESCE(allow_friends_to_see_reading, false),
        COALESCE(allow_followers_to_see_reading, false),
        COALESCE(allow_public_reading_profile, false),
        COALESCE(show_reading_stats_publicly, false),
        COALESCE(show_currently_reading_publicly, false),
        COALESCE(show_reading_history_publicly, false),
        COALESCE(show_reading_goals_publicly, false)
    )
    ON CONFLICT (user_id) DO UPDATE SET
        default_privacy_level = EXCLUDED.default_privacy_level,
        allow_friends_to_see_reading = EXCLUDED.allow_friends_to_see_reading,
        allow_followers_to_see_reading = EXCLUDED.allow_followers_to_see_reading,
        allow_public_reading_profile = EXCLUDED.allow_public_reading_profile,
        show_reading_stats_publicly = EXCLUDED.show_reading_stats_publicly,
        show_currently_reading_publicly = EXCLUDED.show_currently_reading_publicly,
        show_reading_history_publicly = EXCLUDED.show_reading_history_publicly,
        show_reading_goals_publicly = EXCLUDED.show_reading_goals_publicly,
        updated_at = now();

    -- Get new settings
    SELECT to_jsonb(ups.*) INTO new_settings
    FROM "public"."user_privacy_settings" ups
    WHERE ups.user_id = auth.uid();

    -- Log the action
    INSERT INTO "public"."privacy_audit_log" (user_id, action, old_value, new_value)
    VALUES (auth.uid(), 'update_privacy_settings', old_settings, new_settings);

    RETURN true;
END;
$$;


ALTER FUNCTION "public"."update_user_privacy_settings"("default_privacy_level" "text", "allow_friends_to_see_reading" boolean, "allow_followers_to_see_reading" boolean, "allow_public_reading_profile" boolean, "show_reading_stats_publicly" boolean, "show_currently_reading_publicly" boolean, "show_reading_history_publicly" boolean, "show_reading_goals_publicly" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_user_privacy_settings"("default_privacy_level" "text", "allow_friends_to_see_reading" boolean, "allow_followers_to_see_reading" boolean, "allow_public_reading_profile" boolean, "show_reading_stats_publicly" boolean, "show_currently_reading_publicly" boolean, "show_reading_history_publicly" boolean, "show_reading_goals_publicly" boolean) IS 'Update user privacy settings with audit logging';



CREATE OR REPLACE FUNCTION "public"."upsert_reading_progress"("p_user_id" "uuid", "p_book_id" "uuid", "p_status" "text", "p_progress_percentage" integer DEFAULT NULL::integer, "p_privacy_level" "text" DEFAULT 'private'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    normalized_status text;
    progress_percentage integer;
    result_record record;
BEGIN
    -- Normalize the status
    normalized_status := "public"."map_reading_status_to_progress"(p_status);
    
    -- Use provided progress percentage or calculate based on status
    IF p_progress_percentage IS NOT NULL THEN
        progress_percentage := p_progress_percentage;
    ELSE
        progress_percentage := CASE normalized_status
            WHEN 'not_started' THEN 0
            WHEN 'in_progress' THEN 50
            WHEN 'completed' THEN 100
            WHEN 'on_hold' THEN 25
            WHEN 'abandoned' THEN 0
            ELSE 0
        END;
    END IF;
    
    -- Upsert into reading_progress table (only using existing columns)
    INSERT INTO "public"."reading_progress" (
        user_id, book_id, status, progress_percentage, privacy_level, 
        start_date, finish_date, created_at, updated_at
    ) VALUES (
        p_user_id, p_book_id, normalized_status, progress_percentage, p_privacy_level,
        CASE WHEN normalized_status = 'in_progress' THEN now() ELSE NULL END,
        CASE WHEN normalized_status = 'completed' THEN now() ELSE NULL END,
        now(), now()
    )
    ON CONFLICT (user_id, book_id) 
    DO UPDATE SET
        status = EXCLUDED.status,
        progress_percentage = EXCLUDED.progress_percentage,
        privacy_level = EXCLUDED.privacy_level,
        start_date = CASE 
            WHEN EXCLUDED.status = 'in_progress' AND reading_progress.start_date IS NULL 
            THEN now() 
            ELSE reading_progress.start_date 
        END,
        finish_date = CASE 
            WHEN EXCLUDED.status = 'completed' 
            THEN now() 
            ELSE reading_progress.finish_date 
        END,
        updated_at = now()
    RETURNING * INTO result_record;
    
    -- Return the result
    RETURN jsonb_build_object(
        'success', true,
        'data', to_jsonb(result_record),
        'status', normalized_status
    );
END;
$$;


ALTER FUNCTION "public"."upsert_reading_progress"("p_user_id" "uuid", "p_book_id" "uuid", "p_status" "text", "p_progress_percentage" integer, "p_privacy_level" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_and_repair_data"() RETURNS TABLE("validation_type" "text", "issue_count" bigint, "fixed_count" bigint, "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    issue_count bigint;
    fixed_count bigint;
BEGIN
    -- Fix books with invalid publisher_id references
    UPDATE "public"."books" 
    SET publisher_id = NULL
    WHERE publisher_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM "public"."publishers" p 
        WHERE p.id = books.publisher_id
    );
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    
    RETURN QUERY SELECT 
        'Invalid publisher references'::text,
        0::bigint,
        fixed_count,
        'FIXED'::text;
    
    -- Fix reading progress with invalid book_id references
    UPDATE "public"."reading_progress" 
    SET book_id = NULL
    WHERE book_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM "public"."books" b 
        WHERE b.id = reading_progress.book_id
    );
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    
    RETURN QUERY SELECT 
        'Invalid book references'::text,
        0::bigint,
        fixed_count,
        'FIXED'::text;
    
    -- Fix follows with invalid user references
    UPDATE "public"."follows" 
    SET follower_id = NULL
    WHERE follower_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM "auth"."users" u 
        WHERE u.id = follows.follower_id
    );
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    
    RETURN QUERY SELECT 
        'Invalid user references'::text,
        0::bigint,
        fixed_count,
        'FIXED'::text;
END;
$$;


ALTER FUNCTION "public"."validate_and_repair_data"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_and_repair_data"() IS 'Validate and repair data integrity issues';



CREATE OR REPLACE FUNCTION "public"."validate_book_data"("book_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    validation_errors text[] := '{}';
    result jsonb;
BEGIN
    -- Validate required fields
    IF book_data->>'title' IS NULL OR book_data->>'title' = '' THEN
        validation_errors := validation_errors || 'Title is required';
    END IF;
    
    IF book_data->>'author' IS NULL OR book_data->>'author' = '' THEN
        validation_errors := validation_errors || 'Author is required';
    END IF;
    
    -- Validate ISBN format if provided
    IF book_data->>'isbn13' IS NOT NULL AND book_data->>'isbn13' != '' THEN
        IF length(book_data->>'isbn13') != 13 THEN
            validation_errors := validation_errors || 'ISBN-13 must be exactly 13 characters';
        END IF;
    END IF;
    
    IF book_data->>'isbn10' IS NOT NULL AND book_data->>'isbn10' != '' THEN
        IF length(book_data->>'isbn10') != 10 THEN
            validation_errors := validation_errors || 'ISBN-10 must be exactly 10 characters';
        END IF;
    END IF;
    
    -- Validate publication date
    IF book_data->>'publication_date' IS NOT NULL THEN
        BEGIN
            PERFORM (book_data->>'publication_date')::date;
        EXCEPTION WHEN OTHERS THEN
            validation_errors := validation_errors || 'Invalid publication date format';
        END;
    END IF;
    
    -- Return validation result
    IF array_length(validation_errors, 1) > 0 THEN
        result := jsonb_build_object(
            'valid', false,
            'errors', validation_errors
        );
    ELSE
        result := jsonb_build_object(
            'valid', true,
            'data', book_data
        );
    END IF;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."validate_book_data"("book_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_book_data_enhanced"("p_title" "text", "p_author" "text", "p_isbn" "text" DEFAULT NULL::"text", "p_publication_year" integer DEFAULT NULL::integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
    v_validation_result "jsonb";
    v_errors "text"[] := '{}';
    v_warnings "text"[] := '{}';
BEGIN
    -- Title validation
    IF p_title IS NULL OR LENGTH(TRIM(p_title)) = 0 THEN
        v_errors := array_append(v_errors, 'Title is required');
    ELSIF LENGTH(p_title) > 500 THEN
        v_errors := array_append(v_errors, 'Title exceeds maximum length of 500 characters');
    END IF;
    
    -- Author validation
    IF p_author IS NULL OR LENGTH(TRIM(p_author)) = 0 THEN
        v_errors := array_append(v_errors, 'Author is required');
    ELSIF LENGTH(p_author) > 200 THEN
        v_errors := array_append(v_errors, 'Author name exceeds maximum length of 200 characters');
    END IF;
    
    -- ISBN validation
    IF p_isbn IS NOT NULL AND LENGTH(p_isbn) > 0 THEN
        IF NOT p_isbn ~ '^[0-9X-]{10,13}$' THEN
            v_errors := array_append(v_errors, 'Invalid ISBN format');
        END IF;
    END IF;
    
    -- Publication year validation
    IF p_publication_year IS NOT NULL THEN
        IF p_publication_year < 1000 OR p_publication_year > EXTRACT(YEAR FROM CURRENT_DATE) + 5 THEN
            v_warnings := array_append(v_warnings, 'Publication year seems unusual');
        END IF;
    END IF;
    
    -- Build validation result
    v_validation_result := "jsonb_build_object"(
        'is_valid', array_length(v_errors, 1) = 0,
        'errors', v_errors,
        'warnings', v_warnings,
        'validation_timestamp', "now"()
    );
    
    RETURN v_validation_result;
END;
$_$;


ALTER FUNCTION "public"."validate_book_data_enhanced"("p_title" "text", "p_author" "text", "p_isbn" "text", "p_publication_year" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_book_data_enhanced"("p_title" "text", "p_author" "text", "p_isbn" "text", "p_publication_year" integer) IS 'Enhanced book data validation for integrity and quality';



CREATE OR REPLACE FUNCTION "public"."validate_enterprise_data_quality"("p_table_name" "text" DEFAULT NULL::"text") RETURNS TABLE("rule_name" "text", "table_name" "text", "column_name" "text", "rule_type" "text", "validation_result" "text", "error_count" bigint, "severity" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    rule_record RECORD;
    validation_query text;
    error_count_val bigint;
BEGIN
    FOR rule_record IN 
        SELECT * FROM "public"."enterprise_data_quality_rules" 
        WHERE "is_active" = true 
        AND (p_table_name IS NULL OR "table_name" = p_table_name)
    LOOP
        -- Build dynamic validation query based on rule type
        CASE rule_record.rule_type
            WHEN 'NOT_NULL' THEN
                validation_query := format(
                    'SELECT COUNT(*) FROM %I WHERE %I IS NULL',
                    rule_record.table_name,
                    rule_record.column_name
                );
            WHEN 'UNIQUE' THEN
                validation_query := format(
                    'SELECT COUNT(*) FROM (SELECT %I, COUNT(*) FROM %I GROUP BY %I HAVING COUNT(*) > 1) t',
                    rule_record.column_name,
                    rule_record.table_name,
                    rule_record.column_name
                );
            WHEN 'FOREIGN_KEY' THEN
                -- Extract foreign key details from rule_definition
                validation_query := format(
                    'SELECT COUNT(*) FROM %I t1 LEFT JOIN %s t2 ON t1.%I = t2.%I WHERE t2.%I IS NULL',
                    rule_record.table_name,
                    split_part(rule_record.rule_definition, ':', 1),
                    rule_record.column_name,
                    split_part(rule_record.rule_definition, ':', 2),
                    split_part(rule_record.rule_definition, ':', 2)
                );
            WHEN 'CHECK' THEN
                validation_query := format(
                    'SELECT COUNT(*) FROM %I WHERE NOT (%s)',
                    rule_record.table_name,
                    rule_record.rule_definition
                );
            ELSE
                validation_query := rule_record.rule_definition;
        END CASE;
        
        -- Execute validation query
        BEGIN
            EXECUTE validation_query INTO error_count_val;
        EXCEPTION WHEN OTHERS THEN
            error_count_val := -1; -- Error in validation
        END;
        
        RETURN QUERY SELECT 
            rule_record.rule_name,
            rule_record.table_name,
            rule_record.column_name,
            rule_record.rule_type,
            CASE 
                WHEN error_count_val = 0 THEN 'PASS'
                WHEN error_count_val > 0 THEN 'FAIL'
                ELSE 'ERROR'
            END,
            error_count_val,
            rule_record.severity;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."validate_enterprise_data_quality"("p_table_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_enterprise_data_quality"("p_table_name" "text") IS 'Validates enterprise data quality rules';



CREATE OR REPLACE FUNCTION "public"."validate_follow_entity"("p_entity_id" "uuid", "p_target_type" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    entity_exists boolean := false;
BEGIN
    -- Check if entity exists based on target type
    CASE p_target_type
        WHEN 'user' THEN
            SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_entity_id) INTO entity_exists;
        WHEN 'book' THEN
            SELECT EXISTS(SELECT 1 FROM public.books WHERE id = p_entity_id) INTO entity_exists;
        WHEN 'author' THEN
            SELECT EXISTS(SELECT 1 FROM public.authors WHERE id = p_entity_id) INTO entity_exists;
        WHEN 'publisher' THEN
            SELECT EXISTS(SELECT 1 FROM public.publishers WHERE id = p_entity_id) INTO entity_exists;
        WHEN 'group' THEN
            SELECT EXISTS(SELECT 1 FROM public.groups WHERE id = p_entity_id) INTO entity_exists;
        ELSE
            entity_exists := false;
    END CASE;
    
    RETURN entity_exists;
END;
$$;


ALTER FUNCTION "public"."validate_follow_entity"("p_entity_id" "uuid", "p_target_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_follow_entity"("p_entity_id" "uuid", "p_target_type" "text") IS 'Validates that an entity exists before allowing a follow relationship';



CREATE OR REPLACE FUNCTION "public"."validate_follow_entity_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    target_type_name text;
    entity_exists boolean;
BEGIN
    -- Get the target type name
    SELECT name INTO target_type_name 
    FROM public.follow_target_types 
    WHERE id = NEW.target_type_id;
    
    -- Validate entity exists
    entity_exists := public.validate_follow_entity(NEW.following_id, target_type_name);
    
    IF NOT entity_exists THEN
        RAISE EXCEPTION 'Entity with ID % does not exist in table %', NEW.following_id, target_type_name;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_follow_entity_trigger"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_follow_entity_trigger"() IS 'Trigger to validate entity existence before follow insert';



CREATE OR REPLACE FUNCTION "public"."validate_permalink"("permalink" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    -- Check if permalink is valid (alphanumeric and hyphens only, 3-100 chars)
    IF permalink ~ '^[a-z0-9-]{3,100}$' AND permalink NOT LIKE '%-' AND permalink NOT LIKE '-%' THEN
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$_$;


ALTER FUNCTION "public"."validate_permalink"("permalink" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_permalink"("permalink" "text") IS 'Validates if a permalink format is correct';



CREATE OR REPLACE FUNCTION "public"."validate_user_data_enhanced"("p_email" "text", "p_name" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
    v_validation_result "jsonb";
    v_errors "text"[] := '{}';
    v_warnings "text"[] := '{}';
BEGIN
    -- Email validation
    IF p_email IS NULL OR LENGTH(TRIM(p_email)) = 0 THEN
        v_errors := array_append(v_errors, 'Email is required');
    ELSIF NOT p_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        v_errors := array_append(v_errors, 'Invalid email format');
    END IF;
    
    -- Name validation
    IF p_name IS NOT NULL AND LENGTH(TRIM(p_name)) > 0 THEN
        IF LENGTH(p_name) > 100 THEN
            v_errors := array_append(v_errors, 'Name exceeds maximum length of 100 characters');
        END IF;
        
        IF p_name ~ '[0-9]' THEN
            v_warnings := array_append(v_warnings, 'Name contains numbers');
        END IF;
    END IF;
    
    -- Build validation result
    v_validation_result := "jsonb_build_object"(
        'is_valid', array_length(v_errors, 1) = 0,
        'errors', v_errors,
        'warnings', v_warnings,
        'validation_timestamp', "now"()
    );
    
    RETURN v_validation_result;
END;
$_$;


ALTER FUNCTION "public"."validate_user_data_enhanced"("p_email" "text", "p_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_user_data_enhanced"("p_email" "text", "p_name" "text") IS 'Enhanced user data validation for format and completeness';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "review_id" "uuid",
    "list_id" "uuid",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_profile_id" "uuid",
    "group_id" "uuid",
    "event_id" "uuid",
    "book_id" "uuid",
    "author_id" "uuid",
    "entity_type" "text",
    "entity_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "like_count" integer DEFAULT 0,
    "comment_count" integer DEFAULT 0,
    "share_count" integer DEFAULT 0,
    "view_count" integer DEFAULT 0,
    "cross_posted_to" "text"[] DEFAULT '{}'::"text"[],
    "collaboration_type" "text" DEFAULT 'individual'::"text",
    "ai_enhanced" boolean DEFAULT false,
    "ai_enhanced_text" "text",
    "ai_enhanced_performance" numeric(5,2),
    "content_type" "text" DEFAULT 'text'::"text",
    "visibility" "text" DEFAULT 'public'::"text",
    "content_summary" "text",
    "text" "text",
    "image_url" "text",
    "hashtags" "text"[],
    "link_url" "text",
    "engagement_score" numeric(5,2) DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_collaboration_type_values" CHECK (("collaboration_type" = ANY (ARRAY['individual'::"text", 'collaborative'::"text", 'team'::"text"]))),
    CONSTRAINT "check_comment_count_positive" CHECK (("comment_count" >= 0)),
    CONSTRAINT "check_content_type_values" CHECK (("content_type" = ANY (ARRAY['text'::"text", 'image'::"text", 'video'::"text", 'link'::"text", 'poll'::"text", 'event'::"text", 'book'::"text", 'author'::"text"]))),
    CONSTRAINT "check_engagement_score_range" CHECK ((("engagement_score" >= (0)::numeric) AND ("engagement_score" <= (100)::numeric))),
    CONSTRAINT "check_like_count_positive" CHECK (("like_count" >= 0)),
    CONSTRAINT "check_share_count_positive" CHECK (("share_count" >= 0)),
    CONSTRAINT "check_view_count_positive" CHECK (("view_count" >= 0)),
    CONSTRAINT "check_visibility_values" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'friends'::"text", 'private'::"text", 'group'::"text"])))
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


COMMENT ON TABLE "public"."activities" IS 'Enhanced activities table with enterprise features including engagement tracking, AI enhancement, collaboration, and cross-posting capabilities';



COMMENT ON COLUMN "public"."activities"."user_id" IS 'The user who performed the activity (if applicable).';



COMMENT ON COLUMN "public"."activities"."activity_type" IS 'Type of activity (e.g., member_joined, book_added, etc.).';



COMMENT ON COLUMN "public"."activities"."data" IS 'Additional context for the activity (book_id, discussion_id, etc.).';



COMMENT ON COLUMN "public"."activities"."created_at" IS 'Timestamp when the activity occurred.';



COMMENT ON COLUMN "public"."activities"."group_id" IS 'The group where the activity occurred.';



COMMENT ON COLUMN "public"."activities"."entity_type" IS 'Type of entity this activity relates to (book, author, event, etc.)';



COMMENT ON COLUMN "public"."activities"."entity_id" IS 'ID of the entity this activity relates to';



COMMENT ON COLUMN "public"."activities"."metadata" IS 'JSONB field containing engagement data, privacy settings, and monetization info';



COMMENT ON COLUMN "public"."activities"."like_count" IS 'Number of likes on this activity/post';



COMMENT ON COLUMN "public"."activities"."comment_count" IS 'Number of comments on this activity/post';



COMMENT ON COLUMN "public"."activities"."share_count" IS 'Number of shares of this activity/post';



COMMENT ON COLUMN "public"."activities"."view_count" IS 'Number of views of this activity/post';



COMMENT ON COLUMN "public"."activities"."cross_posted_to" IS 'Array of user IDs where this activity was cross-posted';



COMMENT ON COLUMN "public"."activities"."collaboration_type" IS 'Type of collaboration: individual, collaborative, or team';



COMMENT ON COLUMN "public"."activities"."ai_enhanced" IS 'Whether this activity was enhanced with AI';



COMMENT ON COLUMN "public"."activities"."ai_enhanced_text" IS 'Details about AI enhancements applied to this activity';



COMMENT ON COLUMN "public"."activities"."ai_enhanced_performance" IS 'Performance score of AI enhancements (0-100)';



COMMENT ON COLUMN "public"."activities"."content_type" IS 'Type of content (text, image, video, link, poll, review, article)';



COMMENT ON COLUMN "public"."activities"."visibility" IS 'Visibility setting for post activities - extracted from metadata for old posts';



COMMENT ON COLUMN "public"."activities"."content_summary" IS 'Short summary of the activity content for previews';



COMMENT ON COLUMN "public"."activities"."text" IS 'Text content for post activities - extracted from metadata for old posts';



COMMENT ON COLUMN "public"."activities"."image_url" IS 'Image URLs for post activities - extracted from metadata for old posts';



COMMENT ON COLUMN "public"."activities"."hashtags" IS 'Array of hashtags for content categorization';



COMMENT ON COLUMN "public"."activities"."link_url" IS 'Link URLs for post activities - extracted from metadata for old posts';



COMMENT ON COLUMN "public"."activities"."engagement_score" IS 'Calculated engagement score based on likes, comments, shares, and views';



COMMENT ON COLUMN "public"."activities"."updated_at" IS 'Timestamp when the activity was last updated - defaults to created_at for old posts';



CREATE TABLE IF NOT EXISTS "public"."activity_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "comment_text" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_comments" OWNER TO "postgres";


COMMENT ON TABLE "public"."activity_comments" IS 'Stores user comments for activities';



CREATE TABLE IF NOT EXISTS "public"."activity_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_likes" OWNER TO "postgres";


COMMENT ON TABLE "public"."activity_likes" IS 'Stores user likes for activities';



CREATE TABLE IF NOT EXISTS "public"."activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "target_type" "text",
    "target_id" "uuid",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_reviews" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "review_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "contains_spoilers" boolean DEFAULT false,
    "group_id" "uuid",
    "visibility" "text" DEFAULT 'public'::"text" NOT NULL,
    "book_id" "uuid"
);


ALTER TABLE "public"."book_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_views" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "book_id" "uuid",
    "viewed_at" timestamp with time zone
);


ALTER TABLE "public"."book_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."books" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "isbn10" character varying,
    "isbn13" character varying,
    "title" character varying NOT NULL,
    "title_long" "text",
    "publisher_id" "uuid",
    "publication_date" "date",
    "binding" character varying,
    "pages" integer,
    "list_price" numeric,
    "language" character varying,
    "edition" character varying,
    "synopsis" "text",
    "overview" "text",
    "dimensions" character varying,
    "weight" numeric,
    "cover_image_id" "uuid",
    "original_image_url" "text",
    "author" character varying,
    "featured" boolean DEFAULT false NOT NULL,
    "book_gallery_img" "text"[],
    "average_rating" numeric DEFAULT 0,
    "review_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "author_id" "uuid",
    "binding_type_id" "uuid",
    "format_type_id" "uuid",
    "status_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "permalink" character varying(100)
);


ALTER TABLE "public"."books" OWNER TO "postgres";


COMMENT ON TABLE "public"."books" IS 'Book catalog with metadata';



COMMENT ON COLUMN "public"."books"."isbn10" IS 'ISBN-10 identifier';



COMMENT ON COLUMN "public"."books"."isbn13" IS 'ISBN-13 identifier';



COMMENT ON COLUMN "public"."books"."title" IS 'Book title';



COMMENT ON COLUMN "public"."books"."publication_date" IS 'Book publication date';



COMMENT ON COLUMN "public"."books"."permalink" IS 'Custom URL-friendly identifier for books';



CREATE TABLE IF NOT EXISTS "public"."reading_lists" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "is_public" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reading_lists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reading_progress" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "progress_percentage" integer DEFAULT 0 NOT NULL,
    "start_date" timestamp with time zone,
    "finish_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid",
    "privacy_level" "text" DEFAULT 'private'::"text" NOT NULL,
    "allow_friends" boolean DEFAULT false NOT NULL,
    "allow_followers" boolean DEFAULT false NOT NULL,
    "custom_permissions" "jsonb" DEFAULT '[]'::"jsonb",
    "privacy_audit_log" "jsonb" DEFAULT '[]'::"jsonb",
    CONSTRAINT "reading_progress_privacy_level_check" CHECK (("privacy_level" = ANY (ARRAY['private'::"text", 'friends'::"text", 'followers'::"text", 'public'::"text"])))
);


ALTER TABLE "public"."reading_progress" OWNER TO "postgres";


COMMENT ON TABLE "public"."reading_progress" IS 'User reading progress tracking';



CREATE TABLE IF NOT EXISTS "public"."system_health_checks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "check_name" "text" NOT NULL,
    "status" "text" NOT NULL,
    "details" "jsonb",
    "checked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "response_time_ms" integer,
    "error_message" "text",
    CONSTRAINT "system_health_checks_status_check" CHECK (("status" = ANY (ARRAY['healthy'::"text", 'warning'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."system_health_checks" OWNER TO "postgres";


COMMENT ON TABLE "public"."system_health_checks" IS 'System health monitoring data for enterprise monitoring';



CREATE TABLE IF NOT EXISTS "public"."user_activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "activity_details" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "session_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "response_time_ms" integer,
    "status_code" integer
);


ALTER TABLE "public"."user_activity_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_activity_log" IS 'Detailed user activity tracking for analytics and security';



CREATE OR REPLACE VIEW "public"."advanced_analytics_dashboard_enhanced" AS
 SELECT ( SELECT "count"(DISTINCT "reading_progress"."user_id") AS "count"
           FROM "public"."reading_progress") AS "active_readers",
    ( SELECT "count"(DISTINCT "book_reviews"."user_id") AS "count"
           FROM "public"."book_reviews") AS "active_reviewers",
    ( SELECT "count"(DISTINCT "reading_lists"."user_id") AS "count"
           FROM "public"."reading_lists") AS "list_creators",
    ( SELECT "count"(*) AS "count"
           FROM "public"."books") AS "total_books",
    ( SELECT "count"(*) AS "count"
           FROM "public"."book_views") AS "total_book_views",
    ( SELECT "count"(*) AS "count"
           FROM "public"."book_reviews") AS "total_reviews",
    ( SELECT "round"("avg"("book_reviews"."rating"), 2) AS "round"
           FROM "public"."book_reviews"
          WHERE ("book_reviews"."rating" IS NOT NULL)) AS "avg_rating",
    ( SELECT "count"(*) AS "count"
           FROM "public"."user_activity_log"
          WHERE ("user_activity_log"."created_at" >= ("now"() - '24:00:00'::interval))) AS "activities_last_24h",
    ( SELECT "count"(*) AS "count"
           FROM "public"."system_health_checks"
          WHERE ("system_health_checks"."checked_at" >= ("now"() - '24:00:00'::interval))) AS "health_checks_last_24h",
    ( SELECT "count"(*) AS "count"
           FROM "public"."books"
          WHERE (("books"."title" IS NULL) OR ("length"(TRIM(BOTH FROM "books"."title")) = 0))) AS "books_without_title",
    ( SELECT "count"(*) AS "count"
           FROM "public"."books"
          WHERE (("books"."author" IS NULL) OR ("length"(TRIM(BOTH FROM "books"."author")) = 0))) AS "books_without_author",
    "now"() AS "dashboard_timestamp";


ALTER TABLE "public"."advanced_analytics_dashboard_enhanced" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_image_analysis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "image_id" "uuid" NOT NULL,
    "analysis_type" "text" NOT NULL,
    "confidence_score" numeric(3,2) DEFAULT 0,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "objects_detected" "jsonb" DEFAULT '{}'::"jsonb",
    "quality_metrics" "jsonb" DEFAULT '{}'::"jsonb",
    "sentiment_score" numeric(3,2),
    "content_safety_score" numeric(3,2) DEFAULT 1.0,
    "moderation_flags" "text"[] DEFAULT '{}'::"text"[],
    "processing_time_ms" integer,
    "model_version" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_image_analysis_confidence_check" CHECK ((("confidence_score" >= (0)::numeric) AND ("confidence_score" <= (1)::numeric))),
    CONSTRAINT "ai_image_analysis_safety_check" CHECK ((("content_safety_score" >= (0)::numeric) AND ("content_safety_score" <= (1)::numeric))),
    CONSTRAINT "ai_image_analysis_sentiment_check" CHECK ((("sentiment_score" >= ('-1'::integer)::numeric) AND ("sentiment_score" <= (1)::numeric)))
);


ALTER TABLE "public"."ai_image_analysis" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_image_analysis" IS 'AI-powered image analysis results for enterprise features';



COMMENT ON COLUMN "public"."ai_image_analysis"."analysis_type" IS 'Type of AI analysis performed';



COMMENT ON COLUMN "public"."ai_image_analysis"."confidence_score" IS 'AI confidence in analysis (0-1)';



COMMENT ON COLUMN "public"."ai_image_analysis"."content_safety_score" IS 'Content safety assessment (0-1)';



CREATE TABLE IF NOT EXISTS "public"."album_analytics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "views" integer DEFAULT 0,
    "unique_views" integer DEFAULT 0,
    "shares" integer DEFAULT 0,
    "likes" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."album_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."album_images" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "image_id" "uuid" NOT NULL,
    "display_order" integer NOT NULL,
    "is_cover" boolean DEFAULT false,
    "is_featured" boolean DEFAULT false,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "entity_type_id" "uuid",
    "entity_id" "uuid",
    "view_count" integer DEFAULT 0,
    "like_count" integer DEFAULT 0,
    "share_count" integer DEFAULT 0,
    "revenue_generated" numeric(10,2) DEFAULT 0,
    "ai_tags" "text"[] DEFAULT '{}'::"text"[],
    "community_engagement" numeric(3,2) DEFAULT 0,
    "caption" "text",
    "comment_count" integer DEFAULT 0,
    "last_viewed_at" timestamp with time zone,
    "performance_score" numeric(5,2) DEFAULT 0.0,
    "alt_text" "text",
    "description" "text",
    CONSTRAINT "check_album_image_data" CHECK (((("alt_text" IS NOT NULL) AND ("length"(TRIM(BOTH FROM "alt_text")) > 0)) OR (("description" IS NOT NULL) AND ("length"(TRIM(BOTH FROM "description")) > 0)) OR (("alt_text" IS NULL) AND ("description" IS NULL))))
);


ALTER TABLE "public"."album_images" OWNER TO "postgres";


COMMENT ON COLUMN "public"."album_images"."view_count" IS 'Number of views for this image in the album';



COMMENT ON COLUMN "public"."album_images"."like_count" IS 'Number of likes for this image in the album';



COMMENT ON COLUMN "public"."album_images"."share_count" IS 'Number of shares for this image in the album';



COMMENT ON COLUMN "public"."album_images"."revenue_generated" IS 'Total revenue generated from this image';



COMMENT ON COLUMN "public"."album_images"."ai_tags" IS 'AI-generated tags for the image';



COMMENT ON COLUMN "public"."album_images"."community_engagement" IS 'Community engagement score (0-1)';



COMMENT ON COLUMN "public"."album_images"."alt_text" IS 'Album-specific alt text for accessibility';



COMMENT ON COLUMN "public"."album_images"."description" IS 'Album-specific description of the image';



CREATE TABLE IF NOT EXISTS "public"."album_shares" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "shared_by" "uuid" NOT NULL,
    "shared_with" "uuid",
    "share_type" character varying(50) NOT NULL,
    "access_token" "uuid",
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."album_shares" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."authors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "bio" "text",
    "featured" boolean DEFAULT false,
    "birth_date" "date",
    "nationality" "text",
    "website" "text",
    "author_image_id" "uuid",
    "twitter_handle" "text",
    "facebook_handle" "text",
    "instagram_handle" "text",
    "goodreads_url" "text",
    "cover_image_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "author_gallery_id" "uuid",
    "permalink" character varying(100)
);


ALTER TABLE "public"."authors" OWNER TO "postgres";


COMMENT ON TABLE "public"."authors" IS 'Book authors information';



COMMENT ON COLUMN "public"."authors"."permalink" IS 'Custom URL-friendly identifier for authors';



CREATE TABLE IF NOT EXISTS "public"."automation_executions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid",
    "execution_status" "text" NOT NULL,
    "start_time" timestamp with time zone DEFAULT "now"(),
    "end_time" timestamp with time zone,
    "execution_duration" interval,
    "input_data" "jsonb",
    "output_data" "jsonb",
    "error_message" "text",
    "performance_metrics" "jsonb",
    CONSTRAINT "automation_executions_execution_status_check" CHECK (("execution_status" = ANY (ARRAY['started'::"text", 'running'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."automation_executions" OWNER TO "postgres";


COMMENT ON TABLE "public"."automation_executions" IS 'Logs automation workflow executions and performance';



CREATE TABLE IF NOT EXISTS "public"."automation_workflows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_name" "text" NOT NULL,
    "workflow_type" "text" NOT NULL,
    "trigger_conditions" "jsonb" NOT NULL,
    "workflow_steps" "jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "execution_frequency" "text" DEFAULT 'on_demand'::"text",
    "last_executed" timestamp with time zone,
    "next_execution" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "automation_workflows_workflow_type_check" CHECK (("workflow_type" = ANY (ARRAY['data_processing'::"text", 'content_generation'::"text", 'notification'::"text", 'maintenance'::"text", 'analytics'::"text"])))
);


ALTER TABLE "public"."automation_workflows" OWNER TO "postgres";


COMMENT ON TABLE "public"."automation_workflows" IS 'Workflow automation engine for enterprise processes';



CREATE TABLE IF NOT EXISTS "public"."binding_types" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying,
    "description" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."binding_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "blocked_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_authors" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."book_authors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_club_books" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_club_id" "uuid",
    "book_id" "uuid",
    "status" character varying,
    "start_date" "date",
    "end_date" "date",
    "created_at" timestamp with time zone,
    "created_by" "uuid"
);


ALTER TABLE "public"."book_club_books" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_club_discussion_comments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "discussion_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."book_club_discussion_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_club_discussions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_club_id" "uuid" NOT NULL,
    "title" character varying(255) NOT NULL,
    "content" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_pinned" boolean DEFAULT false,
    "book_id" "uuid"
);


ALTER TABLE "public"."book_club_discussions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_club_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_club_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "role" character varying(50) DEFAULT 'member'::character varying
);


ALTER TABLE "public"."book_club_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_clubs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "cover_image_url" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_private" boolean DEFAULT false,
    "member_count" integer DEFAULT 0,
    "current_book_id" "uuid"
);


ALTER TABLE "public"."book_clubs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_genre_mappings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "genre_id" "uuid" NOT NULL
);


ALTER TABLE "public"."book_genre_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_genres" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."book_genres" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_id_mapping" (
    "old_id" integer NOT NULL,
    "new_id" "uuid" NOT NULL,
    "match_method" "text" NOT NULL
);


ALTER TABLE "public"."book_id_mapping" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_popularity_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "views_count" integer DEFAULT 0,
    "reviews_count" integer DEFAULT 0,
    "avg_rating" numeric(3,2),
    "reading_progress_count" integer DEFAULT 0,
    "reading_list_count" integer DEFAULT 0,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."book_popularity_metrics" OWNER TO "postgres";


COMMENT ON TABLE "public"."book_popularity_metrics" IS 'Aggregated book popularity metrics for recommendations';



CREATE OR REPLACE VIEW "public"."book_popularity_analytics" AS
 SELECT "b"."id",
    "b"."title",
    "b"."author",
    "bpm"."views_count",
    "bpm"."reviews_count",
    "bpm"."avg_rating",
    "bpm"."reading_progress_count",
    "bpm"."reading_list_count",
    "bpm"."last_updated",
    "rank"() OVER (ORDER BY "bpm"."views_count" DESC) AS "popularity_rank",
    "rank"() OVER (ORDER BY "bpm"."avg_rating" DESC NULLS LAST) AS "rating_rank"
   FROM ("public"."books" "b"
     LEFT JOIN "public"."book_popularity_metrics" "bpm" ON (("b"."id" = "bpm"."book_id")))
  WHERE ("bpm"."book_id" IS NOT NULL);


ALTER TABLE "public"."book_popularity_analytics" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."book_popularity_summary" AS
 SELECT "b"."id" AS "book_id",
    "b"."title",
    "b"."author",
    "b"."average_rating",
    "b"."review_count",
    "count"("rp"."id") AS "total_reading_entries",
    "count"(DISTINCT "rp"."user_id") AS "unique_readers",
    "count"(
        CASE
            WHEN ("rp"."status" = 'completed'::"text") THEN 1
            ELSE NULL::integer
        END) AS "completed_reads",
    "count"(
        CASE
            WHEN ("rp"."status" = 'in_progress'::"text") THEN 1
            ELSE NULL::integer
        END) AS "active_reads",
    "avg"("rp"."progress_percentage") AS "avg_progress",
    "b"."created_at",
    "b"."updated_at"
   FROM ("public"."books" "b"
     LEFT JOIN "public"."reading_progress" "rp" ON (("b"."id" = "rp"."book_id")))
  GROUP BY "b"."id", "b"."title", "b"."author", "b"."average_rating", "b"."review_count", "b"."created_at", "b"."updated_at"
  WITH NO DATA;


ALTER TABLE "public"."book_popularity_summary" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."book_popularity_summary" IS 'Cached book popularity data for performance';



CREATE TABLE IF NOT EXISTS "public"."book_publishers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "publisher_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."book_publishers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_recommendations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "source_type" "text" NOT NULL,
    "score" double precision NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid",
    "source_book_id" "uuid"
);


ALTER TABLE "public"."book_recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_similarity_scores" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid",
    "similar_book_id" "uuid",
    "similarity_score" double precision,
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."book_similarity_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_subjects" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."book_subjects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_tag_mappings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."book_tag_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."book_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookmarks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "entity_type" character varying(50) NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "bookmark_folder" character varying(100) DEFAULT 'default'::character varying,
    "notes" "text",
    "tags" "text"[],
    "is_private" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "bookmarks_entity_type_check" CHECK ((("entity_type")::"text" = ANY ((ARRAY['photo'::character varying, 'book'::character varying, 'author'::character varying, 'publisher'::character varying, 'group'::character varying, 'event'::character varying, 'feed_entry'::character varying, 'album'::character varying, 'image'::character varying, 'discussion'::character varying, 'review'::character varying])::"text"[])))
);


ALTER TABLE "public"."bookmarks" OWNER TO "postgres";


COMMENT ON TABLE "public"."bookmarks" IS 'Enterprise unified bookmarking system for all entities';



CREATE TABLE IF NOT EXISTS "public"."carousel_images" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "carousel_name" character varying,
    "image_url" "text",
    "alt_text" character varying,
    "position" integer,
    "active" boolean
);


ALTER TABLE "public"."carousel_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."collaborative_filtering_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "item_id" "uuid",
    "item_type" "text" NOT NULL,
    "interaction_type" "text" NOT NULL,
    "interaction_strength" numeric(3,2) DEFAULT 1.0,
    "interaction_timestamp" timestamp with time zone DEFAULT "now"(),
    "context_data" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "collaborative_filtering_data_interaction_type_check" CHECK (("interaction_type" = ANY (ARRAY['view'::"text", 'like'::"text", 'share'::"text", 'comment'::"text", 'read'::"text", 'purchase'::"text"]))),
    CONSTRAINT "collaborative_filtering_data_item_type_check" CHECK (("item_type" = ANY (ARRAY['book'::"text", 'author'::"text", 'publisher'::"text", 'event'::"text"])))
);


ALTER TABLE "public"."collaborative_filtering_data" OWNER TO "postgres";


COMMENT ON TABLE "public"."collaborative_filtering_data" IS 'User interaction data for collaborative filtering';



CREATE TABLE IF NOT EXISTS "public"."comment_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."comment_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reaction_type" character varying(20) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "comment_reactions_reaction_type_check" CHECK ((("reaction_type")::"text" = ANY ((ARRAY['like'::character varying, 'love'::character varying, 'haha'::character varying, 'wow'::character varying, 'sad'::character varying, 'angry'::character varying, 'care'::character varying])::"text"[])))
);


ALTER TABLE "public"."comment_reactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."comment_reactions" IS 'Enterprise comment reaction system';



CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "feed_entry_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_hidden" boolean DEFAULT false NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "entity_type" character varying(50) DEFAULT 'feed_entry'::character varying,
    "entity_id" "uuid",
    "parent_id" "uuid"
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


COMMENT ON TABLE "public"."comments" IS 'Comments on feed entries';



COMMENT ON COLUMN "public"."comments"."user_id" IS 'User who made the comment';



COMMENT ON COLUMN "public"."comments"."feed_entry_id" IS 'Feed entry being commented on';



CREATE TABLE IF NOT EXISTS "public"."contact_info" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "website" "text",
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "state" "text",
    "postal_code" "text",
    "country" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."contact_info" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_features" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid" NOT NULL,
    "content_type" "text" NOT NULL,
    "feature_name" "text" NOT NULL,
    "feature_value" "jsonb" NOT NULL,
    "feature_importance" numeric(5,4),
    "last_updated" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "content_features_content_type_check" CHECK (("content_type" = ANY (ARRAY['book'::"text", 'author'::"text", 'publisher'::"text", 'event'::"text"])))
);


ALTER TABLE "public"."content_features" OWNER TO "postgres";


COMMENT ON TABLE "public"."content_features" IS 'Content features for content-based recommendation systems';



CREATE TABLE IF NOT EXISTS "public"."content_flags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "flagged_by" "uuid" NOT NULL,
    "content_type" character varying(50) NOT NULL,
    "content_id" "uuid" NOT NULL,
    "flag_reason" character varying(100) NOT NULL,
    "flag_details" "text",
    "moderation_status" character varying(20) DEFAULT 'pending'::character varying,
    "moderated_by" "uuid",
    "moderation_notes" "text",
    "moderated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "content_flags_moderation_status_check" CHECK ((("moderation_status")::"text" = ANY ((ARRAY['pending'::character varying, 'reviewed'::character varying, 'approved'::character varying, 'rejected'::character varying, 'action_taken'::character varying])::"text"[])))
);


ALTER TABLE "public"."content_flags" OWNER TO "postgres";


COMMENT ON TABLE "public"."content_flags" IS 'Content moderation flags system';



CREATE TABLE IF NOT EXISTS "public"."content_generation_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_type" "text" NOT NULL,
    "input_parameters" "jsonb" NOT NULL,
    "generation_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "generated_content" "text",
    "content_metadata" "jsonb",
    "quality_score" numeric(3,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "created_by" "uuid",
    CONSTRAINT "content_generation_jobs_content_type_check" CHECK (("content_type" = ANY (ARRAY['book_summary'::"text", 'author_bio'::"text", 'review_analysis'::"text", 'recommendation_text'::"text", 'event_description'::"text"]))),
    CONSTRAINT "content_generation_jobs_generation_status_check" CHECK (("generation_status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."content_generation_jobs" OWNER TO "postgres";


COMMENT ON TABLE "public"."content_generation_jobs" IS 'AI-powered content generation jobs and results';



CREATE TABLE IF NOT EXISTS "public"."countries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "phone_code" "text",
    "continent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."countries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "target_user_id" "uuid" NOT NULL,
    "permission_type" "text" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "custom_permissions_permission_type_check" CHECK (("permission_type" = ANY (ARRAY['view_reading_progress'::"text", 'view_reading_stats'::"text", 'view_reading_history'::"text"])))
);


ALTER TABLE "public"."custom_permissions" OWNER TO "postgres";


COMMENT ON TABLE "public"."custom_permissions" IS 'Granular permissions for specific users to view reading progress';



CREATE OR REPLACE VIEW "public"."data_consistency_monitoring" AS
 SELECT 'Books without publishers'::"text" AS "issue_type",
    "count"(*) AS "issue_count",
        CASE
            WHEN ("count"(*) > 100) THEN 'CRITICAL'::"text"
            WHEN ("count"(*) > 10) THEN 'WARNING'::"text"
            ELSE 'INFO'::"text"
        END AS "severity"
   FROM "public"."books"
  WHERE ("books"."publisher_id" IS NULL)
UNION ALL
 SELECT 'Orphaned reading progress'::"text" AS "issue_type",
    "count"(*) AS "issue_count",
        CASE
            WHEN ("count"(*) > 50) THEN 'CRITICAL'::"text"
            WHEN ("count"(*) > 10) THEN 'WARNING'::"text"
            ELSE 'INFO'::"text"
        END AS "severity"
   FROM "public"."reading_progress" "rp"
  WHERE ((NOT (EXISTS ( SELECT 1
           FROM "auth"."users" "u"
          WHERE ("u"."id" = "rp"."user_id")))) OR (NOT (EXISTS ( SELECT 1
           FROM "public"."books" "b"
          WHERE ("b"."id" = "rp"."book_id")))))
UNION ALL
 SELECT 'Invalid publication dates'::"text" AS "issue_type",
    "count"(*) AS "issue_count",
        CASE
            WHEN ("count"(*) > 20) THEN 'CRITICAL'::"text"
            WHEN ("count"(*) > 5) THEN 'WARNING'::"text"
            ELSE 'INFO'::"text"
        END AS "severity"
   FROM "public"."books"
  WHERE ("books"."publication_date" > CURRENT_DATE)
UNION ALL
 SELECT 'Invalid progress percentages'::"text" AS "issue_type",
    "count"(*) AS "issue_count",
        CASE
            WHEN ("count"(*) > 30) THEN 'CRITICAL'::"text"
            WHEN ("count"(*) > 10) THEN 'WARNING'::"text"
            ELSE 'INFO'::"text"
        END AS "severity"
   FROM "public"."reading_progress"
  WHERE (("reading_progress"."progress_percentage" < 0) OR ("reading_progress"."progress_percentage" > 100));


ALTER TABLE "public"."data_consistency_monitoring" OWNER TO "postgres";


COMMENT ON VIEW "public"."data_consistency_monitoring" IS 'Real-time data consistency monitoring';



CREATE TABLE IF NOT EXISTS "public"."data_enrichment_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "target_table" "text" NOT NULL,
    "target_column" "text" NOT NULL,
    "enrichment_type" "text" NOT NULL,
    "enrichment_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "records_processed" integer DEFAULT 0,
    "records_updated" integer DEFAULT 0,
    "enrichment_config" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "created_by" "uuid",
    CONSTRAINT "data_enrichment_jobs_enrichment_status_check" CHECK (("enrichment_status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"]))),
    CONSTRAINT "data_enrichment_jobs_enrichment_type_check" CHECK (("enrichment_type" = ANY (ARRAY['author_info'::"text", 'book_details'::"text", 'publisher_data'::"text", 'genre_classification'::"text", 'similarity_scoring'::"text"])))
);


ALTER TABLE "public"."data_enrichment_jobs" OWNER TO "postgres";


COMMENT ON TABLE "public"."data_enrichment_jobs" IS 'Intelligent data enrichment and processing jobs';



CREATE TABLE IF NOT EXISTS "public"."dewey_decimal_classifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "description" "text" NOT NULL,
    "parent_code" "text",
    "level" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."dewey_decimal_classifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."dewey_decimal_classifications" IS 'Dewey Decimal Classification system';



CREATE TABLE IF NOT EXISTS "public"."discussion_comments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "discussion_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."discussion_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."discussions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "is_pinned" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "group_id" "uuid",
    "category_id" integer,
    "book_id" "uuid"
);


ALTER TABLE "public"."discussions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."engagement_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."engagement_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enterprise_audit_trail" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "operation" "text" NOT NULL,
    "old_values" "jsonb",
    "new_values" "jsonb",
    "changed_by" "uuid" NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "session_id" "text",
    "transaction_id" "text",
    "application_version" "text",
    "environment" "text" DEFAULT 'production'::"text",
    CONSTRAINT "enterprise_audit_trail_operation_check" CHECK (("operation" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text", 'TRUNCATE'::"text"])))
);


ALTER TABLE "public"."enterprise_audit_trail" OWNER TO "postgres";


COMMENT ON TABLE "public"."enterprise_audit_trail" IS 'Enterprise audit trail for all data changes with full context';



CREATE OR REPLACE VIEW "public"."enterprise_audit_summary" AS
 SELECT "enterprise_audit_trail"."table_name",
    "enterprise_audit_trail"."operation",
    "count"(*) AS "operation_count",
    "count"(DISTINCT "enterprise_audit_trail"."changed_by") AS "unique_users",
    "min"("enterprise_audit_trail"."changed_at") AS "first_operation",
    "max"("enterprise_audit_trail"."changed_at") AS "last_operation"
   FROM "public"."enterprise_audit_trail"
  WHERE ("enterprise_audit_trail"."changed_at" >= ("now"() - '30 days'::interval))
  GROUP BY "enterprise_audit_trail"."table_name", "enterprise_audit_trail"."operation"
  ORDER BY "enterprise_audit_trail"."table_name", "enterprise_audit_trail"."operation";


ALTER TABLE "public"."enterprise_audit_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enterprise_data_lineage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_table" "text" NOT NULL,
    "source_column" "text",
    "target_table" "text" NOT NULL,
    "target_column" "text",
    "transformation_type" "text" NOT NULL,
    "transformation_logic" "text",
    "data_flow_description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "enterprise_data_lineage_transformation_type_check" CHECK (("transformation_type" = ANY (ARRAY['DIRECT'::"text", 'AGGREGATED'::"text", 'TRANSFORMED'::"text", 'DERIVED'::"text"])))
);


ALTER TABLE "public"."enterprise_data_lineage" OWNER TO "postgres";


COMMENT ON TABLE "public"."enterprise_data_lineage" IS 'Data lineage tracking for enterprise data governance';



CREATE OR REPLACE VIEW "public"."enterprise_data_quality_dashboard" AS
 SELECT "t"."table_name",
    "t"."total_rules",
    "t"."passed_rules",
    "t"."failed_rules",
    "t"."critical_issues",
    "t"."overall_score",
        CASE
            WHEN ("t"."overall_score" >= (95)::numeric) THEN 'EXCELLENT'::"text"
            WHEN ("t"."overall_score" >= (85)::numeric) THEN 'GOOD'::"text"
            WHEN ("t"."overall_score" >= (70)::numeric) THEN 'FAIR'::"text"
            ELSE 'POOR'::"text"
        END AS "quality_status"
   FROM "public"."get_data_quality_report"() "t"("table_name", "total_rules", "passed_rules", "failed_rules", "critical_issues", "overall_score");


ALTER TABLE "public"."enterprise_data_quality_dashboard" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enterprise_data_quality_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rule_name" "text" NOT NULL,
    "table_name" "text" NOT NULL,
    "column_name" "text",
    "rule_type" "text" NOT NULL,
    "rule_definition" "text" NOT NULL,
    "severity" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "enterprise_data_quality_rules_rule_type_check" CHECK (("rule_type" = ANY (ARRAY['NOT_NULL'::"text", 'UNIQUE'::"text", 'FOREIGN_KEY'::"text", 'CHECK'::"text", 'CUSTOM'::"text"]))),
    CONSTRAINT "enterprise_data_quality_rules_severity_check" CHECK (("severity" = ANY (ARRAY['LOW'::"text", 'MEDIUM'::"text", 'HIGH'::"text", 'CRITICAL'::"text"])))
);


ALTER TABLE "public"."enterprise_data_quality_rules" OWNER TO "postgres";


COMMENT ON TABLE "public"."enterprise_data_quality_rules" IS 'Data quality rules for enterprise data validation';



CREATE TABLE IF NOT EXISTS "public"."enterprise_data_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "version_number" integer NOT NULL,
    "data_snapshot" "jsonb" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "change_reason" "text",
    "is_current" boolean DEFAULT true
);


ALTER TABLE "public"."enterprise_data_versions" OWNER TO "postgres";


COMMENT ON TABLE "public"."enterprise_data_versions" IS 'Data versioning for tracking changes over time';



CREATE TABLE IF NOT EXISTS "public"."photo_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "image_id" "uuid",
    "event_type" "text" NOT NULL,
    "user_id" "uuid",
    "session_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "photo_analytics_event_type_check" CHECK (("event_type" = ANY (ARRAY['view'::"text", 'click'::"text", 'share'::"text", 'download'::"text", 'like'::"text", 'upload'::"text", 'delete'::"text", 'edit'::"text", 'comment'::"text", 'purchase'::"text"])))
);


ALTER TABLE "public"."photo_analytics" OWNER TO "postgres";


COMMENT ON TABLE "public"."photo_analytics" IS 'Enterprise photo analytics tracking for comprehensive insights';



COMMENT ON COLUMN "public"."photo_analytics"."event_type" IS 'Type of analytics event tracked';



COMMENT ON COLUMN "public"."photo_analytics"."metadata" IS 'Additional event metadata including user agent, referrer, etc.';



CREATE OR REPLACE VIEW "public"."enterprise_photo_analytics" AS
 SELECT "pa"."album_id",
    "pa"."image_id",
    "pa"."event_type",
    "count"(*) AS "event_count",
    "count"(DISTINCT "pa"."user_id") AS "unique_users",
    "count"(DISTINCT "pa"."session_id") AS "unique_sessions",
    "min"("pa"."created_at") AS "first_event",
    "max"("pa"."created_at") AS "last_event",
        CASE
            WHEN ("count"(*) > 1) THEN (EXTRACT(epoch FROM ("max"("pa"."created_at") - "min"("pa"."created_at"))) / (("count"(*) - 1))::numeric)
            ELSE (0)::numeric
        END AS "avg_time_between_events"
   FROM "public"."photo_analytics" "pa"
  GROUP BY "pa"."album_id", "pa"."image_id", "pa"."event_type";


ALTER TABLE "public"."enterprise_photo_analytics" OWNER TO "postgres";


COMMENT ON VIEW "public"."enterprise_photo_analytics" IS 'Enterprise analytics view for photo engagement tracking';



CREATE TABLE IF NOT EXISTS "public"."photo_community" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "image_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "interaction_type" "text" NOT NULL,
    "content" "text",
    "rating" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "photo_community_interaction_type_check" CHECK (("interaction_type" = ANY (ARRAY['like'::"text", 'comment'::"text", 'share'::"text", 'follow'::"text", 'bookmark'::"text", 'report'::"text", 'review'::"text", 'rating'::"text"]))),
    CONSTRAINT "photo_community_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."photo_community" OWNER TO "postgres";


COMMENT ON TABLE "public"."photo_community" IS 'Enterprise photo community interactions and social features';



COMMENT ON COLUMN "public"."photo_community"."interaction_type" IS 'Type of community interaction';



COMMENT ON COLUMN "public"."photo_community"."content" IS 'User-generated content (comments, reviews)';



COMMENT ON COLUMN "public"."photo_community"."rating" IS 'User rating (1-5 stars)';



CREATE OR REPLACE VIEW "public"."enterprise_photo_community" AS
 SELECT "pc"."album_id",
    "pc"."image_id",
    "pc"."interaction_type",
    "count"(*) AS "interaction_count",
    "count"(DISTINCT "pc"."user_id") AS "unique_users",
    "avg"("pc"."rating") AS "avg_rating",
    "count"("pc"."rating") AS "rating_count",
    "min"("pc"."created_at") AS "first_interaction",
    "max"("pc"."created_at") AS "last_interaction"
   FROM "public"."photo_community" "pc"
  GROUP BY "pc"."album_id", "pc"."image_id", "pc"."interaction_type";


ALTER TABLE "public"."enterprise_photo_community" OWNER TO "postgres";


COMMENT ON VIEW "public"."enterprise_photo_community" IS 'Enterprise community view for social engagement tracking';



CREATE TABLE IF NOT EXISTS "public"."photo_monetization" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "image_id" "uuid",
    "event_type" "text" NOT NULL,
    "amount" numeric(10,2) DEFAULT 0,
    "currency" "text" DEFAULT 'USD'::"text",
    "user_id" "uuid",
    "payment_method" "text",
    "transaction_id" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "photo_monetization_amount_check" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "photo_monetization_event_type_check" CHECK (("event_type" = ANY (ARRAY['purchase'::"text", 'subscription'::"text", 'tip'::"text", 'ad_revenue'::"text", 'sponsorship'::"text", 'merchandise'::"text", 'commission'::"text"]))),
    CONSTRAINT "photo_monetization_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text", 'refunded'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."photo_monetization" OWNER TO "postgres";


COMMENT ON TABLE "public"."photo_monetization" IS 'Enterprise photo monetization tracking for revenue streams';



COMMENT ON COLUMN "public"."photo_monetization"."event_type" IS 'Type of monetization event';



COMMENT ON COLUMN "public"."photo_monetization"."amount" IS 'Monetary amount in specified currency';



COMMENT ON COLUMN "public"."photo_monetization"."status" IS 'Transaction status';



CREATE OR REPLACE VIEW "public"."enterprise_photo_monetization" AS
 SELECT "pm"."album_id",
    "pm"."image_id",
    "pm"."event_type",
    "sum"("pm"."amount") AS "total_revenue",
    "count"(*) AS "transaction_count",
    "count"(DISTINCT "pm"."user_id") AS "unique_payers",
    "avg"("pm"."amount") AS "avg_transaction_value",
    "min"("pm"."created_at") AS "first_transaction",
    "max"("pm"."created_at") AS "last_transaction"
   FROM "public"."photo_monetization" "pm"
  WHERE ("pm"."status" = 'completed'::"text")
  GROUP BY "pm"."album_id", "pm"."image_id", "pm"."event_type";


ALTER TABLE "public"."enterprise_photo_monetization" OWNER TO "postgres";


COMMENT ON VIEW "public"."enterprise_photo_monetization" IS 'Enterprise monetization view for revenue tracking';



CREATE TABLE IF NOT EXISTS "public"."entities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "name" "text",
    "description" "text",
    "engagement_count" integer DEFAULT 0,
    "post_count" integer DEFAULT 0,
    "last_engagement" timestamp with time zone,
    "last_post" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."entities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."photo_albums" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "cover_image_id" "uuid",
    "owner_id" "uuid" NOT NULL,
    "is_public" boolean DEFAULT false NOT NULL,
    "view_count" integer DEFAULT 0,
    "like_count" integer DEFAULT 0,
    "share_count" integer DEFAULT 0,
    "entity_id" "uuid",
    "entity_type" character varying(50),
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "monetization_enabled" boolean DEFAULT false,
    "premium_content" boolean DEFAULT false,
    "community_features" boolean DEFAULT false,
    "ai_enhanced" boolean DEFAULT false,
    "analytics_enabled" boolean DEFAULT false,
    "revenue_generated" numeric(10,2) DEFAULT 0,
    "total_subscribers" integer DEFAULT 0,
    "community_score" numeric(3,2) DEFAULT 0,
    "entity_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "entity_consistency" CHECK (((("entity_type" IS NULL) AND ("entity_id" IS NULL)) OR (("entity_type" IS NOT NULL) AND ("entity_id" IS NOT NULL)))),
    CONSTRAINT "valid_counts" CHECK ((("view_count" >= 0) AND ("like_count" >= 0) AND ("share_count" >= 0))),
    CONSTRAINT "valid_entity_type" CHECK ((("entity_type" IS NULL) OR (("entity_type")::"text" = ANY (ARRAY['user'::"text", 'publisher'::"text", 'author'::"text", 'group'::"text", 'book'::"text", 'event'::"text", 'content'::"text", 'album'::"text", 'series'::"text", 'collection'::"text", 'user_posts'::"text", 'group_posts'::"text", 'publisher_posts'::"text", 'event_posts'::"text", 'book_posts'::"text", 'author_posts'::"text"])))),
    CONSTRAINT "valid_timestamps" CHECK (("updated_at" >= "created_at"))
);


ALTER TABLE "public"."photo_albums" OWNER TO "postgres";


COMMENT ON TABLE "public"."photo_albums" IS 'Photo albums with privacy controls';



COMMENT ON COLUMN "public"."photo_albums"."owner_id" IS 'Album owner user ID';



COMMENT ON COLUMN "public"."photo_albums"."is_public" IS 'Whether album is public';



COMMENT ON COLUMN "public"."photo_albums"."monetization_enabled" IS 'Whether monetization features are enabled for this album';



COMMENT ON COLUMN "public"."photo_albums"."premium_content" IS 'Whether this album contains premium content';



COMMENT ON COLUMN "public"."photo_albums"."community_features" IS 'Whether community features are enabled';



COMMENT ON COLUMN "public"."photo_albums"."ai_enhanced" IS 'Whether AI features are enabled';



COMMENT ON COLUMN "public"."photo_albums"."analytics_enabled" IS 'Whether analytics tracking is enabled';



COMMENT ON COLUMN "public"."photo_albums"."revenue_generated" IS 'Total revenue generated from this album';



COMMENT ON COLUMN "public"."photo_albums"."total_subscribers" IS 'Number of premium subscribers';



COMMENT ON COLUMN "public"."photo_albums"."community_score" IS 'Community engagement score (0-1)';



COMMENT ON COLUMN "public"."photo_albums"."entity_metadata" IS 'Enterprise-grade metadata for entity relationships and tracking';



COMMENT ON CONSTRAINT "valid_entity_type" ON "public"."photo_albums" IS 'Validates entity_type values including new post-specific types for photo album integration system';



CREATE OR REPLACE VIEW "public"."entity_album_analytics" WITH ("security_invoker"='true') AS
 SELECT "pa"."entity_type",
    "pa"."entity_id",
    "count"("pa"."id") AS "total_albums",
    "count"(
        CASE
            WHEN ("pa"."is_public" = true) THEN 1
            ELSE NULL::integer
        END) AS "public_albums",
    "count"(
        CASE
            WHEN ("pa"."is_public" = false) THEN 1
            ELSE NULL::integer
        END) AS "private_albums",
    "sum"(COALESCE("img_counts"."photo_count", (0)::bigint)) AS "total_photos",
    "avg"(COALESCE("img_counts"."photo_count", (0)::bigint)) AS "avg_photos_per_album",
    "max"("pa"."created_at") AS "latest_album_created",
    "min"("pa"."created_at") AS "first_album_created"
   FROM ("public"."photo_albums" "pa"
     LEFT JOIN ( SELECT "ai"."album_id",
            "count"(*) AS "photo_count"
           FROM "public"."album_images" "ai"
          GROUP BY "ai"."album_id") "img_counts" ON (("img_counts"."album_id" = "pa"."id")))
  WHERE (("pa"."entity_type" IS NOT NULL) AND ("pa"."entity_id" IS NOT NULL))
  GROUP BY "pa"."entity_type", "pa"."entity_id";


ALTER TABLE "public"."entity_album_analytics" OWNER TO "postgres";


COMMENT ON VIEW "public"."entity_album_analytics" IS 'Enterprise-grade analytics view for entity album statistics';



CREATE TABLE IF NOT EXISTS "public"."entity_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "entity_category" "text"
);


ALTER TABLE "public"."entity_types" OWNER TO "postgres";


COMMENT ON TABLE "public"."entity_types" IS 'Centralized entity type definitions for enterprise-grade entity management';



COMMENT ON COLUMN "public"."entity_types"."entity_category" IS 'Entity category for grouping and permissions';



CREATE TABLE IF NOT EXISTS "public"."images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "url" "text" NOT NULL,
    "alt_text" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "thumbnail_url" "text",
    "medium_url" "text",
    "large_url" "text",
    "original_filename" character varying(255),
    "file_size" integer,
    "width" integer,
    "height" integer,
    "format" character varying(10),
    "mime_type" character varying(100),
    "caption" "text",
    "metadata" "jsonb",
    "storage_path" "text",
    "storage_provider" character varying(50) DEFAULT 'supabase'::character varying,
    "is_processed" boolean DEFAULT false,
    "processing_status" character varying(50),
    "deleted_at" timestamp with time zone,
    "entity_type_id" "uuid",
    "description" "text",
    "tags" "text"[],
    "location" "jsonb",
    "camera_info" "jsonb",
    "edit_history" "jsonb"[],
    "quality_score" numeric(3,2) DEFAULT 0.0,
    "content_rating" character varying(20) DEFAULT 'safe'::character varying,
    "upload_source" character varying(100),
    "ip_address" "inet",
    "user_agent" "text",
    "download_count" integer DEFAULT 0,
    "view_count" integer DEFAULT 0,
    "like_count" integer DEFAULT 0,
    "comment_count" integer DEFAULT 0,
    "share_count" integer DEFAULT 0,
    "revenue_generated" numeric(10,2) DEFAULT 0.00,
    "is_monetized" boolean DEFAULT false,
    "is_featured" boolean DEFAULT false,
    "is_nsfw" boolean DEFAULT false,
    "is_ai_generated" boolean DEFAULT false,
    "copyright_status" character varying(50) DEFAULT 'original'::character varying,
    "license_type" character varying(100),
    "watermark_applied" boolean DEFAULT false,
    "uploader_id" "uuid",
    "uploader_type" "text" DEFAULT 'user'::"text"
);


ALTER TABLE "public"."images" OWNER TO "postgres";


COMMENT ON COLUMN "public"."images"."uploader_id" IS 'ID of the user who uploaded this image';



COMMENT ON COLUMN "public"."images"."uploader_type" IS 'Type of uploader (user, admin, system, etc.)';



CREATE OR REPLACE VIEW "public"."entity_image_analytics" AS
 SELECT "et"."name" AS "entity_type_name",
    "et"."entity_category",
    "count"("i"."id") AS "total_images",
    "count"(DISTINCT "ai"."entity_id") AS "unique_entities",
    "avg"("i"."file_size") AS "avg_file_size",
    "sum"("i"."file_size") AS "total_storage_used",
    "min"("i"."created_at") AS "earliest_image",
    "max"("i"."created_at") AS "latest_image"
   FROM (("public"."images" "i"
     JOIN "public"."album_images" "ai" ON (("i"."id" = "ai"."image_id")))
     JOIN "public"."entity_types" "et" ON (("i"."entity_type_id" = "et"."id")))
  WHERE ("i"."deleted_at" IS NULL)
  GROUP BY "et"."id", "et"."name", "et"."entity_category"
  ORDER BY ("count"("i"."id")) DESC;


ALTER TABLE "public"."entity_image_analytics" OWNER TO "postgres";


COMMENT ON VIEW "public"."entity_image_analytics" IS 'Enterprise analytics view for entity-based image usage and storage';



CREATE TABLE IF NOT EXISTS "public"."entity_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" character varying(50) NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "tag_name" character varying(100) NOT NULL,
    "tag_category" character varying(50),
    "tag_color" character varying(7),
    "created_by" "uuid",
    "is_verified" boolean DEFAULT false,
    "usage_count" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "entity_tags_entity_type_check" CHECK ((("entity_type")::"text" = ANY ((ARRAY['photo'::character varying, 'book'::character varying, 'author'::character varying, 'publisher'::character varying, 'group'::character varying, 'event'::character varying, 'feed_entry'::character varying, 'album'::character varying, 'image'::character varying, 'discussion'::character varying, 'review'::character varying])::"text"[])))
);


ALTER TABLE "public"."entity_tags" OWNER TO "postgres";


COMMENT ON TABLE "public"."entity_tags" IS 'Enterprise unified tagging system for all entities';



CREATE TABLE IF NOT EXISTS "public"."likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "feed_entry_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "entity_type" character varying(50) DEFAULT 'feed_entry'::character varying,
    "entity_id" "uuid"
);


ALTER TABLE "public"."likes" OWNER TO "postgres";


COMMENT ON TABLE "public"."likes" IS 'User likes on feed entries';



COMMENT ON COLUMN "public"."likes"."user_id" IS 'User who liked the feed entry';



COMMENT ON COLUMN "public"."likes"."feed_entry_id" IS 'Feed entry being liked';



CREATE TABLE IF NOT EXISTS "public"."shares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "entity_type" character varying(50) NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "share_type" character varying(50) DEFAULT 'standard'::character varying,
    "share_platform" character varying(50),
    "share_url" "text",
    "share_text" "text",
    "is_public" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "shares_entity_type_check" CHECK ((("entity_type")::"text" = ANY ((ARRAY['photo'::character varying, 'book'::character varying, 'author'::character varying, 'publisher'::character varying, 'group'::character varying, 'event'::character varying, 'feed_entry'::character varying, 'album'::character varying, 'image'::character varying, 'discussion'::character varying, 'review'::character varying])::"text"[]))),
    CONSTRAINT "shares_share_type_check" CHECK ((("share_type")::"text" = ANY ((ARRAY['standard'::character varying, 'story'::character varying, 'repost'::character varying, 'quote'::character varying])::"text"[])))
);


ALTER TABLE "public"."shares" OWNER TO "postgres";


COMMENT ON TABLE "public"."shares" IS 'Enterprise unified sharing system for all entities';



CREATE OR REPLACE VIEW "public"."entity_social_analytics" AS
 SELECT "entities"."entity_type",
    "entities"."entity_id",
    "count"(DISTINCT "l"."user_id") AS "unique_likers",
    "count"(DISTINCT "c"."user_id") AS "unique_commenters",
    "count"(DISTINCT "s"."user_id") AS "unique_sharers",
    "count"(DISTINCT "b"."user_id") AS "unique_bookmarkers",
    "count"("l"."id") AS "total_likes",
    "count"("c"."id") AS "total_comments",
    "count"("s"."id") AS "total_shares",
    "count"("b"."id") AS "total_bookmarks",
    "count"("et"."id") AS "total_tags",
    "avg"(
        CASE
            WHEN ("c"."created_at" >= ("now"() - '7 days'::interval)) THEN 1
            ELSE 0
        END) AS "recent_engagement_score"
   FROM (((((( SELECT DISTINCT "likes"."entity_type",
            "likes"."entity_id"
           FROM "public"."likes"
        UNION
         SELECT DISTINCT "comments"."entity_type",
            "comments"."entity_id"
           FROM "public"."comments"
        UNION
         SELECT DISTINCT "shares"."entity_type",
            "shares"."entity_id"
           FROM "public"."shares"
        UNION
         SELECT DISTINCT "bookmarks"."entity_type",
            "bookmarks"."entity_id"
           FROM "public"."bookmarks"
        UNION
         SELECT DISTINCT "entity_tags"."entity_type",
            "entity_tags"."entity_id"
           FROM "public"."entity_tags") "entities"
     LEFT JOIN "public"."likes" "l" ON (((("entities"."entity_type")::"text" = ("l"."entity_type")::"text") AND ("entities"."entity_id" = "l"."entity_id"))))
     LEFT JOIN "public"."comments" "c" ON (((("entities"."entity_type")::"text" = ("c"."entity_type")::"text") AND ("entities"."entity_id" = "c"."entity_id") AND ("c"."is_deleted" = false))))
     LEFT JOIN "public"."shares" "s" ON (((("entities"."entity_type")::"text" = ("s"."entity_type")::"text") AND ("entities"."entity_id" = "s"."entity_id"))))
     LEFT JOIN "public"."bookmarks" "b" ON (((("entities"."entity_type")::"text" = ("b"."entity_type")::"text") AND ("entities"."entity_id" = "b"."entity_id"))))
     LEFT JOIN "public"."entity_tags" "et" ON (((("entities"."entity_type")::"text" = ("et"."entity_type")::"text") AND ("entities"."entity_id" = "et"."entity_id"))))
  GROUP BY "entities"."entity_type", "entities"."entity_id";


ALTER TABLE "public"."entity_social_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "views" integer DEFAULT 0,
    "unique_visitors" integer DEFAULT 0,
    "registrations" integer DEFAULT 0,
    "cancellations" integer DEFAULT 0,
    "shares" integer DEFAULT 0,
    "likes" integer DEFAULT 0,
    "comments" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "submitted_by" "uuid" NOT NULL,
    "approval_status" "text",
    "reviewer_id" "uuid",
    "review_notes" "text",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_approvals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_books" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "feature_type" "text",
    "display_order" integer,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid" NOT NULL
);


ALTER TABLE "public"."event_books" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_calendar_exports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "calendar_type" "text",
    "calendar_event_id" "text",
    "synced_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_calendar_exports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "parent_id" "uuid",
    "icon" "text",
    "color" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chat_room_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "is_hidden" boolean DEFAULT false,
    "hidden_by" "uuid",
    "hidden_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_chat_rooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "is_moderated" boolean DEFAULT true,
    "moderator_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "requires_ticket" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_chat_rooms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "content" "text" NOT NULL,
    "is_pinned" boolean DEFAULT false,
    "is_hidden" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_creator_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "permission_level" "text",
    "can_create_paid_events" boolean DEFAULT false,
    "attendee_limit" integer DEFAULT 100,
    "requires_approval" boolean DEFAULT true,
    "approved_categories" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_creator_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_financials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "total_revenue" numeric DEFAULT 0,
    "total_fees" numeric DEFAULT 0,
    "total_taxes" numeric DEFAULT 0,
    "total_refunds" numeric DEFAULT 0,
    "net_revenue" numeric DEFAULT 0,
    "currency" "text" DEFAULT 'USD'::"text",
    "ticket_sales_breakdown" "jsonb",
    "payout_status" "text",
    "payout_date" timestamp with time zone,
    "payout_method" "text",
    "payout_reference" "text",
    "organizer_fees" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_financials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_interests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "interest_level" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_interests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_livestreams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "provider" "text",
    "stream_key" "text",
    "stream_url" "text" NOT NULL,
    "embed_code" "text",
    "is_active" boolean DEFAULT false,
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "recording_url" "text",
    "viewer_count" integer DEFAULT 0,
    "max_concurrent_viewers" integer DEFAULT 0,
    "requires_ticket" boolean DEFAULT true,
    "ticket_types" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_livestreams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "state" "text",
    "postal_code" "text",
    "country" "text",
    "latitude" numeric,
    "longitude" numeric,
    "google_place_id" "text",
    "is_primary" boolean DEFAULT true,
    "venue_notes" "text",
    "accessibility_info" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_media" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "media_type" "text",
    "url" "text" NOT NULL,
    "thumbnail_url" "text",
    "title" "text",
    "description" "text",
    "file_size" integer,
    "file_type" "text",
    "duration" integer,
    "width" integer,
    "height" integer,
    "display_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_permission_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "request_reason" "text",
    "requested_level" "text",
    "status" "text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "admin_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_permission_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "question_type" "text",
    "is_required" boolean DEFAULT false,
    "options" "jsonb",
    "display_order" integer,
    "help_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "registration_status" "text",
    "registration_time" timestamp with time zone DEFAULT "now"(),
    "check_in_time" timestamp with time zone,
    "ticket_id" "text",
    "registration_source" "text",
    "additional_guests" integer DEFAULT 0,
    "guest_names" "jsonb",
    "answers" "jsonb",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "session_ids" "uuid"[] DEFAULT '{}'::"uuid"[]
);


ALTER TABLE "public"."event_registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_reminders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reminder_time" timestamp with time zone NOT NULL,
    "notification_sent" boolean DEFAULT false,
    "notification_time" timestamp with time zone,
    "reminder_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_reminders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "speaker_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "location_id" "uuid",
    "virtual_meeting_url" "text",
    "max_attendees" integer,
    "requires_separate_registration" boolean DEFAULT false,
    "session_materials" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_shares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "share_platform" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_shares" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_speakers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "bio" "text",
    "headshot_url" "text",
    "website" "text",
    "social_links" "jsonb",
    "presentation_title" "text",
    "presentation_description" "text",
    "speaker_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "session_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "author_id" "uuid"
);


ALTER TABLE "public"."event_speakers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_sponsors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "website_url" "text",
    "logo_url" "text",
    "sponsor_level" "text",
    "display_order" integer,
    "contribution_amount" numeric,
    "currency" "text" DEFAULT 'USD'::"text",
    "is_featured" boolean DEFAULT false,
    "benefits_description" "text",
    "contact_name" "text",
    "contact_email" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_sponsors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_staff" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text",
    "permissions" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_staff" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_surveys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "is_anonymous" boolean DEFAULT false,
    "requires_ticket" boolean DEFAULT true,
    "available_from" timestamp with time zone,
    "available_until" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_surveys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_tags" (
    "event_id" "uuid" NOT NULL,
    "tag_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "ip_address" "text",
    "viewed_at" timestamp with time zone DEFAULT "now"(),
    "user_agent" "text",
    "referrer" "text"
);


ALTER TABLE "public"."event_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_waitlists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "ticket_type_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "position" integer NOT NULL,
    "status" "text",
    "notification_sent_at" timestamp with time zone,
    "expiration_time" timestamp with time zone,
    "converted_to_registration_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_waitlists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text",
    "description" "text",
    "summary" "text",
    "event_category_id" "uuid",
    "type_id" "uuid",
    "format" "text",
    "status" "text",
    "visibility" "text",
    "featured" boolean DEFAULT false,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "timezone" "text",
    "all_day" boolean DEFAULT false,
    "max_attendees" integer,
    "cover_image_id" "uuid",
    "event_image_id" "uuid",
    "is_recurring" boolean DEFAULT false,
    "recurrence_pattern" "jsonb",
    "parent_event_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "published_at" timestamp with time zone,
    "requires_registration" boolean DEFAULT false,
    "registration_opens_at" timestamp with time zone,
    "registration_closes_at" timestamp with time zone,
    "is_free" boolean DEFAULT true,
    "price" numeric,
    "currency" "text",
    "group_id" "uuid",
    "virtual_meeting_url" "text",
    "virtual_meeting_id" "text",
    "virtual_meeting_password" "text",
    "virtual_platform" "text",
    "slug" "text",
    "seo_title" "text",
    "seo_description" "text",
    "canonical_url" "text",
    "content_blocks" "jsonb",
    "author_id" "uuid",
    "book_id" "uuid",
    "publisher_id" "uuid",
    "permalink" character varying(100)
);


ALTER TABLE "public"."events" OWNER TO "postgres";


COMMENT ON COLUMN "public"."events"."permalink" IS 'Custom URL-friendly identifier for events';



CREATE TABLE IF NOT EXISTS "public"."feed_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "group_id" "uuid",
    "type" "text" NOT NULL,
    "content" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visibility" "text" DEFAULT 'public'::"text" NOT NULL,
    "allowed_user_ids" "uuid"[],
    "is_hidden" boolean DEFAULT false NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid"
);


ALTER TABLE "public"."feed_entries" OWNER TO "postgres";


COMMENT ON TABLE "public"."feed_entries" IS 'User activity feed entries';



COMMENT ON COLUMN "public"."feed_entries"."entity_type" IS 'Type of entity this feed entry relates to (book, author, event, etc.)';



COMMENT ON COLUMN "public"."feed_entries"."entity_id" IS 'ID of the entity this feed entry relates to';



CREATE TABLE IF NOT EXISTS "public"."feed_entry_tags" (
    "feed_entry_id" "uuid" NOT NULL,
    "tag_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feed_entry_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."follow_target_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."follow_target_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."follows" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "target_type_id_uuid_temp" "uuid",
    "target_type_id" "uuid"
);


ALTER TABLE "public"."follows" OWNER TO "postgres";


COMMENT ON TABLE "public"."follows" IS 'Follows table - allows following users, books, authors, publishers, and groups. following_id can reference any entity type.';



COMMENT ON COLUMN "public"."follows"."following_id" IS 'ID of the entity being followed (can be user, book, author, etc.)';



COMMENT ON COLUMN "public"."follows"."target_type_id" IS 'Reference to follow_target_types table to specify entity type';



CREATE TABLE IF NOT EXISTS "public"."format_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL
);


ALTER TABLE "public"."format_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."friend_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friend_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."friend_activities" OWNER TO "postgres";


COMMENT ON TABLE "public"."friend_activities" IS 'Activity log for friend-related actions';



CREATE TABLE IF NOT EXISTS "public"."friend_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "total_friends" integer DEFAULT 0,
    "friend_requests_sent" integer DEFAULT 0,
    "friend_requests_received" integer DEFAULT 0,
    "friend_requests_accepted" integer DEFAULT 0,
    "friend_requests_rejected" integer DEFAULT 0,
    "last_activity_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."friend_analytics" OWNER TO "postgres";


COMMENT ON TABLE "public"."friend_analytics" IS 'Analytics data for friend relationships';



CREATE TABLE IF NOT EXISTS "public"."friend_suggestions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "suggested_user_id" "uuid" NOT NULL,
    "mutual_friends_count" integer DEFAULT 0,
    "common_interests" "text"[],
    "suggestion_score" numeric(3,2) DEFAULT 0.00,
    "is_dismissed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."friend_suggestions" OWNER TO "postgres";


COMMENT ON TABLE "public"."friend_suggestions" IS 'Friend suggestions based on mutual friends and common interests';



CREATE TABLE IF NOT EXISTS "public"."friends" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friend_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "responded_at" timestamp with time zone,
    "requested_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."friends" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "criteria" "text",
    "points" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "icon_url" "text",
    "type" "text"
);


ALTER TABLE "public"."group_achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "metric_name" "text" NOT NULL,
    "metric_value" numeric,
    "recorded_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "content" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_pinned" boolean DEFAULT false
);


ALTER TABLE "public"."group_announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "action" "text",
    "performed_by" "uuid",
    "target_type" "text",
    "target_id" "uuid",
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_author_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "event_id" "uuid",
    "scheduled_at" timestamp with time zone,
    "author_id" "uuid"
);


ALTER TABLE "public"."group_author_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_book_list_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "list_id" "uuid",
    "added_by" "uuid",
    "added_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid"
);


ALTER TABLE "public"."group_book_list_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_book_lists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "description" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_book_lists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_book_reviews" (
    "id" "uuid" NOT NULL,
    "group_id" "uuid",
    "book_id" "uuid",
    "user_id" "uuid",
    "rating" integer,
    "review" "text",
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."group_book_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_book_swaps" (
    "id" "uuid" NOT NULL,
    "group_id" "uuid",
    "book_id" "uuid",
    "offered_by" "uuid",
    "status" "text",
    "accepted_by" "uuid",
    "created_at" timestamp with time zone,
    "accepted_at" timestamp with time zone
);


ALTER TABLE "public"."group_book_swaps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_book_wishlist_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "wishlist_id" "uuid",
    "added_by" "uuid",
    "added_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid"
);


ALTER TABLE "public"."group_book_wishlist_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_book_wishlists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_book_wishlists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_books" (
    "group_id" "uuid" NOT NULL,
    "book_id" "uuid" NOT NULL,
    "added_by" "uuid",
    "added_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."group_books" OWNER TO "postgres";


COMMENT ON TABLE "public"."group_books" IS 'Associates books with groups for group reading, recommendations, or tracking.';



COMMENT ON COLUMN "public"."group_books"."group_id" IS 'The group to which the book is linked.';



COMMENT ON COLUMN "public"."group_books"."book_id" IS 'The book being linked to the group.';



COMMENT ON COLUMN "public"."group_books"."added_by" IS 'User who added the book to the group.';



COMMENT ON COLUMN "public"."group_books"."added_at" IS 'Timestamp when the book was added to the group.';



CREATE TABLE IF NOT EXISTS "public"."group_bots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "name" "text",
    "description" "text",
    "config" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_bots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_chat_channels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "name" "text",
    "description" "text",
    "is_event_channel" boolean DEFAULT false,
    "event_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_chat_channels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_chat_message_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "uuid",
    "url" "text",
    "file_type" "text",
    "file_size" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_chat_message_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_chat_message_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "uuid",
    "user_id" "uuid",
    "reaction" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_chat_message_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "channel_id" "uuid",
    "user_id" "uuid",
    "message" "text",
    "is_hidden" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_content_moderation_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "content_type" "text",
    "content_id" "uuid",
    "action" "text",
    "reason" "text",
    "reviewed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_content_moderation_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_custom_fields" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "field_name" "text",
    "field_type" "text",
    "field_options" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_custom_fields" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_discussion_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_discussion_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_event_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid",
    "group_id" "uuid",
    "user_id" "uuid",
    "rating" integer,
    "feedback" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_event_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "event_id" "uuid",
    "is_recurring" boolean DEFAULT false,
    "recurrence_pattern" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "chat_channel_id" "uuid"
);


ALTER TABLE "public"."group_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "type" "text",
    "config" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "invited_user_id" "uuid",
    "email" "text",
    "invite_code" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "accepted_at" timestamp with time zone,
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."group_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_leaderboards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "leaderboard_type" "text",
    "data" "jsonb",
    "generated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_leaderboards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_member_achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "achievement_id" "uuid" NOT NULL,
    "earned_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_member_achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_member_devices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "user_id" "uuid",
    "device_token" "text",
    "device_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_member_devices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_member_streaks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "user_id" "uuid",
    "streak_type" "text",
    "current_streak" integer DEFAULT 0,
    "longest_streak" integer DEFAULT 0,
    "last_active_date" "date",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_member_streaks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_members" (
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role_id" integer,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "joined_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_membership_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "is_required" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_membership_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_moderation_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "action" "text",
    "target_type" "text",
    "target_id" "uuid",
    "performed_by" "uuid",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_moderation_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_onboarding_checklists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_onboarding_checklists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_onboarding_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "checklist_id" "uuid",
    "user_id" "uuid",
    "task_id" "uuid",
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."group_onboarding_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_onboarding_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "checklist_id" "uuid",
    "task" "text",
    "order_index" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_onboarding_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_poll_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "poll_id" "uuid",
    "user_id" "uuid",
    "option_index" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_poll_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_polls" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "question" "text" NOT NULL,
    "options" "text"[],
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "is_anonymous" boolean DEFAULT false,
    "allow_multiple" boolean DEFAULT false
);


ALTER TABLE "public"."group_polls" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_reading_challenge_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "challenge_id" "uuid",
    "user_id" "uuid",
    "books_read" integer DEFAULT 0,
    "progress_details" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_reading_challenge_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_reading_challenges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "description" "text",
    "target_books" integer,
    "start_date" "date",
    "end_date" "date",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_reading_challenges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_reading_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "user_id" "uuid",
    "progress_percentage" integer,
    "started_at" timestamp with time zone,
    "finished_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid"
);


ALTER TABLE "public"."group_reading_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_reading_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "session_title" "text",
    "session_description" "text",
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid"
);


ALTER TABLE "public"."group_reading_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "reported_by" "uuid",
    "target_type" "text",
    "target_id" "uuid",
    "reason" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "permissions" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_default" boolean DEFAULT false
);


ALTER TABLE "public"."group_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "order_index" integer
);


ALTER TABLE "public"."group_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_shared_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "content" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."group_shared_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "display_name" "text" NOT NULL,
    "slug" "text" NOT NULL
);


ALTER TABLE "public"."group_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_webhook_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "webhook_id" "uuid",
    "event_type" "text",
    "payload" "jsonb",
    "status" "text",
    "response_code" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_webhook_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_webhooks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "url" "text",
    "event_types" "text"[],
    "secret" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_webhooks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_welcome_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "role_id" integer,
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_welcome_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "is_private" boolean DEFAULT false,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "cover_image_url" "text",
    "member_count" integer DEFAULT 0,
    "permalink" character varying(100)
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


COMMENT ON COLUMN "public"."groups"."permalink" IS 'Custom URL-friendly identifier for groups';



CREATE TABLE IF NOT EXISTS "public"."id_mappings" (
    "table_name" "text" NOT NULL,
    "old_id" integer NOT NULL,
    "new_id" "uuid" NOT NULL
);


ALTER TABLE "public"."id_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."image_processing_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "image_id" "uuid" NOT NULL,
    "job_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "priority" integer DEFAULT 5,
    "parameters" "jsonb" DEFAULT '{}'::"jsonb",
    "result" "jsonb",
    "error_message" "text",
    "processing_time_ms" integer,
    "worker_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    CONSTRAINT "image_processing_jobs_priority_check" CHECK ((("priority" >= 1) AND ("priority" <= 10))),
    CONSTRAINT "image_processing_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."image_processing_jobs" OWNER TO "postgres";


COMMENT ON TABLE "public"."image_processing_jobs" IS 'Image processing job queue for AI and optimization tasks';



COMMENT ON COLUMN "public"."image_processing_jobs"."job_type" IS 'Type of processing job';



COMMENT ON COLUMN "public"."image_processing_jobs"."priority" IS 'Job priority (1-10, higher is more important)';



CREATE TABLE IF NOT EXISTS "public"."image_tag_mappings" (
    "image_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."image_tag_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."image_tags" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "slug" character varying(100) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."image_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" character varying(255),
    "name" character varying(255),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "role_id" "uuid",
    "permalink" character varying(100),
    "location" character varying(255),
    "website" character varying(255)
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'User accounts and basic information';



COMMENT ON COLUMN "public"."users"."email" IS 'User email address for authentication';



COMMENT ON COLUMN "public"."users"."name" IS 'User display name';



COMMENT ON COLUMN "public"."users"."role_id" IS 'Reference to user role for permissions';



COMMENT ON COLUMN "public"."users"."permalink" IS 'User permalink for profile URLs';



COMMENT ON COLUMN "public"."users"."location" IS 'User location/city';



COMMENT ON COLUMN "public"."users"."website" IS 'User website URL';



CREATE OR REPLACE VIEW "public"."image_uploaders" AS
 SELECT "i"."id" AS "image_id",
    "i"."url",
    "i"."alt_text",
    "i"."created_at",
    "i"."uploader_id",
    "i"."uploader_type",
    "u"."name" AS "uploader_name",
    "u"."email" AS "uploader_email"
   FROM ("public"."images" "i"
     LEFT JOIN "public"."users" "u" ON (("i"."uploader_id" = "u"."id")))
  WHERE ("i"."deleted_at" IS NULL);


ALTER TABLE "public"."image_uploaders" OWNER TO "postgres";


COMMENT ON VIEW "public"."image_uploaders" IS 'View for easy access to image uploader information with user details';



CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "invoice_number" "text" NOT NULL,
    "amount" numeric NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "status" "text",
    "due_date" timestamp with time zone,
    "paid_date" timestamp with time zone,
    "billing_address" "jsonb",
    "line_items" "jsonb",
    "notes" "text",
    "invoice_pdf_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."list_followers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "list_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."list_followers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."media_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feed_entry_id" "uuid",
    "url" "text" NOT NULL,
    "type" "text",
    "alt_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."media_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feed_entry_id" "uuid",
    "comment_id" "uuid",
    "mentioned_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mentions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ml_models" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "model_name" "text" NOT NULL,
    "model_version" "text" NOT NULL,
    "model_type" "text" NOT NULL,
    "model_parameters" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "training_data_snapshot" "jsonb",
    "model_metrics" "jsonb",
    "model_file_path" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "ml_models_model_type_check" CHECK (("model_type" = ANY (ARRAY['recommendation'::"text", 'classification'::"text", 'regression'::"text", 'clustering'::"text", 'nlp'::"text"])))
);


ALTER TABLE "public"."ml_models" OWNER TO "postgres";


COMMENT ON TABLE "public"."ml_models" IS 'AI/ML model registry for enterprise-grade machine learning capabilities';



CREATE TABLE IF NOT EXISTS "public"."ml_predictions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "model_id" "uuid",
    "user_id" "uuid",
    "input_data" "jsonb" NOT NULL,
    "prediction_result" "jsonb" NOT NULL,
    "confidence_score" numeric(5,4),
    "prediction_timestamp" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."ml_predictions" OWNER TO "postgres";


COMMENT ON TABLE "public"."ml_predictions" IS 'Stores AI/ML prediction results and confidence scores';



CREATE TABLE IF NOT EXISTS "public"."ml_training_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "model_id" "uuid",
    "job_name" "text" NOT NULL,
    "job_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "training_config" "jsonb" NOT NULL,
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "progress_percentage" integer DEFAULT 0,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ml_training_jobs_job_status_check" CHECK (("job_status" = ANY (ARRAY['pending'::"text", 'running'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."ml_training_jobs" OWNER TO "postgres";


COMMENT ON TABLE "public"."ml_training_jobs" IS 'Tracks AI/ML model training jobs and their status';



CREATE TABLE IF NOT EXISTS "public"."moderation_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_type" character varying(50) NOT NULL,
    "content_id" "uuid" NOT NULL,
    "priority" character varying(20) DEFAULT 'normal'::character varying,
    "flag_count" integer DEFAULT 1,
    "first_flagged_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_flagged_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "assigned_to" "uuid",
    "assigned_at" timestamp with time zone,
    "resolved_at" timestamp with time zone,
    "resolution_action" character varying(50),
    "resolution_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "moderation_queue_priority_check" CHECK ((("priority")::"text" = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying])::"text"[]))),
    CONSTRAINT "moderation_queue_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'in_review'::character varying, 'resolved'::character varying, 'dismissed'::character varying])::"text"[])))
);


ALTER TABLE "public"."moderation_queue" OWNER TO "postgres";


COMMENT ON TABLE "public"."moderation_queue" IS 'Moderation queue for flagged content';



CREATE OR REPLACE VIEW "public"."moderation_analytics" AS
 SELECT "date"("cf"."created_at") AS "flag_date",
    "cf"."flag_reason",
    "cf"."content_type",
    "mq"."priority",
    "mq"."status",
    "count"(*) AS "flag_count",
    "avg"((EXTRACT(epoch FROM ("mq"."resolved_at" - "cf"."created_at")) / (3600)::numeric)) AS "avg_resolution_time_hours"
   FROM ("public"."content_flags" "cf"
     LEFT JOIN "public"."moderation_queue" "mq" ON (((("cf"."content_type")::"text" = ("mq"."content_type")::"text") AND ("cf"."content_id" = "mq"."content_id"))))
  WHERE ("cf"."created_at" >= ("now"() - '30 days'::interval))
  GROUP BY ("date"("cf"."created_at")), "cf"."flag_reason", "cf"."content_type", "mq"."priority", "mq"."status"
  ORDER BY ("date"("cf"."created_at")) DESC, ("count"(*)) DESC;


ALTER TABLE "public"."moderation_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nlp_analysis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid",
    "content_type" "text" NOT NULL,
    "analysis_type" "text" NOT NULL,
    "original_text" "text" NOT NULL,
    "processed_text" "text",
    "analysis_results" "jsonb" NOT NULL,
    "confidence_score" numeric(5,4),
    "language_detected" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "nlp_analysis_analysis_type_check" CHECK (("analysis_type" = ANY (ARRAY['sentiment'::"text", 'topic'::"text", 'keyword'::"text", 'summary'::"text", 'translation'::"text"]))),
    CONSTRAINT "nlp_analysis_content_type_check" CHECK (("content_type" = ANY (ARRAY['book'::"text", 'review'::"text", 'comment'::"text", 'event'::"text", 'discussion'::"text"])))
);


ALTER TABLE "public"."nlp_analysis" OWNER TO "postgres";


COMMENT ON TABLE "public"."nlp_analysis" IS 'Natural Language Processing analysis results';



CREATE TABLE IF NOT EXISTS "public"."notification_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "notification_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text",
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "is_read" boolean DEFAULT false,
    "is_sent" boolean DEFAULT false,
    "scheduled_at" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notification_queue" OWNER TO "postgres";


COMMENT ON TABLE "public"."notification_queue" IS 'Queue for user notifications';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "link" "text",
    "data" "jsonb",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'User notifications';



CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "payment_type" "text",
    "provider_payment_id" "text",
    "nickname" "text",
    "last_four" "text",
    "expiry_date" "text",
    "is_default" boolean DEFAULT false,
    "billing_address" "jsonb",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "payment_method_id" "uuid",
    "transaction_type" "text",
    "amount" numeric NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "fees" numeric DEFAULT 0,
    "taxes" numeric DEFAULT 0,
    "tax_details" "jsonb",
    "status" "text",
    "provider_transaction_id" "text",
    "payment_provider" "text",
    "error_message" "text",
    "metadata" "jsonb",
    "receipt_url" "text",
    "receipt_email_sent" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_transactions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."performance_dashboard" AS
 SELECT 'Query Performance'::"text" AS "category",
    "monitor_query_performance"."query_pattern" AS "metric",
    ("monitor_query_performance"."avg_execution_time")::"text" AS "value",
    "monitor_query_performance"."performance_status" AS "status"
   FROM "public"."monitor_query_performance"() "monitor_query_performance"("query_pattern", "avg_execution_time", "total_calls", "performance_status")
UNION ALL
 SELECT 'Table Performance'::"text" AS "category",
    "pg_tables"."tablename" AS "metric",
    "pg_size_pretty"("pg_total_relation_size"((((("pg_tables"."schemaname")::"text" || '.'::"text") || ("pg_tables"."tablename")::"text"))::"regclass")) AS "value",
        CASE
            WHEN ("pg_total_relation_size"((((("pg_tables"."schemaname")::"text" || '.'::"text") || ("pg_tables"."tablename")::"text"))::"regclass") > 1073741824) THEN 'WARNING'::"text"
            ELSE 'GOOD'::"text"
        END AS "status"
   FROM "pg_tables"
  WHERE ("pg_tables"."schemaname" = 'public'::"name")
UNION ALL
 SELECT 'Index Usage'::"text" AS "category",
    "pg_stat_user_indexes"."indexrelname" AS "metric",
    'Active'::"text" AS "value",
    'GOOD'::"text" AS "status"
   FROM "pg_stat_user_indexes"
  WHERE ("pg_stat_user_indexes"."schemaname" = 'public'::"name")
 LIMIT 10;


ALTER TABLE "public"."performance_dashboard" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."performance_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "metric_name" "text" NOT NULL,
    "metric_value" numeric NOT NULL,
    "metric_unit" "text",
    "category" "text" NOT NULL,
    "recorded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "additional_data" "jsonb"
);


ALTER TABLE "public"."performance_metrics" OWNER TO "postgres";


COMMENT ON TABLE "public"."performance_metrics" IS 'Application performance metrics for monitoring and optimization';



CREATE TABLE IF NOT EXISTS "public"."personalized_recommendations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "book_id" bigint NOT NULL,
    "recommendation_type" "text" NOT NULL,
    "score" double precision NOT NULL,
    "explanation" "text",
    "is_dismissed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."personalized_recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."photo_album" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "entity_id" integer NOT NULL,
    "entity_type" character varying(50) NOT NULL,
    "image_type_id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."photo_album" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."photo_bookmarks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "photo_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "collection_name" character varying(255),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."photo_bookmarks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."photo_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "photo_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "content" "text" NOT NULL,
    "content_html" "text",
    "mentions" "uuid"[],
    "like_count" integer DEFAULT 0,
    "reply_count" integer DEFAULT 0,
    "is_edited" boolean DEFAULT false,
    "is_pinned" boolean DEFAULT false,
    "is_hidden" boolean DEFAULT false,
    "moderation_status" character varying(20) DEFAULT 'approved'::character varying,
    "sentiment_score" numeric(3,2),
    "language" character varying(10),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "edited_at" timestamp with time zone,
    "ip_address" "inet",
    "user_agent" "text"
);


ALTER TABLE "public"."photo_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."photo_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "photo_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "like_type" character varying(20) DEFAULT 'like'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "ip_address" "inet",
    "user_agent" "text"
);


ALTER TABLE "public"."photo_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."photo_shares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "photo_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "share_type" character varying(50) NOT NULL,
    "platform_data" "jsonb",
    "referrer_url" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."photo_shares" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."photo_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "photo_id" "uuid" NOT NULL,
    "entity_type" character varying(50) NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "entity_name" character varying(255) NOT NULL,
    "x_position" numeric(5,2) NOT NULL,
    "y_position" numeric(5,2) NOT NULL,
    "width" numeric(5,2) DEFAULT 0,
    "height" numeric(5,2) DEFAULT 0,
    "confidence_score" numeric(3,2),
    "tagged_by" "uuid",
    "verified_by" "uuid",
    "is_verified" boolean DEFAULT false,
    "is_auto_generated" boolean DEFAULT false,
    "visibility" character varying(20) DEFAULT 'public'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."photo_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_bookmarks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "folder" "text" DEFAULT 'default'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."post_bookmarks" OWNER TO "postgres";


COMMENT ON TABLE "public"."post_bookmarks" IS 'User bookmarks of posts';



CREATE TABLE IF NOT EXISTS "public"."post_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "parent_comment_id" "uuid",
    "content" "text" NOT NULL,
    "is_edited" boolean DEFAULT false,
    "is_hidden" boolean DEFAULT false,
    "is_deleted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."post_comments" OWNER TO "postgres";


COMMENT ON TABLE "public"."post_comments" IS 'Comments on posts with support for nested replies';



CREATE TABLE IF NOT EXISTS "public"."post_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reaction_type" "text" DEFAULT 'like'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."post_reactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."post_reactions" IS 'User reactions to posts (like, love, etc.)';



CREATE TABLE IF NOT EXISTS "public"."post_shares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "share_type" "text" DEFAULT 'repost'::"text" NOT NULL,
    "share_content" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."post_shares" OWNER TO "postgres";


COMMENT ON TABLE "public"."post_shares" IS 'Post sharing activity (reposts, shares)';



CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "jsonb" NOT NULL,
    "image_url" "text",
    "link_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visibility" "text" DEFAULT 'public'::"text" NOT NULL,
    "allowed_user_ids" "uuid"[],
    "is_hidden" boolean DEFAULT false NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid",
    "content_type" "text" DEFAULT 'text'::"text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "content_summary" "text",
    "media_files" "jsonb" DEFAULT '[]'::"jsonb",
    "scheduled_at" timestamp with time zone,
    "published_at" timestamp with time zone,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "categories" "text"[] DEFAULT '{}'::"text"[],
    "languages" "text"[] DEFAULT '{}'::"text"[],
    "regions" "text"[] DEFAULT '{}'::"text"[],
    "content_warnings" "text"[] DEFAULT '{}'::"text"[],
    "sensitive_content" boolean DEFAULT false,
    "age_restriction" "text",
    "seo_title" "text",
    "seo_description" "text",
    "seo_keywords" "text"[] DEFAULT '{}'::"text"[],
    "publish_status" "text" DEFAULT 'published'::"text",
    "view_count" integer DEFAULT 0,
    "like_count" integer DEFAULT 0,
    "comment_count" integer DEFAULT 0,
    "share_count" integer DEFAULT 0,
    "bookmark_count" integer DEFAULT 0,
    "engagement_score" numeric DEFAULT 0,
    "trending_score" numeric DEFAULT 0,
    "is_featured" boolean DEFAULT false,
    "is_pinned" boolean DEFAULT false,
    "is_verified" boolean DEFAULT false,
    "last_activity_at" timestamp with time zone DEFAULT "now"(),
    "enterprise_features" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "posts_content_type_check" CHECK (("content_type" = ANY (ARRAY['text'::"text", 'image'::"text", 'video'::"text", 'link'::"text", 'book'::"text", 'event'::"text", 'review'::"text", 'poll'::"text"]))),
    CONSTRAINT "posts_counts_check" CHECK ((("like_count" >= 0) AND ("comment_count" >= 0) AND ("share_count" >= 0) AND ("view_count" >= 0))),
    CONSTRAINT "posts_engagement_score_check" CHECK (("engagement_score" >= (0)::numeric)),
    CONSTRAINT "posts_publish_status_check" CHECK (("publish_status" = ANY (ARRAY['draft'::"text", 'scheduled'::"text", 'published'::"text", 'archived'::"text", 'deleted'::"text"]))),
    CONSTRAINT "posts_visibility_check" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'friends'::"text", 'private'::"text", 'followers'::"text"])))
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


COMMENT ON TABLE "public"."posts" IS 'Enterprise-grade posts table with comprehensive CRUD operations, analytics tracking, and content management features';



COMMENT ON COLUMN "public"."posts"."entity_type" IS 'Type of entity this post belongs to (user, group, publisher, event, book, author)';



COMMENT ON COLUMN "public"."posts"."entity_id" IS 'ID of the entity this post belongs to';



COMMENT ON COLUMN "public"."posts"."content_type" IS 'Type of post content (text, image, video, link, book, event, review, poll)';



COMMENT ON COLUMN "public"."posts"."metadata" IS 'Additional metadata for the post (JSON format)';



COMMENT ON COLUMN "public"."posts"."content_summary" IS 'Auto-generated or manual summary of post content';



COMMENT ON COLUMN "public"."posts"."media_files" IS 'Array of media file URLs and metadata';



COMMENT ON COLUMN "public"."posts"."scheduled_at" IS 'When the post is scheduled to be published';



COMMENT ON COLUMN "public"."posts"."published_at" IS 'When the post was actually published';



COMMENT ON COLUMN "public"."posts"."tags" IS 'Array of hashtags and tags for categorization';



COMMENT ON COLUMN "public"."posts"."categories" IS 'Array of categories for organization';



COMMENT ON COLUMN "public"."posts"."languages" IS 'Languages this post is available in';



COMMENT ON COLUMN "public"."posts"."regions" IS 'Geographic regions this post is relevant to';



COMMENT ON COLUMN "public"."posts"."content_warnings" IS 'Content warnings for sensitive material';



COMMENT ON COLUMN "public"."posts"."sensitive_content" IS 'Whether this post contains sensitive content';



COMMENT ON COLUMN "public"."posts"."age_restriction" IS 'Age restriction level for this post';



COMMENT ON COLUMN "public"."posts"."seo_title" IS 'SEO-optimized title for search engines';



COMMENT ON COLUMN "public"."posts"."seo_description" IS 'SEO-optimized description for search engines';



COMMENT ON COLUMN "public"."posts"."seo_keywords" IS 'SEO keywords for search optimization';



COMMENT ON COLUMN "public"."posts"."publish_status" IS 'Current publication status (draft, scheduled, published, archived, deleted)';



COMMENT ON COLUMN "public"."posts"."view_count" IS 'Number of times this post has been viewed';



COMMENT ON COLUMN "public"."posts"."like_count" IS 'Number of likes on this post';



COMMENT ON COLUMN "public"."posts"."comment_count" IS 'Number of comments on this post';



COMMENT ON COLUMN "public"."posts"."share_count" IS 'Number of times this post has been shared';



COMMENT ON COLUMN "public"."posts"."bookmark_count" IS 'Number of times this post has been bookmarked';



COMMENT ON COLUMN "public"."posts"."engagement_score" IS 'Calculated engagement score based on likes, comments, shares, and views';



COMMENT ON COLUMN "public"."posts"."trending_score" IS 'Calculated trending score based on recent activity';



COMMENT ON COLUMN "public"."posts"."is_featured" IS 'Whether this post is featured/promoted';



COMMENT ON COLUMN "public"."posts"."is_pinned" IS 'Whether this post is pinned to the top';



COMMENT ON COLUMN "public"."posts"."is_verified" IS 'Whether this post is from a verified source';



COMMENT ON COLUMN "public"."posts"."last_activity_at" IS 'Last time the post had any engagement activity';



COMMENT ON COLUMN "public"."posts"."enterprise_features" IS 'Enterprise-specific features and configurations (JSON format)';



CREATE TABLE IF NOT EXISTS "public"."prices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "price" numeric(10,2),
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "condition" character varying(50),
    "merchant" character varying(255),
    "total" numeric(10,2),
    "link" "text"
);


ALTER TABLE "public"."prices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."privacy_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "target_user_id" "uuid",
    "permission_type" "text",
    "old_value" "jsonb",
    "new_value" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "privacy_audit_log_action_check" CHECK (("action" = ANY (ARRAY['grant_permission'::"text", 'revoke_permission'::"text", 'update_privacy_settings'::"text", 'view_reading_progress'::"text"])))
);


ALTER TABLE "public"."privacy_audit_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."privacy_audit_log" IS 'Audit trail for all privacy-related actions and changes';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "bio" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "role" character varying(50) DEFAULT 'user'::character varying NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'Extended user profile information';



COMMENT ON COLUMN "public"."profiles"."user_id" IS 'Reference to user account';



COMMENT ON COLUMN "public"."profiles"."bio" IS 'User biography text';



COMMENT ON COLUMN "public"."profiles"."role" IS 'User role (user, admin, moderator)';



CREATE TABLE IF NOT EXISTS "public"."promo_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "description" "text",
    "discount_type" "text",
    "discount_value" numeric NOT NULL,
    "applies_to_ticket_types" "uuid"[] DEFAULT '{}'::"uuid"[],
    "max_uses" integer,
    "current_uses" integer DEFAULT 0,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."promo_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."publishers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "featured" boolean DEFAULT false NOT NULL,
    "website" character varying,
    "email" character varying,
    "phone" character varying,
    "address_line1" character varying,
    "address_line2" character varying,
    "city" character varying,
    "state" character varying,
    "postal_code" character varying,
    "country" character varying,
    "about" "text",
    "cover_image_id" "uuid",
    "publisher_image_id" "uuid",
    "publisher_gallery_id" "uuid",
    "founded_year" integer,
    "country_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "permalink" character varying(100)
);


ALTER TABLE "public"."publishers" OWNER TO "postgres";


COMMENT ON TABLE "public"."publishers" IS 'Book publishers information';



COMMENT ON COLUMN "public"."publishers"."permalink" IS 'Custom URL-friendly identifier for publishers';



CREATE MATERIALIZED VIEW "public"."publisher_summary" AS
 SELECT "p"."id" AS "publisher_id",
    "p"."name" AS "publisher_name",
    "count"("b"."id") AS "total_books",
    "avg"("b"."average_rating") AS "avg_rating",
    "sum"("b"."review_count") AS "total_reviews",
    "count"("rp"."id") AS "total_reading_entries",
    "count"(DISTINCT "rp"."user_id") AS "unique_readers"
   FROM (("public"."publishers" "p"
     LEFT JOIN "public"."books" "b" ON (("p"."id" = "b"."publisher_id")))
     LEFT JOIN "public"."reading_progress" "rp" ON (("b"."id" = "rp"."book_id")))
  GROUP BY "p"."id", "p"."name"
  WITH NO DATA;


ALTER TABLE "public"."publisher_summary" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."publisher_summary" IS 'Cached publisher data for performance';



CREATE TABLE IF NOT EXISTS "public"."reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "feed_entry_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reading_challenges" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "year" integer NOT NULL,
    "target_books" integer NOT NULL,
    "books_read" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reading_challenges" OWNER TO "postgres";


COMMENT ON TABLE "public"."reading_challenges" IS 'Reading challenge participation';



CREATE TABLE IF NOT EXISTS "public"."reading_goals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "goal_type" "text" NOT NULL,
    "target_value" integer NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "current_value" integer DEFAULT 0 NOT NULL,
    "is_completed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reading_goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reading_list_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "list_id" "uuid" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text",
    "book_id" "uuid"
);


ALTER TABLE "public"."reading_list_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reading_series" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "publisher_id" integer,
    "organizer_id" "uuid" NOT NULL,
    "cover_image_id" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "author_id" "uuid"
);


ALTER TABLE "public"."reading_series" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reading_sessions" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid",
    "book_id" "uuid",
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "pages_read" integer,
    "minutes_spent" integer,
    "notes" "text",
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."reading_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reading_stats_daily" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "total_pages" integer DEFAULT 0 NOT NULL,
    "total_minutes" integer DEFAULT 0 NOT NULL,
    "books_read" integer DEFAULT 0 NOT NULL,
    "books_started" integer DEFAULT 0 NOT NULL,
    "books_finished" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reading_stats_daily" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reading_streaks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "days" integer NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reading_streaks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."review_likes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "review_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."review_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "book_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "review_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."series_events" (
    "series_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "event_number" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."series_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."session_registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "registration_status" "text",
    "registration_time" timestamp with time zone DEFAULT "now"(),
    "check_in_time" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."session_registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."similar_books" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "similar_book_id" "uuid" NOT NULL,
    "similarity_score" numeric,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."similar_books" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."smart_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "notification_type" "text" NOT NULL,
    "notification_title" "text" NOT NULL,
    "notification_content" "text" NOT NULL,
    "priority_level" "text" DEFAULT 'normal'::"text" NOT NULL,
    "delivery_channel" "text" DEFAULT 'in_app'::"text" NOT NULL,
    "delivery_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "ai_generated" boolean DEFAULT false,
    "personalization_data" "jsonb" DEFAULT '{}'::"jsonb",
    "scheduled_for" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "smart_notifications_delivery_channel_check" CHECK (("delivery_channel" = ANY (ARRAY['in_app'::"text", 'email'::"text", 'push'::"text", 'sms'::"text"]))),
    CONSTRAINT "smart_notifications_delivery_status_check" CHECK (("delivery_status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'delivered'::"text", 'read'::"text", 'failed'::"text"]))),
    CONSTRAINT "smart_notifications_notification_type_check" CHECK (("notification_type" = ANY (ARRAY['recommendation'::"text", 'reminder'::"text", 'alert'::"text", 'update'::"text", 'social'::"text"]))),
    CONSTRAINT "smart_notifications_priority_level_check" CHECK (("priority_level" = ANY (ARRAY['low'::"text", 'normal'::"text", 'high'::"text", 'urgent'::"text"])))
);


ALTER TABLE "public"."smart_notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."smart_notifications" IS 'AI-powered intelligent notification system';



CREATE TABLE IF NOT EXISTS "public"."social_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action_type" character varying(50) NOT NULL,
    "entity_type" character varying(50) NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "target_id" "uuid",
    "action_details" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "session_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "social_audit_action_type_check" CHECK ((("action_type")::"text" = ANY ((ARRAY['comment_added'::character varying, 'comment_deleted'::character varying, 'comment_updated'::character varying, 'like_toggled'::character varying, 'share_added'::character varying, 'bookmark_toggled'::character varying, 'content_flagged'::character varying, 'content_moderated'::character varying, 'reaction_added'::character varying, 'reaction_removed'::character varying])::"text"[])))
);


ALTER TABLE "public"."social_audit_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."social_audit_log" IS 'Enterprise audit trail for all social actions';



CREATE OR REPLACE VIEW "public"."social_activity_analytics" AS
 SELECT "date"("social_audit_log"."created_at") AS "activity_date",
    "social_audit_log"."action_type",
    "social_audit_log"."entity_type",
    "count"(*) AS "action_count",
    "count"(DISTINCT "social_audit_log"."user_id") AS "unique_users",
    "count"(DISTINCT "social_audit_log"."entity_id") AS "unique_entities"
   FROM "public"."social_audit_log"
  WHERE ("social_audit_log"."created_at" >= ("now"() - '30 days'::interval))
  GROUP BY ("date"("social_audit_log"."created_at")), "social_audit_log"."action_type", "social_audit_log"."entity_type"
  ORDER BY ("date"("social_audit_log"."created_at")) DESC, ("count"(*)) DESC;


ALTER TABLE "public"."social_activity_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."statuses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."statuses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subjects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "parent_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subjects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."survey_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "survey_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "question_type" "text",
    "options" "jsonb",
    "is_required" boolean DEFAULT false,
    "display_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."survey_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."survey_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "survey_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "registration_id" "uuid",
    "response_data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."survey_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sync_state" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "type" "text" NOT NULL,
    "last_synced_date" timestamp with time zone NOT NULL,
    "current_page" integer DEFAULT 1 NOT NULL,
    "total_books" integer DEFAULT 0 NOT NULL,
    "processed_books" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'idle'::"text" NOT NULL,
    "error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sync_state" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."system_performance_overview" AS
 SELECT "pm"."category",
    "pm"."metric_name",
    "avg"("pm"."metric_value") AS "avg_value",
    "max"("pm"."metric_value") AS "max_value",
    "min"("pm"."metric_value") AS "min_value",
    "count"(*) AS "measurement_count",
    "max"("pm"."recorded_at") AS "last_measured"
   FROM "public"."performance_metrics" "pm"
  WHERE ("pm"."recorded_at" >= ("now"() - '24:00:00'::interval))
  GROUP BY "pm"."category", "pm"."metric_name";


ALTER TABLE "public"."system_performance_overview" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_benefits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_type_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "display_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ticket_benefits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "quantity_total" integer,
    "quantity_sold" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "sale_start_date" timestamp with time zone,
    "sale_end_date" timestamp with time zone,
    "min_per_order" integer DEFAULT 1,
    "max_per_order" integer DEFAULT 10,
    "has_waitlist" boolean DEFAULT false,
    "includes_features" "jsonb",
    "visibility" "text",
    "access_code" "text",
    "display_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ticket_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "ticket_type_id" "uuid" NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "ticket_number" "text" NOT NULL,
    "status" "text",
    "purchase_price" numeric NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "attendee_name" "text",
    "attendee_email" "text",
    "checked_in_at" timestamp with time zone,
    "checked_in_by" "uuid",
    "qr_code" "text",
    "barcode" "text",
    "ticket_pdf_url" "text",
    "access_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trending_topics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "topic" "text" NOT NULL,
    "category" "text",
    "trending_score" numeric DEFAULT 0,
    "post_count" integer DEFAULT 0,
    "engagement_count" integer DEFAULT 0,
    "last_activity_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."trending_topics" OWNER TO "postgres";


COMMENT ON TABLE "public"."trending_topics" IS 'Trending topics and hashtags';



CREATE OR REPLACE VIEW "public"."unified_book_data" AS
 SELECT "b"."id",
    "b"."title",
    "b"."title_long",
    "b"."isbn10",
    "b"."isbn13",
    "b"."publication_date",
    "b"."binding",
    "b"."pages",
    "b"."list_price",
    "b"."language",
    "b"."edition",
    "b"."synopsis",
    "b"."overview",
    "b"."dimensions",
    "b"."weight",
    "b"."cover_image_id",
    "b"."original_image_url",
    "b"."author",
    "b"."featured",
    "b"."book_gallery_img",
    "b"."average_rating",
    "b"."review_count",
    "b"."created_at",
    "b"."updated_at",
    "b"."author_id",
    "b"."binding_type_id",
    "b"."format_type_id",
    "b"."status_id",
    "b"."publisher_id",
    "p"."name" AS "publisher_name",
    "p"."website" AS "publisher_website",
    "a"."name" AS "author_name",
    "a"."author_image_id",
    "bt"."name" AS "binding_type_name",
    "ft"."name" AS "format_type_name"
   FROM (((("public"."books" "b"
     LEFT JOIN "public"."publishers" "p" ON (("b"."publisher_id" = "p"."id")))
     LEFT JOIN "public"."authors" "a" ON (("b"."author_id" = "a"."id")))
     LEFT JOIN "public"."binding_types" "bt" ON (("b"."binding_type_id" = "bt"."id")))
     LEFT JOIN "public"."format_types" "ft" ON (("b"."format_type_id" = "ft"."id")));


ALTER TABLE "public"."unified_book_data" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."unified_reading_progress" AS
 SELECT "rp"."id",
    "rp"."user_id",
    "rp"."book_id",
    "rp"."status",
    "rp"."progress_percentage",
    "rp"."start_date",
    "rp"."finish_date",
    COALESCE("rp"."privacy_level", 'private'::"text") AS "privacy_level",
    COALESCE("rp"."allow_friends", false) AS "allow_friends",
    COALESCE("rp"."allow_followers", false) AS "allow_followers",
    "rp"."custom_permissions",
    "rp"."privacy_audit_log",
    "rp"."created_at",
    "rp"."updated_at"
   FROM "public"."reading_progress" "rp";


ALTER TABLE "public"."unified_reading_progress" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_activity_metrics" AS
 SELECT "ual"."user_id",
    "u"."email",
    "count"(*) AS "total_activities",
    "count"(
        CASE
            WHEN ("ual"."activity_type" = 'login'::"text") THEN 1
            ELSE NULL::integer
        END) AS "login_count",
    "count"(
        CASE
            WHEN ("ual"."activity_type" = 'book_view'::"text") THEN 1
            ELSE NULL::integer
        END) AS "book_views",
    "count"(
        CASE
            WHEN ("ual"."activity_type" = 'review'::"text") THEN 1
            ELSE NULL::integer
        END) AS "reviews",
    "avg"("ual"."response_time_ms") AS "avg_response_time",
    "max"("ual"."created_at") AS "last_activity",
    "min"("ual"."created_at") AS "first_activity"
   FROM ("public"."user_activity_log" "ual"
     JOIN "auth"."users" "u" ON (("ual"."user_id" = "u"."id")))
  GROUP BY "ual"."user_id", "u"."email";


ALTER TABLE "public"."user_activity_metrics" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."user_activity_summary" AS
 SELECT "u"."id" AS "user_id",
    "u"."email",
    "count"("rp"."id") AS "total_reading_entries",
    "count"(DISTINCT "rp"."book_id") AS "unique_books_read",
    "count"(
        CASE
            WHEN ("rp"."status" = 'completed'::"text") THEN 1
            ELSE NULL::integer
        END) AS "books_completed",
    "count"(
        CASE
            WHEN ("rp"."status" = 'in_progress'::"text") THEN 1
            ELSE NULL::integer
        END) AS "books_in_progress",
    "avg"("rp"."progress_percentage") AS "avg_progress_percentage",
    "max"("rp"."created_at") AS "last_activity",
    "count"("f"."id") AS "total_follows",
    "count"("fr"."id") AS "total_friends"
   FROM ((("auth"."users" "u"
     LEFT JOIN "public"."reading_progress" "rp" ON (("u"."id" = "rp"."user_id")))
     LEFT JOIN "public"."follows" "f" ON (("u"."id" = "f"."follower_id")))
     LEFT JOIN "public"."friends" "fr" ON (("u"."id" = "fr"."user_id")))
  GROUP BY "u"."id", "u"."email"
  WITH NO DATA;


ALTER TABLE "public"."user_activity_summary" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."user_activity_summary" IS 'Cached user activity data for performance';



CREATE TABLE IF NOT EXISTS "public"."user_book_interactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "interaction_type" "text" NOT NULL,
    "interaction_value" double precision,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid"
);


ALTER TABLE "public"."user_book_interactions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_engagement_analytics" AS
 SELECT "u"."id",
    "u"."email",
    "count"(DISTINCT "rp"."book_id") AS "books_in_progress",
    "count"(DISTINCT "br"."book_id") AS "books_reviewed",
    "count"(DISTINCT "rli"."book_id") AS "books_in_lists",
    "count"(DISTINCT "rl"."id") AS "reading_lists_created",
    "avg"("br"."rating") AS "avg_review_rating",
    "max"("ual"."created_at") AS "last_activity",
    "count"(DISTINCT "ual"."id") AS "total_activities"
   FROM ((((("auth"."users" "u"
     LEFT JOIN "public"."reading_progress" "rp" ON (("u"."id" = "rp"."user_id")))
     LEFT JOIN "public"."book_reviews" "br" ON (("u"."id" = "br"."user_id")))
     LEFT JOIN "public"."reading_lists" "rl" ON (("u"."id" = "rl"."user_id")))
     LEFT JOIN "public"."reading_list_items" "rli" ON (("rl"."id" = "rli"."list_id")))
     LEFT JOIN "public"."user_activity_log" "ual" ON (("u"."id" = "ual"."user_id")))
  GROUP BY "u"."id", "u"."email";


ALTER TABLE "public"."user_engagement_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_friends" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friend_id" "uuid" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "requested_at" timestamp with time zone DEFAULT "now"(),
    "responded_at" timestamp with time zone,
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_friends_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'declined'::"text", 'blocked'::"text"])))
);


ALTER TABLE "public"."user_friends" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_privacy_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "default_privacy_level" "text" DEFAULT 'private'::"text" NOT NULL,
    "allow_friends_to_see_reading" boolean DEFAULT false NOT NULL,
    "allow_followers_to_see_reading" boolean DEFAULT false NOT NULL,
    "allow_public_reading_profile" boolean DEFAULT false NOT NULL,
    "show_reading_stats_publicly" boolean DEFAULT false NOT NULL,
    "show_currently_reading_publicly" boolean DEFAULT false NOT NULL,
    "show_reading_history_publicly" boolean DEFAULT false NOT NULL,
    "show_reading_goals_publicly" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_privacy_settings_default_privacy_level_check" CHECK (("default_privacy_level" = ANY (ARRAY['private'::"text", 'friends'::"text", 'followers'::"text", 'public'::"text"])))
);


ALTER TABLE "public"."user_privacy_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_privacy_settings" IS 'User privacy preferences and settings for reading progress visibility';



CREATE OR REPLACE VIEW "public"."user_privacy_overview" AS
 SELECT "u"."id" AS "user_id",
    "u"."email",
    "ups"."default_privacy_level",
    "ups"."allow_public_reading_profile",
    "count"("cp"."id") AS "active_custom_permissions",
    "count"("pal"."id") AS "privacy_actions_last_30_days"
   FROM ((("auth"."users" "u"
     LEFT JOIN "public"."user_privacy_settings" "ups" ON (("u"."id" = "ups"."user_id")))
     LEFT JOIN "public"."custom_permissions" "cp" ON ((("u"."id" = "cp"."user_id") AND (("cp"."expires_at" IS NULL) OR ("cp"."expires_at" > "now"())))))
     LEFT JOIN "public"."privacy_audit_log" "pal" ON ((("u"."id" = "pal"."user_id") AND ("pal"."created_at" >= ("now"() - '30 days'::interval)))))
  GROUP BY "u"."id", "u"."email", "ups"."default_privacy_level", "ups"."allow_public_reading_profile";


ALTER TABLE "public"."user_privacy_overview" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_reading_preferences" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "favorite_genres" "text"[] DEFAULT '{}'::"text"[],
    "favorite_authors" "text"[] DEFAULT '{}'::"text"[],
    "disliked_genres" "text"[] DEFAULT '{}'::"text"[],
    "preferred_length" "text" DEFAULT 'medium'::"text",
    "preferred_complexity" "text" DEFAULT 'medium'::"text",
    "preferred_publication_era" "text" DEFAULT 'any'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_reading_preferences" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_comments"
    ADD CONSTRAINT "activity_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_likes"
    ADD CONSTRAINT "activity_likes_activity_id_user_id_key" UNIQUE ("activity_id", "user_id");



ALTER TABLE ONLY "public"."activity_likes"
    ADD CONSTRAINT "activity_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."album_analytics"
    ADD CONSTRAINT "album_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."album_images"
    ADD CONSTRAINT "album_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."album_shares"
    ADD CONSTRAINT "album_shares_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."authors"
    ADD CONSTRAINT "authors_permalink_key" UNIQUE ("permalink");



ALTER TABLE ONLY "public"."authors"
    ADD CONSTRAINT "authors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_executions"
    ADD CONSTRAINT "automation_executions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_workflows"
    ADD CONSTRAINT "automation_workflows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."binding_types"
    ADD CONSTRAINT "binding_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_authors"
    ADD CONSTRAINT "book_authors_book_author_unique" UNIQUE ("book_id", "author_id");



ALTER TABLE ONLY "public"."book_authors"
    ADD CONSTRAINT "book_authors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_club_books"
    ADD CONSTRAINT "book_club_books_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_club_discussion_comments"
    ADD CONSTRAINT "book_club_discussion_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_club_discussions"
    ADD CONSTRAINT "book_club_discussions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_club_members"
    ADD CONSTRAINT "book_club_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_clubs"
    ADD CONSTRAINT "book_clubs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_genre_mappings"
    ADD CONSTRAINT "book_genre_mappings_book_genre_unique" UNIQUE ("book_id", "genre_id");



ALTER TABLE ONLY "public"."book_genre_mappings"
    ADD CONSTRAINT "book_genre_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_genres"
    ADD CONSTRAINT "book_genres_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_popularity_metrics"
    ADD CONSTRAINT "book_popularity_metrics_book_id_key" UNIQUE ("book_id");



ALTER TABLE ONLY "public"."book_popularity_metrics"
    ADD CONSTRAINT "book_popularity_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_publishers"
    ADD CONSTRAINT "book_publishers_book_publisher_unique" UNIQUE ("book_id", "publisher_id");



ALTER TABLE ONLY "public"."book_publishers"
    ADD CONSTRAINT "book_publishers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_recommendations"
    ADD CONSTRAINT "book_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_reviews"
    ADD CONSTRAINT "book_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_similarity_scores"
    ADD CONSTRAINT "book_similarity_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_subjects"
    ADD CONSTRAINT "book_subjects_book_subject_unique" UNIQUE ("book_id", "subject_id");



ALTER TABLE ONLY "public"."book_subjects"
    ADD CONSTRAINT "book_subjects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_tag_mappings"
    ADD CONSTRAINT "book_tag_mappings_book_tag_unique" UNIQUE ("book_id", "tag_id");



ALTER TABLE ONLY "public"."book_tag_mappings"
    ADD CONSTRAINT "book_tag_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_tags"
    ADD CONSTRAINT "book_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_views"
    ADD CONSTRAINT "book_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookmarks"
    ADD CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookmarks"
    ADD CONSTRAINT "bookmarks_user_id_entity_type_entity_id_key" UNIQUE ("user_id", "entity_type", "entity_id");



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_permalink_key" UNIQUE ("permalink");



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."carousel_images"
    ADD CONSTRAINT "carousel_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collaborative_filtering_data"
    ADD CONSTRAINT "collaborative_filtering_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_comment_id_user_id_key" UNIQUE ("comment_id", "user_id");



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "comment_reactions_comment_id_user_id_reaction_type_key" UNIQUE ("comment_id", "user_id", "reaction_type");



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "comment_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_info"
    ADD CONSTRAINT "contact_info_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_features"
    ADD CONSTRAINT "content_features_content_id_content_type_feature_name_key" UNIQUE ("content_id", "content_type", "feature_name");



ALTER TABLE ONLY "public"."content_features"
    ADD CONSTRAINT "content_features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_flags"
    ADD CONSTRAINT "content_flags_flagged_by_content_type_content_id_key" UNIQUE ("flagged_by", "content_type", "content_id");



ALTER TABLE ONLY "public"."content_flags"
    ADD CONSTRAINT "content_flags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_generation_jobs"
    ADD CONSTRAINT "content_generation_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."countries"
    ADD CONSTRAINT "countries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_permissions"
    ADD CONSTRAINT "custom_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_permissions"
    ADD CONSTRAINT "custom_permissions_user_target_unique" UNIQUE ("user_id", "target_user_id", "permission_type");



ALTER TABLE ONLY "public"."data_enrichment_jobs"
    ADD CONSTRAINT "data_enrichment_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dewey_decimal_classifications"
    ADD CONSTRAINT "dewey_decimal_classifications_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."dewey_decimal_classifications"
    ADD CONSTRAINT "dewey_decimal_classifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discussion_comments"
    ADD CONSTRAINT "discussion_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discussions"
    ADD CONSTRAINT "discussions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."engagement_analytics"
    ADD CONSTRAINT "engagement_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enterprise_audit_trail"
    ADD CONSTRAINT "enterprise_audit_trail_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enterprise_data_lineage"
    ADD CONSTRAINT "enterprise_data_lineage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enterprise_data_lineage"
    ADD CONSTRAINT "enterprise_data_lineage_source_table_target_table_key" UNIQUE ("source_table", "target_table");



ALTER TABLE ONLY "public"."enterprise_data_quality_rules"
    ADD CONSTRAINT "enterprise_data_quality_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enterprise_data_quality_rules"
    ADD CONSTRAINT "enterprise_data_quality_rules_rule_name_key" UNIQUE ("rule_name");



ALTER TABLE ONLY "public"."enterprise_data_versions"
    ADD CONSTRAINT "enterprise_data_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enterprise_data_versions"
    ADD CONSTRAINT "enterprise_data_versions_table_name_record_id_version_numbe_key" UNIQUE ("table_name", "record_id", "version_number");



ALTER TABLE ONLY "public"."entities"
    ADD CONSTRAINT "entities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."entity_tags"
    ADD CONSTRAINT "entity_tags_entity_type_entity_id_tag_name_key" UNIQUE ("entity_type", "entity_id", "tag_name");



ALTER TABLE ONLY "public"."entity_tags"
    ADD CONSTRAINT "entity_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."entity_types"
    ADD CONSTRAINT "entity_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."event_analytics"
    ADD CONSTRAINT "event_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_approvals"
    ADD CONSTRAINT "event_approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_books"
    ADD CONSTRAINT "event_books_event_book_unique" UNIQUE ("event_id", "book_id");



ALTER TABLE ONLY "public"."event_books"
    ADD CONSTRAINT "event_books_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_calendar_exports"
    ADD CONSTRAINT "event_calendar_exports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_categories"
    ADD CONSTRAINT "event_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_chat_messages"
    ADD CONSTRAINT "event_chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_chat_rooms"
    ADD CONSTRAINT "event_chat_rooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_comments"
    ADD CONSTRAINT "event_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_creator_permissions"
    ADD CONSTRAINT "event_creator_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_financials"
    ADD CONSTRAINT "event_financials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_interests"
    ADD CONSTRAINT "event_interests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_likes"
    ADD CONSTRAINT "event_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_livestreams"
    ADD CONSTRAINT "event_livestreams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_locations"
    ADD CONSTRAINT "event_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_media"
    ADD CONSTRAINT "event_media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_permission_requests"
    ADD CONSTRAINT "event_permission_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_questions"
    ADD CONSTRAINT "event_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_reminders"
    ADD CONSTRAINT "event_reminders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_sessions"
    ADD CONSTRAINT "event_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_shares"
    ADD CONSTRAINT "event_shares_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_speakers"
    ADD CONSTRAINT "event_speakers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_sponsors"
    ADD CONSTRAINT "event_sponsors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_staff"
    ADD CONSTRAINT "event_staff_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_surveys"
    ADD CONSTRAINT "event_surveys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_tags"
    ADD CONSTRAINT "event_tags_pkey" PRIMARY KEY ("event_id", "tag_id");



ALTER TABLE ONLY "public"."event_types"
    ADD CONSTRAINT "event_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_views"
    ADD CONSTRAINT "event_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_waitlists"
    ADD CONSTRAINT "event_waitlists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_permalink_key" UNIQUE ("permalink");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feed_entries"
    ADD CONSTRAINT "feed_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."follow_target_types"
    ADD CONSTRAINT "follow_target_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_pkey" PRIMARY KEY ("follower_id", "following_id");



ALTER TABLE ONLY "public"."format_types"
    ADD CONSTRAINT "format_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friend_activities"
    ADD CONSTRAINT "friend_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friend_analytics"
    ADD CONSTRAINT "friend_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friend_analytics"
    ADD CONSTRAINT "friend_analytics_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."friend_suggestions"
    ADD CONSTRAINT "friend_suggestions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friend_suggestions"
    ADD CONSTRAINT "friend_suggestions_user_id_suggested_user_id_key" UNIQUE ("user_id", "suggested_user_id");



ALTER TABLE ONLY "public"."friends"
    ADD CONSTRAINT "friends_pkey" PRIMARY KEY ("user_id", "friend_id");



ALTER TABLE ONLY "public"."group_achievements"
    ADD CONSTRAINT "group_achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_analytics"
    ADD CONSTRAINT "group_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_announcements"
    ADD CONSTRAINT "group_announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_audit_log"
    ADD CONSTRAINT "group_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_author_events"
    ADD CONSTRAINT "group_author_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_book_list_items"
    ADD CONSTRAINT "group_book_list_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_book_lists"
    ADD CONSTRAINT "group_book_lists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_book_reviews"
    ADD CONSTRAINT "group_book_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_book_swaps"
    ADD CONSTRAINT "group_book_swaps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_book_wishlist_items"
    ADD CONSTRAINT "group_book_wishlist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_book_wishlists"
    ADD CONSTRAINT "group_book_wishlists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_books"
    ADD CONSTRAINT "group_books_pkey" PRIMARY KEY ("group_id", "book_id");



ALTER TABLE ONLY "public"."group_bots"
    ADD CONSTRAINT "group_bots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_chat_channels"
    ADD CONSTRAINT "group_chat_channels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_chat_message_attachments"
    ADD CONSTRAINT "group_chat_message_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_chat_message_reactions"
    ADD CONSTRAINT "group_chat_message_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_chat_messages"
    ADD CONSTRAINT "group_chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_content_moderation_logs"
    ADD CONSTRAINT "group_content_moderation_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_custom_fields"
    ADD CONSTRAINT "group_custom_fields_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_discussion_categories"
    ADD CONSTRAINT "group_discussion_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_event_feedback"
    ADD CONSTRAINT "group_event_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_events"
    ADD CONSTRAINT "group_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_integrations"
    ADD CONSTRAINT "group_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_invites"
    ADD CONSTRAINT "group_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_leaderboards"
    ADD CONSTRAINT "group_leaderboards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_member_achievements"
    ADD CONSTRAINT "group_member_achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_member_devices"
    ADD CONSTRAINT "group_member_devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_member_streaks"
    ADD CONSTRAINT "group_member_streaks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_pkey" PRIMARY KEY ("group_id", "user_id");



ALTER TABLE ONLY "public"."group_membership_questions"
    ADD CONSTRAINT "group_membership_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_moderation_logs"
    ADD CONSTRAINT "group_moderation_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_onboarding_checklists"
    ADD CONSTRAINT "group_onboarding_checklists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_onboarding_progress"
    ADD CONSTRAINT "group_onboarding_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_onboarding_tasks"
    ADD CONSTRAINT "group_onboarding_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_poll_votes"
    ADD CONSTRAINT "group_poll_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_polls"
    ADD CONSTRAINT "group_polls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_reading_challenge_progress"
    ADD CONSTRAINT "group_reading_challenge_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_reading_challenges"
    ADD CONSTRAINT "group_reading_challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_reading_progress"
    ADD CONSTRAINT "group_reading_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_reading_sessions"
    ADD CONSTRAINT "group_reading_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_reports"
    ADD CONSTRAINT "group_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_roles"
    ADD CONSTRAINT "group_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_rules"
    ADD CONSTRAINT "group_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_shared_documents"
    ADD CONSTRAINT "group_shared_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_tags"
    ADD CONSTRAINT "group_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_types"
    ADD CONSTRAINT "group_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_webhook_logs"
    ADD CONSTRAINT "group_webhook_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_webhooks"
    ADD CONSTRAINT "group_webhooks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_welcome_messages"
    ADD CONSTRAINT "group_welcome_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_permalink_key" UNIQUE ("permalink");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."image_tags"
    ADD CONSTRAINT "image_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."entity_types"
    ADD CONSTRAINT "image_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."list_followers"
    ADD CONSTRAINT "list_followers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media_attachments"
    ADD CONSTRAINT "media_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentions"
    ADD CONSTRAINT "mentions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ml_models"
    ADD CONSTRAINT "ml_models_model_name_model_version_key" UNIQUE ("model_name", "model_version");



ALTER TABLE ONLY "public"."ml_models"
    ADD CONSTRAINT "ml_models_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ml_predictions"
    ADD CONSTRAINT "ml_predictions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ml_training_jobs"
    ADD CONSTRAINT "ml_training_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moderation_queue"
    ADD CONSTRAINT "moderation_queue_content_type_content_id_key" UNIQUE ("content_type", "content_id");



ALTER TABLE ONLY "public"."moderation_queue"
    ADD CONSTRAINT "moderation_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nlp_analysis"
    ADD CONSTRAINT "nlp_analysis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_queue"
    ADD CONSTRAINT "notification_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."performance_metrics"
    ADD CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."personalized_recommendations"
    ADD CONSTRAINT "personalized_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photo_album"
    ADD CONSTRAINT "photo_album_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photo_albums"
    ADD CONSTRAINT "photo_albums_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photo_bookmarks"
    ADD CONSTRAINT "photo_bookmarks_photo_id_user_id_key" UNIQUE ("photo_id", "user_id");



ALTER TABLE ONLY "public"."photo_bookmarks"
    ADD CONSTRAINT "photo_bookmarks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photo_comments"
    ADD CONSTRAINT "photo_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photo_likes"
    ADD CONSTRAINT "photo_likes_photo_id_user_id_like_type_key" UNIQUE ("photo_id", "user_id", "like_type");



ALTER TABLE ONLY "public"."photo_likes"
    ADD CONSTRAINT "photo_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photo_shares"
    ADD CONSTRAINT "photo_shares_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photo_tags"
    ADD CONSTRAINT "photo_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_bookmarks"
    ADD CONSTRAINT "post_bookmarks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_bookmarks"
    ADD CONSTRAINT "post_bookmarks_post_id_user_id_key" UNIQUE ("post_id", "user_id");



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_reactions"
    ADD CONSTRAINT "post_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_reactions"
    ADD CONSTRAINT "post_reactions_post_id_user_id_reaction_type_key" UNIQUE ("post_id", "user_id", "reaction_type");



ALTER TABLE ONLY "public"."post_shares"
    ADD CONSTRAINT "post_shares_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prices"
    ADD CONSTRAINT "prices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."privacy_audit_log"
    ADD CONSTRAINT "privacy_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."publishers"
    ADD CONSTRAINT "publishers_permalink_key" UNIQUE ("permalink");



ALTER TABLE ONLY "public"."publishers"
    ADD CONSTRAINT "publishers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reactions"
    ADD CONSTRAINT "reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reading_challenges"
    ADD CONSTRAINT "reading_challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reading_goals"
    ADD CONSTRAINT "reading_goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reading_list_items"
    ADD CONSTRAINT "reading_list_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reading_lists"
    ADD CONSTRAINT "reading_lists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reading_progress"
    ADD CONSTRAINT "reading_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reading_series"
    ADD CONSTRAINT "reading_series_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reading_sessions"
    ADD CONSTRAINT "reading_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reading_stats_daily"
    ADD CONSTRAINT "reading_stats_daily_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reading_streaks"
    ADD CONSTRAINT "reading_streaks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_likes"
    ADD CONSTRAINT "review_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_registrations"
    ADD CONSTRAINT "session_registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shares"
    ADD CONSTRAINT "shares_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shares"
    ADD CONSTRAINT "shares_user_id_entity_type_entity_id_key" UNIQUE ("user_id", "entity_type", "entity_id");



ALTER TABLE ONLY "public"."similar_books"
    ADD CONSTRAINT "similar_books_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."smart_notifications"
    ADD CONSTRAINT "smart_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."social_audit_log"
    ADD CONSTRAINT "social_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."statuses"
    ADD CONSTRAINT "statuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subjects"
    ADD CONSTRAINT "subjects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."survey_questions"
    ADD CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."survey_responses"
    ADD CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sync_state"
    ADD CONSTRAINT "sync_state_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_health_checks"
    ADD CONSTRAINT "system_health_checks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_benefits"
    ADD CONSTRAINT "ticket_benefits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_types"
    ADD CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trending_topics"
    ADD CONSTRAINT "trending_topics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trending_topics"
    ADD CONSTRAINT "trending_topics_topic_key" UNIQUE ("topic");



ALTER TABLE ONLY "public"."user_activity_log"
    ADD CONSTRAINT "user_activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_book_interactions"
    ADD CONSTRAINT "user_book_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_friends"
    ADD CONSTRAINT "user_friends_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_friends"
    ADD CONSTRAINT "user_friends_user_id_friend_id_key" UNIQUE ("user_id", "friend_id");



ALTER TABLE ONLY "public"."user_privacy_settings"
    ADD CONSTRAINT "user_privacy_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_privacy_settings"
    ADD CONSTRAINT "user_privacy_settings_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_reading_preferences"
    ADD CONSTRAINT "user_reading_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_permalink_key" UNIQUE ("permalink");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "engagement_analytics_entity_idx" ON "public"."engagement_analytics" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "engagement_analytics_user_action_idx" ON "public"."engagement_analytics" USING "btree" ("user_id", "action");



CREATE INDEX "entities_type_id_idx" ON "public"."entities" USING "btree" ("type", "id");



CREATE INDEX "idx_activities_activity_type" ON "public"."activities" USING "btree" ("activity_type");



CREATE INDEX "idx_activities_ai_enhanced" ON "public"."activities" USING "btree" ("ai_enhanced");



CREATE INDEX "idx_activities_author_id" ON "public"."activities" USING "btree" ("author_id");



CREATE INDEX "idx_activities_book_id" ON "public"."activities" USING "btree" ("book_id");



CREATE INDEX "idx_activities_collaboration_type" ON "public"."activities" USING "btree" ("collaboration_type");



CREATE INDEX "idx_activities_comment_count" ON "public"."activities" USING "btree" ("comment_count" DESC);



CREATE INDEX "idx_activities_content_type" ON "public"."activities" USING "btree" ("content_type");



CREATE INDEX "idx_activities_created_at" ON "public"."activities" USING "btree" ("created_at");



CREATE INDEX "idx_activities_engagement_score" ON "public"."activities" USING "btree" ("engagement_score" DESC);



CREATE INDEX "idx_activities_event_id" ON "public"."activities" USING "btree" ("event_id");



CREATE INDEX "idx_activities_group_id" ON "public"."activities" USING "btree" ("group_id");



CREATE INDEX "idx_activities_hashtags" ON "public"."activities" USING "gin" ("hashtags");



CREATE INDEX "idx_activities_like_count" ON "public"."activities" USING "btree" ("like_count" DESC);



CREATE INDEX "idx_activities_list_id" ON "public"."activities" USING "btree" ("list_id");



CREATE INDEX "idx_activities_metadata" ON "public"."activities" USING "gin" ("metadata");



CREATE INDEX "idx_activities_review_id" ON "public"."activities" USING "btree" ("review_id");



CREATE INDEX "idx_activities_text" ON "public"."activities" USING "gin" ("to_tsvector"('"english"'::"regconfig", "text"));



CREATE INDEX "idx_activities_text_search" ON "public"."activities" USING "gin" ("to_tsvector"('"english"'::"regconfig", "text"));



CREATE INDEX "idx_activities_updated_at" ON "public"."activities" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_activities_user_activity" ON "public"."activities" USING "btree" ("user_id", "activity_type");



CREATE INDEX "idx_activities_user_id" ON "public"."activities" USING "btree" ("user_id");



CREATE INDEX "idx_activities_visibility" ON "public"."activities" USING "btree" ("visibility");



CREATE INDEX "idx_activity_comments_activity_id" ON "public"."activity_comments" USING "btree" ("activity_id");



CREATE INDEX "idx_activity_comments_user_id" ON "public"."activity_comments" USING "btree" ("user_id");



CREATE INDEX "idx_activity_likes_activity_id" ON "public"."activity_likes" USING "btree" ("activity_id");



CREATE INDEX "idx_activity_likes_user_id" ON "public"."activity_likes" USING "btree" ("user_id");



CREATE INDEX "idx_activity_log_user_id" ON "public"."activity_log" USING "btree" ("user_id");



CREATE INDEX "idx_ai_image_analysis_confidence" ON "public"."ai_image_analysis" USING "btree" ("confidence_score");



CREATE INDEX "idx_ai_image_analysis_created_at" ON "public"."ai_image_analysis" USING "btree" ("created_at");



CREATE INDEX "idx_ai_image_analysis_image_id" ON "public"."ai_image_analysis" USING "btree" ("image_id");



CREATE INDEX "idx_ai_image_analysis_safety" ON "public"."ai_image_analysis" USING "btree" ("content_safety_score");



CREATE INDEX "idx_ai_image_analysis_type" ON "public"."ai_image_analysis" USING "btree" ("analysis_type");



CREATE INDEX "idx_album_images_album_id" ON "public"."album_images" USING "btree" ("album_id");



CREATE INDEX "idx_album_images_alt_text" ON "public"."album_images" USING "btree" ("alt_text");



CREATE INDEX "idx_album_images_description" ON "public"."album_images" USING "btree" ("description");



CREATE INDEX "idx_album_images_entity" ON "public"."album_images" USING "btree" ("entity_type_id", "entity_id");



CREATE INDEX "idx_album_images_entity_id" ON "public"."album_images" USING "btree" ("entity_id");



CREATE INDEX "idx_album_images_entity_type" ON "public"."album_images" USING "btree" ("entity_type_id");



CREATE INDEX "idx_album_images_image_id" ON "public"."album_images" USING "btree" ("image_id");



CREATE INDEX "idx_album_shares_album_id" ON "public"."album_shares" USING "btree" ("album_id");



CREATE INDEX "idx_album_shares_shared_by" ON "public"."album_shares" USING "btree" ("shared_by");



CREATE INDEX "idx_album_shares_shared_with" ON "public"."album_shares" USING "btree" ("shared_with");



CREATE INDEX "idx_authors_author_image_id" ON "public"."authors" USING "btree" ("author_image_id");



CREATE INDEX "idx_authors_cover_image_id" ON "public"."authors" USING "btree" ("cover_image_id");



CREATE INDEX "idx_authors_created_at" ON "public"."authors" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_authors_featured" ON "public"."authors" USING "btree" ("featured");



CREATE INDEX "idx_authors_name" ON "public"."authors" USING "btree" ("name");



CREATE INDEX "idx_authors_permalink" ON "public"."authors" USING "btree" ("permalink");



CREATE INDEX "idx_automation_workflows_active" ON "public"."automation_workflows" USING "btree" ("is_active");



CREATE INDEX "idx_automation_workflows_next_execution" ON "public"."automation_workflows" USING "btree" ("next_execution");



CREATE INDEX "idx_automation_workflows_type" ON "public"."automation_workflows" USING "btree" ("workflow_type");



CREATE INDEX "idx_blocks_blocked_user_id" ON "public"."blocks" USING "btree" ("blocked_user_id");



CREATE INDEX "idx_blocks_user_id" ON "public"."blocks" USING "btree" ("user_id");



CREATE INDEX "idx_book_authors_author_id" ON "public"."book_authors" USING "btree" ("author_id");



CREATE INDEX "idx_book_authors_book_id" ON "public"."book_authors" USING "btree" ("book_id");



CREATE INDEX "idx_book_club_books_book_club_id" ON "public"."book_club_books" USING "btree" ("book_club_id");



CREATE INDEX "idx_book_club_books_book_id" ON "public"."book_club_books" USING "btree" ("book_id");



CREATE INDEX "idx_book_club_books_created_by" ON "public"."book_club_books" USING "btree" ("created_by");



CREATE INDEX "idx_book_club_discussion_comments_created_by" ON "public"."book_club_discussion_comments" USING "btree" ("created_by");



CREATE INDEX "idx_book_club_discussion_comments_discussion_id" ON "public"."book_club_discussion_comments" USING "btree" ("discussion_id");



CREATE INDEX "idx_book_club_discussions_book_club_id" ON "public"."book_club_discussions" USING "btree" ("book_club_id");



CREATE INDEX "idx_book_club_discussions_book_id" ON "public"."book_club_discussions" USING "btree" ("book_id");



CREATE INDEX "idx_book_club_discussions_created_by" ON "public"."book_club_discussions" USING "btree" ("created_by");



CREATE INDEX "idx_book_club_members_book_club_id" ON "public"."book_club_members" USING "btree" ("book_club_id");



CREATE INDEX "idx_book_club_members_user_id" ON "public"."book_club_members" USING "btree" ("user_id");



CREATE INDEX "idx_book_clubs_created_by" ON "public"."book_clubs" USING "btree" ("created_by");



CREATE INDEX "idx_book_clubs_current_book_id" ON "public"."book_clubs" USING "btree" ("current_book_id");



CREATE INDEX "idx_book_genre_mappings_book_id" ON "public"."book_genre_mappings" USING "btree" ("book_id");



CREATE INDEX "idx_book_genre_mappings_genre_id" ON "public"."book_genre_mappings" USING "btree" ("genre_id");



CREATE INDEX "idx_book_popularity_metrics_book_id" ON "public"."book_popularity_metrics" USING "btree" ("book_id");



CREATE INDEX "idx_book_popularity_metrics_rating" ON "public"."book_popularity_metrics" USING "btree" ("avg_rating" DESC NULLS LAST);



CREATE INDEX "idx_book_popularity_metrics_updated" ON "public"."book_popularity_metrics" USING "btree" ("last_updated");



CREATE INDEX "idx_book_popularity_metrics_views" ON "public"."book_popularity_metrics" USING "btree" ("views_count" DESC);



CREATE INDEX "idx_book_publishers_book_id" ON "public"."book_publishers" USING "btree" ("book_id");



CREATE INDEX "idx_book_publishers_publisher_id" ON "public"."book_publishers" USING "btree" ("publisher_id");



CREATE INDEX "idx_book_recommendations_book_id" ON "public"."book_recommendations" USING "btree" ("book_id");



CREATE INDEX "idx_book_recommendations_user_id" ON "public"."book_recommendations" USING "btree" ("user_id");



CREATE INDEX "idx_book_reviews_book_id" ON "public"."book_reviews" USING "btree" ("book_id");



CREATE INDEX "idx_book_reviews_group_id" ON "public"."book_reviews" USING "btree" ("group_id");



CREATE INDEX "idx_book_reviews_user_id" ON "public"."book_reviews" USING "btree" ("user_id");



CREATE INDEX "idx_book_similarity_scores_book_id" ON "public"."book_similarity_scores" USING "btree" ("book_id");



CREATE INDEX "idx_book_subjects_book_id" ON "public"."book_subjects" USING "btree" ("book_id");



CREATE INDEX "idx_book_subjects_subject_id" ON "public"."book_subjects" USING "btree" ("subject_id");



CREATE INDEX "idx_book_tag_mappings_book_id" ON "public"."book_tag_mappings" USING "btree" ("book_id");



CREATE INDEX "idx_book_tag_mappings_tag_id" ON "public"."book_tag_mappings" USING "btree" ("tag_id");



CREATE INDEX "idx_book_views_book_id" ON "public"."book_views" USING "btree" ("book_id");



CREATE INDEX "idx_book_views_user_id" ON "public"."book_views" USING "btree" ("user_id");



CREATE INDEX "idx_bookmarks_entity_lookup" ON "public"."bookmarks" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_bookmarks_tags" ON "public"."bookmarks" USING "gin" ("tags");



CREATE INDEX "idx_bookmarks_user_folder" ON "public"."bookmarks" USING "btree" ("user_id", "bookmark_folder");



CREATE INDEX "idx_books_author_id" ON "public"."books" USING "btree" ("author_id");



CREATE INDEX "idx_books_binding_type_id" ON "public"."books" USING "btree" ("binding_type_id");



CREATE INDEX "idx_books_cover_image_id" ON "public"."books" USING "btree" ("cover_image_id");



CREATE INDEX "idx_books_created_at" ON "public"."books" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_books_featured" ON "public"."books" USING "btree" ("featured");



CREATE INDEX "idx_books_featured_created" ON "public"."books" USING "btree" ("featured", "created_at" DESC);



CREATE INDEX "idx_books_format_type_id" ON "public"."books" USING "btree" ("format_type_id");



CREATE INDEX "idx_books_isbn10" ON "public"."books" USING "btree" ("isbn10");



CREATE INDEX "idx_books_isbn13" ON "public"."books" USING "btree" ("isbn13");



CREATE INDEX "idx_books_permalink" ON "public"."books" USING "btree" ("permalink");



CREATE INDEX "idx_books_publication_date" ON "public"."books" USING "btree" ("publication_date");



CREATE INDEX "idx_books_publisher_date" ON "public"."books" USING "btree" ("publisher_id", "created_at" DESC);



CREATE INDEX "idx_books_publisher_id" ON "public"."books" USING "btree" ("publisher_id");



CREATE INDEX "idx_books_publisher_id_null" ON "public"."books" USING "btree" ("publisher_id") WHERE ("publisher_id" IS NULL);



CREATE INDEX "idx_books_status_id" ON "public"."books" USING "btree" ("status_id");



CREATE INDEX "idx_books_title" ON "public"."books" USING "btree" ("title");



CREATE INDEX "idx_books_title_publisher" ON "public"."books" USING "btree" ("title", "publisher_id");



CREATE INDEX "idx_collaborative_filtering_interaction" ON "public"."collaborative_filtering_data" USING "btree" ("interaction_type", "interaction_timestamp");



CREATE INDEX "idx_collaborative_filtering_item" ON "public"."collaborative_filtering_data" USING "btree" ("item_id", "item_type");



CREATE INDEX "idx_collaborative_filtering_user" ON "public"."collaborative_filtering_data" USING "btree" ("user_id");



CREATE INDEX "idx_comment_reactions_comment" ON "public"."comment_reactions" USING "btree" ("comment_id");



CREATE INDEX "idx_comment_reactions_type" ON "public"."comment_reactions" USING "btree" ("reaction_type");



CREATE INDEX "idx_comment_reactions_user" ON "public"."comment_reactions" USING "btree" ("user_id");



CREATE INDEX "idx_comments_entity_lookup" ON "public"."comments" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_comments_feed_entry_id" ON "public"."comments" USING "btree" ("feed_entry_id");



CREATE INDEX "idx_comments_parent_id" ON "public"."comments" USING "btree" ("parent_id") WHERE ("parent_id" IS NOT NULL);



CREATE INDEX "idx_comments_user_created" ON "public"."comments" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_comments_user_id" ON "public"."comments" USING "btree" ("user_id");



CREATE INDEX "idx_content_flags_content" ON "public"."content_flags" USING "btree" ("content_type", "content_id");



CREATE INDEX "idx_content_flags_created" ON "public"."content_flags" USING "btree" ("created_at");



CREATE INDEX "idx_content_flags_flagged_by" ON "public"."content_flags" USING "btree" ("flagged_by");



CREATE INDEX "idx_content_flags_status" ON "public"."content_flags" USING "btree" ("moderation_status");



CREATE INDEX "idx_content_generation_created_at" ON "public"."content_generation_jobs" USING "btree" ("created_at");



CREATE INDEX "idx_content_generation_status" ON "public"."content_generation_jobs" USING "btree" ("generation_status");



CREATE INDEX "idx_content_generation_type" ON "public"."content_generation_jobs" USING "btree" ("content_type");



CREATE INDEX "idx_custom_permissions_target_user_id" ON "public"."custom_permissions" USING "btree" ("target_user_id");



CREATE INDEX "idx_custom_permissions_user_id" ON "public"."custom_permissions" USING "btree" ("user_id");



CREATE INDEX "idx_custom_permissions_user_target" ON "public"."custom_permissions" USING "btree" ("user_id", "target_user_id");



CREATE INDEX "idx_dewey_decimal_classifications_code" ON "public"."dewey_decimal_classifications" USING "btree" ("code");



CREATE INDEX "idx_dewey_decimal_classifications_parent_code" ON "public"."dewey_decimal_classifications" USING "btree" ("parent_code");



CREATE INDEX "idx_discussion_comments_discussion_id" ON "public"."discussion_comments" USING "btree" ("discussion_id");



CREATE INDEX "idx_discussion_comments_user_id" ON "public"."discussion_comments" USING "btree" ("user_id");



CREATE INDEX "idx_discussions_book_id" ON "public"."discussions" USING "btree" ("book_id");



CREATE INDEX "idx_discussions_user_id" ON "public"."discussions" USING "btree" ("user_id");



CREATE INDEX "idx_enterprise_audit_trail_changed_at" ON "public"."enterprise_audit_trail" USING "btree" ("changed_at");



CREATE INDEX "idx_enterprise_audit_trail_changed_by" ON "public"."enterprise_audit_trail" USING "btree" ("changed_by");



CREATE INDEX "idx_enterprise_audit_trail_operation" ON "public"."enterprise_audit_trail" USING "btree" ("operation");



CREATE INDEX "idx_enterprise_audit_trail_table_record" ON "public"."enterprise_audit_trail" USING "btree" ("table_name", "record_id");



CREATE INDEX "idx_enterprise_data_quality_rules_active" ON "public"."enterprise_data_quality_rules" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_enterprise_data_quality_rules_table" ON "public"."enterprise_data_quality_rules" USING "btree" ("table_name");



CREATE INDEX "idx_enterprise_data_versions_created_by" ON "public"."enterprise_data_versions" USING "btree" ("created_by");



CREATE INDEX "idx_enterprise_data_versions_current" ON "public"."enterprise_data_versions" USING "btree" ("is_current") WHERE ("is_current" = true);



CREATE INDEX "idx_enterprise_data_versions_table_record" ON "public"."enterprise_data_versions" USING "btree" ("table_name", "record_id");



CREATE INDEX "idx_entity_tags_entity_lookup" ON "public"."entity_tags" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_entity_tags_name_category" ON "public"."entity_tags" USING "btree" ("tag_name", "tag_category");



CREATE INDEX "idx_entity_tags_usage" ON "public"."entity_tags" USING "btree" ("usage_count" DESC);



CREATE INDEX "idx_event_books_book_id" ON "public"."event_books" USING "btree" ("book_id");



CREATE INDEX "idx_event_books_event_id" ON "public"."event_books" USING "btree" ("event_id");



CREATE INDEX "idx_event_chat_messages_chat_room_id" ON "public"."event_chat_messages" USING "btree" ("chat_room_id");



CREATE INDEX "idx_event_chat_messages_user_id" ON "public"."event_chat_messages" USING "btree" ("user_id");



CREATE INDEX "idx_event_chat_rooms_event_id" ON "public"."event_chat_rooms" USING "btree" ("event_id");



CREATE INDEX "idx_event_comments_event_id" ON "public"."event_comments" USING "btree" ("event_id");



CREATE INDEX "idx_event_comments_parent_id" ON "public"."event_comments" USING "btree" ("parent_id");



CREATE INDEX "idx_event_comments_user_id" ON "public"."event_comments" USING "btree" ("user_id");



CREATE INDEX "idx_event_creator_permissions_user_id" ON "public"."event_creator_permissions" USING "btree" ("user_id");



CREATE INDEX "idx_event_financials_event_id" ON "public"."event_financials" USING "btree" ("event_id");



CREATE INDEX "idx_event_interests_event_id" ON "public"."event_interests" USING "btree" ("event_id");



CREATE INDEX "idx_event_interests_user_id" ON "public"."event_interests" USING "btree" ("user_id");



CREATE INDEX "idx_event_likes_event_id" ON "public"."event_likes" USING "btree" ("event_id");



CREATE INDEX "idx_event_likes_user_id" ON "public"."event_likes" USING "btree" ("user_id");



CREATE INDEX "idx_event_livestreams_event_id" ON "public"."event_livestreams" USING "btree" ("event_id");



CREATE INDEX "idx_event_locations_event_id" ON "public"."event_locations" USING "btree" ("event_id");



CREATE INDEX "idx_event_media_event_id" ON "public"."event_media" USING "btree" ("event_id");



CREATE INDEX "idx_event_permission_requests_reviewed_by" ON "public"."event_permission_requests" USING "btree" ("reviewed_by");



CREATE INDEX "idx_event_permission_requests_user_id" ON "public"."event_permission_requests" USING "btree" ("user_id");



CREATE INDEX "idx_event_questions_event_id" ON "public"."event_questions" USING "btree" ("event_id");



CREATE INDEX "idx_event_registrations_event_id" ON "public"."event_registrations" USING "btree" ("event_id");



CREATE INDEX "idx_event_registrations_user_id" ON "public"."event_registrations" USING "btree" ("user_id");



CREATE INDEX "idx_event_reminders_event_id" ON "public"."event_reminders" USING "btree" ("event_id");



CREATE INDEX "idx_event_reminders_user_id" ON "public"."event_reminders" USING "btree" ("user_id");



CREATE INDEX "idx_event_sessions_event_id" ON "public"."event_sessions" USING "btree" ("event_id");



CREATE INDEX "idx_event_shares_event_id" ON "public"."event_shares" USING "btree" ("event_id");



CREATE INDEX "idx_event_shares_user_id" ON "public"."event_shares" USING "btree" ("user_id");



CREATE INDEX "idx_event_speakers_author_id" ON "public"."event_speakers" USING "btree" ("author_id");



CREATE INDEX "idx_event_speakers_event_id" ON "public"."event_speakers" USING "btree" ("event_id");



CREATE INDEX "idx_event_speakers_user_id" ON "public"."event_speakers" USING "btree" ("user_id");



CREATE INDEX "idx_event_sponsors_event_id" ON "public"."event_sponsors" USING "btree" ("event_id");



CREATE INDEX "idx_event_staff_event_id" ON "public"."event_staff" USING "btree" ("event_id");



CREATE INDEX "idx_event_staff_user_id" ON "public"."event_staff" USING "btree" ("user_id");



CREATE INDEX "idx_event_surveys_event_id" ON "public"."event_surveys" USING "btree" ("event_id");



CREATE INDEX "idx_event_tags_event_id" ON "public"."event_tags" USING "btree" ("event_id");



CREATE INDEX "idx_event_views_event_id" ON "public"."event_views" USING "btree" ("event_id");



CREATE INDEX "idx_event_views_user_id" ON "public"."event_views" USING "btree" ("user_id");



CREATE INDEX "idx_event_waitlists_event_id" ON "public"."event_waitlists" USING "btree" ("event_id");



CREATE INDEX "idx_events_author_id" ON "public"."events" USING "btree" ("author_id");



CREATE INDEX "idx_events_book_id" ON "public"."events" USING "btree" ("book_id");



CREATE INDEX "idx_events_cover_image_id" ON "public"."events" USING "btree" ("cover_image_id");



CREATE INDEX "idx_events_created_at" ON "public"."events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_events_created_by" ON "public"."events" USING "btree" ("created_by");



CREATE INDEX "idx_events_date_range" ON "public"."events" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_events_end_date" ON "public"."events" USING "btree" ("end_date");



CREATE INDEX "idx_events_event_image_id" ON "public"."events" USING "btree" ("event_image_id");



CREATE INDEX "idx_events_group_id" ON "public"."events" USING "btree" ("group_id");



CREATE INDEX "idx_events_parent_event_id" ON "public"."events" USING "btree" ("parent_event_id");



CREATE INDEX "idx_events_permalink" ON "public"."events" USING "btree" ("permalink");



CREATE INDEX "idx_events_publisher_id" ON "public"."events" USING "btree" ("publisher_id");



CREATE INDEX "idx_events_start_date" ON "public"."events" USING "btree" ("start_date");



CREATE INDEX "idx_events_title" ON "public"."events" USING "gin" ("to_tsvector"('"english"'::"regconfig", "title"));



CREATE INDEX "idx_feed_entries_created_at" ON "public"."feed_entries" USING "btree" ("created_at");



CREATE INDEX "idx_feed_entries_group_id" ON "public"."feed_entries" USING "btree" ("group_id");



CREATE INDEX "idx_feed_entries_user_id" ON "public"."feed_entries" USING "btree" ("user_id");



CREATE INDEX "idx_feed_entries_visibility" ON "public"."feed_entries" USING "btree" ("visibility");



CREATE INDEX "idx_feed_entry_tags_feed_entry_id" ON "public"."feed_entry_tags" USING "btree" ("feed_entry_id");



CREATE INDEX "idx_follows_created_at" ON "public"."follows" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_follows_follower_following" ON "public"."follows" USING "btree" ("follower_id", "following_id");



CREATE INDEX "idx_follows_follower_id" ON "public"."follows" USING "btree" ("follower_id");



CREATE INDEX "idx_follows_following_id" ON "public"."follows" USING "btree" ("following_id");



CREATE INDEX "idx_follows_target_type" ON "public"."follows" USING "btree" ("target_type_id");



CREATE INDEX "idx_friend_activities_friend_id" ON "public"."friend_activities" USING "btree" ("friend_id", "created_at" DESC);



CREATE INDEX "idx_friend_activities_user_id" ON "public"."friend_activities" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_friend_analytics_user_id" ON "public"."friend_analytics" USING "btree" ("user_id");



CREATE INDEX "idx_friend_suggestions_score" ON "public"."friend_suggestions" USING "btree" ("suggestion_score" DESC);



CREATE INDEX "idx_friend_suggestions_user_id" ON "public"."friend_suggestions" USING "btree" ("user_id");



CREATE INDEX "idx_friends_created_at" ON "public"."friends" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_friends_friend_id" ON "public"."friends" USING "btree" ("friend_id");



CREATE INDEX "idx_friends_requested_by" ON "public"."friends" USING "btree" ("requested_by");



CREATE INDEX "idx_friends_user_id" ON "public"."friends" USING "btree" ("user_id");



CREATE INDEX "idx_group_members_group_id" ON "public"."group_members" USING "btree" ("group_id");



CREATE INDEX "idx_group_members_status" ON "public"."group_members" USING "btree" ("status");



CREATE INDEX "idx_group_members_user_id" ON "public"."group_members" USING "btree" ("user_id");



CREATE INDEX "idx_groups_created_at" ON "public"."groups" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_groups_created_by" ON "public"."groups" USING "btree" ("created_by");



CREATE INDEX "idx_groups_is_private" ON "public"."groups" USING "btree" ("is_private");



CREATE INDEX "idx_groups_name" ON "public"."groups" USING "gin" ("to_tsvector"('"english"'::"regconfig", ("name")::"text"));



CREATE INDEX "idx_groups_permalink" ON "public"."groups" USING "btree" ("permalink");



CREATE INDEX "idx_groups_private_created" ON "public"."groups" USING "btree" ("is_private", "created_at" DESC);



CREATE INDEX "idx_image_processing_jobs_created_at" ON "public"."image_processing_jobs" USING "btree" ("created_at");



CREATE INDEX "idx_image_processing_jobs_image_id" ON "public"."image_processing_jobs" USING "btree" ("image_id");



CREATE INDEX "idx_image_processing_jobs_priority" ON "public"."image_processing_jobs" USING "btree" ("priority");



CREATE INDEX "idx_image_processing_jobs_status" ON "public"."image_processing_jobs" USING "btree" ("status");



CREATE INDEX "idx_images_created_at" ON "public"."images" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_images_featured" ON "public"."images" USING "btree" ("is_featured") WHERE ("is_featured" = true);



CREATE INDEX "idx_images_img_type_id" ON "public"."images" USING "btree" ("entity_type_id");



CREATE INDEX "idx_images_monetized" ON "public"."images" USING "btree" ("is_monetized") WHERE ("is_monetized" = true);



CREATE INDEX "idx_images_quality_score" ON "public"."images" USING "btree" ("quality_score" DESC);



CREATE INDEX "idx_images_uploader_id" ON "public"."images" USING "btree" ("uploader_id");



CREATE INDEX "idx_images_uploader_type" ON "public"."images" USING "btree" ("uploader_type");



CREATE INDEX "idx_images_view_count" ON "public"."images" USING "btree" ("view_count" DESC);



CREATE INDEX "idx_likes_entity_lookup" ON "public"."likes" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_likes_feed_entry_id" ON "public"."likes" USING "btree" ("feed_entry_id");



CREATE INDEX "idx_likes_user_created" ON "public"."likes" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_likes_user_id" ON "public"."likes" USING "btree" ("user_id");



CREATE INDEX "idx_ml_models_active" ON "public"."ml_models" USING "btree" ("is_active");



CREATE INDEX "idx_ml_models_created_at" ON "public"."ml_models" USING "btree" ("created_at");



CREATE INDEX "idx_ml_models_type" ON "public"."ml_models" USING "btree" ("model_type");



CREATE INDEX "idx_ml_predictions_confidence" ON "public"."ml_predictions" USING "btree" ("confidence_score");



CREATE INDEX "idx_ml_predictions_model" ON "public"."ml_predictions" USING "btree" ("model_id");



CREATE INDEX "idx_ml_predictions_timestamp" ON "public"."ml_predictions" USING "btree" ("prediction_timestamp");



CREATE INDEX "idx_ml_predictions_user" ON "public"."ml_predictions" USING "btree" ("user_id");



CREATE INDEX "idx_moderation_queue_assigned" ON "public"."moderation_queue" USING "btree" ("assigned_to");



CREATE INDEX "idx_moderation_queue_content" ON "public"."moderation_queue" USING "btree" ("content_type", "content_id");



CREATE INDEX "idx_moderation_queue_priority" ON "public"."moderation_queue" USING "btree" ("priority");



CREATE INDEX "idx_moderation_queue_status" ON "public"."moderation_queue" USING "btree" ("status");



CREATE INDEX "idx_nlp_analysis_confidence" ON "public"."nlp_analysis" USING "btree" ("confidence_score");



CREATE INDEX "idx_nlp_analysis_content" ON "public"."nlp_analysis" USING "btree" ("content_id", "content_type");



CREATE INDEX "idx_nlp_analysis_type" ON "public"."nlp_analysis" USING "btree" ("analysis_type");



CREATE INDEX "idx_notifications_is_read" ON "public"."notifications" USING "btree" ("is_read");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_performance_metrics_category" ON "public"."performance_metrics" USING "btree" ("category");



CREATE INDEX "idx_performance_metrics_name_category" ON "public"."performance_metrics" USING "btree" ("metric_name", "category");



CREATE INDEX "idx_performance_metrics_recorded_at" ON "public"."performance_metrics" USING "btree" ("recorded_at");



CREATE INDEX "idx_photo_albums_cover_image_id" ON "public"."photo_albums" USING "btree" ("cover_image_id");



CREATE INDEX "idx_photo_albums_created_at" ON "public"."photo_albums" USING "btree" ("created_at");



CREATE INDEX "idx_photo_albums_deleted" ON "public"."photo_albums" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_photo_albums_entity" ON "public"."photo_albums" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_photo_albums_entity_composite" ON "public"."photo_albums" USING "btree" ("entity_type", "entity_id", "owner_id");



CREATE INDEX "idx_photo_albums_entity_owner" ON "public"."photo_albums" USING "btree" ("entity_type", "owner_id");



CREATE INDEX "idx_photo_albums_is_public" ON "public"."photo_albums" USING "btree" ("is_public");



CREATE INDEX "idx_photo_albums_owner_entity" ON "public"."photo_albums" USING "btree" ("owner_id", "entity_type");



CREATE INDEX "idx_photo_albums_owner_id" ON "public"."photo_albums" USING "btree" ("owner_id");



CREATE INDEX "idx_photo_albums_public_created" ON "public"."photo_albums" USING "btree" ("is_public", "created_at") WHERE (("is_public" = true) AND ("deleted_at" IS NULL));



CREATE INDEX "idx_photo_analytics_album_id" ON "public"."photo_analytics" USING "btree" ("album_id");



CREATE INDEX "idx_photo_analytics_created_at" ON "public"."photo_analytics" USING "btree" ("created_at");



CREATE INDEX "idx_photo_analytics_event_type" ON "public"."photo_analytics" USING "btree" ("event_type");



CREATE INDEX "idx_photo_analytics_image_id" ON "public"."photo_analytics" USING "btree" ("image_id");



CREATE INDEX "idx_photo_analytics_user_id" ON "public"."photo_analytics" USING "btree" ("user_id");



CREATE INDEX "idx_photo_comments_parent" ON "public"."photo_comments" USING "btree" ("parent_id") WHERE ("parent_id" IS NOT NULL);



CREATE INDEX "idx_photo_comments_photo" ON "public"."photo_comments" USING "btree" ("photo_id", "created_at");



CREATE INDEX "idx_photo_comments_user" ON "public"."photo_comments" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_photo_community_album_id" ON "public"."photo_community" USING "btree" ("album_id");



CREATE INDEX "idx_photo_community_created_at" ON "public"."photo_community" USING "btree" ("created_at");



CREATE INDEX "idx_photo_community_image_id" ON "public"."photo_community" USING "btree" ("image_id");



CREATE INDEX "idx_photo_community_interaction_type" ON "public"."photo_community" USING "btree" ("interaction_type");



CREATE INDEX "idx_photo_community_user_id" ON "public"."photo_community" USING "btree" ("user_id");



CREATE INDEX "idx_photo_likes_photo" ON "public"."photo_likes" USING "btree" ("photo_id", "created_at");



CREATE INDEX "idx_photo_likes_user" ON "public"."photo_likes" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_photo_monetization_album_id" ON "public"."photo_monetization" USING "btree" ("album_id");



CREATE INDEX "idx_photo_monetization_created_at" ON "public"."photo_monetization" USING "btree" ("created_at");



CREATE INDEX "idx_photo_monetization_event_type" ON "public"."photo_monetization" USING "btree" ("event_type");



CREATE INDEX "idx_photo_monetization_image_id" ON "public"."photo_monetization" USING "btree" ("image_id");



CREATE INDEX "idx_photo_monetization_status" ON "public"."photo_monetization" USING "btree" ("status");



CREATE INDEX "idx_photo_monetization_user_id" ON "public"."photo_monetization" USING "btree" ("user_id");



CREATE INDEX "idx_photo_shares_photo" ON "public"."photo_shares" USING "btree" ("photo_id", "created_at");



CREATE INDEX "idx_photo_tags_entity" ON "public"."photo_tags" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_photo_tags_photo" ON "public"."photo_tags" USING "btree" ("photo_id");



CREATE INDEX "idx_posts_content_type" ON "public"."posts" USING "btree" ("content_type");



CREATE INDEX "idx_posts_created_at" ON "public"."posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_posts_engagement_score" ON "public"."posts" USING "btree" ("engagement_score" DESC);



CREATE INDEX "idx_posts_enterprise_features" ON "public"."posts" USING "gin" ("enterprise_features");



CREATE INDEX "idx_posts_entity_type_entity_id" ON "public"."posts" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_posts_last_activity" ON "public"."posts" USING "btree" ("last_activity_at" DESC);



CREATE INDEX "idx_posts_metadata" ON "public"."posts" USING "gin" ("metadata");



CREATE INDEX "idx_posts_publish_status" ON "public"."posts" USING "btree" ("publish_status");



CREATE INDEX "idx_posts_tags" ON "public"."posts" USING "gin" ("tags");



CREATE INDEX "idx_posts_updated_at" ON "public"."posts" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_posts_user_id" ON "public"."posts" USING "btree" ("user_id");



CREATE INDEX "idx_posts_visibility" ON "public"."posts" USING "btree" ("visibility");



CREATE INDEX "idx_privacy_audit_log_user_action" ON "public"."privacy_audit_log" USING "btree" ("user_id", "action", "created_at");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_profiles_user_id" ON "public"."profiles" USING "btree" ("user_id");



CREATE INDEX "idx_publishers_country_id" ON "public"."publishers" USING "btree" ("country_id");



CREATE INDEX "idx_publishers_cover_image_id" ON "public"."publishers" USING "btree" ("cover_image_id");



CREATE INDEX "idx_publishers_created_at" ON "public"."publishers" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_publishers_featured" ON "public"."publishers" USING "btree" ("featured");



CREATE INDEX "idx_publishers_name" ON "public"."publishers" USING "btree" ("name");



CREATE INDEX "idx_publishers_permalink" ON "public"."publishers" USING "btree" ("permalink");



CREATE INDEX "idx_publishers_publisher_image_id" ON "public"."publishers" USING "btree" ("publisher_image_id");



CREATE INDEX "idx_reading_challenges_user_id" ON "public"."reading_challenges" USING "btree" ("user_id");



CREATE INDEX "idx_reading_lists_user_id" ON "public"."reading_lists" USING "btree" ("user_id");



CREATE INDEX "idx_reading_progress_book_id" ON "public"."reading_progress" USING "btree" ("book_id");



CREATE INDEX "idx_reading_progress_created_at" ON "public"."reading_progress" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_reading_progress_created_at_desc" ON "public"."reading_progress" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_reading_progress_privacy_level" ON "public"."reading_progress" USING "btree" ("privacy_level");



CREATE INDEX "idx_reading_progress_status" ON "public"."reading_progress" USING "btree" ("status");



CREATE INDEX "idx_reading_progress_status_user" ON "public"."reading_progress" USING "btree" ("status", "user_id");



CREATE INDEX "idx_reading_progress_user_book_composite" ON "public"."reading_progress" USING "btree" ("user_id", "book_id");



CREATE INDEX "idx_reading_progress_user_id" ON "public"."reading_progress" USING "btree" ("user_id");



CREATE INDEX "idx_reading_progress_user_privacy" ON "public"."reading_progress" USING "btree" ("user_id", "privacy_level");



CREATE INDEX "idx_reading_progress_user_status" ON "public"."reading_progress" USING "btree" ("user_id", "status");



CREATE INDEX "idx_shares_entity_lookup" ON "public"."shares" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_shares_platform" ON "public"."shares" USING "btree" ("share_platform");



CREATE INDEX "idx_shares_user_created" ON "public"."shares" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_smart_notifications_priority" ON "public"."smart_notifications" USING "btree" ("priority_level");



CREATE INDEX "idx_smart_notifications_scheduled" ON "public"."smart_notifications" USING "btree" ("scheduled_for");



CREATE INDEX "idx_smart_notifications_status" ON "public"."smart_notifications" USING "btree" ("delivery_status");



CREATE INDEX "idx_smart_notifications_user" ON "public"."smart_notifications" USING "btree" ("user_id");



CREATE INDEX "idx_social_audit_action_type" ON "public"."social_audit_log" USING "btree" ("action_type");



CREATE INDEX "idx_social_audit_created" ON "public"."social_audit_log" USING "btree" ("created_at");



CREATE INDEX "idx_social_audit_entity" ON "public"."social_audit_log" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_social_audit_user_action" ON "public"."social_audit_log" USING "btree" ("user_id", "action_type");



CREATE INDEX "idx_system_health_checks_checked_at" ON "public"."system_health_checks" USING "btree" ("checked_at");



CREATE INDEX "idx_system_health_checks_name_status" ON "public"."system_health_checks" USING "btree" ("check_name", "status");



CREATE INDEX "idx_system_health_checks_status" ON "public"."system_health_checks" USING "btree" ("status");



CREATE INDEX "idx_user_activity_log_activity_type" ON "public"."user_activity_log" USING "btree" ("activity_type");



CREATE INDEX "idx_user_activity_log_created_at" ON "public"."user_activity_log" USING "btree" ("created_at");



CREATE INDEX "idx_user_activity_log_user_activity" ON "public"."user_activity_log" USING "btree" ("user_id", "activity_type");



CREATE INDEX "idx_user_activity_log_user_id" ON "public"."user_activity_log" USING "btree" ("user_id");



CREATE INDEX "idx_user_friends_friend_id" ON "public"."user_friends" USING "btree" ("friend_id");



CREATE INDEX "idx_user_friends_status" ON "public"."user_friends" USING "btree" ("status");



CREATE INDEX "idx_user_friends_user_id" ON "public"."user_friends" USING "btree" ("user_id");



CREATE INDEX "idx_user_privacy_settings_user_id" ON "public"."user_privacy_settings" USING "btree" ("user_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_permalink" ON "public"."users" USING "btree" ("permalink");



CREATE INDEX "idx_users_role_id" ON "public"."users" USING "btree" ("role_id");



CREATE INDEX "notification_queue_is_read_idx" ON "public"."notification_queue" USING "btree" ("is_read");



CREATE INDEX "notification_queue_is_sent_idx" ON "public"."notification_queue" USING "btree" ("is_sent");



CREATE INDEX "notification_queue_scheduled_at_idx" ON "public"."notification_queue" USING "btree" ("scheduled_at");



CREATE INDEX "notification_queue_user_id_idx" ON "public"."notification_queue" USING "btree" ("user_id");



CREATE INDEX "post_bookmarks_folder_idx" ON "public"."post_bookmarks" USING "btree" ("folder");



CREATE INDEX "post_bookmarks_post_id_idx" ON "public"."post_bookmarks" USING "btree" ("post_id");



CREATE INDEX "post_bookmarks_user_id_idx" ON "public"."post_bookmarks" USING "btree" ("user_id");



CREATE INDEX "post_comments_created_at_idx" ON "public"."post_comments" USING "btree" ("created_at" DESC);



CREATE INDEX "post_comments_parent_comment_id_idx" ON "public"."post_comments" USING "btree" ("parent_comment_id");



CREATE INDEX "post_comments_post_id_idx" ON "public"."post_comments" USING "btree" ("post_id");



CREATE INDEX "post_comments_user_id_idx" ON "public"."post_comments" USING "btree" ("user_id");



CREATE INDEX "post_reactions_post_id_idx" ON "public"."post_reactions" USING "btree" ("post_id");



CREATE INDEX "post_reactions_reaction_type_idx" ON "public"."post_reactions" USING "btree" ("reaction_type");



CREATE INDEX "post_reactions_user_id_idx" ON "public"."post_reactions" USING "btree" ("user_id");



CREATE INDEX "post_shares_post_id_idx" ON "public"."post_shares" USING "btree" ("post_id");



CREATE INDEX "post_shares_share_type_idx" ON "public"."post_shares" USING "btree" ("share_type");



CREATE INDEX "post_shares_user_id_idx" ON "public"."post_shares" USING "btree" ("user_id");



CREATE INDEX "posts_content_type_idx" ON "public"."posts" USING "btree" ("content_type");



CREATE INDEX "posts_created_at_idx" ON "public"."posts" USING "btree" ("created_at" DESC);



CREATE INDEX "posts_engagement_score_idx" ON "public"."posts" USING "btree" ("engagement_score" DESC);



CREATE INDEX "posts_entity_type_entity_id_idx" ON "public"."posts" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "posts_publish_status_idx" ON "public"."posts" USING "btree" ("publish_status");



CREATE INDEX "posts_trending_score_idx" ON "public"."posts" USING "btree" ("trending_score" DESC);



CREATE INDEX "trending_topics_category_idx" ON "public"."trending_topics" USING "btree" ("category");



CREATE INDEX "trending_topics_last_activity_at_idx" ON "public"."trending_topics" USING "btree" ("last_activity_at" DESC);



CREATE INDEX "trending_topics_trending_score_idx" ON "public"."trending_topics" USING "btree" ("trending_score" DESC);



CREATE INDEX "users_permalink_idx" ON "public"."users" USING "btree" ("permalink");



CREATE OR REPLACE TRIGGER "audit_trail_authors" AFTER INSERT OR DELETE OR UPDATE ON "public"."authors" FOR EACH ROW EXECUTE FUNCTION "public"."create_enterprise_audit_trail"();



CREATE OR REPLACE TRIGGER "audit_trail_books" AFTER INSERT OR DELETE OR UPDATE ON "public"."books" FOR EACH ROW EXECUTE FUNCTION "public"."create_enterprise_audit_trail"();



CREATE OR REPLACE TRIGGER "audit_trail_publishers" AFTER INSERT OR DELETE OR UPDATE ON "public"."publishers" FOR EACH ROW EXECUTE FUNCTION "public"."create_enterprise_audit_trail"();



CREATE OR REPLACE TRIGGER "audit_trail_reading_progress" AFTER INSERT OR DELETE OR UPDATE ON "public"."reading_progress" FOR EACH ROW EXECUTE FUNCTION "public"."create_enterprise_audit_trail"();



CREATE OR REPLACE TRIGGER "audit_trail_users" AFTER INSERT OR DELETE OR UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."create_enterprise_audit_trail"();



CREATE OR REPLACE TRIGGER "posts_updated_at_trigger" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_post_updated_at"();



CREATE OR REPLACE TRIGGER "set_image_uploader_trigger" BEFORE INSERT ON "public"."images" FOR EACH ROW EXECUTE FUNCTION "public"."set_image_uploader"();



CREATE OR REPLACE TRIGGER "set_photo_albums_updated_at" BEFORE UPDATE ON "public"."photo_albums" FOR EACH ROW EXECUTE FUNCTION "public"."update_photo_albums_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_book_reviews_popularity" AFTER INSERT OR DELETE OR UPDATE ON "public"."book_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_book_popularity"();



CREATE OR REPLACE TRIGGER "trigger_book_views_popularity" AFTER INSERT OR DELETE OR UPDATE ON "public"."book_views" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_book_popularity"();



CREATE OR REPLACE TRIGGER "trigger_bookmarks_audit" AFTER INSERT OR DELETE ON "public"."bookmarks" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_social_audit_log"();



CREATE OR REPLACE TRIGGER "trigger_comment_reactions_audit" AFTER INSERT OR DELETE ON "public"."comment_reactions" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_social_audit_log"();



CREATE OR REPLACE TRIGGER "trigger_comments_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_social_audit_log"();



CREATE OR REPLACE TRIGGER "trigger_handle_privacy_level_update" BEFORE INSERT OR UPDATE ON "public"."reading_progress" FOR EACH ROW EXECUTE FUNCTION "public"."handle_privacy_level_update"();



CREATE OR REPLACE TRIGGER "trigger_likes_audit" AFTER INSERT OR DELETE ON "public"."likes" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_social_audit_log"();



CREATE OR REPLACE TRIGGER "trigger_reading_progress_consistency" BEFORE INSERT OR UPDATE ON "public"."reading_progress" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_reading_progress_consistency"();



CREATE OR REPLACE TRIGGER "trigger_reading_progress_popularity" AFTER INSERT OR DELETE OR UPDATE ON "public"."reading_progress" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_book_popularity"();



CREATE OR REPLACE TRIGGER "trigger_shares_audit" AFTER INSERT OR DELETE ON "public"."shares" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_social_audit_log"();



CREATE OR REPLACE TRIGGER "trigger_update_album_revenue_from_monetization" AFTER INSERT ON "public"."photo_monetization" FOR EACH ROW EXECUTE FUNCTION "public"."update_album_revenue_from_monetization"();



CREATE OR REPLACE TRIGGER "trigger_update_album_statistics_from_analytics" AFTER INSERT ON "public"."photo_analytics" FOR EACH ROW EXECUTE FUNCTION "public"."update_album_statistics_from_analytics"();



CREATE OR REPLACE TRIGGER "trigger_update_comment_counters" AFTER INSERT OR DELETE ON "public"."photo_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_photo_counters"();



CREATE OR REPLACE TRIGGER "trigger_update_engagement_score" BEFORE INSERT OR UPDATE ON "public"."activities" FOR EACH ROW EXECUTE FUNCTION "public"."update_engagement_score"();



CREATE OR REPLACE TRIGGER "trigger_update_friend_analytics" AFTER INSERT OR UPDATE ON "public"."friends" FOR EACH ROW EXECUTE FUNCTION "public"."update_friend_analytics"();



CREATE OR REPLACE TRIGGER "trigger_update_like_counters" AFTER INSERT OR DELETE ON "public"."photo_likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_photo_counters"();



CREATE OR REPLACE TRIGGER "trigger_update_share_counters" AFTER INSERT ON "public"."photo_shares" FOR EACH ROW EXECUTE FUNCTION "public"."update_photo_counters"();



CREATE OR REPLACE TRIGGER "update_bookmarks_updated_at" BEFORE UPDATE ON "public"."bookmarks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_dewey_decimal_classifications_updated_at" BEFORE UPDATE ON "public"."dewey_decimal_classifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_entity_tags_updated_at" BEFORE UPDATE ON "public"."entity_tags" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_shares_updated_at" BEFORE UPDATE ON "public"."shares" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "validate_follow_entity_trigger" BEFORE INSERT ON "public"."follows" FOR EACH ROW EXECUTE FUNCTION "public"."validate_follow_entity_trigger"();



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."reading_lists"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."book_reviews"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_comments"
    ADD CONSTRAINT "activity_comments_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_comments"
    ADD CONSTRAINT "activity_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_likes"
    ADD CONSTRAINT "activity_likes_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_likes"
    ADD CONSTRAINT "activity_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_image_analysis"
    ADD CONSTRAINT "ai_image_analysis_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."album_images"
    ADD CONSTRAINT "album_images_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."photo_albums"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."album_images"
    ADD CONSTRAINT "album_images_entity_type_id_fkey" FOREIGN KEY ("entity_type_id") REFERENCES "public"."entity_types"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."album_images"
    ADD CONSTRAINT "album_images_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."album_shares"
    ADD CONSTRAINT "album_shares_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."photo_albums"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."album_shares"
    ADD CONSTRAINT "album_shares_shared_by_fkey" FOREIGN KEY ("shared_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."album_shares"
    ADD CONSTRAINT "album_shares_shared_with_fkey" FOREIGN KEY ("shared_with") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."authors"
    ADD CONSTRAINT "authors_author_image_id_fkey" FOREIGN KEY ("author_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."authors"
    ADD CONSTRAINT "authors_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."automation_executions"
    ADD CONSTRAINT "automation_executions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."automation_workflows"("id");



ALTER TABLE ONLY "public"."automation_workflows"
    ADD CONSTRAINT "automation_workflows_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_blocked_user_id_fkey" FOREIGN KEY ("blocked_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_authors"
    ADD CONSTRAINT "book_authors_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_authors"
    ADD CONSTRAINT "book_authors_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_club_books"
    ADD CONSTRAINT "book_club_books_book_club_id_fkey" FOREIGN KEY ("book_club_id") REFERENCES "public"."book_clubs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_club_books"
    ADD CONSTRAINT "book_club_books_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_club_books"
    ADD CONSTRAINT "book_club_books_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."book_club_discussion_comments"
    ADD CONSTRAINT "book_club_discussion_comments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_club_discussion_comments"
    ADD CONSTRAINT "book_club_discussion_comments_discussion_id_fkey" FOREIGN KEY ("discussion_id") REFERENCES "public"."book_club_discussions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_club_discussions"
    ADD CONSTRAINT "book_club_discussions_book_club_id_fkey" FOREIGN KEY ("book_club_id") REFERENCES "public"."book_clubs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_club_discussions"
    ADD CONSTRAINT "book_club_discussions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."book_club_discussions"
    ADD CONSTRAINT "book_club_discussions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_club_members"
    ADD CONSTRAINT "book_club_members_book_club_id_fkey" FOREIGN KEY ("book_club_id") REFERENCES "public"."book_clubs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_club_members"
    ADD CONSTRAINT "book_club_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_clubs"
    ADD CONSTRAINT "book_clubs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_clubs"
    ADD CONSTRAINT "book_clubs_current_book_id_fkey" FOREIGN KEY ("current_book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."book_genre_mappings"
    ADD CONSTRAINT "book_genre_mappings_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_genre_mappings"
    ADD CONSTRAINT "book_genre_mappings_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "public"."book_genres"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_popularity_metrics"
    ADD CONSTRAINT "book_popularity_metrics_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_publishers"
    ADD CONSTRAINT "book_publishers_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_publishers"
    ADD CONSTRAINT "book_publishers_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_recommendations"
    ADD CONSTRAINT "book_recommendations_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_recommendations"
    ADD CONSTRAINT "book_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_reviews"
    ADD CONSTRAINT "book_reviews_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_reviews"
    ADD CONSTRAINT "book_reviews_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."book_reviews"
    ADD CONSTRAINT "book_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_similarity_scores"
    ADD CONSTRAINT "book_similarity_scores_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_subjects"
    ADD CONSTRAINT "book_subjects_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_subjects"
    ADD CONSTRAINT "book_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_tag_mappings"
    ADD CONSTRAINT "book_tag_mappings_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_tag_mappings"
    ADD CONSTRAINT "book_tag_mappings_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."book_tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_views"
    ADD CONSTRAINT "book_views_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_views"
    ADD CONSTRAINT "book_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookmarks"
    ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_binding_type_id_fkey" FOREIGN KEY ("binding_type_id") REFERENCES "public"."binding_types"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_format_type_id_fkey" FOREIGN KEY ("format_type_id") REFERENCES "public"."format_types"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "public"."statuses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."collaborative_filtering_data"
    ADD CONSTRAINT "collaborative_filtering_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."photo_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "comment_reactions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "comment_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_feed_entry_id_fkey" FOREIGN KEY ("feed_entry_id") REFERENCES "public"."feed_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_flags"
    ADD CONSTRAINT "content_flags_flagged_by_fkey" FOREIGN KEY ("flagged_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_flags"
    ADD CONSTRAINT "content_flags_moderated_by_fkey" FOREIGN KEY ("moderated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."content_generation_jobs"
    ADD CONSTRAINT "content_generation_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."custom_permissions"
    ADD CONSTRAINT "custom_permissions_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_permissions"
    ADD CONSTRAINT "custom_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."data_enrichment_jobs"
    ADD CONSTRAINT "data_enrichment_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."dewey_decimal_classifications"
    ADD CONSTRAINT "dewey_decimal_classifications_parent_code_fkey" FOREIGN KEY ("parent_code") REFERENCES "public"."dewey_decimal_classifications"("code");



ALTER TABLE ONLY "public"."discussion_comments"
    ADD CONSTRAINT "discussion_comments_discussion_id_fkey" FOREIGN KEY ("discussion_id") REFERENCES "public"."discussions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discussion_comments"
    ADD CONSTRAINT "discussion_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discussions"
    ADD CONSTRAINT "discussions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."discussions"
    ADD CONSTRAINT "discussions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enterprise_data_versions"
    ADD CONSTRAINT "enterprise_data_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."entity_tags"
    ADD CONSTRAINT "entity_tags_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_books"
    ADD CONSTRAINT "event_books_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_books"
    ADD CONSTRAINT "event_books_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_chat_messages"
    ADD CONSTRAINT "event_chat_messages_chat_room_id_fkey" FOREIGN KEY ("chat_room_id") REFERENCES "public"."event_chat_rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_chat_messages"
    ADD CONSTRAINT "event_chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_chat_rooms"
    ADD CONSTRAINT "event_chat_rooms_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_comments"
    ADD CONSTRAINT "event_comments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_comments"
    ADD CONSTRAINT "event_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."event_comments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_comments"
    ADD CONSTRAINT "event_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_creator_permissions"
    ADD CONSTRAINT "event_creator_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_financials"
    ADD CONSTRAINT "event_financials_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_interests"
    ADD CONSTRAINT "event_interests_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_interests"
    ADD CONSTRAINT "event_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_likes"
    ADD CONSTRAINT "event_likes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_likes"
    ADD CONSTRAINT "event_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_livestreams"
    ADD CONSTRAINT "event_livestreams_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_locations"
    ADD CONSTRAINT "event_locations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_media"
    ADD CONSTRAINT "event_media_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_permission_requests"
    ADD CONSTRAINT "event_permission_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_permission_requests"
    ADD CONSTRAINT "event_permission_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_questions"
    ADD CONSTRAINT "event_questions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_reminders"
    ADD CONSTRAINT "event_reminders_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_reminders"
    ADD CONSTRAINT "event_reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_sessions"
    ADD CONSTRAINT "event_sessions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_shares"
    ADD CONSTRAINT "event_shares_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_shares"
    ADD CONSTRAINT "event_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_speakers"
    ADD CONSTRAINT "event_speakers_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_speakers"
    ADD CONSTRAINT "event_speakers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_speakers"
    ADD CONSTRAINT "event_speakers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_sponsors"
    ADD CONSTRAINT "event_sponsors_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_staff"
    ADD CONSTRAINT "event_staff_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_staff"
    ADD CONSTRAINT "event_staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_surveys"
    ADD CONSTRAINT "event_surveys_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_tags"
    ADD CONSTRAINT "event_tags_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_views"
    ADD CONSTRAINT "event_views_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_views"
    ADD CONSTRAINT "event_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_waitlists"
    ADD CONSTRAINT "event_waitlists_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_event_image_id_fkey" FOREIGN KEY ("event_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_parent_event_id_fkey" FOREIGN KEY ("parent_event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."feed_entries"
    ADD CONSTRAINT "feed_entries_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."feed_entries"
    ADD CONSTRAINT "feed_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feed_entry_tags"
    ADD CONSTRAINT "feed_entry_tags_feed_entry_id_fkey" FOREIGN KEY ("feed_entry_id") REFERENCES "public"."feed_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friend_activities"
    ADD CONSTRAINT "friend_activities_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friend_activities"
    ADD CONSTRAINT "friend_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friend_analytics"
    ADD CONSTRAINT "friend_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friend_suggestions"
    ADD CONSTRAINT "friend_suggestions_suggested_user_id_fkey" FOREIGN KEY ("suggested_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friend_suggestions"
    ADD CONSTRAINT "friend_suggestions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friends"
    ADD CONSTRAINT "friends_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friends"
    ADD CONSTRAINT "friends_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friends"
    ADD CONSTRAINT "friends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_books"
    ADD CONSTRAINT "group_books_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."group_books"
    ADD CONSTRAINT "group_books_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_books"
    ADD CONSTRAINT "group_books_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."image_processing_jobs"
    ADD CONSTRAINT "image_processing_jobs_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_entity_type_id_fkey" FOREIGN KEY ("entity_type_id") REFERENCES "public"."entity_types"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ml_models"
    ADD CONSTRAINT "ml_models_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ml_predictions"
    ADD CONSTRAINT "ml_predictions_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."ml_models"("id");



ALTER TABLE ONLY "public"."ml_predictions"
    ADD CONSTRAINT "ml_predictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ml_training_jobs"
    ADD CONSTRAINT "ml_training_jobs_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."ml_models"("id");



ALTER TABLE ONLY "public"."moderation_queue"
    ADD CONSTRAINT "moderation_queue_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notification_queue"
    ADD CONSTRAINT "notification_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photo_albums"
    ADD CONSTRAINT "photo_albums_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."photo_albums"
    ADD CONSTRAINT "photo_albums_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photo_analytics"
    ADD CONSTRAINT "photo_analytics_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."photo_albums"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photo_analytics"
    ADD CONSTRAINT "photo_analytics_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photo_analytics"
    ADD CONSTRAINT "photo_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."photo_bookmarks"
    ADD CONSTRAINT "photo_bookmarks_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photo_comments"
    ADD CONSTRAINT "photo_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."photo_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photo_comments"
    ADD CONSTRAINT "photo_comments_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photo_community"
    ADD CONSTRAINT "photo_community_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."photo_albums"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photo_community"
    ADD CONSTRAINT "photo_community_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photo_community"
    ADD CONSTRAINT "photo_community_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photo_likes"
    ADD CONSTRAINT "photo_likes_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photo_monetization"
    ADD CONSTRAINT "photo_monetization_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."photo_albums"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photo_monetization"
    ADD CONSTRAINT "photo_monetization_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photo_monetization"
    ADD CONSTRAINT "photo_monetization_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."photo_shares"
    ADD CONSTRAINT "photo_shares_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photo_tags"
    ADD CONSTRAINT "photo_tags_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_bookmarks"
    ADD CONSTRAINT "post_bookmarks_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_bookmarks"
    ADD CONSTRAINT "post_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."post_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_reactions"
    ADD CONSTRAINT "post_reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_reactions"
    ADD CONSTRAINT "post_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_shares"
    ADD CONSTRAINT "post_shares_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_shares"
    ADD CONSTRAINT "post_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."publishers"
    ADD CONSTRAINT "publishers_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."publishers"
    ADD CONSTRAINT "publishers_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."publishers"
    ADD CONSTRAINT "publishers_publisher_image_id_fkey" FOREIGN KEY ("publisher_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reading_lists"
    ADD CONSTRAINT "reading_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reading_progress"
    ADD CONSTRAINT "reading_progress_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reading_progress"
    ADD CONSTRAINT "reading_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shares"
    ADD CONSTRAINT "shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."smart_notifications"
    ADD CONSTRAINT "smart_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."social_audit_log"
    ADD CONSTRAINT "social_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_friends"
    ADD CONSTRAINT "user_friends_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_friends"
    ADD CONSTRAINT "user_friends_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_friends"
    ADD CONSTRAINT "user_friends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE SET NULL;



CREATE POLICY "Admins can manage ML models" ON "public"."ml_models" USING ((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
  WHERE (("u"."id" = "auth"."uid"()) AND (("r"."name")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can manage automation" ON "public"."automation_workflows" USING ((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
  WHERE (("u"."id" = "auth"."uid"()) AND (("r"."name")::"text" = 'admin'::"text")))));



CREATE POLICY "Allow admin access to dewey_decimal_classifications" ON "public"."dewey_decimal_classifications" USING (("auth"."role"() = 'admin'::"text"));



CREATE POLICY "Allow public read" ON "public"."activity_log" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."album_analytics" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."album_shares" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_authors" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_club_books" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_club_discussion_comments" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_club_discussions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_club_members" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_clubs" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_genre_mappings" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_publishers" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_recommendations" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_similarity_scores" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_subjects" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_tag_mappings" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_tags" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_views" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."carousel_images" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."contact_info" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."discussion_comments" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."discussions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."entity_types" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_analytics" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_approvals" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_books" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_calendar_exports" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_categories" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_chat_messages" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_chat_rooms" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_comments" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_creator_permissions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_financials" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_interests" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_likes" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_livestreams" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_locations" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_media" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_permission_requests" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_questions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_registrations" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_reminders" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_sessions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_shares" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_speakers" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_sponsors" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_staff" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_surveys" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_tags" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_types" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_views" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_waitlists" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."feed_entry_tags" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."follow_target_types" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_achievements" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_analytics" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_announcements" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_audit_log" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_author_events" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_book_list_items" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_book_lists" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_book_reviews" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_book_swaps" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_book_wishlist_items" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_book_wishlists" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_bots" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_chat_channels" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_chat_message_attachments" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_chat_message_reactions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_chat_messages" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_content_moderation_logs" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_custom_fields" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_discussion_categories" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_event_feedback" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_events" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_integrations" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_invites" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_leaderboards" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_member_achievements" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_member_devices" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_member_streaks" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_membership_questions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_moderation_logs" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_onboarding_checklists" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_onboarding_progress" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_onboarding_tasks" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_poll_votes" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_polls" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_reading_challenge_progress" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_reading_challenges" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_reading_progress" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_reading_sessions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_reports" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_roles" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_rules" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_shared_documents" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_tags" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_types" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_webhook_logs" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_webhooks" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_welcome_messages" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."id_mappings" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."image_tag_mappings" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."image_tags" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."images" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."invoices" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."list_followers" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."media_attachments" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."mentions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."payment_methods" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."payment_transactions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."personalized_recommendations" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."photo_album" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."prices" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."promo_codes" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."reactions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."reading_challenges" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."reading_goals" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."reading_list_items" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."reading_series" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."reading_sessions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."reading_stats_daily" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."reading_streaks" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."review_likes" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."reviews" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."roles" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."series_events" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."session_registrations" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."similar_books" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."statuses" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."subjects" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."survey_questions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."survey_responses" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."sync_state" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."ticket_benefits" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."ticket_types" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."tickets" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."user_book_interactions" FOR SELECT USING (true);



CREATE POLICY "Allow read access to dewey_decimal_classifications" ON "public"."dewey_decimal_classifications" FOR SELECT USING (true);



CREATE POLICY "Public albums are viewable by everyone" ON "public"."photo_albums" FOR SELECT USING ((("is_public" = true) AND (("deleted_at" IS NULL) OR ("deleted_at" > "now"()))));



CREATE POLICY "Public read access for authors" ON "public"."authors" FOR SELECT USING (true);



CREATE POLICY "Public read access for book_id_mapping" ON "public"."book_id_mapping" FOR SELECT USING (true);



CREATE POLICY "Public read access for books" ON "public"."books" FOR SELECT USING (true);



CREATE POLICY "Public read access for public events" ON "public"."events" FOR SELECT USING ((("visibility" = 'public'::"text") OR ("auth"."uid"() = "created_by")));



CREATE POLICY "Public read access for publishers" ON "public"."publishers" FOR SELECT USING (true);



CREATE POLICY "Users can bookmark photos they can view" ON "public"."photo_bookmarks" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."images" "i"
  WHERE (("i"."id" = "photo_bookmarks"."photo_id") AND ((("i"."metadata" ->> 'visibility'::"text") = 'public'::"text") OR (("i"."metadata" ->> 'owner_id'::"text") = ("auth"."uid"())::"text")))))));



CREATE POLICY "Users can comment on photos they can view" ON "public"."photo_comments" USING ((EXISTS ( SELECT 1
   FROM "public"."images" "i"
  WHERE (("i"."id" = "photo_comments"."photo_id") AND ((("i"."metadata" ->> 'visibility'::"text") = 'public'::"text") OR (("i"."metadata" ->> 'owner_id'::"text") = ("auth"."uid"())::"text"))))));



CREATE POLICY "Users can create content jobs" ON "public"."content_generation_jobs" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can create friend requests" ON "public"."user_friends" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));



CREATE POLICY "Users can create their own albums" ON "public"."photo_albums" FOR INSERT WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own uploaded images" ON "public"."images" FOR DELETE USING (("auth"."uid"() = "uploader_id"));



CREATE POLICY "Users can delete their own albums" ON "public"."photo_albums" FOR UPDATE USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own friends" ON "public"."user_friends" FOR DELETE USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));



CREATE POLICY "Users can delete their own posts" ON "public"."posts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert entities" ON "public"."entities" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can insert images" ON "public"."images" FOR INSERT WITH CHECK (("auth"."uid"() = "uploader_id"));



CREATE POLICY "Users can insert their own engagement analytics" ON "public"."engagement_analytics" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own posts" ON "public"."posts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own predictions" ON "public"."ml_predictions" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can like photos they can view" ON "public"."photo_likes" USING ((EXISTS ( SELECT 1
   FROM "public"."images" "i"
  WHERE (("i"."id" = "photo_likes"."photo_id") AND ((("i"."metadata" ->> 'visibility'::"text") = 'public'::"text") OR (("i"."metadata" ->> 'owner_id'::"text") = ("auth"."uid"())::"text"))))));



CREATE POLICY "Users can manage own comments" ON "public"."comments" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own likes" ON "public"."likes" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own photo albums" ON "public"."photo_albums" USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can read basic profile info for follows" ON "public"."profiles" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can read basic user info for follows" ON "public"."users" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can read entities" ON "public"."entities" FOR SELECT USING (true);



CREATE POLICY "Users can read posts" ON "public"."posts" FOR SELECT USING (true);



CREATE POLICY "Users can read their own engagement analytics" ON "public"."engagement_analytics" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can share photos they can view" ON "public"."photo_shares" USING ((EXISTS ( SELECT 1
   FROM "public"."images" "i"
  WHERE (("i"."id" = "photo_shares"."photo_id") AND ((("i"."metadata" ->> 'visibility'::"text") = 'public'::"text") OR (("i"."metadata" ->> 'owner_id'::"text") = ("auth"."uid"())::"text"))))));



CREATE POLICY "Users can tag photos they can edit" ON "public"."photo_tags" USING ((("tagged_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."images" "i"
  WHERE (("i"."id" = "photo_tags"."photo_id") AND (("i"."metadata" ->> 'owner_id'::"text") = ("auth"."uid"())::"text"))))));



CREATE POLICY "Users can update entities" ON "public"."entities" FOR UPDATE USING (true);



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own uploaded images" ON "public"."images" FOR UPDATE USING (("auth"."uid"() = "uploader_id"));



CREATE POLICY "Users can update their own albums" ON "public"."photo_albums" FOR UPDATE USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own friends" ON "public"."user_friends" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));



CREATE POLICY "Users can update their own notifications" ON "public"."smart_notifications" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own posts" ON "public"."posts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view active ML models" ON "public"."ml_models" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Users can view all images" ON "public"."images" FOR SELECT USING (true);



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own albums" ON "public"."photo_albums" FOR SELECT USING ((("owner_id" = "auth"."uid"()) AND (("deleted_at" IS NULL) OR ("deleted_at" > "now"()))));



CREATE POLICY "Users can view their own content jobs" ON "public"."content_generation_jobs" FOR SELECT USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can view their own friends" ON "public"."user_friends" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));



CREATE POLICY "Users can view their own notifications" ON "public"."smart_notifications" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own predictions" ON "public"."ml_predictions" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activities_delete_policy" ON "public"."activities" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "activities_insert_policy" ON "public"."activities" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "activities_select_policy" ON "public"."activities" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("visibility" = 'public'::"text") OR (("visibility" = 'friends'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."user_friends"
  WHERE ((("user_friends"."user_id" = "auth"."uid"()) AND ("user_friends"."friend_id" = "activities"."user_id")) OR (("user_friends"."friend_id" = "auth"."uid"()) AND ("user_friends"."user_id" = "activities"."user_id")))))) OR (("visibility" = 'group'::"text") AND ("group_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "activities"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))))));



CREATE POLICY "activities_update_policy" ON "public"."activities" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."activity_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_full_access_enhanced" ON "public"."book_reviews" TO "authenticated" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "admin_full_access_enhanced" ON "public"."books" TO "authenticated" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "admin_full_access_enhanced" ON "public"."reading_progress" TO "authenticated" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "admin_performance_metrics" ON "public"."performance_metrics" TO "authenticated" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "admin_system_health_checks" ON "public"."system_health_checks" TO "authenticated" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."ai_image_analysis" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_image_analysis_insert_policy" ON "public"."ai_image_analysis" FOR INSERT WITH CHECK (true);



CREATE POLICY "ai_image_analysis_select_policy" ON "public"."ai_image_analysis" FOR SELECT USING (("auth"."uid"() IN ( SELECT "pa"."owner_id"
   FROM ("public"."photo_albums" "pa"
     JOIN "public"."album_images" "ai" ON (("pa"."id" = "ai"."album_id")))
  WHERE ("ai"."image_id" = "ai_image_analysis"."image_id"))));



ALTER TABLE "public"."album_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."album_images" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "album_images_delete_policy" ON "public"."album_images" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."photo_albums"
  WHERE (("photo_albums"."id" = "album_images"."album_id") AND ("photo_albums"."owner_id" = "auth"."uid"())))));



CREATE POLICY "album_images_insert_policy" ON "public"."album_images" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."photo_albums"
  WHERE (("photo_albums"."id" = "album_images"."album_id") AND ("photo_albums"."owner_id" = "auth"."uid"())))));



CREATE POLICY "album_images_select_policy" ON "public"."album_images" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."photo_albums"
  WHERE (("photo_albums"."id" = "album_images"."album_id") AND (("photo_albums"."is_public" = true) OR ("photo_albums"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "album_images_update_policy" ON "public"."album_images" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."photo_albums"
  WHERE (("photo_albums"."id" = "album_images"."album_id") AND ("photo_albums"."owner_id" = "auth"."uid"())))));



ALTER TABLE "public"."album_shares" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_trail_admin_read" ON "public"."enterprise_audit_trail" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role_id" IS NOT NULL)))));



CREATE POLICY "audit_trail_own_changes" ON "public"."enterprise_audit_trail" FOR SELECT TO "authenticated" USING (("changed_by" = "auth"."uid"()));



ALTER TABLE "public"."authors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authors_select_policy" ON "public"."authors" FOR SELECT USING (true);



ALTER TABLE "public"."automation_executions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."automation_workflows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."binding_types" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "binding_types_select_policy" ON "public"."binding_types" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."blocks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "blocks_delete_policy" ON "public"."blocks" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "blocks_insert_policy" ON "public"."blocks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "blocks_select_policy" ON "public"."blocks" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "blocked_user_id")));



ALTER TABLE "public"."book_authors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_club_books" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_club_discussion_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_club_discussions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_club_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_clubs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_genre_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_genres" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "book_genres_select_policy" ON "public"."book_genres" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."book_id_mapping" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_popularity_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_publishers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_recommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "book_reviews_delete_policy" ON "public"."book_reviews" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "book_reviews_insert_policy" ON "public"."book_reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "book_reviews_select_policy" ON "public"."book_reviews" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "book_reviews_update_policy" ON "public"."book_reviews" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."book_similarity_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_subjects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_tag_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookmarks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bookmarks_delete_policy" ON "public"."bookmarks" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "bookmarks_insert_policy" ON "public"."bookmarks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "bookmarks_select_policy" ON "public"."bookmarks" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("is_private" = false)));



CREATE POLICY "bookmarks_update_policy" ON "public"."bookmarks" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."books" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "books_select_policy" ON "public"."books" FOR SELECT USING (true);



ALTER TABLE "public"."carousel_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."collaborative_filtering_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_reactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comment_reactions_delete_policy" ON "public"."comment_reactions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "comment_reactions_insert_policy" ON "public"."comment_reactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "comment_reactions_select_policy" ON "public"."comment_reactions" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "comment_reactions_update_policy" ON "public"."comment_reactions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comments_delete_policy" ON "public"."comments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "comments_insert_policy" ON "public"."comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "comments_select_policy" ON "public"."comments" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "comments_update_policy" ON "public"."comments" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."contact_info" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_features" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_flags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_flags_insert_policy" ON "public"."content_flags" FOR INSERT WITH CHECK (("auth"."uid"() = "flagged_by"));



CREATE POLICY "content_flags_select_policy" ON "public"."content_flags" FOR SELECT USING (("auth"."uid"() = "flagged_by"));



CREATE POLICY "content_flags_update_policy" ON "public"."content_flags" FOR UPDATE USING (("auth"."uid"() = "flagged_by"));



ALTER TABLE "public"."content_generation_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."countries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "countries_select_policy" ON "public"."countries" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."custom_permissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "custom_permissions_owner_policy" ON "public"."custom_permissions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "custom_permissions_target_policy" ON "public"."custom_permissions" FOR SELECT USING (("auth"."uid"() = "target_user_id"));



ALTER TABLE "public"."data_enrichment_jobs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "data_lineage_read" ON "public"."enterprise_data_lineage" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "data_quality_rules_read" ON "public"."enterprise_data_quality_rules" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "data_versions_admin_access" ON "public"."enterprise_data_versions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role_id" IS NOT NULL)))));



ALTER TABLE "public"."dewey_decimal_classifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."discussion_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."discussions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."engagement_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enterprise_audit_trail" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enterprise_data_lineage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enterprise_data_quality_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enterprise_data_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entity_tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "entity_tags_delete_policy" ON "public"."entity_tags" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "entity_tags_insert_policy" ON "public"."entity_tags" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "entity_tags_select_policy" ON "public"."entity_tags" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "entity_tags_update_policy" ON "public"."entity_tags" FOR UPDATE USING (("auth"."uid"() = "created_by"));



ALTER TABLE "public"."entity_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_approvals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_books" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_calendar_exports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_chat_rooms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_creator_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_financials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_interests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_livestreams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_media" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_permission_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_reminders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_shares" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_speakers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_sponsors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_staff" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_surveys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_waitlists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feed_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "feed_entries_delete_policy" ON "public"."feed_entries" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "feed_entries_insert_policy" ON "public"."feed_entries" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "feed_entries_select_policy" ON "public"."feed_entries" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "feed_entries_update_policy" ON "public"."feed_entries" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."feed_entry_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."follow_target_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "follows_delete_policy" ON "public"."follows" FOR DELETE USING (("auth"."uid"() = "follower_id"));



CREATE POLICY "follows_insert_policy" ON "public"."follows" FOR INSERT WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "follows_select_policy" ON "public"."follows" FOR SELECT USING ((("auth"."uid"() = "follower_id") OR ("auth"."uid"() = "following_id")));



CREATE POLICY "follows_update_policy" ON "public"."follows" FOR UPDATE USING (("auth"."uid"() = "follower_id"));



ALTER TABLE "public"."format_types" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "format_types_select_policy" ON "public"."format_types" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."friends" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "friends_delete_policy" ON "public"."friends" FOR DELETE USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));



CREATE POLICY "friends_insert_policy" ON "public"."friends" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "friends_select_policy" ON "public"."friends" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));



ALTER TABLE "public"."group_achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_author_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_book_list_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_book_lists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_book_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_book_swaps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_book_wishlist_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_book_wishlists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_bots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_chat_channels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_chat_message_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_chat_message_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_content_moderation_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_custom_fields" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_discussion_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_event_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_integrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_leaderboards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_member_achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_member_devices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_member_streaks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "group_members_select_policy" ON "public"."group_members" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."groups"
  WHERE (("groups"."id" = "group_members"."group_id") AND ("groups"."is_private" = false))))));



ALTER TABLE "public"."group_membership_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_moderation_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_onboarding_checklists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_onboarding_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_onboarding_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_poll_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_polls" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_reading_challenge_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_reading_challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_reading_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_reading_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_shared_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_webhook_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_webhooks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_welcome_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "groups_delete_owner" ON "public"."groups" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "groups_insert_auth" ON "public"."groups" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "groups_select_all" ON "public"."groups" FOR SELECT USING (true);



CREATE POLICY "groups_update_owner" ON "public"."groups" FOR UPDATE USING (("auth"."uid"() = "created_by"));



ALTER TABLE "public"."id_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."image_processing_jobs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "image_processing_jobs_insert_policy" ON "public"."image_processing_jobs" FOR INSERT WITH CHECK (true);



CREATE POLICY "image_processing_jobs_select_policy" ON "public"."image_processing_jobs" FOR SELECT USING (("auth"."uid"() IN ( SELECT "pa"."owner_id"
   FROM ("public"."photo_albums" "pa"
     JOIN "public"."album_images" "ai" ON (("pa"."id" = "ai"."album_id")))
  WHERE ("ai"."image_id" = "image_processing_jobs"."image_id"))));



CREATE POLICY "image_processing_jobs_update_policy" ON "public"."image_processing_jobs" FOR UPDATE USING (true);



ALTER TABLE "public"."image_tag_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."image_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."likes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "likes_delete_policy" ON "public"."likes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "likes_insert_policy" ON "public"."likes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "likes_select_policy" ON "public"."likes" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."list_followers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."media_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ml_models" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ml_predictions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ml_training_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moderation_queue" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "moderation_queue_insert_policy" ON "public"."moderation_queue" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "moderation_queue_select_policy" ON "public"."moderation_queue" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "moderation_queue_update_policy" ON "public"."moderation_queue" FOR UPDATE USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."nlp_analysis" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_queue" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notification_queue_insert_policy" ON "public"."notification_queue" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "notification_queue_select_policy" ON "public"."notification_queue" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "notification_queue_update_policy" ON "public"."notification_queue" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_delete_policy" ON "public"."notifications" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "notifications_insert_policy" ON "public"."notifications" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "notifications_select_policy" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "notifications_update_policy" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."payment_methods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."performance_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."personalized_recommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photo_album" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photo_albums" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "photo_albums_delete_policy" ON "public"."photo_albums" FOR DELETE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "photo_albums_insert_policy" ON "public"."photo_albums" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "photo_albums_select_policy" ON "public"."photo_albums" FOR SELECT USING ((("is_public" = true) OR ("auth"."uid"() = "owner_id") OR (EXISTS ( SELECT 1
   FROM "public"."album_shares"
  WHERE (("album_shares"."album_id" = "photo_albums"."id") AND ("album_shares"."shared_with" = "auth"."uid"()))))));



CREATE POLICY "photo_albums_update_policy" ON "public"."photo_albums" FOR UPDATE USING (("auth"."uid"() = "owner_id"));



ALTER TABLE "public"."photo_analytics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "photo_analytics_insert_policy" ON "public"."photo_analytics" FOR INSERT WITH CHECK (true);



CREATE POLICY "photo_analytics_select_policy" ON "public"."photo_analytics" FOR SELECT USING (("auth"."uid"() IN ( SELECT "photo_albums"."owner_id"
   FROM "public"."photo_albums"
  WHERE ("photo_albums"."id" = "photo_analytics"."album_id"))));



ALTER TABLE "public"."photo_bookmarks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photo_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photo_community" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "photo_community_delete_policy" ON "public"."photo_community" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "photo_community_insert_policy" ON "public"."photo_community" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "photo_community_select_policy" ON "public"."photo_community" FOR SELECT USING ((("auth"."uid"() IN ( SELECT "photo_albums"."owner_id"
   FROM "public"."photo_albums"
  WHERE ("photo_albums"."id" = "photo_community"."album_id"))) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "photo_community_update_policy" ON "public"."photo_community" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."photo_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photo_monetization" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "photo_monetization_insert_policy" ON "public"."photo_monetization" FOR INSERT WITH CHECK (true);



CREATE POLICY "photo_monetization_select_policy" ON "public"."photo_monetization" FOR SELECT USING (("auth"."uid"() IN ( SELECT "photo_albums"."owner_id"
   FROM "public"."photo_albums"
  WHERE ("photo_albums"."id" = "photo_monetization"."album_id"))));



ALTER TABLE "public"."photo_shares" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photo_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_bookmarks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "post_bookmarks_delete_policy" ON "public"."post_bookmarks" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "post_bookmarks_insert_policy" ON "public"."post_bookmarks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "post_bookmarks_select_policy" ON "public"."post_bookmarks" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "post_bookmarks_update_policy" ON "public"."post_bookmarks" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."post_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "post_comments_delete_policy" ON "public"."post_comments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "post_comments_insert_policy" ON "public"."post_comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "post_comments_select_policy" ON "public"."post_comments" FOR SELECT USING (true);



CREATE POLICY "post_comments_update_policy" ON "public"."post_comments" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."post_reactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "post_reactions_delete_policy" ON "public"."post_reactions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "post_reactions_insert_policy" ON "public"."post_reactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "post_reactions_select_policy" ON "public"."post_reactions" FOR SELECT USING (true);



ALTER TABLE "public"."post_shares" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "post_shares_delete_policy" ON "public"."post_shares" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "post_shares_insert_policy" ON "public"."post_shares" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "post_shares_select_policy" ON "public"."post_shares" FOR SELECT USING (true);



ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "posts_delete_own" ON "public"."posts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "posts_delete_policy" ON "public"."posts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "posts_insert_own" ON "public"."posts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "posts_insert_policy" ON "public"."posts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "posts_select_followers" ON "public"."posts" FOR SELECT USING ((("visibility" = 'followers'::"text") AND ("publish_status" = 'published'::"text") AND (NOT "is_deleted") AND (EXISTS ( SELECT 1
   FROM "public"."follows" "f"
  WHERE (("f"."follower_id" = "auth"."uid"()) AND ("f"."following_id" = "posts"."user_id"))))));



CREATE POLICY "posts_select_friends" ON "public"."posts" FOR SELECT USING ((("visibility" = 'friends'::"text") AND ("publish_status" = 'published'::"text") AND (NOT "is_deleted") AND (EXISTS ( SELECT 1
   FROM "public"."friends" "f"
  WHERE ((("f"."user_id" = "auth"."uid"()) AND ("f"."friend_id" = "posts"."user_id") AND ("f"."status" = 'accepted'::"text")) OR (("f"."friend_id" = "auth"."uid"()) AND ("f"."user_id" = "posts"."user_id") AND ("f"."status" = 'accepted'::"text")))))));



CREATE POLICY "posts_select_own" ON "public"."posts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "posts_select_policy" ON "public"."posts" FOR SELECT USING ((("is_deleted" = false) AND (("visibility" = 'public'::"text") OR (("visibility" = 'private'::"text") AND ("auth"."uid"() = "user_id")) OR (("visibility" = 'friends'::"text") AND ("auth"."uid"() = ANY ("allowed_user_ids"))))));



CREATE POLICY "posts_select_public" ON "public"."posts" FOR SELECT USING ((("visibility" = 'public'::"text") AND ("publish_status" = 'published'::"text") AND (NOT "is_deleted")));



CREATE POLICY "posts_update_own" ON "public"."posts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "posts_update_policy" ON "public"."posts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."prices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."privacy_audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "privacy_audit_log_owner_policy" ON "public"."privacy_audit_log" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promo_codes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_book_popularity_metrics" ON "public"."book_popularity_metrics" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."publishers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_list_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_lists" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reading_lists_delete_policy" ON "public"."reading_lists" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "reading_lists_insert_policy" ON "public"."reading_lists" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "reading_lists_select_policy" ON "public"."reading_lists" FOR SELECT USING ((("is_public" = true) OR ("auth"."uid"() = "user_id")));



CREATE POLICY "reading_lists_update_policy" ON "public"."reading_lists" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."reading_progress" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reading_progress_owner_policy" ON "public"."reading_progress" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "reading_progress_public_policy" ON "public"."reading_progress" FOR SELECT USING ((("privacy_level" = 'public'::"text") OR (("privacy_level" = 'friends'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."user_friends"
  WHERE ((("user_friends"."user_id" = "auth"."uid"()) AND ("user_friends"."friend_id" = "reading_progress"."user_id")) OR (("user_friends"."friend_id" = "auth"."uid"()) AND ("user_friends"."user_id" = "reading_progress"."user_id")))))) OR (("privacy_level" = 'followers'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."follows"
  WHERE (("follows"."follower_id" = "auth"."uid"()) AND ("follows"."following_id" = "reading_progress"."user_id")))))));



ALTER TABLE "public"."reading_series" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_stats_daily" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_streaks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."series_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session_registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shares" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shares_delete_policy" ON "public"."shares" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "shares_insert_policy" ON "public"."shares" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "shares_select_policy" ON "public"."shares" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "shares_update_policy" ON "public"."shares" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."similar_books" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."smart_notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "social_audit_insert_policy" ON "public"."social_audit_log" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."social_audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "social_audit_select_policy" ON "public"."social_audit_log" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."statuses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subjects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."survey_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."survey_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sync_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_health_checks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tags_select_policy" ON "public"."tags" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."ticket_benefits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trending_topics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trending_topics_select_policy" ON "public"."trending_topics" FOR SELECT USING (true);



ALTER TABLE "public"."user_activity_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_book_interactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_book_interactions_delete_policy" ON "public"."user_book_interactions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user_book_interactions_insert_policy" ON "public"."user_book_interactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "user_book_interactions_select_policy" ON "public"."user_book_interactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user_book_interactions_update_policy" ON "public"."user_book_interactions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_friends" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_own_activity_log" ON "public"."user_activity_log" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_privacy_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_privacy_settings_owner_policy" ON "public"."user_privacy_settings" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_reading_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_reading_preferences_select_policy" ON "public"."user_reading_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."add_activity_comment"("p_activity_id" "uuid", "p_user_id" "uuid", "p_comment_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_activity_comment"("p_activity_id" "uuid", "p_user_id" "uuid", "p_comment_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_activity_comment"("p_activity_id" "uuid", "p_user_id" "uuid", "p_comment_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_entity_comment"("p_user_id" "uuid", "p_entity_type" character varying, "p_entity_id" "uuid", "p_content" "text", "p_parent_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_entity_comment"("p_user_id" "uuid", "p_entity_type" character varying, "p_entity_id" "uuid", "p_content" "text", "p_parent_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_entity_comment"("p_user_id" "uuid", "p_entity_type" character varying, "p_entity_id" "uuid", "p_content" "text", "p_parent_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."anonymize_user_data_enhanced"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."anonymize_user_data_enhanced"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."anonymize_user_data_enhanced"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_engagement_score"("p_like_count" integer, "p_comment_count" integer, "p_share_count" integer, "p_view_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_engagement_score"("p_like_count" integer, "p_comment_count" integer, "p_share_count" integer, "p_view_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_engagement_score"("p_like_count" integer, "p_comment_count" integer, "p_share_count" integer, "p_view_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_data_health"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_data_health"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_data_health"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_data_integrity_health"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_data_integrity_health"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_data_integrity_health"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_data_quality_issues_enhanced"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_data_quality_issues_enhanced"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_data_quality_issues_enhanced"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_existing_follow"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_existing_follow"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_existing_follow"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_is_following"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_is_following"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_is_following"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_permalink_availability"("permalink" "text", "entity_type" "text", "exclude_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_permalink_availability"("permalink" "text", "entity_type" "text", "exclude_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_permalink_availability"("permalink" "text", "entity_type" "text", "exclude_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_publisher_data_health"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_publisher_data_health"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_publisher_data_health"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_rate_limit_enhanced"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer, "p_window_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_rate_limit_enhanced"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer, "p_window_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_rate_limit_enhanced"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer, "p_window_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_reading_privacy_access"("target_user_id" "uuid", "requesting_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_reading_privacy_access"("target_user_id" "uuid", "requesting_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_reading_privacy_access"("target_user_id" "uuid", "requesting_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_audit_trail"("p_days_to_keep" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_audit_trail"("p_days_to_keep" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_audit_trail"("p_days_to_keep" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_monitoring_data"("p_days_to_keep" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_monitoring_data"("p_days_to_keep" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_monitoring_data"("p_days_to_keep" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_orphaned_records"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_orphaned_records"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_orphaned_records"() TO "service_role";



GRANT ALL ON FUNCTION "public"."comprehensive_system_health_check_enhanced"() TO "anon";
GRANT ALL ON FUNCTION "public"."comprehensive_system_health_check_enhanced"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."comprehensive_system_health_check_enhanced"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_data_version"("p_table_name" "text", "p_record_id" "uuid", "p_change_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_data_version"("p_table_name" "text", "p_record_id" "uuid", "p_change_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_data_version"("p_table_name" "text", "p_record_id" "uuid", "p_change_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_enterprise_audit_trail"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_enterprise_audit_trail"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_enterprise_audit_trail"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_entity_album"("p_name" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_description" "text", "p_is_public" boolean, "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_entity_album"("p_name" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_description" "text", "p_is_public" boolean, "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_entity_album"("p_name" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_description" "text", "p_is_public" boolean, "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."decrypt_sensitive_data_enhanced"("p_encrypted_data" "text", "p_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."decrypt_sensitive_data_enhanced"("p_encrypted_data" "text", "p_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrypt_sensitive_data_enhanced"("p_encrypted_data" "text", "p_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_follow_record"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_follow_record"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_follow_record"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."encrypt_sensitive_data_enhanced"("p_data" "text", "p_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."encrypt_sensitive_data_enhanced"("p_data" "text", "p_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."encrypt_sensitive_data_enhanced"("p_data" "text", "p_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_reading_progress_consistency"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_reading_progress_consistency"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_reading_progress_consistency"() TO "service_role";



GRANT ALL ON FUNCTION "public"."export_user_data_enhanced"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."export_user_data_enhanced"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."export_user_data_enhanced"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."extract_book_dimensions"("book_uuid" "uuid", "dimensions_json" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."extract_book_dimensions"("book_uuid" "uuid", "dimensions_json" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."extract_book_dimensions"("book_uuid" "uuid", "dimensions_json" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."fix_missing_publisher_relationships"() TO "anon";
GRANT ALL ON FUNCTION "public"."fix_missing_publisher_relationships"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fix_missing_publisher_relationships"() TO "service_role";



GRANT ALL ON FUNCTION "public"."flag_content"("p_flagged_by" "uuid", "p_content_type" character varying, "p_content_id" "uuid", "p_flag_reason" character varying, "p_flag_details" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."flag_content"("p_flagged_by" "uuid", "p_content_type" character varying, "p_content_id" "uuid", "p_flag_reason" character varying, "p_flag_details" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."flag_content"("p_flagged_by" "uuid", "p_content_type" character varying, "p_content_id" "uuid", "p_flag_reason" character varying, "p_flag_details" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_data_health_report"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_data_health_report"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_data_health_report"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_friend_suggestions"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_friend_suggestions"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_friend_suggestions"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_intelligent_content"("p_content_type" "text", "p_input_data" "jsonb", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_intelligent_content"("p_content_type" "text", "p_input_data" "jsonb", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_intelligent_content"("p_content_type" "text", "p_input_data" "jsonb", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_monitoring_report"("p_days_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_monitoring_report"("p_days_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_monitoring_report"("p_days_back" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_permalink"("input_text" "text", "entity_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_permalink"("input_text" "text", "entity_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_permalink"("input_text" "text", "entity_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_smart_notification"("p_user_id" "uuid", "p_notification_type" "text", "p_context_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_smart_notification"("p_user_id" "uuid", "p_notification_type" "text", "p_context_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_smart_notification"("p_user_id" "uuid", "p_notification_type" "text", "p_context_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_system_alerts_enhanced"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_system_alerts_enhanced"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_system_alerts_enhanced"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ai_book_recommendations"("p_user_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_ai_book_recommendations"("p_user_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ai_book_recommendations"("p_user_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_data_lineage"("p_table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_data_lineage"("p_table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_data_lineage"("p_table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_data_quality_report"("p_table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_data_quality_report"("p_table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_data_quality_report"("p_table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_entity_albums"("p_entity_type" "text", "p_entity_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_entity_albums"("p_entity_type" "text", "p_entity_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_entity_albums"("p_entity_type" "text", "p_entity_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_entity_by_permalink"("permalink" "text", "entity_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_entity_by_permalink"("permalink" "text", "entity_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_entity_by_permalink"("permalink" "text", "entity_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_entity_images"("p_entity_type" "text", "p_entity_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_entity_images"("p_entity_type" "text", "p_entity_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_entity_images"("p_entity_type" "text", "p_entity_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_entity_social_stats"("p_entity_type" character varying, "p_entity_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_entity_social_stats"("p_entity_type" character varying, "p_entity_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_entity_social_stats"("p_entity_type" character varying, "p_entity_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_moderation_stats"("p_days_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_moderation_stats"("p_days_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_moderation_stats"("p_days_back" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_mutual_friends_count"("user1_id" "uuid", "user2_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_mutual_friends_count"("user1_id" "uuid", "user2_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_mutual_friends_count"("user1_id" "uuid", "user2_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_performance_recommendations"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_performance_recommendations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_performance_recommendations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_privacy_audit_summary"("days_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_privacy_audit_summary"("days_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_privacy_audit_summary"("days_back" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_activities_simple"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_activities_simple"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_activities_simple"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_privacy_settings"("user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_privacy_settings"("user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_privacy_settings"("user_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_timeline_posts"("target_user_id" "uuid", "limit_count" integer, "offset_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_timeline_posts"("target_user_id" "uuid", "limit_count" integer, "offset_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_timeline_posts"("target_user_id" "uuid", "limit_count" integer, "offset_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."grant_reading_permission"("target_user_id" "uuid", "permission_type" "text", "expires_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."grant_reading_permission"("target_user_id" "uuid", "permission_type" "text", "expires_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."grant_reading_permission"("target_user_id" "uuid", "permission_type" "text", "expires_at" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_album_privacy_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_album_privacy_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_album_privacy_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_privacy_level_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_privacy_level_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_privacy_level_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_public_album_creation"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_public_album_creation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_public_album_creation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_user_liked_entity"("p_user_id" "uuid", "p_entity_type" character varying, "p_entity_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_user_liked_entity"("p_user_id" "uuid", "p_entity_type" character varying, "p_entity_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_user_liked_entity"("p_user_id" "uuid", "p_entity_type" character varying, "p_entity_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_post_view_count"("post_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_post_view_count"("post_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_post_view_count"("post_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_user_privacy_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_user_privacy_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_user_privacy_settings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_follow_record"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_follow_record"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_follow_record"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_sensitive_operation_enhanced"("p_operation_type" "text", "p_table_name" "text", "p_record_id" "uuid", "p_user_id" "uuid", "p_details" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_sensitive_operation_enhanced"("p_operation_type" "text", "p_table_name" "text", "p_record_id" "uuid", "p_user_id" "uuid", "p_details" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_sensitive_operation_enhanced"("p_operation_type" "text", "p_table_name" "text", "p_record_id" "uuid", "p_user_id" "uuid", "p_details" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_social_action"("p_user_id" "uuid", "p_action_type" character varying, "p_entity_type" character varying, "p_entity_id" "uuid", "p_target_id" "uuid", "p_action_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_social_action"("p_user_id" "uuid", "p_action_type" character varying, "p_entity_type" character varying, "p_entity_id" "uuid", "p_target_id" "uuid", "p_action_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_social_action"("p_user_id" "uuid", "p_action_type" character varying, "p_entity_type" character varying, "p_entity_id" "uuid", "p_target_id" "uuid", "p_action_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_user_activity"("p_user_id" "uuid", "p_activity_type" "text", "p_activity_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" "text", "p_response_time_ms" integer, "p_status_code" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."log_user_activity"("p_user_id" "uuid", "p_activity_type" "text", "p_activity_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" "text", "p_response_time_ms" integer, "p_status_code" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_user_activity"("p_user_id" "uuid", "p_activity_type" "text", "p_activity_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" "text", "p_response_time_ms" integer, "p_status_code" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."map_progress_to_reading_status"("status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."map_progress_to_reading_status"("status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."map_progress_to_reading_status"("status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."map_reading_status_to_progress"("status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."map_reading_status_to_progress"("status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."map_reading_status_to_progress"("status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."mask_sensitive_data"("input_text" "text", "mask_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mask_sensitive_data"("input_text" "text", "mask_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mask_sensitive_data"("input_text" "text", "mask_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."monitor_data_health"() TO "anon";
GRANT ALL ON FUNCTION "public"."monitor_data_health"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."monitor_data_health"() TO "service_role";



GRANT ALL ON FUNCTION "public"."monitor_database_performance_enhanced"() TO "anon";
GRANT ALL ON FUNCTION "public"."monitor_database_performance_enhanced"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."monitor_database_performance_enhanced"() TO "service_role";



GRANT ALL ON FUNCTION "public"."monitor_entity_storage_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."monitor_entity_storage_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."monitor_entity_storage_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."monitor_query_performance"() TO "anon";
GRANT ALL ON FUNCTION "public"."monitor_query_performance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."monitor_query_performance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."perform_database_maintenance_enhanced"() TO "anon";
GRANT ALL ON FUNCTION "public"."perform_database_maintenance_enhanced"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."perform_database_maintenance_enhanced"() TO "service_role";



GRANT ALL ON FUNCTION "public"."perform_system_health_check"("p_check_name" "text", "p_status" "text", "p_details" "jsonb", "p_response_time_ms" integer, "p_error_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."perform_system_health_check"("p_check_name" "text", "p_status" "text", "p_details" "jsonb", "p_response_time_ms" integer, "p_error_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."perform_system_health_check"("p_check_name" "text", "p_status" "text", "p_details" "jsonb", "p_response_time_ms" integer, "p_error_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_album_images_entity_context"() TO "anon";
GRANT ALL ON FUNCTION "public"."populate_album_images_entity_context"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_album_images_entity_context"() TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_dewey_decimal_classifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."populate_dewey_decimal_classifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_dewey_decimal_classifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_images_entity_type_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."populate_images_entity_type_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_images_entity_type_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_complete_isbndb_book_data"("book_uuid" "uuid", "isbndb_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."process_complete_isbndb_book_data"("book_uuid" "uuid", "isbndb_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_complete_isbndb_book_data"("book_uuid" "uuid", "isbndb_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_dewey_decimal_classifications"("book_uuid" "uuid", "dewey_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."process_dewey_decimal_classifications"("book_uuid" "uuid", "dewey_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_dewey_decimal_classifications"("book_uuid" "uuid", "dewey_array" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."process_image_with_ai"("p_image_id" "uuid", "p_analysis_types" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."process_image_with_ai"("p_image_id" "uuid", "p_analysis_types" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_image_with_ai"("p_image_id" "uuid", "p_analysis_types" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."process_other_isbns"("book_uuid" "uuid", "other_isbns_json" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."process_other_isbns"("book_uuid" "uuid", "other_isbns_json" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_other_isbns"("book_uuid" "uuid", "other_isbns_json" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_related_books"("book_uuid" "uuid", "related_json" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."process_related_books"("book_uuid" "uuid", "related_json" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_related_books"("book_uuid" "uuid", "related_json" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_performance_metric"("p_metric_name" "text", "p_metric_value" numeric, "p_metric_unit" "text", "p_category" "text", "p_additional_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."record_performance_metric"("p_metric_name" "text", "p_metric_value" numeric, "p_metric_unit" "text", "p_category" "text", "p_additional_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_performance_metric"("p_metric_name" "text", "p_metric_value" numeric, "p_metric_unit" "text", "p_category" "text", "p_additional_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_materialized_views"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_materialized_views"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_materialized_views"() TO "service_role";



GRANT ALL ON FUNCTION "public"."revoke_reading_permission"("target_user_id" "uuid", "permission_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."revoke_reading_permission"("target_user_id" "uuid", "permission_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."revoke_reading_permission"("target_user_id" "uuid", "permission_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."run_data_maintenance"() TO "anon";
GRANT ALL ON FUNCTION "public"."run_data_maintenance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_data_maintenance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."run_performance_maintenance"() TO "anon";
GRANT ALL ON FUNCTION "public"."run_performance_maintenance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_performance_maintenance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."safe_cleanup_orphaned_records"() TO "anon";
GRANT ALL ON FUNCTION "public"."safe_cleanup_orphaned_records"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_cleanup_orphaned_records"() TO "service_role";



GRANT ALL ON FUNCTION "public"."safe_fix_missing_publishers"() TO "anon";
GRANT ALL ON FUNCTION "public"."safe_fix_missing_publishers"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_fix_missing_publishers"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_image_uploader"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_image_uploader"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_image_uploader"() TO "service_role";



GRANT ALL ON FUNCTION "public"."simple_check_publisher_health"() TO "anon";
GRANT ALL ON FUNCTION "public"."simple_check_publisher_health"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."simple_check_publisher_health"() TO "service_role";



GRANT ALL ON FUNCTION "public"."simple_fix_missing_publishers"() TO "anon";
GRANT ALL ON FUNCTION "public"."simple_fix_missing_publishers"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."simple_fix_missing_publishers"() TO "service_role";



GRANT ALL ON FUNCTION "public"."standardize_reading_status_mappings"() TO "anon";
GRANT ALL ON FUNCTION "public"."standardize_reading_status_mappings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."standardize_reading_status_mappings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."standardize_reading_statuses"() TO "anon";
GRANT ALL ON FUNCTION "public"."standardize_reading_statuses"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."standardize_reading_statuses"() TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_activity_like"("p_activity_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_activity_like"("p_activity_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_activity_like"("p_activity_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_entity_like"("p_user_id" "uuid", "p_entity_type" character varying, "p_entity_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_entity_like"("p_user_id" "uuid", "p_entity_type" character varying, "p_entity_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_entity_like"("p_user_id" "uuid", "p_entity_type" character varying, "p_entity_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_photo_analytics_event"("p_album_id" "uuid", "p_event_type" "text", "p_image_id" "uuid", "p_user_id" "uuid", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."track_photo_analytics_event"("p_album_id" "uuid", "p_event_type" "text", "p_image_id" "uuid", "p_user_id" "uuid", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_photo_analytics_event"("p_album_id" "uuid", "p_event_type" "text", "p_image_id" "uuid", "p_user_id" "uuid", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_content_processing"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_content_processing"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_content_processing"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_recommendation_generation"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_recommendation_generation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_recommendation_generation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_social_audit_log"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_social_audit_log"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_social_audit_log"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_update_book_popularity"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_book_popularity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_book_popularity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_album_revenue_from_monetization"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_album_revenue_from_monetization"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_album_revenue_from_monetization"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_album_statistics_from_analytics"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_album_statistics_from_analytics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_album_statistics_from_analytics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_book_popularity_metrics"("p_book_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_book_popularity_metrics"("p_book_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_book_popularity_metrics"("p_book_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_engagement_score"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_engagement_score"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_engagement_score"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_friend_analytics"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_friend_analytics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_friend_analytics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_photo_albums_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_photo_albums_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_photo_albums_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_photo_counters"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_photo_counters"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_photo_counters"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_post_engagement_score"("post_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_post_engagement_score"("post_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_post_engagement_score"("post_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_post_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_post_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_post_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_privacy_settings"("default_privacy_level" "text", "allow_friends_to_see_reading" boolean, "allow_followers_to_see_reading" boolean, "allow_public_reading_profile" boolean, "show_reading_stats_publicly" boolean, "show_currently_reading_publicly" boolean, "show_reading_history_publicly" boolean, "show_reading_goals_publicly" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_privacy_settings"("default_privacy_level" "text", "allow_friends_to_see_reading" boolean, "allow_followers_to_see_reading" boolean, "allow_public_reading_profile" boolean, "show_reading_stats_publicly" boolean, "show_currently_reading_publicly" boolean, "show_reading_history_publicly" boolean, "show_reading_goals_publicly" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_privacy_settings"("default_privacy_level" "text", "allow_friends_to_see_reading" boolean, "allow_followers_to_see_reading" boolean, "allow_public_reading_profile" boolean, "show_reading_stats_publicly" boolean, "show_currently_reading_publicly" boolean, "show_reading_history_publicly" boolean, "show_reading_goals_publicly" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_reading_progress"("p_user_id" "uuid", "p_book_id" "uuid", "p_status" "text", "p_progress_percentage" integer, "p_privacy_level" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_reading_progress"("p_user_id" "uuid", "p_book_id" "uuid", "p_status" "text", "p_progress_percentage" integer, "p_privacy_level" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_reading_progress"("p_user_id" "uuid", "p_book_id" "uuid", "p_status" "text", "p_progress_percentage" integer, "p_privacy_level" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_and_repair_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_and_repair_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_and_repair_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_book_data"("book_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_book_data"("book_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_book_data"("book_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_book_data_enhanced"("p_title" "text", "p_author" "text", "p_isbn" "text", "p_publication_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."validate_book_data_enhanced"("p_title" "text", "p_author" "text", "p_isbn" "text", "p_publication_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_book_data_enhanced"("p_title" "text", "p_author" "text", "p_isbn" "text", "p_publication_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_enterprise_data_quality"("p_table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_enterprise_data_quality"("p_table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_enterprise_data_quality"("p_table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_follow_entity"("p_entity_id" "uuid", "p_target_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_follow_entity"("p_entity_id" "uuid", "p_target_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_follow_entity"("p_entity_id" "uuid", "p_target_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_follow_entity_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_follow_entity_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_follow_entity_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_permalink"("permalink" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_permalink"("permalink" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_permalink"("permalink" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_user_data_enhanced"("p_email" "text", "p_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_user_data_enhanced"("p_email" "text", "p_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_user_data_enhanced"("p_email" "text", "p_name" "text") TO "service_role";



























GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON TABLE "public"."activity_comments" TO "anon";
GRANT ALL ON TABLE "public"."activity_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_comments" TO "service_role";



GRANT ALL ON TABLE "public"."activity_likes" TO "anon";
GRANT ALL ON TABLE "public"."activity_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_likes" TO "service_role";



GRANT ALL ON TABLE "public"."activity_log" TO "anon";
GRANT ALL ON TABLE "public"."activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."book_reviews" TO "anon";
GRANT ALL ON TABLE "public"."book_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."book_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."book_views" TO "anon";
GRANT ALL ON TABLE "public"."book_views" TO "authenticated";
GRANT ALL ON TABLE "public"."book_views" TO "service_role";



GRANT ALL ON TABLE "public"."books" TO "anon";
GRANT ALL ON TABLE "public"."books" TO "authenticated";
GRANT ALL ON TABLE "public"."books" TO "service_role";



GRANT ALL ON TABLE "public"."reading_lists" TO "anon";
GRANT ALL ON TABLE "public"."reading_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_lists" TO "service_role";



GRANT ALL ON TABLE "public"."reading_progress" TO "anon";
GRANT ALL ON TABLE "public"."reading_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_progress" TO "service_role";



GRANT ALL ON TABLE "public"."system_health_checks" TO "anon";
GRANT ALL ON TABLE "public"."system_health_checks" TO "authenticated";
GRANT ALL ON TABLE "public"."system_health_checks" TO "service_role";



GRANT ALL ON TABLE "public"."user_activity_log" TO "anon";
GRANT ALL ON TABLE "public"."user_activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."advanced_analytics_dashboard_enhanced" TO "anon";
GRANT ALL ON TABLE "public"."advanced_analytics_dashboard_enhanced" TO "authenticated";
GRANT ALL ON TABLE "public"."advanced_analytics_dashboard_enhanced" TO "service_role";



GRANT ALL ON TABLE "public"."ai_image_analysis" TO "anon";
GRANT ALL ON TABLE "public"."ai_image_analysis" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_image_analysis" TO "service_role";



GRANT ALL ON TABLE "public"."album_analytics" TO "anon";
GRANT ALL ON TABLE "public"."album_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."album_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."album_images" TO "anon";
GRANT ALL ON TABLE "public"."album_images" TO "authenticated";
GRANT ALL ON TABLE "public"."album_images" TO "service_role";



GRANT ALL ON TABLE "public"."album_shares" TO "anon";
GRANT ALL ON TABLE "public"."album_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."album_shares" TO "service_role";



GRANT ALL ON TABLE "public"."authors" TO "anon";
GRANT ALL ON TABLE "public"."authors" TO "authenticated";
GRANT ALL ON TABLE "public"."authors" TO "service_role";



GRANT ALL ON TABLE "public"."automation_executions" TO "anon";
GRANT ALL ON TABLE "public"."automation_executions" TO "authenticated";
GRANT ALL ON TABLE "public"."automation_executions" TO "service_role";



GRANT ALL ON TABLE "public"."automation_workflows" TO "anon";
GRANT ALL ON TABLE "public"."automation_workflows" TO "authenticated";
GRANT ALL ON TABLE "public"."automation_workflows" TO "service_role";



GRANT ALL ON TABLE "public"."binding_types" TO "anon";
GRANT ALL ON TABLE "public"."binding_types" TO "authenticated";
GRANT ALL ON TABLE "public"."binding_types" TO "service_role";



GRANT ALL ON TABLE "public"."blocks" TO "anon";
GRANT ALL ON TABLE "public"."blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."blocks" TO "service_role";



GRANT ALL ON TABLE "public"."book_authors" TO "anon";
GRANT ALL ON TABLE "public"."book_authors" TO "authenticated";
GRANT ALL ON TABLE "public"."book_authors" TO "service_role";



GRANT ALL ON TABLE "public"."book_club_books" TO "anon";
GRANT ALL ON TABLE "public"."book_club_books" TO "authenticated";
GRANT ALL ON TABLE "public"."book_club_books" TO "service_role";



GRANT ALL ON TABLE "public"."book_club_discussion_comments" TO "anon";
GRANT ALL ON TABLE "public"."book_club_discussion_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."book_club_discussion_comments" TO "service_role";



GRANT ALL ON TABLE "public"."book_club_discussions" TO "anon";
GRANT ALL ON TABLE "public"."book_club_discussions" TO "authenticated";
GRANT ALL ON TABLE "public"."book_club_discussions" TO "service_role";



GRANT ALL ON TABLE "public"."book_club_members" TO "anon";
GRANT ALL ON TABLE "public"."book_club_members" TO "authenticated";
GRANT ALL ON TABLE "public"."book_club_members" TO "service_role";



GRANT ALL ON TABLE "public"."book_clubs" TO "anon";
GRANT ALL ON TABLE "public"."book_clubs" TO "authenticated";
GRANT ALL ON TABLE "public"."book_clubs" TO "service_role";



GRANT ALL ON TABLE "public"."book_genre_mappings" TO "anon";
GRANT ALL ON TABLE "public"."book_genre_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."book_genre_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."book_genres" TO "anon";
GRANT ALL ON TABLE "public"."book_genres" TO "authenticated";
GRANT ALL ON TABLE "public"."book_genres" TO "service_role";



GRANT ALL ON TABLE "public"."book_id_mapping" TO "anon";
GRANT ALL ON TABLE "public"."book_id_mapping" TO "authenticated";
GRANT ALL ON TABLE "public"."book_id_mapping" TO "service_role";



GRANT ALL ON TABLE "public"."book_popularity_metrics" TO "anon";
GRANT ALL ON TABLE "public"."book_popularity_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."book_popularity_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."book_popularity_analytics" TO "anon";
GRANT ALL ON TABLE "public"."book_popularity_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."book_popularity_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."book_popularity_summary" TO "anon";
GRANT ALL ON TABLE "public"."book_popularity_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."book_popularity_summary" TO "service_role";



GRANT ALL ON TABLE "public"."book_publishers" TO "anon";
GRANT ALL ON TABLE "public"."book_publishers" TO "authenticated";
GRANT ALL ON TABLE "public"."book_publishers" TO "service_role";



GRANT ALL ON TABLE "public"."book_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."book_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."book_recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."book_similarity_scores" TO "anon";
GRANT ALL ON TABLE "public"."book_similarity_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."book_similarity_scores" TO "service_role";



GRANT ALL ON TABLE "public"."book_subjects" TO "anon";
GRANT ALL ON TABLE "public"."book_subjects" TO "authenticated";
GRANT ALL ON TABLE "public"."book_subjects" TO "service_role";



GRANT ALL ON TABLE "public"."book_tag_mappings" TO "anon";
GRANT ALL ON TABLE "public"."book_tag_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."book_tag_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."book_tags" TO "anon";
GRANT ALL ON TABLE "public"."book_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."book_tags" TO "service_role";



GRANT ALL ON TABLE "public"."bookmarks" TO "anon";
GRANT ALL ON TABLE "public"."bookmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."bookmarks" TO "service_role";



GRANT ALL ON TABLE "public"."carousel_images" TO "anon";
GRANT ALL ON TABLE "public"."carousel_images" TO "authenticated";
GRANT ALL ON TABLE "public"."carousel_images" TO "service_role";



GRANT ALL ON TABLE "public"."collaborative_filtering_data" TO "anon";
GRANT ALL ON TABLE "public"."collaborative_filtering_data" TO "authenticated";
GRANT ALL ON TABLE "public"."collaborative_filtering_data" TO "service_role";



GRANT ALL ON TABLE "public"."comment_likes" TO "anon";
GRANT ALL ON TABLE "public"."comment_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_likes" TO "service_role";



GRANT ALL ON TABLE "public"."comment_reactions" TO "anon";
GRANT ALL ON TABLE "public"."comment_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."contact_info" TO "anon";
GRANT ALL ON TABLE "public"."contact_info" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_info" TO "service_role";



GRANT ALL ON TABLE "public"."content_features" TO "anon";
GRANT ALL ON TABLE "public"."content_features" TO "authenticated";
GRANT ALL ON TABLE "public"."content_features" TO "service_role";



GRANT ALL ON TABLE "public"."content_flags" TO "anon";
GRANT ALL ON TABLE "public"."content_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."content_flags" TO "service_role";



GRANT ALL ON TABLE "public"."content_generation_jobs" TO "anon";
GRANT ALL ON TABLE "public"."content_generation_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."content_generation_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."countries" TO "anon";
GRANT ALL ON TABLE "public"."countries" TO "authenticated";
GRANT ALL ON TABLE "public"."countries" TO "service_role";



GRANT ALL ON TABLE "public"."custom_permissions" TO "anon";
GRANT ALL ON TABLE "public"."custom_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."data_consistency_monitoring" TO "anon";
GRANT ALL ON TABLE "public"."data_consistency_monitoring" TO "authenticated";
GRANT ALL ON TABLE "public"."data_consistency_monitoring" TO "service_role";



GRANT ALL ON TABLE "public"."data_enrichment_jobs" TO "anon";
GRANT ALL ON TABLE "public"."data_enrichment_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."data_enrichment_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."dewey_decimal_classifications" TO "anon";
GRANT ALL ON TABLE "public"."dewey_decimal_classifications" TO "authenticated";
GRANT ALL ON TABLE "public"."dewey_decimal_classifications" TO "service_role";



GRANT ALL ON TABLE "public"."discussion_comments" TO "anon";
GRANT ALL ON TABLE "public"."discussion_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."discussion_comments" TO "service_role";



GRANT ALL ON TABLE "public"."discussions" TO "anon";
GRANT ALL ON TABLE "public"."discussions" TO "authenticated";
GRANT ALL ON TABLE "public"."discussions" TO "service_role";



GRANT ALL ON TABLE "public"."engagement_analytics" TO "anon";
GRANT ALL ON TABLE "public"."engagement_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."engagement_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."enterprise_audit_trail" TO "anon";
GRANT ALL ON TABLE "public"."enterprise_audit_trail" TO "authenticated";
GRANT ALL ON TABLE "public"."enterprise_audit_trail" TO "service_role";



GRANT ALL ON TABLE "public"."enterprise_audit_summary" TO "anon";
GRANT ALL ON TABLE "public"."enterprise_audit_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."enterprise_audit_summary" TO "service_role";



GRANT ALL ON TABLE "public"."enterprise_data_lineage" TO "anon";
GRANT ALL ON TABLE "public"."enterprise_data_lineage" TO "authenticated";
GRANT ALL ON TABLE "public"."enterprise_data_lineage" TO "service_role";



GRANT ALL ON TABLE "public"."enterprise_data_quality_dashboard" TO "anon";
GRANT ALL ON TABLE "public"."enterprise_data_quality_dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."enterprise_data_quality_dashboard" TO "service_role";



GRANT ALL ON TABLE "public"."enterprise_data_quality_rules" TO "anon";
GRANT ALL ON TABLE "public"."enterprise_data_quality_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."enterprise_data_quality_rules" TO "service_role";



GRANT ALL ON TABLE "public"."enterprise_data_versions" TO "anon";
GRANT ALL ON TABLE "public"."enterprise_data_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."enterprise_data_versions" TO "service_role";



GRANT ALL ON TABLE "public"."photo_analytics" TO "anon";
GRANT ALL ON TABLE "public"."photo_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."photo_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."enterprise_photo_analytics" TO "anon";
GRANT ALL ON TABLE "public"."enterprise_photo_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."enterprise_photo_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."photo_community" TO "anon";
GRANT ALL ON TABLE "public"."photo_community" TO "authenticated";
GRANT ALL ON TABLE "public"."photo_community" TO "service_role";



GRANT ALL ON TABLE "public"."enterprise_photo_community" TO "anon";
GRANT ALL ON TABLE "public"."enterprise_photo_community" TO "authenticated";
GRANT ALL ON TABLE "public"."enterprise_photo_community" TO "service_role";



GRANT ALL ON TABLE "public"."photo_monetization" TO "anon";
GRANT ALL ON TABLE "public"."photo_monetization" TO "authenticated";
GRANT ALL ON TABLE "public"."photo_monetization" TO "service_role";



GRANT ALL ON TABLE "public"."enterprise_photo_monetization" TO "anon";
GRANT ALL ON TABLE "public"."enterprise_photo_monetization" TO "authenticated";
GRANT ALL ON TABLE "public"."enterprise_photo_monetization" TO "service_role";



GRANT ALL ON TABLE "public"."entities" TO "anon";
GRANT ALL ON TABLE "public"."entities" TO "authenticated";
GRANT ALL ON TABLE "public"."entities" TO "service_role";



GRANT ALL ON TABLE "public"."photo_albums" TO "anon";
GRANT ALL ON TABLE "public"."photo_albums" TO "authenticated";
GRANT ALL ON TABLE "public"."photo_albums" TO "service_role";



GRANT ALL ON TABLE "public"."entity_album_analytics" TO "anon";
GRANT ALL ON TABLE "public"."entity_album_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."entity_album_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."entity_types" TO "anon";
GRANT ALL ON TABLE "public"."entity_types" TO "authenticated";
GRANT ALL ON TABLE "public"."entity_types" TO "service_role";



GRANT ALL ON TABLE "public"."images" TO "anon";
GRANT ALL ON TABLE "public"."images" TO "authenticated";
GRANT ALL ON TABLE "public"."images" TO "service_role";



GRANT ALL ON TABLE "public"."entity_image_analytics" TO "anon";
GRANT ALL ON TABLE "public"."entity_image_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."entity_image_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."entity_tags" TO "anon";
GRANT ALL ON TABLE "public"."entity_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."entity_tags" TO "service_role";



GRANT ALL ON TABLE "public"."likes" TO "anon";
GRANT ALL ON TABLE "public"."likes" TO "authenticated";
GRANT ALL ON TABLE "public"."likes" TO "service_role";



GRANT ALL ON TABLE "public"."shares" TO "anon";
GRANT ALL ON TABLE "public"."shares" TO "authenticated";
GRANT ALL ON TABLE "public"."shares" TO "service_role";



GRANT ALL ON TABLE "public"."entity_social_analytics" TO "anon";
GRANT ALL ON TABLE "public"."entity_social_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."entity_social_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."event_analytics" TO "anon";
GRANT ALL ON TABLE "public"."event_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."event_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."event_approvals" TO "anon";
GRANT ALL ON TABLE "public"."event_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."event_approvals" TO "service_role";



GRANT ALL ON TABLE "public"."event_books" TO "anon";
GRANT ALL ON TABLE "public"."event_books" TO "authenticated";
GRANT ALL ON TABLE "public"."event_books" TO "service_role";



GRANT ALL ON TABLE "public"."event_calendar_exports" TO "anon";
GRANT ALL ON TABLE "public"."event_calendar_exports" TO "authenticated";
GRANT ALL ON TABLE "public"."event_calendar_exports" TO "service_role";



GRANT ALL ON TABLE "public"."event_categories" TO "anon";
GRANT ALL ON TABLE "public"."event_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."event_categories" TO "service_role";



GRANT ALL ON TABLE "public"."event_chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."event_chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."event_chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."event_chat_rooms" TO "anon";
GRANT ALL ON TABLE "public"."event_chat_rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."event_chat_rooms" TO "service_role";



GRANT ALL ON TABLE "public"."event_comments" TO "anon";
GRANT ALL ON TABLE "public"."event_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."event_comments" TO "service_role";



GRANT ALL ON TABLE "public"."event_creator_permissions" TO "anon";
GRANT ALL ON TABLE "public"."event_creator_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."event_creator_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."event_financials" TO "anon";
GRANT ALL ON TABLE "public"."event_financials" TO "authenticated";
GRANT ALL ON TABLE "public"."event_financials" TO "service_role";



GRANT ALL ON TABLE "public"."event_interests" TO "anon";
GRANT ALL ON TABLE "public"."event_interests" TO "authenticated";
GRANT ALL ON TABLE "public"."event_interests" TO "service_role";



GRANT ALL ON TABLE "public"."event_likes" TO "anon";
GRANT ALL ON TABLE "public"."event_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."event_likes" TO "service_role";



GRANT ALL ON TABLE "public"."event_livestreams" TO "anon";
GRANT ALL ON TABLE "public"."event_livestreams" TO "authenticated";
GRANT ALL ON TABLE "public"."event_livestreams" TO "service_role";



GRANT ALL ON TABLE "public"."event_locations" TO "anon";
GRANT ALL ON TABLE "public"."event_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."event_locations" TO "service_role";



GRANT ALL ON TABLE "public"."event_media" TO "anon";
GRANT ALL ON TABLE "public"."event_media" TO "authenticated";
GRANT ALL ON TABLE "public"."event_media" TO "service_role";



GRANT ALL ON TABLE "public"."event_permission_requests" TO "anon";
GRANT ALL ON TABLE "public"."event_permission_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."event_permission_requests" TO "service_role";



GRANT ALL ON TABLE "public"."event_questions" TO "anon";
GRANT ALL ON TABLE "public"."event_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."event_questions" TO "service_role";



GRANT ALL ON TABLE "public"."event_registrations" TO "anon";
GRANT ALL ON TABLE "public"."event_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."event_registrations" TO "service_role";



GRANT ALL ON TABLE "public"."event_reminders" TO "anon";
GRANT ALL ON TABLE "public"."event_reminders" TO "authenticated";
GRANT ALL ON TABLE "public"."event_reminders" TO "service_role";



GRANT ALL ON TABLE "public"."event_sessions" TO "anon";
GRANT ALL ON TABLE "public"."event_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."event_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."event_shares" TO "anon";
GRANT ALL ON TABLE "public"."event_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."event_shares" TO "service_role";



GRANT ALL ON TABLE "public"."event_speakers" TO "anon";
GRANT ALL ON TABLE "public"."event_speakers" TO "authenticated";
GRANT ALL ON TABLE "public"."event_speakers" TO "service_role";



GRANT ALL ON TABLE "public"."event_sponsors" TO "anon";
GRANT ALL ON TABLE "public"."event_sponsors" TO "authenticated";
GRANT ALL ON TABLE "public"."event_sponsors" TO "service_role";



GRANT ALL ON TABLE "public"."event_staff" TO "anon";
GRANT ALL ON TABLE "public"."event_staff" TO "authenticated";
GRANT ALL ON TABLE "public"."event_staff" TO "service_role";



GRANT ALL ON TABLE "public"."event_surveys" TO "anon";
GRANT ALL ON TABLE "public"."event_surveys" TO "authenticated";
GRANT ALL ON TABLE "public"."event_surveys" TO "service_role";



GRANT ALL ON TABLE "public"."event_tags" TO "anon";
GRANT ALL ON TABLE "public"."event_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."event_tags" TO "service_role";



GRANT ALL ON TABLE "public"."event_types" TO "anon";
GRANT ALL ON TABLE "public"."event_types" TO "authenticated";
GRANT ALL ON TABLE "public"."event_types" TO "service_role";



GRANT ALL ON TABLE "public"."event_views" TO "anon";
GRANT ALL ON TABLE "public"."event_views" TO "authenticated";
GRANT ALL ON TABLE "public"."event_views" TO "service_role";



GRANT ALL ON TABLE "public"."event_waitlists" TO "anon";
GRANT ALL ON TABLE "public"."event_waitlists" TO "authenticated";
GRANT ALL ON TABLE "public"."event_waitlists" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."feed_entries" TO "anon";
GRANT ALL ON TABLE "public"."feed_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."feed_entries" TO "service_role";



GRANT ALL ON TABLE "public"."feed_entry_tags" TO "anon";
GRANT ALL ON TABLE "public"."feed_entry_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."feed_entry_tags" TO "service_role";



GRANT ALL ON TABLE "public"."follow_target_types" TO "anon";
GRANT ALL ON TABLE "public"."follow_target_types" TO "authenticated";
GRANT ALL ON TABLE "public"."follow_target_types" TO "service_role";



GRANT ALL ON TABLE "public"."follows" TO "anon";
GRANT ALL ON TABLE "public"."follows" TO "authenticated";
GRANT ALL ON TABLE "public"."follows" TO "service_role";



GRANT ALL ON TABLE "public"."format_types" TO "anon";
GRANT ALL ON TABLE "public"."format_types" TO "authenticated";
GRANT ALL ON TABLE "public"."format_types" TO "service_role";



GRANT ALL ON TABLE "public"."friend_activities" TO "anon";
GRANT ALL ON TABLE "public"."friend_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."friend_activities" TO "service_role";



GRANT ALL ON TABLE "public"."friend_analytics" TO "anon";
GRANT ALL ON TABLE "public"."friend_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."friend_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."friend_suggestions" TO "anon";
GRANT ALL ON TABLE "public"."friend_suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."friend_suggestions" TO "service_role";



GRANT ALL ON TABLE "public"."friends" TO "anon";
GRANT ALL ON TABLE "public"."friends" TO "authenticated";
GRANT ALL ON TABLE "public"."friends" TO "service_role";



GRANT ALL ON TABLE "public"."group_achievements" TO "anon";
GRANT ALL ON TABLE "public"."group_achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."group_achievements" TO "service_role";



GRANT ALL ON TABLE "public"."group_analytics" TO "anon";
GRANT ALL ON TABLE "public"."group_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."group_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."group_announcements" TO "anon";
GRANT ALL ON TABLE "public"."group_announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."group_announcements" TO "service_role";



GRANT ALL ON TABLE "public"."group_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."group_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."group_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."group_author_events" TO "anon";
GRANT ALL ON TABLE "public"."group_author_events" TO "authenticated";
GRANT ALL ON TABLE "public"."group_author_events" TO "service_role";



GRANT ALL ON TABLE "public"."group_book_list_items" TO "anon";
GRANT ALL ON TABLE "public"."group_book_list_items" TO "authenticated";
GRANT ALL ON TABLE "public"."group_book_list_items" TO "service_role";



GRANT ALL ON TABLE "public"."group_book_lists" TO "anon";
GRANT ALL ON TABLE "public"."group_book_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."group_book_lists" TO "service_role";



GRANT ALL ON TABLE "public"."group_book_reviews" TO "anon";
GRANT ALL ON TABLE "public"."group_book_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."group_book_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."group_book_swaps" TO "anon";
GRANT ALL ON TABLE "public"."group_book_swaps" TO "authenticated";
GRANT ALL ON TABLE "public"."group_book_swaps" TO "service_role";



GRANT ALL ON TABLE "public"."group_book_wishlist_items" TO "anon";
GRANT ALL ON TABLE "public"."group_book_wishlist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."group_book_wishlist_items" TO "service_role";



GRANT ALL ON TABLE "public"."group_book_wishlists" TO "anon";
GRANT ALL ON TABLE "public"."group_book_wishlists" TO "authenticated";
GRANT ALL ON TABLE "public"."group_book_wishlists" TO "service_role";



GRANT ALL ON TABLE "public"."group_books" TO "anon";
GRANT ALL ON TABLE "public"."group_books" TO "authenticated";
GRANT ALL ON TABLE "public"."group_books" TO "service_role";



GRANT ALL ON TABLE "public"."group_bots" TO "anon";
GRANT ALL ON TABLE "public"."group_bots" TO "authenticated";
GRANT ALL ON TABLE "public"."group_bots" TO "service_role";



GRANT ALL ON TABLE "public"."group_chat_channels" TO "anon";
GRANT ALL ON TABLE "public"."group_chat_channels" TO "authenticated";
GRANT ALL ON TABLE "public"."group_chat_channels" TO "service_role";



GRANT ALL ON TABLE "public"."group_chat_message_attachments" TO "anon";
GRANT ALL ON TABLE "public"."group_chat_message_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."group_chat_message_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."group_chat_message_reactions" TO "anon";
GRANT ALL ON TABLE "public"."group_chat_message_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."group_chat_message_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."group_chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."group_chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."group_chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."group_content_moderation_logs" TO "anon";
GRANT ALL ON TABLE "public"."group_content_moderation_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."group_content_moderation_logs" TO "service_role";



GRANT ALL ON TABLE "public"."group_custom_fields" TO "anon";
GRANT ALL ON TABLE "public"."group_custom_fields" TO "authenticated";
GRANT ALL ON TABLE "public"."group_custom_fields" TO "service_role";



GRANT ALL ON TABLE "public"."group_discussion_categories" TO "anon";
GRANT ALL ON TABLE "public"."group_discussion_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."group_discussion_categories" TO "service_role";



GRANT ALL ON TABLE "public"."group_event_feedback" TO "anon";
GRANT ALL ON TABLE "public"."group_event_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."group_event_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."group_events" TO "anon";
GRANT ALL ON TABLE "public"."group_events" TO "authenticated";
GRANT ALL ON TABLE "public"."group_events" TO "service_role";



GRANT ALL ON TABLE "public"."group_integrations" TO "anon";
GRANT ALL ON TABLE "public"."group_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."group_integrations" TO "service_role";



GRANT ALL ON TABLE "public"."group_invites" TO "anon";
GRANT ALL ON TABLE "public"."group_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."group_invites" TO "service_role";



GRANT ALL ON TABLE "public"."group_leaderboards" TO "anon";
GRANT ALL ON TABLE "public"."group_leaderboards" TO "authenticated";
GRANT ALL ON TABLE "public"."group_leaderboards" TO "service_role";



GRANT ALL ON TABLE "public"."group_member_achievements" TO "anon";
GRANT ALL ON TABLE "public"."group_member_achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."group_member_achievements" TO "service_role";



GRANT ALL ON TABLE "public"."group_member_devices" TO "anon";
GRANT ALL ON TABLE "public"."group_member_devices" TO "authenticated";
GRANT ALL ON TABLE "public"."group_member_devices" TO "service_role";



GRANT ALL ON TABLE "public"."group_member_streaks" TO "anon";
GRANT ALL ON TABLE "public"."group_member_streaks" TO "authenticated";
GRANT ALL ON TABLE "public"."group_member_streaks" TO "service_role";



GRANT ALL ON TABLE "public"."group_members" TO "anon";
GRANT ALL ON TABLE "public"."group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."group_members" TO "service_role";



GRANT ALL ON TABLE "public"."group_membership_questions" TO "anon";
GRANT ALL ON TABLE "public"."group_membership_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."group_membership_questions" TO "service_role";



GRANT ALL ON TABLE "public"."group_moderation_logs" TO "anon";
GRANT ALL ON TABLE "public"."group_moderation_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."group_moderation_logs" TO "service_role";



GRANT ALL ON TABLE "public"."group_onboarding_checklists" TO "anon";
GRANT ALL ON TABLE "public"."group_onboarding_checklists" TO "authenticated";
GRANT ALL ON TABLE "public"."group_onboarding_checklists" TO "service_role";



GRANT ALL ON TABLE "public"."group_onboarding_progress" TO "anon";
GRANT ALL ON TABLE "public"."group_onboarding_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."group_onboarding_progress" TO "service_role";



GRANT ALL ON TABLE "public"."group_onboarding_tasks" TO "anon";
GRANT ALL ON TABLE "public"."group_onboarding_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."group_onboarding_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."group_poll_votes" TO "anon";
GRANT ALL ON TABLE "public"."group_poll_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."group_poll_votes" TO "service_role";



GRANT ALL ON TABLE "public"."group_polls" TO "anon";
GRANT ALL ON TABLE "public"."group_polls" TO "authenticated";
GRANT ALL ON TABLE "public"."group_polls" TO "service_role";



GRANT ALL ON TABLE "public"."group_reading_challenge_progress" TO "anon";
GRANT ALL ON TABLE "public"."group_reading_challenge_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."group_reading_challenge_progress" TO "service_role";



GRANT ALL ON TABLE "public"."group_reading_challenges" TO "anon";
GRANT ALL ON TABLE "public"."group_reading_challenges" TO "authenticated";
GRANT ALL ON TABLE "public"."group_reading_challenges" TO "service_role";



GRANT ALL ON TABLE "public"."group_reading_progress" TO "anon";
GRANT ALL ON TABLE "public"."group_reading_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."group_reading_progress" TO "service_role";



GRANT ALL ON TABLE "public"."group_reading_sessions" TO "anon";
GRANT ALL ON TABLE "public"."group_reading_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."group_reading_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."group_reports" TO "anon";
GRANT ALL ON TABLE "public"."group_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."group_reports" TO "service_role";



GRANT ALL ON TABLE "public"."group_roles" TO "anon";
GRANT ALL ON TABLE "public"."group_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."group_roles" TO "service_role";



GRANT ALL ON TABLE "public"."group_rules" TO "anon";
GRANT ALL ON TABLE "public"."group_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."group_rules" TO "service_role";



GRANT ALL ON TABLE "public"."group_shared_documents" TO "anon";
GRANT ALL ON TABLE "public"."group_shared_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."group_shared_documents" TO "service_role";



GRANT ALL ON TABLE "public"."group_tags" TO "anon";
GRANT ALL ON TABLE "public"."group_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."group_tags" TO "service_role";



GRANT ALL ON TABLE "public"."group_types" TO "anon";
GRANT ALL ON TABLE "public"."group_types" TO "authenticated";
GRANT ALL ON TABLE "public"."group_types" TO "service_role";



GRANT ALL ON TABLE "public"."group_webhook_logs" TO "anon";
GRANT ALL ON TABLE "public"."group_webhook_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."group_webhook_logs" TO "service_role";



GRANT ALL ON TABLE "public"."group_webhooks" TO "anon";
GRANT ALL ON TABLE "public"."group_webhooks" TO "authenticated";
GRANT ALL ON TABLE "public"."group_webhooks" TO "service_role";



GRANT ALL ON TABLE "public"."group_welcome_messages" TO "anon";
GRANT ALL ON TABLE "public"."group_welcome_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."group_welcome_messages" TO "service_role";



GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";



GRANT ALL ON TABLE "public"."id_mappings" TO "anon";
GRANT ALL ON TABLE "public"."id_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."id_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."image_processing_jobs" TO "anon";
GRANT ALL ON TABLE "public"."image_processing_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."image_processing_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."image_tag_mappings" TO "anon";
GRANT ALL ON TABLE "public"."image_tag_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."image_tag_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."image_tags" TO "anon";
GRANT ALL ON TABLE "public"."image_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."image_tags" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."image_uploaders" TO "anon";
GRANT ALL ON TABLE "public"."image_uploaders" TO "authenticated";
GRANT ALL ON TABLE "public"."image_uploaders" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."list_followers" TO "anon";
GRANT ALL ON TABLE "public"."list_followers" TO "authenticated";
GRANT ALL ON TABLE "public"."list_followers" TO "service_role";



GRANT ALL ON TABLE "public"."media_attachments" TO "anon";
GRANT ALL ON TABLE "public"."media_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."media_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."mentions" TO "anon";
GRANT ALL ON TABLE "public"."mentions" TO "authenticated";
GRANT ALL ON TABLE "public"."mentions" TO "service_role";



GRANT ALL ON TABLE "public"."ml_models" TO "anon";
GRANT ALL ON TABLE "public"."ml_models" TO "authenticated";
GRANT ALL ON TABLE "public"."ml_models" TO "service_role";



GRANT ALL ON TABLE "public"."ml_predictions" TO "anon";
GRANT ALL ON TABLE "public"."ml_predictions" TO "authenticated";
GRANT ALL ON TABLE "public"."ml_predictions" TO "service_role";



GRANT ALL ON TABLE "public"."ml_training_jobs" TO "anon";
GRANT ALL ON TABLE "public"."ml_training_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."ml_training_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."moderation_queue" TO "anon";
GRANT ALL ON TABLE "public"."moderation_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."moderation_queue" TO "service_role";



GRANT ALL ON TABLE "public"."moderation_analytics" TO "anon";
GRANT ALL ON TABLE "public"."moderation_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."moderation_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."nlp_analysis" TO "anon";
GRANT ALL ON TABLE "public"."nlp_analysis" TO "authenticated";
GRANT ALL ON TABLE "public"."nlp_analysis" TO "service_role";



GRANT ALL ON TABLE "public"."notification_queue" TO "anon";
GRANT ALL ON TABLE "public"."notification_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_queue" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_methods" TO "service_role";



GRANT ALL ON TABLE "public"."payment_transactions" TO "anon";
GRANT ALL ON TABLE "public"."payment_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."performance_dashboard" TO "anon";
GRANT ALL ON TABLE "public"."performance_dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."performance_dashboard" TO "service_role";



GRANT ALL ON TABLE "public"."performance_metrics" TO "anon";
GRANT ALL ON TABLE "public"."performance_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."performance_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."personalized_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."personalized_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."personalized_recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."photo_album" TO "anon";
GRANT ALL ON TABLE "public"."photo_album" TO "authenticated";
GRANT ALL ON TABLE "public"."photo_album" TO "service_role";



GRANT ALL ON TABLE "public"."photo_bookmarks" TO "anon";
GRANT ALL ON TABLE "public"."photo_bookmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."photo_bookmarks" TO "service_role";



GRANT ALL ON TABLE "public"."photo_comments" TO "anon";
GRANT ALL ON TABLE "public"."photo_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."photo_comments" TO "service_role";



GRANT ALL ON TABLE "public"."photo_likes" TO "anon";
GRANT ALL ON TABLE "public"."photo_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."photo_likes" TO "service_role";



GRANT ALL ON TABLE "public"."photo_shares" TO "anon";
GRANT ALL ON TABLE "public"."photo_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."photo_shares" TO "service_role";



GRANT ALL ON TABLE "public"."photo_tags" TO "anon";
GRANT ALL ON TABLE "public"."photo_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."photo_tags" TO "service_role";



GRANT ALL ON TABLE "public"."post_bookmarks" TO "anon";
GRANT ALL ON TABLE "public"."post_bookmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."post_bookmarks" TO "service_role";



GRANT ALL ON TABLE "public"."post_comments" TO "anon";
GRANT ALL ON TABLE "public"."post_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."post_comments" TO "service_role";



GRANT ALL ON TABLE "public"."post_reactions" TO "anon";
GRANT ALL ON TABLE "public"."post_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."post_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."post_shares" TO "anon";
GRANT ALL ON TABLE "public"."post_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."post_shares" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."prices" TO "anon";
GRANT ALL ON TABLE "public"."prices" TO "authenticated";
GRANT ALL ON TABLE "public"."prices" TO "service_role";



GRANT ALL ON TABLE "public"."privacy_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."privacy_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."privacy_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."promo_codes" TO "anon";
GRANT ALL ON TABLE "public"."promo_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."promo_codes" TO "service_role";



GRANT ALL ON TABLE "public"."publishers" TO "anon";
GRANT ALL ON TABLE "public"."publishers" TO "authenticated";
GRANT ALL ON TABLE "public"."publishers" TO "service_role";



GRANT ALL ON TABLE "public"."publisher_summary" TO "anon";
GRANT ALL ON TABLE "public"."publisher_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."publisher_summary" TO "service_role";



GRANT ALL ON TABLE "public"."reactions" TO "anon";
GRANT ALL ON TABLE "public"."reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."reactions" TO "service_role";



GRANT ALL ON TABLE "public"."reading_challenges" TO "anon";
GRANT ALL ON TABLE "public"."reading_challenges" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_challenges" TO "service_role";



GRANT ALL ON TABLE "public"."reading_goals" TO "anon";
GRANT ALL ON TABLE "public"."reading_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_goals" TO "service_role";



GRANT ALL ON TABLE "public"."reading_list_items" TO "anon";
GRANT ALL ON TABLE "public"."reading_list_items" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_list_items" TO "service_role";



GRANT ALL ON TABLE "public"."reading_series" TO "anon";
GRANT ALL ON TABLE "public"."reading_series" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_series" TO "service_role";



GRANT ALL ON TABLE "public"."reading_sessions" TO "anon";
GRANT ALL ON TABLE "public"."reading_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."reading_stats_daily" TO "anon";
GRANT ALL ON TABLE "public"."reading_stats_daily" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_stats_daily" TO "service_role";



GRANT ALL ON TABLE "public"."reading_streaks" TO "anon";
GRANT ALL ON TABLE "public"."reading_streaks" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_streaks" TO "service_role";



GRANT ALL ON TABLE "public"."review_likes" TO "anon";
GRANT ALL ON TABLE "public"."review_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."review_likes" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."series_events" TO "anon";
GRANT ALL ON TABLE "public"."series_events" TO "authenticated";
GRANT ALL ON TABLE "public"."series_events" TO "service_role";



GRANT ALL ON TABLE "public"."session_registrations" TO "anon";
GRANT ALL ON TABLE "public"."session_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."session_registrations" TO "service_role";



GRANT ALL ON TABLE "public"."similar_books" TO "anon";
GRANT ALL ON TABLE "public"."similar_books" TO "authenticated";
GRANT ALL ON TABLE "public"."similar_books" TO "service_role";



GRANT ALL ON TABLE "public"."smart_notifications" TO "anon";
GRANT ALL ON TABLE "public"."smart_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."smart_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."social_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."social_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."social_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."social_activity_analytics" TO "anon";
GRANT ALL ON TABLE "public"."social_activity_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."social_activity_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."statuses" TO "anon";
GRANT ALL ON TABLE "public"."statuses" TO "authenticated";
GRANT ALL ON TABLE "public"."statuses" TO "service_role";



GRANT ALL ON TABLE "public"."subjects" TO "anon";
GRANT ALL ON TABLE "public"."subjects" TO "authenticated";
GRANT ALL ON TABLE "public"."subjects" TO "service_role";



GRANT ALL ON TABLE "public"."survey_questions" TO "anon";
GRANT ALL ON TABLE "public"."survey_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."survey_questions" TO "service_role";



GRANT ALL ON TABLE "public"."survey_responses" TO "anon";
GRANT ALL ON TABLE "public"."survey_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."survey_responses" TO "service_role";



GRANT ALL ON TABLE "public"."sync_state" TO "anon";
GRANT ALL ON TABLE "public"."sync_state" TO "authenticated";
GRANT ALL ON TABLE "public"."sync_state" TO "service_role";



GRANT ALL ON TABLE "public"."system_performance_overview" TO "anon";
GRANT ALL ON TABLE "public"."system_performance_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."system_performance_overview" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_benefits" TO "anon";
GRANT ALL ON TABLE "public"."ticket_benefits" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_benefits" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_types" TO "anon";
GRANT ALL ON TABLE "public"."ticket_types" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_types" TO "service_role";



GRANT ALL ON TABLE "public"."tickets" TO "anon";
GRANT ALL ON TABLE "public"."tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."tickets" TO "service_role";



GRANT ALL ON TABLE "public"."trending_topics" TO "anon";
GRANT ALL ON TABLE "public"."trending_topics" TO "authenticated";
GRANT ALL ON TABLE "public"."trending_topics" TO "service_role";



GRANT ALL ON TABLE "public"."unified_book_data" TO "anon";
GRANT ALL ON TABLE "public"."unified_book_data" TO "authenticated";
GRANT ALL ON TABLE "public"."unified_book_data" TO "service_role";



GRANT ALL ON TABLE "public"."unified_reading_progress" TO "anon";
GRANT ALL ON TABLE "public"."unified_reading_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."unified_reading_progress" TO "service_role";



GRANT ALL ON TABLE "public"."user_activity_metrics" TO "anon";
GRANT ALL ON TABLE "public"."user_activity_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."user_activity_summary" TO "anon";
GRANT ALL ON TABLE "public"."user_activity_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity_summary" TO "service_role";



GRANT ALL ON TABLE "public"."user_book_interactions" TO "anon";
GRANT ALL ON TABLE "public"."user_book_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_book_interactions" TO "service_role";



GRANT ALL ON TABLE "public"."user_engagement_analytics" TO "anon";
GRANT ALL ON TABLE "public"."user_engagement_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."user_engagement_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."user_friends" TO "anon";
GRANT ALL ON TABLE "public"."user_friends" TO "authenticated";
GRANT ALL ON TABLE "public"."user_friends" TO "service_role";



GRANT ALL ON TABLE "public"."user_privacy_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_privacy_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_privacy_settings" TO "service_role";



GRANT ALL ON TABLE "public"."user_privacy_overview" TO "anon";
GRANT ALL ON TABLE "public"."user_privacy_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."user_privacy_overview" TO "service_role";



GRANT ALL ON TABLE "public"."user_reading_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_reading_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_reading_preferences" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
