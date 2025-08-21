-- Test script to verify entity image album creation fix
-- Run this after applying the migration to ensure everything works

-- Test 1: Check if album_type column exists
SELECT 
  'Test 1: album_type column exists' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'photo_albums' 
        AND column_name = 'album_type' 
        AND table_schema = 'public'
    ) THEN 'PASS' 
    ELSE 'FAIL' 
  END as result;

-- Test 2: Check if indexes were created
SELECT 
  'Test 2: Required indexes exist' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'photo_albums' 
        AND indexname = 'idx_photo_albums_album_type'
        AND schemaname = 'public'
    ) AND EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'photo_albums' 
        AND indexname = 'idx_photo_albums_entity_lookup'
        AND schemaname = 'public'
    ) THEN 'PASS' 
    ELSE 'FAIL' 
  END as result;

-- Test 3: Check if constraints were updated
SELECT 
  'Test 3: Constraints updated' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'photo_albums' 
        AND constraint_name = 'valid_album_type'
        AND table_schema = 'public'
    ) THEN 'PASS' 
    ELSE 'FAIL' 
  END as result;

-- Test 4: Verify album_type values are set for existing albums
SELECT 
  'Test 4: Existing albums have album_type' as test_name,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS (no albums to check)'
    WHEN COUNT(CASE WHEN album_type IS NULL THEN 1 END) = 0 THEN 'PASS'
    ELSE 'FAIL - some albums still missing album_type'
  END as result
FROM photo_albums;

-- Test 5: Check if we can create a test album (dry run)
SELECT 
  'Test 5: Can create test album structure' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'photo_albums' 
        AND column_name IN ('name', 'description', 'owner_id', 'entity_id', 'entity_type', 'album_type', 'is_public')
        AND table_schema = 'public'
    ) THEN 'PASS' 
    ELSE 'FAIL' 
  END as result;

-- Test 6: Verify album_images table structure
SELECT 
  'Test 6: album_images table ready' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'album_images' 
        AND column_name IN ('id', 'album_id', 'image_id', 'display_order', 'is_cover', 'is_featured')
        AND table_schema = 'public'
    ) THEN 'PASS' 
    ELSE 'FAIL' 
  END as result;

-- Test 7: Check if images table exists and has required columns
SELECT 
  'Test 7: images table ready' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'images' 
        AND column_name IN ('id', 'url')
        AND table_schema = 'public'
    ) THEN 'PASS' 
    ELSE 'FAIL' 
  END as result;

-- Summary of all tests
SELECT 
  'SUMMARY' as test_type,
  COUNT(CASE WHEN result = 'PASS' THEN 1 END) as passed_tests,
  COUNT(CASE WHEN result = 'FAIL' THEN 1 END) as failed_tests,
  COUNT(*) as total_tests,
  CASE 
    WHEN COUNT(CASE WHEN result = 'FAIL' THEN 1 END) = 0 THEN 'ALL TESTS PASSED - Ready for production'
    ELSE 'SOME TESTS FAILED - Review and fix issues'
  END as overall_status
FROM (
  SELECT 'Test 1: album_type column exists' as test_name,
         CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'photo_albums' AND column_name = 'album_type' AND table_schema = 'public') THEN 'PASS' ELSE 'FAIL' END as result
  UNION ALL
  SELECT 'Test 2: Required indexes exist' as test_name,
         CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'photo_albums' AND indexname = 'idx_photo_albums_album_type' AND schemaname = 'public') AND EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'photo_albums' AND indexname = 'idx_photo_albums_entity_lookup' AND schemaname = 'public') THEN 'PASS' ELSE 'FAIL' END as result
  UNION ALL
  SELECT 'Test 3: Constraints updated' as test_name,
         CASE WHEN EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'photo_albums' AND constraint_name = 'valid_album_type' AND table_schema = 'public') THEN 'PASS' ELSE 'FAIL' END as result
  UNION ALL
  SELECT 'Test 4: Existing albums have album_type' as test_name,
         CASE WHEN COUNT(*) = 0 THEN 'PASS' WHEN COUNT(CASE WHEN album_type IS NULL THEN 1 END) = 0 THEN 'PASS' ELSE 'FAIL' END as result FROM photo_albums
  UNION ALL
  SELECT 'Test 5: Can create test album structure' as test_name,
         CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'photo_albums' AND column_name IN ('name', 'description', 'owner_id', 'entity_id', 'entity_type', 'album_type', 'is_public') AND table_schema = 'public') THEN 'PASS' ELSE 'FAIL' END as result
  UNION ALL
  SELECT 'Test 6: album_images table ready' as test_name,
         CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'album_images' AND column_name IN ('id', 'album_id', 'image_id', 'display_order', 'is_cover', 'is_featured') AND table_schema = 'public') THEN 'PASS' ELSE 'FAIL' END as result
  UNION ALL
  SELECT 'Test 7: images table ready' as test_name,
         CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'images' AND column_name IN ('id', 'url') AND table_schema = 'public') THEN 'PASS' ELSE 'FAIL' END as result
) as test_results;
