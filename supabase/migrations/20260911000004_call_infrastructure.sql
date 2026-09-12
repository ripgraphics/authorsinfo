-- Voice/video call infrastructure: admin-configurable providers, call sessions, and participants.
-- Calls remain disabled until an admin configures TURN/STUN and signaling server details.

CREATE TABLE IF NOT EXISTS public.call_provider_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL,
  setting_value text,
  is_secret boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT call_provider_config_key_length CHECK (char_length(setting_key) BETWEEN 1 AND 100),
  CONSTRAINT call_provider_config_unique_key UNIQUE (setting_key)
);

INSERT INTO public.call_provider_config (setting_key, setting_value, is_secret) VALUES
  ('turn_provider', NULL, false),
  ('turn_url', NULL, false),
  ('turn_username', NULL, false),
  ('turn_credential', NULL, true),
  ('stun_url', NULL, false),
  ('signaling_server_url', NULL, false),
  ('signaling_auth_token', NULL, true),
  ('calls_enabled', 'false', false)
ON CONFLICT (setting_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.call_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.direct_conversations(id) ON DELETE CASCADE,
  initiator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type text NOT NULL DEFAULT 'audio' CHECK (media_type IN ('audio', 'video')),
  status text NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing', 'accepted', 'declined', 'ended', 'missed', 'failed')),
  started_at timestamptz,
  ended_at timestamptz,
  end_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT call_sessions_end_reason_length CHECK (end_reason IS NULL OR char_length(end_reason) <= 100)
);

CREATE INDEX IF NOT EXISTS call_sessions_conversation_idx
  ON public.call_sessions (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS call_sessions_participant_idx
  ON public.call_sessions (initiator_id, recipient_id, created_at DESC);

ALTER TABLE public.call_provider_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.call_provider_config, public.call_sessions FROM anon, PUBLIC;
GRANT SELECT ON public.call_provider_config TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.call_sessions TO authenticated;

-- Admin-only write access to provider configuration
DROP POLICY IF EXISTS call_config_admin_write ON public.call_provider_config;
CREATE POLICY call_config_admin_write
  ON public.call_provider_config FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS profile
      WHERE profile.user_id = (SELECT auth.uid())
        AND profile.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles AS profile
      WHERE profile.user_id = (SELECT auth.uid())
        AND profile.role IN ('admin', 'super_admin')
    )
  );

-- Call sessions visible only to their participants
DROP POLICY IF EXISTS call_sessions_participant_access ON public.call_sessions;
CREATE POLICY call_sessions_participant_access
  ON public.call_sessions FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IN (initiator_id, recipient_id));

DROP POLICY IF EXISTS call_sessions_initiator_insert ON public.call_sessions;
CREATE POLICY call_sessions_initiator_insert
  ON public.call_sessions FOR INSERT TO authenticated
  WITH CHECK (
    initiator_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.direct_conversations AS conversation
      WHERE conversation.id = call_sessions.conversation_id
        AND (SELECT auth.uid()) IN (conversation.user_low_id, conversation.user_high_id)
    )
  );

DROP POLICY IF EXISTS call_sessions_participant_update ON public.call_sessions;
CREATE POLICY call_sessions_participant_update
  ON public.call_sessions FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) IN (initiator_id, recipient_id))
  WITH CHECK ((SELECT auth.uid()) IN (initiator_id, recipient_id));
