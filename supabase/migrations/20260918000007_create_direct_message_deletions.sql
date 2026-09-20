CREATE TABLE IF NOT EXISTS public.direct_message_deletions (
  message_id uuid NOT NULL REFERENCES public.direct_conversation_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

ALTER TABLE public.direct_message_deletions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.direct_message_deletions FROM anon, PUBLIC;
GRANT SELECT, INSERT, DELETE ON public.direct_message_deletions TO authenticated;

DROP POLICY IF EXISTS direct_message_deletions_owner_access ON public.direct_message_deletions;
CREATE POLICY direct_message_deletions_owner_access
  ON public.direct_message_deletions FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.direct_conversation_messages AS message
      JOIN public.direct_conversations AS conversation ON conversation.id = message.conversation_id
      WHERE message.id = direct_message_deletions.message_id
        AND (SELECT auth.uid()) IN (conversation.user_low_id, conversation.user_high_id)
    )
  );