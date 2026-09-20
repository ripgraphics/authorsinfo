CREATE TABLE IF NOT EXISTS public.direct_message_pins (
  message_id uuid PRIMARY KEY REFERENCES public.direct_conversation_messages(id) ON DELETE CASCADE,
  pinned_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.direct_message_pins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.direct_message_pins FROM anon, PUBLIC;
GRANT SELECT, INSERT, DELETE ON public.direct_message_pins TO authenticated;

DROP POLICY IF EXISTS direct_message_pins_participant_select ON public.direct_message_pins;
CREATE POLICY direct_message_pins_participant_select
  ON public.direct_message_pins FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.direct_conversation_messages AS message
    JOIN public.direct_conversations AS conversation ON conversation.id = message.conversation_id
    WHERE message.id = direct_message_pins.message_id
      AND (SELECT auth.uid()) IN (conversation.user_low_id, conversation.user_high_id)
  ));

DROP POLICY IF EXISTS direct_message_pins_participant_insert ON public.direct_message_pins;
CREATE POLICY direct_message_pins_participant_insert
  ON public.direct_message_pins FOR INSERT TO authenticated
  WITH CHECK (
    pinned_by = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.direct_conversation_messages AS message
      JOIN public.direct_conversations AS conversation ON conversation.id = message.conversation_id
      WHERE message.id = direct_message_pins.message_id
        AND (SELECT auth.uid()) IN (conversation.user_low_id, conversation.user_high_id)
    )
  );

DROP POLICY IF EXISTS direct_message_pins_owner_delete ON public.direct_message_pins;
CREATE POLICY direct_message_pins_owner_delete
  ON public.direct_message_pins FOR DELETE TO authenticated
  USING (pinned_by = (SELECT auth.uid()));