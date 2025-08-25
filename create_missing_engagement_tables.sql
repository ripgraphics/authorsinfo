-- Create Missing Engagement Tables
-- Based on actual database schema analysis - these tables are referenced but don't exist

-- 1. Check current state
SELECT 'Current database state:' as info;
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename LIKE '%activity%'
ORDER BY tablename;

-- 2. Create activity_likes table
CREATE TABLE IF NOT EXISTS "public"."activity_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- 3. Create activity_comments table with all required fields
CREATE TABLE IF NOT EXISTS "public"."activity_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "comment_text" "text" NOT NULL,
    "parent_comment_id" "uuid",
    "comment_depth" integer DEFAULT 0,
    "thread_id" "uuid",
    "reply_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- 4. Add primary keys
ALTER TABLE "public"."activity_likes" ADD CONSTRAINT "activity_likes_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."activity_comments" ADD CONSTRAINT "activity_comments_pkey" PRIMARY KEY ("id");

-- 5. Add unique constraints
ALTER TABLE "public"."activity_likes" ADD CONSTRAINT "activity_likes_activity_id_user_id_key" UNIQUE ("activity_id", "user_id");

-- 6. Add foreign key constraints
ALTER TABLE "public"."activity_likes" 
    ADD CONSTRAINT "activity_likes_activity_id_fkey" 
    FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE;

ALTER TABLE "public"."activity_likes" 
    ADD CONSTRAINT "activity_likes_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."activity_comments" 
    ADD CONSTRAINT "activity_comments_activity_id_fkey" 
    FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE;

ALTER TABLE "public"."activity_comments" 
    ADD CONSTRAINT "activity_comments_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."activity_comments" 
    ADD CONSTRAINT "activity_comments_parent_comment_id_fkey" 
    FOREIGN KEY ("parent_comment_id") REFERENCES "public"."activity_comments"("id") ON DELETE CASCADE;

-- 7. Add comments
COMMENT ON TABLE "public"."activity_likes" IS 'Stores user likes for activities';
COMMENT ON TABLE "public"."activity_comments" IS 'Stores user comments for activities';
COMMENT ON COLUMN "public"."activity_comments"."parent_comment_id" IS 'Reference to parent comment for nested replies';
COMMENT ON COLUMN "public"."activity_comments"."comment_depth" IS 'Depth level of comment in thread (0 = top level)';
COMMENT ON COLUMN "public"."activity_comments"."thread_id" IS 'Unique identifier for comment thread';
COMMENT ON COLUMN "public"."activity_comments"."reply_count" IS 'Number of direct replies to this comment';

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_activity_likes_activity_id" ON "public"."activity_likes" USING "btree" ("activity_id");
CREATE INDEX IF NOT EXISTS "idx_activity_likes_user_id" ON "public"."activity_likes" USING "btree" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_activity_likes_created_at" ON "public"."activity_likes" USING "btree" ("created_at");

CREATE INDEX IF NOT EXISTS "idx_activity_comments_activity_id" ON "public"."activity_comments" USING "btree" ("activity_id");
CREATE INDEX IF NOT EXISTS "idx_activity_comments_user_id" ON "public"."activity_comments" USING "btree" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_activity_comments_parent_comment_id" ON "public"."activity_comments" USING "btree" ("parent_comment_id");
CREATE INDEX IF NOT EXISTS "idx_activity_comments_thread_id" ON "public"."activity_comments" USING "btree" ("thread_id");
CREATE INDEX IF NOT EXISTS "idx_activity_comments_reply_count" ON "public"."activity_comments" USING "btree" ("reply_count");

-- 9. Grant permissions
GRANT ALL ON TABLE "public"."activity_likes" TO "anon";
GRANT ALL ON TABLE "public"."activity_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_likes" TO "service_role";

GRANT ALL ON TABLE "public"."activity_comments" TO "anon";
GRANT ALL ON TABLE "public"."activity_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_comments" TO "service_role";

-- 10. Verify tables were created
SELECT 'Verification - Tables created:' as info;
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('activity_likes', 'activity_comments')
ORDER BY tablename;

-- 11. Test basic access
SELECT 'Testing table access:' as info;
SELECT 
  'activity_likes' as table_name,
  COUNT(*) as row_count
FROM activity_likes
UNION ALL
SELECT 
  'activity_comments' as table_name,
  COUNT(*) as row_count
FROM activity_comments;

-- 12. Test the exact queries the API uses
SELECT 'Testing API queries:' as info;

-- Test likes query (using a sample activity ID from your data)
SELECT 
  al.user_id,
  al.created_at
FROM activity_likes al
WHERE al.activity_id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb'
ORDER BY al.created_at DESC
LIMIT 10;

-- Test comments query
SELECT 
  ac.id,
  ac.user_id,
  ac.comment_text,
  ac.created_at
FROM activity_comments ac
WHERE ac.activity_id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb'
ORDER BY ac.created_at DESC
LIMIT 10;

SELECT 'Tables created successfully!' as result;
