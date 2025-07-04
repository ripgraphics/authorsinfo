-- Database Restoration Script
-- Generated on: 2025-07-03 00:03:44
-- This script creates all database objects in the correct dependency order

-- =====================================================
-- PHASE 1: CORE INFRASTRUCTURE
-- =====================================================

-- Create schemas first
-- Creating schema: auth
CREATE SCHEMA IF NOT EXISTS "auth";

-- Creating schema: extensions
CREATE SCHEMA IF NOT EXISTS "extensions";

-- Creating schema: graphql_public
CREATE SCHEMA IF NOT EXISTS "graphql_public";

-- Creating schema: public
CREATE SCHEMA IF NOT EXISTS "public";

-- Creating schema: realtime
CREATE SCHEMA IF NOT EXISTS "realtime";

-- Creating schema: storage
CREATE SCHEMA IF NOT EXISTS "storage";

-- =====================================================
-- PHASE 2: TYPES
-- =====================================================

-- Creating type: auth.aal_level
CREATE TYPE "auth"."aal_level" AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);

-- Creating type: auth.code_challenge_method
CREATE TYPE "auth"."code_challenge_method" AS ENUM (
    's256',
    'plain'
);

-- Creating type: auth.factor_status
CREATE TYPE "auth"."factor_status" AS ENUM (
    'unverified',
    'verified'
);

-- Creating type: auth.factor_type
CREATE TYPE "auth"."factor_type" AS ENUM (
    'totp',
    'webauthn',
    'phone'
);

-- Creating type: auth.one_time_token_type
CREATE TYPE "auth"."one_time_token_type" AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);

-- Creating type: realtime.action
CREATE TYPE "realtime"."action" AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);

-- Creating type: realtime.equality_op
CREATE TYPE "realtime"."equality_op" AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);

-- Creating type: realtime.user_defined_filter
CREATE TYPE "realtime"."user_defined_filter" AS (
	"column_name" "text",
	"op" "realtime"."equality_op",
	"value" "text"
);

-- Creating type: realtime.wal_column
CREATE TYPE "realtime"."wal_column" AS (
	"name" "text",
	"type_name" "text",
	"type_oid" "oid",
	"value" "jsonb",
	"is_pkey" boolean,
	"is_selectable" boolean
);

-- Creating type: realtime.wal_rls
CREATE TYPE "realtime"."wal_rls" AS (
	"wal" "jsonb",
	"is_rls_enabled" boolean,
	"subscription_ids" "uuid"[],
	"errors" "text"[]
);

-- =====================================================
-- PHASE 3: TABLES
-- =====================================================

-- Creating table: auth.audit_log_entries
CREATE TABLE IF NOT EXISTS "auth"."audit_log_entries" (
    "instance_id" "uuid",
    "id" "uuid" NOT NULL,
    "payload" "json",
    "created_at" timestamp with time zone,
    "ip_address" character varying(64) DEFAULT ''::character varying NOT NULL
);

-- Creating table: auth.flow_state
CREATE TABLE IF NOT EXISTS "auth"."flow_state" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid",
    "auth_code" "text" NOT NULL,
    "code_challenge_method" "auth"."code_challenge_method" NOT NULL,
    "code_challenge" "text" NOT NULL,
    "provider_type" "text" NOT NULL,
    "provider_access_token" "text",
    "provider_refresh_token" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "authentication_method" "text" NOT NULL,
    "auth_code_issued_at" timestamp with time zone
);

-- Creating table: auth.identities
CREATE TABLE IF NOT EXISTS "auth"."identities" (
    "provider_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "identity_data" "jsonb" NOT NULL,
    "provider" "text" NOT NULL,
    "last_sign_in_at" timestamp with time zone,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "email" "text" GENERATED ALWAYS AS ("lower"(("identity_data" ->> 'email'::"text"))) STORED,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);

-- Creating table: auth.instances
CREATE TABLE IF NOT EXISTS "auth"."instances" (
    "id" "uuid" NOT NULL,
    "uuid" "uuid",
    "raw_base_config" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);

-- Creating table: auth.mfa_amr_claims
CREATE TABLE IF NOT EXISTS "auth"."mfa_amr_claims" (
    "session_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "authentication_method" "text" NOT NULL,
    "id" "uuid" NOT NULL
);

-- Creating table: auth.mfa_challenges
CREATE TABLE IF NOT EXISTS "auth"."mfa_challenges" (
    "id" "uuid" NOT NULL,
    "factor_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "verified_at" timestamp with time zone,
    "ip_address" "inet" NOT NULL,
    "otp_code" "text",
    "web_authn_session_data" "jsonb"
);

-- Creating table: auth.mfa_factors
CREATE TABLE IF NOT EXISTS "auth"."mfa_factors" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friendly_name" "text",
    "factor_type" "auth"."factor_type" NOT NULL,
    "status" "auth"."factor_status" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "secret" "text",
    "phone" "text",
    "last_challenged_at" timestamp with time zone,
    "web_authn_credential" "jsonb",
    "web_authn_aaguid" "uuid"
);

-- Creating table: auth.one_time_tokens
CREATE TABLE IF NOT EXISTS "auth"."one_time_tokens" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token_type" "auth"."one_time_token_type" NOT NULL,
    "token_hash" "text" NOT NULL,
    "relates_to" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "one_time_tokens_token_hash_check" CHECK (("char_length"("token_hash") > 0))
);

-- Creating table: auth.refresh_tokens
CREATE TABLE IF NOT EXISTS "auth"."refresh_tokens" (
    "instance_id" "uuid",
    "id" bigint NOT NULL,
    "token" character varying(255),
    "user_id" character varying(255),
    "revoked" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "parent" character varying(255),
    "session_id" "uuid"
);

-- Creating table: auth.saml_providers
CREATE TABLE IF NOT EXISTS "auth"."saml_providers" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "entity_id" "text" NOT NULL,
    "metadata_xml" "text" NOT NULL,
    "metadata_url" "text",
    "attribute_mapping" "jsonb",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "name_id_format" "text",
    CONSTRAINT "entity_id not empty" CHECK (("char_length"("entity_id") > 0)),
    CONSTRAINT "metadata_url not empty" CHECK ((("metadata_url" = NULL::"text") OR ("char_length"("metadata_url") > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK (("char_length"("metadata_xml") > 0))
);

-- Creating table: auth.saml_relay_states
CREATE TABLE IF NOT EXISTS "auth"."saml_relay_states" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "request_id" "text" NOT NULL,
    "for_email" "text",
    "redirect_to" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "flow_state_id" "uuid",
    CONSTRAINT "request_id not empty" CHECK (("char_length"("request_id") > 0))
);

-- Creating table: auth.schema_migrations
CREATE TABLE IF NOT EXISTS "auth"."schema_migrations" (
    "version" character varying(255) NOT NULL
);

-- Creating table: auth.sessions
CREATE TABLE IF NOT EXISTS "auth"."sessions" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "factor_id" "uuid",
    "aal" "auth"."aal_level",
    "not_after" timestamp with time zone,
    "refreshed_at" timestamp without time zone,
    "user_agent" "text",
    "ip" "inet",
    "tag" "text"
);

-- Creating table: auth.sso_domains
CREATE TABLE IF NOT EXISTS "auth"."sso_domains" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "domain" "text" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK (("char_length"("domain") > 0))
);

-- Creating table: auth.sso_providers
CREATE TABLE IF NOT EXISTS "auth"."sso_providers" (
    "id" "uuid" NOT NULL,
    "resource_id" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    CONSTRAINT "resource_id not empty" CHECK ((("resource_id" = NULL::"text") OR ("char_length"("resource_id") > 0)))
);

-- Creating table: auth.users
CREATE TABLE IF NOT EXISTS "auth"."users" (
    "instance_id" "uuid",
    "id" "uuid" NOT NULL,
    "aud" character varying(255),
    "role" character varying(255),
    "email" character varying(255),
    "encrypted_password" character varying(255),
    "email_confirmed_at" timestamp with time zone,
    "invited_at" timestamp with time zone,
    "confirmation_token" character varying(255),
    "confirmation_sent_at" timestamp with time zone,
    "recovery_token" character varying(255),
    "recovery_sent_at" timestamp with time zone,
    "email_change_token_new" character varying(255),
    "email_change" character varying(255),
    "email_change_sent_at" timestamp with time zone,
    "last_sign_in_at" timestamp with time zone,
    "raw_app_meta_data" "jsonb",
    "raw_user_meta_data" "jsonb",
    "is_super_admin" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "phone" "text" DEFAULT NULL::character varying,
    "phone_confirmed_at" timestamp with time zone,
    "phone_change" "text" DEFAULT ''::character varying,
    "phone_change_token" character varying(255) DEFAULT ''::character varying,
    "phone_change_sent_at" timestamp with time zone,
    "confirmed_at" timestamp with time zone GENERATED ALWAYS AS (LEAST("email_confirmed_at", "phone_confirmed_at")) STORED,
    "email_change_token_current" character varying(255) DEFAULT ''::character varying,
    "email_change_confirm_status" smallint DEFAULT 0,
    "banned_until" timestamp with time zone,
    "reauthentication_token" character varying(255) DEFAULT ''::character varying,
    "reauthentication_sent_at" timestamp with time zone,
    "is_sso_user" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone,
    "is_anonymous" boolean DEFAULT false NOT NULL,
    CONSTRAINT "users_email_change_confirm_status_check" CHECK ((("email_change_confirm_status" >= 0) AND ("email_change_confirm_status" <= 2)))
);

-- Creating table: public.activities
CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "review_id" "uuid",
    "list_id" "uuid",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_profile_id" "uuid",
    "group_id" "uuid",
    "event_id" "uuid",
    "book_id" "uuid",
    "author_id" "uuid"
);

-- Creating table: public.activity_log
CREATE TABLE IF NOT EXISTS "public"."activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "target_type" "text",
    "target_id" "uuid",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Creating table: public.album_analytics
CREATE TABLE IF NOT EXISTS "public"."album_analytics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "views" integer DEFAULT 0,
    "unique_views" integer DEFAULT 0,
    "shares" integer DEFAULT 0,
    "likes" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.album_images
CREATE TABLE IF NOT EXISTS "public"."album_images" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "image_id" "uuid" NOT NULL,
    "display_order" integer NOT NULL,
    "is_cover" boolean DEFAULT false,
    "is_featured" boolean DEFAULT false,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.album_shares
CREATE TABLE IF NOT EXISTS "public"."album_shares" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "shared_by" "uuid" NOT NULL,
    "shared_with" "uuid",
    "share_type" character varying(50) NOT NULL,
    "access_token" "uuid",
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_share_type" CHECK ((("share_type")::"text" = ANY ((ARRAY['public'::character varying, 'private'::character varying, 'link'::character varying])::"text"[])))
);

-- Creating table: public.authors
CREATE TABLE IF NOT EXISTS "public"."authors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "bio" "text",
    "featured" boolean DEFAULT false,
    "birth_date" "date",
    "nationality" "text",
    "website" "text",
    "author_image_id" "uuid",
    "author_gallery_id" integer,
    "twitter_handle" "text",
    "facebook_handle" "text",
    "instagram_handle" "text",
    "goodreads_url" "text",
    "cover_image_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.binding_types
CREATE TABLE IF NOT EXISTS "public"."binding_types" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying,
    "description" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);

-- Creating table: public.blocks
CREATE TABLE IF NOT EXISTS "public"."blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "blocked_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Creating table: public.book_authors
CREATE TABLE IF NOT EXISTS "public"."book_authors" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid",
    "author_id" "uuid",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);

-- Creating table: public.book_club_books
CREATE TABLE IF NOT EXISTS "public"."book_club_books" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_club_id" "uuid",
    "book_id" "uuid",
    "status" character varying,
    "start_date" "date",
    "end_date" "date",
    "created_at" timestamp with time zone,
    "created_by" "uuid"
);

-- Creating table: public.book_club_discussion_comments
CREATE TABLE IF NOT EXISTS "public"."book_club_discussion_comments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "discussion_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.book_club_discussions
CREATE TABLE IF NOT EXISTS "public"."book_club_discussions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_club_id" "uuid" NOT NULL,
    "title" character varying(255) NOT NULL,
    "content" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_pinned" boolean DEFAULT false,
    "book_id" "uuid"
);

-- Creating table: public.book_club_members
CREATE TABLE IF NOT EXISTS "public"."book_club_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_club_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "role" character varying(50) DEFAULT 'member'::character varying,
    CONSTRAINT "book_club_members_role_check" CHECK ((("role")::"text" = ANY ((ARRAY['admin'::character varying, 'moderator'::character varying, 'member'::character varying])::"text"[])))
);

-- Creating table: public.book_clubs
CREATE TABLE IF NOT EXISTS "public"."book_clubs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "cover_image_url" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_private" boolean DEFAULT false,
    "member_count" integer DEFAULT 0,
    "current_book_id" "uuid"
);

-- Creating table: public.book_genre_mappings
CREATE TABLE IF NOT EXISTS "public"."book_genre_mappings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid",
    "genre_id" "uuid"
);

-- Creating table: public.book_genres
CREATE TABLE IF NOT EXISTS "public"."book_genres" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.book_id_mapping
CREATE TABLE IF NOT EXISTS "public"."book_id_mapping" (
    "old_id" integer NOT NULL,
    "new_id" "uuid" NOT NULL,
    "match_method" "text" NOT NULL
);

-- Creating table: public.book_publishers
CREATE TABLE IF NOT EXISTS "public"."book_publishers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "publisher_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);

-- Creating table: public.book_recommendations
CREATE TABLE IF NOT EXISTS "public"."book_recommendations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "source_type" "text" NOT NULL,
    "score" double precision NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid",
    "source_book_id" "uuid"
);

-- Creating table: public.book_reviews
CREATE TABLE IF NOT EXISTS "public"."book_reviews" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "review_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "contains_spoilers" boolean DEFAULT false,
    "group_id" "uuid",
    "visibility" "text" DEFAULT 'public'::"text" NOT NULL,
    "book_id" "uuid",
    CONSTRAINT "book_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "book_reviews_visibility_check" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'private'::"text"])))
);

-- Creating table: public.book_similarity_scores
CREATE TABLE IF NOT EXISTS "public"."book_similarity_scores" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid",
    "similar_book_id" "uuid",
    "similarity_score" double precision,
    "created_at" timestamp with time zone
);

-- Creating table: public.book_subjects
CREATE TABLE IF NOT EXISTS "public"."book_subjects" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid",
    "subject_id" "uuid",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);

-- Creating table: public.book_tag_mappings
CREATE TABLE IF NOT EXISTS "public"."book_tag_mappings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid",
    "tag_id" "uuid",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);

-- Creating table: public.book_tags
CREATE TABLE IF NOT EXISTS "public"."book_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.book_views
CREATE TABLE IF NOT EXISTS "public"."book_views" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "book_id" "uuid",
    "viewed_at" timestamp with time zone
);

-- Creating table: public.books
CREATE TABLE IF NOT EXISTS "public"."books" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "isbn10" character varying,
    "isbn13" character varying,
    "title" character varying NOT NULL,
    "title_long" "text",
    "publisher_id" "uuid",
    "publication_date" "date",
    "binding" character varying,
    "pages" integer,
    "list_price" numeric,
    "language" character varying,
    "edition" character varying,
    "synopsis" "text",
    "overview" "text",
    "dimensions" character varying,
    "weight" numeric,
    "cover_image_id" "uuid",
    "original_image_url" "text",
    "author" character varying,
    "featured" boolean DEFAULT false NOT NULL,
    "book_gallery_img" "text"[],
    "average_rating" numeric DEFAULT 0,
    "review_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "author_id" "uuid",
    "binding_type_id" "uuid",
    "format_type_id" "uuid",
    "status_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "books_average_rating_range_check" CHECK ((("average_rating" >= (0)::numeric) AND ("average_rating" <= (5)::numeric))),
    CONSTRAINT "books_isbn10_format_check" CHECK ((("isbn10" IS NULL) OR (("length"(("isbn10")::"text") = 10) AND (("isbn10")::"text" ~ '^[0-9X]{10}$'::"text")))),
    CONSTRAINT "books_isbn13_format_check" CHECK ((("isbn13" IS NULL) OR (("length"(("isbn13")::"text") = 13) AND (("isbn13")::"text" ~ '^[0-9]{13}$'::"text")))),
    CONSTRAINT "books_list_price_positive_check" CHECK ((("list_price" IS NULL) OR ("list_price" >= (0)::numeric))),
    CONSTRAINT "books_pages_positive_check" CHECK ((("pages" IS NULL) OR ("pages" > 0))),
    CONSTRAINT "books_publication_date_future_check" CHECK ((("publication_date" IS NULL) OR ("publication_date" <= CURRENT_DATE))),
    CONSTRAINT "books_review_count_positive_check" CHECK (("review_count" >= 0)),
    CONSTRAINT "books_title_length_check" CHECK ((("length"(("title")::"text") >= 1) AND ("length"(("title")::"text") <= 500))),
    CONSTRAINT "books_weight_positive_check" CHECK ((("weight" IS NULL) OR ("weight" > (0)::numeric)))
);

-- Creating table: public.carousel_images
CREATE TABLE IF NOT EXISTS "public"."carousel_images" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "carousel_name" character varying,
    "image_url" "text",
    "alt_text" character varying,
    "position" integer,
    "active" boolean
);

-- Creating table: public.comments
CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "feed_entry_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_hidden" boolean DEFAULT false NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL
);

-- Creating table: public.contact_info
CREATE TABLE IF NOT EXISTS "public"."contact_info" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "website" "text",
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "state" "text",
    "postal_code" "text",
    "country" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.countries
CREATE TABLE IF NOT EXISTS "public"."countries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "phone_code" "text",
    "continent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.discussion_comments
CREATE TABLE IF NOT EXISTS "public"."discussion_comments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "discussion_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.discussions
CREATE TABLE IF NOT EXISTS "public"."discussions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "is_pinned" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "group_id" "uuid",
    "category_id" integer,
    "book_id" "uuid"
);

-- Creating table: public.event_analytics
CREATE TABLE IF NOT EXISTS "public"."event_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "views" integer DEFAULT 0,
    "unique_visitors" integer DEFAULT 0,
    "registrations" integer DEFAULT 0,
    "cancellations" integer DEFAULT 0,
    "shares" integer DEFAULT 0,
    "likes" integer DEFAULT 0,
    "comments" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.event_approvals
CREATE TABLE IF NOT EXISTS "public"."event_approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "submitted_by" "uuid" NOT NULL,
    "approval_status" "text",
    "reviewer_id" "uuid",
    "review_notes" "text",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_approvals_approval_status_check" CHECK (("approval_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'changes_requested'::"text"])))
);

-- Creating table: public.event_books
CREATE TABLE IF NOT EXISTS "public"."event_books" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "feature_type" "text",
    "display_order" integer,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid",
    CONSTRAINT "event_books_feature_type_check" CHECK (("feature_type" = ANY (ARRAY['primary'::"text", 'related'::"text", 'recommendation'::"text"])))
);

-- Creating table: public.event_calendar_exports
CREATE TABLE IF NOT EXISTS "public"."event_calendar_exports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "calendar_type" "text",
    "calendar_event_id" "text",
    "synced_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_calendar_exports_calendar_type_check" CHECK (("calendar_type" = ANY (ARRAY['google'::"text", 'apple'::"text", 'outlook'::"text", 'ical'::"text"])))
);

-- Creating table: public.event_categories
CREATE TABLE IF NOT EXISTS "public"."event_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "parent_id" "uuid",
    "icon" "text",
    "color" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.event_chat_messages
CREATE TABLE IF NOT EXISTS "public"."event_chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chat_room_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "is_hidden" boolean DEFAULT false,
    "hidden_by" "uuid",
    "hidden_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.event_chat_rooms
CREATE TABLE IF NOT EXISTS "public"."event_chat_rooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "is_moderated" boolean DEFAULT true,
    "moderator_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "requires_ticket" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.event_comments
CREATE TABLE IF NOT EXISTS "public"."event_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "content" "text" NOT NULL,
    "is_pinned" boolean DEFAULT false,
    "is_hidden" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.event_creator_permissions
CREATE TABLE IF NOT EXISTS "public"."event_creator_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "permission_level" "text",
    "can_create_paid_events" boolean DEFAULT false,
    "attendee_limit" integer DEFAULT 100,
    "requires_approval" boolean DEFAULT true,
    "approved_categories" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_creator_permissions_permission_level_check" CHECK (("permission_level" = ANY (ARRAY['admin'::"text", 'organizer'::"text", 'staff'::"text", 'limited'::"text"])))
);

-- Creating table: public.event_financials
CREATE TABLE IF NOT EXISTS "public"."event_financials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "total_revenue" numeric DEFAULT 0,
    "total_fees" numeric DEFAULT 0,
    "total_taxes" numeric DEFAULT 0,
    "total_refunds" numeric DEFAULT 0,
    "net_revenue" numeric DEFAULT 0,
    "currency" "text" DEFAULT 'USD'::"text",
    "ticket_sales_breakdown" "jsonb",
    "payout_status" "text",
    "payout_date" timestamp with time zone,
    "payout_method" "text",
    "payout_reference" "text",
    "organizer_fees" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_financials_payout_status_check" CHECK (("payout_status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);

