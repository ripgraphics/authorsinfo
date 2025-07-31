-- Populate missing uploader_id for existing images based on album ownership
-- This script fixes legacy images that don't have uploader tracking

-- Update images that belong to user albums (entity_type = 'user')
-- Set uploader_id to the album owner (entity_id)
UPDATE public.images 
SET uploader_id = pa.entity_id,
    uploader_type = 'user'
FROM public.album_images ai
JOIN public.photo_albums pa ON ai.album_id = pa.id
WHERE public.images.id = ai.image_id
  AND pa.entity_type = 'user'
  AND public.images.uploader_id IS NULL
  AND pa.entity_id IS NOT NULL;

-- For images that belong to user albums but entity_id is owner_id instead
UPDATE public.images 
SET uploader_id = pa.owner_id,
    uploader_type = 'user'
FROM public.album_images ai
JOIN public.photo_albums pa ON ai.album_id = pa.id
WHERE public.images.id = ai.image_id
  AND pa.entity_type = 'user'
  AND public.images.uploader_id IS NULL
  AND pa.owner_id IS NOT NULL;

-- For any remaining images without album association, try to use metadata
UPDATE public.images 
SET uploader_id = (metadata->>'user_id')::uuid,
    uploader_type = 'user'
WHERE uploader_id IS NULL 
  AND metadata->>'user_id' IS NOT NULL
  AND (metadata->>'user_id')::uuid IS NOT NULL;