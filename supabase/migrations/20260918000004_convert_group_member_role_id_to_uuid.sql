DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE role_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION
      'Cannot convert group_members.role_id to uuid: non-null integer role IDs exist';
  END IF;
END
$$;

ALTER TABLE public.group_members
  ALTER COLUMN role_id TYPE uuid
  USING NULL::uuid;

ALTER TABLE public.group_members
  DROP CONSTRAINT IF EXISTS group_members_role_id_fkey;

ALTER TABLE public.group_members
  ADD CONSTRAINT group_members_role_id_fkey
  FOREIGN KEY (role_id) REFERENCES public.group_roles(id) ON DELETE SET NULL;