-- Migration: Include comment reactions in parent post like count
-- When displaying a post's engagement, likes on its comments are also summed
-- into the post's likes_count so the total reflects all engagement on
-- both the post and its comment threads.
-- Created: 2026-02-18

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Update get_multiple_entities_engagement (used by the feed/timeline API)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_multiple_entities_engagement(
    p_entity_ids UUID[],
    p_entity_types TEXT[]
) RETURNS TABLE(
    entity_id UUID,
    likes_count bigint,
    comments_count bigint
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    WITH entity_params AS (
        SELECT
            unnest(p_entity_ids) as id,
            unnest(p_entity_types) as raw_type
    ),
    resolved_types AS (
        SELECT
            ep.id,
            ep.raw_type,
            et.id as type_id,
            et.name as type_name
        FROM entity_params ep
        LEFT JOIN public.entity_types et ON
            et.name ILIKE ep.raw_type
            OR (ep.raw_type = 'book' AND et.name = 'Book Post')
            OR (ep.raw_type IN ('activity', 'post', 'user') AND et.name = 'Post')
    )
    SELECT
        rt.id,

        -- Direct likes on the post entity
        (SELECT COUNT(*) FROM public.likes l
         WHERE l.entity_id = rt.id::TEXT
           AND (l.entity_types_id = rt.type_id
                OR l.entity_type = rt.type_name
                OR l.entity_type = rt.raw_type)
        )
        +
        -- Likes on comments that belong to this post (comment reactions roll up)
        (SELECT COUNT(*) FROM public.likes l
           JOIN public.comments c ON c.id::TEXT = l.entity_id
          WHERE c.entity_id = rt.id::TEXT
            AND l.entity_type = 'comment'
            AND c.is_deleted = false
            AND c.is_hidden = false
        ) AS likes_count,

        (SELECT COUNT(*) FROM public.comments c
         WHERE c.entity_id = rt.id::TEXT
           AND (c.entity_type = rt.type_id::TEXT
                OR c.entity_type = rt.type_name
                OR c.entity_type = rt.raw_type)
           AND c.is_deleted = false
           AND c.is_hidden = false
        ) AS comments_count

    FROM resolved_types rt;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Update get_entity_engagement (used for individual post/entity views)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_entity_engagement(
    p_entity_type TEXT,
    p_entity_id UUID
) RETURNS TABLE(
    likes_count bigint,
    comments_count bigint,
    recent_likes jsonb,
    recent_comments jsonb
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_entity_type_id UUID;
    v_entity_type_name TEXT;
BEGIN
    -- Resolve entity type name to UUID if needed
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
        -- Direct likes on the entity + likes on its comments
        (SELECT COUNT(*) FROM public.likes
          WHERE (entity_types_id = v_entity_type_id OR entity_type = v_entity_type_name)
            AND entity_id = p_entity_id::TEXT)
        +
        (SELECT COUNT(*) FROM public.likes l
           JOIN public.comments c ON c.id::TEXT = l.entity_id
          WHERE c.entity_id = p_entity_id::TEXT
            AND l.entity_type = 'comment'
            AND c.is_deleted = false
            AND c.is_hidden = false
        ) AS likes_count,

        (SELECT COUNT(*) FROM public.comments
          WHERE (entity_type = v_entity_type_id::TEXT OR entity_type = v_entity_type_name)
            AND entity_id = p_entity_id::TEXT
            AND is_deleted = false AND is_hidden = false
        ) AS comments_count,

        (SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'user_id', l.user_id,
                'created_at', l.created_at,
                'reaction_type', l.reaction_type
            )
        ), '[]'::jsonb) FROM (
            SELECT user_id, created_at, reaction_type
            FROM public.likes
            WHERE (entity_types_id = v_entity_type_id OR entity_type = v_entity_type_name)
              AND entity_id = p_entity_id::TEXT
            ORDER BY created_at DESC
            LIMIT 5
        ) l) AS recent_likes,

        (SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', c.id,
                'user_id', c.user_id,
                'comment_text', c.content,
                'created_at', c.created_at,
                'parent_comment_id', c.parent_comment_id
            )
        ), '[]'::jsonb) FROM (
            SELECT id, user_id, content, created_at, parent_comment_id
            FROM public.comments
            WHERE (entity_type = v_entity_type_id::TEXT OR entity_type = v_entity_type_name)
              AND entity_id = p_entity_id::TEXT
              AND is_deleted = false AND is_hidden = false
            ORDER BY created_at DESC
            LIMIT 5
        ) c) AS recent_comments;
END;
$$;
