-- Migration: Add nested comment support to all comment tables
-- This enables users to reply to specific comments, creating threaded conversations

-- Add parent_comment_id to event_comments table
ALTER TABLE event_comments 
ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES event_comments(id) ON DELETE CASCADE;

-- Add parent_comment_id to photo_comments table  
ALTER TABLE photo_comments 
ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES photo_comments(id) ON DELETE CASCADE;

-- Add parent_comment_id to activity_comments table
ALTER TABLE activity_comments 
ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES activity_comments(id) ON DELETE CASCADE;

-- Add parent_comment_id to book_club_discussion_comments table
ALTER TABLE book_club_discussion_comments 
ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES book_club_discussion_comments(id) ON DELETE CASCADE;

-- Add parent_comment_id to discussion_comments table
ALTER TABLE discussion_comments 
ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES discussion_comments(id) ON DELETE CASCADE;

-- Add parent_comment_id to comments table (generic)
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- Create indexes for better performance on nested comment queries
CREATE INDEX IF NOT EXISTS idx_event_comments_parent_comment_id ON event_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_photo_comments_parent_comment_id ON photo_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_parent_comment_id ON activity_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_book_club_discussion_comments_parent_comment_id ON book_club_discussion_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_parent_comment_id ON discussion_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);

-- Add comment depth tracking for UI rendering (optional but useful)
ALTER TABLE event_comments 
ADD COLUMN IF NOT EXISTS comment_depth INTEGER DEFAULT 0;

ALTER TABLE photo_comments 
ADD COLUMN IF NOT EXISTS comment_depth INTEGER DEFAULT 0;

ALTER TABLE activity_comments 
ADD COLUMN IF NOT EXISTS comment_depth INTEGER DEFAULT 0;

ALTER TABLE book_club_discussion_comments 
ADD COLUMN IF NOT EXISTS comment_depth INTEGER DEFAULT 0;

ALTER TABLE discussion_comments 
ADD COLUMN IF NOT EXISTS comment_depth INTEGER DEFAULT 0;

ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS comment_depth INTEGER DEFAULT 0;

ALTER TABLE post_comments 
ADD COLUMN IF NOT EXISTS comment_depth INTEGER DEFAULT 0;

-- Create function to calculate comment depth
CREATE OR REPLACE FUNCTION calculate_comment_depth()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_comment_id IS NULL THEN
    NEW.comment_depth := 0;
  ELSE
    -- Get the depth of the parent comment and add 1
    SELECT COALESCE(comment_depth, 0) + 1 INTO NEW.comment_depth
    FROM (
      SELECT comment_depth FROM event_comments WHERE id = NEW.parent_comment_id
      UNION ALL
      SELECT comment_depth FROM photo_comments WHERE id = NEW.parent_comment_id
      UNION ALL
      SELECT comment_depth FROM activity_comments WHERE id = NEW.parent_comment_id
      UNION ALL
      SELECT comment_depth FROM book_club_discussion_comments WHERE id = NEW.parent_comment_id
      UNION ALL
      SELECT comment_depth FROM discussion_comments WHERE id = NEW.parent_comment_id
      UNION ALL
      SELECT comment_depth FROM comments WHERE id = NEW.parent_comment_id
      UNION ALL
      SELECT comment_depth FROM post_comments WHERE id = NEW.parent_comment_id
    ) AS parent_depth;
    
    -- Ensure depth doesn't exceed reasonable limits (e.g., 10 levels)
    NEW.comment_depth := LEAST(NEW.comment_depth, 10);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for each comment table
CREATE TRIGGER trigger_calculate_event_comment_depth
  BEFORE INSERT OR UPDATE ON event_comments
  FOR EACH ROW EXECUTE FUNCTION calculate_comment_depth();

CREATE TRIGGER trigger_calculate_photo_comment_depth
  BEFORE INSERT OR UPDATE ON photo_comments
  FOR EACH ROW EXECUTE FUNCTION calculate_comment_depth();

CREATE TRIGGER trigger_calculate_activity_comment_depth
  BEFORE INSERT OR UPDATE ON activity_comments
  FOR EACH ROW EXECUTE FUNCTION calculate_comment_depth();

