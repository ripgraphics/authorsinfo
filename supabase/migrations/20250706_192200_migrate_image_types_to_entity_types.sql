-- =====================================================
-- MIGRATION: Transform image_types to entity_types
-- =====================================================
-- This script transforms the image_types table into a proper entity_types table
-- and updates all related references to maintain entity relationships

-- Step 1: Create the new entity_types table with proper structure
CREATE TABLE IF NOT EXISTS public.entity_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL UNIQUE,
    description text,
    entity_category text NOT NULL, -- 'user', 'publisher', 'author', 'group'
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT entity_types_entity_category_check 
        CHECK (entity_category = ANY (ARRAY['user', 'publisher', 'author', 'group']))
);

-- Add comments for enterprise documentation
COMMENT ON TABLE public.entity_types IS 'Centralized entity type definitions for enterprise-grade entity management';
COMMENT ON COLUMN public.entity_types.name IS 'Human-readable entity type name';
COMMENT ON COLUMN public.entity_types.entity_category IS 'Entity category for grouping and permissions';
COMMENT ON COLUMN public.entity_types.is_active IS 'Whether this entity type is currently active';

-- Step 2: Populate entity_types with current entity types
INSERT INTO public.entity_types (name, description, entity_category) VALUES
    ('User Profile', 'User profile photos and avatars', 'user'),
    ('User Album', 'User photo albums and galleries', 'user'),
    ('Publisher Logo', 'Publisher company logos and branding', 'publisher'),
    ('Publisher Gallery', 'Publisher photo galleries and content', 'publisher'),
    ('Author Portrait', 'Author profile photos and portraits', 'author'),
    ('Author Gallery', 'Author photo galleries and content', 'author'),
    ('Group Cover', 'Group cover images and banners', 'group'),
    ('Group Gallery', 'Group photo galleries and content', 'group'),
    ('Book Cover', 'Book cover images and artwork', 'book'),
    ('Event Banner', 'Event promotional banners and images', 'event'),
    ('Content Image', 'General content images and media', 'content');

-- Step 3: Add entity_type_id column to images table
ALTER TABLE public.images 
ADD COLUMN entity_type_id uuid,
ADD COLUMN entity_id uuid;

-- Add comments
COMMENT ON COLUMN public.images.entity_type_id IS 'Reference to entity_types table';
COMMENT ON COLUMN public.images.entity_id IS 'ID of the specific entity (user, publisher, author, group)';

-- Step 4: Create foreign key constraint for entity_type_id
ALTER TABLE public.images 
ADD CONSTRAINT images_entity_type_id_fkey 
FOREIGN KEY (entity_type_id) REFERENCES public.entity_types(id) ON DELETE SET NULL;

-- Step 5: Add constraint to ensure entity consistency
ALTER TABLE public.images 
ADD CONSTRAINT images_entity_consistency 
CHECK ((entity_type_id IS NULL AND entity_id IS NULL) 
       OR (entity_type_id IS NOT NULL AND entity_id IS NOT NULL));

-- Step 6: Create indexes for performance
CREATE INDEX idx_images_entity_type ON public.images(entity_type_id);
CREATE INDEX idx_images_entity_id ON public.images(entity_id);
CREATE INDEX idx_images_entity_composite ON public.images(entity_type_id, entity_id);

-- Step 7: Update album_images table to include entity context
ALTER TABLE public.album_images 
ADD COLUMN entity_type_id uuid,
ADD COLUMN entity_id uuid;

-- Add comments
COMMENT ON COLUMN public.album_images.entity_type_id IS 'Reference to entity_types table for album context';
COMMENT ON COLUMN public.album_images.entity_id IS 'ID of the specific entity for album context';

-- Step 8: Create foreign key constraint for album_images
ALTER TABLE public.album_images 
ADD CONSTRAINT album_images_entity_type_id_fkey 
FOREIGN KEY (entity_type_id) REFERENCES public.entity_types(id) ON DELETE SET NULL;

-- Step 9: Add constraint for album_images entity consistency
ALTER TABLE public.album_images 
ADD CONSTRAINT album_images_entity_consistency 
CHECK ((entity_type_id IS NULL AND entity_id IS NULL) 
       OR (entity_type_id IS NOT NULL AND entity_id IS NOT NULL));

