-- Make blocking durable at the database boundary.
-- Application routes provide richer UX; these constraints/policies prevent bypasses.

CREATE UNIQUE INDEX IF NOT EXISTS blocks_user_blocked_user_unique
  ON public.blocks (user_id, blocked_user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'blocks_cannot_self_block'
      AND conrelid = 'public.blocks'::regclass
  ) THEN
    ALTER TABLE public.blocks
      ADD CONSTRAINT blocks_cannot_self_block
      CHECK (user_id <> blocked_user_id);
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.is_blocked_between(p_user_a uuid, p_user_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.blocks AS block
    WHERE (block.user_id = p_user_a AND block.blocked_user_id = p_user_b)
       OR (block.user_id = p_user_b AND block.blocked_user_id = p_user_a)
  );
$$;

REVOKE ALL ON FUNCTION public.is_blocked_between(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_blocked_between(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS direct_conversation_participant_access ON public.direct_conversations;
CREATE POLICY direct_conversation_participant_access
  ON public.direct_conversations FOR ALL TO authenticated
  USING (
    (SELECT auth.uid()) IN (user_low_id, user_high_id)
    AND NOT public.is_blocked_between(user_low_id, user_high_id)
  )
  WITH CHECK (
    (SELECT auth.uid()) IN (user_low_id, user_high_id)
    AND NOT public.is_blocked_between(user_low_id, user_high_id)
  );

DROP POLICY IF EXISTS direct_message_participant_access ON public.direct_conversation_messages;
CREATE POLICY direct_message_participant_access
  ON public.direct_conversation_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.direct_conversations AS conversation
    WHERE conversation.id = direct_conversation_messages.conversation_id
      AND (SELECT auth.uid()) IN (conversation.user_low_id, conversation.user_high_id)
      AND NOT public.is_blocked_between(conversation.user_low_id, conversation.user_high_id)
  ));

DROP POLICY IF EXISTS direct_message_sender_insert ON public.direct_conversation_messages;
CREATE POLICY direct_message_sender_insert
  ON public.direct_conversation_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.direct_conversations AS conversation
      WHERE conversation.id = direct_conversation_messages.conversation_id
        AND (SELECT auth.uid()) IN (conversation.user_low_id, conversation.user_high_id)
        AND NOT public.is_blocked_between(conversation.user_low_id, conversation.user_high_id)
    )
  );

DROP POLICY IF EXISTS direct_read_state_participant_select ON public.direct_conversation_read_state;
CREATE POLICY direct_read_state_participant_select
  ON public.direct_conversation_read_state FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.direct_conversations AS conversation
    WHERE conversation.id = direct_conversation_read_state.conversation_id
      AND (SELECT auth.uid()) IN (conversation.user_low_id, conversation.user_high_id)
      AND NOT public.is_blocked_between(conversation.user_low_id, conversation.user_high_id)
  ));
