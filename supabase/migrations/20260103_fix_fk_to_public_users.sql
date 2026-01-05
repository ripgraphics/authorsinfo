-- ============================================================================
-- FIX FOREIGN KEY CONSTRAINTS: auth.users → public.users
-- This migration changes all FK references from auth.users to public.users
-- Prerequisites: Run 20260103_restore_user_sync_triggers.sql first to sync users
-- ============================================================================

-- Disable triggers temporarily for performance
SET session_replication_role = replica;

-- ============================================================================
-- DROP and RECREATE FK constraints pointing to auth.users
-- ============================================================================

-- achievements
ALTER TABLE "public"."achievements" DROP CONSTRAINT IF EXISTS "achievements_user_id_fkey";
ALTER TABLE "public"."achievements" ADD CONSTRAINT "achievements_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- activity_log
ALTER TABLE "public"."activity_log" DROP CONSTRAINT IF EXISTS "activity_log_user_id_fkey";
ALTER TABLE "public"."activity_log" ADD CONSTRAINT "activity_log_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;

-- activity_stream
ALTER TABLE "public"."activity_stream" DROP CONSTRAINT IF EXISTS "activity_stream_related_user_id_fkey";
ALTER TABLE "public"."activity_stream" ADD CONSTRAINT "activity_stream_related_user_id_fkey" 
  FOREIGN KEY ("related_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;

ALTER TABLE "public"."activity_stream" DROP CONSTRAINT IF EXISTS "activity_stream_user_id_fkey";
ALTER TABLE "public"."activity_stream" ADD CONSTRAINT "activity_stream_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- automation_workflows
ALTER TABLE "public"."automation_workflows" DROP CONSTRAINT IF EXISTS "automation_workflows_created_by_fkey";
ALTER TABLE "public"."automation_workflows" ADD CONSTRAINT "automation_workflows_created_by_fkey" 
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");

-- book_club_books
ALTER TABLE "public"."book_club_books" DROP CONSTRAINT IF EXISTS "book_club_books_created_by_fkey";
ALTER TABLE "public"."book_club_books" ADD CONSTRAINT "book_club_books_created_by_fkey" 
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;

-- book_club_discussions
ALTER TABLE "public"."book_club_discussions" DROP CONSTRAINT IF EXISTS "book_club_discussions_created_by_fkey";
ALTER TABLE "public"."book_club_discussions" ADD CONSTRAINT "book_club_discussions_created_by_fkey" 
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- book_club_members
ALTER TABLE "public"."book_club_members" DROP CONSTRAINT IF EXISTS "book_club_members_user_id_fkey";
ALTER TABLE "public"."book_club_members" ADD CONSTRAINT "book_club_members_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- book_clubs
ALTER TABLE "public"."book_clubs" DROP CONSTRAINT IF EXISTS "book_clubs_created_by_fkey";
ALTER TABLE "public"."book_clubs" ADD CONSTRAINT "book_clubs_created_by_fkey" 
  FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- book_reviews
ALTER TABLE "public"."book_reviews" DROP CONSTRAINT IF EXISTS "book_reviews_user_id_fkey";
ALTER TABLE "public"."book_reviews" ADD CONSTRAINT "book_reviews_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- book_views
ALTER TABLE "public"."book_views" DROP CONSTRAINT IF EXISTS "book_views_user_id_fkey";
ALTER TABLE "public"."book_views" ADD CONSTRAINT "book_views_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;

-- bookmarks
ALTER TABLE "public"."bookmarks" DROP CONSTRAINT IF EXISTS "bookmarks_user_id_fkey";
ALTER TABLE "public"."bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- club_discussions
ALTER TABLE "public"."club_discussions" DROP CONSTRAINT IF EXISTS "club_discussions_user_id_fkey";
ALTER TABLE "public"."club_discussions" ADD CONSTRAINT "club_discussions_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- cohort_members
ALTER TABLE "public"."cohort_members" DROP CONSTRAINT IF EXISTS "cohort_members_user_id_fkey";
ALTER TABLE "public"."cohort_members" ADD CONSTRAINT "cohort_members_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- collaboration_sessions
ALTER TABLE "public"."collaboration_sessions" DROP CONSTRAINT IF EXISTS "collaboration_sessions_created_by_fkey";
ALTER TABLE "public"."collaboration_sessions" ADD CONSTRAINT "collaboration_sessions_created_by_fkey" 
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- collaborative_filtering_data
ALTER TABLE "public"."collaborative_filtering_data" DROP CONSTRAINT IF EXISTS "collaborative_filtering_data_user_id_fkey";
ALTER TABLE "public"."collaborative_filtering_data" ADD CONSTRAINT "collaborative_filtering_data_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");

