-- Migration: Add add_image_to_entity_album function
-- Date: 2025-07-13
-- Description: Creates the missing add_image_to_entity_album function for entity image management

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

-- Create helper function to get entity album
CREATE OR REPLACE FUNCTION public.get_entity_album(
    p_entity_id uuid,
    p_entity_type text,
    p_album_type text
)
RETURNS TABLE(
    album_id uuid,
    album_name text,
    album_description text,
    total_images bigint,
    is_public boolean,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pa.id as album_id,
        pa.name as album_name,
        pa.description as album_description,
        COUNT(ai.id) as total_images,
        pa.is_public,
        pa.created_at,
        pa.updated_at
    FROM public.photo_albums pa
    LEFT JOIN public.album_images ai ON pa.id = ai.album_id
    WHERE pa.entity_id = p_entity_id
    AND pa.entity_type = p_entity_type
    AND pa.album_type = p_album_type
    GROUP BY pa.id, pa.name, pa.description, pa.is_public, pa.created_at, pa.updated_at;
END;
$$;

-- Add function comment
COMMENT ON FUNCTION public.get_entity_album(uuid, text, text) IS 
'Gets album information for a specific entity and album type.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_entity_album(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_entity_album(uuid, text, text) TO service_role;

-- Create helper function to remove image from entity album
CREATE OR REPLACE FUNCTION public.remove_image_from_entity_album(
    p_entity_id uuid,
    p_entity_type text,
    p_album_type text,
    p_image_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_album_id uuid;
    v_deleted_count integer;
BEGIN
    -- Get album ID
    SELECT id INTO v_album_id
    FROM public.photo_albums
    WHERE entity_id = p_entity_id
    AND entity_type = p_entity_type
    AND album_type = p_album_type;
    
    IF v_album_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Remove image from album
    DELETE FROM public.album_images
    WHERE album_id = v_album_id
    AND image_id = p_image_id;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Update album metadata
    IF v_deleted_count > 0 THEN
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
    END IF;
    
    RETURN v_deleted_count > 0;
END;
$$;

-- Add function comment
COMMENT ON FUNCTION public.remove_image_from_entity_album(uuid, text, text, uuid) IS 
'Removes an image from an entity album. Returns true if image was removed, false if not found.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.remove_image_from_entity_album(uuid, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_image_from_entity_album(uuid, text, text, uuid) TO service_role;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photo_albums_entity_lookup 
ON public.photo_albums(entity_id, entity_type, album_type);

CREATE INDEX IF NOT EXISTS idx_album_images_album_image 
ON public.album_images(album_id, image_id);

CREATE INDEX IF NOT EXISTS idx_album_images_entity_lookup 
ON public.album_images(entity_id, entity_type_id);

-- Add RLS policies for the new functions
ALTER TABLE public.photo_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_images ENABLE ROW LEVEL SECURITY;

-- Policy for photo_albums - users can see public albums or their own
CREATE POLICY "Users can view public albums or their own albums" ON public.photo_albums
    FOR SELECT USING (
        is_public = true OR 
        entity_id IN (
            SELECT id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Policy for photo_albums - users can insert/update their own albums
CREATE POLICY "Users can manage their own albums" ON public.photo_albums
    FOR ALL USING (
        entity_id IN (
            SELECT id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Policy for album_images - users can see images in public albums or their own
CREATE POLICY "Users can view images in public albums or their own" ON public.album_images
    FOR SELECT USING (
        album_id IN (
            SELECT id FROM public.photo_albums 
            WHERE is_public = true OR 
                  entity_id IN (SELECT id FROM public.profiles WHERE id = auth.uid())
        )
    );

-- Policy for album_images - users can manage images in their own albums
CREATE POLICY "Users can manage images in their own albums" ON public.album_images
    FOR ALL USING (
        album_id IN (
            SELECT id FROM public.photo_albums 
            WHERE entity_id IN (SELECT id FROM public.profiles WHERE id = auth.uid())
        )
    );

-- Log the migration
INSERT INTO public.migrations (name, executed_at) 
VALUES ('20250713_add_image_to_entity_album_function', now())
ON CONFLICT (name) DO NOTHING; 