-- Fix Critical Security Issues from info.txt
-- This script adds RLS policies to the most critical tables that have RLS enabled but no policies
-- Based on actual table structures from the schema

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

-- Activities table - has user_id, no is_public column
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

-- Posts table - has user_id and visibility column
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

-- Photo albums table - has owner_id and is_public
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

-- Album images table - has album_id, no user_id
SELECT create_rls_policy_if_not_exists(
    'album_images',
    'album_images_select_policy',
    'CREATE POLICY album_images_select_policy ON album_images FOR SELECT USING (EXISTS (SELECT 1 FROM photo_albums WHERE id = album_images.album_id AND (is_public = true OR owner_id = auth.uid())))'
);

SELECT create_rls_policy_if_not_exists(
    'album_images',
    'album_images_insert_policy',
    'CREATE POLICY album_images_insert_policy ON album_images FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM photo_albums WHERE id = album_images.album_id AND owner_id = auth.uid()))'
);

SELECT create_rls_policy_if_not_exists(
    'album_images',
    'album_images_update_policy',
    'CREATE POLICY album_images_update_policy ON album_images FOR UPDATE USING (EXISTS (SELECT 1 FROM photo_albums WHERE id = album_images.album_id AND owner_id = auth.uid()))'
);

SELECT create_rls_policy_if_not_exists(
    'album_images',
    'album_images_delete_policy',
    'CREATE POLICY album_images_delete_policy ON album_images FOR DELETE USING (EXISTS (SELECT 1 FROM photo_albums WHERE id = album_images.album_id AND owner_id = auth.uid()))'
);

-- Images table - generic storage table, no user ownership
-- This table is used for storing images without user-specific ownership
-- RLS policies not needed as it's a reference table

-- 2. SOCIAL INTERACTION TABLES

-- Follows table - has follower_id and following_id
SELECT create_rls_policy_if_not_exists(
    'follows',
    'follows_select_policy',
    'CREATE POLICY follows_select_policy ON follows FOR SELECT USING (auth.uid() = follower_id OR auth.uid()::text = following_id)'
);

SELECT create_rls_policy_if_not_exists(
    'follows',
    'follows_insert_policy',
    'CREATE POLICY follows_insert_policy ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id)'
);

SELECT create_rls_policy_if_not_exists(
    'follows',
    'follows_delete_policy',
    'CREATE POLICY follows_delete_policy ON follows FOR DELETE USING (auth.uid() = follower_id)'
);

-- Friends table - has user_id and friend_id
SELECT create_rls_policy_if_not_exists(
    'friends',
    'friends_select_policy',
    'CREATE POLICY friends_select_policy ON friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id)'
);

SELECT create_rls_policy_if_not_exists(
    'friends',
    'friends_insert_policy',
    'CREATE POLICY friends_insert_policy ON friends FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'friends',
    'friends_delete_policy',
    'CREATE POLICY friends_delete_policy ON friends FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id)'
);

-- Blocks table - has user_id and blocked_user_id
SELECT create_rls_policy_if_not_exists(
    'blocks',
    'blocks_select_policy',
    'CREATE POLICY blocks_select_policy ON blocks FOR SELECT USING (auth.uid() = user_id OR auth.uid() = blocked_user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'blocks',
    'blocks_insert_policy',
    'CREATE POLICY blocks_insert_policy ON blocks FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'blocks',
    'blocks_delete_policy',
    'CREATE POLICY blocks_delete_policy ON blocks FOR DELETE USING (auth.uid() = user_id)'
);

-- 3. BOOK-RELATED TABLES

-- Book reviews table - has user_id
SELECT create_rls_policy_if_not_exists(
    'book_reviews',
    'book_reviews_select_policy',
    'CREATE POLICY book_reviews_select_policy ON book_reviews FOR SELECT USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'book_reviews',
    'book_reviews_insert_policy',
    'CREATE POLICY book_reviews_insert_policy ON book_reviews FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'book_reviews',
    'book_reviews_update_policy',
    'CREATE POLICY book_reviews_update_policy ON book_reviews FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'book_reviews',
    'book_reviews_delete_policy',
    'CREATE POLICY book_reviews_delete_policy ON book_reviews FOR DELETE USING (auth.uid() = user_id)'
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

-- Reading lists table - has user_id and is_public
SELECT create_rls_policy_if_not_exists(
    'reading_lists',
    'reading_lists_select_policy',
    'CREATE POLICY reading_lists_select_policy ON reading_lists FOR SELECT USING (is_public = true OR auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'reading_lists',
    'reading_lists_insert_policy',
    'CREATE POLICY reading_lists_insert_policy ON reading_lists FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'reading_lists',
    'reading_lists_update_policy',
    'CREATE POLICY reading_lists_update_policy ON reading_lists FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'reading_lists',
    'reading_lists_delete_policy',
    'CREATE POLICY reading_lists_delete_policy ON reading_lists FOR DELETE USING (auth.uid() = user_id)'
);

-- 4. NOTIFICATIONS AND FEED

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
    'CREATE POLICY feed_entries_select_policy ON feed_entries FOR SELECT USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'feed_entries',
    'feed_entries_insert_policy',
    'CREATE POLICY feed_entries_insert_policy ON feed_entries FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

-- 5. REFERENCE TABLES (Read-only for authenticated users)

-- Binding types table
SELECT create_rls_policy_if_not_exists(
    'binding_types',
    'binding_types_select_policy',
    'CREATE POLICY binding_types_select_policy ON binding_types FOR SELECT USING (auth.role() = ''authenticated'')'
);

-- Book genres table
SELECT create_rls_policy_if_not_exists(
    'book_genres',
    'book_genres_select_policy',
    'CREATE POLICY book_genres_select_policy ON book_genres FOR SELECT USING (auth.role() = ''authenticated'')'
);

-- Format types table
SELECT create_rls_policy_if_not_exists(
    'format_types',
    'format_types_select_policy',
    'CREATE POLICY format_types_select_policy ON format_types FOR SELECT USING (auth.role() = ''authenticated'')'
);

-- Countries table
SELECT create_rls_policy_if_not_exists(
    'countries',
    'countries_select_policy',
    'CREATE POLICY countries_select_policy ON countries FOR SELECT USING (auth.role() = ''authenticated'')'
);

-- Tags table
SELECT create_rls_policy_if_not_exists(
    'tags',
    'tags_select_policy',
    'CREATE POLICY tags_select_policy ON tags FOR SELECT USING (auth.role() = ''authenticated'')'
);

-- Clean up the helper function
DROP FUNCTION IF EXISTS create_rls_policy_if_not_exists(text, text, text);

-- Summary
SELECT 'Critical security issues fixed: RLS policies added to user content, social interaction, and book-related tables' as status; 