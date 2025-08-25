-- SIMPLE POST CREATION TEST
-- This script checks the current state of posts in the database

-- Check recent posts
SELECT 
    'RECENT_POSTS' as info,
    id,
    user_id,
    activity_type,
    content_type,
    text,
    image_url,
    entity_type,
    entity_id,
    created_at
FROM public.activities 
WHERE activity_type = 'post_created'
ORDER BY created_at DESC 
LIMIT 5;

-- Check posts for the specific author
SELECT 
    'AUTHOR_POSTS' as info,
    id,
    user_id,
    activity_type,
    content_type,
    text,
    image_url,
    entity_type,
    entity_id,
    created_at
FROM public.activities 
WHERE entity_type = 'author' 
  AND entity_id = 'e31e061d-a4a8-4cc8-af18-754786ad5ee3'
ORDER BY created_at DESC;
