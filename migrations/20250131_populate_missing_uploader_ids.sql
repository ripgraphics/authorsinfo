-- Populate missing uploader_id for existing images based on album ownership
-- This script fixes legacy images that don't have uploader tracking

-- First, let's see what we're working with
SELECT 
    'Current state' as status,
    COUNT(*) as total_images,
    COUNT(uploader_id) as images_with_uploader,
    COUNT(*) - COUNT(uploader_id) as images_without_uploader
FROM public.images;

-- Update images that belong to user albums (entity_type = 'user')
-- Set uploader_id to the album owner (entity_id)
UPDATE public.images 
SET uploader_id = pa.entity_id,
    uploader_type = 'user'
FROM public.photo_albums pa
WHERE public.images.album_id = pa.id
  AND pa.entity_type = 'user'
  AND public.images.uploader_id IS NULL
  AND pa.entity_id IS NOT NULL;

-- For images that are associated with author albums (entity_type = 'author')
-- We need to find the user who created/owns that author profile
UPDATE public.images 
SET uploader_id = (
    -- Try to find a user associated with this author
    -- This is a best-effort approach since authors might not have direct user associations
    SELECT u.id 
    FROM public.users u 
    WHERE u.email LIKE '%' || LOWER(REPLACE(a.name, ' ', '.')) || '%'
    LIMIT 1
),
uploader_type = 'user'
FROM public.photo_albums pa
JOIN public.authors a ON pa.entity_id = a.id
WHERE public.images.album_id = pa.id
  AND pa.entity_type = 'author'
  AND public.images.uploader_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.email LIKE '%' || LOWER(REPLACE(a.name, ' ', '.')) || '%'
  );

-- For images that are associated with publisher albums (entity_type = 'publisher')
-- Similar approach - try to find associated user
UPDATE public.images 
SET uploader_id = (
    SELECT u.id 
    FROM public.users u 
    WHERE u.email LIKE '%' || LOWER(REPLACE(p.name, ' ', '.')) || '%'
    LIMIT 1
),
uploader_type = 'user'
FROM public.photo_albums pa
JOIN public.publishers p ON pa.entity_id = p.id
WHERE public.images.album_id = pa.id
  AND pa.entity_type = 'publisher'
  AND public.images.uploader_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.email LIKE '%' || LOWER(REPLACE(p.name, ' ', '.')) || '%'
  );

-- For images that are associated with group albums (entity_type = 'group')
-- Use the group creator as the uploader
UPDATE public.images 
SET uploader_id = g.created_by,
    uploader_type = 'user'
FROM public.photo_albums pa
JOIN public.groups g ON pa.entity_id = g.id
WHERE public.images.album_id = pa.id
  AND pa.entity_type = 'group'
  AND public.images.uploader_id IS NULL
  AND g.created_by IS NOT NULL;

-- For any remaining images without album association, try to use metadata
UPDATE public.images 
SET uploader_id = (metadata->>'user_id')::uuid,
    uploader_type = 'user'
WHERE uploader_id IS NULL 
  AND metadata->>'user_id' IS NOT NULL
  AND (metadata->>'user_id')::uuid IS NOT NULL;

-- For images still without uploader_id, try to use the first admin user as fallback
-- (Only do this if there are very few remaining images)
DO $$
DECLARE
    remaining_count integer;
    admin_user_id uuid;
BEGIN
    -- Count remaining images without uploader
    SELECT COUNT(*) INTO remaining_count 
    FROM public.images 
    WHERE uploader_id IS NULL;
    
    -- Only proceed if there are fewer than 10 remaining images
    IF remaining_count > 0 AND remaining_count < 10 THEN
        -- Find the first admin user
        SELECT id INTO admin_user_id 
        FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE r.name = 'admin'
        LIMIT 1;
        
        -- If we found an admin, use them as fallback
        IF admin_user_id IS NOT NULL THEN
            UPDATE public.images 
            SET uploader_id = admin_user_id,
                uploader_type = 'admin'
            WHERE uploader_id IS NULL;
            
            RAISE NOTICE 'Used admin user % as fallback for % remaining images', admin_user_id, remaining_count;
        END IF;
    ELSIF remaining_count >= 10 THEN
        RAISE NOTICE 'Too many images (%) still without uploader_id. Manual review needed.', remaining_count;
    END IF;
END $$;

-- Show the final results
SELECT 
    'Final state' as status,
    COUNT(*) as total_images,
    COUNT(uploader_id) as images_with_uploader,
    COUNT(*) - COUNT(uploader_id) as images_without_uploader,
    COUNT(CASE WHEN uploader_type = 'user' THEN 1 END) as user_uploads,
    COUNT(CASE WHEN uploader_type = 'admin' THEN 1 END) as admin_uploads
FROM public.images;

-- Show breakdown by album type
SELECT 
    COALESCE(pa.entity_type, 'no_album') as album_type,
    COUNT(*) as image_count,
    COUNT(i.uploader_id) as images_with_uploader,
    COUNT(*) - COUNT(i.uploader_id) as images_without_uploader
FROM public.images i
LEFT JOIN public.photo_albums pa ON i.album_id = pa.id
GROUP BY pa.entity_type
ORDER BY image_count DESC;

-- List any remaining images without uploader_id for manual review
SELECT 
    i.id,
    i.url,
    i.alt_text,
    i.created_at,
    pa.entity_type as album_type,
    pa.name as album_name,
    i.metadata
FROM public.images i
LEFT JOIN public.photo_albums pa ON i.album_id = pa.id
WHERE i.uploader_id IS NULL
ORDER BY i.created_at DESC
LIMIT 20;