-- Step 10: Create indexes for album_images
CREATE INDEX idx_album_images_entity_type ON public.album_images(entity_type_id);
CREATE INDEX idx_album_images_entity_id ON public.album_images(entity_id);
CREATE INDEX idx_album_images_entity_composite ON public.album_images(entity_type_id, entity_id);

-- Step 11: Create trigger function to maintain entity consistency
CREATE OR REPLACE FUNCTION public.maintain_entity_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure entity consistency when album_images is updated
    IF NEW.entity_type_id IS NOT NULL AND NEW.entity_id IS NULL THEN
        RAISE EXCEPTION 'entity_id must be provided when entity_type_id is set';
    END IF;
    
    IF NEW.entity_type_id IS NULL AND NEW.entity_id IS NOT NULL THEN
        RAISE EXCEPTION 'entity_type_id must be provided when entity_id is set';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Create triggers for entity consistency
CREATE TRIGGER trigger_maintain_entity_consistency_images
    BEFORE INSERT OR UPDATE ON public.images
    FOR EACH ROW
    EXECUTE FUNCTION public.maintain_entity_consistency();

CREATE TRIGGER trigger_maintain_entity_consistency_album_images
    BEFORE INSERT OR UPDATE ON public.album_images
    FOR EACH ROW
    EXECUTE FUNCTION public.maintain_entity_consistency();

-- Step 13: Create function to populate entity context from photo_albums
CREATE OR REPLACE FUNCTION public.populate_album_images_entity_context()
RETURNS void AS $$
BEGIN
    -- Update album_images with entity context from photo_albums
    UPDATE public.album_images 
    SET 
        entity_type_id = (
            SELECT et.id 
            FROM public.entity_types et 
            WHERE et.entity_category = pa.entity_type
        ),
        entity_id = pa.entity_id
    FROM public.photo_albums pa
    WHERE album_images.album_id = pa.id
    AND pa.entity_type IS NOT NULL 
    AND pa.entity_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 14: Create function to populate images entity context from album_images
CREATE OR REPLACE FUNCTION public.populate_images_entity_context()
RETURNS void AS $$
BEGIN
    -- Update images with entity context from album_images
    UPDATE public.images 
    SET 
        entity_type_id = ai.entity_type_id,
        entity_id = ai.entity_id
    FROM public.album_images ai
    WHERE images.id = ai.image_id
    AND ai.entity_type_id IS NOT NULL 
    AND ai.entity_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 15: Create view for enterprise analytics
CREATE OR REPLACE VIEW public.entity_image_analytics AS
SELECT 
    et.name as entity_type_name,
    et.entity_category,
    COUNT(i.id) as total_images,
    COUNT(DISTINCT i.entity_id) as unique_entities,
    AVG(i.file_size) as avg_file_size,
    SUM(i.file_size) as total_storage_used,
    MIN(i.created_at) as earliest_image,
    MAX(i.created_at) as latest_image
FROM public.images i
JOIN public.entity_types et ON i.entity_type_id = et.id
WHERE i.deleted_at IS NULL
GROUP BY et.id, et.name, et.entity_category
ORDER BY total_images DESC;

-- Add comment for the view
COMMENT ON VIEW public.entity_image_analytics IS 'Enterprise analytics view for entity-based image usage and storage';

-- Step 16: Create function to get entity context for any image
CREATE OR REPLACE FUNCTION public.get_image_entity_context(image_uuid uuid)
RETURNS TABLE(
    entity_type_name text,
    entity_category text,
    entity_id uuid,
    album_name text,
    owner_name text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        et.name as entity_type_name,
        et.entity_category,
        i.entity_id,
        pa.name as album_name,
        p.full_name as owner_name
    FROM public.images i
    LEFT JOIN public.entity_types et ON i.entity_type_id = et.id
    LEFT JOIN public.album_images ai ON i.id = ai.image_id
    LEFT JOIN public.photo_albums pa ON ai.album_id = pa.id
    LEFT JOIN public.profiles p ON pa.owner_id = p.user_id
    WHERE i.id = image_uuid;
END;
$$ LANGUAGE plpgsql;

-- Add comment for the function
COMMENT ON FUNCTION public.get_image_entity_context(uuid) IS 'Get complete entity context for any image including album and owner information'; 