DROP POLICY IF EXISTS group_invitations_recipient_select ON public.group_invitations;

CREATE POLICY group_invitations_recipient_select
  ON public.group_invitations FOR SELECT TO authenticated
  USING (
    invitee_user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.group_members AS member
      WHERE member.group_id = group_invitations.group_id
        AND member.user_id = (SELECT auth.uid())
        AND member.status = 'active'
    )
  );