-- Creating table: public.event_interests
CREATE TABLE IF NOT EXISTS "public"."event_interests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "interest_level" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_interests_interest_level_check" CHECK (("interest_level" = ANY (ARRAY['interested'::"text", 'maybe'::"text"])))
);

-- Creating table: public.event_likes
CREATE TABLE IF NOT EXISTS "public"."event_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.event_livestreams
CREATE TABLE IF NOT EXISTS "public"."event_livestreams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "provider" "text",
    "stream_key" "text",
    "stream_url" "text" NOT NULL,
    "embed_code" "text",
    "is_active" boolean DEFAULT false,
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "recording_url" "text",
    "viewer_count" integer DEFAULT 0,
    "max_concurrent_viewers" integer DEFAULT 0,
    "requires_ticket" boolean DEFAULT true,
    "ticket_types" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_livestreams_provider_check" CHECK (("provider" = ANY (ARRAY['youtube'::"text", 'vimeo'::"text", 'twitch'::"text", 'facebook'::"text", 'custom'::"text"])))
);

-- Creating table: public.event_locations
CREATE TABLE IF NOT EXISTS "public"."event_locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "state" "text",
    "postal_code" "text",
    "country" "text",
    "latitude" numeric,
    "longitude" numeric,
    "google_place_id" "text",
    "is_primary" boolean DEFAULT true,
    "venue_notes" "text",
    "accessibility_info" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.event_media
CREATE TABLE IF NOT EXISTS "public"."event_media" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "media_type" "text",
    "url" "text" NOT NULL,
    "thumbnail_url" "text",
    "title" "text",
    "description" "text",
    "file_size" integer,
    "file_type" "text",
    "duration" integer,
    "width" integer,
    "height" integer,
    "display_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_media_media_type_check" CHECK (("media_type" = ANY (ARRAY['image'::"text", 'video'::"text", 'document'::"text", 'audio'::"text"])))
);

-- Creating table: public.event_permission_requests
CREATE TABLE IF NOT EXISTS "public"."event_permission_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "request_reason" "text",
    "requested_level" "text",
    "status" "text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "admin_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_permission_requests_requested_level_check" CHECK (("requested_level" = ANY (ARRAY['organizer'::"text", 'staff'::"text", 'limited'::"text"]))),
    CONSTRAINT "event_permission_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);

-- Creating table: public.event_questions
CREATE TABLE IF NOT EXISTS "public"."event_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "question_type" "text",
    "is_required" boolean DEFAULT false,
    "options" "jsonb",
    "display_order" integer,
    "help_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_questions_question_type_check" CHECK (("question_type" = ANY (ARRAY['text'::"text", 'multiple_choice'::"text", 'checkbox'::"text", 'dropdown'::"text", 'date'::"text", 'file'::"text"])))
);

-- Creating table: public.event_registrations
CREATE TABLE IF NOT EXISTS "public"."event_registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "registration_status" "text",
    "registration_time" timestamp with time zone DEFAULT "now"(),
    "check_in_time" timestamp with time zone,
    "ticket_id" "text",
    "registration_source" "text",
    "additional_guests" integer DEFAULT 0,
    "guest_names" "jsonb",
    "answers" "jsonb",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "session_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    CONSTRAINT "event_registrations_registration_status_check" CHECK (("registration_status" = ANY (ARRAY['registered'::"text", 'waitlisted'::"text", 'cancelled'::"text", 'attended'::"text", 'no_show'::"text"])))
);

-- Creating table: public.event_reminders
CREATE TABLE IF NOT EXISTS "public"."event_reminders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reminder_time" timestamp with time zone NOT NULL,
    "notification_sent" boolean DEFAULT false,
    "notification_time" timestamp with time zone,
    "reminder_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_reminders_reminder_type_check" CHECK (("reminder_type" = ANY (ARRAY['email'::"text", 'push'::"text", 'sms'::"text", 'in_app'::"text"])))
);

-- Creating table: public.event_sessions
CREATE TABLE IF NOT EXISTS "public"."event_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "speaker_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "location_id" "uuid",
    "virtual_meeting_url" "text",
    "max_attendees" integer,
    "requires_separate_registration" boolean DEFAULT false,
    "session_materials" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.event_shares
CREATE TABLE IF NOT EXISTS "public"."event_shares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "share_platform" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_shares_share_platform_check" CHECK (("share_platform" = ANY (ARRAY['facebook'::"text", 'twitter'::"text", 'linkedin'::"text", 'email'::"text", 'whatsapp'::"text", 'other'::"text"])))
);

-- Creating table: public.event_speakers
CREATE TABLE IF NOT EXISTS "public"."event_speakers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "bio" "text",
    "headshot_url" "text",
    "website" "text",
    "social_links" "jsonb",
    "presentation_title" "text",
    "presentation_description" "text",
    "speaker_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "session_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "author_id" "uuid"
);

-- Creating table: public.event_sponsors
CREATE TABLE IF NOT EXISTS "public"."event_sponsors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "website_url" "text",
    "logo_url" "text",
    "sponsor_level" "text",
    "display_order" integer,
    "contribution_amount" numeric,
    "currency" "text" DEFAULT 'USD'::"text",
    "is_featured" boolean DEFAULT false,
    "benefits_description" "text",
    "contact_name" "text",
    "contact_email" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_sponsors_sponsor_level_check" CHECK (("sponsor_level" = ANY (ARRAY['platinum'::"text", 'gold'::"text", 'silver'::"text", 'bronze'::"text", 'partner'::"text", 'media'::"text"])))
);

-- Creating table: public.event_staff
CREATE TABLE IF NOT EXISTS "public"."event_staff" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text",
    "permissions" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_staff_role_check" CHECK (("role" = ANY (ARRAY['organizer'::"text", 'co-organizer'::"text", 'staff'::"text", 'check-in'::"text", 'moderator'::"text"])))
);

-- Creating table: public.event_surveys
CREATE TABLE IF NOT EXISTS "public"."event_surveys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "is_anonymous" boolean DEFAULT false,
    "requires_ticket" boolean DEFAULT true,
    "available_from" timestamp with time zone,
    "available_until" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.event_tags
CREATE TABLE IF NOT EXISTS "public"."event_tags" (
    "event_id" "uuid" NOT NULL,
    "tag_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.event_types
CREATE TABLE IF NOT EXISTS "public"."event_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.event_views
CREATE TABLE IF NOT EXISTS "public"."event_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "ip_address" "text",
    "viewed_at" timestamp with time zone DEFAULT "now"(),
    "user_agent" "text",
    "referrer" "text"
);

-- Creating table: public.event_waitlists
CREATE TABLE IF NOT EXISTS "public"."event_waitlists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "ticket_type_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "position" integer NOT NULL,
    "status" "text",
    "notification_sent_at" timestamp with time zone,
    "expiration_time" timestamp with time zone,
    "converted_to_registration_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_waitlists_status_check" CHECK (("status" = ANY (ARRAY['waiting'::"text", 'notified'::"text", 'converted'::"text", 'expired'::"text"])))
);

-- Creating table: public.events
CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text",
    "description" "text",
    "summary" "text",
    "event_category_id" "uuid",
    "type_id" "uuid",
    "format" "text",
    "status" "text",
    "visibility" "text",
    "featured" boolean DEFAULT false,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "timezone" "text",
    "all_day" boolean DEFAULT false,
    "max_attendees" integer,
    "cover_image_id" "uuid",
    "event_image_id" "uuid",
    "is_recurring" boolean DEFAULT false,
    "recurrence_pattern" "jsonb",
    "parent_event_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "published_at" timestamp with time zone,
    "requires_registration" boolean DEFAULT false,
    "registration_opens_at" timestamp with time zone,
    "registration_closes_at" timestamp with time zone,
    "is_free" boolean DEFAULT true,
    "price" numeric,
    "currency" "text",
    "group_id" "uuid",
    "virtual_meeting_url" "text",
    "virtual_meeting_id" "text",
    "virtual_meeting_password" "text",
    "virtual_platform" "text",
    "slug" "text",
    "seo_title" "text",
    "seo_description" "text",
    "canonical_url" "text",
    "content_blocks" "jsonb",
    "author_id" "uuid",
    "book_id" "uuid",
    "publisher_id" "uuid",
    CONSTRAINT "events_format_check" CHECK (("format" = ANY (ARRAY['physical'::"text", 'virtual'::"text", 'hybrid'::"text"]))),
    CONSTRAINT "events_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'cancelled'::"text", 'completed'::"text", 'postponed'::"text"]))),
    CONSTRAINT "events_visibility_check" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'private'::"text", 'invite_only'::"text", 'group_only'::"text"])))
);

-- Creating table: public.feed_entries
CREATE TABLE IF NOT EXISTS "public"."feed_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "group_id" "uuid",
    "type" "text" NOT NULL,
    "content" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visibility" "text" DEFAULT 'public'::"text" NOT NULL,
    "allowed_user_ids" "uuid"[],
    "is_hidden" boolean DEFAULT false NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL
);

-- Creating table: public.feed_entry_tags
CREATE TABLE IF NOT EXISTS "public"."feed_entry_tags" (
    "feed_entry_id" "uuid" NOT NULL,
    "tag_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.follow_target_types
CREATE TABLE IF NOT EXISTS "public"."follow_target_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.follows
CREATE TABLE IF NOT EXISTS "public"."follows" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "follower_id" "uuid" NOT NULL,
    "following_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "target_type_id_uuid_temp" "uuid",
    "target_type_id" "uuid"
);

-- Creating table: public.format_types
CREATE TABLE IF NOT EXISTS "public"."format_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL
);

-- Creating table: public.friends
CREATE TABLE IF NOT EXISTS "public"."friends" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friend_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "responded_at" timestamp with time zone,
    "requested_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_achievements
CREATE TABLE IF NOT EXISTS "public"."group_achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "criteria" "text",
    "points" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "icon_url" "text",
    "type" "text",
    CONSTRAINT "group_achievements_name_check" CHECK (("length"(TRIM(BOTH FROM "name")) > 0)),
    CONSTRAINT "group_achievements_points_check" CHECK (("points" >= 0)),
    CONSTRAINT "group_achievements_type_check" CHECK ((("type" IS NULL) OR ("length"(TRIM(BOTH FROM "type")) > 0)))
);

-- Creating table: public.group_analytics
CREATE TABLE IF NOT EXISTS "public"."group_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "metric_name" "text" NOT NULL,
    "metric_value" numeric,
    "recorded_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "group_analytics_created_at_check" CHECK (("created_at" <= CURRENT_TIMESTAMP)),
    CONSTRAINT "group_analytics_metric_name_check" CHECK (("length"(TRIM(BOTH FROM "metric_name")) > 0)),
    CONSTRAINT "group_analytics_recorded_at_check" CHECK (("recorded_at" <= CURRENT_TIMESTAMP))
);

-- Creating table: public.group_announcements
CREATE TABLE IF NOT EXISTS "public"."group_announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "content" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_pinned" boolean DEFAULT false
);

-- Creating table: public.group_audit_log
CREATE TABLE IF NOT EXISTS "public"."group_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "action" "text",
    "performed_by" "uuid",
    "target_type" "text",
    "target_id" "uuid",
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_author_events
CREATE TABLE IF NOT EXISTS "public"."group_author_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "event_id" "uuid",
    "scheduled_at" timestamp with time zone,
    "author_id" "uuid"
);

-- Creating table: public.group_book_list_items
CREATE TABLE IF NOT EXISTS "public"."group_book_list_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "list_id" "uuid",
    "added_by" "uuid",
    "added_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid"
);

-- Creating table: public.group_book_lists
CREATE TABLE IF NOT EXISTS "public"."group_book_lists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "description" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_book_reviews
CREATE TABLE IF NOT EXISTS "public"."group_book_reviews" (
    "id" "uuid" NOT NULL,
    "group_id" "uuid",
    "book_id" "uuid",
    "user_id" "uuid",
    "rating" integer,
    "review" "text",
    "created_at" timestamp with time zone,
    CONSTRAINT "group_book_reviews_new_book_id_required_check" CHECK (("book_id" IS NOT NULL)),
    CONSTRAINT "group_book_reviews_new_content_check" CHECK ((("rating" IS NOT NULL) OR (("review" IS NOT NULL) AND ("length"(TRIM(BOTH FROM "review")) > 0)))),
    CONSTRAINT "group_book_reviews_new_created_at_required_check" CHECK (("created_at" IS NOT NULL)),
    CONSTRAINT "group_book_reviews_new_group_id_required_check" CHECK (("group_id" IS NOT NULL)),
    CONSTRAINT "group_book_reviews_new_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "group_book_reviews_new_review_check" CHECK ((("review" IS NULL) OR ("length"(TRIM(BOTH FROM "review")) > 0))),
    CONSTRAINT "group_book_reviews_new_user_id_required_check" CHECK (("user_id" IS NOT NULL))
);

-- Creating table: public.group_book_swaps
CREATE TABLE IF NOT EXISTS "public"."group_book_swaps" (
    "id" "uuid" NOT NULL,
    "group_id" "uuid",
    "book_id" "uuid",
    "offered_by" "uuid",
    "status" "text",
    "accepted_by" "uuid",
    "created_at" timestamp with time zone,
    "accepted_at" timestamp with time zone,
    CONSTRAINT "group_book_swaps_accepted_at_check" CHECK ((("accepted_at" IS NULL) OR ("accepted_at" >= "created_at"))),
    CONSTRAINT "group_book_swaps_accepted_at_required_check" CHECK (((("accepted_at" IS NULL) AND ("accepted_by" IS NULL)) OR (("accepted_at" IS NOT NULL) AND ("accepted_by" IS NOT NULL)))),
    CONSTRAINT "group_book_swaps_accepted_by_status_check" CHECK (((("accepted_by" IS NULL) AND ("status" <> ALL (ARRAY['accepted'::"text", 'completed'::"text"]))) OR (("accepted_by" IS NOT NULL) AND ("status" = ANY (ARRAY['accepted'::"text", 'completed'::"text"]))))),
    CONSTRAINT "group_book_swaps_book_id_required_check" CHECK (((("book_id" IS NOT NULL) AND ("status" <> ALL (ARRAY['cancelled'::"text", 'expired'::"text"]))) OR (("book_id" IS NULL) AND ("status" = ANY (ARRAY['cancelled'::"text", 'expired'::"text"]))))),
    CONSTRAINT "group_book_swaps_group_id_required_check" CHECK (("group_id" IS NOT NULL)),
    CONSTRAINT "group_book_swaps_offered_by_required_check" CHECK (("offered_by" IS NOT NULL)),
    CONSTRAINT "group_book_swaps_self_accept_check" CHECK ((("offered_by" <> "accepted_by") OR ("accepted_by" IS NULL))),
    CONSTRAINT "group_book_swaps_status_check" CHECK (("status" = ANY (ARRAY['available'::"text", 'accepted'::"text", 'completed'::"text", 'cancelled'::"text", 'expired'::"text"])))
);

-- Creating table: public.group_book_wishlist_items
CREATE TABLE IF NOT EXISTS "public"."group_book_wishlist_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "wishlist_id" "uuid",
    "added_by" "uuid",
    "added_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid"
);

-- Creating table: public.group_book_wishlists
CREATE TABLE IF NOT EXISTS "public"."group_book_wishlists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_bots
CREATE TABLE IF NOT EXISTS "public"."group_bots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "name" "text",
    "description" "text",
    "config" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_chat_channels
CREATE TABLE IF NOT EXISTS "public"."group_chat_channels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "name" "text",
    "description" "text",
    "is_event_channel" boolean DEFAULT false,
    "event_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_chat_message_attachments
CREATE TABLE IF NOT EXISTS "public"."group_chat_message_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "uuid",
    "url" "text",
    "file_type" "text",
    "file_size" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_chat_message_reactions
CREATE TABLE IF NOT EXISTS "public"."group_chat_message_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "uuid",
    "user_id" "uuid",
    "reaction" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_chat_messages
CREATE TABLE IF NOT EXISTS "public"."group_chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "channel_id" "uuid",
    "user_id" "uuid",
    "message" "text",
    "is_hidden" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_content_moderation_logs
CREATE TABLE IF NOT EXISTS "public"."group_content_moderation_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "content_type" "text",
    "content_id" "uuid",
    "action" "text",
    "reason" "text",
    "reviewed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_custom_fields
CREATE TABLE IF NOT EXISTS "public"."group_custom_fields" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "field_name" "text",
    "field_type" "text",
    "field_options" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_discussion_categories
CREATE TABLE IF NOT EXISTS "public"."group_discussion_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "group_discussion_categories_created_at_required_check" CHECK (("created_at" IS NOT NULL)),
    CONSTRAINT "group_discussion_categories_description_check" CHECK ((("description" IS NULL) OR ("length"(TRIM(BOTH FROM "description")) > 0))),
    CONSTRAINT "group_discussion_categories_description_length_check" CHECK ((("description" IS NULL) OR ("length"("description") <= 500))),
    CONSTRAINT "group_discussion_categories_name_check" CHECK (("length"(TRIM(BOTH FROM "name")) > 0)),
    CONSTRAINT "group_discussion_categories_name_length_check" CHECK (("length"("name") <= 100)),
    CONSTRAINT "group_discussion_categories_updated_at_check" CHECK ((("updated_at" IS NULL) OR ("updated_at" >= "created_at"))),
    CONSTRAINT "group_discussion_categories_updated_at_required_check" CHECK (("updated_at" IS NOT NULL))
);

-- Creating table: public.group_event_feedback
CREATE TABLE IF NOT EXISTS "public"."group_event_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid",
    "group_id" "uuid",
    "user_id" "uuid",
    "rating" integer,
    "feedback" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_events
CREATE TABLE IF NOT EXISTS "public"."group_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "event_id" "uuid",
    "is_recurring" boolean DEFAULT false,
    "recurrence_pattern" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "chat_channel_id" "uuid"
);

-- Creating table: public.group_integrations
CREATE TABLE IF NOT EXISTS "public"."group_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "type" "text",
    "config" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_invites
CREATE TABLE IF NOT EXISTS "public"."group_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "invited_user_id" "uuid",
    "email" "text",
    "invite_code" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "accepted_at" timestamp with time zone,
    "expires_at" timestamp with time zone
);

-- Creating table: public.group_leaderboards
CREATE TABLE IF NOT EXISTS "public"."group_leaderboards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "leaderboard_type" "text",
    "data" "jsonb",
    "generated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_member_achievements
CREATE TABLE IF NOT EXISTS "public"."group_member_achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "achievement_id" "uuid" NOT NULL,
    "earned_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "group_member_achievements_created_at_check" CHECK (("created_at" IS NOT NULL)),
    CONSTRAINT "group_member_achievements_earned_at_check" CHECK (("earned_at" IS NOT NULL)),
    CONSTRAINT "group_member_achievements_earned_at_timing_check" CHECK (("earned_at" >= "created_at"))
);

-- Creating table: public.group_member_devices
CREATE TABLE IF NOT EXISTS "public"."group_member_devices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "user_id" "uuid",
    "device_token" "text",
    "device_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_member_streaks
CREATE TABLE IF NOT EXISTS "public"."group_member_streaks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "user_id" "uuid",
    "streak_type" "text",
    "current_streak" integer DEFAULT 0,
    "longest_streak" integer DEFAULT 0,
    "last_active_date" "date",
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_members
CREATE TABLE IF NOT EXISTS "public"."group_members" (
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role_id" integer,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "joined_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);

-- Creating table: public.group_membership_questions
CREATE TABLE IF NOT EXISTS "public"."group_membership_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "is_required" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "group_membership_questions_created_at_check" CHECK (("created_at" IS NOT NULL)),
    CONSTRAINT "group_membership_questions_question_check" CHECK ((("question" IS NOT NULL) AND ("length"(TRIM(BOTH FROM "question")) > 0))),
    CONSTRAINT "group_membership_questions_updated_at_check" CHECK (("updated_at" IS NOT NULL)),
    CONSTRAINT "group_membership_questions_updated_at_timing_check" CHECK (("updated_at" >= "created_at"))
);

-- Creating table: public.group_moderation_logs
CREATE TABLE IF NOT EXISTS "public"."group_moderation_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "action" "text",
    "target_type" "text",
    "target_id" "uuid",
    "performed_by" "uuid",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_onboarding_checklists
CREATE TABLE IF NOT EXISTS "public"."group_onboarding_checklists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_onboarding_progress
CREATE TABLE IF NOT EXISTS "public"."group_onboarding_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "checklist_id" "uuid",
    "user_id" "uuid",
    "task_id" "uuid",
    "completed_at" timestamp with time zone
);

-- Creating table: public.group_onboarding_tasks
CREATE TABLE IF NOT EXISTS "public"."group_onboarding_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "checklist_id" "uuid",
    "task" "text",
    "order_index" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_poll_votes
