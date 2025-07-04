-- Fix Remaining Security Issues from info.txt
-- This script adds RLS policies to the remaining tables that have RLS enabled but no policies

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

-- 6. EVENT-RELATED TABLES

-- Event registrations table
SELECT create_rls_policy_if_not_exists(
    'event_registrations',
    'event_registrations_select_policy',
    'CREATE POLICY event_registrations_select_policy ON event_registrations FOR SELECT USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'event_registrations',
    'event_registrations_insert_policy',
    'CREATE POLICY event_registrations_insert_policy ON event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'event_registrations',
    'event_registrations_delete_policy',
    'CREATE POLICY event_registrations_delete_policy ON event_registrations FOR DELETE USING (auth.uid() = user_id)'
);

-- Event comments table
SELECT create_rls_policy_if_not_exists(
    'event_comments',
    'event_comments_select_policy',
    'CREATE POLICY event_comments_select_policy ON event_comments FOR SELECT USING (EXISTS (SELECT 1 FROM events WHERE id = event_comments.event_id AND (is_public = true OR creator_id = auth.uid())))'
);

SELECT create_rls_policy_if_not_exists(
    'event_comments',
    'event_comments_insert_policy',
    'CREATE POLICY event_comments_insert_policy ON event_comments FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM events WHERE id = event_comments.event_id AND (is_public = true OR creator_id = auth.uid())))'
);

SELECT create_rls_policy_if_not_exists(
    'event_comments',
    'event_comments_update_policy',
    'CREATE POLICY event_comments_update_policy ON event_comments FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'event_comments',
    'event_comments_delete_policy',
    'CREATE POLICY event_comments_delete_policy ON event_comments FOR DELETE USING (auth.uid() = user_id)'
);

-- Event likes table
SELECT create_rls_policy_if_not_exists(
    'event_likes',
    'event_likes_select_policy',
    'CREATE POLICY event_likes_select_policy ON event_likes FOR SELECT USING (EXISTS (SELECT 1 FROM events WHERE id = event_likes.event_id AND (is_public = true OR creator_id = auth.uid())))'
);

SELECT create_rls_policy_if_not_exists(
    'event_likes',
    'event_likes_insert_policy',
    'CREATE POLICY event_likes_insert_policy ON event_likes FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'event_likes',
    'event_likes_delete_policy',
    'CREATE POLICY event_likes_delete_policy ON event_likes FOR DELETE USING (auth.uid() = user_id)'
);

-- 7. GROUP-RELATED TABLES

-- Group members table
SELECT create_rls_policy_if_not_exists(
    'group_members',
    'group_members_select_policy',
    'CREATE POLICY group_members_select_policy ON group_members FOR SELECT USING (EXISTS (SELECT 1 FROM group_members WHERE group_id = group_members.group_id AND user_id = auth.uid()))'
);

SELECT create_rls_policy_if_not_exists(
    'group_members',
    'group_members_insert_policy',
    'CREATE POLICY group_members_insert_policy ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM group_members WHERE group_id = group_members.group_id AND user_id = auth.uid() AND role IN (''admin'', ''moderator'')))'
);

SELECT create_rls_policy_if_not_exists(
    'group_members',
    'group_members_update_policy',
    'CREATE POLICY group_members_update_policy ON group_members FOR UPDATE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM group_members WHERE group_id = group_members.group_id AND user_id = auth.uid() AND role IN (''admin'', ''moderator'')))'
);

SELECT create_rls_policy_if_not_exists(
    'group_members',
    'group_members_delete_policy',
    'CREATE POLICY group_members_delete_policy ON group_members FOR DELETE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM group_members WHERE group_id = group_members.group_id AND user_id = auth.uid() AND role IN (''admin'', ''moderator'')))'
);

-- Group announcements table
SELECT create_rls_policy_if_not_exists(
    'group_announcements',
    'group_announcements_select_policy',
    'CREATE POLICY group_announcements_select_policy ON group_announcements FOR SELECT USING (EXISTS (SELECT 1 FROM group_members WHERE group_id = group_announcements.group_id AND user_id = auth.uid()))'
);

