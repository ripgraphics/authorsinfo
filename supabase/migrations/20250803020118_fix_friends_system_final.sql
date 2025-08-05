-- Apply Friends System Migration
-- This script creates the missing tables and functions for the friends system

-- 1. Create friend_suggestions table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."friend_suggestions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "suggested_user_id" "uuid" NOT NULL,
    "mutual_friends_count" integer DEFAULT 0,
    "common_interests" text[],
    "suggestion_score" numeric(3,2) DEFAULT 0.00,
    "is_dismissed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("suggested_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    UNIQUE ("user_id", "suggested_user_id")
);

-- 2. Create friend_analytics table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."friend_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "total_friends" integer DEFAULT 0,
    "friend_requests_sent" integer DEFAULT 0,
    "friend_requests_received" integer DEFAULT 0,
    "friend_requests_accepted" integer DEFAULT 0,
    "friend_requests_rejected" integer DEFAULT 0,
    "last_activity_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    UNIQUE ("user_id")
);

-- 3. Create friend_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."friend_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friend_id" "uuid" NOT NULL,
    "activity_type" text NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT "now"(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("friend_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_friend_analytics_user_id" ON "public"."friend_analytics" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_friend_activities_user_id" ON "public"."friend_activities" ("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_friend_activities_friend_id" ON "public"."friend_activities" ("friend_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_friend_suggestions_user_id" ON "public"."friend_suggestions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_friend_suggestions_score" ON "public"."friend_suggestions" ("suggestion_score" DESC);

-- 5. Create function to calculate mutual friends
CREATE OR REPLACE FUNCTION get_mutual_friends_count(user1_id uuid, user2_id uuid)
RETURNS integer AS $$
DECLARE
    mutual_count integer;
BEGIN
    SELECT COUNT(*) INTO mutual_count
    FROM (
        SELECT f1.friend_id
        FROM "public"."friends" f1
        WHERE f1.user_id = user1_id AND f1.status = 'accepted'
        INTERSECT
        SELECT f2.friend_id
        FROM "public"."friends" f2
        WHERE f2.user_id = user2_id AND f2.status = 'accepted'
    ) mutual_friends;
    
    RETURN mutual_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to generate friend suggestions
CREATE OR REPLACE FUNCTION generate_friend_suggestions(target_user_id uuid)
RETURNS void AS $$
BEGIN
    -- Clear existing suggestions
    DELETE FROM "public"."friend_suggestions" WHERE user_id = target_user_id;
    
    -- Insert new suggestions based on mutual friends
    INSERT INTO "public"."friend_suggestions" (user_id, suggested_user_id, mutual_friends_count, suggestion_score)
    SELECT 
        target_user_id,
        potential_friend.id,
        get_mutual_friends_count(target_user_id, potential_friend.id) as mutual_friends_count,
        LEAST(get_mutual_friends_count(target_user_id, potential_friend.id) * 0.1, 1.0) as suggestion_score
    FROM "auth"."users" potential_friend
    WHERE potential_friend.id != target_user_id
    AND potential_friend.id NOT IN (
        SELECT friend_id FROM "public"."friends" WHERE user_id = target_user_id
        UNION
        SELECT user_id FROM "public"."friends" WHERE friend_id = target_user_id
    )
    AND get_mutual_friends_count(target_user_id, potential_friend.id) > 0;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to update friend analytics
CREATE OR REPLACE FUNCTION update_friend_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update analytics for both users involved
    INSERT INTO "public"."friend_analytics" (user_id, total_friends, friend_requests_sent, friend_requests_received, friend_requests_accepted, friend_requests_rejected, last_activity_at)
    VALUES 
        (NEW.user_id, 
         (SELECT COUNT(*) FROM "public"."friends" WHERE (user_id = NEW.user_id OR friend_id = NEW.user_id) AND status = 'accepted'),
         (SELECT COUNT(*) FROM "public"."friends" WHERE user_id = NEW.user_id AND requested_by = NEW.user_id),
         (SELECT COUNT(*) FROM "public"."friends" WHERE friend_id = NEW.user_id AND requested_by != NEW.user_id),
         (SELECT COUNT(*) FROM "public"."friends" WHERE (user_id = NEW.user_id OR friend_id = NEW.user_id) AND status = 'accepted'),
         (SELECT COUNT(*) FROM "public"."friends" WHERE (user_id = NEW.user_id OR friend_id = NEW.user_id) AND status = 'rejected'),
         NEW.updated_at),
        (NEW.friend_id,
         (SELECT COUNT(*) FROM "public"."friends" WHERE (user_id = NEW.friend_id OR friend_id = NEW.friend_id) AND status = 'accepted'),
         (SELECT COUNT(*) FROM "public"."friends" WHERE user_id = NEW.friend_id AND requested_by = NEW.friend_id),
         (SELECT COUNT(*) FROM "public"."friends" WHERE friend_id = NEW.friend_id AND requested_by != NEW.friend_id),
         (SELECT COUNT(*) FROM "public"."friends" WHERE (user_id = NEW.friend_id OR friend_id = NEW.friend_id) AND status = 'accepted'),
         (SELECT COUNT(*) FROM "public"."friends" WHERE (user_id = NEW.friend_id OR friend_id = NEW.friend_id) AND status = 'rejected'),
         NEW.updated_at)
    ON CONFLICT (user_id) DO UPDATE SET
        total_friends = EXCLUDED.total_friends,
        friend_requests_sent = EXCLUDED.friend_requests_sent,
        friend_requests_received = EXCLUDED.friend_requests_received,
        friend_requests_accepted = EXCLUDED.friend_requests_accepted,
        friend_requests_rejected = EXCLUDED.friend_requests_rejected,
        last_activity_at = EXCLUDED.last_activity_at,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to update friend analytics
DROP TRIGGER IF EXISTS trigger_update_friend_analytics ON "public"."friends";
CREATE TRIGGER trigger_update_friend_analytics
    AFTER INSERT OR UPDATE ON "public"."friends"
    FOR EACH ROW
    EXECUTE FUNCTION update_friend_analytics();

-- 9. Add comments for documentation
COMMENT ON TABLE "public"."friend_suggestions" IS 'Friend suggestions based on mutual friends and common interests';
COMMENT ON TABLE "public"."friend_analytics" IS 'Analytics data for friend relationships';
COMMENT ON TABLE "public"."friend_activities" IS 'Activity log for friend-related actions';
COMMENT ON FUNCTION "public"."get_mutual_friends_count" IS 'Calculate the number of mutual friends between two users';
COMMENT ON FUNCTION "public"."generate_friend_suggestions" IS 'Generate friend suggestions for a user based on mutual friends';
COMMENT ON FUNCTION "public"."update_friend_analytics" IS 'Update friend analytics when friend relationships change';
