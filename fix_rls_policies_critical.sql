-- Fix Critical RLS Policy Issues
-- This script adds RLS policies to the most critical tables that have RLS enabled but no policies
-- Based on the info.txt file analysis

-- Function to safely create RLS policies
CREATE OR REPLACE FUNCTION create_rls_policy_if_not_exists(
    table_name text,
    policy_name text,
    policy_definition text
) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = table_name 
        AND policyname = policy_name
    ) THEN
        EXECUTE policy_definition;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 1. USER-CONTENT TABLES (High Priority)

-- Activities table - has user_id
SELECT create_rls_policy_if_not_exists(
    'activities',
    'activities_select_policy',
    'CREATE POLICY activities_select_policy ON activities FOR SELECT USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'activities',
    'activities_insert_policy',
    'CREATE POLICY activities_insert_policy ON activities FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'activities',
    'activities_update_policy',
    'CREATE POLICY activities_update_policy ON activities FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'activities',
    'activities_delete_policy',
    'CREATE POLICY activities_delete_policy ON activities FOR DELETE USING (auth.uid() = user_id)'
);

-- Posts table - has user_id and visibility
SELECT create_rls_policy_if_not_exists(
    'posts',
    'posts_select_policy',
    'CREATE POLICY posts_select_policy ON posts FOR SELECT USING (visibility = ''public'' OR auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'posts',
    'posts_insert_policy',
    'CREATE POLICY posts_insert_policy ON posts FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'posts',
    'posts_update_policy',
    'CREATE POLICY posts_update_policy ON posts FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'posts',
    'posts_delete_policy',
    'CREATE POLICY posts_delete_policy ON posts FOR DELETE USING (auth.uid() = user_id)'
);

-- Photo albums table - has owner_id
SELECT create_rls_policy_if_not_exists(
    'photo_albums',
    'photo_albums_select_policy',
    'CREATE POLICY photo_albums_select_policy ON photo_albums FOR SELECT USING (is_public = true OR auth.uid() = owner_id)'
);

SELECT create_rls_policy_if_not_exists(
    'photo_albums',
    'photo_albums_insert_policy',
    'CREATE POLICY photo_albums_insert_policy ON photo_albums FOR INSERT WITH CHECK (auth.uid() = owner_id)'
);

SELECT create_rls_policy_if_not_exists(
    'photo_albums',
    'photo_albums_update_policy',
    'CREATE POLICY photo_albums_update_policy ON photo_albums FOR UPDATE USING (auth.uid() = owner_id)'
);

SELECT create_rls_policy_if_not_exists(
    'photo_albums',
    'photo_albums_delete_policy',
    'CREATE POLICY photo_albums_delete_policy ON photo_albums FOR DELETE USING (auth.uid() = owner_id)'
);

-- Album images table - references photo_albums
SELECT create_rls_policy_if_not_exists(
    'album_images',
    'album_images_select_policy',
    'CREATE POLICY album_images_select_policy ON album_images FOR SELECT USING (EXISTS (SELECT 1 FROM photo_albums WHERE id = album_id AND (is_public = true OR owner_id = auth.uid())))'
);

SELECT create_rls_policy_if_not_exists(
    'album_images',
    'album_images_insert_policy',
    'CREATE POLICY album_images_insert_policy ON album_images FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM photo_albums WHERE id = album_id AND owner_id = auth.uid()))'
);

SELECT create_rls_policy_if_not_exists(
    'album_images',
    'album_images_update_policy',
    'CREATE POLICY album_images_update_policy ON album_images FOR UPDATE USING (EXISTS (SELECT 1 FROM photo_albums WHERE id = album_id AND owner_id = auth.uid()))'
);

SELECT create_rls_policy_if_not_exists(
    'album_images',
    'album_images_delete_policy',
    'CREATE POLICY album_images_delete_policy ON album_images FOR DELETE USING (EXISTS (SELECT 1 FROM photo_albums WHERE id = album_id AND owner_id = auth.uid()))'
);

