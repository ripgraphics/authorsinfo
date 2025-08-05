-- Migration script to move data from friends table to user_friends table
-- This ensures all friend data is in the correct table

-- First, let's check what data exists in both tables
SELECT 'friends table count:' as info, COUNT(*) as count FROM friends
UNION ALL
SELECT 'user_friends table count:' as info, COUNT(*) as count FROM user_friends;

-- Insert data from friends table to user_friends table (if not already exists)
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
    WHERE uf.user_id = friends.user_id 
    AND uf.friend_id = friends.friend_id
);

-- Verify the migration
SELECT 'After migration - user_friends table count:' as info, COUNT(*) as count FROM user_friends;

-- Show some sample data to verify
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