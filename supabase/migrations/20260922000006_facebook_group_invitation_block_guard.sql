-- Facebook parity: a group invitation is a direct user interaction and must
-- respect reciprocal blocks, including invitations addressed by email.

DROP POLICY IF EXISTS group_invitations_recipient_insert ON public.group_invitations;
CREATE POLICY group_invitations_recipient_insert
  ON public.group_invitations FOR INSERT TO authenticated
  WITH CHECK (
    inviter_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.group_members AS member
      WHERE member.group_id = group_invitations.group_id
        AND member.user_id = (SELECT auth.uid())
        AND member.status = 'active'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.blocks AS block
      LEFT JOIN public.users AS invitee
        ON invitee.id = group_invitations.invitee_user_id
        OR (
          group_invitations.invitee_email IS NOT NULL
          AND lower(invitee.email) = lower(group_invitations.invitee_email)
        )
      WHERE invitee.id IS NOT NULL
        AND (
          (block.user_id = (SELECT auth.uid()) AND block.blocked_user_id = invitee.id)
          OR (block.blocked_user_id = (SELECT auth.uid()) AND block.user_id = invitee.id)
        )
    )
  );
