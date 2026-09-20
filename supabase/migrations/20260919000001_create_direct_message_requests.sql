CREATE TABLE IF NOT EXISTS public.direct_message_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL UNIQUE REFERENCES public.direct_conversations(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT direct_message_requests_distinct_users CHECK (requester_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS direct_message_requests_recipient_status_idx
  ON public.direct_message_requests (recipient_id, status, created_at DESC);

ALTER TABLE public.direct_message_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.direct_message_requests FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.direct_message_requests TO authenticated;

DROP POLICY IF EXISTS direct_message_requests_participant_access ON public.direct_message_requests;
CREATE POLICY direct_message_requests_participant_access
  ON public.direct_message_requests FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IN (requester_id, recipient_id));

DROP POLICY IF EXISTS direct_message_requests_requester_insert ON public.direct_message_requests;
CREATE POLICY direct_message_requests_requester_insert
  ON public.direct_message_requests FOR INSERT TO authenticated
  WITH CHECK (
    requester_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.direct_conversations AS conversation
      WHERE conversation.id = direct_message_requests.conversation_id
        AND conversation.user_low_id = LEAST(requester_id, recipient_id)
        AND conversation.user_high_id = GREATEST(requester_id, recipient_id)
    )
  );

DROP POLICY IF EXISTS direct_message_requests_participant_update ON public.direct_message_requests;
CREATE POLICY direct_message_requests_participant_update
  ON public.direct_message_requests FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) IN (requester_id, recipient_id))
  WITH CHECK ((SELECT auth.uid()) IN (requester_id, recipient_id));
