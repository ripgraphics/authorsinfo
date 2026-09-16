ALTER TABLE public.direct_conversation_messages
  ADD COLUMN IF NOT EXISTS read_at timestamptz,
  ADD COLUMN IF NOT EXISTS read_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS direct_messages_read_lookup_idx
  ON public.direct_conversation_messages (conversation_id, read_by, read_at DESC);

-- Existing messages predate per-message read tracking. Mark them as read by
-- the other participant at their creation time so the current application has
-- a complete usable state without claiming a later viewing time.
UPDATE public.direct_conversation_messages AS message
SET read_at = message.created_at,
    read_by = CASE
      WHEN conversation.user_low_id = message.sender_id THEN conversation.user_high_id
      ELSE conversation.user_low_id
    END
FROM public.direct_conversations AS conversation
WHERE conversation.id = message.conversation_id
  AND message.read_at IS NULL;
