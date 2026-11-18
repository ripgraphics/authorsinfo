const https = require('https');
const fs = require('fs');
const path = require('path');

// Load credentials
let serviceKey = null;
for (const f of ['.env new copy .local', '.env old.local', '.env.local']) {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), f), 'utf8');
    const match = content.match(/SUPABASE_SERVICE_ROLE_KEY="([^"]+)"/);
    if (match) {
      serviceKey = match[1].replace(/\r/g, '').trim();
      console.log(`Loaded service key from ${f}`);
      break;
    }
  } catch {}
}

if (!serviceKey) {
  console.error('Could not find SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseUrl = 'adccinsmmmocxeylisbn.supabase.co';

// Get Convex counts from latest run (production deployment sleek-gerbil-105)
const convexCounts = {
  achievements: 0, activity_log: 0, activity_stream: 5, ai_image_analysis: 0, album_analytics: 0, album_images: 814,
  api_cache: 0, api_rate_limits: 0, authors: 696, automation_executions: 0, automation_workflows: 0, badges: 10,
  binding_types: 17, blocks: 0, book_authors: 859, book_club_books: 0, book_club_discussions: 0, book_club_members: 0,
  book_clubs: 0, book_genre_mappings: 0, book_genres: 0, book_id_mapping: 0, book_popularity_metrics: 52,
  book_recommendations: 0, book_similarity_scores: 0, book_subjects: 3001, bookmarks: 0, books: 672, call_provider_config: 8,
  call_sessions: 0, carousel_images: 0, challenge_tracking: 0, club_discussions: 0, club_reading_schedules: 0,
  cohort_members: 0, cohort_retention_snapshots: 7, collaboration_sessions: 0, collaborative_filtering_data: 0,
  comment_audits: 0, comment_event_meta: 0, comment_rate_limits: 0, comment_reactions: 0, comment_versions: 0,
  comments: 78, contact_info: 0, content_features: 0, content_flags: 0, content_generation_jobs: 0, countries: 0,
  custom_permissions: 0, custom_shelves: 26, daily_active_users: 0, data_enrichment_jobs: 0, deployment_logs: 0,
  deployments: 0, dewey_decimal_classifications: 10, direct_conversation_messages: 145, direct_conversation_read_state: 38,
  direct_conversation_settings: 0, direct_conversations: 37, direct_message_attachments: 0, direct_message_deletions: 2,
  direct_message_pins: 1, direct_message_reactions: 2, direct_message_reports: 0, direct_message_requests: 5,
  direct_message_restrictions: 0, discussions: 0, email_notification_logs: 0, engagement_analytics: 1001, engagement_types: 6,
  enterprise_audit_trail: 2501, entity_types: 46, event_analytics: 0, event_approvals: 0, event_books: 0, event_calendar_exports: 0,
  event_categories: 0, event_chat_messages: 0, event_chat_rooms: 0, event_creator_permissions: 0, event_financials: 0,
  event_interests: 0, event_livestreams: 0, event_locations: 0, event_media: 0, event_participants: 0,
  event_permission_requests: 0, event_questions: 0, event_registrations: 0, event_reminders: 0, event_sessions: 0,
  event_speakers: 0, event_sponsors: 0, event_staff: 0, event_surveys: 0, event_types: 0, event_waitlists: 0, events: 0,
  feed_entries: 36, follow_target_types: 5, follows: 255, format_types: 3, friend_activities: 22, friend_analytics: 3,
  friend_suggestions: 0, friends: 9, group_achievements: 0, group_analytics: 0, group_announcements: 0, group_audit_log: 0,
  group_author_events: 0, group_book_list_items: 0, group_book_lists: 0, group_book_swaps: 0, group_book_wishlist_items: 0,
  group_book_wishlists: 0, group_books: 0, group_bots: 0, group_chat_channel_read_state: 0, group_chat_channels: 8,
  group_chat_message_attachments: 0, group_chat_message_reactions: 0, group_chat_messages: 2, group_chat_reports: 0,
  group_content_moderation_logs: 0, group_conversation_settings: 0, group_custom_fields: 0, group_discussion_categories: 0,
  group_event_feedback: 0, group_events: 0, group_integrations: 0, group_invitations: 1, group_invites: 0, group_leaderboards: 0,
  group_member_achievements: 0, group_member_devices: 0, group_member_streaks: 0, group_members: 27, group_onboarding_checklists: 0,
  group_onboarding_progress: 0, group_onboarding_tasks: 0, group_poll_votes: 0, group_polls: 0, group_reading_challenge_progress: 0,
  group_reading_challenges: 0, group_reading_progress: 0, group_reading_sessions: 0, group_reports: 0, group_roles: 5, group_rules: 0,
  group_shared_documents: 0, group_types: 0, group_webhook_logs: 0, group_webhooks: 0, group_welcome_messages: 0, groups: 43,
  id_mappings: 0, image_processing_jobs: 0, images: 1008, integration_events: 0, invoices: 0, leaderboard_cache: 0, list_followers: 0,
  media_attachments: 0, mentions: 0, messages: 0, ml_models: 0, ml_predictions: 0, ml_training_jobs: 0, moderation_queue: 0,
  nlp_analysis: 0, notification_preferences: 313, notification_push_outbox: 0, notification_queue: 0, notifications: 143,
  payment_methods: 0, payment_transactions: 0, performance_metrics: 0, personalized_recommendations: 0, photo_album: 0,
  post_analytics: 52, prices: 0, privacy_audit_log: 0, profiles: 313, promo_codes: 0, publishers: 319, push_subscriptions: 0,
  qa_answers: 0, qa_question_votes: 0, qa_questions: 0, qa_sessions: 0, reading_calendar_days: 0, reading_challenges: 1,
  reading_goals: 0, reading_list_items: 0, reading_lists: 0, reading_progress: 79, reading_series: 0, reading_sessions: 0,
  reading_stats_daily: 0, reading_streaks: 0, readings: 0, reviews: 0, roles: 3, segment_distributions: 28, segment_events: 0,
  segment_members: 0, series_events: 0, session_participants: 0, session_registrations: 0, shares: 0, shelf_books: 0, shelves: 0,
  similar_books: 0, smart_notifications: 0, social_audit_log: 15, statuses: 0, subjects: 1002, survey_questions: 0,
  survey_responses: 0, sync_state: 0, tags: 0, test_cases: 7, test_executions: 0, test_suites: 3, ticket_benefits: 0,
  ticket_types: 0, tickets: 0, trending_topics: 15, user_badges: 0, user_book_interactions: 0, user_friends: 120,
  user_cohorts: 7, user_presence: 0, user_privacy_settings: 313, user_reading_preferences: 0, user_segments: 7, users: 313,
  webhook_deliveries: 0, webhook_subscriptions: 0
};
  group_chat_message_attachments: 0, group_chat_message_reactions: 0, group_chat_messages: 2, group_chat_reports: 0,
  group_content_moderation_logs: 0, group_conversation_settings: 0, group_custom_fields: 0, group_discussion_categories: 0,
  group_event_feedback: 0, group_events: 0, group_integrations: 0, group_invitations: 1, group_invites: 0, group_leaderboards: 0,
  group_member_achievements: 0, group_member_devices: 0, group_member_streaks: 0, group_members: 27, group_onboarding_checklists: 0,
  group_onboarding_progress: 0, group_onboarding_tasks: 0, group_poll_votes: 0, group_polls: 0, group_reading_challenge_progress: 0,
  group_reading_challenges: 0, group_reading_progress: 0, group_reading_sessions: 0, group_reports: 0, group_roles: 5, group_rules: 0,
  group_shared_documents: 0, group_types: 0, group_webhook_logs: 0, group_webhooks: 0, group_welcome_messages: 0, groups: 43,
  id_mappings: 0, image_processing_jobs: 0, images: 1008, integration_events: 0, invoices: 0, leaderboard_cache: 0, list_followers: 0,
  media_attachments: 0, mentions: 0, messages: 0, ml_models: 0, ml_predictions: 0, ml_training_jobs: 0, moderation_queue: 0,
  nlp_analysis: 0, notification_preferences: 313, notification_push_outbox: 0, notification_queue: 0, notifications: 143,
  payment_methods: 0, payment_transactions: 0, performance_metrics: 0, personalized_recommendations: 0, photo_album: 0,
  post_analytics: 52, prices: 0, privacy_audit_log: 0, profiles: 313, promo_codes: 0, publishers: 319, push_subscriptions: 0,
  qa_answers: 0, qa_question_votes: 0, qa_questions: 0, qa_sessions: 0, reading_calendar_days: 0, reading_challenges: 1,
  reading_goals: 0, reading_list_items: 0, reading_lists: 0, reading_progress: 79, reading_series: 0, reading_sessions: 0,
  reading_stats_daily: 0, reading_streaks: 0, readings: 0, reviews: 0, roles: 3, segment_distributions: 28, segment_events: 0,
  segment_members: 0, series_events: 0, session_participants: 0, session_registrations: 0, shares: 0, shelf_books: 0, shelves: 0,
  similar_books: 0, smart_notifications: 0, social_audit_log: 15, statuses: 0, subjects: 1002, survey_questions: 0,
  survey_responses: 0, sync_state: 0, tags: 0, test_cases: 7, test_executions: 0, test_suites: 3, ticket_benefits: 0,
  ticket_types: 0, tickets: 0, trending_topics: 15, user_badges: 0, user_book_interactions: 0, user_friends: 120,
  user_cohorts: 7, user_presence: 0, user_privacy_settings: 313, user_reading_preferences: 0, user_segments: 7, users: 313,
  webhook_deliveries: 0, webhook_subscriptions: 0
};

async function getCount(table) {
  return new Promise((resolve) => {
    const options = {
      hostname: supabaseUrl,
      path: `/rest/v1/${table}?select=id&limit=1`,
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'count=exact'
      }
    };

    const req = https.request(options, res => {
      const count = parseInt(res.headers['content-range']?.split('/')[1] || '0');
      resolve(count || 0);
    });

    req.on('error', e => {
      console.error(`Error querying ${table}:`, e.message);
      resolve(-1);
    });

    req.end();
  });
}

