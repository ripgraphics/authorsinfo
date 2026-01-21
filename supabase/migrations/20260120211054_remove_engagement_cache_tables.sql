-- Remove engagement cache tables and unify views into public.views
-- Created: 2026-01-20

-- Step 1: Allow anonymous views in unified views table
ALTER TABLE public.views
ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Migrate book_views into views (single source of truth)
DO $$
BEGIN
  IF to_regclass('public.book_views') IS NOT NULL THEN
    INSERT INTO public.views (
      id,
      user_id,
      entity_type,
      entity_id,
      view_duration,
      view_source,
      view_metadata,
      is_completed,
      created_at,
      updated_at,
      view_count
    )
    SELECT
      gen_random_uuid(),
      bv.user_id,
      'book',
      bv.book_id,
      0,
      'direct',
      '{}'::jsonb,
      false,
      COALESCE(bv.viewed_at, NOW()),
      COALESCE(bv.viewed_at, NOW()),
      1
    FROM public.book_views bv
    WHERE bv.book_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.views v
        WHERE v.entity_type = 'book'
          AND v.entity_id = bv.book_id
          AND v.user_id IS NOT DISTINCT FROM bv.user_id
      );
  END IF;
END $$;

-- Step 3: Migrate event_views into views (single source of truth)
DO $$
BEGIN
  IF to_regclass('public.event_views') IS NOT NULL THEN
    INSERT INTO public.views (
      id,
      user_id,
      entity_type,
      entity_id,
      view_duration,
      view_source,
      view_metadata,
      is_completed,
      created_at,
      updated_at,
      view_count
    )
    SELECT
      gen_random_uuid(),
      ev.user_id,
      'event',
      ev.event_id,
      0,
      'direct',
      jsonb_build_object(
        'ip_address', ev.ip_address,
        'user_agent', ev.user_agent,
        'referrer', ev.referrer
      ),
      false,
      COALESCE(ev.viewed_at, NOW()),
      COALESCE(ev.viewed_at, NOW()),
      1
    FROM public.event_views ev
    WHERE ev.event_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.views v
        WHERE v.entity_type = 'event'
          AND v.entity_id = ev.event_id
          AND v.user_id IS NOT DISTINCT FROM ev.user_id
      );
  END IF;
END $$;

-- Step 4: Remove triggers that maintain cache tables
DROP TRIGGER IF EXISTS "trigger_bookmarks_count_update" ON public.bookmarks;
DROP TRIGGER IF EXISTS "trigger_comments_count_update" ON public.comments;
DROP TRIGGER IF EXISTS "trigger_likes_count_update" ON public.likes;
DROP TRIGGER IF EXISTS "trigger_shares_count_update" ON public.shares;

-- Step 5: Drop cache-related trigger functions
DROP FUNCTION IF EXISTS public.trigger_update_comment_count();
DROP FUNCTION IF EXISTS public.trigger_update_engagement_count();

-- Step 6: Drop cache maintenance functions
DROP FUNCTION IF EXISTS public.increment_comment_count_safe(text, uuid);
DROP FUNCTION IF EXISTS public.decrement_comment_count_safe(text, uuid);
DROP FUNCTION IF EXISTS public.increment_engagement_count_safe(text, uuid, text);
DROP FUNCTION IF EXISTS public.decrement_engagement_count_safe(text, uuid, text);
DROP FUNCTION IF EXISTS public.get_comment_count(text, uuid);
DROP FUNCTION IF EXISTS public.get_comment_count_stats();
DROP FUNCTION IF EXISTS public.get_engagement_count(text, uuid, text);
DROP FUNCTION IF EXISTS public.get_all_engagement_counts(text, uuid);
DROP FUNCTION IF EXISTS public.check_comment_count_integrity(text, uuid);
DROP FUNCTION IF EXISTS public.check_engagement_count_integrity(text, uuid, text);
DROP FUNCTION IF EXISTS public.rebuild_all_comment_counts();
DROP FUNCTION IF EXISTS public.rebuild_all_engagement_counts(text);

-- Step 7: Drop cache tables (single source of truth is engagement tables)
DROP TABLE IF EXISTS public.comment_counts CASCADE;
DROP TABLE IF EXISTS public.engagement_counts CASCADE;