SELECT create_rls_policy_if_not_exists(
    'group_announcements',
    'group_announcements_insert_policy',
    'CREATE POLICY group_announcements_insert_policy ON group_announcements FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM group_members WHERE group_id = group_announcements.group_id AND user_id = auth.uid() AND role IN (''admin'', ''moderator'')))'
);

SELECT create_rls_policy_if_not_exists(
    'group_announcements',
    'group_announcements_update_policy',
    'CREATE POLICY group_announcements_update_policy ON group_announcements FOR UPDATE USING (EXISTS (SELECT 1 FROM group_members WHERE group_id = group_announcements.group_id AND user_id = auth.uid() AND role IN (''admin'', ''moderator'')))'
);

SELECT create_rls_policy_if_not_exists(
    'group_announcements',
    'group_announcements_delete_policy',
    'CREATE POLICY group_announcements_delete_policy ON group_announcements FOR DELETE USING (EXISTS (SELECT 1 FROM group_members WHERE group_id = group_announcements.group_id AND user_id = auth.uid() AND role IN (''admin'', ''moderator'')))'
);

-- Group chat messages table
SELECT create_rls_policy_if_not_exists(
    'group_chat_messages',
    'group_chat_messages_select_policy',
    'CREATE POLICY group_chat_messages_select_policy ON group_chat_messages FOR SELECT USING (EXISTS (SELECT 1 FROM group_members WHERE group_id = (SELECT group_id FROM group_chat_channels WHERE id = group_chat_messages.channel_id) AND user_id = auth.uid()))'
);

SELECT create_rls_policy_if_not_exists(
    'group_chat_messages',
    'group_chat_messages_insert_policy',
    'CREATE POLICY group_chat_messages_insert_policy ON group_chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM group_members WHERE group_id = (SELECT group_id FROM group_chat_channels WHERE id = group_chat_messages.channel_id) AND user_id = auth.uid()))'
);

SELECT create_rls_policy_if_not_exists(
    'group_chat_messages',
    'group_chat_messages_update_policy',
    'CREATE POLICY group_chat_messages_update_policy ON group_chat_messages FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'group_chat_messages',
    'group_chat_messages_delete_policy',
    'CREATE POLICY group_chat_messages_delete_policy ON group_chat_messages FOR DELETE USING (auth.uid() = user_id)'
);

-- 8. READING AND LEARNING TABLES

-- Reading challenges table
SELECT create_rls_policy_if_not_exists(
    'reading_challenges',
    'reading_challenges_select_policy',
    'CREATE POLICY reading_challenges_select_policy ON reading_challenges FOR SELECT USING (is_public = true OR auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'reading_challenges',
    'reading_challenges_insert_policy',
    'CREATE POLICY reading_challenges_insert_policy ON reading_challenges FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'reading_challenges',
    'reading_challenges_update_policy',
    'CREATE POLICY reading_challenges_update_policy ON reading_challenges FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'reading_challenges',
    'reading_challenges_delete_policy',
    'CREATE POLICY reading_challenges_delete_policy ON reading_challenges FOR DELETE USING (auth.uid() = user_id)'
);

-- Reading goals table
SELECT create_rls_policy_if_not_exists(
    'reading_goals',
    'reading_goals_select_policy',
    'CREATE POLICY reading_goals_select_policy ON reading_goals FOR SELECT USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'reading_goals',
    'reading_goals_insert_policy',
    'CREATE POLICY reading_goals_insert_policy ON reading_goals FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'reading_goals',
    'reading_goals_update_policy',
    'CREATE POLICY reading_goals_update_policy ON reading_goals FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'reading_goals',
    'reading_goals_delete_policy',
    'CREATE POLICY reading_goals_delete_policy ON reading_goals FOR DELETE USING (auth.uid() = user_id)'
);

