-- Enterprise one-time data backfill
-- Purpose: Populate public.profiles.avatar_image_id and public.profiles.cover_image_id
--          from system album cover images when these pointers are missing.
--
-- Design rules:
-- - images table is the single source of truth for URLs and image metadata.
-- - albums are history/archive only; they must not be required to render current avatar/cover.
-- - This migration ONLY backfills missing pointers (NULL only). It does not override existing values.
--
-- System albums:
-- - Avatar:  photo_albums.name = 'Avatar Images'
-- - Cover:   photo_albums.name = 'Header Cover Images'
--
-- Safety:
-- - Verifies required tables/columns exist using information_schema.
-- - Uses only documented columns from your current schema backup.
-- - Skips images that are deleted or have empty URLs.

DO $$
BEGIN
  -- Table existence checks
  PERFORM 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required table: public.profiles'; END IF;

  PERFORM 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'photo_albums';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required table: public.photo_albums'; END IF;

  PERFORM 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'album_images';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required table: public.album_images'; END IF;

  PERFORM 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'images';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required table: public.images'; END IF;

  -- Column existence checks (profiles)
  PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required column: public.profiles.id'; END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required column: public.profiles.user_id'; END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_image_id';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required column: public.profiles.avatar_image_id'; END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'cover_image_id';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required column: public.profiles.cover_image_id'; END IF;

  -- These fields are used by calculate_profile_completion
  PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'bio';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required column: public.profiles.bio'; END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'occupation';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required column: public.profiles.occupation'; END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'education';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required column: public.profiles.education'; END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'interests';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required column: public.profiles.interests'; END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'social_links';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required column: public.profiles.social_links'; END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required column: public.profiles.phone'; END IF;

  -- Column existence checks (photo_albums)
  PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'photo_albums' AND column_name = 'id';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required column: public.photo_albums.id'; END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'photo_albums' AND column_name = 'name';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required column: public.photo_albums.name'; END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'photo_albums' AND column_name = 'owner_id';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required column: public.photo_albums.owner_id'; END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'photo_albums' AND column_name = 'entity_id';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required column: public.photo_albums.entity_id'; END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'photo_albums' AND column_name = 'entity_type';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required column: public.photo_albums.entity_type'; END IF;

  -- Column existence checks (album_images)
  PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'album_images' AND column_name = 'album_id';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required column: public.album_images.album_id'; END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'album_images' AND column_name = 'image_id';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required column: public.album_images.image_id'; END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'album_images' AND column_name = 'is_cover';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required column: public.album_images.is_cover'; END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'album_images' AND column_name = 'created_at';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required column: public.album_images.created_at'; END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'album_images' AND column_name = 'display_order';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required column: public.album_images.display_order'; END IF;

  -- Column existence checks (images)
  PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'images' AND column_name = 'id';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required column: public.images.id'; END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'images' AND column_name = 'url';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required column: public.images.url'; END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'images' AND column_name = 'deleted_at';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing required column: public.images.deleted_at'; END IF;
END $$;

-- Fix broken trigger dependency (enterprise hygiene):
-- profiles has trigger_update_profile_completion which calls calculate_profile_completion().
-- The function was still referencing legacy columns avatar_url / cover_image_url, which no longer exist.
-- We align it to the canonical schema: avatar_image_id / cover_image_id.
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(user_profile_id uuid)
RETURNS integer
AS $func$
DECLARE
  filled_fields integer := 0;
  total_fields integer := 8;
  completion_score integer := 0;
BEGIN
  SELECT
    CASE WHEN avatar_image_id IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN cover_image_id IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN bio IS NOT NULL AND bio <> '' THEN 1 ELSE 0 END +
    CASE WHEN occupation IS NOT NULL AND occupation <> '' THEN 1 ELSE 0 END +
    CASE WHEN education IS NOT NULL AND education <> '' THEN 1 ELSE 0 END +
    CASE WHEN interests IS NOT NULL AND array_length(interests, 1) > 0 THEN 1 ELSE 0 END +
    CASE WHEN social_links IS NOT NULL AND social_links <> '{}'::jsonb THEN 1 ELSE 0 END +
    CASE WHEN phone IS NOT NULL AND phone <> '' THEN 1 ELSE 0 END
  INTO filled_fields
  FROM public.profiles
  WHERE id = user_profile_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  completion_score := ROUND((filled_fields::numeric / total_fields) * 100);
  RETURN LEAST(completion_score, 100);
END;
$func$ LANGUAGE plpgsql;

DO $$
DECLARE
  missing_count integer;
BEGIN
  -- Backfill missing avatar_image_id and cover_image_id from system albums.
  WITH candidates AS (
    SELECT
      p.user_id,
      (
        SELECT ai.image_id
        FROM public.photo_albums pa
        JOIN public.album_images ai ON ai.album_id = pa.id
        JOIN public.images i ON i.id = ai.image_id
        WHERE pa.name = 'Avatar Images'
          AND pa.entity_type = 'user'
          AND (pa.entity_id = p.user_id OR pa.owner_id = p.user_id)
          AND i.deleted_at IS NULL
          AND i.url IS NOT NULL
          AND length(trim(i.url)) > 0
        ORDER BY ai.is_cover DESC, ai.created_at DESC NULLS LAST, ai.display_order ASC
        LIMIT 1
      ) AS avatar_candidate,
      (
        SELECT ai.image_id
        FROM public.photo_albums pa
        JOIN public.album_images ai ON ai.album_id = pa.id
        JOIN public.images i ON i.id = ai.image_id
        WHERE pa.name = 'Header Cover Images'
          AND pa.entity_type = 'user'
          AND (pa.entity_id = p.user_id OR pa.owner_id = p.user_id)
          AND i.deleted_at IS NULL
          AND i.url IS NOT NULL
          AND length(trim(i.url)) > 0
        ORDER BY ai.is_cover DESC, ai.created_at DESC NULLS LAST, ai.display_order ASC
        LIMIT 1
      ) AS cover_candidate
    FROM public.profiles p
  )
  UPDATE public.profiles p
  SET
    avatar_image_id = COALESCE(p.avatar_image_id, c.avatar_candidate),
    cover_image_id  = COALESCE(p.cover_image_id,  c.cover_candidate)
  FROM candidates c
  WHERE p.user_id = c.user_id
    AND (
      (p.avatar_image_id IS NULL AND c.avatar_candidate IS NOT NULL)
      OR
      (p.cover_image_id IS NULL AND c.cover_candidate IS NOT NULL)
    );

  SELECT COUNT(*) INTO missing_count
  FROM public.profiles
  WHERE avatar_image_id IS NULL;

  RAISE NOTICE 'Backfill complete. Profiles still missing avatar_image_id: %', missing_count;
END $$;