-- comments
ALTER TABLE "public"."comments" DROP CONSTRAINT IF EXISTS "comments_user_id_fkey";
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- content_flags
ALTER TABLE "public"."content_flags" DROP CONSTRAINT IF EXISTS "content_flags_flagged_by_fkey";
ALTER TABLE "public"."content_flags" ADD CONSTRAINT "content_flags_flagged_by_fkey" 
  FOREIGN KEY ("flagged_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."content_flags" DROP CONSTRAINT IF EXISTS "content_flags_moderated_by_fkey";
ALTER TABLE "public"."content_flags" ADD CONSTRAINT "content_flags_moderated_by_fkey" 
  FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;

-- content_generation_jobs
ALTER TABLE "public"."content_generation_jobs" DROP CONSTRAINT IF EXISTS "content_generation_jobs_created_by_fkey";
ALTER TABLE "public"."content_generation_jobs" ADD CONSTRAINT "content_generation_jobs_created_by_fkey" 
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");

-- custom_shelves
ALTER TABLE "public"."custom_shelves" DROP CONSTRAINT IF EXISTS "custom_shelves_user_id_fkey";
ALTER TABLE "public"."custom_shelves" ADD CONSTRAINT "custom_shelves_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- daily_active_users
ALTER TABLE "public"."daily_active_users" DROP CONSTRAINT IF EXISTS "daily_active_users_user_id_fkey";
ALTER TABLE "public"."daily_active_users" ADD CONSTRAINT "daily_active_users_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- data_enrichment_jobs
ALTER TABLE "public"."data_enrichment_jobs" DROP CONSTRAINT IF EXISTS "data_enrichment_jobs_created_by_fkey";
ALTER TABLE "public"."data_enrichment_jobs" ADD CONSTRAINT "data_enrichment_jobs_created_by_fkey" 
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");

-- engagement_views
ALTER TABLE "public"."engagement_views" DROP CONSTRAINT IF EXISTS "engagement_views_user_id_fkey";
ALTER TABLE "public"."engagement_views" ADD CONSTRAINT "engagement_views_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- event_comments
ALTER TABLE "public"."event_comments" DROP CONSTRAINT IF EXISTS "event_comments_user_id_fkey";
ALTER TABLE "public"."event_comments" ADD CONSTRAINT "event_comments_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- event_participants
ALTER TABLE "public"."event_participants" DROP CONSTRAINT IF EXISTS "event_participants_user_id_fkey";
ALTER TABLE "public"."event_participants" ADD CONSTRAINT "event_participants_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- event_speakers
ALTER TABLE "public"."event_speakers" DROP CONSTRAINT IF EXISTS "event_speakers_user_id_fkey";
ALTER TABLE "public"."event_speakers" ADD CONSTRAINT "event_speakers_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;

-- follows
ALTER TABLE "public"."follows" DROP CONSTRAINT IF EXISTS "follows_follower_id_fkey";
ALTER TABLE "public"."follows" ADD CONSTRAINT "follows_follower_id_fkey" 
  FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- friend_activities
ALTER TABLE "public"."friend_activities" DROP CONSTRAINT IF EXISTS "friend_activities_friend_id_fkey";
ALTER TABLE "public"."friend_activities" ADD CONSTRAINT "friend_activities_friend_id_fkey" 
  FOREIGN KEY ("friend_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."friend_activities" DROP CONSTRAINT IF EXISTS "friend_activities_user_id_fkey";
ALTER TABLE "public"."friend_activities" ADD CONSTRAINT "friend_activities_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- friend_analytics
ALTER TABLE "public"."friend_analytics" DROP CONSTRAINT IF EXISTS "friend_analytics_user_id_fkey";
ALTER TABLE "public"."friend_analytics" ADD CONSTRAINT "friend_analytics_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- friend_suggestions
ALTER TABLE "public"."friend_suggestions" DROP CONSTRAINT IF EXISTS "friend_suggestions_suggested_user_id_fkey";
ALTER TABLE "public"."friend_suggestions" ADD CONSTRAINT "friend_suggestions_suggested_user_id_fkey" 
  FOREIGN KEY ("suggested_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."friend_suggestions" DROP CONSTRAINT IF EXISTS "friend_suggestions_user_id_fkey";
ALTER TABLE "public"."friend_suggestions" ADD CONSTRAINT "friend_suggestions_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- friends
ALTER TABLE "public"."friends" DROP CONSTRAINT IF EXISTS "friends_friend_id_fkey";
ALTER TABLE "public"."friends" ADD CONSTRAINT "friends_friend_id_fkey" 
  FOREIGN KEY ("friend_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."friends" DROP CONSTRAINT IF EXISTS "friends_user_id_fkey";
ALTER TABLE "public"."friends" ADD CONSTRAINT "friends_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- group_members
ALTER TABLE "public"."group_members" DROP CONSTRAINT IF EXISTS "group_members_user_id_fkey";
ALTER TABLE "public"."group_members" ADD CONSTRAINT "group_members_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- leaderboard_cache
ALTER TABLE "public"."leaderboard_cache" DROP CONSTRAINT IF EXISTS "leaderboard_cache_user_id_fkey";
ALTER TABLE "public"."leaderboard_cache" ADD CONSTRAINT "leaderboard_cache_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- likes
ALTER TABLE "public"."likes" DROP CONSTRAINT IF EXISTS "likes_user_id_fkey";
ALTER TABLE "public"."likes" ADD CONSTRAINT "likes_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- ml_models
ALTER TABLE "public"."ml_models" DROP CONSTRAINT IF EXISTS "ml_models_created_by_fkey";
ALTER TABLE "public"."ml_models" ADD CONSTRAINT "ml_models_created_by_fkey" 
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");

-- ml_predictions
ALTER TABLE "public"."ml_predictions" DROP CONSTRAINT IF EXISTS "ml_predictions_user_id_fkey";
ALTER TABLE "public"."ml_predictions" ADD CONSTRAINT "ml_predictions_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");

-- moderation_queue
ALTER TABLE "public"."moderation_queue" DROP CONSTRAINT IF EXISTS "moderation_queue_assigned_to_fkey";
ALTER TABLE "public"."moderation_queue" ADD CONSTRAINT "moderation_queue_assigned_to_fkey" 
  FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE SET NULL;

-- notification_preferences
ALTER TABLE "public"."notification_preferences" DROP CONSTRAINT IF EXISTS "notification_preferences_user_id_fkey";
ALTER TABLE "public"."notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- notifications
ALTER TABLE "public"."notifications" DROP CONSTRAINT IF EXISTS "notifications_recipient_id_fkey";
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" 
  FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- photo_albums
ALTER TABLE "public"."photo_albums" DROP CONSTRAINT IF EXISTS "photo_albums_owner_id_fkey";
ALTER TABLE "public"."photo_albums" ADD CONSTRAINT "photo_albums_owner_id_fkey" 
  FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- photo_analytics
ALTER TABLE "public"."photo_analytics" DROP CONSTRAINT IF EXISTS "photo_analytics_user_id_fkey";
ALTER TABLE "public"."photo_analytics" ADD CONSTRAINT "photo_analytics_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;

-- photo_community
ALTER TABLE "public"."photo_community" DROP CONSTRAINT IF EXISTS "photo_community_user_id_fkey";
ALTER TABLE "public"."photo_community" ADD CONSTRAINT "photo_community_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- photo_monetization
ALTER TABLE "public"."photo_monetization" DROP CONSTRAINT IF EXISTS "photo_monetization_user_id_fkey";
ALTER TABLE "public"."photo_monetization" ADD CONSTRAINT "photo_monetization_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;

-- push_subscriptions
ALTER TABLE "public"."push_subscriptions" DROP CONSTRAINT IF EXISTS "push_subscriptions_user_id_fkey";
ALTER TABLE "public"."push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- qa_answers
ALTER TABLE "public"."qa_answers" DROP CONSTRAINT IF EXISTS "qa_answers_responder_id_fkey";
ALTER TABLE "public"."qa_answers" ADD CONSTRAINT "qa_answers_responder_id_fkey" 
  FOREIGN KEY ("responder_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- qa_question_votes
ALTER TABLE "public"."qa_question_votes" DROP CONSTRAINT IF EXISTS "qa_question_votes_user_id_fkey";
ALTER TABLE "public"."qa_question_votes" ADD CONSTRAINT "qa_question_votes_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- qa_questions
ALTER TABLE "public"."qa_questions" DROP CONSTRAINT IF EXISTS "qa_questions_user_id_fkey";
ALTER TABLE "public"."qa_questions" ADD CONSTRAINT "qa_questions_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;

-- qa_sessions
ALTER TABLE "public"."qa_sessions" DROP CONSTRAINT IF EXISTS "qa_sessions_host_id_fkey";
ALTER TABLE "public"."qa_sessions" ADD CONSTRAINT "qa_sessions_host_id_fkey" 
  FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- reading_calendar_days
ALTER TABLE "public"."reading_calendar_days" DROP CONSTRAINT IF EXISTS "reading_calendar_days_user_id_fkey";
ALTER TABLE "public"."reading_calendar_days" ADD CONSTRAINT "reading_calendar_days_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- reading_lists
ALTER TABLE "public"."reading_lists" DROP CONSTRAINT IF EXISTS "reading_lists_user_id_fkey";
ALTER TABLE "public"."reading_lists" ADD CONSTRAINT "reading_lists_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- reading_progress
ALTER TABLE "public"."reading_progress" DROP CONSTRAINT IF EXISTS "reading_progress_user_id_fkey";
ALTER TABLE "public"."reading_progress" ADD CONSTRAINT "reading_progress_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- segment_events
ALTER TABLE "public"."segment_events" DROP CONSTRAINT IF EXISTS "segment_events_user_id_fkey";
ALTER TABLE "public"."segment_events" ADD CONSTRAINT "segment_events_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- segment_members
ALTER TABLE "public"."segment_members" DROP CONSTRAINT IF EXISTS "segment_members_user_id_fkey";
ALTER TABLE "public"."segment_members" ADD CONSTRAINT "segment_members_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- session_participants
ALTER TABLE "public"."session_participants" DROP CONSTRAINT IF EXISTS "session_participants_user_id_fkey";
ALTER TABLE "public"."session_participants" ADD CONSTRAINT "session_participants_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- shares
ALTER TABLE "public"."shares" DROP CONSTRAINT IF EXISTS "shares_user_id_fkey";
ALTER TABLE "public"."shares" ADD CONSTRAINT "shares_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- smart_notifications
ALTER TABLE "public"."smart_notifications" DROP CONSTRAINT IF EXISTS "smart_notifications_user_id_fkey";
ALTER TABLE "public"."smart_notifications" ADD CONSTRAINT "smart_notifications_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");

-- social_audit_log
ALTER TABLE "public"."social_audit_log" DROP CONSTRAINT IF EXISTS "social_audit_log_user_id_fkey";
ALTER TABLE "public"."social_audit_log" ADD CONSTRAINT "social_audit_log_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;

-- tags
ALTER TABLE "public"."tags" DROP CONSTRAINT IF EXISTS "tags_tagged_by_fkey";
ALTER TABLE "public"."tags" ADD CONSTRAINT "tags_tagged_by_fkey" 
  FOREIGN KEY ("tagged_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;

ALTER TABLE "public"."tags" DROP CONSTRAINT IF EXISTS "tags_verified_by_fkey";
ALTER TABLE "public"."tags" ADD CONSTRAINT "tags_verified_by_fkey" 
  FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;

-- user_badges
ALTER TABLE "public"."user_badges" DROP CONSTRAINT IF EXISTS "user_badges_user_id_fkey";
ALTER TABLE "public"."user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- user_cohorts
ALTER TABLE "public"."user_cohorts" DROP CONSTRAINT IF EXISTS "user_cohorts_created_by_fkey";
ALTER TABLE "public"."user_cohorts" ADD CONSTRAINT "user_cohorts_created_by_fkey" 
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;

-- user_friends
ALTER TABLE "public"."user_friends" DROP CONSTRAINT IF EXISTS "user_friends_friend_id_fkey";
ALTER TABLE "public"."user_friends" ADD CONSTRAINT "user_friends_friend_id_fkey" 
  FOREIGN KEY ("friend_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."user_friends" DROP CONSTRAINT IF EXISTS "user_friends_requested_by_fkey";
ALTER TABLE "public"."user_friends" ADD CONSTRAINT "user_friends_requested_by_fkey" 
  FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."user_friends" DROP CONSTRAINT IF EXISTS "user_friends_user_id_fkey";
ALTER TABLE "public"."user_friends" ADD CONSTRAINT "user_friends_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- user_presence
ALTER TABLE "public"."user_presence" DROP CONSTRAINT IF EXISTS "user_presence_user_id_fkey";
ALTER TABLE "public"."user_presence" ADD CONSTRAINT "user_presence_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- user_segments
ALTER TABLE "public"."user_segments" DROP CONSTRAINT IF EXISTS "user_segments_created_by_fkey";
ALTER TABLE "public"."user_segments" ADD CONSTRAINT "user_segments_created_by_fkey" 
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'All FK constraints updated to reference public.users';
END $$;
