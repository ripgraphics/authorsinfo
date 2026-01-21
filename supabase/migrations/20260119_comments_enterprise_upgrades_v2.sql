-- 20260119_comments_enterprise_upgrades_v2.sql
-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_entity_id ON public.comments(entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_thread_id ON public.comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON public.comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at);

-- Enable Row Level Security
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Add RLS policies (corrected syntax)
CREATE POLICY "Authenticated users can insert comments" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view comments" ON public.comments
  FOR SELECT TO authenticated, anon
  USING (true);
CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Add CHECK constraint for moderation_status
ALTER TABLE public.comments
  ADD CONSTRAINT chk_moderation_status CHECK (moderation_status IN ('approved', 'pending', 'rejected'));

-- Add comments/documentation to columns
COMMENT ON COLUMN public.comments.id IS 'Primary key for comment';
COMMENT ON COLUMN public.comments.user_id IS 'User who created the comment';
COMMENT ON COLUMN public.comments.feed_entry_id IS 'Feed entry associated with the comment';
COMMENT ON COLUMN public.comments.content IS 'Text content of the comment';
COMMENT ON COLUMN public.comments.created_at IS 'Timestamp when comment was created';
COMMENT ON COLUMN public.comments.updated_at IS 'Timestamp when comment was last updated';
COMMENT ON COLUMN public.comments.is_hidden IS 'Whether the comment is hidden';
COMMENT ON COLUMN public.comments.is_deleted IS 'Whether the comment is deleted';
COMMENT ON COLUMN public.comments.entity_type IS 'Type of entity being commented on';
COMMENT ON COLUMN public.comments.entity_id IS 'ID of entity being commented on';
COMMENT ON COLUMN public.comments.parent_id IS 'ID of parent comment (threading)';
COMMENT ON COLUMN public.comments.parent_comment_id IS 'ID of parent comment (alternate threading)';
COMMENT ON COLUMN public.comments.thread_id IS 'ID of thread grouping comments';
COMMENT ON COLUMN public.comments.comment_depth IS 'Depth of comment in thread';
COMMENT ON COLUMN public.comments.reply_count IS 'Number of replies to this comment';
COMMENT ON COLUMN public.comments.moderation_status IS 'Moderation status of comment';
COMMENT ON COLUMN public.comments.content_html IS 'HTML content of the comment';
COMMENT ON COLUMN public.comments.mentions IS 'Array of mentioned user IDs';
