-- Basic RLS policies backup
-- This is a fallback policies file
-- Your actual policies will be in the main backup

-- Enable RLS on reading_progress
ALTER TABLE "public"."reading_progress" ENABLE ROW LEVEL SECURITY;

-- Basic owner policy
CREATE POLICY "reading_progress_owner_policy" ON "public"."reading_progress"
    FOR ALL USING (auth.uid() = user_id);
