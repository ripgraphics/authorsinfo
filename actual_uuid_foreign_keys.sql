-- =====================================================
-- ACTUAL UUID FOREIGN KEY CONSTRAINTS
-- Based on ACTUAL schema analysis - NO ASSUMPTIONS
-- =====================================================

-- 1. EVENT_PERMISSION_REQUESTS TABLE CONSTRAINTS
-- =====================================================

-- event_permission_requests.user_id → users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_permission_requests_user_id_fkey'
          AND table_name = 'event_permission_requests'
    ) THEN
        ALTER TABLE public.event_permission_requests
            ADD CONSTRAINT event_permission_requests_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_event_permission_requests_user_id ON public.event_permission_requests(user_id);
    END IF;
END$$;

-- event_permission_requests.reviewed_by → users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_permission_requests_reviewed_by_fkey'
          AND table_name = 'event_permission_requests'
    ) THEN
        ALTER TABLE public.event_permission_requests
            ADD CONSTRAINT event_permission_requests_reviewed_by_fkey
            FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_event_permission_requests_reviewed_by ON public.event_permission_requests(reviewed_by);
    END IF;
END$$;

-- 2. EVENT_QUESTIONS TABLE CONSTRAINTS
-- =====================================================

-- event_questions.event_id → events.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_questions_event_id_fkey'
          AND table_name = 'event_questions'
    ) THEN
        ALTER TABLE public.event_questions
            ADD CONSTRAINT event_questions_event_id_fkey
            FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_event_questions_event_id ON public.event_questions(event_id);
    END IF;
END$$;

-- 3. EVENT_REGISTRATIONS TABLE CONSTRAINTS
-- =====================================================

-- event_registrations.user_id → users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_registrations_user_id_fkey'
          AND table_name = 'event_registrations'
    ) THEN
        ALTER TABLE public.event_registrations
            ADD CONSTRAINT event_registrations_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON public.event_registrations(user_id);
    END IF;
END$$;

-- event_registrations.event_id → events.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_registrations_event_id_fkey'
          AND table_name = 'event_registrations'
    ) THEN
        ALTER TABLE public.event_registrations
            ADD CONSTRAINT event_registrations_event_id_fkey
            FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);
    END IF;
END$$;

-- 4. EVENT_REMINDERS TABLE CONSTRAINTS
-- =====================================================

-- event_reminders.event_id → events.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_reminders_event_id_fkey'
          AND table_name = 'event_reminders'
    ) THEN
        ALTER TABLE public.event_reminders
            ADD CONSTRAINT event_reminders_event_id_fkey
            FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_event_reminders_event_id ON public.event_reminders(event_id);
    END IF;
END$$;

-- event_reminders.user_id → users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_reminders_user_id_fkey'
          AND table_name = 'event_reminders'
    ) THEN
        ALTER TABLE public.event_reminders
            ADD CONSTRAINT event_reminders_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_event_reminders_user_id ON public.event_reminders(user_id);
    END IF;
END$$;

-- 5. EVENT_SESSIONS TABLE CONSTRAINTS
-- =====================================================

-- event_sessions.event_id → events.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_sessions_event_id_fkey'
          AND table_name = 'event_sessions'
    ) THEN
        ALTER TABLE public.event_sessions
            ADD CONSTRAINT event_sessions_event_id_fkey
            FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_event_sessions_event_id ON public.event_sessions(event_id);
    END IF;
END$$;

-- 6. EVENT_SHARES TABLE CONSTRAINTS
-- =====================================================

-- event_shares.event_id → events.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_shares_event_id_fkey'
          AND table_name = 'event_shares'
    ) THEN
        ALTER TABLE public.event_shares
            ADD CONSTRAINT event_shares_event_id_fkey
            FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_event_shares_event_id ON public.event_shares(event_id);
    END IF;
END$$;

-- event_shares.user_id → users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_shares_user_id_fkey'
          AND table_name = 'event_shares'
    ) THEN
        ALTER TABLE public.event_shares
            ADD CONSTRAINT event_shares_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_event_shares_user_id ON public.event_shares(user_id);
    END IF;
END$$;

-- 7. EVENT_SPEAKERS TABLE CONSTRAINTS
-- =====================================================