-- Step 8: Update data quality checks to use live engagement tables
CREATE OR REPLACE FUNCTION public.check_comprehensive_data_quality()
RETURNS TABLE(table_name text, quality_metric text, issue_count bigint, severity text, recommendation text)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    -- Check for orphaned like records
    SELECT 
        'likes' as table_name,
        'orphaned_records' as quality_metric,
        COUNT(*) as issue_count,
        'high' as severity,
        'Remove orphaned engagement records' as recommendation
    FROM public.likes l
    LEFT JOIN public.users u ON l.user_id = u.id
    WHERE u.id IS NULL

    UNION ALL

    -- Check for orphaned comment records
    SELECT 
        'comments' as table_name,
        'orphaned_records' as quality_metric,
        COUNT(*) as issue_count,
        'high' as severity,
        'Remove orphaned engagement records' as recommendation
    FROM public.comments c
    LEFT JOIN public.users u ON c.user_id = u.id
    WHERE u.id IS NULL

    UNION ALL

    -- Check for activities with invalid entity references
    SELECT 
        'activities' as table_name,
        'invalid_entity_references' as quality_metric,
        COUNT(*) as issue_count,
        'medium' as severity,
        'Fix invalid entity references' as recommendation
    FROM public.activities a
    WHERE a.entity_type IS NOT NULL 
      AND a.entity_id IS NOT NULL
      AND NOT public.entity_exists(a.entity_type, a.entity_id)

    UNION ALL

    -- Check for users with invalid email formats
    SELECT 
        'users' as table_name,
        'invalid_email_format' as quality_metric,
        COUNT(*) as issue_count,
        'medium' as severity,
        'Fix invalid email formats' as recommendation
    FROM public.users u
    WHERE u.email IS NOT NULL 
      AND u.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'

    UNION ALL

    -- Check for activities with excessive engagement counts (dynamic)
    SELECT 
        'activities' as table_name,
        'excessive_engagement_counts' as quality_metric,
        COUNT(*) as issue_count,
        'low' as severity,
        'Review excessive engagement counts' as recommendation
    FROM public.activities a
    WHERE (
        (SELECT COUNT(*) FROM public.likes l WHERE l.entity_type = 'activity' AND l.entity_id = a.id) > 1000000
        OR (SELECT COUNT(*) FROM public.comments c WHERE c.entity_type = 'activity' AND c.entity_id = a.id AND c.is_deleted = false) > 100000
        OR (SELECT COUNT(*) FROM public.shares s WHERE s.entity_type = 'activity' AND s.entity_id = a.id) > 100000
    );
END;
$$;

COMMENT ON FUNCTION public.check_comprehensive_data_quality() IS 'Check data quality across all tables using engagement tables as the single source of truth';

