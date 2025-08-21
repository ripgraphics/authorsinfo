-- SIMPLE FIX: Add missing columns to activities table for post editing
-- Run this directly in your database console

-- Add the missing columns (IF NOT EXISTS prevents errors if already added)
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS text TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS link_url TEXT,
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update the function to return these columns
DROP FUNCTION IF EXISTS public.get_user_feed_activities(uuid, integer, integer);

CREATE OR REPLACE FUNCTION public.get_user_feed_activities(
    p_user_id uuid,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE(
    id uuid,
    user_id uuid,
    activity_type text,
    entity_type text,
    entity_id text,
    is_public boolean,
    metadata jsonb,
    created_at timestamptz,
    user_name text,
    user_avatar_url text,
    like_count bigint,
    comment_count bigint,
    is_liked boolean,
    text text,
    image_url text,
    link_url text,
    visibility text,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.user_id,
        a.activity_type,
        a.entity_type,
        a.entity_id,
        a.is_public,
        a.metadata,
        a.created_at,
        COALESCE(up.raw_user_meta_data->>'name', up.email) as user_name,
        up.raw_user_meta_data->>'avatar_url' as user_avatar_url,
        0::bigint as like_count,
        0::bigint as comment_count,
        false as is_liked,
        a.text,
        a.image_url,
        a.link_url,
        a.visibility,
        a.updated_at
    FROM public.activities a
    LEFT JOIN auth.users up ON a.user_id = up.id
    WHERE a.user_id = p_user_id
    ORDER BY a.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

SELECT 'Activities table fixed for post editing!' as status;
