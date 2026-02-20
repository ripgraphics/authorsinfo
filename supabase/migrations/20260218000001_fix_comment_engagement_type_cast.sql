-- Fix: Correct type cast regression introduced in 20260218000000
--
-- Root cause: comments.entity_id is UUID type.
--   The previous migration used entity_id = p_entity_id::TEXT and
--   c.entity_id = rt.id::TEXT which compared UUID columns against TEXT values.
--   PostgreSQL does NOT implicitly cast TEXT → UUID, so those comparisons
--   matched nothing and every query returned 0 rows.
--
-- likes.entity_id IS TEXT, so comparing it against UUID::TEXT or a bare UUID
--   (auto-cast UUID→TEXT) both work fine — that part is unchanged.
--
-- The comment rollup JOIN (c.id::TEXT = l.entity_id) is correct because
--   comments.id is UUID and likes.entity_id is TEXT.
--
-- Created: 2026-02-18 (hotfix for 20260218000000)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Fix get_multiple_entities_engagement
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

        -- Direct likes on the post entity (likes.entity_id is TEXT, auto-cast UUID→TEXT)
        (SELECT COUNT(*) FROM public.likes l
         WHERE l.entity_id = rt.id::TEXT
           AND (l.entity_types_id = rt.type_id
                OR l.entity_type = rt.type_name
                OR l.entity_type = rt.raw_type)
        )
        +
        -- Likes on comments belonging to this post (comment reactions roll up).
        -- c.id (UUID)::TEXT compared to likes.entity_id (TEXT) ✓
        -- c.entity_id (UUID) compared to rt.id (UUID) ✓  ← was broken as rt.id::TEXT
        (SELECT COUNT(*) FROM public.likes l
           JOIN public.comments c ON c.id::TEXT = l.entity_id
          WHERE c.entity_id = rt.id            -- UUID = UUID (fixed from rt.id::TEXT)
            AND l.entity_type = 'comment'
            AND c.is_deleted = false
            AND c.is_hidden = false
        ) AS likes_count,

        -- comments.entity_id is UUID; compare UUID = UUID (fixed from rt.id::TEXT)
        (SELECT COUNT(*) FROM public.comments c
         WHERE c.entity_id = rt.id             -- UUID = UUID
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
-- 2. Fix get_entity_engagement
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
        -- Direct likes (likes.entity_id is TEXT; auto-casts UUID→TEXT for comparison)
        (SELECT COUNT(*) FROM public.likes
          WHERE (entity_types_id = v_entity_type_id OR entity_type = v_entity_type_name)
            AND entity_id = p_entity_id::TEXT)
        +
        -- Comment reaction rollup:
        --   c.id (UUID)::TEXT = l.entity_id (TEXT) ✓
        --   c.entity_id (UUID) = p_entity_id (UUID) ✓  ← was broken as p_entity_id::TEXT
        (SELECT COUNT(*) FROM public.likes l
           JOIN public.comments c ON c.id::TEXT = l.entity_id
          WHERE c.entity_id = p_entity_id       -- UUID = UUID (fixed from p_entity_id::TEXT)
            AND l.entity_type = 'comment'
            AND c.is_deleted = false
            AND c.is_hidden = false
        ) AS likes_count,

        -- comments.entity_id is UUID — UUID = UUID (fixed from p_entity_id::TEXT)
        (SELECT COUNT(*) FROM public.comments
          WHERE (entity_type = v_entity_type_id::TEXT OR entity_type = v_entity_type_name)
            AND entity_id = p_entity_id          -- UUID = UUID (fixed)
            AND is_deleted = false AND is_hidden = false
        ) AS comments_count,

        -- recent_likes: likes.entity_id is TEXT ✓
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

        -- recent_comments: comments.entity_id is UUID — UUID = UUID (fixed)
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
              AND entity_id = p_entity_id        -- UUID = UUID (fixed)
              AND is_deleted = false AND is_hidden = false
            ORDER BY created_at DESC
            LIMIT 5
        ) c) AS recent_comments;
END;
$$;