async function main() {
  console.log('Getting row counts from Supabase...\n');
  
  // Get tables from schema
  const schemaContent = fs.readFileSync(path.join(process.cwd(), 'convex', 'schema.ts'), 'utf8');
  const tableMatches = schemaContent.matchAll(/["'](\w+)["']/g);
  const tables = new Set();
  
  // Also load from supabaseTables.ts
  const tablesFile = path.join(process.cwd(), 'convex', 'supabaseTables.ts');
  const tablesContent = fs.readFileSync(tablesFile, 'utf8');
  const matches = tablesContent.matchAll(/["']([a-z_]+)["']/g);
  for (const m of matches) {
    const name = m[1];
    if (name && !name.startsWith('__') && name.length > 2) {
      tables.add(name);
    }
  }
  
  const tableList = Array.from(tables).sort();
  console.log(`Checking ${tableList.length} tables\n`);
  
  const results = [];
  for (let i = 0; i < tableList.length; i++) {
    const table = tableList[i];
    const supabase = await getCount(table);
    const convex = convexCounts[table] || 0;
    
    results.push({
      table,
      supabase,
      convex,
      matched: supabase === convex
    });
    
    if ((i + 1) % 50 === 0) {
      console.log(`  Progress: ${i + 1}/${tableList.length}`);
    }
  }
  
  // Save report
  const reportPath = path.join(process.cwd(), 'artifacts', 'verification-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  // Summary
  const withData = results.filter(r => r.supabase > 0 || r.convex > 0);
  const mismatched = results.filter(r => r.supabase !== r.convex && r.supabase >= 0);
  const errors = results.filter(r => r.supabase === -1);
  
  console.log('\n' + '='.repeat(80));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total tables checked: ${results.length}`);
  console.log(`Tables with data: ${withData.length}`);
  console.log(`Matched exactly: ${results.filter(r => r.matched).length}`);
  console.log(`Mismatched: ${mismatched.length}`);
  console.log(`Errors: ${errors.length}\n`);
  
  if (mismatched.length > 0) {
    console.log('--- MISMATCHES ---');
    mismatched.sort((a, b) => Math.abs(b.supabase - b.convex) - Math.abs(a.supabase - a.convex));
    for (const r of mismatched.slice(0, 30)) {
      const diff = r.supabase - r.convex;
      console.log(`${r.table.padEnd(45)} | Supabase: ${(r.supabase||'ERR').toString().padStart(6)} | Convex: ${String(r.convex).padStart(6)} | Diff: ${(diff >= 0 ? '+' : '')}${diff}`);
    }
  }
  
  console.log('\n--- Tables WITH Data (Top 50) ---');
  const sorted = withData.filter(r => r.supabase > 0).sort((a, b) => b.supabase - a.supabase);
  for (const r of sorted.slice(0, 50)) {
    const status = r.matched ? '✓' : '✗';
    console.log(`${status} ${r.table.padEnd(45)} | S:${String(r.supabase).padStart(6)} C:${String(r.convex).padStart(6)}`);
  }
  
  console.log(`\nReport saved to: ${reportPath}`);
}

main().catch(console.error);
