ALTER TABLE public.direct_conversation_messages
  ADD COLUMN IF NOT EXISTS mention_user_ids uuid[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS direct_messages_mentions_idx
  ON public.direct_conversation_messages USING gin (mention_user_ids);