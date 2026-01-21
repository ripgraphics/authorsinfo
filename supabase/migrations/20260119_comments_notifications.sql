-- Migration: Add notifications integration for comments (replies/mentions)
-- Date: 2026-01-19

-- Example: Add a trigger to notify users on replies or mentions
CREATE OR REPLACE FUNCTION notify_on_comment_reply() RETURNS trigger AS $$
DECLARE
    parent_user_id UUID;
BEGIN
    IF NEW.parent_id IS NOT NULL THEN
        SELECT user_id INTO parent_user_id FROM comments WHERE id = NEW.parent_id;
        IF parent_user_id IS NOT NULL AND parent_user_id <> NEW.user_id THEN
            INSERT INTO notifications (user_id, type, entity_id, entity_type, data, created_at)
            VALUES (parent_user_id, 'comment_reply', NEW.id, 'comment', jsonb_build_object('reply_by', NEW.user_id), now());
        END IF;
    END IF;
    -- Mentions logic can be added here (parse NEW.content for @username, etc.)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_on_comment_reply ON comments;
CREATE TRIGGER trg_notify_on_comment_reply
AFTER INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION notify_on_comment_reply();

-- Note: Ensure a notifications table exists with appropriate columns.