-- event_speakers.event_id → events.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_speakers_event_id_fkey'
          AND table_name = 'event_speakers'
    ) THEN
        ALTER TABLE public.event_speakers
            ADD CONSTRAINT event_speakers_event_id_fkey
            FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_event_speakers_event_id ON public.event_speakers(event_id);
    END IF;
END$$;

-- event_speakers.user_id → users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_speakers_user_id_fkey'
          AND table_name = 'event_speakers'
    ) THEN
        ALTER TABLE public.event_speakers
            ADD CONSTRAINT event_speakers_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_event_speakers_user_id ON public.event_speakers(user_id);
    END IF;
END$$;

-- event_speakers.author_id → authors.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_speakers_author_id_fkey'
          AND table_name = 'event_speakers'
    ) THEN
        ALTER TABLE public.event_speakers
            ADD CONSTRAINT event_speakers_author_id_fkey
            FOREIGN KEY (author_id) REFERENCES public.authors(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_event_speakers_author_id ON public.event_speakers(author_id);
    END IF;
END$$;

-- 8. EVENT_SPONSORS TABLE CONSTRAINTS
-- =====================================================

-- event_sponsors.event_id → events.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_sponsors_event_id_fkey'
          AND table_name = 'event_sponsors'
    ) THEN
        ALTER TABLE public.event_sponsors
            ADD CONSTRAINT event_sponsors_event_id_fkey
            FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_event_sponsors_event_id ON public.event_sponsors(event_id);
    END IF;
END$$;

-- 9. EVENT_STAFF TABLE CONSTRAINTS
-- =====================================================

-- event_staff.event_id → events.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_staff_event_id_fkey'
          AND table_name = 'event_staff'
    ) THEN
        ALTER TABLE public.event_staff
            ADD CONSTRAINT event_staff_event_id_fkey
            FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_event_staff_event_id ON public.event_staff(event_id);
    END IF;
END$$;

-- event_staff.user_id → users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_staff_user_id_fkey'
          AND table_name = 'event_staff'
    ) THEN
        ALTER TABLE public.event_staff
            ADD CONSTRAINT event_staff_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_event_staff_user_id ON public.event_staff(user_id);
    END IF;
END$$;

-- 10. EVENT_SURVEYS TABLE CONSTRAINTS
-- =====================================================

-- event_surveys.event_id → events.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_surveys_event_id_fkey'
          AND table_name = 'event_surveys'
    ) THEN
        ALTER TABLE public.event_surveys
            ADD CONSTRAINT event_surveys_event_id_fkey
            FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_event_surveys_event_id ON public.event_surveys(event_id);
    END IF;
END$$;

-- 11. EVENT_TAGS TABLE CONSTRAINTS
-- =====================================================

-- event_tags.event_id → events.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_tags_event_id_fkey'
          AND table_name = 'event_tags'
    ) THEN
        ALTER TABLE public.event_tags
            ADD CONSTRAINT event_tags_event_id_fkey
            FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_event_tags_event_id ON public.event_tags(event_id);
    END IF;
END$$;

-- 12. EVENT_VIEWS TABLE CONSTRAINTS
-- =====================================================

-- event_views.user_id → users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_views_user_id_fkey'
          AND table_name = 'event_views'
    ) THEN
        ALTER TABLE public.event_views
            ADD CONSTRAINT event_views_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_event_views_user_id ON public.event_views(user_id);
    END IF;
END$$;

-- event_views.event_id → events.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_views_event_id_fkey'
          AND table_name = 'event_views'
    ) THEN
        ALTER TABLE public.event_views
            ADD CONSTRAINT event_views_event_id_fkey
            FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_event_views_event_id ON public.event_views(event_id);
    END IF;
END$$;

-- 13. EVENT_WAITLISTS TABLE CONSTRAINTS
-- =====================================================

-- event_waitlists.event_id → events.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_waitlists_event_id_fkey'
          AND table_name = 'event_waitlists'
    ) THEN
        ALTER TABLE public.event_waitlists
            ADD CONSTRAINT event_waitlists_event_id_fkey
            FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_event_waitlists_event_id ON public.event_waitlists(event_id);
    END IF;
END$$;

-- 14. FEED_ENTRY_TAGS TABLE CONSTRAINTS
-- =====================================================

