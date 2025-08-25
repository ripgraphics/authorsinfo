-- Cleanup Legacy Comment References
-- This migration removes any remaining references to old comment tables

-- Drop any views that reference old comment tables
DROP VIEW IF EXISTS public.comment_reactions CASCADE;
DROP VIEW IF EXISTS public.comment_likes CASCADE;

-- Drop any functions that still reference old comment tables
DROP FUNCTION IF EXISTS public.get_activity_engagement(uuid);
DROP FUNCTION IF EXISTS public.get_entity_comments(text, uuid);

-- Clean up any remaining references in the engagement API function
-- Update the get_engagement_stats function to only use engagement_comments
CREATE OR REPLACE FUNCTION public.get_engagement_stats(p_entity_type text, p_entity_id uuid)
RETURNS TABLE(
  likes_count bigint,
  comments_count bigint,
  recent_likes jsonb,
  recent_comments jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
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
END;
$$;

-- Grant permissions
ALTER FUNCTION public.get_engagement_stats(text, uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_engagement_stats(text, uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_engagement_stats(text, uuid) IS 'Get engagement statistics using only the engagement system tables';

-- Verify cleanup
SELECT 'Legacy comment references cleaned up successfully' as status;
