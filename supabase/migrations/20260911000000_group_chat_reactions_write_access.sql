REVOKE INSERT, UPDATE, DELETE ON public.group_chat_message_reactions FROM anon, PUBLIC;
GRANT INSERT, DELETE ON public.group_chat_message_reactions TO authenticated;

CREATE POLICY group_chat_reaction_member_insert
  ON public.group_chat_message_reactions FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY group_chat_reaction_owner_delete
  ON public.group_chat_message_reactions FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE UNIQUE INDEX IF NOT EXISTS group_chat_message_reactions_unique_actor
  ON public.group_chat_message_reactions (message_id, user_id, reaction);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
    AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
        AND tablename = 'group_chat_message_reactions'
    ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_chat_message_reactions;
  END IF;
END;
$$;