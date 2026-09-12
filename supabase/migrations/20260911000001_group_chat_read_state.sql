CREATE TABLE IF NOT EXISTS public.group_chat_channel_read_state (
  channel_id UUID NOT NULL,
  user_id UUID NOT NULL,
  last_read_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, user_id)
);

ALTER TABLE public.group_chat_channel_read_state ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.group_chat_channel_read_state FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.group_chat_channel_read_state TO authenticated;

CREATE POLICY group_chat_read_state_owner_access
  ON public.group_chat_channel_read_state AS RESTRICTIVE FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS group_chat_read_state_user_idx
  ON public.group_chat_channel_read_state (user_id, updated_at DESC);