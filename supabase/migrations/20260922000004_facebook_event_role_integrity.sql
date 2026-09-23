-- Facebook parity: participants may update RSVP state, but cannot self-promote
-- to host, co-host, speaker, or moderator through a direct database client.

CREATE OR REPLACE FUNCTION public.can_update_event_participant_role(
  p_participant_id uuid,
  p_user_id uuid,
  p_role text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_participants AS participant
    WHERE participant.id = p_participant_id
      AND participant.user_id = p_user_id
      AND participant.role = p_role
  );
$$;

REVOKE ALL ON FUNCTION public.can_update_event_participant_role(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_update_event_participant_role(uuid, uuid, text) TO authenticated;

DROP POLICY IF EXISTS "Users can update their own RSVP" ON public.event_participants;
CREATE POLICY event_participants_update_rsvp_only
  ON public.event_participants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND public.can_update_event_participant_role(id, auth.uid(), role)
  );
