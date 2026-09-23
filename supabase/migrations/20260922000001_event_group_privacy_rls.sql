-- Enforce event guest-list and private-group membership privacy in RLS.
-- The application routes retain their richer blocked-user filtering; these policies
-- prevent alternate clients from bypassing the same privacy boundary.

CREATE OR REPLACE FUNCTION public.can_view_event_participants(p_event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.events AS event
    WHERE event.id = p_event_id
      AND (
        event.visibility = 'public'
        OR event.created_by = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.event_participants AS membership
          WHERE membership.event_id = p_event_id
            AND membership.user_id = auth.uid()
            AND membership.rsvp_status <> 'declined'
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_view_event_participants(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_view_event_participants(uuid) TO authenticated;

DROP POLICY IF EXISTS "Anyone can view event participants" ON public.event_participants;
CREATE POLICY event_participants_select_privacy
  ON public.event_participants
  FOR SELECT
  TO anon, authenticated
  USING (public.can_view_event_participants(event_id));

CREATE OR REPLACE FUNCTION public.can_view_group_members(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.groups AS group_record
    WHERE group_record.id = p_group_id
      AND (
        group_record.is_private = false
        OR EXISTS (
          SELECT 1
          FROM public.group_members AS membership
          WHERE membership.group_id = p_group_id
            AND membership.user_id = auth.uid()
            AND membership.status = 'active'
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_view_group_members(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_view_group_members(uuid) TO authenticated;

DROP POLICY IF EXISTS group_members_select_policy ON public.group_members;
CREATE POLICY group_members_select_privacy
  ON public.group_members
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.can_view_group_members(group_id)
  );
