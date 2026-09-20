CREATE TABLE IF NOT EXISTS public.notification_push_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES public.push_subscriptions(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (notification_id, subscription_id)
);

CREATE INDEX IF NOT EXISTS notification_push_outbox_pending_idx
  ON public.notification_push_outbox (available_at, created_at)
  WHERE status IN ('pending', 'failed');

ALTER TABLE public.notification_push_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_push_outbox FROM anon, authenticated, PUBLIC;

CREATE OR REPLACE FUNCTION public.touch_notification_push_outbox_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notification_push_outbox_updated_at ON public.notification_push_outbox;
CREATE TRIGGER notification_push_outbox_updated_at
BEFORE UPDATE ON public.notification_push_outbox
FOR EACH ROW
EXECUTE FUNCTION public.touch_notification_push_outbox_updated_at();