-- Step 9: Update book popularity and analytics to use views table
CREATE OR REPLACE FUNCTION public.update_book_popularity_metrics(p_book_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.book_popularity_metrics (
        book_id, views_count, reviews_count, avg_rating, 
        reading_progress_count, reading_list_count
    )
    SELECT 
        b.id,
        COALESCE(COUNT(DISTINCT v.id), 0) as views_count,
        COALESCE(COUNT(DISTINCT br.id), 0) as reviews_count,
        COALESCE(AVG(br.rating), 0) as avg_rating,
        COALESCE(COUNT(DISTINCT rp.id), 0) as reading_progress_count,
        COALESCE(COUNT(DISTINCT rli.id), 0) as reading_list_count
    FROM public.books b
    LEFT JOIN public.views v
      ON b.id = v.entity_id
     AND v.entity_type = 'book'
    LEFT JOIN public.book_reviews br ON b.id = br.book_id
    LEFT JOIN public.reading_progress rp ON b.id = rp.book_id
    LEFT JOIN public.reading_list_items rli ON b.id = rli.book_id
    WHERE b.id = p_book_id
    GROUP BY b.id
    ON CONFLICT (book_id) DO UPDATE SET
        views_count = EXCLUDED.views_count,
        reviews_count = EXCLUDED.reviews_count,
        avg_rating = EXCLUDED.avg_rating,
        reading_progress_count = EXCLUDED.reading_progress_count,
        reading_list_count = EXCLUDED.reading_list_count,
        last_updated = now();
END;
$$;

COMMENT ON FUNCTION public.update_book_popularity_metrics(p_book_id uuid) IS 'Updates book popularity metrics using unified views table';

CREATE OR REPLACE FUNCTION public.perform_database_maintenance_enhanced()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_maintenance_result jsonb;
    v_start_time timestamp with time zone := now();
    v_operations_completed integer := 0;
    v_errors text[] := '{}';
BEGIN
    -- Clean up old monitoring data
    BEGIN
        PERFORM public.cleanup_old_monitoring_data(90);
        v_operations_completed := v_operations_completed + 1;
    EXCEPTION WHEN OTHERS THEN
        v_errors := array_append(v_errors, 'Failed to cleanup monitoring data: ' || SQLERRM);
    END;

    -- Update book popularity metrics for all books
    BEGIN
        PERFORM public.update_book_popularity_metrics(b.id)
        FROM public.books b
        WHERE b.id IN (
            SELECT DISTINCT v.entity_id
            FROM public.views v
            WHERE v.entity_type = 'book'
              AND v.created_at >= now() - INTERVAL '7 days'
        );
        v_operations_completed := v_operations_completed + 1;
    EXCEPTION WHEN OTHERS THEN
        v_errors := array_append(v_errors, 'Failed to update book popularity: ' || SQLERRM);
    END;

    -- Analyze tables for query optimization
    BEGIN
        ANALYZE public.books;
        ANALYZE public.book_reviews;
        ANALYZE public.reading_progress;
        ANALYZE public.user_activity_log;
        v_operations_completed := v_operations_completed + 1;
    EXCEPTION WHEN OTHERS THEN
        v_errors := array_append(v_errors, 'Failed to analyze tables: ' || SQLERRM);
    END;

    v_maintenance_result := jsonb_build_object(
        'start_time', v_start_time,
        'end_time', now(),
        'operations_completed', v_operations_completed,
        'errors', v_errors
    );

    RETURN v_maintenance_result;
END;
$$;

COMMENT ON FUNCTION public.perform_database_maintenance_enhanced() IS 'Enhanced database maintenance with unified views table';

CREATE OR REPLACE VIEW public.advanced_analytics_dashboard_enhanced AS
SELECT (SELECT count(DISTINCT reading_progress.user_id) AS count
        FROM public.reading_progress) AS active_readers,
       (SELECT count(DISTINCT book_reviews.user_id) AS count
        FROM public.book_reviews) AS active_reviewers,
       (SELECT count(DISTINCT reading_lists.user_id) AS count
        FROM public.reading_lists) AS list_creators,
       (SELECT count(*) AS count
        FROM public.books) AS total_books,
       (SELECT count(*) AS count
        FROM public.views
        WHERE views.entity_type = 'book') AS total_book_views,
       (SELECT count(*) AS count
        FROM public.book_reviews) AS total_reviews,
       (SELECT round(avg(book_reviews.rating), 2) AS round
        FROM public.book_reviews
        WHERE book_reviews.rating IS NOT NULL) AS avg_rating,
       (SELECT count(*) AS count
        FROM public.user_activity_log
        WHERE user_activity_log.created_at >= (now() - '24:00:00'::interval)) AS activities_last_24h,
       (SELECT count(*) AS count
        FROM public.system_health_checks
        WHERE system_health_checks.checked_at >= (now() - '24:00:00'::interval)) AS health_checks_last_24h,
       (SELECT count(*) AS count
        FROM public.books
        WHERE books.title IS NULL OR length(TRIM(BOTH FROM books.title)) = 0) AS books_without_title,
       (SELECT count(*) AS count
        FROM public.books
        WHERE books.author IS NULL OR length(TRIM(BOTH FROM books.author)) = 0) AS books_without_author,
       now() AS dashboard_timestamp;

ALTER TABLE public.advanced_analytics_dashboard_enhanced OWNER TO postgres;

-- Step 10: Drop legacy view tables
DROP TABLE IF EXISTS public.book_views CASCADE;
DROP TABLE IF EXISTS public.event_views CASCADE;

-- Step 11: Migration log
DO $$
BEGIN
  RAISE NOTICE 'Removed engagement cache tables and unified views into public.views';
  RAISE NOTICE 'Dropped comment_counts, engagement_counts, book_views, event_views';
  RAISE NOTICE 'Engagement tables (likes, comments, shares, bookmarks, views) are the single source of truth';
END $$;
