CREATE TABLE IF NOT EXISTS public.group_conversation_settings (
  channel_id uuid NOT NULL REFERENCES public.group_chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_archived boolean NOT NULL DEFAULT false,
  is_muted boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, user_id)
);

ALTER TABLE public.group_conversation_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.group_conversation_settings FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_conversation_settings TO authenticated;

DROP POLICY IF EXISTS group_conversation_settings_member_access
  ON public.group_conversation_settings;
CREATE POLICY group_conversation_settings_member_access
  ON public.group_conversation_settings FOR ALL TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.group_chat_channels AS channel
      JOIN public.group_members AS member ON member.group_id = channel.group_id
      WHERE channel.id = group_conversation_settings.channel_id
        AND member.user_id = (SELECT auth.uid())
        AND member.status = 'active'
        AND channel.event_id IS NULL
        AND COALESCE(channel.is_event_channel, false) = false
    )
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.group_chat_channels AS channel
      JOIN public.group_members AS member ON member.group_id = channel.group_id
      WHERE channel.id = group_conversation_settings.channel_id
        AND member.user_id = (SELECT auth.uid())
        AND member.status = 'active'
        AND channel.event_id IS NULL
        AND COALESCE(channel.is_event_channel, false) = false
    )
  );

CREATE INDEX IF NOT EXISTS group_conversation_settings_user_idx
  ON public.group_conversation_settings (user_id, updated_at DESC);
