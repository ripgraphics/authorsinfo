-- Test Foreign Key Relationship
-- The 500 error suggests a constraint issue

-- 1. Check if the specific activity exists
SELECT 'Testing activity existence...' as info;
SELECT 
  id,
  activity_type,
  content_type,
  created_at
FROM activities 
WHERE id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb';

-- 2. Check foreign key constraints
SELECT 'Checking foreign key constraints...' as info;
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('engagement_likes', 'engagement_comments');

-- 3. Test inserting a like manually
SELECT 'Testing manual like insert...' as info;
INSERT INTO engagement_likes (entity_type, entity_id, user_id)
VALUES ('activity', '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb', '2474659f-003e-4faa-8c53-9969c33f20b2')
ON CONFLICT (user_id, entity_type, entity_id) DO NOTHING
RETURNING id;

-- 4. Check if the like was inserted
SELECT 'Checking if like was inserted...' as info;
SELECT * FROM engagement_likes 
WHERE entity_type = 'activity' 
  AND entity_id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb'
  AND user_id = '2474659f-003e-4faa-8c53-9969c33f20b2';

-- 5. Clean up test data
SELECT 'Cleaning up test data...' as info;
DELETE FROM engagement_likes 
WHERE entity_type = 'activity' 
  AND entity_id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb'
  AND user_id = '2474659f-003e-4faa-8c53-9969c33f20b2';
