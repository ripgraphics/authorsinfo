-- Enterprise pagination for reactions modal
-- Returns one row per reacting user (latest reaction), with keyset pagination
-- Includes direct entity reactions + reactions on comments/replies belonging to the entity

CREATE OR REPLACE FUNCTION public.get_entity_reactors_paginated(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_limit INTEGER DEFAULT 51,
    p_cursor_created_at TIMESTAMPTZ DEFAULT NULL,
    p_cursor_user_id UUID DEFAULT NULL
) RETURNS TABLE(
    user_id UUID,
    reaction_type TEXT,
    created_at TIMESTAMPTZ,
    total_count BIGINT
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
    WITH target_comments AS (
        SELECT c.id
        FROM public.comments c
        WHERE c.entity_id = p_entity_id
          AND c.is_deleted = false
          AND c.is_hidden = false
    ),
    all_reactions AS (
        SELECT
            l.user_id,
            COALESCE(l.reaction_type, 'like')::TEXT AS reaction_type,
            l.created_at
        FROM public.likes l
        WHERE l.entity_id = p_entity_id
          AND (
            l.entity_types_id = v_entity_type_id
            OR l.entity_type = v_entity_type_name
            OR l.entity_type = p_entity_type
          )

        UNION ALL

        SELECT
            l.user_id,
            COALESCE(l.reaction_type, 'like')::TEXT AS reaction_type,
            l.created_at
        FROM public.likes l
        JOIN target_comments tc ON tc.id = l.entity_id
        WHERE l.entity_type = 'comment'
    ),
    latest_per_user AS (
        SELECT DISTINCT ON (ar.user_id)
            ar.user_id,
            ar.reaction_type,
            ar.created_at
        FROM all_reactions ar
        ORDER BY ar.user_id, ar.created_at DESC
    ),
    filtered AS (
        SELECT
            lpu.user_id,
            lpu.reaction_type,
            lpu.created_at
        FROM latest_per_user lpu
        WHERE p_cursor_created_at IS NULL
           OR p_cursor_user_id IS NULL
           OR (lpu.created_at, lpu.user_id) < (p_cursor_created_at, p_cursor_user_id)
        ORDER BY lpu.created_at DESC, lpu.user_id DESC
    ),
    counted AS (
        SELECT
            f.user_id,
            f.reaction_type,
            f.created_at,
            (SELECT COUNT(*) FROM latest_per_user) AS total_count
        FROM filtered f
    )
    SELECT
        c.user_id,
        c.reaction_type,
        c.created_at,
        c.total_count
    FROM counted c
    LIMIT GREATEST(COALESCE(p_limit, 51), 1);
END;
$$;
