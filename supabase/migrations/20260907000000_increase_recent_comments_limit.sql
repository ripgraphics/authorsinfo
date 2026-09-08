-- Increase recent_comments raw limit in get_entity_engagement from 5 to 15.
--
-- The feed card's "Recent Commenters" hover popup deduplicates raw comments by
-- user and shows the 5 most recent unique commenters. With the previous LIMIT 5,
-- a single user commenting multiple times could crowd out other commenters and
-- the popup would show fewer than 5 names. Fetching 15 raw comments guarantees
-- enough rows to surface 5 unique commenters for typical threads.

-- Return type changed (added unique_reactors_count, unique_commenters_count),
-- so the existing function must be dropped before recreation.
DROP FUNCTION IF EXISTS public.get_entity_engagement(TEXT, UUID);

CREATE OR REPLACE FUNCTION public.get_entity_engagement(
    p_entity_type TEXT,
    p_entity_id UUID
) RETURNS TABLE(
    likes_count bigint,
    comments_count bigint,
    unique_reactors_count bigint,
    unique_commenters_count bigint,
    recent_likes jsonb,
    recent_comments jsonb
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_entity_type_id UUID;
    v_entity_type_name TEXT;
BEGIN
    IF p_entity_type ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_entity_type_id := p_entity_type::UUID;
        SELECT name INTO v_entity_type_name FROM public.entity_types WHERE id = v_entity_type_id;
    ELSE
        v_entity_type_name := p_entity_type;

        IF p_entity_type = 'book' THEN
            SELECT id INTO v_entity_type_id FROM public.entity_types WHERE name = 'Book Post' LIMIT 1;
        ELSIF p_entity_type IN ('activity', 'post') THEN
            SELECT id INTO v_entity_type_id FROM public.entity_types WHERE name = 'Post' LIMIT 1;
        ELSE
            SELECT id INTO v_entity_type_id FROM public.entity_types WHERE name ILIKE p_entity_type LIMIT 1;
        END IF;
    END IF;

    RETURN QUERY
    SELECT
        -- Direct likes on entity
        (SELECT COUNT(*) FROM public.likes
          WHERE (entity_types_id = v_entity_type_id OR entity_type = v_entity_type_name)
            AND entity_id = p_entity_id)
        +
        -- Likes on comments belonging to this entity (roll up)
        (SELECT COUNT(*) FROM public.likes l
           JOIN public.comments c ON c.id = l.entity_id
          WHERE c.entity_id = p_entity_id
            AND l.entity_type = 'comment'
            AND c.is_deleted = false
            AND c.is_hidden = false
        ) AS likes_count,

        -- Comments count on entity
        (SELECT COUNT(*) FROM public.comments
          WHERE (entity_type = v_entity_type_id::TEXT OR entity_type = v_entity_type_name)
            AND entity_id = p_entity_id
            AND is_deleted = false AND is_hidden = false
        ) AS comments_count,

        -- Unique reactors (direct + comment-level, deduplicated by user)
        (SELECT COUNT(DISTINCT u.user_id) FROM (
            SELECT user_id FROM public.likes
             WHERE (entity_types_id = v_entity_type_id OR entity_type = v_entity_type_name)
               AND entity_id = p_entity_id
            UNION
            SELECT l.user_id FROM public.likes l
             JOIN public.comments c ON c.id = l.entity_id
             WHERE c.entity_id = p_entity_id
               AND l.entity_type = 'comment'
               AND c.is_deleted = false
               AND c.is_hidden = false
        ) u) AS unique_reactors_count,

        -- Unique commenters
        (SELECT COUNT(DISTINCT user_id) FROM public.comments
          WHERE (entity_type = v_entity_type_id::TEXT OR entity_type = v_entity_type_name)
            AND entity_id = p_entity_id
            AND is_deleted = false AND is_hidden = false
        ) AS unique_commenters_count,

        -- Recent reactors (one row per user across direct + comment-level likes,
        -- most recent first, so the popup shows unique reactors)
        (SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'user_id', l.user_id,
                'created_at', l.created_at,
                'reaction_type', l.reaction_type
            )
        ), '[]'::jsonb) FROM (
            SELECT * FROM (
                SELECT DISTINCT ON (user_id) user_id, created_at, reaction_type
                FROM (
                    SELECT user_id, created_at, reaction_type
                    FROM public.likes
                    WHERE (entity_types_id = v_entity_type_id OR entity_type = v_entity_type_name)
                      AND entity_id = p_entity_id
                    UNION ALL
                    SELECT l.user_id, l.created_at, l.reaction_type
                    FROM public.likes l
                    JOIN public.comments c ON c.id = l.entity_id
                    WHERE c.entity_id = p_entity_id
                      AND l.entity_type = 'comment'
                      AND c.is_deleted = false
                      AND c.is_hidden = false
                ) combined
                ORDER BY user_id, created_at DESC
            ) d
            ORDER BY d.created_at DESC
            LIMIT 15
        ) l) AS recent_likes,

        -- Recent comments on entity (one row per user, most recent first,
        -- so the client can show 5 unique commenters reliably)
        (SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', c.id,
                'user_id', c.user_id,
                'comment_text', c.content,
                'created_at', c.created_at,
                'parent_comment_id', c.parent_comment_id
            )
        ), '[]'::jsonb) FROM (
            SELECT * FROM (
                SELECT DISTINCT ON (user_id) id, user_id, content, created_at, parent_comment_id
                FROM public.comments
                WHERE (entity_type = v_entity_type_id::TEXT OR entity_type = v_entity_type_name)
                  AND entity_id = p_entity_id
                  AND is_deleted = false AND is_hidden = false
                ORDER BY user_id, created_at DESC
            ) d
            ORDER BY d.created_at DESC
            LIMIT 15
        ) c) AS recent_comments;
END;
$$;

-- Re-apply grants lost when the function was dropped
GRANT EXECUTE ON FUNCTION public.get_entity_engagement(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_entity_engagement(TEXT, UUID) TO anon;
