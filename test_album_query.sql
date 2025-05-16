-- First, let's see what author IDs we have in photo_albums
SELECT DISTINCT entity_id 
FROM photo_albums 
WHERE entity_type = 'author';

-- Then we can use one of those IDs in our test query
SELECT 
    pa.id,
    pa.name as title,
    pa.description,
    pa.is_public,
    pa.created_at,
    COUNT(ai.id) as photo_count,
    i.url as cover_image_url
FROM photo_albums pa
LEFT JOIN album_images ai ON pa.id = ai.album_id AND ai.is_cover = true
LEFT JOIN images i ON ai.image_id = i.id
WHERE pa.entity_type = 'author'
    AND pa.entity_id = '00000000-0000-0000-0000-000000000000'  -- Replace with an actual UUID from the first query
GROUP BY pa.id, pa.name, pa.description, pa.is_public, pa.created_at, i.url
ORDER BY pa.created_at DESC;

-- Check if we have any photo albums at all
SELECT * FROM photo_albums LIMIT 5;

-- Check what entity_types exist in photo_albums
SELECT DISTINCT entity_type FROM photo_albums;

-- Check if we have any album_images
SELECT * FROM album_images LIMIT 5;

-- Check if we have any images
SELECT * FROM images LIMIT 5;

-- Check if we have any authors
SELECT id, name FROM authors LIMIT 5;

-- Then we can create a test photo album for one of these authors
-- (We'll create the INSERT statements after we see the authors) 