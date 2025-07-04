-- Migration: Enhanced Photo Album System
-- This migration adds support for user photo albums with privacy controls and feed integration

-- Create user_activities table for feed integration
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    is_public BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_likes table for liking activities
CREATE TABLE IF NOT EXISTS activity_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_id UUID NOT NULL REFERENCES user_activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(activity_id, user_id)
);

-- Create activity_comments table for commenting on activities
CREATE TABLE IF NOT EXISTS activity_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_id UUID NOT NULL REFERENCES user_activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_entity ON user_activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_public ON user_activities(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_likes_activity_id ON activity_likes(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_likes_user_id ON activity_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_activity_id ON activity_comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_user_id ON activity_comments(user_id);

-- Add RLS policies for user_activities
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public activities" ON user_activities
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own activities" ON user_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view activities from friends" ON user_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_friends 
            WHERE (user_id = auth.uid() AND friend_id = user_activities.user_id AND status = 'accepted')
            OR (friend_id = auth.uid() AND user_id = user_activities.user_id AND status = 'accepted')
        )
    );

CREATE POLICY "Users can create their own activities" ON user_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" ON user_activities
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" ON user_activities
    FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for activity_likes
ALTER TABLE activity_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all likes" ON activity_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own likes" ON activity_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON activity_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for activity_comments
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on public activities" ON activity_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_activities 
            WHERE user_activities.id = activity_comments.activity_id 
            AND user_activities.is_public = true
        )
    );

CREATE POLICY "Users can view comments on their own activities" ON activity_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_activities 
            WHERE user_activities.id = activity_comments.activity_id 
            AND user_activities.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view comments on friends' activities" ON activity_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_activities ua
            JOIN user_friends uf ON (
                (uf.user_id = auth.uid() AND uf.friend_id = ua.user_id AND uf.status = 'accepted')
                OR (uf.friend_id = auth.uid() AND uf.user_id = ua.user_id AND uf.status = 'accepted')
            )
            WHERE ua.id = activity_comments.activity_id
        )
    );

CREATE POLICY "Users can create comments" ON activity_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON activity_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON activity_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Update photo_albums table to support enhanced privacy controls
ALTER TABLE photo_albums 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create function to automatically create feed activity when public album is created
CREATE OR REPLACE FUNCTION handle_public_album_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create feed activity if album is public and show_in_feed is true
    IF NEW.is_public = true AND 
       (NEW.metadata->>'show_in_feed' IS NULL OR (NEW.metadata->>'show_in_feed')::boolean = true) THEN
        
        INSERT INTO user_activities (
            user_id,
            activity_type,
            entity_type,
            entity_id,
            is_public,
            metadata
        ) VALUES (
            NEW.owner_id,
            'album_created',
            'photo_album',
            NEW.id,
            true,
            jsonb_build_object(
                'album_name', NEW.name,
                'album_description', NEW.description,
                'privacy_level', COALESCE(NEW.metadata->>'privacy_level', 'public')
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for album creation
DROP TRIGGER IF EXISTS trigger_public_album_creation ON photo_albums;
CREATE TRIGGER trigger_public_album_creation
    AFTER INSERT ON photo_albums
    FOR EACH ROW
    EXECUTE FUNCTION handle_public_album_creation();

-- Create function to handle album privacy updates
CREATE OR REPLACE FUNCTION handle_album_privacy_update()
RETURNS TRIGGER AS $$
BEGIN
    -- If album is now public and should show in feed, create activity
    IF NEW.is_public = true AND 
       (NEW.metadata->>'show_in_feed' IS NULL OR (NEW.metadata->>'show_in_feed')::boolean = true) AND
       (OLD.is_public = false OR OLD.metadata->>'show_in_feed' = 'false') THEN
        
        INSERT INTO user_activities (
            user_id,
            activity_type,
            entity_type,
            entity_id,
            is_public,
            metadata
        ) VALUES (
            NEW.owner_id,
            'album_created',
            'photo_album',
            NEW.id,
            true,
            jsonb_build_object(
                'album_name', NEW.name,
                'album_description', NEW.description,
                'privacy_level', COALESCE(NEW.metadata->>'privacy_level', 'public')
            )
        );
    END IF;
    
    -- If album is no longer public, remove activity
    IF NEW.is_public = false OR (NEW.metadata->>'show_in_feed')::boolean = false THEN
        DELETE FROM user_activities 
        WHERE entity_type = 'photo_album' 
        AND entity_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for album updates
DROP TRIGGER IF EXISTS trigger_album_privacy_update ON photo_albums;
CREATE TRIGGER trigger_album_privacy_update
    AFTER UPDATE ON photo_albums
    FOR EACH ROW
    EXECUTE FUNCTION handle_album_privacy_update();

-- Create function to get user's feed activities
CREATE OR REPLACE FUNCTION get_user_feed_activities(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    activity_type TEXT,
    entity_type TEXT,
    entity_id TEXT,
    is_public BOOLEAN,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    user_name TEXT,
    user_avatar_url TEXT,
    like_count BIGINT,
    comment_count BIGINT,
    is_liked BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ua.id,
        ua.user_id,
        ua.activity_type,
        ua.entity_type,
        ua.entity_id,
        ua.is_public,
        ua.metadata,
        ua.created_at,
        u.name as user_name,
        u.avatar_url as user_avatar_url,
        COALESCE(al.like_count, 0) as like_count,
        COALESCE(ac.comment_count, 0) as comment_count,
        COALESCE(ual.is_liked, false) as is_liked
    FROM user_activities ua
    JOIN users u ON ua.user_id = u.id
    LEFT JOIN (
        SELECT activity_id, COUNT(*) as like_count
        FROM activity_likes
        GROUP BY activity_id
    ) al ON ua.id = al.activity_id
    LEFT JOIN (
        SELECT activity_id, COUNT(*) as comment_count
        FROM activity_comments
        GROUP BY activity_id
    ) ac ON ua.id = ac.activity_id
    LEFT JOIN (
        SELECT activity_id, true as is_liked
        FROM activity_likes
        WHERE user_id = p_user_id
    ) ual ON ua.id = ual.activity_id
    WHERE (
        -- Public activities
        ua.is_public = true
        OR 
        -- User's own activities
        ua.user_id = p_user_id
        OR
        -- Friends' activities
        EXISTS (
            SELECT 1 FROM user_friends 
            WHERE (user_id = p_user_id AND friend_id = ua.user_id AND status = 'accepted')
            OR (friend_id = p_user_id AND user_id = ua.user_id AND status = 'accepted')
        )
    )
    ORDER BY ua.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_activities TO authenticated;
GRANT ALL ON activity_likes TO authenticated;
GRANT ALL ON activity_comments TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_feed_activities TO authenticated; 