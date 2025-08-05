-- Enterprise-Grade Friends System Enhancement
-- This migration adds proper foreign keys, indexes, and enterprise features

-- 1. Add proper foreign key constraints
ALTER TABLE "public"."friends" 
ADD CONSTRAINT "friends_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."friends" 
ADD CONSTRAINT "friends_friend_id_fkey" 
FOREIGN KEY ("friend_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."friends" 
ADD CONSTRAINT "friends_requested_by_fkey" 
FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- 2. Add unique constraint to prevent duplicate friend relationships
ALTER TABLE "public"."friends" 
ADD CONSTRAINT "friends_unique_relationship" 
UNIQUE ("user_id", "friend_id");

-- 3. Add indexes for performance
CREATE INDEX "idx_friends_user_id" ON "public"."friends" ("user_id");
CREATE INDEX "idx_friends_friend_id" ON "public"."friends" ("friend_id");
CREATE INDEX "idx_friends_status" ON "public"."friends" ("status");
CREATE INDEX "idx_friends_requested_at" ON "public"."friends" ("requested_at" DESC);
CREATE INDEX "idx_friends_user_status" ON "public"."friends" ("user_id", "status");

-- 4. Add enterprise features table for friend analytics
CREATE TABLE IF NOT EXISTS "public"."friend_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "total_friends" integer DEFAULT 0,
    "mutual_friends_count" integer DEFAULT 0,
    "friend_requests_sent" integer DEFAULT 0,
    "friend_requests_received" integer DEFAULT 0,
    "friend_requests_accepted" integer DEFAULT 0,
    "friend_requests_rejected" integer DEFAULT 0,
    "last_activity_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE
);

-- 5. Add friend activity tracking
CREATE TABLE IF NOT EXISTS "public"."friend_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friend_id" "uuid" NOT NULL,
    "activity_type" text NOT NULL, -- 'request_sent', 'request_accepted', 'request_rejected', 'friend_removed'
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT "now"(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("friend_id") REFERENCES "public"."users"("id") ON DELETE CASCADE
);

-- 6. Add friend suggestions table
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
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("suggested_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE,
    UNIQUE ("user_id", "suggested_user_id")
);

-- 7. Add indexes for new tables
CREATE INDEX "idx_friend_analytics_user_id" ON "public"."friend_analytics" ("user_id");
CREATE INDEX "idx_friend_activities_user_id" ON "public"."friend_activities" ("user_id", "created_at" DESC);
CREATE INDEX "idx_friend_activities_friend_id" ON "public"."friend_activities" ("friend_id", "created_at" DESC);
CREATE INDEX "idx_friend_suggestions_user_id" ON "public"."friend_suggestions" ("user_id");
CREATE INDEX "idx_friend_suggestions_score" ON "public"."friend_suggestions" ("suggestion_score" DESC);

-- 8. Create materialized view for friend statistics
CREATE MATERIALIZED VIEW "public"."friend_statistics" AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    COUNT(DISTINCT f.friend_id) as total_friends,
    COUNT(DISTINCT CASE WHEN f.status = 'accepted' THEN f.friend_id END) as accepted_friends,
    COUNT(DISTINCT CASE WHEN f.status = 'pending' AND f.requested_by = u.id THEN f.friend_id END) as pending_sent,
    COUNT(DISTINCT CASE WHEN f.status = 'pending' AND f.requested_by != u.id THEN f.friend_id END) as pending_received,
    MAX(f.updated_at) as last_friend_activity
FROM "public"."users" u
LEFT JOIN "public"."friends" f ON (u.id = f.user_id OR u.id = f.friend_id)
GROUP BY u.id, u.name
WITH NO DATA;

-- 9. Create function to refresh friend statistics
CREATE OR REPLACE FUNCTION refresh_friend_statistics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW "public"."friend_statistics";
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to calculate mutual friends
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

-- 11. Create function to generate friend suggestions
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
    FROM "public"."users" potential_friend
    WHERE potential_friend.id != target_user_id
    AND potential_friend.id NOT IN (
        SELECT friend_id FROM "public"."friends" WHERE user_id = target_user_id
        UNION
        SELECT user_id FROM "public"."friends" WHERE friend_id = target_user_id
    )
    AND get_mutual_friends_count(target_user_id, potential_friend.id) > 0;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger to update friend analytics
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

CREATE TRIGGER trigger_update_friend_analytics
    AFTER INSERT OR UPDATE ON "public"."friends"
    FOR EACH ROW
    EXECUTE FUNCTION update_friend_analytics();

-- 13. Add comments for documentation
COMMENT ON TABLE "public"."friends" IS 'Enterprise-grade friend relationships with full tracking and analytics';
COMMENT ON TABLE "public"."friend_analytics" IS 'Analytics and metrics for friend system performance';
COMMENT ON TABLE "public"."friend_activities" IS 'Audit trail of all friend-related activities';
COMMENT ON TABLE "public"."friend_suggestions" IS 'AI-powered friend suggestions with scoring';
COMMENT ON MATERIALIZED VIEW "public"."friend_statistics" IS 'Cached friend statistics for performance';

-- 14. Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."friends" TO authenticated;
GRANT SELECT ON "public"."friend_analytics" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "public"."friend_activities" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "public"."friend_suggestions" TO authenticated;
GRANT SELECT ON "public"."friend_statistics" TO authenticated; 