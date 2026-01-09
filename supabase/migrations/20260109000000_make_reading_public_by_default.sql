-- Make reading-related privacy public by default.
-- This aligns the product behavior with: "all data may be viewed by the public".

-- 1) User-level privacy defaults
ALTER TABLE public.user_privacy_settings
  ALTER COLUMN default_privacy_level SET DEFAULT 'public',
  ALTER COLUMN allow_public_reading_profile SET DEFAULT true,
  ALTER COLUMN show_reading_stats_publicly SET DEFAULT true,
  ALTER COLUMN show_currently_reading_publicly SET DEFAULT true,
  ALTER COLUMN show_reading_history_publicly SET DEFAULT true,
  ALTER COLUMN show_reading_goals_publicly SET DEFAULT true;

-- Backfill existing users to be public
UPDATE public.user_privacy_settings
SET
  default_privacy_level = 'public',
  allow_public_reading_profile = true,
  show_reading_stats_publicly = true,
  show_currently_reading_publicly = true,
  show_reading_history_publicly = true,
  show_reading_goals_publicly = true;

-- 2) Row-level reading progress defaults
ALTER TABLE public.reading_progress
  ALTER COLUMN privacy_level SET DEFAULT 'public';

-- Backfill existing reading_progress rows to be public
UPDATE public.reading_progress
SET privacy_level = 'public'
WHERE privacy_level IS DISTINCT FROM 'public';
