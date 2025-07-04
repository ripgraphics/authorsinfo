-- Restore Original Database Schema
-- This script restores the database to its original state from July 3rd, 2025
-- Based on schema_20250703_001413.sql

-- =====================================================
-- STEP 1: DROP ALL EXISTING INDEXES THAT WERE ADDED
-- =====================================================

-- Drop the indexes that were added by the fix script
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_role_id;
DROP INDEX IF EXISTS idx_profiles_user_id;
DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_books_title;
DROP INDEX IF EXISTS idx_books_isbn10;
DROP INDEX IF EXISTS idx_books_isbn13;
DROP INDEX IF EXISTS idx_books_publication_date;
DROP INDEX IF EXISTS idx_books_publisher_id;
DROP INDEX IF EXISTS idx_comments_user_id;
DROP INDEX IF EXISTS idx_comments_feed_entry_id;
DROP INDEX IF EXISTS idx_likes_user_id;
DROP INDEX IF EXISTS idx_likes_feed_entry_id;
DROP INDEX IF EXISTS idx_photo_albums_owner_id;
DROP INDEX IF EXISTS idx_photo_albums_is_public;
DROP INDEX IF EXISTS idx_photo_albums_created_at;
DROP INDEX IF EXISTS idx_feed_entries_user_id;
DROP INDEX IF EXISTS idx_feed_entries_visibility;
DROP INDEX IF EXISTS idx_feed_entries_created_at;
DROP INDEX IF EXISTS idx_activities_user_id;
DROP INDEX IF EXISTS idx_activities_activity_type;
DROP INDEX IF EXISTS idx_activities_created_at;
DROP INDEX IF EXISTS idx_events_created_by;
DROP INDEX IF EXISTS idx_events_visibility;
DROP INDEX IF EXISTS idx_events_start_date;
DROP INDEX IF EXISTS idx_groups_created_by;
DROP INDEX IF EXISTS idx_groups_is_private;
DROP INDEX IF EXISTS idx_groups_created_at;

-- =====================================================
-- STEP 2: RESTORE ORIGINAL SCHEMA
-- =====================================================

-- The original schema is in schemas/schema_20250703_001413.sql
-- This file contains the complete original database structure
-- You should run this file in your Supabase SQL editor to restore everything

-- =====================================================
-- STEP 3: VERIFICATION QUERIES
-- =====================================================

-- Check that indexes are back to original state
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check table structure
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'profiles', 'books', 'comments', 'likes', 'photo_albums', 'feed_entries', 'activities', 'events', 'groups')
ORDER BY table_name, ordinal_position;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================

/*
TO COMPLETE THE RESTORATION:

1. Run this script first to drop the added indexes
2. Then run the complete schema file: schemas/schema_20250703_001413.sql
3. This will restore your database to exactly how it was on July 3rd, 2025

The schema_20250703_001413.sql file contains:
- All original tables with their exact structure
- All original functions and triggers
- All original constraints and relationships
- All original data (if any was present)

This will completely undo any changes made by the fix scripts and restore your database to its working state.
*/ 