CREATE TABLE IF NOT EXISTS "public"."group_poll_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "poll_id" "uuid",
    "user_id" "uuid",
    "option_index" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_polls
CREATE TABLE IF NOT EXISTS "public"."group_polls" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "question" "text" NOT NULL,
    "options" "text"[],
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "is_anonymous" boolean DEFAULT false,
    "allow_multiple" boolean DEFAULT false
);

-- Creating table: public.group_reading_challenge_progress
CREATE TABLE IF NOT EXISTS "public"."group_reading_challenge_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "challenge_id" "uuid",
    "user_id" "uuid",
    "books_read" integer DEFAULT 0,
    "progress_details" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_reading_challenges
CREATE TABLE IF NOT EXISTS "public"."group_reading_challenges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "description" "text",
    "target_books" integer,
    "start_date" "date",
    "end_date" "date",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_reading_progress
CREATE TABLE IF NOT EXISTS "public"."group_reading_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "user_id" "uuid",
    "progress_percentage" integer,
    "started_at" timestamp with time zone,
    "finished_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid"
);

-- Creating table: public.group_reading_sessions
CREATE TABLE IF NOT EXISTS "public"."group_reading_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "session_title" "text",
    "session_description" "text",
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid"
);

-- Creating table: public.group_reports
CREATE TABLE IF NOT EXISTS "public"."group_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "reported_by" "uuid",
    "target_type" "text",
    "target_id" "uuid",
    "reason" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_roles
CREATE TABLE IF NOT EXISTS "public"."group_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "permissions" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_default" boolean DEFAULT false,
    CONSTRAINT "group_roles_created_at_check" CHECK (("created_at" IS NOT NULL)),
    CONSTRAINT "group_roles_name_check" CHECK ((("name" IS NOT NULL) AND ("length"(TRIM(BOTH FROM "name")) > 0))),
    CONSTRAINT "group_roles_updated_at_check" CHECK (("updated_at" IS NOT NULL)),
    CONSTRAINT "group_roles_updated_at_timing_check" CHECK (("updated_at" >= "created_at"))
);

-- Creating table: public.group_rules
CREATE TABLE IF NOT EXISTS "public"."group_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "order_index" integer,
    CONSTRAINT "group_rules_created_at_check" CHECK (("created_at" IS NOT NULL)),
    CONSTRAINT "group_rules_order_index_check" CHECK ((("order_index" IS NULL) OR ("order_index" >= 0))),
    CONSTRAINT "group_rules_title_check" CHECK ((("title" IS NOT NULL) AND ("length"(TRIM(BOTH FROM "title")) > 0))),
    CONSTRAINT "group_rules_updated_at_check" CHECK (("updated_at" IS NOT NULL)),
    CONSTRAINT "group_rules_updated_at_timing_check" CHECK (("updated_at" >= "created_at"))
);

-- Creating table: public.group_shared_documents
CREATE TABLE IF NOT EXISTS "public"."group_shared_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "content" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone
);

-- Creating table: public.group_tags
CREATE TABLE IF NOT EXISTS "public"."group_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "group_tags_created_at_check" CHECK (("created_at" IS NOT NULL)),
    CONSTRAINT "group_tags_name_check" CHECK ((("name" IS NOT NULL) AND ("length"(TRIM(BOTH FROM "name")) > 0))),
    CONSTRAINT "group_tags_updated_at_check" CHECK (("updated_at" IS NOT NULL)),
    CONSTRAINT "group_tags_updated_at_timing_check" CHECK (("updated_at" >= "created_at"))
);

-- Creating table: public.group_types
CREATE TABLE IF NOT EXISTS "public"."group_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "display_name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    CONSTRAINT "group_types_display_name_check" CHECK ((("display_name" IS NOT NULL) AND ("length"(TRIM(BOTH FROM "display_name")) > 0))),
    CONSTRAINT "group_types_display_name_length_check" CHECK (("length"("display_name") <= 100)),
    CONSTRAINT "group_types_slug_check" CHECK ((("slug" IS NOT NULL) AND ("length"(TRIM(BOTH FROM "slug")) > 0))),
    CONSTRAINT "group_types_slug_format_check" CHECK (("slug" ~ '^[a-z0-9-]+$'::"text")),
    CONSTRAINT "group_types_slug_hyphen_check" CHECK ((("slug" !~ '^-'::"text") AND ("slug" !~ '-$'::"text"))),
    CONSTRAINT "group_types_slug_length_check" CHECK (("length"("slug") <= 50))
);

-- Creating table: public.group_webhook_logs
CREATE TABLE IF NOT EXISTS "public"."group_webhook_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "webhook_id" "uuid",
    "event_type" "text",
    "payload" "jsonb",
    "status" "text",
    "response_code" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_webhooks
CREATE TABLE IF NOT EXISTS "public"."group_webhooks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "url" "text",
    "event_types" "text"[],
    "secret" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.group_welcome_messages
CREATE TABLE IF NOT EXISTS "public"."group_welcome_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "role_id" integer,
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.groups
CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "is_private" boolean DEFAULT false,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "cover_image_url" "text",
    "member_count" integer DEFAULT 0
);

-- Creating table: public.id_mappings
CREATE TABLE IF NOT EXISTS "public"."id_mappings" (
    "table_name" "text" NOT NULL,
    "old_id" integer NOT NULL,
    "new_id" "uuid" NOT NULL
);

-- Creating table: public.image_tag_mappings
CREATE TABLE IF NOT EXISTS "public"."image_tag_mappings" (
    "image_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.image_tags
CREATE TABLE IF NOT EXISTS "public"."image_tags" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "slug" character varying(100) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.image_types
CREATE TABLE IF NOT EXISTS "public"."image_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.images
CREATE TABLE IF NOT EXISTS "public"."images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "url" "text" NOT NULL,
    "alt_text" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "thumbnail_url" "text",
    "medium_url" "text",
    "large_url" "text",
    "original_filename" character varying(255),
    "file_size" integer,
    "width" integer,
    "height" integer,
    "format" character varying(10),
    "mime_type" character varying(100),
    "caption" "text",
    "metadata" "jsonb",
    "storage_path" "text",
    "storage_provider" character varying(50) DEFAULT 'supabase'::character varying,
    "is_processed" boolean DEFAULT false,
    "processing_status" character varying(50),
    "deleted_at" timestamp with time zone,
    "img_type_id" "uuid"
);

-- Creating table: public.invoices
CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "invoice_number" "text" NOT NULL,
    "amount" numeric NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "status" "text",
    "due_date" timestamp with time zone,
    "paid_date" timestamp with time zone,
    "billing_address" "jsonb",
    "line_items" "jsonb",
    "notes" "text",
    "invoice_pdf_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "invoices_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'paid'::"text", 'cancelled'::"text", 'refunded'::"text"])))
);

-- Creating table: public.likes
CREATE TABLE IF NOT EXISTS "public"."likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "feed_entry_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.list_followers
CREATE TABLE IF NOT EXISTS "public"."list_followers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "list_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.media_attachments
CREATE TABLE IF NOT EXISTS "public"."media_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feed_entry_id" "uuid",
    "url" "text" NOT NULL,
    "type" "text",
    "alt_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.mentions
CREATE TABLE IF NOT EXISTS "public"."mentions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feed_entry_id" "uuid",
    "comment_id" "uuid",
    "mentioned_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.notifications
CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "link" "text",
    "data" "jsonb",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.payment_methods
CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "payment_type" "text",
    "provider_payment_id" "text",
    "nickname" "text",
    "last_four" "text",
    "expiry_date" "text",
    "is_default" boolean DEFAULT false,
    "billing_address" "jsonb",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payment_methods_payment_type_check" CHECK (("payment_type" = ANY (ARRAY['credit_card'::"text", 'paypal'::"text", 'bank_transfer'::"text", 'crypto'::"text", 'apple_pay'::"text", 'google_pay'::"text"])))
);

-- Creating table: public.payment_transactions
CREATE TABLE IF NOT EXISTS "public"."payment_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "payment_method_id" "uuid",
    "transaction_type" "text",
    "amount" numeric NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "fees" numeric DEFAULT 0,
    "taxes" numeric DEFAULT 0,
    "tax_details" "jsonb",
    "status" "text",
    "provider_transaction_id" "text",
    "payment_provider" "text",
    "error_message" "text",
    "metadata" "jsonb",
    "receipt_url" "text",
    "receipt_email_sent" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payment_transactions_payment_provider_check" CHECK (("payment_provider" = ANY (ARRAY['stripe'::"text", 'paypal'::"text", 'square'::"text", 'braintree'::"text", 'manual'::"text"]))),
    CONSTRAINT "payment_transactions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text", 'refunded'::"text", 'disputed'::"text"]))),
    CONSTRAINT "payment_transactions_transaction_type_check" CHECK (("transaction_type" = ANY (ARRAY['purchase'::"text", 'refund'::"text", 'partial_refund'::"text", 'chargeback'::"text"])))
);

-- Creating table: public.personalized_recommendations
CREATE TABLE IF NOT EXISTS "public"."personalized_recommendations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "book_id" bigint NOT NULL,
    "recommendation_type" "text" NOT NULL,
    "score" double precision NOT NULL,
    "explanation" "text",
    "is_dismissed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.photo_album
CREATE TABLE IF NOT EXISTS "public"."photo_album" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "entity_id" integer NOT NULL,
    "entity_type" character varying(50) NOT NULL,
    "image_type_id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "photo_album_entity_type_check" CHECK ((("entity_type")::"text" = ANY ((ARRAY['author'::character varying, 'publisher'::character varying, 'book'::character varying])::"text"[])))
);

-- Creating table: public.photo_albums
CREATE TABLE IF NOT EXISTS "public"."photo_albums" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "cover_image_id" "uuid",
    "owner_id" "uuid" NOT NULL,
    "is_public" boolean DEFAULT false,
    "view_count" integer DEFAULT 0,
    "like_count" integer DEFAULT 0,
    "share_count" integer DEFAULT 0,
    "album_type" character varying(50) NOT NULL,
    "entity_id" "uuid",
    "entity_type" character varying(50),
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    CONSTRAINT "valid_album_type" CHECK ((("album_type")::"text" = ANY ((ARRAY['personal'::character varying, 'event'::character varying, 'book'::character varying, 'author'::character varying, 'publisher'::character varying])::"text"[])))
);

-- Creating table: public.posts
CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "image_url" "text",
    "link_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visibility" "text" DEFAULT 'public'::"text" NOT NULL,
    "allowed_user_ids" "uuid"[],
    "is_hidden" boolean DEFAULT false NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL
);

-- Creating table: public.prices
CREATE TABLE IF NOT EXISTS "public"."prices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "condition" character varying(50),
    "merchant" character varying(255),
    "total" numeric(10,2),
    "link" "text",
    CONSTRAINT "prices_condition_check" CHECK ((("condition" IS NULL) OR (("condition")::"text" = ANY ((ARRAY['new'::character varying, 'like_new'::character varying, 'very_good'::character varying, 'good'::character varying, 'acceptable'::character varying, 'fair'::character varying, 'poor'::character varying])::"text"[])))),
    CONSTRAINT "prices_created_at_check" CHECK (("created_at" IS NOT NULL)),
    CONSTRAINT "prices_currency_check" CHECK ((("currency" IS NOT NULL) AND ("length"(TRIM(BOTH FROM "currency")) > 0))),
    CONSTRAINT "prices_currency_format_check" CHECK (("currency" ~ '^[A-Z]{3}$'::"text")),
    CONSTRAINT "prices_link_format_check" CHECK ((("link" IS NULL) OR ("link" ~ '^https?://'::"text"))),
    CONSTRAINT "prices_merchant_content_check" CHECK ((("merchant" IS NULL) OR ("length"(TRIM(BOTH FROM "merchant")) > 0))),
    CONSTRAINT "prices_price_check" CHECK (("price" > (0)::numeric)),
    CONSTRAINT "prices_total_check" CHECK ((("total" IS NULL) OR ("total" >= "price"))),
    CONSTRAINT "prices_updated_at_check" CHECK (("updated_at" IS NOT NULL)),
    CONSTRAINT "prices_updated_at_timing_check" CHECK (("updated_at" >= "created_at"))
);

-- Creating table: public.profiles
CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "bio" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "role" character varying(50) DEFAULT 'user'::character varying NOT NULL,
    CONSTRAINT "profiles_bio_content_check" CHECK ((("bio" IS NULL) OR ("length"(TRIM(BOTH FROM "bio")) > 0))),
    CONSTRAINT "profiles_bio_length_check" CHECK ((("bio" IS NULL) OR ("length"("bio") <= 1000))),
    CONSTRAINT "profiles_created_at_check" CHECK (("created_at" IS NOT NULL)),
    CONSTRAINT "profiles_role_check" CHECK ((("role")::"text" = ANY ((ARRAY['admin'::character varying, 'moderator'::character varying, 'user'::character varying])::"text"[]))),
    CONSTRAINT "profiles_updated_at_check" CHECK (("updated_at" IS NOT NULL)),
    CONSTRAINT "profiles_updated_at_timing_check" CHECK (("updated_at" >= "created_at"))
);

-- Creating table: public.promo_codes
CREATE TABLE IF NOT EXISTS "public"."promo_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "description" "text",
    "discount_type" "text",
    "discount_value" numeric NOT NULL,
    "applies_to_ticket_types" "uuid"[] DEFAULT '{}'::"uuid"[],
    "max_uses" integer,
    "current_uses" integer DEFAULT 0,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "promo_codes_discount_type_check" CHECK (("discount_type" = ANY (ARRAY['percentage'::"text", 'fixed_amount'::"text"])))
);

-- Creating table: public.publishers
CREATE TABLE IF NOT EXISTS "public"."publishers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "featured" boolean DEFAULT false NOT NULL,
    "website" character varying,
    "email" character varying,
    "phone" character varying,
    "address_line1" character varying,
    "address_line2" character varying,
    "city" character varying,
    "state" character varying,
    "postal_code" character varying,
    "country" character varying,
    "about" "text",
    "cover_image_id" "uuid",
    "publisher_image_id" "uuid",
    "publisher_gallery_id" "uuid",
    "founded_year" integer,
    "country_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.reactions
CREATE TABLE IF NOT EXISTS "public"."reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "feed_entry_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.reading_challenges
CREATE TABLE IF NOT EXISTS "public"."reading_challenges" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "year" integer NOT NULL,
    "target_books" integer NOT NULL,
    "books_read" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.reading_goals
CREATE TABLE IF NOT EXISTS "public"."reading_goals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "goal_type" "text" NOT NULL,
    "target_value" integer NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "current_value" integer DEFAULT 0 NOT NULL,
    "is_completed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reading_goals_goal_type_check" CHECK (("goal_type" = ANY (ARRAY['books'::"text", 'pages'::"text", 'minutes'::"text", 'streak'::"text"]))),
    CONSTRAINT "valid_goal" CHECK ((("target_value" > 0) AND ("end_date" >= "start_date")))
);

-- Creating table: public.reading_list_items
CREATE TABLE IF NOT EXISTS "public"."reading_list_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "list_id" "uuid" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text",
    "book_id" "uuid"
);

-- Creating table: public.reading_lists
CREATE TABLE IF NOT EXISTS "public"."reading_lists" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "is_public" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.reading_progress
CREATE TABLE IF NOT EXISTS "public"."reading_progress" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "progress_percentage" integer DEFAULT 0 NOT NULL,
    "start_date" timestamp with time zone,
    "finish_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid",
    CONSTRAINT "reading_progress_progress_percentage_check" CHECK ((("progress_percentage" >= 0) AND ("progress_percentage" <= 100))),
    CONSTRAINT "reading_progress_status_check" CHECK (("status" = ANY (ARRAY['want_to_read'::"text", 'currently_reading'::"text", 'read'::"text"])))
);

-- Creating table: public.reading_series
CREATE TABLE IF NOT EXISTS "public"."reading_series" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "publisher_id" integer,
    "organizer_id" "uuid" NOT NULL,
    "cover_image_id" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "author_id" "uuid"
);

-- Creating table: public.reading_sessions
CREATE TABLE IF NOT EXISTS "public"."reading_sessions" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid",
    "book_id" "uuid",
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "pages_read" integer,
    "minutes_spent" integer,
    "notes" "text",
    "created_at" timestamp with time zone,
    CONSTRAINT "reading_sessions_new_book_id_check" CHECK (("book_id" IS NOT NULL)),
    CONSTRAINT "reading_sessions_new_created_at_check" CHECK (("created_at" IS NOT NULL)),
    CONSTRAINT "reading_sessions_new_created_at_timing_check" CHECK (("created_at" >= "start_time")),
    CONSTRAINT "reading_sessions_new_minutes_spent_check" CHECK ((("minutes_spent" IS NULL) OR ("minutes_spent" >= 0))),
    CONSTRAINT "reading_sessions_new_notes_content_check" CHECK ((("notes" IS NULL) OR ("length"(TRIM(BOTH FROM "notes")) > 0))),
    CONSTRAINT "reading_sessions_new_notes_length_check" CHECK ((("notes" IS NULL) OR ("length"("notes") <= 2000))),
    CONSTRAINT "reading_sessions_new_pages_read_check" CHECK ((("pages_read" IS NULL) OR ("pages_read" >= 0))),
    CONSTRAINT "reading_sessions_new_start_time_check" CHECK (("start_time" IS NOT NULL)),
    CONSTRAINT "reading_sessions_new_time_order_check" CHECK ((("end_time" IS NULL) OR ("end_time" >= "start_time"))),
    CONSTRAINT "reading_sessions_new_user_id_check" CHECK (("user_id" IS NOT NULL))
);

-- Creating table: public.reading_stats_daily
CREATE TABLE IF NOT EXISTS "public"."reading_stats_daily" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "total_pages" integer DEFAULT 0 NOT NULL,
    "total_minutes" integer DEFAULT 0 NOT NULL,
    "books_read" integer DEFAULT 0 NOT NULL,
    "books_started" integer DEFAULT 0 NOT NULL,
    "books_finished" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.reading_streaks
CREATE TABLE IF NOT EXISTS "public"."reading_streaks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "days" integer NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_streak" CHECK ((("days" > 0) AND ("end_date" >= "start_date")))
);

-- Creating table: public.review_likes
CREATE TABLE IF NOT EXISTS "public"."review_likes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "review_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.reviews
CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "book_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "review_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reviews_created_at_check" CHECK (("created_at" IS NOT NULL)),
    CONSTRAINT "reviews_new_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "reviews_text_content_check" CHECK ((("review_text" IS NULL) OR ("length"(TRIM(BOTH FROM "review_text")) > 0))),
    CONSTRAINT "reviews_text_length_check" CHECK ((("review_text" IS NULL) OR ("length"("review_text") <= 10000))),
    CONSTRAINT "reviews_updated_at_check" CHECK (("updated_at" IS NOT NULL)),
    CONSTRAINT "reviews_updated_at_timing_check" CHECK (("updated_at" >= "created_at"))
);

-- Creating table: public.roles
CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);

-- Creating table: public.series_events
CREATE TABLE IF NOT EXISTS "public"."series_events" (
    "series_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "event_number" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.session_registrations
CREATE TABLE IF NOT EXISTS "public"."session_registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "registration_status" "text",
    "registration_time" timestamp with time zone DEFAULT "now"(),
    "check_in_time" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "session_registrations_registration_status_check" CHECK (("registration_status" = ANY (ARRAY['registered'::"text", 'waitlisted'::"text", 'cancelled'::"text", 'attended'::"text", 'no_show'::"text"])))
);

-- Creating table: public.similar_books
CREATE TABLE IF NOT EXISTS "public"."similar_books" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "similar_book_id" "uuid" NOT NULL,
    "similarity_score" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "similar_books_book_ids_not_null" CHECK ((("book_id" IS NOT NULL) AND ("similar_book_id" IS NOT NULL))),
    CONSTRAINT "similar_books_created_at_check" CHECK (("created_at" IS NOT NULL)),
    CONSTRAINT "similar_books_no_self_reference" CHECK (("book_id" <> "similar_book_id")),
    CONSTRAINT "similar_books_similarity_score_check" CHECK ((("similarity_score" IS NULL) OR (("similarity_score" >= (0)::numeric) AND ("similarity_score" <= (1)::numeric))))
);

-- Creating table: public.statuses
CREATE TABLE IF NOT EXISTS "public"."statuses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);

-- Creating table: public.subjects
CREATE TABLE IF NOT EXISTS "public"."subjects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "parent_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.survey_questions
CREATE TABLE IF NOT EXISTS "public"."survey_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "survey_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "question_type" "text",
    "options" "jsonb",
    "is_required" boolean DEFAULT false,
    "display_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "survey_questions_question_type_check" CHECK (("question_type" = ANY (ARRAY['rating'::"text", 'text'::"text", 'multiple_choice'::"text", 'checkbox'::"text"])))
);

-- Creating table: public.survey_responses
CREATE TABLE IF NOT EXISTS "public"."survey_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "survey_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "registration_id" "uuid",
    "response_data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.sync_state
