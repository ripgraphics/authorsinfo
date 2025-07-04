# Comprehensive Database Analysis Report
Generated on: 2025-07-03 00:17:32

## 📊 Executive Summary

### Database Overview
- **Total Schemas**: 6
- **Total Types**: 10
- **Total Functions**: 42
- **Total Tables**: 199
- **Total Triggers**: 3
- **Total Indexes**: 36
- **Total Policies**: 6
- **Total Relationships**: 19
- **Total Constraints**: 70

## 🏗️ Schema Architecture

### Schemas (6)
- `auth`
- `extensions`
- `graphql_public`
- `public`
- `realtime`
- `storage`

### Custom Types (10)
- `auth.aal_level`
- `auth.code_challenge_method`
- `auth.factor_status`
- `auth.factor_type`
- `auth.one_time_token_type`
- `realtime.action`
- `realtime.equality_op`
- `realtime.user_defined_filter`
- `realtime.wal_column`
- `realtime.wal_rls`

## 📋 Table Analysis

### Table Statistics
- **Total Tables**: 0
- **Average Columns per Table**: 0.0
- **Largest Table**: N/A (0 columns)

### Tables by Schema

## 🔗 Relationships Analysis

### Foreign Key Relationships (19)
- `user_id` → `auth.users.id`
- `session_id` → `auth.sessions.id`
- `factor_id` → `auth.mfa_factors.id`
- `user_id` → `auth.users.id`
- `user_id` → `auth.users.id`
- `session_id` → `auth.sessions.id`
- `sso_provider_id` → `auth.sso_providers.id`
- `flow_state_id` → `auth.flow_state.id`
- `sso_provider_id` → `auth.sso_providers.id`
- `user_id` → `auth.users.id`
- `sso_provider_id` → `auth.sso_providers.id`
- `parent_code` → `public.dewey_decimal_classifications.code`
- `friend_id` → `auth.users.id`
- `requested_by` → `auth.users.id`
- `user_id` → `auth.users.id`
- `bucket_id` → `storage.buckets.id`
- `bucket_id` → `storage.buckets.id`
- `bucket_id` → `storage.buckets.id`
- `upload_id` → `storage.s3_multipart_uploads.id`

## ⚡ Functions Analysis

### Functions by Schema

#### auth Schema (4 functions)
- `email`
- `jwt`
- `role`
- `uid`

#### extensions Schema (6 functions)
- `grant_pg_cron_access`
- `grant_pg_graphql_access`
- `grant_pg_net_access`
- `pgrst_ddl_watch`
- `pgrst_drop_watch`
- `set_graphql_placeholder`

#### public Schema (10 functions)
- `extract_book_dimensions`
- `get_user_feed_activities`
- `handle_album_privacy_update`
- `handle_public_album_creation`
- `populate_dewey_decimal_classifications`
- `process_complete_isbndb_book_data`
- `process_dewey_decimal_classifications`
- `process_other_isbns`
- `process_related_books`
- `update_updated_at_column`

#### realtime Schema (12 functions)
- `apply_rls`
- `broadcast_changes`
- `build_prepared_statement_sql`
- `cast`
- `check_equality_op`
- `is_visible_through_filters`
- `list_changes`
- `quote_wal2json`
- `send`
- `subscription_check_filters`
- `to_regrole`
- `topic`

#### storage Schema (10 functions)
- `can_insert_object`
- `extension`
- `filename`
- `foldername`
- `get_size_by_bucket`
- `list_multipart_uploads_with_delimiter`
- `list_objects_with_delimiter`
- `operation`
- `search`
- `update_updated_at_column`

## 🔒 Security Analysis

### Row Level Security Policies (6)
- `Allow admin access to dewey_decimal_classifications`
- `Allow read access to dewey_decimal_classifications`
- `Users can create friend requests`
- `Users can delete their own friends`
- `Users can update their own friends`
- `Users can view their own friends`

## 🚀 Performance Analysis

### Indexes (36)
- `audit_logs_instance_id_idx`
- `factor_id_created_at_idx`
- `flow_state_created_at_idx`
- `identities_email_idx`
- `identities_user_id_idx`
- `idx_auth_code`
- `idx_user_id_auth_method`
- `mfa_challenge_created_at_idx`
- `mfa_factors_user_id_idx`
- `one_time_tokens_relates_to_hash_idx`
- `one_time_tokens_token_hash_hash_idx`
- `refresh_tokens_instance_id_idx`
- `refresh_tokens_instance_id_user_id_idx`
- `refresh_tokens_parent_idx`
- `refresh_tokens_session_id_revoked_idx`
- `refresh_tokens_updated_at_idx`
- `saml_providers_sso_provider_id_idx`
- `saml_relay_states_created_at_idx`
- `saml_relay_states_for_email_idx`
- `saml_relay_states_sso_provider_id_idx`
- `sessions_not_after_idx`
- `sessions_user_id_idx`
- `sso_domains_sso_provider_id_idx`
- `user_id_created_at_idx`
- `users_instance_id_email_idx`
- `users_instance_id_idx`
- `users_is_anonymous_idx`
- `idx_dewey_decimal_classifications_code`
- `idx_dewey_decimal_classifications_parent_code`
- `idx_user_friends_friend_id`
- `idx_user_friends_status`
- `idx_user_friends_user_id`
- `ix_realtime_subscription_entity`
- `idx_multipart_uploads_list`
- `idx_objects_bucket_id_name`
- `name_prefix_search`

## 🎯 Key Features Identified

### Core Systems

## 📈 Recommendations

### Performance
- Consider adding indexes on frequently queried columns
- Review query patterns for optimization opportunities

### Security
- Ensure all tables have appropriate RLS policies
- Review function permissions and access controls

### Maintenance
- Regular backup and monitoring of large tables
- Consider partitioning for high-volume tables

## 🔍 Detailed Table Information

