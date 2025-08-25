-- Test API Endpoint Logic
-- Let's see exactly what the API is trying to do

-- 1. Test the exact likes query the API uses
SELECT 'Testing API likes query...' as info;
SELECT 
  al.user_id,
  al.created_at
FROM engagement_likes al
WHERE al.entity_type = 'activity'
  AND al.entity_id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb'
ORDER BY al.created_at DESC
LIMIT 10;

-- 2. Test the exact comments query the API uses
SELECT 'Testing API comments query...' as info;
SELECT 
  ac.id,
  ac.user_id,
  ac.comment_text,
  ac.created_at
FROM engagement_comments ac
WHERE ac.entity_type = 'activity'
  AND ac.entity_id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb'
  AND ac.is_deleted = false
  AND ac.is_hidden = false
ORDER BY ac.created_at DESC
LIMIT 10;

-- 3. Test if we can insert a like manually
SELECT 'Testing like insert...' as info;
INSERT INTO engagement_likes (entity_type, entity_id, user_id)
VALUES ('activity', '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb', '2474659f-003e-4faa-8c53-9969c33f20b2')
ON CONFLICT (user_id, entity_type, entity_id) DO NOTHING
RETURNING id;

-- 4. Test if we can delete the like
SELECT 'Testing like delete...' as info;
DELETE FROM engagement_likes 
WHERE entity_type = 'activity' 
  AND entity_id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb'
  AND user_id = '2474659f-003e-4faa-8c53-9969c33f20b2';

-- 5. Check RLS policies are working
SELECT 'Checking RLS policies...' as info;
SELECT 
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename IN ('engagement_likes', 'engagement_comments')
ORDER BY tablename, policyname;
