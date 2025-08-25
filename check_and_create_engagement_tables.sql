-- Check and Create Engagement Tables
-- This script will identify what's missing and create the required tables

-- 1. First, let's see what tables actually exist
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

-- 2. Check if the engagement tables exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_likes') 
    THEN 'activity_likes EXISTS' 
    ELSE 'activity_likes MISSING' 
  END as status
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_comments') 
    THEN 'activity_comments EXISTS' 
    ELSE 'activity_comments MISSING' 
  END as status;

-- 3. Create activity_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."activity_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- 4. Create activity_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."activity_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "comment_text" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- 5. Add comments to the tables
COMMENT ON TABLE "public"."activity_likes" IS 'Stores user likes for activities';
COMMENT ON TABLE "public"."activity_comments" IS 'Stores user comments for activities';

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_activity_likes_activity_id" ON "public"."activity_likes" USING "btree" ("activity_id");
CREATE INDEX IF NOT EXISTS "idx_activity_likes_user_id" ON "public"."activity_likes" USING "btree" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_activity_comments_activity_id" ON "public"."activity_comments" USING "btree" ("activity_id");
CREATE INDEX IF NOT EXISTS "idx_activity_comments_user_id" ON "public"."activity_comments" USING "btree" ("user_id");

-- 7. Verify the tables were created
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

-- 8. Test basic access to the new tables
SELECT 
  'activity_likes' as table_name,
  COUNT(*) as row_count
FROM activity_likes
UNION ALL
SELECT 
  'activity_comments' as table_name,
  COUNT(*) as row_count
FROM activity_comments;

-- 9. Test inserting a sample like (optional - for testing)
-- INSERT INTO activity_likes (activity_id, user_id) 
-- VALUES ('17977b98-ef9b-4d60-8b4a-35f4ecceb3cb', '00000000-0000-0000-0000-000000000000')
-- ON CONFLICT DO NOTHING;

-- 10. Test the exact query the API uses
SELECT 
  'Testing API query...' as status;

-- Test likes query
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