CREATE TRIGGER trigger_calculate_book_club_discussion_comment_depth
  BEFORE INSERT OR UPDATE ON book_club_discussion_comments
  FOR EACH ROW EXECUTE FUNCTION calculate_comment_depth();

CREATE TRIGGER trigger_calculate_discussion_comment_depth
  BEFORE INSERT OR UPDATE ON discussion_comments
  FOR EACH ROW EXECUTE FUNCTION calculate_comment_depth();

CREATE TRIGGER trigger_calculate_comment_depth
  BEFORE INSERT OR UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION calculate_comment_depth();

CREATE TRIGGER trigger_calculate_post_comment_depth
  BEFORE INSERT OR UPDATE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION calculate_comment_depth();

-- Add comment thread tracking for better organization
ALTER TABLE event_comments 
ADD COLUMN IF NOT EXISTS thread_id UUID DEFAULT gen_random_uuid();

ALTER TABLE photo_comments 
ADD COLUMN IF NOT EXISTS thread_id UUID DEFAULT gen_random_uuid();

ALTER TABLE activity_comments 
ADD COLUMN IF NOT EXISTS thread_id UUID DEFAULT gen_random_uuid();

ALTER TABLE book_club_discussion_comments 
ADD COLUMN IF NOT EXISTS thread_id UUID DEFAULT gen_random_uuid();

ALTER TABLE discussion_comments 
ADD COLUMN IF NOT EXISTS thread_id UUID DEFAULT gen_random_uuid();

ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS thread_id UUID DEFAULT gen_random_uuid();

ALTER TABLE post_comments 
ADD COLUMN IF NOT EXISTS thread_id UUID DEFAULT gen_random_uuid();

-- Create indexes for thread-based queries
CREATE INDEX IF NOT EXISTS idx_event_comments_thread_id ON event_comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_photo_comments_thread_id ON photo_comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_thread_id ON activity_comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_book_club_discussion_comments_thread_id ON book_club_discussion_comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_thread_id ON discussion_comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_comments_thread_id ON comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_thread_id ON post_comments(thread_id);

-- Function to update thread_id for replies
CREATE OR REPLACE FUNCTION update_comment_thread_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_comment_id IS NULL THEN
    -- Top-level comment, generate new thread_id
    NEW.thread_id := gen_random_uuid();
  ELSE
    -- Reply comment, inherit thread_id from parent
    SELECT thread_id INTO NEW.thread_id
    FROM (
      SELECT thread_id FROM event_comments WHERE id = NEW.parent_comment_id
      UNION ALL
      SELECT thread_id FROM photo_comments WHERE id = NEW.parent_comment_id
      UNION ALL
      SELECT thread_id FROM activity_comments WHERE id = NEW.parent_comment_id
      UNION ALL
      SELECT thread_id FROM book_club_discussion_comments WHERE id = NEW.parent_comment_id
      UNION ALL
      SELECT thread_id FROM discussion_comments WHERE id = NEW.parent_comment_id
      UNION ALL
      SELECT thread_id FROM comments WHERE id = NEW.parent_comment_id
      UNION ALL
      SELECT thread_id FROM post_comments WHERE id = NEW.parent_comment_id
    ) AS parent_thread;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for thread_id updates
CREATE TRIGGER trigger_update_event_comment_thread_id
  BEFORE INSERT OR UPDATE ON event_comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_thread_id();

CREATE TRIGGER trigger_update_photo_comment_thread_id
  BEFORE INSERT OR UPDATE ON photo_comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_thread_id();

CREATE TRIGGER trigger_update_activity_comment_thread_id
  BEFORE INSERT OR UPDATE ON activity_comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_thread_id();

CREATE TRIGGER trigger_update_book_club_discussion_comment_thread_id
  BEFORE INSERT OR UPDATE ON book_club_discussion_comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_thread_id();

CREATE TRIGGER trigger_update_discussion_comment_thread_id
  BEFORE INSERT OR UPDATE ON discussion_comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_thread_id();

CREATE TRIGGER trigger_update_comment_thread_id
  BEFORE INSERT OR UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_thread_id();

CREATE TRIGGER trigger_update_post_comment_thread_id
  BEFORE INSERT OR UPDATE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_thread_id();

