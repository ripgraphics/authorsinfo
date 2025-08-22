-- Enhanced Profile Data Model Migration
-- This migration adds comprehensive profile fields for enterprise-grade user profiles

-- Add missing profile fields to the profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_profile_update TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('private', 'friends', 'followers', 'public'));

-- Add comments for new columns
COMMENT ON COLUMN profiles.avatar_url IS 'User profile avatar image URL';
COMMENT ON COLUMN profiles.cover_image_url IS 'User profile cover image URL';
COMMENT ON COLUMN profiles.birth_date IS 'User birth date for age calculation';
COMMENT ON COLUMN profiles.gender IS 'User gender identity';
COMMENT ON COLUMN profiles.occupation IS 'User professional occupation';
COMMENT ON COLUMN profiles.education IS 'User educational background';
COMMENT ON COLUMN profiles.interests IS 'Array of user interests and hobbies';
COMMENT ON COLUMN profiles.social_links IS 'JSON object containing social media links';
COMMENT ON COLUMN profiles.phone IS 'User phone number (optional)';
COMMENT ON COLUMN profiles.timezone IS 'User timezone for localized content';
COMMENT ON COLUMN profiles.language_preference IS 'User preferred language for content';
COMMENT ON COLUMN profiles.profile_completion_percentage IS 'Percentage of profile completion (0-100)';
COMMENT ON COLUMN profiles.last_profile_update IS 'Timestamp of last profile update';
COMMENT ON COLUMN profiles.profile_visibility IS 'Profile visibility level for privacy control';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_visibility ON profiles(profile_visibility);
CREATE INDEX IF NOT EXISTS idx_profiles_completion ON profiles(profile_completion_percentage);

-- Create a function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(user_profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
    completion_score INTEGER := 0;
    total_fields INTEGER := 0;
    filled_fields INTEGER := 0;
BEGIN
    -- Count total profile fields
    SELECT 
        CASE WHEN avatar_url IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN cover_image_url IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN bio IS NOT NULL AND bio != '' THEN 1 ELSE 0 END +
        CASE WHEN occupation IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN education IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN interests IS NOT NULL AND array_length(interests, 1) > 0 THEN 1 ELSE 0 END +
        CASE WHEN social_links IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN phone IS NOT NULL THEN 1 ELSE 0 END
    INTO filled_fields
    FROM profiles 
    WHERE id = user_profile_id;
    
    total_fields := 8; -- Total number of profile fields
    completion_score := ROUND((filled_fields::NUMERIC / total_fields) * 100);
    
    RETURN LEAST(completion_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update profile completion percentage
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.profile_completion_percentage := calculate_profile_completion(NEW.id);
    NEW.last_profile_update := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profile completion updates
DROP TRIGGER IF EXISTS trigger_update_profile_completion ON profiles;
CREATE TRIGGER trigger_update_profile_completion
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_completion();

-- Create a view for enhanced profile information
CREATE OR REPLACE VIEW enhanced_user_profiles AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.created_at,
    u.updated_at,
    u.permalink,
    u.location,
    u.website,
    p.bio,
    p.role,
    p.avatar_url,
    p.cover_image_url,
    p.birth_date,
    p.gender,
    p.occupation,
    p.education,
    p.interests,
    p.social_links,
    p.phone,
    p.timezone,
    p.language_preference,
    p.profile_completion_percentage,
    p.last_profile_update,
    p.profile_visibility,
    -- Calculate age if birth_date is available
    CASE 
        WHEN p.birth_date IS NOT NULL 
        THEN EXTRACT(YEAR FROM AGE(p.birth_date))
        ELSE NULL 
    END as age
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id;

-- Grant appropriate permissions
GRANT SELECT ON enhanced_user_profiles TO authenticated;
GRANT SELECT ON enhanced_user_profiles TO anon;

-- Create a function to get user profile statistics
CREATE OR REPLACE FUNCTION get_user_profile_stats(user_uuid UUID)
RETURNS TABLE(
    total_books_read BIGINT,
    total_reviews BIGINT,
    total_friends BIGINT,
    total_followers BIGINT,
    total_following BIGINT,
    profile_completion INTEGER,
    last_activity TIMESTAMP WITH TIME ZONE,
    reading_streak_days INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(books_read.count, 0)::BIGINT as total_books_read,
        COALESCE(reviews.count, 0)::BIGINT as total_reviews,
        COALESCE(friends.count, 0)::BIGINT as total_friends,
        COALESCE(followers.count, 0)::BIGINT as total_followers,
        COALESCE(following.count, 0)::BIGINT as total_following,
        COALESCE(prof.profile_completion_percentage, 0) as profile_completion,
        COALESCE(activity.last_activity, u.created_at) as last_activity,
        COALESCE(streak.streak_days, 0) as reading_streak_days
    FROM users u
    LEFT JOIN profiles prof ON u.id = prof.user_id
    LEFT JOIN (
        SELECT user_id, COUNT(*) as count
        FROM reading_progress 
        WHERE status = 'completed' AND user_id = user_uuid
        GROUP BY user_id
    ) books_read ON u.id = books_read.user_id
    LEFT JOIN (
        SELECT user_id, COUNT(*) as count
        FROM book_reviews 
        WHERE user_id = user_uuid
        GROUP BY user_id
    ) reviews ON u.id = reviews.user_id
    LEFT JOIN (
        SELECT user_id, COUNT(*) as count
        FROM user_friends 
        WHERE (user_id = user_uuid OR friend_id = user_uuid) AND status = 'accepted'
        GROUP BY user_id
    ) friends ON u.id = friends.user_id
    LEFT JOIN (
        SELECT target_id, COUNT(*) as count
        FROM follows 
        WHERE target_type = 'user' AND target_id = user_uuid
        GROUP BY target_id
    ) followers ON u.id = followers.target_id
    LEFT JOIN (
        SELECT follower_id, COUNT(*) as count
        FROM follows 
        WHERE target_type = 'user' AND follower_id = user_uuid
        GROUP BY follower_id
    ) following ON u.id = following.follower_id
    LEFT JOIN (
        SELECT user_id, MAX(created_at) as last_activity
        FROM user_activity_log 
        WHERE user_id = user_uuid
        GROUP BY user_id
    ) activity ON u.id = activity.user_id
    LEFT JOIN (
        SELECT user_id, COUNT(DISTINCT DATE(created_at)) as streak_days
        FROM user_activity_log 
        WHERE user_id = user_uuid 
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY user_id
    ) streak ON u.id = streak.user_id
    WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_profile_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile_stats(UUID) TO anon;
