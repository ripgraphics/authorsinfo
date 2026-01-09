-- Backfill user_privacy_settings for any users that are missing a row.
-- This is intentionally idempotent.

INSERT INTO public.user_privacy_settings (user_id)
SELECT u.id
FROM public.users u
LEFT JOIN public.user_privacy_settings ups ON ups.user_id = u.id
WHERE ups.user_id IS NULL;
