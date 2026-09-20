CREATE TABLE IF NOT EXISTS public.group_chat_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.group_chat_messages(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('spam', 'harassment', 'threats', 'hate', 'sexual', 'self_harm', 'other')),
  details text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS group_chat_reports_message_idx
  ON public.group_chat_reports (message_id, created_at DESC);

CREATE INDEX IF NOT EXISTS group_chat_reports_reported_user_idx
  ON public.group_chat_reports (reported_user_id, created_at DESC);

ALTER TABLE public.group_chat_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.group_chat_reports FROM anon, PUBLIC;
GRANT SELECT, INSERT ON public.group_chat_reports TO authenticated;

DROP POLICY IF EXISTS group_chat_reports_select_own ON public.group_chat_reports;
CREATE POLICY group_chat_reports_select_own
  ON public.group_chat_reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

DROP POLICY IF EXISTS group_chat_reports_insert_member ON public.group_chat_reports;
CREATE POLICY group_chat_reports_insert_member
  ON public.group_chat_reports FOR INSERT TO authenticated
  WITH CHECK (
    reporter_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.group_chat_messages message
      JOIN public.group_chat_channels channel ON channel.id = message.channel_id
      JOIN public.group_members member ON member.group_id = channel.group_id
      WHERE message.id = group_chat_reports.message_id
        AND member.user_id = auth.uid()
        AND member.status = 'active'
        AND (channel.is_event_channel IS NULL OR channel.is_event_channel = false)
        AND channel.event_id IS NULL
    )
  );