CREATE TABLE IF NOT EXISTS "public"."sync_state" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "type" "text" NOT NULL,
    "last_synced_date" timestamp with time zone NOT NULL,
    "current_page" integer DEFAULT 1 NOT NULL,
    "total_books" integer DEFAULT 0 NOT NULL,
    "processed_books" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'idle'::"text" NOT NULL,
    "error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Creating table: public.tags
CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.ticket_benefits
CREATE TABLE IF NOT EXISTS "public"."ticket_benefits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_type_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "display_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.ticket_types
CREATE TABLE IF NOT EXISTS "public"."ticket_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "quantity_total" integer,
    "quantity_sold" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "sale_start_date" timestamp with time zone,
    "sale_end_date" timestamp with time zone,
    "min_per_order" integer DEFAULT 1,
    "max_per_order" integer DEFAULT 10,
    "has_waitlist" boolean DEFAULT false,
    "includes_features" "jsonb",
    "visibility" "text",
    "access_code" "text",
    "display_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ticket_types_visibility_check" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'private'::"text", 'hidden'::"text", 'code_required'::"text"])))
);

-- Creating table: public.tickets
CREATE TABLE IF NOT EXISTS "public"."tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "ticket_type_id" "uuid" NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "ticket_number" "text" NOT NULL,
    "status" "text",
    "purchase_price" numeric NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "attendee_name" "text",
    "attendee_email" "text",
    "checked_in_at" timestamp with time zone,
    "checked_in_by" "uuid",
    "qr_code" "text",
    "barcode" "text",
    "ticket_pdf_url" "text",
    "access_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tickets_status_check" CHECK (("status" = ANY (ARRAY['reserved'::"text", 'purchased'::"text", 'refunded'::"text", 'cancelled'::"text", 'checked_in'::"text"])))
);

-- Creating table: public.user_book_interactions
CREATE TABLE IF NOT EXISTS "public"."user_book_interactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "interaction_type" "text" NOT NULL,
    "interaction_value" double precision,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid",
    CONSTRAINT "user_book_interactions_book_user_check" CHECK ((("book_id" IS NULL) OR ("user_id" IS NOT NULL))),
    CONSTRAINT "user_book_interactions_content_check" CHECK ((("book_id" IS NOT NULL) OR ("interaction_type" IS NOT NULL))),
    CONSTRAINT "user_book_interactions_created_at_check" CHECK (("created_at" IS NOT NULL)),
    CONSTRAINT "user_book_interactions_type_check" CHECK (("interaction_type" = ANY (ARRAY['view'::"text", 'like'::"text", 'share'::"text", 'bookmark'::"text", 'rating'::"text", 'review'::"text", 'purchase'::"text", 'download'::"text", 'read'::"text", 'recommend'::"text"]))),
    CONSTRAINT "user_book_interactions_type_not_empty" CHECK ((("interaction_type" IS NULL) OR ("length"(TRIM(BOTH FROM "interaction_type")) > 0))),
    CONSTRAINT "user_book_interactions_updated_at_check" CHECK (("updated_at" IS NOT NULL)),
    CONSTRAINT "user_book_interactions_updated_at_timing_check" CHECK (("updated_at" >= "created_at")),
    CONSTRAINT "user_book_interactions_value_check" CHECK ((("interaction_value" IS NULL) OR (("interaction_value" >= (0)::double precision) AND ("interaction_value" <= (100)::double precision))))
);

-- Creating table: public.user_reading_preferences
CREATE TABLE IF NOT EXISTS "public"."user_reading_preferences" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "favorite_genres" "text"[] DEFAULT '{}'::"text"[],
    "favorite_authors" "text"[] DEFAULT '{}'::"text"[],
    "disliked_genres" "text"[] DEFAULT '{}'::"text"[],
    "preferred_length" "text" DEFAULT 'medium'::"text",
    "preferred_complexity" "text" DEFAULT 'medium'::"text",
    "preferred_publication_era" "text" DEFAULT 'any'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Creating table: public.users
CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" character varying(255),
    "name" character varying(255),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "role_id" "uuid"
);

-- Creating table: realtime.messages
CREATE TABLE IF NOT EXISTS "realtime"."messages" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
)
PARTITION BY RANGE ("inserted_at");

-- Creating table: realtime.messages_2025_05_28
CREATE TABLE IF NOT EXISTS "realtime"."messages_2025_05_28" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);

-- Creating table: realtime.messages_2025_05_29
CREATE TABLE IF NOT EXISTS "realtime"."messages_2025_05_29" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);

-- Creating table: realtime.messages_2025_05_30
CREATE TABLE IF NOT EXISTS "realtime"."messages_2025_05_30" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);

-- Creating table: realtime.messages_2025_05_31
CREATE TABLE IF NOT EXISTS "realtime"."messages_2025_05_31" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);

-- Creating table: realtime.messages_2025_06_01
CREATE TABLE IF NOT EXISTS "realtime"."messages_2025_06_01" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);

-- Creating table: realtime.messages_2025_06_02
CREATE TABLE IF NOT EXISTS "realtime"."messages_2025_06_02" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);

-- Creating table: realtime.messages_2025_06_03
CREATE TABLE IF NOT EXISTS "realtime"."messages_2025_06_03" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);

-- Creating table: realtime.schema_migrations
CREATE TABLE IF NOT EXISTS "realtime"."schema_migrations" (
    "version" bigint NOT NULL,
    "inserted_at" timestamp(0) without time zone
);

-- Creating table: realtime.subscription
CREATE TABLE IF NOT EXISTS "realtime"."subscription" (
    "id" bigint NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "entity" "regclass" NOT NULL,
    "filters" "realtime"."user_defined_filter"[] DEFAULT '{}'::"realtime"."user_defined_filter"[] NOT NULL,
    "claims" "jsonb" NOT NULL,
    "claims_role" "regrole" GENERATED ALWAYS AS ("realtime"."to_regrole"(("claims" ->> 'role'::"text"))) STORED NOT NULL,
    "created_at" timestamp without time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

-- Creating table: storage.buckets
CREATE TABLE IF NOT EXISTS "storage"."buckets" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "public" boolean DEFAULT false,
    "avif_autodetection" boolean DEFAULT false,
    "file_size_limit" bigint,
    "allowed_mime_types" "text"[],
    "owner_id" "text"
);

-- Creating table: storage.migrations
CREATE TABLE IF NOT EXISTS "storage"."migrations" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "hash" character varying(40) NOT NULL,
    "executed_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Creating table: storage.objects
CREATE TABLE IF NOT EXISTS "storage"."objects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bucket_id" "text",
    "name" "text",
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_accessed_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb",
    "path_tokens" "text"[] GENERATED ALWAYS AS ("string_to_array"("name", '/'::"text")) STORED,
    "version" "text",
    "owner_id" "text",
    "user_metadata" "jsonb"
);

-- Creating table: storage.s3_multipart_uploads
CREATE TABLE IF NOT EXISTS "storage"."s3_multipart_uploads" (
    "id" "text" NOT NULL,
    "in_progress_size" bigint DEFAULT 0 NOT NULL,
    "upload_signature" "text" NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "version" "text" NOT NULL,
    "owner_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_metadata" "jsonb"
);

-- Creating table: storage.s3_multipart_uploads_parts
CREATE TABLE IF NOT EXISTS "storage"."s3_multipart_uploads_parts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "upload_id" "text" NOT NULL,
    "size" bigint DEFAULT 0 NOT NULL,
    "part_number" integer NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "etag" "text" NOT NULL,
    "owner_id" "text",
    "version" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- =====================================================
-- PHASE 4: INDEXES
-- =====================================================

-- Creating index: audit_logs_instance_id_idx
CREATE INDEX "audit_logs_instance_id_idx" ON "auth"."audit_log_entries" USING "btree" ("instance_id");

-- Creating index: factor_id_created_at_idx
CREATE INDEX "factor_id_created_at_idx" ON "auth"."mfa_factors" USING "btree" ("user_id", "created_at");

-- Creating index: flow_state_created_at_idx
CREATE INDEX "flow_state_created_at_idx" ON "auth"."flow_state" USING "btree" ("created_at" DESC);

-- Creating index: identities_email_idx
CREATE INDEX "identities_email_idx" ON "auth"."identities" USING "btree" ("email" "text_pattern_ops");

-- Creating index: identities_user_id_idx
CREATE INDEX "identities_user_id_idx" ON "auth"."identities" USING "btree" ("user_id");

-- Creating index: idx_activities_author_id
CREATE INDEX "idx_activities_author_id" ON "public"."activities" USING "btree" ("author_id");

-- Creating index: idx_activities_event_id
CREATE INDEX "idx_activities_event_id" ON "public"."activities" USING "btree" ("event_id");

-- Creating index: idx_activities_group_id
CREATE INDEX "idx_activities_group_id" ON "public"."activities" USING "btree" ("group_id");

-- Creating index: idx_activities_user_profile_id
CREATE INDEX "idx_activities_user_profile_id" ON "public"."activities" USING "btree" ("user_profile_id");

-- Creating index: idx_album_analytics_date
CREATE INDEX "idx_album_analytics_date" ON "public"."album_analytics" USING "btree" ("album_id", "date");

-- Creating index: idx_album_images_cover
CREATE INDEX "idx_album_images_cover" ON "public"."album_images" USING "btree" ("album_id", "is_cover") WHERE ("is_cover" = true);

-- Creating index: idx_album_images_featured
CREATE INDEX "idx_album_images_featured" ON "public"."album_images" USING "btree" ("album_id", "is_featured") WHERE ("is_featured" = true);

-- Creating index: idx_album_images_order
CREATE INDEX "idx_album_images_order" ON "public"."album_images" USING "btree" ("album_id", "display_order");

-- Creating index: idx_album_shares_expires
CREATE INDEX "idx_album_shares_expires" ON "public"."album_shares" USING "btree" ("expires_at") WHERE ("expires_at" IS NOT NULL);

-- Creating index: idx_album_shares_token
CREATE INDEX "idx_album_shares_token" ON "public"."album_shares" USING "btree" ("access_token");

-- Creating index: idx_auth_code
CREATE INDEX "idx_auth_code" ON "auth"."flow_state" USING "btree" ("auth_code");

-- Creating index: idx_authors_featured
CREATE INDEX "idx_authors_featured" ON "public"."authors" USING "btree" ("featured");

-- Creating index: idx_authors_name
CREATE INDEX "idx_authors_name" ON "public"."authors" USING "btree" ("name");

-- Creating index: idx_book_discussions_user_id
CREATE INDEX "idx_book_discussions_user_id" ON "public"."discussions" USING "btree" ("user_id");

-- Creating index: idx_book_genres_name
CREATE INDEX "idx_book_genres_name" ON "public"."book_genres" USING "btree" ("name");

-- Creating index: idx_book_reviews_group_id
CREATE INDEX "idx_book_reviews_group_id" ON "public"."book_reviews" USING "btree" ("group_id");

-- Creating index: idx_book_reviews_visibility
CREATE INDEX "idx_book_reviews_visibility" ON "public"."book_reviews" USING "btree" ("visibility");

-- Creating index: idx_book_tags_name
CREATE INDEX "idx_book_tags_name" ON "public"."book_tags" USING "btree" ("name");

-- Creating index: idx_books_author
CREATE INDEX "idx_books_author" ON "public"."books" USING "btree" ("author");

-- Creating index: idx_books_author_date
CREATE INDEX "idx_books_author_date" ON "public"."books" USING "btree" ("author_id", "publication_date");

-- Creating index: idx_books_author_id
CREATE INDEX "idx_books_author_id" ON "public"."books" USING "btree" ("author_id");

-- Creating index: idx_books_author_trgm
CREATE INDEX "idx_books_author_trgm" ON "public"."books" USING "gin" ("author" "public"."gin_trgm_ops");

-- Creating index: idx_books_average_rating
CREATE INDEX "idx_books_average_rating" ON "public"."books" USING "btree" ("average_rating" DESC);

-- Creating index: idx_books_binding_type_id
CREATE INDEX "idx_books_binding_type_id" ON "public"."books" USING "btree" ("binding_type_id");

-- Creating index: idx_books_cover_image_id
CREATE INDEX "idx_books_cover_image_id" ON "public"."books" USING "btree" ("cover_image_id");

-- Creating index: idx_books_created_at
CREATE INDEX "idx_books_created_at" ON "public"."books" USING "btree" ("created_at");

-- Creating index: idx_books_featured
CREATE INDEX "idx_books_featured" ON "public"."books" USING "btree" ("featured") WHERE ("featured" = true);

-- Creating index: idx_books_format_type_id
CREATE INDEX "idx_books_format_type_id" ON "public"."books" USING "btree" ("format_type_id");

-- Creating index: idx_books_isbn10
CREATE INDEX "idx_books_isbn10" ON "public"."books" USING "btree" ("isbn10") WHERE ("isbn10" IS NOT NULL);

-- Creating index: idx_books_isbn13
CREATE INDEX "idx_books_isbn13" ON "public"."books" USING "btree" ("isbn13") WHERE ("isbn13" IS NOT NULL);

-- Creating index: idx_books_overview_trgm
CREATE INDEX "idx_books_overview_trgm" ON "public"."books" USING "gin" ("overview" "public"."gin_trgm_ops");

-- Creating index: idx_books_publication_date
CREATE INDEX "idx_books_publication_date" ON "public"."books" USING "btree" ("publication_date");

-- Creating index: idx_books_publisher_date
CREATE INDEX "idx_books_publisher_date" ON "public"."books" USING "btree" ("publisher_id", "publication_date");

-- Creating index: idx_books_publisher_id
CREATE INDEX "idx_books_publisher_id" ON "public"."books" USING "btree" ("publisher_id");

-- Creating index: idx_books_rating_reviews
CREATE INDEX "idx_books_rating_reviews" ON "public"."books" USING "btree" ("average_rating" DESC, "review_count" DESC);

-- Creating index: idx_books_review_count
CREATE INDEX "idx_books_review_count" ON "public"."books" USING "btree" ("review_count" DESC);

-- Creating index: idx_books_synopsis_trgm
CREATE INDEX "idx_books_synopsis_trgm" ON "public"."books" USING "gin" ("synopsis" "public"."gin_trgm_ops");

-- Creating index: idx_books_title
CREATE INDEX "idx_books_title" ON "public"."books" USING "btree" ("title");

-- Creating index: idx_books_title_author
CREATE INDEX "idx_books_title_author" ON "public"."books" USING "btree" ("title", "author");

-- Creating index: idx_books_title_trgm
CREATE INDEX "idx_books_title_trgm" ON "public"."books" USING "gin" ("title" "public"."gin_trgm_ops");

-- Creating index: idx_contact_info_new_entity
CREATE INDEX "idx_contact_info_new_entity" ON "public"."contact_info" USING "btree" ("entity_type", "entity_id");

-- Creating index: idx_countries_code
CREATE INDEX "idx_countries_code" ON "public"."countries" USING "btree" ("code");

-- Creating index: idx_countries_name
CREATE INDEX "idx_countries_name" ON "public"."countries" USING "btree" ("name");

-- Creating index: idx_discussion_comments_discussion_id
CREATE INDEX "idx_discussion_comments_discussion_id" ON "public"."discussion_comments" USING "btree" ("discussion_id");

-- Creating index: idx_discussion_comments_user_id
CREATE INDEX "idx_discussion_comments_user_id" ON "public"."discussion_comments" USING "btree" ("user_id");

-- Creating index: idx_event_analytics_date
CREATE INDEX "idx_event_analytics_date" ON "public"."event_analytics" USING "btree" ("date");

-- Creating index: idx_event_analytics_event_id
CREATE INDEX "idx_event_analytics_event_id" ON "public"."event_analytics" USING "btree" ("event_id");

-- Creating index: idx_event_approvals_approval_status
CREATE INDEX "idx_event_approvals_approval_status" ON "public"."event_approvals" USING "btree" ("approval_status");

-- Creating index: idx_event_approvals_event_id
CREATE INDEX "idx_event_approvals_event_id" ON "public"."event_approvals" USING "btree" ("event_id");

-- Creating index: idx_event_books_event_id
CREATE INDEX "idx_event_books_event_id" ON "public"."event_books" USING "btree" ("event_id");

-- Creating index: idx_event_calendar_exports_event_id
CREATE INDEX "idx_event_calendar_exports_event_id" ON "public"."event_calendar_exports" USING "btree" ("event_id");

-- Creating index: idx_event_calendar_exports_user_id
CREATE INDEX "idx_event_calendar_exports_user_id" ON "public"."event_calendar_exports" USING "btree" ("user_id");

-- Creating index: idx_event_categories_parent_id
CREATE INDEX "idx_event_categories_parent_id" ON "public"."event_categories" USING "btree" ("parent_id");

-- Creating index: idx_event_chat_messages_chat_room_id
CREATE INDEX "idx_event_chat_messages_chat_room_id" ON "public"."event_chat_messages" USING "btree" ("chat_room_id");

-- Creating index: idx_event_chat_messages_created_at
CREATE INDEX "idx_event_chat_messages_created_at" ON "public"."event_chat_messages" USING "btree" ("created_at");

-- Creating index: idx_event_chat_messages_user_id
CREATE INDEX "idx_event_chat_messages_user_id" ON "public"."event_chat_messages" USING "btree" ("user_id");

-- Creating index: idx_event_chat_rooms_event_id
CREATE INDEX "idx_event_chat_rooms_event_id" ON "public"."event_chat_rooms" USING "btree" ("event_id");

-- Creating index: idx_event_chat_rooms_is_active
CREATE INDEX "idx_event_chat_rooms_is_active" ON "public"."event_chat_rooms" USING "btree" ("is_active");

-- Creating index: idx_event_comments_event_id
CREATE INDEX "idx_event_comments_event_id" ON "public"."event_comments" USING "btree" ("event_id");

-- Creating index: idx_event_comments_parent_id
CREATE INDEX "idx_event_comments_parent_id" ON "public"."event_comments" USING "btree" ("parent_id");

-- Creating index: idx_event_comments_user_id
CREATE INDEX "idx_event_comments_user_id" ON "public"."event_comments" USING "btree" ("user_id");

-- Creating index: idx_event_creator_permissions_user_id
CREATE INDEX "idx_event_creator_permissions_user_id" ON "public"."event_creator_permissions" USING "btree" ("user_id");

-- Creating index: idx_event_financials_event_id
CREATE INDEX "idx_event_financials_event_id" ON "public"."event_financials" USING "btree" ("event_id");

-- Creating index: idx_event_interests_event_id
CREATE INDEX "idx_event_interests_event_id" ON "public"."event_interests" USING "btree" ("event_id");

-- Creating index: idx_event_interests_user_id
CREATE INDEX "idx_event_interests_user_id" ON "public"."event_interests" USING "btree" ("user_id");

-- Creating index: idx_event_likes_event_id
CREATE INDEX "idx_event_likes_event_id" ON "public"."event_likes" USING "btree" ("event_id");

-- Creating index: idx_event_likes_user_id
CREATE INDEX "idx_event_likes_user_id" ON "public"."event_likes" USING "btree" ("user_id");

-- Creating index: idx_event_livestreams_event_id
CREATE INDEX "idx_event_livestreams_event_id" ON "public"."event_livestreams" USING "btree" ("event_id");

-- Creating index: idx_event_livestreams_is_active
CREATE INDEX "idx_event_livestreams_is_active" ON "public"."event_livestreams" USING "btree" ("is_active");

-- Creating index: idx_event_locations_event_id
CREATE INDEX "idx_event_locations_event_id" ON "public"."event_locations" USING "btree" ("event_id");

-- Creating index: idx_event_media_event_id
CREATE INDEX "idx_event_media_event_id" ON "public"."event_media" USING "btree" ("event_id");

-- Creating index: idx_event_permission_requests_status
CREATE INDEX "idx_event_permission_requests_status" ON "public"."event_permission_requests" USING "btree" ("status");

-- Creating index: idx_event_permission_requests_user_id
CREATE INDEX "idx_event_permission_requests_user_id" ON "public"."event_permission_requests" USING "btree" ("user_id");

-- Creating index: idx_event_questions_event_id
CREATE INDEX "idx_event_questions_event_id" ON "public"."event_questions" USING "btree" ("event_id");

-- Creating index: idx_event_registrations_event_id
CREATE INDEX "idx_event_registrations_event_id" ON "public"."event_registrations" USING "btree" ("event_id");

-- Creating index: idx_event_registrations_status
CREATE INDEX "idx_event_registrations_status" ON "public"."event_registrations" USING "btree" ("registration_status");

-- Creating index: idx_event_registrations_user_id
CREATE INDEX "idx_event_registrations_user_id" ON "public"."event_registrations" USING "btree" ("user_id");

-- Creating index: idx_event_reminders_event_id
CREATE INDEX "idx_event_reminders_event_id" ON "public"."event_reminders" USING "btree" ("event_id");

-- Creating index: idx_event_reminders_reminder_time
CREATE INDEX "idx_event_reminders_reminder_time" ON "public"."event_reminders" USING "btree" ("reminder_time");

