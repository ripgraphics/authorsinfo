ALTER TABLE public.group_chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_chat_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_chat_message_reactions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.group_chat_channels, public.group_chat_messages,
  public.group_chat_message_attachments, public.group_chat_message_reactions
  FROM anon, PUBLIC;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.group_chat_channels,
  public.group_chat_messages, public.group_chat_message_attachments,
  public.group_chat_message_reactions FROM authenticated;
GRANT SELECT ON public.group_chat_channels, public.group_chat_messages,
  public.group_chat_message_attachments, public.group_chat_message_reactions
  TO authenticated;
GRANT INSERT ON public.group_chat_messages TO authenticated;

CREATE POLICY group_chat_channel_membership_guard
  ON public.group_chat_channels AS RESTRICTIVE FOR ALL TO PUBLIC
  USING (
    event_id IS NULL AND COALESCE(is_event_channel, false) = false
    AND EXISTS (
      SELECT 1 FROM public.group_members AS membership
      WHERE membership.group_id = group_chat_channels.group_id
        AND membership.user_id = (SELECT auth.uid())
        AND membership.status = 'active'
    )
  );

CREATE POLICY group_chat_message_membership_guard
  ON public.group_chat_messages AS RESTRICTIVE FOR ALL TO PUBLIC
  USING (
    COALESCE(is_hidden, false) = false
    AND EXISTS (
      SELECT 1 FROM public.group_chat_channels AS channel
      WHERE channel.id = group_chat_messages.channel_id
    )
  );

CREATE POLICY group_chat_message_sender_guard
  ON public.group_chat_messages AS RESTRICTIVE FOR INSERT TO PUBLIC
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND is_hidden = false
    AND char_length(btrim(message)) BETWEEN 1 AND 10000
  );

CREATE POLICY group_chat_message_member_insert
  ON public.group_chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.group_chat_channels AS channel
      WHERE channel.id = group_chat_messages.channel_id
    )
  );

CREATE POLICY group_chat_attachment_membership_guard
  ON public.group_chat_message_attachments AS RESTRICTIVE FOR ALL TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM public.group_chat_messages AS message
      WHERE message.id = group_chat_message_attachments.message_id
    )
  );

CREATE POLICY group_chat_reaction_membership_guard
  ON public.group_chat_message_reactions AS RESTRICTIVE FOR ALL TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM public.group_chat_messages AS message
      WHERE message.id = group_chat_message_reactions.message_id
    )
  );

CREATE INDEX IF NOT EXISTS group_chat_messages_channel_history_idx
  ON public.group_chat_messages (channel_id, created_at DESC NULLS LAST, id DESC);
CREATE INDEX IF NOT EXISTS group_chat_channels_group_idx
  ON public.group_chat_channels (group_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
    AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
        AND tablename = 'group_chat_messages'
    ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_chat_messages;
  END IF;
END;
$$;