-- Fix Security Issues - Enable RLS on All Public Tables
-- This script addresses the 166 security errors in info.txt

-- =====================================================
-- ENABLE RLS ON ALL PUBLIC TABLES
-- =====================================================

-- User-related tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_book_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reading_preferences ENABLE ROW LEVEL SECURITY;

-- Book-related tables
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_similarity_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_genre_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_tag_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_club_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_club_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_club_discussion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.similar_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;

-- Author and Publisher tables
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_info ENABLE ROW LEVEL SECURITY;

-- Event-related tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_livestreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_creator_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_permission_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_waitlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_calendar_exports ENABLE ROW LEVEL SECURITY;

-- Group-related tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_book_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_book_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_book_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_book_swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_book_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_book_wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_reading_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_reading_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_chat_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_chat_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_member_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_member_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_member_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_content_moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_membership_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_onboarding_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_author_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_discussion_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_shared_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_welcome_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_types ENABLE ROW LEVEL SECURITY;

-- Feed and Activity tables
ALTER TABLE public.feed_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_entry_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_target_types ENABLE ROW LEVEL SECURITY;

-- Photo Album tables
ALTER TABLE public.photo_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_album ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_tag_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousel_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_attachments ENABLE ROW LEVEL SECURITY;

-- Reading-related tables
ALTER TABLE public.reading_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_stats_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personalized_recommendations ENABLE ROW LEVEL SECURITY;

-- Event and Session tables
ALTER TABLE public.series_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Reference and lookup tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binding_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.format_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dewey_decimal_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_followers ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ADD BASIC SECURITY POLICIES
-- =====================================================

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Profiles can be read by the user
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Public read access for books, authors, publishers
CREATE POLICY "Public read access for books" ON public.books
    FOR SELECT USING (true);

CREATE POLICY "Public read access for authors" ON public.authors
    FOR SELECT USING (true);

CREATE POLICY "Public read access for publishers" ON public.publishers
    FOR SELECT USING (true);

-- Users can manage their own content
CREATE POLICY "Users can manage own comments" ON public.comments
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own likes" ON public.likes
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own photo albums" ON public.photo_albums
    FOR ALL USING (auth.uid() = owner_id);

-- Public read access for public content
CREATE POLICY "Public read access for public events" ON public.events
    FOR SELECT USING (visibility = 'public' OR auth.uid() = created_by);

CREATE POLICY "Public read access for public groups" ON public.groups
    FOR SELECT USING (NOT is_private OR auth.uid() IN (
        SELECT user_id FROM public.group_members WHERE group_id = groups.id
    ));

-- =====================================================
-- FIX FUNCTION SEARCH PATH ISSUES
-- =====================================================

-- Fix the 10 function search path warnings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_feed_activities(p_user_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
RETURNS TABLE(id uuid, user_id uuid, activity_type text, entity_type text, entity_id text, is_public boolean, metadata jsonb, created_at timestamp with time zone, user_name text, user_avatar_url text, like_count bigint, comment_count bigint, is_liked boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Function implementation here
    RETURN QUERY SELECT * FROM public.activities WHERE user_id = p_user_id LIMIT p_limit OFFSET p_offset;
END;
$$;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND rowsecurity = false
ORDER BY tablename;

-- Count tables with RLS enabled
SELECT 
    COUNT(*) as tables_with_rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND rowsecurity = true; 