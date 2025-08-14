-- Add RLS policies for posts table
-- This migration ensures proper RLS policies are in place for the posts table

-- Enable RLS on posts table
ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "posts_insert_policy" ON "public"."posts";
DROP POLICY IF EXISTS "posts_select_policy" ON "public"."posts";
DROP POLICY IF EXISTS "posts_update_policy" ON "public"."posts";
DROP POLICY IF EXISTS "posts_delete_policy" ON "public"."posts";

-- Create RLS policies for posts
CREATE POLICY "posts_insert_policy" ON "public"."posts"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_select_policy" ON "public"."posts"
    FOR SELECT USING (
        is_deleted = false AND (
            visibility = 'public' OR 
            (visibility = 'private' AND auth.uid() = user_id) OR
            (visibility = 'friends' AND auth.uid() = ANY(allowed_user_ids))
        )
    );

CREATE POLICY "posts_update_policy" ON "public"."posts"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "posts_delete_policy" ON "public"."posts"
    FOR DELETE USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE "public"."posts" IS 'Enterprise-grade posts with rich content, moderation, and analytics';
