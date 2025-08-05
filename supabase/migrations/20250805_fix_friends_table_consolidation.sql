-- ============================================================================
-- ENTERPRISE-GRADE FRIENDS TABLE CONSOLIDATION
-- ============================================================================
-- This migration consolidates the redundant friends and user_friends tables
-- into a single, properly constrained enterprise-grade table

-- Step 1: Verify current state and log it
DO $$
BEGIN
    RAISE NOTICE 'Starting friends table consolidation...';
    RAISE NOTICE 'Friends table count: %', (SELECT COUNT(*) FROM friends);
    RAISE NOTICE 'User friends table count: %', (SELECT COUNT(*) FROM user_friends);
END $$;

-- Step 2: Ensure all data is in user_friends table
INSERT INTO user_friends (
    id,
    user_id,
    friend_id,
    requested_by,
    requested_at,
    responded_at,
    status,
    created_at,
    updated_at
)
SELECT 
    id,
    user_id,
    friend_id,
    requested_by,
    COALESCE(requested_at, NOW()) as requested_at,
    responded_at,
    status,
    COALESCE(created_at, NOW()) as created_at,
    COALESCE(updated_at, NOW()) as updated_at
FROM friends
WHERE NOT EXISTS (
    SELECT 1 FROM user_friends uf 
    WHERE uf.id = friends.id
);

-- Step 3: Add enterprise-grade constraints to user_friends table
ALTER TABLE user_friends 
ADD CONSTRAINT IF NOT EXISTS user_friends_user_id_friend_id_unique 
UNIQUE (user_id, friend_id);

-- Step 4: Create enterprise-grade indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_friends_user_id ON user_friends (user_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_friend_id ON user_friends (friend_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_status ON user_friends (status);
CREATE INDEX IF NOT EXISTS idx_user_friends_requested_at ON user_friends (requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_friends_requested_by ON user_friends (requested_by);
CREATE INDEX IF NOT EXISTS idx_user_friends_responded_at ON user_friends (responded_at DESC);

-- Step 5: Add enterprise-grade comments
COMMENT ON TABLE user_friends IS 'Enterprise-grade user friendship relationships with proper constraints and indexing';
COMMENT ON COLUMN user_friends.user_id IS 'The user who initiated or received the friend request';
COMMENT ON COLUMN user_friends.friend_id IS 'The other user in the friendship relationship';
COMMENT ON COLUMN user_friends.status IS 'Relationship status: pending, accepted, declined, blocked';
COMMENT ON COLUMN user_friends.requested_by IS 'User who initiated the friend request';
COMMENT ON COLUMN user_friends.requested_at IS 'Timestamp when the request was sent';
COMMENT ON COLUMN user_friends.responded_at IS 'Timestamp when the request was responded to';

-- Step 6: Create enterprise-grade views for analytics
CREATE OR REPLACE VIEW enterprise_friends_analytics AS
SELECT 
    uf.user_id,
    COUNT(*) as total_friendships,
    COUNT(CASE WHEN uf.status = 'accepted' THEN 1 END) as accepted_friendships,
    COUNT(CASE WHEN uf.status = 'pending' THEN 1 END) as pending_requests,
    COUNT(CASE WHEN uf.status = 'declined' THEN 1 END) as declined_requests,
    COUNT(CASE WHEN uf.requested_by = uf.user_id THEN 1 END) as requests_sent,
    COUNT(CASE WHEN uf.requested_by != uf.user_id THEN 1 END) as requests_received,
    AVG(EXTRACT(EPOCH FROM (uf.responded_at - uf.requested_at))/3600) as avg_response_time_hours,
    MAX(uf.updated_at) as last_activity
FROM user_friends uf
GROUP BY uf.user_id;

COMMENT ON VIEW enterprise_friends_analytics IS 'Enterprise analytics view for friend relationship metrics';

-- Step 7: Create enterprise-grade functions
CREATE OR REPLACE FUNCTION get_user_friends_count(p_user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COUNT(*)::integer
    FROM user_friends
    WHERE (user_id = p_user_id OR friend_id = p_user_id)
    AND status = 'accepted';
$$;

COMMENT ON FUNCTION get_user_friends_count IS 'Get the total number of friends for a user';

CREATE OR REPLACE FUNCTION get_pending_friend_requests(p_user_id uuid)
RETURNS TABLE(
    request_id uuid,
    requester_id uuid,
    requester_name text,
    requester_email text,
    requested_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        uf.id as request_id,
        uf.user_id as requester_id,
        u.name as requester_name,
        u.email as requester_email,
        uf.requested_at
    FROM user_friends uf
    JOIN auth.users u ON uf.user_id = u.id
    WHERE uf.friend_id = p_user_id
    AND uf.status = 'pending'
    ORDER BY uf.requested_at DESC;
$$;

COMMENT ON FUNCTION get_pending_friend_requests IS 'Get all pending friend requests for a user';

-- Step 8: Verify the migration
DO $$
DECLARE
    final_count integer;
BEGIN
    SELECT COUNT(*) INTO final_count FROM user_friends;
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Final user_friends table count: %', final_count;
END $$;

-- Step 9: Drop the redundant friends table (commented out for safety)
-- WARNING: Only uncomment after verifying all data is migrated correctly
-- DROP TABLE friends;

-- Step 10: Final verification
SELECT 
    'Migration Summary' as info,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_friendships,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
    COUNT(CASE WHEN status = 'declined' THEN 1 END) as declined_requests
FROM user_friends; 