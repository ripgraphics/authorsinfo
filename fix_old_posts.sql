-- Fix old posts by populating the new columns with actual content
-- This will make old posts editable and deletable

-- Update old posts that have activity_type = 'post_created' but null text
UPDATE public.activities 
SET 
    text = COALESCE(
        metadata->>'text', 
        metadata->>'content',
        'Old post content'
    ),
    image_url = COALESCE(
        metadata->>'image_url',
        metadata->>'images',
        NULL
    ),
    link_url = COALESCE(
        metadata->>'link_url',
        metadata->>'link',
        NULL
    ),
    visibility = COALESCE(
        metadata->>'visibility',
        'public'
    ),
    updated_at = created_at
WHERE 
    activity_type = 'post_created' 
    AND (text IS NULL OR text = '');

-- Show what we updated
SELECT 
    id,
    activity_type,
    text,
    image_url,
    visibility,
    created_at,
    updated_at
FROM public.activities 
WHERE activity_type = 'post_created'
ORDER BY created_at DESC
LIMIT 10;
