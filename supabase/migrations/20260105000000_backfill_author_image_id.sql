-- Backfill authors.author_image_id from existing images/albums.
-- Rule: "newest image wins". Only fills NULL author_image_id; does not overwrite.

-- 1) Candidates from images table (metadata linkage and/or deterministic alt_text)
WITH image_candidates AS (
  SELECT
    a.id AS author_id,
    i.id AS image_id,
    i.created_at AS image_created_at
  FROM public.authors a
  JOIN public.images i
    ON (
      (
        i.metadata->>'entity_type' = 'author'
        AND i.metadata->>'entity_id' = a.id::text
        AND COALESCE(i.metadata->>'image_type', '') IN ('avatar', 'author_avatar')
      )
      OR (i.alt_text = 'avatar for author ' || a.id::text)
    )
),

-- 2) Candidates from author "Avatar Images" album (relationship-only; image data remains in public.images)
album_candidates AS (
  SELECT
    pa.entity_id AS author_id,
    i.id AS image_id,
    i.created_at AS image_created_at
  FROM public.photo_albums pa
  JOIN public.album_images ai ON ai.album_id = pa.id
  JOIN public.images i ON i.id = ai.image_id
  WHERE pa.entity_type = 'author'
    AND pa.entity_id IS NOT NULL
    AND pa.name = 'Avatar Images'
),

all_candidates AS (
  SELECT * FROM image_candidates
  UNION ALL
  SELECT * FROM album_candidates
),

ranked AS (
  SELECT
    author_id,
    image_id,
    ROW_NUMBER() OVER (
      PARTITION BY author_id
      ORDER BY image_created_at DESC, image_id DESC
    ) AS rn
  FROM all_candidates
)
UPDATE public.authors a
SET author_image_id = r.image_id
FROM ranked r
WHERE r.rn = 1
  AND a.id = r.author_id
  AND a.author_image_id IS NULL;


-- 3) Optional legacy migration: if public.authors.photo_url exists in a given environment,
-- migrate it into public.images + set author_image_id (only when author_image_id is NULL).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'authors'
      AND column_name = 'photo_url'
  ) THEN
    EXECUTE $SQL$
      WITH src AS (
        SELECT id AS author_id, photo_url
        FROM public.authors
        WHERE author_image_id IS NULL
          AND photo_url IS NOT NULL
          AND btrim(photo_url) <> ''
      ),
      ins AS (
        INSERT INTO public.images (url, alt_text, storage_provider, storage_path, metadata)
        SELECT
          s.photo_url,
          'legacy avatar for author ' || s.author_id::text,
          'legacy',
          'legacy/authors.photo_url',
          jsonb_build_object(
            'legacy_source', 'authors.photo_url',
            'legacy_author_id', s.author_id::text,
            'legacy_photo_url', s.photo_url,
            'entity_type', 'author',
            'entity_id', s.author_id::text,
            'image_type', 'avatar'
          )
        FROM src s
        WHERE NOT EXISTS (
          SELECT 1
          FROM public.images i
          WHERE i.metadata->>'legacy_source' = 'authors.photo_url'
            AND i.metadata->>'legacy_author_id' = s.author_id::text
        )
        RETURNING id, (metadata->>'legacy_author_id')::uuid AS author_id
      )
      UPDATE public.authors a
      SET author_image_id = ins.id
      FROM ins
      WHERE a.id = ins.author_id
        AND a.author_image_id IS NULL;
    $SQL$;
  END IF;
END $$;
