-- Migration to create batch engagement lookup
-- Created: 2026-01-21

CREATE OR REPLACE FUNCTION public.get_multiple_entities_engagement(
    p_entity_ids UUID[],
    p_entity_types TEXT[] -- Parallel array to p_entity_ids
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
        (SELECT COUNT(*) FROM public.likes l 
         WHERE l.entity_id = rt.id 
           AND (l.entity_types_id = rt.type_id OR l.entity_type = rt.type_name OR l.entity_type = rt.raw_type)) as likes_count,
        (SELECT COUNT(*) FROM public.comments c 
         WHERE c.entity_id = rt.id 
           AND (c.entity_type = rt.type_id::TEXT OR c.entity_type = rt.type_name OR c.entity_type = rt.raw_type)
           AND c.is_deleted = false AND c.is_hidden = false) as comments_count
    FROM resolved_types rt;
END;
$$;