-- Update existing comments to have proper thread_id values
UPDATE event_comments SET thread_id = id WHERE thread_id IS NULL;
UPDATE photo_comments SET thread_id = id WHERE thread_id IS NULL;
UPDATE activity_comments SET thread_id = id WHERE thread_id IS NULL;
UPDATE book_club_discussion_comments SET thread_id = id WHERE thread_id IS NULL;
UPDATE discussion_comments SET thread_id = id WHERE thread_id IS NULL;
UPDATE comments SET thread_id = id WHERE thread_id IS NULL;
UPDATE post_comments SET thread_id = id WHERE thread_id IS NULL;

-- Make thread_id NOT NULL after updating existing records
ALTER TABLE event_comments ALTER COLUMN thread_id SET NOT NULL;
ALTER TABLE photo_comments ALTER COLUMN thread_id SET NOT NULL;
ALTER TABLE activity_comments ALTER COLUMN thread_id SET NOT NULL;
ALTER TABLE book_club_discussion_comments ALTER COLUMN thread_id SET NOT NULL;
ALTER TABLE discussion_comments ALTER COLUMN thread_id SET NOT NULL;
ALTER TABLE comments ALTER COLUMN thread_id SET NOT NULL;
ALTER TABLE post_comments ALTER COLUMN thread_id SET NOT NULL;

-- Add comment count tracking for threads
ALTER TABLE event_comments 
ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

ALTER TABLE photo_comments 
ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

ALTER TABLE activity_comments 
ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

ALTER TABLE book_club_discussion_comments 
ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

ALTER TABLE discussion_comments 
ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

ALTER TABLE post_comments 
ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

-- Create indexes for reply count queries
CREATE INDEX IF NOT EXISTS idx_event_comments_reply_count ON event_comments(reply_count);
CREATE INDEX IF NOT EXISTS idx_photo_comments_reply_count ON photo_comments(reply_count);
CREATE INDEX IF NOT EXISTS idx_activity_comments_reply_count ON activity_comments(reply_count);
CREATE INDEX IF NOT EXISTS idx_book_club_discussion_comments_reply_count ON book_club_discussion_comments(reply_count);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_reply_count ON discussion_comments(reply_count);
CREATE INDEX IF NOT EXISTS idx_comments_reply_count ON comments(reply_count);
CREATE INDEX IF NOT EXISTS idx_post_comments_reply_count ON post_comments(reply_count);

-- Function to update reply counts
CREATE OR REPLACE FUNCTION update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NOT NULL THEN
    -- Increment reply count on parent comment
    UPDATE event_comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_comment_id;
    UPDATE photo_comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_comment_id;
    UPDATE activity_comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_comment_id;
    UPDATE book_club_discussion_comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_comment_id;
    UPDATE discussion_comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_comment_id;
    UPDATE comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_comment_id;
    UPDATE post_comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_comment_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NOT NULL THEN
    -- Decrement reply count on parent comment
    UPDATE event_comments SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.parent_comment_id;
    UPDATE photo_comments SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.parent_comment_id;
    UPDATE activity_comments SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.parent_comment_id;
    UPDATE book_club_discussion_comments SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.parent_comment_id;
    UPDATE discussion_comments SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.parent_comment_id;
    UPDATE comments SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.parent_comment_id;
    UPDATE post_comments SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.parent_comment_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for reply count updates
CREATE TRIGGER trigger_update_event_comment_reply_count
  AFTER INSERT OR DELETE ON event_comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_reply_count();

CREATE TRIGGER trigger_update_photo_comment_reply_count
  AFTER INSERT OR DELETE ON photo_comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_reply_count();

CREATE TRIGGER trigger_update_activity_comment_reply_count
  AFTER INSERT OR DELETE ON activity_comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_reply_count();

CREATE TRIGGER trigger_update_book_club_discussion_comment_reply_count
  AFTER INSERT OR DELETE ON book_club_discussion_comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_reply_count();

CREATE TRIGGER trigger_update_discussion_comment_reply_count
  AFTER INSERT OR DELETE ON discussion_comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_reply_count();

CREATE TRIGGER trigger_update_comment_reply_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_reply_count();

CREATE TRIGGER trigger_update_post_comment_reply_count
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_reply_count();

