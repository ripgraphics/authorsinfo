-- Event registration records are private attendee data.
-- Guests, answers, tickets, and registration metadata must not be public.

DROP POLICY IF EXISTS "Allow public read" ON public.event_registrations;
DROP POLICY IF EXISTS event_registrations_select_private ON public.event_registrations;
CREATE POLICY event_registrations_select_private
  ON public.event_registrations
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.events AS event
      WHERE event.id = event_registrations.event_id
        AND event.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS event_registrations_insert_owner ON public.event_registrations;
CREATE POLICY event_registrations_insert_owner
  ON public.event_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS event_registrations_update_owner ON public.event_registrations;
CREATE POLICY event_registrations_update_owner
  ON public.event_registrations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
