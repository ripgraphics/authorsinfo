-- Fix: Align engagement RPC comparisons with live schema UUID types
--
-- Live schema (verified):
--   public.likes.entity_id    = UUID
--   public.comments.entity_id = UUID
--   public.comments.id        = UUID
--
-- Therefore engagement RPCs must use UUID=UUID comparisons only.
-- Previous migration 20260218000001 assumed likes.entity_id TEXT and introduced
-- UUID↔TEXT casts that can fail with: operator does not exist: uuid = text
--
-- This migration preserves required behavior:
--   1) comment-level reactions remain scoped to each comment
--   2) post likes_count rolls up direct post likes + likes on its comments

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

        -- Direct likes on the entity (UUID = UUID)
        (SELECT COUNT(*) FROM public.likes l
         WHERE l.entity_id = rt.id
           AND (l.entity_types_id = rt.type_id
                OR l.entity_type = rt.type_name
                OR l.entity_type = rt.raw_type)
        )
        +
        -- Likes on comments belonging to this entity (roll up)
        (SELECT COUNT(*) FROM public.likes l
           JOIN public.comments c ON c.id = l.entity_id
          WHERE c.entity_id = rt.id
            AND l.entity_type = 'comment'
            AND c.is_deleted = false
            AND c.is_hidden = false
        ) AS likes_count,

        -- Comments count on the entity
        (SELECT COUNT(*) FROM public.comments c
         WHERE c.entity_id = rt.id
           AND (c.entity_type = rt.type_id::TEXT
                OR c.entity_type = rt.type_name
                OR c.entity_type = rt.raw_type)
           AND c.is_deleted = false
           AND c.is_hidden = false
        ) AS comments_count

    FROM resolved_types rt;
END;
$$;


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

        -- Recent direct likes (same behavior as before)
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
              AND entity_id = p_entity_id
            ORDER BY created_at DESC
            LIMIT 5
        ) l) AS recent_likes,

        -- Recent comments on entity
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
              AND entity_id = p_entity_id
              AND is_deleted = false AND is_hidden = false
            ORDER BY created_at DESC
            LIMIT 5
        ) c) AS recent_comments;
END;
$$;
