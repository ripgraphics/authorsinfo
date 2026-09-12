CREATE TABLE IF NOT EXISTS public.direct_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_low_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_high_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz,
  CONSTRAINT direct_conversations_distinct_users CHECK (user_low_id <> user_high_id),
  CONSTRAINT direct_conversations_ordered_users CHECK (user_low_id < user_high_id),
  CONSTRAINT direct_conversations_unique_pair UNIQUE (user_low_id, user_high_id)
);

CREATE TABLE IF NOT EXISTS public.direct_conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.direct_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  CONSTRAINT direct_messages_body_length CHECK (char_length(btrim(body)) BETWEEN 1 AND 10000)
);

CREATE TABLE IF NOT EXISTS public.direct_conversation_read_state (
  conversation_id uuid NOT NULL REFERENCES public.direct_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_message_id uuid REFERENCES public.direct_conversation_messages(id) ON DELETE SET NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.direct_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.direct_conversation_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT direct_message_reaction_length CHECK (char_length(btrim(reaction)) BETWEEN 1 AND 32),
  CONSTRAINT direct_message_reaction_unique UNIQUE (message_id, user_id, reaction)
);

CREATE INDEX IF NOT EXISTS direct_messages_conversation_history_idx
  ON public.direct_conversation_messages (conversation_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS direct_conversations_recent_idx
  ON public.direct_conversations (last_message_at DESC NULLS LAST, id DESC);
CREATE INDEX IF NOT EXISTS direct_message_reactions_message_idx
  ON public.direct_message_reactions (message_id, created_at DESC);

-- Full-text search index for direct message bodies
CREATE INDEX IF NOT EXISTS direct_messages_body_search_idx
  ON public.direct_conversation_messages
  USING gin (to_tsvector('english', body));

-- Private message attachments
CREATE TABLE IF NOT EXISTS public.direct_message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.direct_conversation_messages(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT direct_attachment_filename_length CHECK (char_length(btrim(file_name)) BETWEEN 1 AND 255),
  CONSTRAINT direct_attachment_mime_length CHECK (char_length(btrim(mime_type)) BETWEEN 1 AND 127)
);

CREATE INDEX IF NOT EXISTS direct_message_attachments_message_idx
  ON public.direct_message_attachments (message_id, created_at DESC);

ALTER TABLE public.direct_message_attachments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.direct_message_attachments FROM anon, PUBLIC;
GRANT SELECT, INSERT, DELETE ON public.direct_message_attachments TO authenticated;

DROP POLICY IF EXISTS direct_attachment_participant_access ON public.direct_message_attachments;
CREATE POLICY direct_attachment_participant_access
  ON public.direct_message_attachments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.direct_conversation_messages AS message
    JOIN public.direct_conversations AS conversation ON conversation.id = message.conversation_id
    WHERE message.id = direct_message_attachments.message_id
      AND (SELECT auth.uid()) IN (conversation.user_low_id, conversation.user_high_id)
  ));

DROP POLICY IF EXISTS direct_attachment_participant_insert ON public.direct_message_attachments;
CREATE POLICY direct_attachment_participant_insert
  ON public.direct_message_attachments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.direct_conversation_messages AS message
    JOIN public.direct_conversations AS conversation ON conversation.id = message.conversation_id
    WHERE message.id = direct_message_attachments.message_id
      AND (SELECT auth.uid()) IN (conversation.user_low_id, conversation.user_high_id)
  ));

DROP POLICY IF EXISTS direct_attachment_participant_delete ON public.direct_message_attachments;
CREATE POLICY direct_attachment_participant_delete
  ON public.direct_message_attachments FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.direct_conversation_messages AS message
    JOIN public.direct_conversations AS conversation ON conversation.id = message.conversation_id
    WHERE message.id = direct_message_attachments.message_id
      AND (SELECT auth.uid()) IN (conversation.user_low_id, conversation.user_high_id)
  ));

-- Private storage bucket for direct message attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('direct-message-attachments', 'direct-message-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: only conversation participants can read/write their conversation's files
DROP POLICY IF EXISTS direct_attachment_storage_read ON storage.objects;
CREATE POLICY direct_attachment_storage_read
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'direct-message-attachments'
    AND EXISTS (
      SELECT 1
      FROM public.direct_conversations AS conversation
      WHERE (storage.foldername(name))[1] = conversation.id::text
        AND (SELECT auth.uid()) IN (conversation.user_low_id, conversation.user_high_id)
    )
  );

DROP POLICY IF EXISTS direct_attachment_storage_write ON storage.objects;
CREATE POLICY direct_attachment_storage_write
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'direct-message-attachments'
    AND EXISTS (
      SELECT 1
      FROM public.direct_conversations AS conversation
      WHERE (storage.foldername(name))[1] = conversation.id::text
        AND (SELECT auth.uid()) IN (conversation.user_low_id, conversation.user_high_id)
    )
  );

