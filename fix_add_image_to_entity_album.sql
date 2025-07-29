-- Fix: Add missing add_image_to_entity_album function
-- Run this in the Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the add_image_to_entity_album function
CREATE OR REPLACE FUNCTION public.add_image_to_entity_album(
    p_entity_id uuid,
    p_entity_type text,
    p_album_type text,
    p_image_id uuid,
    p_display_order integer DEFAULT 1,
    p_is_cover boolean DEFAULT false,
    p_is_featured boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_album_id uuid;
    v_entity_type_id uuid;
    v_existing_album_images record;
    v_max_display_order integer;
BEGIN
    -- Get entity type ID
    SELECT id INTO v_entity_type_id
    FROM public.entity_types
    WHERE entity_category = p_entity_type;
    
    IF v_entity_type_id IS NULL THEN
        RAISE EXCEPTION 'Entity type % not found', p_entity_type;
    END IF;
    
    -- Check if album exists, create if it doesn't
    SELECT id INTO v_album_id
    FROM public.photo_albums
    WHERE entity_id = p_entity_id
    AND entity_type = p_entity_type
    AND album_type = p_album_type;
    
    IF v_album_id IS NULL THEN
        -- Create new album
        INSERT INTO public.photo_albums (
            name,
            description,
            entity_id,
            entity_type,
            album_type,
            is_public,
            metadata
        ) VALUES (
            p_album_type,
            'Auto-created album for ' || p_entity_type || ' ' || p_entity_id,
            p_entity_id,
            p_entity_type,
            p_album_type,
            false,
            jsonb_build_object(
                'created_via', 'add_image_to_entity_album',
                'total_images', 0,
                'total_size', 0,
                'last_modified', now()
            )
        ) RETURNING id INTO v_album_id;
    END IF;
    
    -- Check if image is already in album
    SELECT * INTO v_existing_album_images
    FROM public.album_images
    WHERE album_id = v_album_id
    AND image_id = p_image_id;
    
    IF v_existing_album_images IS NOT NULL THEN
        -- Update existing record
        UPDATE public.album_images
        SET 
            display_order = p_display_order,
            is_cover = p_is_cover,
            is_featured = p_is_featured,
            updated_at = now()
        WHERE album_id = v_album_id
        AND image_id = p_image_id;
    ELSE
        -- Get max display order if not specified
        IF p_display_order IS NULL OR p_display_order <= 0 THEN
            SELECT COALESCE(MAX(display_order), 0) + 1 INTO v_max_display_order
            FROM public.album_images
            WHERE album_id = v_album_id;
        ELSE
            v_max_display_order := p_display_order;
        END IF;
        
        -- Insert new album image record
        INSERT INTO public.album_images (
            album_id,
            image_id,
            display_order,
            is_cover,
            is_featured,
            entity_type_id,
            entity_id,
            metadata
        ) VALUES (
            v_album_id,
            p_image_id,
            v_max_display_order,
            p_is_cover,
            p_is_featured,
            v_entity_type_id,
            p_entity_id,
            jsonb_build_object(
                'added_via', 'add_image_to_entity_album',
                'added_at', now()
            )
        );
    END IF;
    
    -- Update album metadata
    UPDATE public.photo_albums
    SET 
        metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{total_images}',
            to_jsonb(
                (SELECT COUNT(*) FROM public.album_images WHERE album_id = v_album_id)
            )
        ),
        updated_at = now()
    WHERE id = v_album_id;
    
    -- If this is a cover image, clear other cover images in the same album
    IF p_is_cover THEN
        UPDATE public.album_images
        SET is_cover = false
        WHERE album_id = v_album_id
        AND image_id != p_image_id;
    END IF;
    
    -- If this is a featured image, clear other featured images in the same album
    IF p_is_featured THEN
        UPDATE public.album_images
        SET is_featured = false
        WHERE album_id = v_album_id
        AND image_id != p_image_id;
    END IF;
    
    RETURN v_album_id;
END;
$$;

-- Add function comment
COMMENT ON FUNCTION public.add_image_to_entity_album(uuid, text, text, uuid, integer, boolean, boolean) IS 
'Adds an image to an entity album, creating the album if it doesn''t exist. Returns the album ID.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.add_image_to_entity_album(uuid, text, text, uuid, integer, boolean, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_image_to_entity_album(uuid, text, text, uuid, integer, boolean, boolean) TO service_role;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photo_albums_entity_lookup 
ON public.photo_albums(entity_id, entity_type, album_type);

CREATE INDEX IF NOT EXISTS idx_album_images_album_image 
ON public.album_images(album_id, image_id);

CREATE INDEX IF NOT EXISTS idx_album_images_entity_lookup 
ON public.album_images(entity_id, entity_type_id);

-- Verify the function was created
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'add_image_to_entity_album'
AND routine_schema = 'public'; 