-- Creating index: idx_event_reminders_user_id
CREATE INDEX "idx_event_reminders_user_id" ON "public"."event_reminders" USING "btree" ("user_id");

-- Creating index: idx_event_sessions_event_id
CREATE INDEX "idx_event_sessions_event_id" ON "public"."event_sessions" USING "btree" ("event_id");

-- Creating index: idx_event_sessions_location_id
CREATE INDEX "idx_event_sessions_location_id" ON "public"."event_sessions" USING "btree" ("location_id");

-- Creating index: idx_event_shares_event_id
CREATE INDEX "idx_event_shares_event_id" ON "public"."event_shares" USING "btree" ("event_id");

-- Creating index: idx_event_shares_user_id
CREATE INDEX "idx_event_shares_user_id" ON "public"."event_shares" USING "btree" ("user_id");

-- Creating index: idx_event_speakers_event_id
CREATE INDEX "idx_event_speakers_event_id" ON "public"."event_speakers" USING "btree" ("event_id");

-- Creating index: idx_event_speakers_user_id
CREATE INDEX "idx_event_speakers_user_id" ON "public"."event_speakers" USING "btree" ("user_id");

-- Creating index: idx_event_sponsors_event_id
CREATE INDEX "idx_event_sponsors_event_id" ON "public"."event_sponsors" USING "btree" ("event_id");

-- Creating index: idx_event_sponsors_is_featured
CREATE INDEX "idx_event_sponsors_is_featured" ON "public"."event_sponsors" USING "btree" ("is_featured");

-- Creating index: idx_event_sponsors_sponsor_level
CREATE INDEX "idx_event_sponsors_sponsor_level" ON "public"."event_sponsors" USING "btree" ("sponsor_level");

-- Creating index: idx_event_staff_event_id
CREATE INDEX "idx_event_staff_event_id" ON "public"."event_staff" USING "btree" ("event_id");

-- Creating index: idx_event_staff_user_id
CREATE INDEX "idx_event_staff_user_id" ON "public"."event_staff" USING "btree" ("user_id");

-- Creating index: idx_event_surveys_event_id
CREATE INDEX "idx_event_surveys_event_id" ON "public"."event_surveys" USING "btree" ("event_id");

-- Creating index: idx_event_surveys_is_active
CREATE INDEX "idx_event_surveys_is_active" ON "public"."event_surveys" USING "btree" ("is_active");

-- Creating index: idx_event_views_event_id
CREATE INDEX "idx_event_views_event_id" ON "public"."event_views" USING "btree" ("event_id");

-- Creating index: idx_event_views_user_id
CREATE INDEX "idx_event_views_user_id" ON "public"."event_views" USING "btree" ("user_id");

-- Creating index: idx_event_views_viewed_at
CREATE INDEX "idx_event_views_viewed_at" ON "public"."event_views" USING "btree" ("viewed_at");

-- Creating index: idx_event_waitlists_event_id
CREATE INDEX "idx_event_waitlists_event_id" ON "public"."event_waitlists" USING "btree" ("event_id");

-- Creating index: idx_event_waitlists_status
CREATE INDEX "idx_event_waitlists_status" ON "public"."event_waitlists" USING "btree" ("status");

-- Creating index: idx_event_waitlists_ticket_type_id
CREATE INDEX "idx_event_waitlists_ticket_type_id" ON "public"."event_waitlists" USING "btree" ("ticket_type_id");

-- Creating index: idx_event_waitlists_user_id
CREATE INDEX "idx_event_waitlists_user_id" ON "public"."event_waitlists" USING "btree" ("user_id");

-- Creating index: idx_events_category_id
CREATE INDEX "idx_events_category_id" ON "public"."events" USING "btree" ("event_category_id");

-- Creating index: idx_events_created_by
CREATE INDEX "idx_events_created_by" ON "public"."events" USING "btree" ("created_by");

-- Creating index: idx_events_featured
CREATE INDEX "idx_events_featured" ON "public"."events" USING "btree" ("featured") WHERE ("featured" = true);

-- Creating index: idx_events_group_id
CREATE INDEX "idx_events_group_id" ON "public"."events" USING "btree" ("group_id");

-- Creating index: idx_events_parent_event_id
CREATE INDEX "idx_events_parent_event_id" ON "public"."events" USING "btree" ("parent_event_id");

-- Creating index: idx_events_slug
CREATE INDEX "idx_events_slug" ON "public"."events" USING "btree" ("slug");

-- Creating index: idx_events_start_date
CREATE INDEX "idx_events_start_date" ON "public"."events" USING "btree" ("start_date");

-- Creating index: idx_events_status
CREATE INDEX "idx_events_status" ON "public"."events" USING "btree" ("status");

-- Creating index: idx_events_type_id
CREATE INDEX "idx_events_type_id" ON "public"."events" USING "btree" ("type_id");

-- Creating index: idx_events_visibility
CREATE INDEX "idx_events_visibility" ON "public"."events" USING "btree" ("visibility");

-- Creating index: idx_feed_entries_content_author_id
CREATE INDEX "idx_feed_entries_content_author_id" ON "public"."feed_entries" USING "btree" ((("content" ->> 'author_id'::"text")));

-- Creating index: idx_feed_entries_created_at
CREATE INDEX "idx_feed_entries_created_at" ON "public"."feed_entries" USING "btree" ("created_at");

-- Creating index: idx_feed_entries_group_id
CREATE INDEX "idx_feed_entries_group_id" ON "public"."feed_entries" USING "btree" ("group_id");

-- Creating index: idx_feed_entries_type
CREATE INDEX "idx_feed_entries_type" ON "public"."feed_entries" USING "btree" ("type");

-- Creating index: idx_feed_entries_user_id
CREATE INDEX "idx_feed_entries_user_id" ON "public"."feed_entries" USING "btree" ("user_id");

-- Creating index: idx_feed_entries_visibility
CREATE INDEX "idx_feed_entries_visibility" ON "public"."feed_entries" USING "btree" ("visibility");

-- Creating index: idx_follow_target_types_name
CREATE INDEX "idx_follow_target_types_name" ON "public"."follow_target_types" USING "btree" ("name");

-- Creating index: idx_follows_follower_id
CREATE INDEX "idx_follows_follower_id" ON "public"."follows" USING "btree" ("follower_id");

-- Creating index: idx_follows_following_id
CREATE INDEX "idx_follows_following_id" ON "public"."follows" USING "btree" ("following_id");

-- Creating index: idx_friends_friend_id
CREATE INDEX "idx_friends_friend_id" ON "public"."friends" USING "btree" ("friend_id");

-- Creating index: idx_friends_status
CREATE INDEX "idx_friends_status" ON "public"."friends" USING "btree" ("status");

-- Creating index: idx_friends_user_id
CREATE INDEX "idx_friends_user_id" ON "public"."friends" USING "btree" ("user_id");

-- Creating index: idx_group_achievements_group_id
CREATE INDEX "idx_group_achievements_group_id" ON "public"."group_achievements" USING "btree" ("group_id");

-- Creating index: idx_group_achievements_group_id_type
CREATE INDEX "idx_group_achievements_group_id_type" ON "public"."group_achievements" USING "btree" ("group_id", "type");

-- Creating index: idx_group_analytics_activity_count
CREATE INDEX "idx_group_analytics_activity_count" ON "public"."group_analytics" USING "btree" ("group_id", "recorded_at") WHERE ("metric_name" = 'activity_count'::"text");

-- Creating index: idx_group_analytics_group_date
CREATE INDEX "idx_group_analytics_group_date" ON "public"."group_analytics" USING "btree" ("group_id", "recorded_at");

-- Creating index: idx_group_analytics_group_id
CREATE INDEX "idx_group_analytics_group_id" ON "public"."group_analytics" USING "btree" ("group_id");

-- Creating index: idx_group_analytics_group_metric
CREATE INDEX "idx_group_analytics_group_metric" ON "public"."group_analytics" USING "btree" ("group_id", "metric_name");

-- Creating index: idx_group_analytics_member_count
CREATE INDEX "idx_group_analytics_member_count" ON "public"."group_analytics" USING "btree" ("group_id", "recorded_at") WHERE ("metric_name" = 'member_count'::"text");

-- Creating index: idx_group_analytics_metric_name
CREATE INDEX "idx_group_analytics_metric_name" ON "public"."group_analytics" USING "btree" ("metric_name");

-- Creating index: idx_group_analytics_post_count
CREATE INDEX "idx_group_analytics_post_count" ON "public"."group_analytics" USING "btree" ("group_id", "recorded_at") WHERE ("metric_name" = 'post_count'::"text");

-- Creating index: idx_group_analytics_recorded_at
CREATE INDEX "idx_group_analytics_recorded_at" ON "public"."group_analytics" USING "btree" ("recorded_at");

-- Creating index: idx_group_announcements_group_id
CREATE INDEX "idx_group_announcements_group_id" ON "public"."group_announcements" USING "btree" ("group_id");

-- Creating index: idx_group_audit_log_group_id
CREATE INDEX "idx_group_audit_log_group_id" ON "public"."group_audit_log" USING "btree" ("group_id");

-- Creating index: idx_group_book_lists_group_id
CREATE INDEX "idx_group_book_lists_group_id" ON "public"."group_book_lists" USING "btree" ("group_id");

-- Creating index: idx_group_book_reviews_new_book_id
CREATE INDEX "idx_group_book_reviews_new_book_id" ON "public"."group_book_reviews" USING "btree" ("book_id");

-- Creating index: idx_group_book_reviews_new_book_rating
CREATE INDEX "idx_group_book_reviews_new_book_rating" ON "public"."group_book_reviews" USING "btree" ("book_id", "rating");

-- Creating index: idx_group_book_reviews_new_created_at
CREATE INDEX "idx_group_book_reviews_new_created_at" ON "public"."group_book_reviews" USING "btree" ("created_at");

-- Creating index: idx_group_book_reviews_new_group_book
CREATE INDEX "idx_group_book_reviews_new_group_book" ON "public"."group_book_reviews" USING "btree" ("group_id", "book_id");

-- Creating index: idx_group_book_reviews_new_group_id
CREATE INDEX "idx_group_book_reviews_new_group_id" ON "public"."group_book_reviews" USING "btree" ("group_id");

-- Creating index: idx_group_book_reviews_new_group_user
CREATE INDEX "idx_group_book_reviews_new_group_user" ON "public"."group_book_reviews" USING "btree" ("group_id", "user_id");

-- Creating index: idx_group_book_reviews_new_high_ratings
CREATE INDEX "idx_group_book_reviews_new_high_ratings" ON "public"."group_book_reviews" USING "btree" ("group_id", "book_id", "rating") WHERE ("rating" >= 4);

-- Creating index: idx_group_book_reviews_new_low_ratings
CREATE INDEX "idx_group_book_reviews_new_low_ratings" ON "public"."group_book_reviews" USING "btree" ("group_id", "book_id", "rating") WHERE ("rating" <= 2);

-- Creating index: idx_group_book_reviews_new_rating
CREATE INDEX "idx_group_book_reviews_new_rating" ON "public"."group_book_reviews" USING "btree" ("rating");

-- Creating index: idx_group_book_reviews_new_user_id
CREATE INDEX "idx_group_book_reviews_new_user_id" ON "public"."group_book_reviews" USING "btree" ("user_id");

-- Creating index: idx_group_book_reviews_new_with_reviews
CREATE INDEX "idx_group_book_reviews_new_with_reviews" ON "public"."group_book_reviews" USING "btree" ("group_id", "book_id", "created_at") WHERE ("review" IS NOT NULL);

-- Creating index: idx_group_book_swaps_accepted_at
CREATE INDEX "idx_group_book_swaps_accepted_at" ON "public"."group_book_swaps" USING "btree" ("accepted_at");

-- Creating index: idx_group_book_swaps_accepted_by
CREATE INDEX "idx_group_book_swaps_accepted_by" ON "public"."group_book_swaps" USING "btree" ("accepted_by");

-- Creating index: idx_group_book_swaps_accepted_pending
CREATE INDEX "idx_group_book_swaps_accepted_pending" ON "public"."group_book_swaps" USING "btree" ("group_id", "accepted_at") WHERE ("status" = 'accepted'::"text");

-- Creating index: idx_group_book_swaps_available
CREATE INDEX "idx_group_book_swaps_available" ON "public"."group_book_swaps" USING "btree" ("group_id", "created_at") WHERE ("status" = 'available'::"text");

-- Creating index: idx_group_book_swaps_book_id
CREATE INDEX "idx_group_book_swaps_book_id" ON "public"."group_book_swaps" USING "btree" ("book_id");

-- Creating index: idx_group_book_swaps_cancelled_expired
CREATE INDEX "idx_group_book_swaps_cancelled_expired" ON "public"."group_book_swaps" USING "btree" ("group_id", "created_at") WHERE ("status" = ANY (ARRAY['cancelled'::"text", 'expired'::"text"]));

-- Creating index: idx_group_book_swaps_completed
CREATE INDEX "idx_group_book_swaps_completed" ON "public"."group_book_swaps" USING "btree" ("group_id", "accepted_at") WHERE ("status" = 'completed'::"text");

-- Creating index: idx_group_book_swaps_created_at
CREATE INDEX "idx_group_book_swaps_created_at" ON "public"."group_book_swaps" USING "btree" ("created_at");

-- Creating index: idx_group_book_swaps_group_book
CREATE INDEX "idx_group_book_swaps_group_book" ON "public"."group_book_swaps" USING "btree" ("group_id", "book_id");

-- Creating index: idx_group_book_swaps_group_id
CREATE INDEX "idx_group_book_swaps_group_id" ON "public"."group_book_swaps" USING "btree" ("group_id");

-- Creating index: idx_group_book_swaps_group_offered
CREATE INDEX "idx_group_book_swaps_group_offered" ON "public"."group_book_swaps" USING "btree" ("group_id", "offered_by");

-- Creating index: idx_group_book_swaps_group_status
CREATE INDEX "idx_group_book_swaps_group_status" ON "public"."group_book_swaps" USING "btree" ("group_id", "status");

-- Creating index: idx_group_book_swaps_offered_by
CREATE INDEX "idx_group_book_swaps_offered_by" ON "public"."group_book_swaps" USING "btree" ("offered_by");

-- Creating index: idx_group_book_swaps_status
CREATE INDEX "idx_group_book_swaps_status" ON "public"."group_book_swaps" USING "btree" ("status");

-- Creating index: idx_group_book_wishlists_group_id
CREATE INDEX "idx_group_book_wishlists_group_id" ON "public"."group_book_wishlists" USING "btree" ("group_id");

-- Creating index: idx_group_chat_channels_group_id
CREATE INDEX "idx_group_chat_channels_group_id" ON "public"."group_chat_channels" USING "btree" ("group_id");

-- Creating index: idx_group_chat_messages_channel_id
CREATE INDEX "idx_group_chat_messages_channel_id" ON "public"."group_chat_messages" USING "btree" ("channel_id");

-- Creating index: idx_group_discussion_categories_created_at
CREATE INDEX "idx_group_discussion_categories_created_at" ON "public"."group_discussion_categories" USING "btree" ("created_at");

-- Creating index: idx_group_discussion_categories_group_id
CREATE INDEX "idx_group_discussion_categories_group_id" ON "public"."group_discussion_categories" USING "btree" ("group_id");

-- Creating index: idx_group_discussion_categories_group_name
CREATE INDEX "idx_group_discussion_categories_group_name" ON "public"."group_discussion_categories" USING "btree" ("group_id", "name");

-- Creating index: idx_group_discussion_categories_name
CREATE INDEX "idx_group_discussion_categories_name" ON "public"."group_discussion_categories" USING "btree" ("name");

-- Creating index: idx_group_discussion_categories_name_lower
CREATE INDEX "idx_group_discussion_categories_name_lower" ON "public"."group_discussion_categories" USING "btree" ("group_id", "lower"("name"));

-- Creating index: idx_group_discussion_categories_updated_at
CREATE INDEX "idx_group_discussion_categories_updated_at" ON "public"."group_discussion_categories" USING "btree" ("updated_at");

-- Creating index: idx_group_discussion_categories_with_description
CREATE INDEX "idx_group_discussion_categories_with_description" ON "public"."group_discussion_categories" USING "btree" ("group_id", "name") WHERE ("description" IS NOT NULL);

-- Creating index: idx_group_event_feedback_event_id
CREATE INDEX "idx_group_event_feedback_event_id" ON "public"."group_event_feedback" USING "btree" ("event_id");

-- Creating index: idx_group_events_group_id
CREATE INDEX "idx_group_events_group_id" ON "public"."group_events" USING "btree" ("group_id");

-- Creating index: idx_group_member_achievements_achievement_analysis
CREATE INDEX "idx_group_member_achievements_achievement_analysis" ON "public"."group_member_achievements" USING "btree" ("achievement_id", "group_id", "earned_at");

-- Creating index: idx_group_member_achievements_achievement_id
CREATE INDEX "idx_group_member_achievements_achievement_id" ON "public"."group_member_achievements" USING "btree" ("achievement_id");

-- Creating index: idx_group_member_achievements_created_at
CREATE INDEX "idx_group_member_achievements_created_at" ON "public"."group_member_achievements" USING "btree" ("created_at");

-- Creating index: idx_group_member_achievements_earned_at
CREATE INDEX "idx_group_member_achievements_earned_at" ON "public"."group_member_achievements" USING "btree" ("earned_at");

-- Creating index: idx_group_member_achievements_group_user
CREATE INDEX "idx_group_member_achievements_group_user" ON "public"."group_member_achievements" USING "btree" ("group_id", "user_id");

-- Creating index: idx_group_member_achievements_user_id
CREATE INDEX "idx_group_member_achievements_user_id" ON "public"."group_member_achievements" USING "btree" ("user_id");

-- Creating index: idx_group_membership_questions_analysis
CREATE INDEX "idx_group_membership_questions_analysis" ON "public"."group_membership_questions" USING "btree" ("group_id", "is_required", "created_at");

-- Creating index: idx_group_membership_questions_created_at
CREATE INDEX "idx_group_membership_questions_created_at" ON "public"."group_membership_questions" USING "btree" ("created_at");

-- Creating index: idx_group_membership_questions_group_id
CREATE INDEX "idx_group_membership_questions_group_id" ON "public"."group_membership_questions" USING "btree" ("group_id");

-- Creating index: idx_group_membership_questions_is_required
CREATE INDEX "idx_group_membership_questions_is_required" ON "public"."group_membership_questions" USING "btree" ("is_required");

-- Creating index: idx_group_membership_questions_updated_at
CREATE INDEX "idx_group_membership_questions_updated_at" ON "public"."group_membership_questions" USING "btree" ("updated_at");

-- Creating index: idx_group_reading_progress_group_id
CREATE INDEX "idx_group_reading_progress_group_id" ON "public"."group_reading_progress" USING "btree" ("group_id");

-- Creating index: idx_group_roles_analysis
CREATE INDEX "idx_group_roles_analysis" ON "public"."group_roles" USING "btree" ("group_id", "is_default", "created_at");

-- Creating index: idx_group_roles_created_at
CREATE INDEX "idx_group_roles_created_at" ON "public"."group_roles" USING "btree" ("created_at");

-- Creating index: idx_group_roles_group_id
CREATE INDEX "idx_group_roles_group_id" ON "public"."group_roles" USING "btree" ("group_id");

-- Creating index: idx_group_roles_is_default
CREATE INDEX "idx_group_roles_is_default" ON "public"."group_roles" USING "btree" ("is_default");

-- Creating index: idx_group_roles_name
CREATE INDEX "idx_group_roles_name" ON "public"."group_roles" USING "btree" ("name");

-- Creating index: idx_group_roles_permissions
CREATE INDEX "idx_group_roles_permissions" ON "public"."group_roles" USING "gin" ("permissions");

-- Creating index: idx_group_roles_updated_at
CREATE INDEX "idx_group_roles_updated_at" ON "public"."group_roles" USING "btree" ("updated_at");

-- Creating index: idx_group_rules_analysis
CREATE INDEX "idx_group_rules_analysis" ON "public"."group_rules" USING "btree" ("group_id", "created_at", "order_index");

-- Creating index: idx_group_rules_created_at
CREATE INDEX "idx_group_rules_created_at" ON "public"."group_rules" USING "btree" ("created_at");

-- Creating index: idx_group_rules_group_id
CREATE INDEX "idx_group_rules_group_id" ON "public"."group_rules" USING "btree" ("group_id");

-- Creating index: idx_group_rules_order_index
CREATE INDEX "idx_group_rules_order_index" ON "public"."group_rules" USING "btree" ("order_index");

-- Creating index: idx_group_rules_ordering
CREATE INDEX "idx_group_rules_ordering" ON "public"."group_rules" USING "btree" ("group_id", "order_index") WHERE ("order_index" IS NOT NULL);

-- Creating index: idx_group_rules_updated_at
CREATE INDEX "idx_group_rules_updated_at" ON "public"."group_rules" USING "btree" ("updated_at");

