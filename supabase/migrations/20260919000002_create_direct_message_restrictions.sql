CREATE TABLE IF NOT EXISTS public.direct_message_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restricted_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT direct_message_restrictions_distinct_users CHECK (user_id <> restricted_user_id),
  CONSTRAINT direct_message_restrictions_unique UNIQUE (user_id, restricted_user_id)
);

CREATE INDEX IF NOT EXISTS direct_message_restrictions_user_idx
  ON public.direct_message_restrictions (user_id, restricted_user_id);

ALTER TABLE public.direct_message_restrictions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.direct_message_restrictions FROM anon, PUBLIC;
GRANT SELECT, INSERT, DELETE ON public.direct_message_restrictions TO authenticated;

DROP POLICY IF EXISTS direct_message_restrictions_owner_access ON public.direct_message_restrictions;
CREATE POLICY direct_message_restrictions_owner_access
  ON public.direct_message_restrictions FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