-- feed_entry_tags.feed_entry_id → feed_entries.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'feed_entry_tags_feed_entry_id_fkey'
          AND table_name = 'feed_entry_tags'
    ) THEN
        ALTER TABLE public.feed_entry_tags
            ADD CONSTRAINT feed_entry_tags_feed_entry_id_fkey
            FOREIGN KEY (feed_entry_id) REFERENCES public.feed_entries(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_feed_entry_tags_feed_entry_id ON public.feed_entry_tags(feed_entry_id);
    END IF;
END$$;

-- 15. BOOK_AUTHORS TABLE CONSTRAINTS
-- =====================================================

-- book_authors.book_id → books.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'book_authors_book_id_fkey'
          AND table_name = 'book_authors'
    ) THEN
        ALTER TABLE public.book_authors
            ADD CONSTRAINT book_authors_book_id_fkey
            FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_book_authors_book_id ON public.book_authors(book_id);
    END IF;
END$$;

-- book_authors.author_id → authors.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'book_authors_author_id_fkey'
          AND table_name = 'book_authors'
    ) THEN
        ALTER TABLE public.book_authors
            ADD CONSTRAINT book_authors_author_id_fkey
            FOREIGN KEY (author_id) REFERENCES public.authors(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_book_authors_author_id ON public.book_authors(author_id);
    END IF;
END$$;

-- 16. BOOK_CLUB_BOOKS TABLE CONSTRAINTS
-- =====================================================

-- book_club_books.book_id → books.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'book_club_books_book_id_fkey'
          AND table_name = 'book_club_books'
    ) THEN
        ALTER TABLE public.book_club_books
            ADD CONSTRAINT book_club_books_book_id_fkey
            FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_book_club_books_book_id ON public.book_club_books(book_id);
    END IF;
END$$;

-- 17. BOOK_CLUB_DISCUSSION_COMMENTS TABLE CONSTRAINTS
-- =====================================================

-- book_club_discussion_comments.discussion_id → book_club_discussions.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'book_club_discussion_comments_discussion_id_fkey'
          AND table_name = 'book_club_discussion_comments'
    ) THEN
        ALTER TABLE public.book_club_discussion_comments
            ADD CONSTRAINT book_club_discussion_comments_discussion_id_fkey
            FOREIGN KEY (discussion_id) REFERENCES public.book_club_discussions(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_book_club_discussion_comments_discussion_id ON public.book_club_discussion_comments(discussion_id);
    END IF;
END$$;

-- book_club_discussion_comments.created_by → users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'book_club_discussion_comments_created_by_fkey'
          AND table_name = 'book_club_discussion_comments'
    ) THEN
        ALTER TABLE public.book_club_discussion_comments
            ADD CONSTRAINT book_club_discussion_comments_created_by_fkey
            FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_book_club_discussion_comments_created_by ON public.book_club_discussion_comments(created_by);
    END IF;
END$$;

-- 18. BOOK_CLUB_DISCUSSIONS TABLE CONSTRAINTS
-- =====================================================

-- book_club_discussions.created_by → users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'book_club_discussions_created_by_fkey'
          AND table_name = 'book_club_discussions'
    ) THEN
        ALTER TABLE public.book_club_discussions
            ADD CONSTRAINT book_club_discussions_created_by_fkey
            FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_book_club_discussions_created_by ON public.book_club_discussions(created_by);
    END IF;
END$$;

-- book_club_discussions.book_id → books.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'book_club_discussions_book_id_fkey'
          AND table_name = 'book_club_discussions'
    ) THEN
        ALTER TABLE public.book_club_discussions
            ADD CONSTRAINT book_club_discussions_book_id_fkey
            FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_book_club_discussions_book_id ON public.book_club_discussions(book_id);
    END IF;
END$$;

-- 19. BOOK_CLUB_MEMBERS TABLE CONSTRAINTS
-- =====================================================

-- book_club_members.user_id → users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'book_club_members_user_id_fkey'
          AND table_name = 'book_club_members'
    ) THEN
        ALTER TABLE public.book_club_members
            ADD CONSTRAINT book_club_members_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_book_club_members_user_id ON public.book_club_members(user_id);
    END IF;
END$$;

-- 20. BOOK_CLUBS TABLE CONSTRAINTS
-- =====================================================

-- book_clubs.created_by → users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'book_clubs_created_by_fkey'
          AND table_name = 'book_clubs'
    ) THEN
        ALTER TABLE public.book_clubs
            ADD CONSTRAINT book_clubs_created_by_fkey
            FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_book_clubs_created_by ON public.book_clubs(created_by);
    END IF;