-- Update existing reply counts
UPDATE event_comments SET reply_count = (
  SELECT COUNT(*) FROM event_comments ec2 WHERE ec2.parent_comment_id = event_comments.id
);
UPDATE photo_comments SET reply_count = (
  SELECT COUNT(*) FROM photo_comments pc2 WHERE pc2.parent_comment_id = photo_comments.id
);
UPDATE activity_comments SET reply_count = (
  SELECT COUNT(*) FROM activity_comments ac2 WHERE ac2.parent_comment_id = activity_comments.id
);
UPDATE book_club_discussion_comments SET reply_count = (
  SELECT COUNT(*) FROM book_club_discussion_comments bcdc2 WHERE bcdc2.parent_comment_id = book_club_discussion_comments.id
);
UPDATE discussion_comments SET reply_count = (
  SELECT COUNT(*) FROM discussion_comments dc2 WHERE dc2.parent_comment_id = discussion_comments.id
);
UPDATE comments SET reply_count = (
  SELECT COUNT(*) FROM comments c2 WHERE c2.parent_comment_id = comments.id
);
UPDATE post_comments SET reply_count = (
  SELECT COUNT(*) FROM post_comments pc2 WHERE pc2.parent_comment_id = post_comments.id
);

COMMENT ON COLUMN event_comments.parent_comment_id IS 'Reference to parent comment for nested replies';
COMMENT ON COLUMN event_comments.comment_depth IS 'Depth level of comment in thread (0 = top level)';
COMMENT ON COLUMN event_comments.thread_id IS 'Unique identifier for comment thread';
COMMENT ON COLUMN event_comments.reply_count IS 'Number of direct replies to this comment';

COMMENT ON COLUMN photo_comments.parent_comment_id IS 'Reference to parent comment for nested replies';
COMMENT ON COLUMN photo_comments.comment_depth IS 'Depth level of comment in thread (0 = top level)';
COMMENT ON COLUMN photo_comments.thread_id IS 'Unique identifier for comment thread';
COMMENT ON COLUMN photo_comments.reply_count IS 'Number of direct replies to this comment';

COMMENT ON COLUMN activity_comments.parent_comment_id IS 'Reference to parent comment for nested replies';
COMMENT ON COLUMN activity_comments.comment_depth IS 'Depth level of comment in thread (0 = top level)';
COMMENT ON COLUMN activity_comments.thread_id IS 'Unique identifier for comment thread';
COMMENT ON COLUMN activity_comments.reply_count IS 'Number of direct replies to this comment';

COMMENT ON COLUMN book_club_discussion_comments.parent_comment_id IS 'Reference to parent comment for nested replies';
COMMENT ON COLUMN book_club_discussion_comments.comment_depth IS 'Depth level of comment in thread (0 = top level)';
COMMENT ON COLUMN book_club_discussion_comments.thread_id IS 'Unique identifier for comment thread';
COMMENT ON COLUMN book_club_discussion_comments.reply_count IS 'Number of direct replies to this comment';

COMMENT ON COLUMN discussion_comments.parent_comment_id IS 'Reference to parent comment for nested replies';
COMMENT ON COLUMN discussion_comments.comment_depth IS 'Depth level of comment in thread (0 = top level)';
COMMENT ON COLUMN discussion_comments.thread_id IS 'Unique identifier for comment thread';
COMMENT ON COLUMN discussion_comments.reply_count IS 'Number of direct replies to this comment';

COMMENT ON COLUMN comments.parent_comment_id IS 'Reference to parent comment for nested replies';
COMMENT ON COLUMN comments.comment_depth IS 'Depth level of comment in thread (0 = top level)';
COMMENT ON COLUMN comments.thread_id IS 'Unique identifier for comment thread';
COMMENT ON COLUMN comments.reply_count IS 'Number of direct replies to this comment';

COMMENT ON COLUMN post_comments.parent_comment_id IS 'Reference to parent comment for nested replies';
COMMENT ON COLUMN post_comments.comment_depth IS 'Depth level of comment in thread (0 = top level)';
COMMENT ON COLUMN post_comments.thread_id IS 'Unique identifier for comment thread';
COMMENT ON COLUMN post_comments.reply_count IS 'Number of direct replies to this comment';
