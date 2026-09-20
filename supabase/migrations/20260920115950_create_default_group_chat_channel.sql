CREATE OR REPLACE FUNCTION public.create_default_group_chat_channel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_chat_channels (
    group_id,
    name,
    description,
    is_event_channel,
    event_id
  )
  SELECT
    NEW.id,
    'General',
    'The default Messenger channel for this group.',
    false,
    NULL
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.group_chat_channels
    WHERE group_id = NEW.id
      AND event_id IS NULL
      AND (is_event_channel IS NULL OR is_event_channel = false)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS groups_create_default_group_chat_channel ON public.groups;

CREATE TRIGGER groups_create_default_group_chat_channel
AFTER INSERT ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.create_default_group_chat_channel();

COMMENT ON FUNCTION public.create_default_group_chat_channel() IS
  'Creates one retained, non-event General Messenger channel for each newly created group.';
