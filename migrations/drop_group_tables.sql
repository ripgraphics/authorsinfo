-- Drop group-related triggers first
DROP TRIGGER IF EXISTS group_created_trigger ON groups;
DROP TRIGGER IF EXISTS group_updated_trigger ON groups;

-- Drop group-related functions
DROP FUNCTION IF EXISTS create_group_activity();
DROP FUNCTION IF EXISTS update_group_activity();

-- Drop dependent tables first (those with foreign keys to groups)
DROP TABLE IF EXISTS group_welcome_messages;
DROP TABLE IF EXISTS group_webhooks;
DROP TABLE IF EXISTS group_webhook_logs;
DROP TABLE IF EXISTS group_tags;
DROP TABLE IF EXISTS group_shared_documents;
DROP TABLE IF EXISTS group_roles;
DROP TABLE IF EXISTS group_reports;
DROP TABLE IF EXISTS group_reading_sessions;
DROP TABLE IF EXISTS group_reading_progress;
DROP TABLE IF EXISTS group_reading_challenges;
DROP TABLE IF EXISTS group_reading_challenge_progress;
DROP TABLE IF EXISTS group_polls;
DROP TABLE IF EXISTS group_poll_votes;
DROP TABLE IF EXISTS group_onboarding_tasks;
DROP TABLE IF EXISTS group_onboarding_progress;
DROP TABLE IF EXISTS group_onboarding_checklists;
DROP TABLE IF EXISTS group_moderation_logs;
DROP TABLE IF EXISTS group_membership_questions;
DROP TABLE IF EXISTS group_members;
DROP TABLE IF EXISTS group_leaderboards;
DROP TABLE IF EXISTS group_invites;
DROP TABLE IF EXISTS group_integrations;
DROP TABLE IF EXISTS group_events;
DROP TABLE IF EXISTS group_event_feedback;
DROP TABLE IF EXISTS group_discussion_categories;
DROP TABLE IF EXISTS group_custom_fields;
DROP TABLE IF EXISTS group_content_moderation_logs;
DROP TABLE IF EXISTS group_chat_messages;
DROP TABLE IF EXISTS group_chat_message_reactions;
DROP TABLE IF EXISTS group_chat_message_attachments;
DROP TABLE IF EXISTS group_chat_channels;
DROP TABLE IF EXISTS group_bots;
DROP TABLE IF EXISTS group_book_wishlists;
DROP TABLE IF EXISTS group_book_wishlist_items;
DROP TABLE IF EXISTS group_book_swaps;
DROP TABLE IF EXISTS group_book_reviews;
DROP TABLE IF EXISTS group_book_lists;
DROP TABLE IF EXISTS group_book_list_items;
DROP TABLE IF EXISTS group_author_events;
DROP TABLE IF EXISTS group_announcements;
DROP TABLE IF EXISTS group_analytics;
DROP TABLE IF EXISTS group_achievements;
DROP TABLE IF EXISTS group_member_achievements;
DROP TABLE IF EXISTS group_member_devices;
DROP TABLE IF EXISTS group_member_streaks;

-- Drop the main groups table last
DROP TABLE IF EXISTS groups;

-- Remove group-related columns from other tables
ALTER TABLE activities DROP COLUMN IF EXISTS group_id;
ALTER TABLE events DROP COLUMN IF EXISTS group_id;
ALTER TABLE book_reviews DROP COLUMN IF EXISTS group_id;
ALTER TABLE book_discussions DROP COLUMN IF EXISTS group_id; 