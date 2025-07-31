-- Step 1: Check current state
SELECT 
    'Current state' as status,
    COUNT(*) as total_images,
    COUNT(uploader_id) as images_with_uploader,
    COUNT(*) - COUNT(uploader_id) as images_without_uploader
FROM public.images;