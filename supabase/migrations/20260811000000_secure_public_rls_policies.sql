-- Tighten anonymous access to user-generated posts and reading progress.
-- Public rows remain readable; private rows and all writes require ownership.

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_public_select" ON public.posts;
CREATE POLICY "posts_public_select"
  ON public.posts
  FOR SELECT
  TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND visibility = 'public'
    AND (publish_status IS NULL OR publish_status = 'published')
  );

DROP POLICY IF EXISTS "posts_owner_select" ON public.posts;
CREATE POLICY "posts_owner_select"
  ON public.posts
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "posts_owner_insert" ON public.posts;
CREATE POLICY "posts_owner_insert"
  ON public.posts
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "posts_owner_update" ON public.posts;
CREATE POLICY "posts_owner_update"
  ON public.posts
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "posts_owner_delete" ON public.posts;
CREATE POLICY "posts_owner_delete"
  ON public.posts
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reading_progress_public_select" ON public.reading_progress;
CREATE POLICY "reading_progress_public_select"
  ON public.reading_progress
  FOR SELECT
  TO anon, authenticated
  USING (privacy_level = 'public');

DROP POLICY IF EXISTS "reading_progress_owner_select" ON public.reading_progress;
CREATE POLICY "reading_progress_owner_select"
  ON public.reading_progress
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "reading_progress_owner_insert" ON public.reading_progress;
CREATE POLICY "reading_progress_owner_insert"
  ON public.reading_progress
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "reading_progress_owner_update" ON public.reading_progress;
CREATE POLICY "reading_progress_owner_update"
  ON public.reading_progress
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "reading_progress_owner_delete" ON public.reading_progress;
CREATE POLICY "reading_progress_owner_delete"
  ON public.reading_progress
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
