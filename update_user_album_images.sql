-- Update images in user albums to set uploader_id to album owner
UPDATE public.images 
SET uploader_id = pa.entity_id,
    uploader_type = 'user'
FROM public.photo_albums pa
WHERE public.images.album_id = pa.id
  AND pa.entity_type = 'user'
  AND public.images.uploader_id IS NULL
  AND pa.entity_id IS NOT NULL;