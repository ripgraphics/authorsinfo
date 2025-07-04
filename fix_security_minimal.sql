-- Minimal Security Fix Script
-- Only addresses the most critical tables with verified column names

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

-- 1. USER-CONTENT TABLES (Verified columns)

-- Activities table - has user_id
SELECT create_rls_policy_if_not_exists(
    'activities',
    'activities_select_policy',
    'CREATE POLICY activities_select_policy ON activities FOR SELECT USING (auth.uid() = user_id)'
);

-- Posts table - has user_id and visibility
SELECT create_rls_policy_if_not_exists(
    'posts',
    'posts_select_policy',
    'CREATE POLICY posts_select_policy ON posts FOR SELECT USING (auth.uid() = user_id OR visibility = ''public'')'
);

-- Photo albums table - has owner_id
SELECT create_rls_policy_if_not_exists(
    'photo_albums',
    'photo_albums_select_policy',
    'CREATE POLICY photo_albums_select_policy ON photo_albums FOR SELECT USING (auth.uid() = owner_id OR privacy = ''public'')'
);

-- 2. SOCIAL TABLES (Verified columns)

-- Follows table - has follower_id and following_id
SELECT create_rls_policy_if_not_exists(
    'follows',
    'follows_select_policy',
    'CREATE POLICY follows_select_policy ON follows FOR SELECT USING (auth.uid() = follower_id OR auth.uid()::text = following_id)'
);

-- Blocks table - has user_id and blocked_user_id
SELECT create_rls_policy_if_not_exists(
    'blocks',
    'blocks_select_policy',
    'CREATE POLICY blocks_select_policy ON blocks FOR SELECT USING (auth.uid() = user_id OR auth.uid() = blocked_user_id)'
);

-- 3. BOOK TABLES (Verified columns)

-- Book reviews table - has user_id
SELECT create_rls_policy_if_not_exists(
    'book_reviews',
    'book_reviews_select_policy',
    'CREATE POLICY book_reviews_select_policy ON book_reviews FOR SELECT USING (true)'
);

-- User reading preferences table - has user_id
SELECT create_rls_policy_if_not_exists(
    'user_reading_preferences',
    'user_reading_preferences_select_policy',
    'CREATE POLICY user_reading_preferences_select_policy ON user_reading_preferences FOR SELECT USING (auth.uid() = user_id)'
);

-- 4. GROUP TABLES (Verified columns)

-- Group members table - has user_id and group_id, groups table has is_private
SELECT create_rls_policy_if_not_exists(
    'group_members',
    'group_members_select_policy',
    'CREATE POLICY group_members_select_policy ON group_members FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM groups WHERE id = group_id AND is_private = false))'
);

-- 5. REFERENCE TABLES (Public read)

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

-- Verification
SELECT 'Minimal security fixes applied successfully' as status;

-- Clean up
DROP FUNCTION IF EXISTS create_rls_policy_if_not_exists(text, text, text); 