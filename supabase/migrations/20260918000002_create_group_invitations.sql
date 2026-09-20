CREATE TABLE IF NOT EXISTS public.group_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email text,
  invitee_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES public.group_roles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  message text,
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT group_invitations_recipient_check
    CHECK (invitee_email IS NOT NULL OR invitee_user_id IS NOT NULL),
  CONSTRAINT group_invitations_status_check
    CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'expired'))
);

CREATE INDEX IF NOT EXISTS group_invitations_user_status_idx
  ON public.group_invitations (invitee_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS group_invitations_email_status_idx
  ON public.group_invitations (invitee_email, status, created_at DESC);
CREATE INDEX IF NOT EXISTS group_invitations_group_status_idx
  ON public.group_invitations (group_id, status, created_at DESC);

ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.group_invitations FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.group_invitations TO authenticated;

DROP POLICY IF EXISTS group_invitations_recipient_select ON public.group_invitations;
CREATE POLICY group_invitations_recipient_select
  ON public.group_invitations FOR SELECT TO authenticated
  USING (
    invitee_user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM auth.users AS account
      WHERE account.id = (SELECT auth.uid())
        AND lower(account.email) = lower(group_invitations.invitee_email)
    )
    OR EXISTS (
      SELECT 1 FROM public.group_members AS member
      WHERE member.group_id = group_invitations.group_id
        AND member.user_id = (SELECT auth.uid())
        AND member.status = 'active'
    )
  );

DROP POLICY IF EXISTS group_invitations_recipient_insert ON public.group_invitations;
CREATE POLICY group_invitations_recipient_insert
  ON public.group_invitations FOR INSERT TO authenticated
  WITH CHECK (
    inviter_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.group_members AS member
      WHERE member.group_id = group_invitations.group_id
        AND member.user_id = (SELECT auth.uid())
        AND member.status = 'active'
    )
  );

DROP POLICY IF EXISTS group_invitations_recipient_update ON public.group_invitations;
CREATE POLICY group_invitations_recipient_update
  ON public.group_invitations FOR UPDATE TO authenticated
  USING (
    invitee_user_id = (SELECT auth.uid())
    OR inviter_id = (SELECT auth.uid())
  )
  WITH CHECK (
    invitee_user_id = (SELECT auth.uid())
    OR inviter_id = (SELECT auth.uid())
  );