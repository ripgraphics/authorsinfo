-- Enterprise-Grade Friends Table Consolidation
-- This script consolidates the redundant friends and user_friends tables
-- into a single, properly constrained table

-- Step 1: Verify current state
SELECT 'Current table counts:' as info;
SELECT 'friends table' as table_name, COUNT(*) as count FROM friends
UNION ALL
SELECT 'user_friends table' as table_name, COUNT(*) as count FROM user_friends;

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

-- Step 3: Verify migration
SELECT 'After migration - user_friends count:' as info, COUNT(*) as count FROM user_friends;

-- Step 4: Add any missing constraints to user_friends
ALTER TABLE user_friends 
ADD CONSTRAINT IF NOT EXISTS user_friends_user_id_friend_id_unique 
UNIQUE (user_id, friend_id);

-- Step 5: Create proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_friends_user_id ON user_friends (user_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_friend_id ON user_friends (friend_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_status ON user_friends (status);
CREATE INDEX IF NOT EXISTS idx_user_friends_requested_at ON user_friends (requested_at DESC);

-- Step 6: Drop the redundant friends table
-- WARNING: Only run this after verifying all data is migrated
-- DROP TABLE friends;

-- Step 7: Verify final state
SELECT 'Final state:' as info;
SELECT 'user_friends table' as table_name, COUNT(*) as count FROM user_friends;

-- Show sample data to verify
SELECT 
    id,
    user_id,
    friend_id,
    status,
    requested_at,
    responded_at
FROM user_friends 
ORDER BY created_at DESC 
LIMIT 10; 