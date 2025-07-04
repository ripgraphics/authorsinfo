-- Migration: Create user_friends table for friend relationships
CREATE TABLE IF NOT EXISTS user_friends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_user_friends_user_id ON user_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_friend_id ON user_friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_status ON user_friends(status);

-- Enable RLS for user_friends
ALTER TABLE user_friends ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own friend relationships
CREATE POLICY "Users can view their own friends" ON user_friends
    FOR SELECT USING (
        auth.uid() = user_id OR auth.uid() = friend_id
    );

-- Allow users to insert friend requests
CREATE POLICY "Users can create friend requests" ON user_friends
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR auth.uid() = friend_id
    );

-- Allow users to update their own friend relationships
CREATE POLICY "Users can update their own friends" ON user_friends
    FOR UPDATE USING (
        auth.uid() = user_id OR auth.uid() = friend_id
    );

-- Allow users to delete their own friend relationships
CREATE POLICY "Users can delete their own friends" ON user_friends
    FOR DELETE USING (
        auth.uid() = user_id OR auth.uid() = friend_id
    ); 