-- Direct message abuse reports
CREATE TABLE IF NOT EXISTS public.direct_message_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.direct_conversation_messages(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT direct_report_reason_length CHECK (char_length(btrim(reason)) BETWEEN 1 AND 500),
  CONSTRAINT direct_report_unique UNIQUE (message_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS direct_message_reports_reported_user_idx
  ON public.direct_message_reports (reported_user_id, created_at DESC);

ALTER TABLE public.direct_message_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.direct_message_reports FROM anon, PUBLIC;
GRANT SELECT, INSERT ON public.direct_message_reports TO authenticated;

DROP POLICY IF EXISTS direct_report_reporter_access ON public.direct_message_reports;
CREATE POLICY direct_report_reporter_access
  ON public.direct_message_reports FOR SELECT TO authenticated
  USING (reporter_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS direct_report_reporter_insert ON public.direct_message_reports;
CREATE POLICY direct_report_reporter_insert
  ON public.direct_message_reports FOR INSERT TO authenticated
  WITH CHECK (
    reporter_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.direct_conversation_messages AS message
      JOIN public.direct_conversations AS conversation ON conversation.id = message.conversation_id
      WHERE message.id = direct_message_reports.message_id
        AND (SELECT auth.uid()) IN (conversation.user_low_id, conversation.user_high_id)
    )
  );

CREATE OR REPLACE FUNCTION public.update_direct_conversation_last_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.direct_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS direct_conversation_message_recency ON public.direct_conversation_messages;
CREATE TRIGGER direct_conversation_message_recency
AFTER INSERT ON public.direct_conversation_messages
FOR EACH ROW EXECUTE FUNCTION public.update_direct_conversation_last_message();

ALTER TABLE public.direct_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_conversation_read_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_message_reactions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.direct_conversations, public.direct_conversation_messages,
  public.direct_conversation_read_state FROM anon, PUBLIC;
REVOKE ALL ON public.direct_message_reactions FROM anon, PUBLIC;
GRANT SELECT, INSERT ON public.direct_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.direct_conversation_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.direct_conversation_read_state TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.direct_message_reactions TO authenticated;

DROP POLICY IF EXISTS direct_conversation_participant_access ON public.direct_conversations;
CREATE POLICY direct_conversation_participant_access
  ON public.direct_conversations FOR ALL TO authenticated
  USING ((SELECT auth.uid()) IN (user_low_id, user_high_id))
  WITH CHECK ((SELECT auth.uid()) IN (user_low_id, user_high_id));

DROP POLICY IF EXISTS direct_message_participant_access ON public.direct_conversation_messages;
CREATE POLICY direct_message_participant_access
  ON public.direct_conversation_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.direct_conversations AS conversation
    WHERE conversation.id = direct_conversation_messages.conversation_id
      AND (SELECT auth.uid()) IN (conversation.user_low_id, conversation.user_high_id)
  ));

DROP POLICY IF EXISTS direct_message_sender_insert ON public.direct_conversation_messages;
CREATE POLICY direct_message_sender_insert
  ON public.direct_conversation_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.direct_conversations AS conversation
      WHERE conversation.id = direct_conversation_messages.conversation_id
        AND (SELECT auth.uid()) IN (conversation.user_low_id, conversation.user_high_id)
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.blocks AS block
      JOIN public.direct_conversations AS conversation
        ON conversation.id = direct_conversation_messages.conversation_id
      WHERE (block.user_id = (SELECT auth.uid()) AND block.blocked_user_id IN (conversation.user_low_id, conversation.user_high_id))
         OR (block.blocked_user_id = (SELECT auth.uid()) AND block.user_id IN (conversation.user_low_id, conversation.user_high_id))
    )
  );

DROP POLICY IF EXISTS direct_message_sender_update ON public.direct_conversation_messages;
CREATE POLICY direct_message_sender_update
  ON public.direct_conversation_messages FOR UPDATE TO authenticated
  USING (sender_id = (SELECT auth.uid()))
  WITH CHECK (sender_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS direct_read_state_owner_access ON public.direct_conversation_read_state;
DROP POLICY IF EXISTS direct_read_state_participant_select ON public.direct_conversation_read_state;
CREATE POLICY direct_read_state_participant_select
  ON public.direct_conversation_read_state FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.direct_conversations AS conversation
      WHERE conversation.id = direct_conversation_read_state.conversation_id
        AND (SELECT auth.uid()) IN (conversation.user_low_id, conversation.user_high_id)
    )
  );

DROP POLICY IF EXISTS direct_read_state_owner_write ON public.direct_conversation_read_state;
CREATE POLICY direct_read_state_owner_write
  ON public.direct_conversation_read_state FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.direct_conversations AS conversation
      WHERE conversation.id = direct_conversation_read_state.conversation_id
        AND (SELECT auth.uid()) IN (conversation.user_low_id, conversation.user_high_id)
    )
  );

DROP POLICY IF EXISTS direct_read_state_owner_update ON public.direct_conversation_read_state;
CREATE POLICY direct_read_state_owner_update
  ON public.direct_conversation_read_state FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
  )
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS direct_read_state_owner_delete ON public.direct_conversation_read_state;
CREATE POLICY direct_read_state_owner_delete
  ON public.direct_conversation_read_state FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS direct_reaction_participant_access ON public.direct_message_reactions;
CREATE POLICY direct_reaction_participant_access
  ON public.direct_message_reactions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.direct_conversation_messages AS message
    JOIN public.direct_conversations AS conversation ON conversation.id = message.conversation_id
    WHERE message.id = direct_message_reactions.message_id
      AND (SELECT auth.uid()) IN (conversation.user_low_id, conversation.user_high_id)
  ));

DROP POLICY IF EXISTS direct_reaction_owner_insert ON public.direct_message_reactions;
CREATE POLICY direct_reaction_owner_insert
  ON public.direct_message_reactions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.direct_conversation_messages AS message
      JOIN public.direct_conversations AS conversation ON conversation.id = message.conversation_id
      WHERE message.id = direct_message_reactions.message_id
        AND (SELECT auth.uid()) IN (conversation.user_low_id, conversation.user_high_id)
    )
  );

DROP POLICY IF EXISTS direct_reaction_owner_delete ON public.direct_message_reactions;
CREATE POLICY direct_reaction_owner_delete
  ON public.direct_message_reactions FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
    AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
        AND tablename = 'direct_conversation_messages'
    ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_conversation_messages;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
    AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
        AND tablename = 'direct_message_reactions'
    ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_message_reactions;
  END IF;
END;
$$;