END$$;

-- 21. BOOK_GENRE_MAPPINGS TABLE CONSTRAINTS
-- =====================================================

-- book_genre_mappings.book_id → books.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'book_genre_mappings_book_id_fkey'
          AND table_name = 'book_genre_mappings'
    ) THEN
        ALTER TABLE public.book_genre_mappings
            ADD CONSTRAINT book_genre_mappings_book_id_fkey
            FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_book_genre_mappings_book_id ON public.book_genre_mappings(book_id);
    END IF;
END$$;

-- book_genre_mappings.genre_id → book_genres.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'book_genre_mappings_genre_id_fkey'
          AND table_name = 'book_genre_mappings'
    ) THEN
        ALTER TABLE public.book_genre_mappings
            ADD CONSTRAINT book_genre_mappings_genre_id_fkey
            FOREIGN KEY (genre_id) REFERENCES public.book_genres(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_book_genre_mappings_genre_id ON public.book_genre_mappings(genre_id);
    END IF;
END$$;

-- 22. BOOK_POPULARITY_METRICS TABLE CONSTRAINTS
-- =====================================================

-- book_popularity_metrics.book_id → books.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'book_popularity_metrics_book_id_fkey'
          AND table_name = 'book_popularity_metrics'
    ) THEN
        ALTER TABLE public.book_popularity_metrics
            ADD CONSTRAINT book_popularity_metrics_book_id_fkey
            FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_book_popularity_metrics_book_id ON public.book_popularity_metrics(book_id);
    END IF;
END$$;

-- 23. BOOK_PUBLISHERS TABLE CONSTRAINTS
-- =====================================================

-- book_publishers.book_id → books.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'book_publishers_book_id_fkey'
          AND table_name = 'book_publishers'
    ) THEN
        ALTER TABLE public.book_publishers
            ADD CONSTRAINT book_publishers_book_id_fkey
            FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_book_publishers_book_id ON public.book_publishers(book_id);
    END IF;
END$$;

-- book_publishers.publisher_id → publishers.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'book_publishers_publisher_id_fkey'
          AND table_name = 'book_publishers'
    ) THEN
        ALTER TABLE public.book_publishers
            ADD CONSTRAINT book_publishers_publisher_id_fkey
            FOREIGN KEY (publisher_id) REFERENCES public.publishers(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_book_publishers_publisher_id ON public.book_publishers(publisher_id);
    END IF;
END$$;

-- 24. BOOK_RECOMMENDATIONS TABLE CONSTRAINTS
-- =====================================================

-- book_recommendations.user_id → users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'book_recommendations_user_id_fkey'
          AND table_name = 'book_recommendations'
    ) THEN
        ALTER TABLE public.book_recommendations
            ADD CONSTRAINT book_recommendations_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_book_recommendations_user_id ON public.book_recommendations(user_id);
    END IF;
END$$;

-- book_recommendations.book_id → books.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'book_recommendations_book_id_fkey'
          AND table_name = 'book_recommendations'
    ) THEN
        ALTER TABLE public.book_recommendations
            ADD CONSTRAINT book_recommendations_book_id_fkey
            FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_book_recommendations_book_id ON public.book_recommendations(book_id);
    END IF;
END$$;

-- 25. BOOK_SIMILARITY_SCORES TABLE CONSTRAINTS
-- =====================================================

-- book_similarity_scores.book_id → books.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'book_similarity_scores_book_id_fkey'
          AND table_name = 'book_similarity_scores'
    ) THEN
        ALTER TABLE public.book_similarity_scores
            ADD CONSTRAINT book_similarity_scores_book_id_fkey
            FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_book_similarity_scores_book_id ON public.book_similarity_scores(book_id);
    END IF;
END$$;

-- 26. BOOK_SUBJECTS TABLE CONSTRAINTS
-- =====================================================

-- book_subjects.book_id → books.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'book_subjects_book_id_fkey'
          AND table_name = 'book_subjects'
    ) THEN
        ALTER TABLE public.book_subjects
            ADD CONSTRAINT book_subjects_book_id_fkey
            FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_book_subjects_book_id ON public.book_subjects(book_id);
    END IF;
END$$;

