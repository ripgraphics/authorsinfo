-- Only event creators may assign/remove event participant roles.

DROP POLICY IF EXISTS event_participants_creator_role_update ON public.event_participants;
CREATE POLICY event_participants_creator_role_update
  ON public.event_participants
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.events AS event
      WHERE event.id = event_participants.event_id
        AND event.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.events AS event
      WHERE event.id = event_participants.event_id
        AND event.created_by = auth.uid()
    )
  );