-- Creating index: idx_group_tags_analysis
CREATE INDEX "idx_group_tags_analysis" ON "public"."group_tags" USING "btree" ("group_id", "created_at");

-- Creating index: idx_group_tags_created_at
CREATE INDEX "idx_group_tags_created_at" ON "public"."group_tags" USING "btree" ("created_at");

-- Creating index: idx_group_tags_description_search
CREATE INDEX "idx_group_tags_description_search" ON "public"."group_tags" USING "gin" ("to_tsvector"('"english"'::"regconfig", "description")) WHERE ("description" IS NOT NULL);

-- Creating index: idx_group_tags_group_id
CREATE INDEX "idx_group_tags_group_id" ON "public"."group_tags" USING "btree" ("group_id");

-- Creating index: idx_group_tags_name
CREATE INDEX "idx_group_tags_name" ON "public"."group_tags" USING "btree" ("name");

-- Creating index: idx_group_tags_name_search
CREATE INDEX "idx_group_tags_name_search" ON "public"."group_tags" USING "gin" ("to_tsvector"('"english"'::"regconfig", "name"));

-- Creating index: idx_group_tags_updated_at
CREATE INDEX "idx_group_tags_updated_at" ON "public"."group_tags" USING "btree" ("updated_at");

-- Creating index: idx_group_types_display_name
CREATE INDEX "idx_group_types_display_name" ON "public"."group_types" USING "btree" ("display_name");

-- Creating index: idx_group_types_display_name_search
CREATE INDEX "idx_group_types_display_name_search" ON "public"."group_types" USING "gin" ("to_tsvector"('"english"'::"regconfig", "display_name"));

-- Creating index: idx_group_types_lookup
CREATE INDEX "idx_group_types_lookup" ON "public"."group_types" USING "btree" ("slug", "display_name");

-- Creating index: idx_group_types_slug
CREATE INDEX "idx_group_types_slug" ON "public"."group_types" USING "btree" ("slug");

-- Creating index: idx_group_types_slug_search
CREATE INDEX "idx_group_types_slug_search" ON "public"."group_types" USING "gin" ("to_tsvector"('"english"'::"regconfig", "slug"));

-- Creating index: idx_id_mappings_new_id
CREATE INDEX "idx_id_mappings_new_id" ON "public"."id_mappings" USING "btree" ("new_id");

-- Creating index: idx_image_tags_slug
CREATE INDEX "idx_image_tags_slug" ON "public"."image_tags" USING "btree" ("slug");

-- Creating index: idx_image_types_name
CREATE INDEX "idx_image_types_name" ON "public"."image_types" USING "btree" ("name");

-- Creating index: idx_images_deleted
CREATE INDEX "idx_images_deleted" ON "public"."images" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);

-- Creating index: idx_images_id
CREATE INDEX "idx_images_id" ON "public"."images" USING "btree" ("id");

-- Creating index: idx_images_processed
CREATE INDEX "idx_images_processed" ON "public"."images" USING "btree" ("is_processed");

-- Creating index: idx_images_storage
CREATE INDEX "idx_images_storage" ON "public"."images" USING "btree" ("storage_path");

-- Creating index: idx_invoices_event_id
CREATE INDEX "idx_invoices_event_id" ON "public"."invoices" USING "btree" ("event_id");

-- Creating index: idx_invoices_invoice_number
CREATE INDEX "idx_invoices_invoice_number" ON "public"."invoices" USING "btree" ("invoice_number");

-- Creating index: idx_invoices_registration_id
CREATE INDEX "idx_invoices_registration_id" ON "public"."invoices" USING "btree" ("registration_id");

-- Creating index: idx_invoices_status
CREATE INDEX "idx_invoices_status" ON "public"."invoices" USING "btree" ("status");

-- Creating index: idx_invoices_user_id
CREATE INDEX "idx_invoices_user_id" ON "public"."invoices" USING "btree" ("user_id");

-- Creating index: idx_media_attachments_feed_entry_id
CREATE INDEX "idx_media_attachments_feed_entry_id" ON "public"."media_attachments" USING "btree" ("feed_entry_id");

-- Creating index: idx_mentions_mentioned_user_id
CREATE INDEX "idx_mentions_mentioned_user_id" ON "public"."mentions" USING "btree" ("mentioned_user_id");

-- Creating index: idx_multipart_uploads_list
CREATE INDEX "idx_multipart_uploads_list" ON "storage"."s3_multipart_uploads" USING "btree" ("bucket_id", "key", "created_at");

-- Creating index: idx_objects_bucket_id_name
CREATE INDEX "idx_objects_bucket_id_name" ON "storage"."objects" USING "btree" ("bucket_id", "name" COLLATE "C");

-- Creating index: idx_payment_methods_payment_type
CREATE INDEX "idx_payment_methods_payment_type" ON "public"."payment_methods" USING "btree" ("payment_type");

-- Creating index: idx_payment_methods_user_id
CREATE INDEX "idx_payment_methods_user_id" ON "public"."payment_methods" USING "btree" ("user_id");

-- Creating index: idx_payment_transactions_event_id
CREATE INDEX "idx_payment_transactions_event_id" ON "public"."payment_transactions" USING "btree" ("event_id");

-- Creating index: idx_payment_transactions_registration_id
CREATE INDEX "idx_payment_transactions_registration_id" ON "public"."payment_transactions" USING "btree" ("registration_id");

-- Creating index: idx_payment_transactions_status
CREATE INDEX "idx_payment_transactions_status" ON "public"."payment_transactions" USING "btree" ("status");

-- Creating index: idx_payment_transactions_transaction_type
CREATE INDEX "idx_payment_transactions_transaction_type" ON "public"."payment_transactions" USING "btree" ("transaction_type");

-- Creating index: idx_payment_transactions_user_id
CREATE INDEX "idx_payment_transactions_user_id" ON "public"."payment_transactions" USING "btree" ("user_id");

-- Creating index: idx_photo_albums_deleted
CREATE INDEX "idx_photo_albums_deleted" ON "public"."photo_albums" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);

-- Creating index: idx_photo_albums_entity
CREATE INDEX "idx_photo_albums_entity" ON "public"."photo_albums" USING "btree" ("entity_id", "entity_type");

-- Creating index: idx_photo_albums_owner
CREATE INDEX "idx_photo_albums_owner" ON "public"."photo_albums" USING "btree" ("owner_id");

-- Creating index: idx_photo_albums_public
CREATE INDEX "idx_photo_albums_public" ON "public"."photo_albums" USING "btree" ("is_public") WHERE ("is_public" = true);

-- Creating index: idx_photo_albums_type
CREATE INDEX "idx_photo_albums_type" ON "public"."photo_albums" USING "btree" ("album_type");

-- Creating index: idx_prices_analysis
CREATE INDEX "idx_prices_analysis" ON "public"."prices" USING "btree" ("book_id", "price", "currency");

-- Creating index: idx_prices_book_id
CREATE INDEX "idx_prices_book_id" ON "public"."prices" USING "btree" ("book_id");

-- Creating index: idx_prices_condition
CREATE INDEX "idx_prices_condition" ON "public"."prices" USING "btree" ("condition");

-- Creating index: idx_prices_condition_analysis
CREATE INDEX "idx_prices_condition_analysis" ON "public"."prices" USING "btree" ("condition", "price") WHERE ("condition" IS NOT NULL);

-- Creating index: idx_prices_created_at
CREATE INDEX "idx_prices_created_at" ON "public"."prices" USING "btree" ("created_at");

-- Creating index: idx_prices_currency
CREATE INDEX "idx_prices_currency" ON "public"."prices" USING "btree" ("currency");

-- Creating index: idx_prices_currency_analysis
CREATE INDEX "idx_prices_currency_analysis" ON "public"."prices" USING "btree" ("currency", "price");

-- Creating index: idx_prices_merchant
CREATE INDEX "idx_prices_merchant" ON "public"."prices" USING "btree" ("merchant");

-- Creating index: idx_prices_merchant_analysis
CREATE INDEX "idx_prices_merchant_analysis" ON "public"."prices" USING "btree" ("merchant", "price") WHERE ("merchant" IS NOT NULL);

-- Creating index: idx_prices_price
CREATE INDEX "idx_prices_price" ON "public"."prices" USING "btree" ("price");

-- Creating index: idx_prices_updated_at
CREATE INDEX "idx_prices_updated_at" ON "public"."prices" USING "btree" ("updated_at");

-- Creating index: idx_profiles_analysis
CREATE INDEX "idx_profiles_analysis" ON "public"."profiles" USING "btree" ("created_at", "updated_at");

-- Creating index: idx_profiles_bio_search
CREATE INDEX "idx_profiles_bio_search" ON "public"."profiles" USING "gin" ("to_tsvector"('"english"'::"regconfig", "bio")) WHERE ("bio" IS NOT NULL);

-- Creating index: idx_profiles_created_at
CREATE INDEX "idx_profiles_created_at" ON "public"."profiles" USING "btree" ("created_at");

-- Creating index: idx_profiles_role
CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");

-- Creating index: idx_profiles_updated_at
CREATE INDEX "idx_profiles_updated_at" ON "public"."profiles" USING "btree" ("updated_at");

-- Creating index: idx_profiles_user_id
CREATE INDEX "idx_profiles_user_id" ON "public"."profiles" USING "btree" ("user_id");

-- Creating index: idx_promo_codes_code
CREATE INDEX "idx_promo_codes_code" ON "public"."promo_codes" USING "btree" ("code");

-- Creating index: idx_promo_codes_event_id
CREATE INDEX "idx_promo_codes_event_id" ON "public"."promo_codes" USING "btree" ("event_id");

-- Creating index: idx_promo_codes_is_active
CREATE INDEX "idx_promo_codes_is_active" ON "public"."promo_codes" USING "btree" ("is_active");

-- Creating index: idx_publishers_created_at
CREATE INDEX "idx_publishers_created_at" ON "public"."publishers" USING "btree" ("created_at");

-- Creating index: idx_reactions_feed_entry_id
CREATE INDEX "idx_reactions_feed_entry_id" ON "public"."reactions" USING "btree" ("feed_entry_id");

-- Creating index: idx_reactions_user_id
CREATE INDEX "idx_reactions_user_id" ON "public"."reactions" USING "btree" ("user_id");

-- Creating index: idx_reading_lists_description_trgm
CREATE INDEX "idx_reading_lists_description_trgm" ON "public"."reading_lists" USING "gin" ("description" "public"."gin_trgm_ops");

-- Creating index: idx_reading_lists_name_trgm
CREATE INDEX "idx_reading_lists_name_trgm" ON "public"."reading_lists" USING "gin" ("name" "public"."gin_trgm_ops");

-- Creating index: idx_reading_series_organizer_id
CREATE INDEX "idx_reading_series_organizer_id" ON "public"."reading_series" USING "btree" ("organizer_id");

-- Creating index: idx_reading_series_publisher_id
CREATE INDEX "idx_reading_series_publisher_id" ON "public"."reading_series" USING "btree" ("publisher_id");

-- Creating index: idx_reading_sessions_new_analysis
CREATE INDEX "idx_reading_sessions_new_analysis" ON "public"."reading_sessions" USING "btree" ("user_id", "book_id", "start_time");

-- Creating index: idx_reading_sessions_new_book_analysis
CREATE INDEX "idx_reading_sessions_new_book_analysis" ON "public"."reading_sessions" USING "btree" ("book_id", "start_time", "pages_read") WHERE ("pages_read" IS NOT NULL);

-- Creating index: idx_reading_sessions_new_book_id
CREATE INDEX "idx_reading_sessions_new_book_id" ON "public"."reading_sessions" USING "btree" ("book_id");

-- Creating index: idx_reading_sessions_new_created_at
CREATE INDEX "idx_reading_sessions_new_created_at" ON "public"."reading_sessions" USING "btree" ("created_at");

-- Creating index: idx_reading_sessions_new_end_time
CREATE INDEX "idx_reading_sessions_new_end_time" ON "public"."reading_sessions" USING "btree" ("end_time");

-- Creating index: idx_reading_sessions_new_progress
CREATE INDEX "idx_reading_sessions_new_progress" ON "public"."reading_sessions" USING "btree" ("user_id", "start_time", "pages_read") WHERE ("pages_read" IS NOT NULL);

-- Creating index: idx_reading_sessions_new_start_time
CREATE INDEX "idx_reading_sessions_new_start_time" ON "public"."reading_sessions" USING "btree" ("start_time");

-- Creating index: idx_reading_sessions_new_time_range
CREATE INDEX "idx_reading_sessions_new_time_range" ON "public"."reading_sessions" USING "btree" ("start_time", "end_time") WHERE ("end_time" IS NOT NULL);

-- Creating index: idx_reading_sessions_new_user_id
CREATE INDEX "idx_reading_sessions_new_user_id" ON "public"."reading_sessions" USING "btree" ("user_id");

-- Creating index: idx_reviews_analysis
CREATE INDEX "idx_reviews_analysis" ON "public"."reviews" USING "btree" ("book_id", "rating", "created_at");

-- Creating index: idx_reviews_book_id
CREATE INDEX "idx_reviews_book_id" ON "public"."reviews" USING "btree" ("book_id");

-- Creating index: idx_reviews_book_user
CREATE INDEX "idx_reviews_book_user" ON "public"."reviews" USING "btree" ("book_id", "user_id");

-- Creating index: idx_reviews_created_at
CREATE INDEX "idx_reviews_created_at" ON "public"."reviews" USING "btree" ("created_at");

-- Creating index: idx_reviews_high_ratings
CREATE INDEX "idx_reviews_high_ratings" ON "public"."reviews" USING "btree" ("book_id", "rating") WHERE ("rating" >= 4);

-- Creating index: idx_reviews_low_ratings
CREATE INDEX "idx_reviews_low_ratings" ON "public"."reviews" USING "btree" ("book_id", "rating") WHERE ("rating" <= 2);

-- Creating index: idx_reviews_rating
CREATE INDEX "idx_reviews_rating" ON "public"."reviews" USING "btree" ("rating");

-- Creating index: idx_reviews_rating_analysis
CREATE INDEX "idx_reviews_rating_analysis" ON "public"."reviews" USING "btree" ("rating", "created_at");

-- Creating index: idx_reviews_text_search
CREATE INDEX "idx_reviews_text_search" ON "public"."reviews" USING "gin" ("to_tsvector"('"english"'::"regconfig", "review_text")) WHERE ("review_text" IS NOT NULL);

-- Creating index: idx_reviews_updated_at
CREATE INDEX "idx_reviews_updated_at" ON "public"."reviews" USING "btree" ("updated_at");

-- Creating index: idx_reviews_user_analysis
CREATE INDEX "idx_reviews_user_analysis" ON "public"."reviews" USING "btree" ("user_id", "rating", "created_at");

-- Creating index: idx_reviews_user_id
CREATE INDEX "idx_reviews_user_id" ON "public"."reviews" USING "btree" ("user_id");

-- Creating index: idx_reviews_with_text
CREATE INDEX "idx_reviews_with_text" ON "public"."reviews" USING "btree" ("book_id", "created_at") WHERE ("review_text" IS NOT NULL);

-- Creating index: idx_series_events_event_id
CREATE INDEX "idx_series_events_event_id" ON "public"."series_events" USING "btree" ("event_id");

-- Creating index: idx_series_events_series_id
CREATE INDEX "idx_series_events_series_id" ON "public"."series_events" USING "btree" ("series_id");

-- Creating index: idx_session_registrations_session_id
CREATE INDEX "idx_session_registrations_session_id" ON "public"."session_registrations" USING "btree" ("session_id");

-- Creating index: idx_session_registrations_user_id
CREATE INDEX "idx_session_registrations_user_id" ON "public"."session_registrations" USING "btree" ("user_id");

-- Creating index: idx_similar_books_bidirectional
CREATE INDEX "idx_similar_books_bidirectional" ON "public"."similar_books" USING "btree" ("similar_book_id", "book_id", "similarity_score");

-- Creating index: idx_similar_books_book_id
CREATE INDEX "idx_similar_books_book_id" ON "public"."similar_books" USING "btree" ("book_id");

-- Creating index: idx_similar_books_book_similar
CREATE INDEX "idx_similar_books_book_similar" ON "public"."similar_books" USING "btree" ("book_id", "similar_book_id");

-- Creating index: idx_similar_books_created_at
CREATE INDEX "idx_similar_books_created_at" ON "public"."similar_books" USING "btree" ("created_at");

-- Creating index: idx_similar_books_high_similarity
CREATE INDEX "idx_similar_books_high_similarity" ON "public"."similar_books" USING "btree" ("book_id", "similarity_score") WHERE ("similarity_score" >= 0.8);

-- Creating index: idx_similar_books_moderate_similarity
CREATE INDEX "idx_similar_books_moderate_similarity" ON "public"."similar_books" USING "btree" ("book_id", "similarity_score") WHERE (("similarity_score" >= 0.5) AND ("similarity_score" < 0.8));

-- Creating index: idx_similar_books_no_score
CREATE INDEX "idx_similar_books_no_score" ON "public"."similar_books" USING "btree" ("book_id", "created_at") WHERE ("similarity_score" IS NULL);

-- Creating index: idx_similar_books_popular
CREATE INDEX "idx_similar_books_popular" ON "public"."similar_books" USING "btree" ("book_id", "similarity_score") WHERE ("similarity_score" >= 0.7);

-- Creating index: idx_similar_books_reverse_lookup
CREATE INDEX "idx_similar_books_reverse_lookup" ON "public"."similar_books" USING "btree" ("similar_book_id", "similarity_score", "created_at");

-- Creating index: idx_similar_books_score_distribution
CREATE INDEX "idx_similar_books_score_distribution" ON "public"."similar_books" USING "btree" ("similarity_score", "created_at");

-- Creating index: idx_similar_books_similar_book_id
CREATE INDEX "idx_similar_books_similar_book_id" ON "public"."similar_books" USING "btree" ("similar_book_id");

-- Creating index: idx_similar_books_similarity_analysis
CREATE INDEX "idx_similar_books_similarity_analysis" ON "public"."similar_books" USING "btree" ("book_id", "similarity_score", "created_at");

-- Creating index: idx_similar_books_similarity_score
CREATE INDEX "idx_similar_books_similarity_score" ON "public"."similar_books" USING "btree" ("similarity_score");

-- Creating index: idx_subjects_name
CREATE INDEX "idx_subjects_name" ON "public"."subjects" USING "btree" ("name");

-- Creating index: idx_subjects_parent_id
CREATE INDEX "idx_subjects_parent_id" ON "public"."subjects" USING "btree" ("parent_id");

-- Creating index: idx_survey_questions_survey_id
CREATE INDEX "idx_survey_questions_survey_id" ON "public"."survey_questions" USING "btree" ("survey_id");

-- Creating index: idx_survey_responses_registration_id
CREATE INDEX "idx_survey_responses_registration_id" ON "public"."survey_responses" USING "btree" ("registration_id");

-- Creating index: idx_survey_responses_survey_id
CREATE INDEX "idx_survey_responses_survey_id" ON "public"."survey_responses" USING "btree" ("survey_id");

-- Creating index: idx_survey_responses_user_id
CREATE INDEX "idx_survey_responses_user_id" ON "public"."survey_responses" USING "btree" ("user_id");

-- Creating index: idx_tags_name
CREATE INDEX "idx_tags_name" ON "public"."tags" USING "btree" ("name");

-- Creating index: idx_ticket_benefits_ticket_type_id
CREATE INDEX "idx_ticket_benefits_ticket_type_id" ON "public"."ticket_benefits" USING "btree" ("ticket_type_id");

-- Creating index: idx_ticket_types_event_id
CREATE INDEX "idx_ticket_types_event_id" ON "public"."ticket_types" USING "btree" ("event_id");

-- Creating index: idx_ticket_types_is_active
CREATE INDEX "idx_ticket_types_is_active" ON "public"."ticket_types" USING "btree" ("is_active");

-- Creating index: idx_tickets_event_id
CREATE INDEX "idx_tickets_event_id" ON "public"."tickets" USING "btree" ("event_id");

-- Creating index: idx_tickets_registration_id
CREATE INDEX "idx_tickets_registration_id" ON "public"."tickets" USING "btree" ("registration_id");

-- Creating index: idx_tickets_status
CREATE INDEX "idx_tickets_status" ON "public"."tickets" USING "btree" ("status");

-- Creating index: idx_tickets_ticket_number
CREATE INDEX "idx_tickets_ticket_number" ON "public"."tickets" USING "btree" ("ticket_number");

-- Creating index: idx_tickets_ticket_type_id
CREATE INDEX "idx_tickets_ticket_type_id" ON "public"."tickets" USING "btree" ("ticket_type_id");

-- Creating index: idx_tickets_user_id
CREATE INDEX "idx_tickets_user_id" ON "public"."tickets" USING "btree" ("user_id");

-- Creating index: idx_user_book_interactions_book_created
CREATE INDEX "idx_user_book_interactions_book_created" ON "public"."user_book_interactions" USING "btree" ("book_id", "created_at");

