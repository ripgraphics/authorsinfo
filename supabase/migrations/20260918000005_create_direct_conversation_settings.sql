CREATE TABLE IF NOT EXISTS public.direct_conversation_settings (
  conversation_id uuid NOT NULL REFERENCES public.direct_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_archived boolean NOT NULL DEFAULT false,
  is_muted boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

ALTER TABLE public.direct_conversation_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.direct_conversation_settings FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.direct_conversation_settings TO authenticated;

DROP POLICY IF EXISTS direct_conversation_settings_owner_access
  ON public.direct_conversation_settings;
CREATE POLICY direct_conversation_settings_owner_access
  ON public.direct_conversation_settings FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.direct_conversations AS conversation
      WHERE conversation.id = direct_conversation_settings.conversation_id
        AND (SELECT auth.uid()) IN (conversation.user_low_id, conversation.user_high_id)
    )
  );