-- Reading sessions table
SELECT create_rls_policy_if_not_exists(
    'reading_sessions',
    'reading_sessions_select_policy',
    'CREATE POLICY reading_sessions_select_policy ON reading_sessions FOR SELECT USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'reading_sessions',
    'reading_sessions_insert_policy',
    'CREATE POLICY reading_sessions_insert_policy ON reading_sessions FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'reading_sessions',
    'reading_sessions_update_policy',
    'CREATE POLICY reading_sessions_update_policy ON reading_sessions FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'reading_sessions',
    'reading_sessions_delete_policy',
    'CREATE POLICY reading_sessions_delete_policy ON reading_sessions FOR DELETE USING (auth.uid() = user_id)'
);

-- 9. REFERENCE AND LOOKUP TABLES (Read-only for authenticated users)

-- Book authors table
SELECT create_rls_policy_if_not_exists(
    'book_authors',
    'book_authors_select_policy',
    'CREATE POLICY book_authors_select_policy ON book_authors FOR SELECT USING (auth.role() = ''authenticated'')'
);

-- Book publishers table
SELECT create_rls_policy_if_not_exists(
    'book_publishers',
    'book_publishers_select_policy',
    'CREATE POLICY book_publishers_select_policy ON book_publishers FOR SELECT USING (auth.role() = ''authenticated'')'
);

-- Book genre mappings table
SELECT create_rls_policy_if_not_exists(
    'book_genre_mappings',
    'book_genre_mappings_select_policy',
    'CREATE POLICY book_genre_mappings_select_policy ON book_genre_mappings FOR SELECT USING (auth.role() = ''authenticated'')'
);

-- Book tag mappings table
SELECT create_rls_policy_if_not_exists(
    'book_tag_mappings',
    'book_tag_mappings_select_policy',
    'CREATE POLICY book_tag_mappings_select_policy ON book_tag_mappings FOR SELECT USING (auth.role() = ''authenticated'')'
);

-- Book tags table
SELECT create_rls_policy_if_not_exists(
    'book_tags',
    'book_tags_select_policy',
    'CREATE POLICY book_tags_select_policy ON book_tags FOR SELECT USING (auth.role() = ''authenticated'')'
);

-- Subjects table
SELECT create_rls_policy_if_not_exists(
    'subjects',
    'subjects_select_policy',
    'CREATE POLICY subjects_select_policy ON subjects FOR SELECT USING (auth.role() = ''authenticated'')'
);

-- Roles table
SELECT create_rls_policy_if_not_exists(
    'roles',
    'roles_select_policy',
    'CREATE POLICY roles_select_policy ON roles FOR SELECT USING (auth.role() = ''authenticated'')'
);

-- 10. ANALYTICS AND TRACKING TABLES (User-specific data)

-- Book views table
SELECT create_rls_policy_if_not_exists(
    'book_views',
    'book_views_select_policy',
    'CREATE POLICY book_views_select_policy ON book_views FOR SELECT USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'book_views',
    'book_views_insert_policy',
    'CREATE POLICY book_views_insert_policy ON book_views FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

-- User book interactions table
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

-- User reading preferences table
SELECT create_rls_policy_if_not_exists(
    'user_reading_preferences',
    'user_reading_preferences_select_policy',
    'CREATE POLICY user_reading_preferences_select_policy ON user_reading_preferences FOR SELECT USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'user_reading_preferences',
    'user_reading_preferences_insert_policy',
    'CREATE POLICY user_reading_preferences_insert_policy ON user_reading_preferences FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'user_reading_preferences',
    'user_reading_preferences_update_policy',
    'CREATE POLICY user_reading_preferences_update_policy ON user_reading_preferences FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT create_rls_policy_if_not_exists(
    'user_reading_preferences',
    'user_reading_preferences_delete_policy',
    'CREATE POLICY user_reading_preferences_delete_policy ON user_reading_preferences FOR DELETE USING (auth.uid() = user_id)'
);

-- Clean up the helper function
DROP FUNCTION IF EXISTS create_rls_policy_if_not_exists(text, text, text);

-- Summary
SELECT 'Remaining security issues fixed: RLS policies added to event, group, reading, and reference tables' as status; 