-- book_subjects.subject_id → subjects.id (if subjects table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subjects') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'book_subjects_subject_id_fkey'
              AND table_name = 'book_subjects'
        ) THEN
            ALTER TABLE public.book_subjects
                ADD CONSTRAINT book_subjects_subject_id_fkey
                FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
            CREATE INDEX IF NOT EXISTS idx_book_subjects_subject_id ON public.book_subjects(subject_id);
        END IF;
    END IF;
END$$;

-- 27. BOOK_TAG_MAPPINGS TABLE CONSTRAINTS
-- =====================================================

-- book_tag_mappings.book_id → books.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'book_tag_mappings_book_id_fkey'
          AND table_name = 'book_tag_mappings'
    ) THEN
        ALTER TABLE public.book_tag_mappings
            ADD CONSTRAINT book_tag_mappings_book_id_fkey
            FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_book_tag_mappings_book_id ON public.book_tag_mappings(book_id);
    END IF;
END$$;

-- book_tag_mappings.tag_id → book_tags.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'book_tag_mappings_tag_id_fkey'
          AND table_name = 'book_tag_mappings'
    ) THEN
        ALTER TABLE public.book_tag_mappings
            ADD CONSTRAINT book_tag_mappings_tag_id_fkey
            FOREIGN KEY (tag_id) REFERENCES public.book_tags(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_book_tag_mappings_tag_id ON public.book_tag_mappings(tag_id);
    END IF;
END$$;

-- 28. COLLABORATIVE_FILTERING_DATA TABLE CONSTRAINTS
-- =====================================================

-- collaborative_filtering_data.user_id → users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'collaborative_filtering_data_user_id_fkey'
          AND table_name = 'collaborative_filtering_data'
    ) THEN
        ALTER TABLE public.collaborative_filtering_data
            ADD CONSTRAINT collaborative_filtering_data_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_collaborative_filtering_data_user_id ON public.collaborative_filtering_data(user_id);
    END IF;
END$$;

-- 29. CONTENT_GENERATION_JOBS TABLE CONSTRAINTS
-- =====================================================

-- content_generation_jobs.created_by → users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'content_generation_jobs_created_by_fkey'
          AND table_name = 'content_generation_jobs'
    ) THEN
        ALTER TABLE public.content_generation_jobs
            ADD CONSTRAINT content_generation_jobs_created_by_fkey
            FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_content_generation_jobs_created_by ON public.content_generation_jobs(created_by);
    END IF;
END$$;

-- 30. DATA_ENRICHMENT_JOBS TABLE CONSTRAINTS
-- =====================================================

-- data_enrichment_jobs.created_by → users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'data_enrichment_jobs_created_by_fkey'
          AND table_name = 'data_enrichment_jobs'
    ) THEN
        ALTER TABLE public.data_enrichment_jobs
            ADD CONSTRAINT data_enrichment_jobs_created_by_fkey
            FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_data_enrichment_jobs_created_by ON public.data_enrichment_jobs(created_by);
    END IF;
END$$;

-- 31. ENTERPRISE_DATA_VERSIONS TABLE CONSTRAINTS
-- =====================================================

-- enterprise_data_versions.created_by → users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'enterprise_data_versions_created_by_fkey'
          AND table_name = 'enterprise_data_versions'
    ) THEN
        ALTER TABLE public.enterprise_data_versions
            ADD CONSTRAINT enterprise_data_versions_created_by_fkey
            FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_enterprise_data_versions_created_by ON public.enterprise_data_versions(created_by);
    END IF;
END$$;

-- 32. EVENT_BOOKS TABLE CONSTRAINTS
-- =====================================================

-- event_books.event_id → events.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_books_event_id_fkey'
          AND table_name = 'event_books'
    ) THEN
        ALTER TABLE public.event_books
            ADD CONSTRAINT event_books_event_id_fkey
            FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_event_books_event_id ON public.event_books(event_id);
    END IF;
END$$;

-- event_books.book_id → books.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_books_book_id_fkey'
          AND table_name = 'event_books'
    ) THEN
        ALTER TABLE public.event_books
            ADD CONSTRAINT event_books_book_id_fkey
            FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_event_books_book_id ON public.event_books(book_id);
    END IF;
END$$;

-- =====================================================
-- END OF ACTUAL UUID FOREIGN KEY CONSTRAINTS
-- ===================================================== 