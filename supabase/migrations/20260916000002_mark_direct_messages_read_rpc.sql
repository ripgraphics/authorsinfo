CREATE OR REPLACE FUNCTION public.mark_direct_messages_read(
  target_conversation_id uuid,
  target_message_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reader_id uuid := auth.uid();
  cursor_created_at timestamptz;
BEGIN
  IF reader_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.direct_conversations AS conversation
    WHERE conversation.id = target_conversation_id
      AND reader_id IN (conversation.user_low_id, conversation.user_high_id)
  ) THEN
    RAISE EXCEPTION 'Conversation access denied';
  END IF;

  SELECT message.created_at
  INTO cursor_created_at
  FROM public.direct_conversation_messages AS message
  WHERE message.id = target_message_id
    AND message.conversation_id = target_conversation_id;

  IF cursor_created_at IS NULL THEN
    RAISE EXCEPTION 'Read message not found';
  END IF;

  UPDATE public.direct_conversation_messages
  SET read_at = now(),
      read_by = reader_id
  WHERE conversation_id = target_conversation_id
    AND created_at <= cursor_created_at
    AND sender_id <> reader_id;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_direct_messages_read(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_direct_messages_read(uuid, uuid) TO authenticated;
