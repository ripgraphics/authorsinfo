ALTER TABLE public.group_chat_channels
  ADD COLUMN IF NOT EXISTS history_policy text NOT NULL DEFAULT 'retained_moderated';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'group_chat_channels_history_policy_check'
      AND conrelid = 'public.group_chat_channels'::regclass
  ) THEN
    ALTER TABLE public.group_chat_channels
      ADD CONSTRAINT group_chat_channels_history_policy_check
      CHECK (history_policy IN ('retained_moderated'));
  END IF;
END $$;

COMMENT ON COLUMN public.group_chat_channels.history_policy IS
  'Durable history policy for Messenger group channels. Current supported policy is retained_moderated.';
