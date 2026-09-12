CREATE OR REPLACE FUNCTION public.ensure_default_group_chat_channel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_chat_channels (group_id, name, description, is_event_channel, event_id)
  SELECT NEW.id, 'General', 'Group conversation', false, NULL
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.group_chat_channels AS existing
    WHERE existing.group_id = NEW.id
      AND existing.event_id IS NULL
      AND COALESCE(existing.is_event_channel, false) = false
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_default_group_chat_channel_on_group_created ON public.groups;
CREATE TRIGGER ensure_default_group_chat_channel_on_group_created
AFTER INSERT ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.ensure_default_group_chat_channel();

INSERT INTO public.group_chat_channels (group_id, name, description, is_event_channel, event_id)
SELECT groups.id, 'General', 'Group conversation', false, NULL
FROM public.groups
WHERE NOT EXISTS (
  SELECT 1
  FROM public.group_chat_channels AS existing
  WHERE existing.group_id = groups.id
    AND existing.event_id IS NULL
    AND COALESCE(existing.is_event_channel, false) = false
);