-- Creating index: idx_user_book_interactions_book_id
CREATE INDEX "idx_user_book_interactions_book_id" ON "public"."user_book_interactions" USING "btree" ("book_id");

-- Creating index: idx_user_book_interactions_book_patterns
CREATE INDEX "idx_user_book_interactions_book_patterns" ON "public"."user_book_interactions" USING "btree" ("book_id", "interaction_type", "interaction_value", "created_at");

-- Creating index: idx_user_book_interactions_book_popularity
CREATE INDEX "idx_user_book_interactions_book_popularity" ON "public"."user_book_interactions" USING "btree" ("book_id", "interaction_type", "created_at");

-- Creating index: idx_user_book_interactions_book_type
CREATE INDEX "idx_user_book_interactions_book_type" ON "public"."user_book_interactions" USING "btree" ("book_id", "interaction_type");

-- Creating index: idx_user_book_interactions_book_value
CREATE INDEX "idx_user_book_interactions_book_value" ON "public"."user_book_interactions" USING "btree" ("book_id", "interaction_value");

-- Creating index: idx_user_book_interactions_created_at
CREATE INDEX "idx_user_book_interactions_created_at" ON "public"."user_book_interactions" USING "btree" ("created_at");

-- Creating index: idx_user_book_interactions_high_value
CREATE INDEX "idx_user_book_interactions_high_value" ON "public"."user_book_interactions" USING "btree" ("book_id", "interaction_value") WHERE ("interaction_value" >= (8.0)::double precision);

-- Creating index: idx_user_book_interactions_interaction_type
CREATE INDEX "idx_user_book_interactions_interaction_type" ON "public"."user_book_interactions" USING "btree" ("interaction_type");

-- Creating index: idx_user_book_interactions_likes
CREATE INDEX "idx_user_book_interactions_likes" ON "public"."user_book_interactions" USING "btree" ("book_id", "created_at") WHERE ("interaction_type" = 'like'::"text");

-- Creating index: idx_user_book_interactions_purchases
CREATE INDEX "idx_user_book_interactions_purchases" ON "public"."user_book_interactions" USING "btree" ("book_id", "created_at") WHERE ("interaction_type" = 'purchase'::"text");

-- Creating index: idx_user_book_interactions_ratings
CREATE INDEX "idx_user_book_interactions_ratings" ON "public"."user_book_interactions" USING "btree" ("book_id", "interaction_value", "created_at") WHERE ("interaction_type" = 'rating'::"text");

-- Creating index: idx_user_book_interactions_reviews
CREATE INDEX "idx_user_book_interactions_reviews" ON "public"."user_book_interactions" USING "btree" ("book_id", "created_at") WHERE ("interaction_type" = 'review'::"text");

-- Creating index: idx_user_book_interactions_type_created
CREATE INDEX "idx_user_book_interactions_type_created" ON "public"."user_book_interactions" USING "btree" ("interaction_type", "created_at");

-- Creating index: idx_user_book_interactions_updated_at
CREATE INDEX "idx_user_book_interactions_updated_at" ON "public"."user_book_interactions" USING "btree" ("updated_at");

-- Creating index: idx_user_book_interactions_user_behavior
CREATE INDEX "idx_user_book_interactions_user_behavior" ON "public"."user_book_interactions" USING "btree" ("user_id", "interaction_type", "interaction_value", "created_at");

-- Creating index: idx_user_book_interactions_user_book
CREATE INDEX "idx_user_book_interactions_user_book" ON "public"."user_book_interactions" USING "btree" ("user_id", "book_id");

-- Creating index: idx_user_book_interactions_user_created
CREATE INDEX "idx_user_book_interactions_user_created" ON "public"."user_book_interactions" USING "btree" ("user_id", "created_at");

-- Creating index: idx_user_book_interactions_user_engagement
CREATE INDEX "idx_user_book_interactions_user_engagement" ON "public"."user_book_interactions" USING "btree" ("user_id", "interaction_type", "created_at");

-- Creating index: idx_user_book_interactions_user_id
CREATE INDEX "idx_user_book_interactions_user_id" ON "public"."user_book_interactions" USING "btree" ("user_id");

-- Creating index: idx_user_book_interactions_user_type
CREATE INDEX "idx_user_book_interactions_user_type" ON "public"."user_book_interactions" USING "btree" ("user_id", "interaction_type");

-- Creating index: idx_user_book_interactions_user_value
CREATE INDEX "idx_user_book_interactions_user_value" ON "public"."user_book_interactions" USING "btree" ("user_id", "interaction_value");

-- Creating index: idx_user_book_interactions_value
CREATE INDEX "idx_user_book_interactions_value" ON "public"."user_book_interactions" USING "btree" ("interaction_value");

-- Creating index: idx_user_book_interactions_value_analysis
CREATE INDEX "idx_user_book_interactions_value_analysis" ON "public"."user_book_interactions" USING "btree" ("interaction_type", "interaction_value", "created_at") WHERE ("interaction_value" IS NOT NULL);

-- Creating index: idx_user_book_interactions_views
CREATE INDEX "idx_user_book_interactions_views" ON "public"."user_book_interactions" USING "btree" ("book_id", "created_at") WHERE ("interaction_type" = 'view'::"text");

-- Creating index: idx_user_id_auth_method
CREATE INDEX "idx_user_id_auth_method" ON "auth"."flow_state" USING "btree" ("user_id", "authentication_method");

-- Creating index: idx_users_name_trgm
CREATE INDEX "idx_users_name_trgm" ON "public"."users" USING "gin" ("name" "public"."gin_trgm_ops");

-- Creating index: ix_realtime_subscription_entity
CREATE INDEX "ix_realtime_subscription_entity" ON "realtime"."subscription" USING "btree" ("entity");

-- Creating index: mfa_challenge_created_at_idx
CREATE INDEX "mfa_challenge_created_at_idx" ON "auth"."mfa_challenges" USING "btree" ("created_at" DESC);

-- Creating index: mfa_factors_user_id_idx
CREATE INDEX "mfa_factors_user_id_idx" ON "auth"."mfa_factors" USING "btree" ("user_id");

-- Creating index: name_prefix_search
CREATE INDEX "name_prefix_search" ON "storage"."objects" USING "btree" ("name" "text_pattern_ops");

-- Creating index: one_time_tokens_relates_to_hash_idx
CREATE INDEX "one_time_tokens_relates_to_hash_idx" ON "auth"."one_time_tokens" USING "hash" ("relates_to");

-- Creating index: one_time_tokens_token_hash_hash_idx
CREATE INDEX "one_time_tokens_token_hash_hash_idx" ON "auth"."one_time_tokens" USING "hash" ("token_hash");

-- Creating index: refresh_tokens_instance_id_idx
CREATE INDEX "refresh_tokens_instance_id_idx" ON "auth"."refresh_tokens" USING "btree" ("instance_id");

-- Creating index: refresh_tokens_instance_id_user_id_idx
CREATE INDEX "refresh_tokens_instance_id_user_id_idx" ON "auth"."refresh_tokens" USING "btree" ("instance_id", "user_id");

-- Creating index: refresh_tokens_parent_idx
CREATE INDEX "refresh_tokens_parent_idx" ON "auth"."refresh_tokens" USING "btree" ("parent");

-- Creating index: refresh_tokens_session_id_revoked_idx
CREATE INDEX "refresh_tokens_session_id_revoked_idx" ON "auth"."refresh_tokens" USING "btree" ("session_id", "revoked");

-- Creating index: refresh_tokens_updated_at_idx
CREATE INDEX "refresh_tokens_updated_at_idx" ON "auth"."refresh_tokens" USING "btree" ("updated_at" DESC);

-- Creating index: saml_providers_sso_provider_id_idx
CREATE INDEX "saml_providers_sso_provider_id_idx" ON "auth"."saml_providers" USING "btree" ("sso_provider_id");

-- Creating index: saml_relay_states_created_at_idx
CREATE INDEX "saml_relay_states_created_at_idx" ON "auth"."saml_relay_states" USING "btree" ("created_at" DESC);

-- Creating index: saml_relay_states_for_email_idx
CREATE INDEX "saml_relay_states_for_email_idx" ON "auth"."saml_relay_states" USING "btree" ("for_email");

-- Creating index: saml_relay_states_sso_provider_id_idx
CREATE INDEX "saml_relay_states_sso_provider_id_idx" ON "auth"."saml_relay_states" USING "btree" ("sso_provider_id");

-- Creating index: sessions_not_after_idx
CREATE INDEX "sessions_not_after_idx" ON "auth"."sessions" USING "btree" ("not_after" DESC);

-- Creating index: sessions_user_id_idx
CREATE INDEX "sessions_user_id_idx" ON "auth"."sessions" USING "btree" ("user_id");

-- Creating index: sso_domains_sso_provider_id_idx
CREATE INDEX "sso_domains_sso_provider_id_idx" ON "auth"."sso_domains" USING "btree" ("sso_provider_id");

-- Creating index: user_id_created_at_idx
CREATE INDEX "user_id_created_at_idx" ON "auth"."sessions" USING "btree" ("user_id", "created_at");

-- Creating index: users_instance_id_email_idx
CREATE INDEX "users_instance_id_email_idx" ON "auth"."users" USING "btree" ("instance_id", "lower"(("email")::"text"));

-- Creating index: users_instance_id_idx
CREATE INDEX "users_instance_id_idx" ON "auth"."users" USING "btree" ("instance_id");

-- Creating index: users_is_anonymous_idx
CREATE INDEX "users_is_anonymous_idx" ON "auth"."users" USING "btree" ("is_anonymous");

-- =====================================================
-- PHASE 5: FUNCTIONS
-- =====================================================

-- Creating function: auth.email
CREATE OR REPLACE FUNCTION "auth"."email"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;

-- Creating function: auth.jwt
CREATE OR REPLACE FUNCTION "auth"."jwt"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;

-- Creating function: auth.role
CREATE OR REPLACE FUNCTION "auth"."role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;

-- Creating function: auth.uid
CREATE OR REPLACE FUNCTION "auth"."uid"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

-- Creating function: extensions.grant_pg_cron_access
CREATE OR REPLACE FUNCTION "extensions"."grant_pg_cron_access"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

-- Creating function: extensions.grant_pg_graphql_access
CREATE OR REPLACE FUNCTION "extensions"."grant_pg_graphql_access"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    func_is_graphql_resolve bool;

-- Creating function: extensions.grant_pg_net_access
CREATE OR REPLACE FUNCTION "extensions"."grant_pg_net_access"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;

-- Creating function: extensions.pgrst_ddl_watch
CREATE OR REPLACE FUNCTION "extensions"."pgrst_ddl_watch"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  cmd record;

-- Creating function: extensions.pgrst_drop_watch
CREATE OR REPLACE FUNCTION "extensions"."pgrst_drop_watch"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  obj record;

-- Creating function: extensions.set_graphql_placeholder
CREATE OR REPLACE FUNCTION "extensions"."set_graphql_placeholder"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    AS $_$
    DECLARE
    graphql_is_dropped bool;

-- Creating function: public.compute_similar_books
CREATE OR REPLACE FUNCTION "public"."compute_similar_books"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Clear existing similarities
  DELETE FROM public.similar_books;

