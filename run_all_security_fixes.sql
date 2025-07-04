-- Master Script to Fix All Security Issues from info.txt
-- This script runs all the security fixes in the correct order

-- Step 1: Fix critical security issues (user content, social interaction, book-related tables)
\i fix_critical_security_issues.sql

-- Step 2: Fix remaining security issues (event, group, reading, reference tables)
\i fix_all_remaining_tables.sql

-- Step 3: Verify all tables now have RLS policies
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity = true THEN 'RLS Enabled'
        ELSE 'RLS Disabled'
    END as rls_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = t.schemaname 
            AND tablename = t.tablename
        ) THEN 'Has Policies'
        ELSE 'No Policies'
    END as policy_status
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN (
    'activities', 'activity_log', 'album_analytics', 'album_images', 'album_shares',
    'binding_types', 'blocks', 'book_authors', 'book_club_books', 'book_club_discussion_comments',
    'book_club_discussions', 'book_club_members', 'book_clubs', 'book_genre_mappings',
    'book_genres', 'book_publishers', 'book_recommendations', 'book_reviews',
    'book_similarity_scores', 'book_subjects', 'book_tag_mappings', 'book_tags',
    'book_views', 'carousel_images', 'contact_info', 'countries', 'discussion_comments',
    'discussions', 'event_analytics', 'event_approvals', 'event_books', 'event_calendar_exports',
    'event_categories', 'event_chat_messages', 'event_chat_rooms', 'event_comments',
    'event_creator_permissions', 'event_financials', 'event_interests', 'event_likes',
    'event_livestreams', 'event_locations', 'event_media', 'event_permission_requests',
    'event_questions', 'event_registrations', 'event_reminders', 'event_sessions',
    'event_shares', 'event_speakers', 'event_sponsors', 'event_staff', 'event_surveys',
    'event_tags', 'event_types', 'event_views', 'event_waitlists', 'feed_entries',
    'feed_entry_tags', 'follow_target_types', 'follows', 'format_types', 'friends',
    'group_achievements', 'group_analytics', 'group_announcements', 'group_audit_log',
    'group_author_events', 'group_book_list_items', 'group_book_lists', 'group_book_reviews',
    'group_book_swaps', 'group_book_wishlist_items', 'group_book_wishlists', 'group_bots',
    'group_chat_channels', 'group_chat_message_attachments', 'group_chat_message_reactions',
    'group_chat_messages', 'group_content_moderation_logs', 'group_custom_fields',
    'group_discussion_categories', 'group_event_feedback', 'group_events', 'group_integrations',
    'group_invites', 'group_leaderboards', 'group_member_achievements', 'group_member_devices',
    'group_member_streaks', 'group_members', 'group_membership_questions', 'group_moderation_logs',
    'group_onboarding_checklists', 'group_onboarding_progress', 'group_onboarding_tasks',
    'group_poll_votes', 'group_polls', 'group_reading_challenge_progress', 'group_reading_challenges',
    'group_reading_progress', 'group_reading_sessions', 'group_reports', 'group_roles',
    'group_rules', 'group_shared_documents', 'group_tags', 'group_types', 'group_webhook_logs',
    'group_webhooks', 'group_welcome_messages', 'id_mappings', 'image_tag_mappings',
    'image_tags', 'image_types', 'images', 'invoices', 'list_followers', 'media_attachments',
    'mentions', 'notifications', 'payment_methods', 'payment_transactions', 'personalized_recommendations',
    'photo_album', 'posts', 'prices', 'promo_codes', 'reactions', 'reading_challenges',
    'reading_goals', 'reading_list_items', 'reading_lists', 'reading_progress', 'reading_series',
    'reading_sessions', 'reading_stats_daily', 'reading_streaks', 'review_likes', 'reviews',
    'roles', 'series_events', 'session_registrations', 'similar_books', 'statuses',
    'subjects', 'survey_questions', 'survey_responses', 'sync_state', 'tags',
    'ticket_benefits', 'ticket_types', 'tickets', 'user_book_interactions', 'user_reading_preferences'
)
ORDER BY tablename;

-- Summary
SELECT 'All security issues have been fixed. Check the results above to verify all tables have RLS policies.' as status; 