-- 2. USER DATA TABLES

-- User book interactions table - has user_id
SELECT create_rls_policy_if_not_exists(
    'user_book_interactions',
    'user_book_interactions_select_policy',
    'CREATE POLICY user_book_interactions_select_policy ON user_book_interactions FOR SELECT USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'user_book_interactions',
    'user_book_interactions_insert_policy',
    'CREATE POLICY user_book_interactions_insert_policy ON user_book_interactions FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'user_book_interactions',
    'user_book_interactions_update_policy',
    'CREATE POLICY user_book_interactions_update_policy ON user_book_interactions FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'user_book_interactions',
    'user_book_interactions_delete_policy',
    'CREATE POLICY user_book_interactions_delete_policy ON user_book_interactions FOR DELETE USING (auth.uid() = user_id)'
);

-- Reading progress table - has user_id
SELECT create_rls_policy_if_not_exists(
    'reading_progress',
    'reading_progress_select_policy',
    'CREATE POLICY reading_progress_select_policy ON reading_progress FOR SELECT USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'reading_progress',
    'reading_progress_insert_policy',
    'CREATE POLICY reading_progress_insert_policy ON reading_progress FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'reading_progress',
    'reading_progress_update_policy',
    'CREATE POLICY reading_progress_update_policy ON reading_progress FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'reading_progress',
    'reading_progress_delete_policy',
    'CREATE POLICY reading_progress_delete_policy ON reading_progress FOR DELETE USING (auth.uid() = user_id)'
);

-- 3. NOTIFICATIONS AND FEED

-- Notifications table - has user_id
SELECT create_rls_policy_if_not_exists(
    'notifications',
    'notifications_select_policy',
    'CREATE POLICY notifications_select_policy ON notifications FOR SELECT USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'notifications',
    'notifications_insert_policy',
    'CREATE POLICY notifications_insert_policy ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'notifications',
    'notifications_update_policy',
    'CREATE POLICY notifications_update_policy ON notifications FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'notifications',
    'notifications_delete_policy',
    'CREATE POLICY notifications_delete_policy ON notifications FOR DELETE USING (auth.uid() = user_id)'
);

-- Feed entries table - has user_id
SELECT create_rls_policy_if_not_exists(
    'feed_entries',
    'feed_entries_select_policy',
    'CREATE POLICY feed_entries_select_policy ON feed_entries FOR SELECT USING (auth.uid() = user_id OR visibility = ''public'')'
);

SELECT create_rls_policy_if_not_exists(
    'feed_entries',
    'feed_entries_insert_policy',
    'CREATE POLICY feed_entries_insert_policy ON feed_entries FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'feed_entries',
    'feed_entries_update_policy',
    'CREATE POLICY feed_entries_update_policy ON feed_entries FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'feed_entries',
    'feed_entries_delete_policy',
    'CREATE POLICY feed_entries_delete_policy ON feed_entries FOR DELETE USING (auth.uid() = user_id)'
);

-- 4. REFERENCE TABLES (Public read access)

-- Book genres table
SELECT create_rls_policy_if_not_exists(
    'book_genres',
    'book_genres_select_policy',
    'CREATE POLICY book_genres_select_policy ON book_genres FOR SELECT USING (true)'
);

-- Authors table
SELECT create_rls_policy_if_not_exists(
    'authors',
    'authors_select_policy',
    'CREATE POLICY authors_select_policy ON authors FOR SELECT USING (true)'
);

-- Books table
SELECT create_rls_policy_if_not_exists(
    'books',
    'books_select_policy',
    'CREATE POLICY books_select_policy ON books FOR SELECT USING (true)'
);

-- Clean up
DROP FUNCTION IF EXISTS create_rls_policy_if_not_exists(text, text, text);

-- Verification
SELECT 'Critical RLS policies applied successfully' as status; 