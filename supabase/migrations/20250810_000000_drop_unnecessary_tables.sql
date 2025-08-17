-- =====================================================
-- DROP UNNECESSARY TABLES AND REVERT CHANGES
-- This migration removes the unnecessary tables and constraints
-- that were created during the failed photo integration attempt
-- =====================================================

-- Drop the new tables that were created unnecessarily
DROP TABLE IF EXISTS "public"."posts" CASCADE;
DROP TABLE IF EXISTS "public"."album_images" CASCADE;
DROP TABLE IF EXISTS "public"."images" CASCADE;
DROP TABLE IF EXISTS "public"."photo_albums" CASCADE;

-- =====================================================
-- CLEANUP COMPLETE
-- =====================================================
-- 
-- This migration removes:
-- 1. posts table (unnecessary)
-- 2. album_images table (unnecessary) 
-- 3. images table (unnecessary)
-- 4. photo_albums table (unnecessary)
--
-- The existing system using activities table and entity-images API
-- remains intact and functional
--
-- =====================================================
