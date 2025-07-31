-- Check results after update
SELECT 
    'After user album update' as status,
    COUNT(*) as total_images,
    COUNT(uploader_id) as images_with_uploader,
    COUNT(*) - COUNT(uploader_id) as images_without_uploader
FROM public.images;

-- Show breakdown by album type
SELECT 
    COALESCE(pa.entity_type, 'no_album') as album_type,
    COUNT(*) as image_count,
    COUNT(i.uploader_id) as images_with_uploader
FROM public.images i
LEFT JOIN public.photo_albums pa ON i.album_id = pa.id
GROUP BY pa.entity_type
ORDER BY image_count DESC;