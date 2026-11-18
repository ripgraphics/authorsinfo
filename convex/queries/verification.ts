import { query } from '../_generated/server'
import { v } from 'convex/values'

export default query({
  handler: async (ctx) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allTablesResult: Record<string, number> = {};
    
    // Get list of all tables we know about and count each
    const tableNames = [
      "authors", "books", "book_authors", "follows", "friends", 
      "users", "groups", "reviews", "bookmarks", "reading_lists",
      "reading_progress", "comments", "likes", "notifications",
      "messages", "direct_conversations", "group_members",
      "enterprise_audit_trail", "book_subjects", "publishers",
      "subjects", "tags", "readings", "shelves",
      "achievements", "activity_log", "activity_stream",
      "ai_image_analysis", "album_analytics", "album_images",
      "api_cache", "api_rate_limits", "automation_executions",
      "automation_workflows", "badges", "binding_types", "blocks",
      "book_club_books", "book_club_discussions", "book_club_members",
      "book_clubs", "book_genre_mappings", "book_genres", "book_id_mapping",
      "book_popularity_metrics", "book_recommendations", "book_similarity_scores",
      "call_provider_config", "call_sessions", "carousel_images",
      "challenge_tracking", "club_discussions", "club_reading_schedules",
      "cohort_members", "cohort_retention_snapshots", "collaboration_sessions",
      "collaborative_filtering_data", "comment_audits", "comment_event_meta",
      "comment_rate_limits", "comment_reactions", "comment_versions",
      "contact_info", "content_features", "content_flags", "content_generation_jobs",
      "countries", "custom_permissions", "custom_shelves", "daily_active_users",
      "data_enrichment_jobs", "deployment_logs", "deployments",
      "dewey_decimal_classifications", "direct_conversation_messages",
      "direct_conversation_read_state", "direct_conversation_settings",
      "direct_message_attachments", "direct_message_deletions",
      "direct_message_pins", "direct_message_reactions", "direct_message_reports",
      "direct_message_requests", "direct_message_restrictions",
      "discussions", "email_notification_logs", "engagement_analytics",
      "engagement_types", "entity_types", "images", "event_analytics",
      "event_approvals", "event_books", "event_calendar_exports",
      "event_categories", "event_chat_messages", "event_chat_rooms",
      "event_creator_permissions", "event_financials", "event_interests",
      "event_livestreams", "event_locations", "event_media",
      "event_participants", "event_permission_requests", "event_questions",
      "event_registrations", "event_reminders", "event_sessions",
      "event_speakers", "event_sponsors", "event_staff", "event_surveys",
      "event_types", "event_waitlists", "events", "feed_entries",
      "follow_target_types", "format_types", "friend_activities",
      "friend_analytics", "friend_suggestions", "group_achievements",
      "group_analytics", "group_announcements", "group_audit_log",
      "group_author_events", "group_book_list_items", "group_book_lists",
      "group_book_swaps", "group_book_wishlist_items", "group_book_wishlists",
      "group_books", "group_bots", "group_chat_channel_read_state",
      "group_chat_channels", "group_chat_message_attachments",
      "group_chat_message_reactions", "group_chat_messages",
      "group_chat_reports", "group_content_moderation_logs",
      "group_conversation_settings", "group_custom_fields",
      "group_discussion_categories", "group_event_feedback", "group_events",
      "group_integrations", "group_invitations", "group_invites",
      "group_leaderboards", "group_member_achievements", "group_member_devices",
      "group_member_streaks", "group_onboarding_checklists",
      "group_onboarding_progress", "group_onboarding_tasks",
      "group_poll_votes", "group_polls", "group_reading_challenge_progress",
      "group_reading_challenges", "group_reading_progress",
      "group_reading_sessions", "group_reports", "group_roles", "group_rules",
      "group_shared_documents", "group_types", "group_webhook_logs",
      "group_webhooks", "group_welcome_messages", "id_mappings",
      "image_processing_jobs", "integration_events", "invoices",
      "leaderboard_cache", "list_followers", "media_attachments",
      "mentions", "ml_models", "ml_predictions", "ml_training_jobs",
      "moderation_queue", "user_cohorts", "push_subscriptions",
      "segment_distributions", "segment_events", "segment_members",
      "user_segments", "user_presence", "nlp_analysis",
      "notification_preferences", "notification_push_outbox",
      "notification_queue", "payment_methods", "payment_transactions",
      "performance_metrics", "personalized_recommendations",
      "photo_album", "post_analytics", "prices", "privacy_audit_log",
      "profiles", "promo_codes", "qa_answers", "qa_question_votes",
      "qa_questions", "qa_sessions", "reading_calendar_days",
      "reading_challenges", "reading_goals", "reading_list_items",
      "reading_series", "reading_sessions", "reading_stats_daily",
      "reading_streaks", "roles", "series_events", "session_participants",
      "session_registrations", "shares", "shelf_books", "similar_books",
      "smart_notifications", "social_audit_log", "statuses",
      "survey_questions", "survey_responses", "sync_state",
      "test_cases", "test_executions", "test_suites", "ticket_benefits",
      "ticket_types", "tickets", "trending_topics", "user_badges",
      "user_book_interactions", "user_friends", "user_privacy_settings",
      "user_reading_preferences", "webhook_deliveries", "webhook_subscriptions",
      // Additional tables imported after initial migration
      "photo_albums", "posts", "views", "enterprise_data_quality_rules",
      "enterprise_data_lineage", "group_invitations", "direct_message_deletions",
            "direct_message_pins", "book_authors", "comments", "album_images",
            "carousel_images", "reading_progress", "event_registrations"
          ] as const;
    
    for (const tableName of tableNames) {
      try {
              // @ts-ignore - tableName may not be in the schema but we catch errors
        const docs = await ctx.db.query(tableName).collect();
        allTablesResult[tableName] = docs.length;
      } catch (e) {
        allTablesResult[tableName] = 0;
      }
    }
    
    return allTablesResult;
  },
});