-- Creating function: public.count_authors_per_book
CREATE OR REPLACE FUNCTION "public"."count_authors_per_book"() RETURNS TABLE("book_id" "uuid", "author_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT ba.book_id, COUNT(ba.author_id) as author_count
  FROM book_authors_new ba
  GROUP BY ba.book_id
  ORDER BY author_count DESC;

-- Creating function: public.count_books_with_multiple_authors
CREATE OR REPLACE FUNCTION "public"."count_books_with_multiple_authors"() RETURNS TABLE("book_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(DISTINCT book_id)
  FROM book_authors
  GROUP BY book_id
  HAVING COUNT(author_id) > 1;

-- Creating function: public.count_publishers_per_book
CREATE OR REPLACE FUNCTION "public"."count_publishers_per_book"() RETURNS TABLE("book_id" integer, "publisher_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT bp.book_id, COUNT(bp.publisher_id) as publisher_count
  FROM book_publishers bp
  GROUP BY bp.book_id
  ORDER BY publisher_count DESC;

-- Creating function: public.create_author_activity
CREATE OR REPLACE FUNCTION "public"."create_author_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  admin_user_id UUID;

-- Creating function: public.create_book_activity
CREATE OR REPLACE FUNCTION "public"."create_book_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  admin_user_id UUID;

-- Creating function: public.create_book_club_event
CREATE OR REPLACE FUNCTION "public"."create_book_club_event"("book_club_id" "uuid", "discussion_id" "uuid", "title" "text", "description" "text", "start_time" timestamp with time zone, "duration_minutes" integer, "is_virtual" boolean, "created_by" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  book_id INTEGER;

-- Creating function: public.create_book_update_activity
CREATE OR REPLACE FUNCTION "public"."create_book_update_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    admin_user_id UUID;

-- Creating function: public.create_challenge_complete_notification
CREATE OR REPLACE FUNCTION "public"."create_challenge_complete_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Only create notification when books_read reaches or exceeds target_books
  IF NEW.books_read >= NEW.target_books AND OLD.books_read < OLD.target_books THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      link,
      data,
      created_at
    ) VALUES (
      NEW.user_id,
      'challenge_completed',
      'Reading Challenge Completed',
      CONCAT('Congratulations! You completed your ', NEW.year, ' reading challenge of ', NEW.target_books, ' books.'),
      '/dashboard',
      json_build_object(
        'year', NEW.year,
        'target_books', NEW.target_books,
        'books_read', NEW.books_read
      ),
      NOW()
    );

-- Creating function: public.create_default_reading_lists
CREATE OR REPLACE FUNCTION "public"."create_default_reading_lists"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Create "Favorites" list
  INSERT INTO public.reading_lists (user_id, name, description, is_public, created_at, updated_at)
  VALUES (
    NEW.id,
    'Favorites',
    'My favorite books',
    false,
    NOW(),
    NOW()
  );

-- Creating function: public.create_discussion_activity
CREATE OR REPLACE FUNCTION "public"."create_discussion_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO public.activities (user_id, activity_type, book_id, data)
    VALUES (
        NEW.user_id,
        'book_discussion_created',
        NEW.book_id,
        jsonb_build_object(
            'discussion_id', NEW.id,
            'discussion_title', NEW.title
        )
    );

-- Creating function: public.create_discussion_comment_activity
CREATE OR REPLACE FUNCTION "public"."create_discussion_comment_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    book_id_val INTEGER;

-- Creating function: public.create_event_activity
CREATE OR REPLACE FUNCTION "public"."create_event_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Insert event created activity
  INSERT INTO activities (
    user_id,
    activity_type,
    event_id,
    data,
    created_at
  ) VALUES (
    NEW.created_by,
    'event_created',
    NEW.id,
    jsonb_build_object(
      'event_id', NEW.id,
      'event_title', NEW.title,
      'event_start_date', NEW.start_date,
      'event_format', NEW.format
    ),
    NEW.created_at
  );

-- Creating function: public.create_event_approval_record
CREATE OR REPLACE FUNCTION "public"."create_event_approval_record"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  permission_record RECORD;

-- Creating function: public.create_event_notification
CREATE OR REPLACE FUNCTION "public"."create_event_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  follower_id UUID;

-- Creating function: public.create_event_registration_activity
CREATE OR REPLACE FUNCTION "public"."create_event_registration_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  event_title TEXT;

-- Creating function: public.create_follow_notification
CREATE OR REPLACE FUNCTION "public"."create_follow_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Create a notification for the user being followed
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    link,
    data,
    created_at
  ) 
  SELECT
    NEW.following_id,
    'new_follower',
    'New Follower',
    CONCAT(u.name, ' started following you'),
    CONCAT('/profile/', NEW.follower_id),
    json_build_object(
      'follower_id', NEW.follower_id,
      'follower_name', u.name,
      'follower_email', u.email
    ),
    NOW()
  FROM public.users u
  WHERE u.id = NEW.follower_id;

-- Creating function: public.create_get_user_reading_stats_function
CREATE OR REPLACE FUNCTION "public"."create_get_user_reading_stats_function"() RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- The function is already created above, so this is just a placeholder
  -- that can be called from the API to ensure the function exists
  RETURN TRUE;

-- Creating function: public.create_group_activity
CREATE OR REPLACE FUNCTION "public"."create_group_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  admin_user_id UUID;

-- Creating function: public.create_group_with_roles
CREATE OR REPLACE FUNCTION "public"."create_group_with_roles"("p_name" "text", "p_description" "text", "p_cover_image_id" integer, "p_group_image_id" integer, "p_created_by" "uuid", "p_target_type_id" integer, "p_target_id" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_group_id UUID;

-- Creating function: public.create_list_follow_notification
CREATE OR REPLACE FUNCTION "public"."create_list_follow_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_list_owner_id UUID;

-- Creating function: public.create_list_item_activity
CREATE OR REPLACE FUNCTION "public"."create_list_item_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_list_id UUID;

-- Creating function: public.create_new_user
CREATE OR REPLACE FUNCTION "public"."create_new_user"("user_id" "uuid", "user_email" "text", "created_timestamp" timestamp without time zone) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO users (id, email, created_at)
  VALUES (user_id, user_email, created_timestamp);

-- Creating function: public.create_or_update_user
CREATE OR REPLACE FUNCTION "public"."create_or_update_user"("p_user_id" "uuid", "p_email" "text", "p_created_at" timestamp with time zone DEFAULT "now"()) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (p_user_id, p_email, p_created_at)
  ON CONFLICT (id) DO UPDATE
  SET email = p_email
  WHERE users.id = p_user_id;

-- Creating function: public.create_publisher_activity
CREATE OR REPLACE FUNCTION "public"."create_publisher_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  admin_user_id UUID;

-- Creating function: public.create_reading_list_activity
CREATE OR REPLACE FUNCTION "public"."create_reading_list_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Only create activity for public lists
  IF NEW.is_public THEN
    INSERT INTO public.activities (
      user_id,
      activity_type,
      list_id,
      data,
      created_at
    ) VALUES (
      NEW.user_id,
      'list_created',
      NEW.id,
      json_build_object(
        'name', NEW.name,
        'description', NEW.description
      ),
      NEW.created_at
    );

-- Creating function: public.create_reading_progress_activity
CREATE OR REPLACE FUNCTION "public"."create_reading_progress_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Only create activity for significant changes
  IF (NEW.status != OLD.status) OR 
     (NEW.status = 'currently_reading' AND NEW.progress_percentage != OLD.progress_percentage AND 
      (NEW.progress_percentage = 100 OR NEW.progress_percentage % 25 = 0)) OR
     (NEW.status = 'read' AND OLD.status != 'read') THEN
    
    INSERT INTO public.activities (
      user_id,
      activity_type,
      book_id,
      data,
      created_at
    ) VALUES (
      NEW.user_id,
      CASE
        WHEN NEW.status = 'want_to_read' THEN 'book_want_to_read'
        WHEN NEW.status = 'currently_reading' AND OLD.status != 'currently_reading' THEN 'book_started_reading'
        WHEN NEW.status = 'currently_reading' AND NEW.progress_percentage != OLD.progress_percentage THEN 'book_reading_progress'
        WHEN NEW.status = 'read' THEN 'book_finished_reading'
        ELSE 'book_reading_updated'
      END,
      NEW.book_id,
      json_build_object(
        'status', NEW.status,
        'progress_percentage', NEW.progress_percentage,
        'previous_status', OLD.status,
        'previous_progress', OLD.progress_percentage
      ),
      NOW()
    );

-- Creating function: public.create_review_activity
CREATE OR REPLACE FUNCTION "public"."create_review_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO public.activities (
    user_id,
    activity_type,
    book_id,
    review_id,
    data,
    created_at
  ) VALUES (
    NEW.user_id,
    'book_reviewed',
    NEW.book_id,
    NEW.id,
    json_build_object(
      'rating', NEW.rating,
      'contains_spoilers', NEW.contains_spoilers
    ),
    NEW.created_at
  );

-- Creating function: public.create_review_like_notification
CREATE OR REPLACE FUNCTION "public"."create_review_like_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_review_user_id UUID;

-- Creating function: public.create_user_profile_activity
CREATE OR REPLACE FUNCTION "public"."create_user_profile_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    user_name TEXT := 'Unknown User';

-- Creating function: public.create_want_to_read_review_notification
CREATE OR REPLACE FUNCTION "public"."create_want_to_read_review_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  user_rec RECORD;

-- Creating function: public.export_schema_definitions
CREATE OR REPLACE FUNCTION "public"."export_schema_definitions"() RETURNS TABLE("definition" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    rec RECORD;

-- Creating function: public.generate_personalized_recommendations
CREATE OR REPLACE FUNCTION "public"."generate_personalized_recommendations"("user_uuid" "uuid") RETURNS SETOF "public"."personalized_recommendations"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  max_recommendations INTEGER := 50;

-- Creating function: public.generate_recommendations
CREATE OR REPLACE FUNCTION "public"."generate_recommendations"("user_id_param" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  genre_rec RECORD;

-- Creating function: public.get_column_names
CREATE OR REPLACE FUNCTION "public"."get_column_names"("table_name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    column_names text[];

-- Creating function: public.get_search_suggestions
CREATE OR REPLACE FUNCTION "public"."get_search_suggestions"("search_query" "text", "max_results" integer DEFAULT 10) RETURNS TABLE("suggestion" "text", "entity_type" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
-- Book title suggestions
RETURN QUERY
SELECT DISTINCT
  b.title AS suggestion,
  'book' AS entity_type
FROM
  public.books b
WHERE
  search_query IS NULL
  OR search_query = ''
  OR b.title ILIKE '%' || search_query || '%'
ORDER BY
  similarity(b.title, search_query) DESC
LIMIT max_results / 3;

-- Creating function: public.get_table_columns
CREATE OR REPLACE FUNCTION "public"."get_table_columns"("table_name_param" "text") RETURNS TABLE("column_name" "text", "data_type" "text", "is_nullable" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.is_nullable::TEXT
  FROM 
    information_schema.columns c
  WHERE 
    c.table_schema = 'public' 
    AND c.table_name = table_name_param
  ORDER BY 
    c.ordinal_position;

-- Creating function: public.get_user_reading_stats
CREATE OR REPLACE FUNCTION "public"."get_user_reading_stats"("user_id_param" "uuid") RETURNS TABLE("books_read" integer, "books_reading" integer, "books_want_to_read" integer, "avg_rating" numeric, "review_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(CASE WHEN rp.status = 'read' THEN 1 END)::integer as books_read,
    COUNT(CASE WHEN rp.status = 'currently_reading' THEN 1 END)::integer as books_reading,
    COUNT(CASE WHEN rp.status = 'want_to_read' THEN 1 END)::integer as books_want_to_read,
    AVG(br.rating) as avg_rating,
    COUNT(br.id)::integer as review_count
  FROM public.reading_progress rp
  LEFT JOIN public.book_reviews br ON br.user_id = rp.user_id
  WHERE rp.user_id = user_id_param;

-- Creating function: public.handle_new_user
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at)
  ON CONFLICT (id) DO NOTHING;

-- Creating function: public.handle_new_user_profile
CREATE OR REPLACE FUNCTION "public"."handle_new_user_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

-- Creating function: public.increment_album_view_count
CREATE OR REPLACE FUNCTION "public"."increment_album_view_count"("album_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update the album's view count
    UPDATE photo_albums
    SET view_count = view_count + 1
    WHERE id = album_id;

-- Creating function: public.initialize_group_member_count
CREATE OR REPLACE FUNCTION "public"."initialize_group_member_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.member_count := 0;

-- Creating function: public.integer_to_uuid
CREATE OR REPLACE FUNCTION "public"."integer_to_uuid"("integer_id" integer) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN uuid_generate_v4();

-- Creating function: public.is_admin
CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role = 'admin'
  );

-- Creating function: public.is_admin_safe
CREATE OR REPLACE FUNCTION "public"."is_admin_safe"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );

-- Creating function: public.is_group_owner
CREATE OR REPLACE FUNCTION "public"."is_group_owner"("group_id" "uuid", "user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_members.group_id = is_group_owner.group_id 
      AND group_members.user_id = is_group_owner.user_id 
      AND group_members.role = 'owner'
  );

-- Creating function: public.is_super_admin
CREATE OR REPLACE FUNCTION "public"."is_super_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role = 'super_admin'
  );

-- Creating function: public.manage_series_event_number
CREATE OR REPLACE FUNCTION "public"."manage_series_event_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  next_number INTEGER;

-- Creating function: public.manage_waitlist_position
CREATE OR REPLACE FUNCTION "public"."manage_waitlist_position"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  next_position INTEGER;

-- Creating function: public.mark_all_notifications_read
CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_read"("user_id_param" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true
  WHERE user_id = user_id_param AND is_read = false;

-- Creating function: public.notify_author_followers_of_event
CREATE OR REPLACE FUNCTION "public"."notify_author_followers_of_event"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  follower_user_id UUID;

-- Creating function: public.notify_challenge_completion
CREATE OR REPLACE FUNCTION "public"."notify_challenge_completion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if NEW.books_read >= (select target_books from group_reading_challenges where id = NEW.challenge_id)
     and (OLD.books_read is null or OLD.books_read < (select target_books from group_reading_challenges where id = NEW.challenge_id))
  then
    insert into notifications (user_id, group_id, type, message, data)
    values (
      NEW.user_id,
      NEW.group_id,
      'challenge_complete',
      'You completed the group reading challenge!',
      jsonb_build_object('challenge_id', NEW.challenge_id)
    );

-- Creating function: public.notify_challenge_lead
CREATE OR REPLACE FUNCTION "public"."notify_challenge_lead"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  top_user uuid;

-- Creating function: public.notify_waitlist_when_ticket_available
CREATE OR REPLACE FUNCTION "public"."notify_waitlist_when_ticket_available"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  waitlist_entry RECORD;

-- Creating function: public.prevent_spam_posts
CREATE OR REPLACE FUNCTION "public"."prevent_spam_posts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM public.posts
    WHERE user_id = NEW.user_id
      AND created_at > (now() - interval '1 minute')
  ) >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded';

-- Creating function: public.record_book_view
CREATE OR REPLACE FUNCTION "public"."record_book_view"("book_id_param" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Only proceed if the user is authenticated
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO book_views (user_id, book_id)
    VALUES (auth.uid(), book_id_param);

-- Creating function: public.record_user_book_interaction
CREATE OR REPLACE FUNCTION "public"."record_user_book_interaction"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Record view interaction when a book is viewed
  IF TG_TABLE_NAME = 'book_views_new' THEN
    INSERT INTO user_book_interactions_new (user_id, book_id, interaction_type, interaction_value, created_at, updated_at)
    VALUES (NEW.user_id, NEW.book_id, 'view', 1, NOW(), NOW())
    ON CONFLICT (user_id, book_id, interaction_type) 
    DO UPDATE SET interaction_value = user_book_interactions_new.interaction_value + 1, updated_at = NOW();

-- Creating function: public.search_all
CREATE OR REPLACE FUNCTION "public"."search_all"("search_query" "text", "max_results" integer DEFAULT 20) RETURNS TABLE("entity_type" "text", "id" "text", "title" "text", "subtitle" "text", "image_id" integer, "similarity" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
-- Search books
RETURN QUERY
SELECT
  'book' AS entity_type,
  b.id::TEXT,
  b.title,
  b.author,
  b.cover_image_id,
  GREATEST(
    similarity(b.title, search_query),
    similarity(b.author, search_query) * 0.8,
    COALESCE(similarity(b.synopsis, search_query) * 0.6, 0),
    COALESCE(similarity(b.overview, search_query) * 0.6, 0)
  ) AS similarity
FROM
  public.books b
WHERE
  search_query IS NULL
  OR search_query = ''
  OR b.title ILIKE '%' || search_query || '%'
  OR b.author ILIKE '%' || search_query || '%'
  OR b.synopsis ILIKE '%' || search_query || '%'
  OR b.overview ILIKE '%' || search_query || '%'
ORDER BY
  similarity DESC
LIMIT max_results / 3;

-- Creating function: public.search_books
CREATE OR REPLACE FUNCTION "public"."search_books"("search_query" "text", "genre_filter" "uuid" DEFAULT NULL::"uuid", "min_rating" numeric DEFAULT NULL::numeric, "max_results" integer DEFAULT 20) RETURNS TABLE("id" "uuid", "title" "text", "author" "text", "description" "text", "cover_image_id" "uuid", "pages" integer, "published_date" "date", "isbn" "text", "review_count" integer, "average_rating" numeric, "similarity" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.title,
    b.author,
    b.description,
    b.cover_image_id,
    b.pages,
    b.published_date,
    b.isbn,
    b.review_count,
    b.average_rating,
    similarity(b.title, search_query) as similarity
  FROM public.books b
  WHERE b.title ILIKE '%' || search_query || '%'
    AND (genre_filter IS NULL OR EXISTS (
      SELECT 1 FROM public.book_genre_mappings bgm 
      WHERE bgm.book_id = b.id AND bgm.genre_id = genre_filter
    ))
    AND (min_rating IS NULL OR b.average_rating >= min_rating)
  ORDER BY similarity DESC
  LIMIT max_results;

-- Creating function: public.search_reading_lists
CREATE OR REPLACE FUNCTION "public"."search_reading_lists"("search_query" "text", "max_results" integer DEFAULT 20) RETURNS TABLE("id" "uuid", "user_id" "uuid", "name" "text", "description" "text", "is_public" boolean, "book_count" bigint, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "similarity" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
RETURN QUERY
SELECT
  rl.id,
  rl.user_id,
  rl.name,
  rl.description,
  rl.is_public,
  COUNT(rli.id) AS book_count,
  rl.created_at,
  rl.updated_at,
  GREATEST(
    similarity(rl.name, search_query),
    COALESCE(similarity(rl.description, search_query) * 0.7, 0)
  ) AS similarity
FROM
  public.reading_lists rl
LEFT JOIN
  public.reading_list_items rli ON rli.list_id = rl.id
WHERE
  rl.is_public = true
  AND (
    search_query IS NULL
    OR search_query = ''
    OR rl.name ILIKE '%' || search_query || '%'
    OR rl.description ILIKE '%' || search_query || '%'
  )
GROUP BY
  rl.id
ORDER BY
  similarity DESC
LIMIT max_results;

-- Creating function: public.search_users
CREATE OR REPLACE FUNCTION "public"."search_users"("search_query" "text", "max_results" integer DEFAULT 20) RETURNS TABLE("id" "uuid", "name" "text", "email" "text", "bio" "text", "avatar_url" "text", "follower_count" integer, "following_count" integer, "similarity" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.email,
    p.bio,
    u.avatar_url,
    u.follower_count,
    u.following_count,
    similarity(u.name, search_query) as similarity
  FROM public.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE u.name ILIKE '%' || search_query || '%'
  ORDER BY similarity DESC
  LIMIT max_results;

-- Creating function: public.sync_book_author
CREATE OR REPLACE FUNCTION "public"."sync_book_author"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- If author_id is updated, update the author name
    IF NEW.author_id IS NOT NULL AND 
       (OLD.author_id IS NULL OR OLD.author_id <> NEW.author_id) THEN
        SELECT name INTO NEW.author FROM authors WHERE id = NEW.author_id;

-- Creating function: public.track_book_view
CREATE OR REPLACE FUNCTION "public"."track_book_view"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Insert into book_views table
  INSERT INTO book_views (user_id, book_id)
  VALUES (auth.uid(), NEW.id);

-- Creating function: public.track_event_view
CREATE OR REPLACE FUNCTION "public"."track_event_view"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  current_date DATE := CURRENT_DATE;

-- Creating function: public.update_album_updated_at
CREATE OR REPLACE FUNCTION "public"."update_album_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();

-- Creating function: public.update_author_activity
CREATE OR REPLACE FUNCTION "public"."update_author_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  admin_user_id UUID;

-- Creating function: public.update_book_club_member_count
CREATE OR REPLACE FUNCTION "public"."update_book_club_member_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE book_clubs
    SET member_count = member_count + 1
    WHERE id = NEW.book_club_id;

-- Creating function: public.update_book_rating
CREATE OR REPLACE FUNCTION "public"."update_book_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  avg_rating NUMERIC;

-- Creating function: public.update_book_rating_from_reviews
CREATE OR REPLACE FUNCTION "public"."update_book_rating_from_reviews"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update average rating and review count for the book
    UPDATE public.books 
    SET 
        average_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM public.reviews 
            WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)
            AND is_deleted = false
        ),
        review_count = (
            SELECT COUNT(*)
            FROM public.reviews 
            WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)
            AND is_deleted = false
        )
    WHERE id = COALESCE(NEW.book_id, OLD.book_id);

-- Creating function: public.update_contact_info_updated_at
CREATE OR REPLACE FUNCTION "public"."update_contact_info_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();

-- Creating function: public.update_daily_stats_from_progress
CREATE OR REPLACE FUNCTION "public"."update_daily_stats_from_progress"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  progress_date DATE;

-- Creating function: public.update_daily_stats_from_session
CREATE OR REPLACE FUNCTION "public"."update_daily_stats_from_session"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  session_date DATE;

-- Creating function: public.update_event_financials
CREATE OR REPLACE FUNCTION "public"."update_event_financials"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  event_currency TEXT;

-- Creating function: public.update_event_status
CREATE OR REPLACE FUNCTION "public"."update_event_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If event is updated to published status
  IF OLD.status != 'published' AND NEW.status = 'published' THEN
    -- Update published_at timestamp
    NEW.published_at = NOW();

-- Creating function: public.update_feed_entry_updated_at
CREATE OR REPLACE FUNCTION "public"."update_feed_entry_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();

-- Creating function: public.update_follow_counts
CREATE OR REPLACE FUNCTION "public"."update_follow_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Update follower count for the user being followed
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET follower_count = follower_count + 1
    WHERE user_id = NEW.following_id;

-- Creating function: public.update_group_activity
CREATE OR REPLACE FUNCTION "public"."update_group_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  changed_fields TEXT[] := '{}';

-- Creating function: public.update_group_member_count
CREATE OR REPLACE FUNCTION "public"."update_group_member_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE groups 
        SET member_count = member_count + 1 
        WHERE id = NEW.group_id;

-- Creating function: public.update_image_updated_at
CREATE OR REPLACE FUNCTION "public"."update_image_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();

-- Creating function: public.update_modified_column
CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();

-- Creating function: public.update_publisher_activity
CREATE OR REPLACE FUNCTION "public"."update_publisher_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  admin_user_id UUID;

-- Creating function: public.update_publishers_updated_at
CREATE OR REPLACE FUNCTION "public"."update_publishers_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();

-- Creating function: public.update_reading_challenge
CREATE OR REPLACE FUNCTION "public"."update_reading_challenge"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If a book is marked as read and has a finish date in the current year
  IF NEW.status = 'read' AND NEW.finish_date IS NOT NULL AND 
     EXTRACT(YEAR FROM NEW.finish_date) = EXTRACT(YEAR FROM CURRENT_DATE) THEN
    
    -- Update the reading challenge for the current year
    UPDATE public.reading_challenges
    SET books_read = books_read + 1,
        updated_at = NOW()
    WHERE user_id = NEW.user_id
      AND year = EXTRACT(YEAR FROM CURRENT_DATE);

-- Creating function: public.update_reading_goals
CREATE OR REPLACE FUNCTION "public"."update_reading_goals"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  goal RECORD;

-- Creating function: public.update_reading_streaks
CREATE OR REPLACE FUNCTION "public"."update_reading_streaks"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  last_streak RECORD;

-- Creating function: public.update_streak_goals
CREATE OR REPLACE FUNCTION "public"."update_streak_goals"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  goal RECORD;

-- Creating function: public.update_ticket_quantity_sold
CREATE OR REPLACE FUNCTION "public"."update_ticket_quantity_sold"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'purchased') THEN
    -- Increment quantity sold for this ticket type
    UPDATE ticket_types
    SET quantity_sold = quantity_sold + 1
    WHERE id = NEW.ticket_type_id;

-- Creating function: public.update_timestamp
CREATE OR REPLACE FUNCTION "public"."update_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();

-- Creating function: public.update_updated_at_column
CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();

-- Creating function: public.update_user_profile_activity
CREATE OR REPLACE FUNCTION "public"."update_user_profile_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  user_name TEXT := 'Unknown User';

-- Creating function: public.update_user_recommendations
CREATE OR REPLACE FUNCTION "public"."update_user_recommendations"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Schedule recommendation generation for this user
  PERFORM public.generate_recommendations(NEW.user_id);

-- Creating function: public.validate_book_data
CREATE OR REPLACE FUNCTION "public"."validate_book_data"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Ensure at least one ISBN is provided
    IF NEW.isbn10 IS NULL AND NEW.isbn13 IS NULL THEN
        RAISE EXCEPTION 'At least one ISBN (ISBN-10 or ISBN-13) must be provided';

-- Creating function: public.validate_chat_message
CREATE OR REPLACE FUNCTION "public"."validate_chat_message"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  chat_room RECORD;

-- Creating function: public.validate_event_creation
CREATE OR REPLACE FUNCTION "public"."validate_event_creation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  permission_record RECORD;

-- Creating function: public.validate_follow_target
CREATE OR REPLACE FUNCTION "public"."validate_follow_target"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
    DECLARE
        target_type_name TEXT;

-- Creating function: public.validate_livestream_activation
CREATE OR REPLACE FUNCTION "public"."validate_livestream_activation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if there's already an active livestream for this event
  IF NEW.is_active AND EXISTS (
    SELECT 1 FROM event_livestreams 
    WHERE event_id = NEW.event_id 
    AND is_active = true 
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'There is already an active livestream for this event';

-- Creating function: public.validate_survey_response
CREATE OR REPLACE FUNCTION "public"."validate_survey_response"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  required_question_ids UUID[];

-- Creating function: public.validate_ticket_purchase
CREATE OR REPLACE FUNCTION "public"."validate_ticket_purchase"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  available_qty INTEGER;

-- Creating function: realtime.apply_rls
CREATE OR REPLACE FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer DEFAULT (1024 * 1024)) RETURNS SETOF "realtime"."wal_rls"
    LANGUAGE "plpgsql"
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- Creating function: realtime.broadcast_changes
CREATE OR REPLACE FUNCTION "realtime"."broadcast_changes"("topic_name" "text", "event_name" "text", "operation" "text", "table_name" "text", "table_schema" "text", "new" "record", "old" "record", "level" "text" DEFAULT 'ROW'::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;

-- Creating function: realtime.build_prepared_statement_sql
CREATE OR REPLACE FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) RETURNS "text"
    LANGUAGE "sql"
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;

-- Creating function: realtime.cast
CREATE OR REPLACE FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") RETURNS "jsonb"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
    declare
      res jsonb;

-- Creating function: realtime.check_equality_op
CREATE OR REPLACE FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );

-- Creating function: realtime.is_visible_through_filters
CREATE OR REPLACE FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) RETURNS boolean
    LANGUAGE "sql" IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;

-- Creating function: realtime.list_changes
CREATE OR REPLACE FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) RETURNS SETOF "realtime"."wal_rls"
    LANGUAGE "sql"
    SET "log_min_messages" TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;

-- Creating function: realtime.quote_wal2json
CREATE OR REPLACE FUNCTION "realtime"."quote_wal2json"("entity" "regclass") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;

-- Creating function: realtime.send
CREATE OR REPLACE FUNCTION "realtime"."send"("payload" "jsonb", "event" "text", "topic" "text", "private" boolean DEFAULT true) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

-- Creating function: realtime.subscription_check_filters
CREATE OR REPLACE FUNCTION "realtime"."subscription_check_filters"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );

-- Creating function: realtime.to_regrole
CREATE OR REPLACE FUNCTION "realtime"."to_regrole"("role_name" "text") RETURNS "regrole"
    LANGUAGE "sql" IMMUTABLE
    AS $$ select role_name::regrole $$;

-- Creating function: realtime.topic
CREATE OR REPLACE FUNCTION "realtime"."topic"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;

-- Creating function: storage.can_insert_object
CREATE OR REPLACE FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);

-- Creating function: storage.extension
CREATE OR REPLACE FUNCTION "storage"."extension"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
_parts text[];

-- Creating function: storage.filename
CREATE OR REPLACE FUNCTION "storage"."filename"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
_parts text[];

-- Creating function: storage.foldername
CREATE OR REPLACE FUNCTION "storage"."foldername"("name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql"
    AS $$
DECLARE
_parts text[];

-- Creating function: storage.get_size_by_bucket
CREATE OR REPLACE FUNCTION "storage"."get_size_by_bucket"() RETURNS TABLE("size" bigint, "bucket_id" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;

-- Creating function: storage.list_multipart_uploads_with_delimiter
CREATE OR REPLACE FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "next_key_token" "text" DEFAULT ''::"text", "next_upload_token" "text" DEFAULT ''::"text") RETURNS TABLE("key" "text", "id" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;

-- Creating function: storage.list_objects_with_delimiter
CREATE OR REPLACE FUNCTION "storage"."list_objects_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "start_after" "text" DEFAULT ''::"text", "next_token" "text" DEFAULT ''::"text") RETURNS TABLE("name" "text", "id" "uuid", "metadata" "jsonb", "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;

-- Creating function: storage.operation
CREATE OR REPLACE FUNCTION "storage"."operation"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);

-- Creating function: storage.search
CREATE OR REPLACE FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
declare
  v_order_by text;

-- Creating function: storage.update_updated_at_column
CREATE OR REPLACE FUNCTION "storage"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();

-- =====================================================
-- PHASE 6: POLICIES
-- =====================================================

-- =====================================================
-- RESTORATION COMPLETE
-- =====================================================

-- All database objects have been created in the correct dependency order.
-- You may now need to:
-- 1. Create any missing triggers
-- 2. Insert initial data
-- 3. Set up any additional configurations
-- 4. Verify all objects were created successfully
