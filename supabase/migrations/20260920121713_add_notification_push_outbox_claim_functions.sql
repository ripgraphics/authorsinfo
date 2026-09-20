CREATE OR REPLACE FUNCTION public.claim_notification_push_jobs(p_limit integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  notification_id uuid,
  recipient_id uuid,
  subscription_id uuid,
  device_type text,
  endpoint text,
  auth_key text,
  p256dh_key text,
  payload jsonb,
  attempt_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT outbox.id
    FROM public.notification_push_outbox outbox
    WHERE outbox.status IN ('pending', 'failed')
      AND outbox.available_at <= now()
    ORDER BY outbox.available_at ASC, outbox.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT greatest(1, least(coalesce(p_limit, 50), 200))
  ), claimed AS (
    UPDATE public.notification_push_outbox outbox
    SET status = 'processing',
        attempt_count = outbox.attempt_count + 1,
        last_error = NULL
    FROM candidates
    WHERE outbox.id = candidates.id
    RETURNING outbox.*
  )
  SELECT claimed.id,
         claimed.notification_id,
         claimed.recipient_id,
         claimed.subscription_id,
         subscription.device_type::text,
         subscription.endpoint::text,
         subscription.auth_key::text,
         subscription.p256dh_key::text,
         claimed.payload,
         claimed.attempt_count
  FROM claimed
  JOIN public.push_subscriptions subscription
    ON subscription.id = claimed.subscription_id
  WHERE subscription.is_active = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_notification_push_job(
  p_job_id uuid,
  p_succeeded boolean,
  p_error text DEFAULT NULL,
  p_retry_seconds integer DEFAULT 300
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notification_push_outbox
  SET status = CASE WHEN p_succeeded THEN 'sent' ELSE 'failed' END,
      last_error = CASE WHEN p_succeeded THEN NULL ELSE left(coalesce(p_error, 'Push delivery failed'), 1000) END,
      sent_at = CASE WHEN p_succeeded THEN now() ELSE NULL END,
      available_at = CASE
        WHEN p_succeeded THEN available_at
        ELSE now() + make_interval(secs => greatest(30, least(coalesce(p_retry_seconds, 300), 86400)))
      END
  WHERE id = p_job_id
    AND status = 'processing';
END;
$$;

REVOKE ALL ON FUNCTION public.claim_notification_push_jobs(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_notification_push_job(uuid, boolean, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_notification_push_jobs(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_notification_push_job(uuid, boolean, text, integer) TO service_role;
