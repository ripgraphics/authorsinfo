-- Migration to update get_entity_engagement function with better mapping - FIXED V2
-- Created: 2026-01-21

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
        
        -- Explicit mapping for timeline entries to their consolidated engagement types
        IF p_entity_type = 'book' THEN
            SELECT id INTO v_entity_type_id FROM public.entity_types WHERE name = 'Book Post' LIMIT 1;
        ELSIF p_entity_type IN ('activity', 'post') THEN
            SELECT id INTO v_entity_type_id FROM public.entity_types WHERE name = 'Post' LIMIT 1;
        ELSE
            -- Fallback to direct lookup by name
            SELECT id INTO v_entity_type_id FROM public.entity_types WHERE name ILIKE p_entity_type LIMIT 1;
        END IF;
    END IF;

    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.likes 
         WHERE (entity_types_id = v_entity_type_id OR entity_type = v_entity_type_name) 
           AND entity_id = p_entity_id) as likes_count,
        
        (SELECT COUNT(*) FROM public.comments 
         WHERE (entity_type = v_entity_type_id::TEXT OR entity_type = v_entity_type_name)
           AND entity_id = p_entity_id 
           AND is_deleted = false AND is_hidden = false) as comments_count,
        
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
        ) l) as recent_likes,
        
        (SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', c.id,
                'user_id', c.user_id,
                'comment_text', c.content,
                'created_at', c.created_at
            )
        ), '[]'::jsonb) FROM (
            SELECT id, user_id, content, created_at
            FROM public.comments
            WHERE (entity_type = v_entity_type_id::TEXT OR entity_type = v_entity_type_name)
              AND entity_id = p_entity_id
              AND is_deleted = false AND is_hidden = false
            ORDER BY created_at DESC
            LIMIT 5
        ) c) as recent_comments;
END;
$$;
