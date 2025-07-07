--
-- Comprehensive Database Schema
-- Generated on: 2025-07-07 01:48:36
-- This file contains the complete database structure including:
-- - All tables and their relationships
-- - All functions and triggers
-- - All indexes and constraints
-- - All RLS policies
-- - All views and materialized views
-- - All custom types and enums
--

--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA IF NOT EXISTS "auth";


ALTER SCHEMA "auth" OWNER TO "supabase_admin";

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA IF NOT EXISTS "extensions";


ALTER SCHEMA "extensions" OWNER TO "postgres";

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA IF NOT EXISTS "graphql_public";


ALTER SCHEMA "graphql_public" OWNER TO "supabase_admin";

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";

--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA IF NOT EXISTS "realtime";


ALTER SCHEMA "realtime" OWNER TO "supabase_admin";

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA IF NOT EXISTS "storage";


ALTER SCHEMA "storage" OWNER TO "supabase_admin";

--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE "auth"."aal_level" AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE "auth"."aal_level" OWNER TO "supabase_auth_admin";

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE "auth"."code_challenge_method" AS ENUM (
    's256',
    'plain'
);


ALTER TYPE "auth"."code_challenge_method" OWNER TO "supabase_auth_admin";

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE "auth"."factor_status" AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE "auth"."factor_status" OWNER TO "supabase_auth_admin";

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE "auth"."factor_type" AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE "auth"."factor_type" OWNER TO "supabase_auth_admin";

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE "auth"."one_time_token_type" AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE "auth"."one_time_token_type" OWNER TO "supabase_auth_admin";

--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE "realtime"."action" AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE "realtime"."action" OWNER TO "supabase_admin";

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE "realtime"."equality_op" AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


ALTER TYPE "realtime"."equality_op" OWNER TO "supabase_admin";

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE "realtime"."user_defined_filter" AS (
	"column_name" "text",
	"op" "realtime"."equality_op",
	"value" "text"
);


ALTER TYPE "realtime"."user_defined_filter" OWNER TO "supabase_admin";

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE "realtime"."wal_column" AS (
	"name" "text",
	"type_name" "text",
	"type_oid" "oid",
	"value" "jsonb",
	"is_pkey" boolean,
	"is_selectable" boolean
);


ALTER TYPE "realtime"."wal_column" OWNER TO "supabase_admin";

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE "realtime"."wal_rls" AS (
	"wal" "jsonb",
	"is_rls_enabled" boolean,
	"subscription_ids" "uuid"[],
	"errors" "text"[]
);


ALTER TYPE "realtime"."wal_rls" OWNER TO "supabase_admin";

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE OR REPLACE FUNCTION "auth"."email"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION "auth"."email"() OWNER TO "supabase_auth_admin";

--
-- Name: FUNCTION "email"(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION "auth"."email"() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE OR REPLACE FUNCTION "auth"."jwt"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION "auth"."jwt"() OWNER TO "supabase_auth_admin";

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE OR REPLACE FUNCTION "auth"."role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION "auth"."role"() OWNER TO "supabase_auth_admin";

--
-- Name: FUNCTION "role"(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION "auth"."role"() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE OR REPLACE FUNCTION "auth"."uid"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION "auth"."uid"() OWNER TO "supabase_auth_admin";

--
-- Name: FUNCTION "uid"(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION "auth"."uid"() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: postgres
--

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

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION "extensions"."grant_pg_cron_access"() OWNER TO "postgres";

--
-- Name: FUNCTION "grant_pg_cron_access"(); Type: COMMENT; Schema: extensions; Owner: postgres
--

COMMENT ON FUNCTION "extensions"."grant_pg_cron_access"() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE OR REPLACE FUNCTION "extensions"."grant_pg_graphql_access"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


ALTER FUNCTION "extensions"."grant_pg_graphql_access"() OWNER TO "supabase_admin";

--
-- Name: FUNCTION "grant_pg_graphql_access"(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION "extensions"."grant_pg_graphql_access"() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: postgres
--

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
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION "extensions"."grant_pg_net_access"() OWNER TO "postgres";

--
-- Name: FUNCTION "grant_pg_net_access"(); Type: COMMENT; Schema: extensions; Owner: postgres
--

COMMENT ON FUNCTION "extensions"."grant_pg_net_access"() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE OR REPLACE FUNCTION "extensions"."pgrst_ddl_watch"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION "extensions"."pgrst_ddl_watch"() OWNER TO "supabase_admin";

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE OR REPLACE FUNCTION "extensions"."pgrst_drop_watch"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION "extensions"."pgrst_drop_watch"() OWNER TO "supabase_admin";

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE OR REPLACE FUNCTION "extensions"."set_graphql_placeholder"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION "extensions"."set_graphql_placeholder"() OWNER TO "supabase_admin";

--
-- Name: FUNCTION "set_graphql_placeholder"(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION "extensions"."set_graphql_placeholder"() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: anonymize_user_data_enhanced("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."anonymize_user_data_enhanced"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Anonymize user data instead of deletion for compliance
    UPDATE "public"."reading_progress" 
    SET "user_id" = NULL, "updated_at" = "now"()
    WHERE "user_id" = p_user_id;
    
    UPDATE "public"."book_reviews" 
    SET "user_id" = NULL, "updated_at" = "now"()
    WHERE "user_id" = p_user_id;
    
    UPDATE "public"."reading_lists" 
    SET "user_id" = NULL, "updated_at" = "now"()
    WHERE "user_id" = p_user_id;
    
    -- Log the anonymization
    PERFORM "public"."log_sensitive_operation_enhanced"(
        'data_anonymization', 'user_data', p_user_id, p_user_id,
        "jsonb_build_object"('anonymization_timestamp', "now"())
    );
    
    RETURN true;
END;
$$;


ALTER FUNCTION "public"."anonymize_user_data_enhanced"("p_user_id" "uuid") OWNER TO "postgres";

--
-- Name: FUNCTION "anonymize_user_data_enhanced"("p_user_id" "uuid"); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."anonymize_user_data_enhanced"("p_user_id" "uuid") IS 'Enhanced user data anonymization for GDPR compliance';


--
-- Name: check_data_health(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."check_data_health"() RETURNS TABLE("health_check" "text", "issue_count" bigint, "severity" "text", "recommendation" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check for books without publishers
    RETURN QUERY
    SELECT 
        'Books without publishers'::text,
        COUNT(*)::bigint,
        CASE WHEN COUNT(*) > 100 THEN 'HIGH' WHEN COUNT(*) > 10 THEN 'MEDIUM' ELSE 'LOW' END,
        'Run fix_missing_publisher_relationships()'::text
    FROM "public"."books"
    WHERE publisher_id IS NULL;
    
    -- Check for orphaned reading progress
    RETURN QUERY
    SELECT 
        'Orphaned reading progress'::text,
        COUNT(*)::bigint,
        CASE WHEN COUNT(*) > 50 THEN 'HIGH' WHEN COUNT(*) > 10 THEN 'MEDIUM' ELSE 'LOW' END,
        'Run cleanup_orphaned_records()'::text
    FROM "public"."reading_progress" rp
    WHERE NOT EXISTS (SELECT 1 FROM "auth"."users" u WHERE u.id = rp.user_id)
    OR NOT EXISTS (SELECT 1 FROM "public"."books" b WHERE b.id = rp.book_id);
    
    -- Check for inconsistent status mappings
    RETURN QUERY
    SELECT 
        'Inconsistent status mappings'::text,
        COUNT(*)::bigint,
        CASE WHEN COUNT(*) > 20 THEN 'HIGH' WHEN COUNT(*) > 5 THEN 'MEDIUM' ELSE 'LOW' END,
        'Run standardize_reading_status_mappings()'::text
    FROM "public"."reading_progress"
    WHERE status NOT IN ('not_started', 'in_progress', 'completed', 'on_hold', 'abandoned');
    
    -- Check for data validation issues
    RETURN QUERY
    SELECT 
        'Data validation issues'::text,
        (
            (SELECT COUNT(*) FROM "public"."books" WHERE publication_date > CURRENT_DATE) +
            (SELECT COUNT(*) FROM "public"."books" WHERE pages < 0) +
            (SELECT COUNT(*) FROM "public"."reading_progress" WHERE progress_percentage < 0 OR progress_percentage > 100)
        )::bigint,
        CASE WHEN (
            (SELECT COUNT(*) FROM "public"."books" WHERE publication_date > CURRENT_DATE) +
            (SELECT COUNT(*) FROM "public"."books" WHERE pages < 0) +
            (SELECT COUNT(*) FROM "public"."reading_progress" WHERE progress_percentage < 0 OR progress_percentage > 100)
        ) > 50 THEN 'HIGH' 
        WHEN (
            (SELECT COUNT(*) FROM "public"."books" WHERE publication_date > CURRENT_DATE) +
            (SELECT COUNT(*) FROM "public"."books" WHERE pages < 0) +
            (SELECT COUNT(*) FROM "public"."reading_progress" WHERE progress_percentage < 0 OR progress_percentage > 100)
        ) > 10 THEN 'MEDIUM' ELSE 'LOW' END,
        'Run validate_and_repair_data()'::text;
END;
$$;


ALTER FUNCTION "public"."check_data_health"() OWNER TO "postgres";

--
-- Name: FUNCTION "check_data_health"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."check_data_health"() IS 'Comprehensive data health check';


--
-- Name: check_data_integrity_health(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."check_data_integrity_health"() RETURNS TABLE("issue_type" "text", "issue_count" bigint, "severity" "text", "recommendation" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check for books with missing publisher_id
    RETURN QUERY
    SELECT 
        'Books with missing publisher_id'::text,
        COUNT(*)::bigint,
        CASE 
            WHEN COUNT(*) > 0 THEN 'CRITICAL'
            ELSE 'GOOD'
        END,
        CASE 
            WHEN COUNT(*) > 0 THEN 'Fix publisher relationships'
            ELSE 'No issues found'
        END
    FROM "public"."books" 
    WHERE publisher_id IS NULL;
    
    -- Check for orphaned reading progress records
    RETURN QUERY
    SELECT 
        'Orphaned reading progress records'::text,
        COUNT(*)::bigint,
        CASE 
            WHEN COUNT(*) > 0 THEN 'MEDIUM'
            ELSE 'GOOD'
        END,
        CASE 
            WHEN COUNT(*) > 0 THEN 'Clean up orphaned records'
            ELSE 'No issues found'
        END
    FROM "public"."reading_progress" rp
    LEFT JOIN "public"."books" b ON rp.book_id = b.id
    WHERE b.id IS NULL;
    
    -- Check for orphaned follows records
    RETURN QUERY
    SELECT 
        'Orphaned follows records'::text,
        COUNT(*)::bigint,
        CASE 
            WHEN COUNT(*) > 0 THEN 'MEDIUM'
            ELSE 'GOOD'
        END,
        CASE 
            WHEN COUNT(*) > 0 THEN 'Clean up orphaned follows'
            ELSE 'No issues found'
        END
    FROM "public"."follows" f
    LEFT JOIN "auth"."users" u ON f.follower_id = u.id
    WHERE u.id IS NULL;
    
    -- Check for inconsistent status values
    RETURN QUERY
    SELECT 
        'Inconsistent reading status values'::text,
        COUNT(*)::bigint,
        CASE 
            WHEN COUNT(*) > 0 THEN 'LOW'
            ELSE 'GOOD'
        END,
        CASE 
            WHEN COUNT(*) > 0 THEN 'Standardize status values'
            ELSE 'No issues found'
        END
    FROM "public"."reading_progress"
    WHERE reading_progress.status NOT IN ('not_started', 'in_progress', 'completed', 'on_hold', 'abandoned');
END;
$$;


ALTER FUNCTION "public"."check_data_integrity_health"() OWNER TO "postgres";

--
-- Name: FUNCTION "check_data_integrity_health"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."check_data_integrity_health"() IS 'Comprehensive data integrity health check';


--
-- Name: check_data_quality_issues_enhanced(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."check_data_quality_issues_enhanced"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_issues "jsonb" := '[]'::"jsonb";
    v_issue "jsonb";
BEGIN
    -- Check for books without titles
    SELECT "jsonb_build_object"(
        'issue_type', 'missing_title',
        'severity', 'medium',
        'count', COUNT(*),
        'description', 'Books without titles found'
    ) INTO v_issue
    FROM "public"."books"
    WHERE "title" IS NULL OR LENGTH(TRIM("title")) = 0;
    
    IF (v_issue->>'count')::integer > 0 THEN
        v_issues := v_issues || v_issue;
    END IF;
    
    -- Check for books without authors
    SELECT "jsonb_build_object"(
        'issue_type', 'missing_author',
        'severity', 'medium',
        'count', COUNT(*),
        'description', 'Books without authors found'
    ) INTO v_issue
    FROM "public"."books"
    WHERE "author" IS NULL OR LENGTH(TRIM("author")) = 0;
    
    IF (v_issue->>'count')::integer > 0 THEN
        v_issues := v_issues || v_issue;
    END IF;
    
    -- Check for orphaned reading progress
    SELECT "jsonb_build_object"(
        'issue_type', 'orphaned_reading_progress',
        'severity', 'high',
        'count', COUNT(*),
        'description', 'Reading progress records for non-existent books'
    ) INTO v_issue
    FROM "public"."reading_progress" rp
    LEFT JOIN "public"."books" b ON rp."book_id" = b."id"
    WHERE b."id" IS NULL;
    
    IF (v_issue->>'count')::integer > 0 THEN
        v_issues := v_issues || v_issue;
    END IF;
    
    RETURN "jsonb_build_object"(
        'issues', v_issues,
        'total_issues', array_length(v_issues, 1),
        'check_timestamp', "now"()
    );
END;
$$;


ALTER FUNCTION "public"."check_data_quality_issues_enhanced"() OWNER TO "postgres";

--
-- Name: FUNCTION "check_data_quality_issues_enhanced"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."check_data_quality_issues_enhanced"() IS 'Enhanced data quality issue checking';


--
-- Name: check_existing_follow("uuid", "uuid", "uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."check_existing_follow"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") RETURNS TABLE("follow_exists" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT EXISTS(
    SELECT 1 FROM public.follows 
    WHERE follower_id = p_follower_id 
    AND following_id = p_following_id
    AND target_type_id = p_target_type_id
  );
END;
$$;


ALTER FUNCTION "public"."check_existing_follow"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") OWNER TO "postgres";

--
-- Name: check_is_following("uuid", "uuid", "uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."check_is_following"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") RETURNS TABLE("is_following" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT EXISTS(
    SELECT 1 FROM public.follows 
    WHERE follower_id = p_follower_id 
    AND following_id = p_following_id
    AND target_type_id = p_target_type_id
  );
END;
$$;


ALTER FUNCTION "public"."check_is_following"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") OWNER TO "postgres";

--
-- Name: check_publisher_data_health(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."check_publisher_data_health"() RETURNS TABLE("metric_name" "text", "current_value" bigint, "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Count books with missing publisher_id
    RETURN QUERY SELECT 
        'Books with missing publisher_id'::text,
        COUNT(*)::bigint,
        CASE WHEN COUNT(*) = 0 THEN 'GOOD' ELSE 'NEEDS_FIX' END
    FROM "public"."books" 
    WHERE publisher_id IS NULL;
    
    -- Count total books
    RETURN QUERY SELECT 
        'Total books'::text,
        COUNT(*)::bigint,
        'INFO'::text
    FROM "public"."books";
    
    -- Count total publishers
    RETURN QUERY SELECT 
        'Total publishers'::text,
        COUNT(*)::bigint,
        'INFO'::text
    FROM "public"."publishers";
    
    -- Count orphaned records
    RETURN QUERY SELECT 
        'Orphaned reading_progress records'::text,
        COUNT(*)::bigint,
        CASE WHEN COUNT(*) = 0 THEN 'GOOD' ELSE 'NEEDS_CLEANUP' END
    FROM "public"."reading_progress" rp
    LEFT JOIN "public"."books" b ON rp.book_id = b.id
    WHERE b.id IS NULL;
END;
$$;


ALTER FUNCTION "public"."check_publisher_data_health"() OWNER TO "postgres";

--
-- Name: FUNCTION "check_publisher_data_health"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."check_publisher_data_health"() IS 'Check the health of publisher data relationships';


--
-- Name: check_rate_limit_enhanced("uuid", "text", integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."check_rate_limit_enhanced"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer DEFAULT 10, "p_window_minutes" integer DEFAULT 5) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_attempt_count integer;
BEGIN
    SELECT COUNT(*) INTO v_attempt_count
    FROM "public"."user_activity_log"
    WHERE "user_id" = p_user_id
    AND "activity_type" = p_action
    AND "created_at" >= "now"() - (p_window_minutes || ' minutes')::interval;
    
    RETURN v_attempt_count < p_max_attempts;
END;
$$;


ALTER FUNCTION "public"."check_rate_limit_enhanced"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer, "p_window_minutes" integer) OWNER TO "postgres";

--
-- Name: FUNCTION "check_rate_limit_enhanced"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer, "p_window_minutes" integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."check_rate_limit_enhanced"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer, "p_window_minutes" integer) IS 'Enhanced rate limiting for user actions';


--
-- Name: check_reading_privacy_access("uuid", "uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."check_reading_privacy_access"("target_user_id" "uuid", "requesting_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- User can always access their own data
    IF target_user_id = requesting_user_id THEN
        RETURN true;
    END IF;

    -- Check if the target user has public reading profile
    IF EXISTS (
        SELECT 1 FROM "public"."user_privacy_settings" 
        WHERE user_id = target_user_id 
        AND allow_public_reading_profile = true
    ) THEN
        RETURN true;
    END IF;

    -- Check if requesting user is a friend and target allows friends
    IF EXISTS (
        SELECT 1 FROM "public"."user_privacy_settings" 
        WHERE user_id = target_user_id 
        AND allow_friends_to_see_reading = true
    ) AND EXISTS (
        SELECT 1 FROM "public"."user_friends" 
        WHERE (user_id = requesting_user_id AND friend_id = target_user_id) 
        OR (friend_id = requesting_user_id AND user_id = target_user_id)
    ) THEN
        RETURN true;
    END IF;

    -- Check if requesting user is a follower and target allows followers
    IF EXISTS (
        SELECT 1 FROM "public"."user_privacy_settings" 
        WHERE user_id = target_user_id 
        AND allow_followers_to_see_reading = true
    ) AND EXISTS (
        SELECT 1 FROM "public"."follows" 
        WHERE follower_id = requesting_user_id AND following_id = target_user_id
    ) THEN
        RETURN true;
    END IF;

    -- Check for custom permissions
    IF EXISTS (
        SELECT 1 FROM "public"."custom_permissions" 
        WHERE user_id = requesting_user_id 
        AND target_user_id = target_user_id 
        AND permission_type = 'view_reading_progress'
        AND (expires_at IS NULL OR expires_at > now())
    ) THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$;


ALTER FUNCTION "public"."check_reading_privacy_access"("target_user_id" "uuid", "requesting_user_id" "uuid") OWNER TO "postgres";

--
-- Name: FUNCTION "check_reading_privacy_access"("target_user_id" "uuid", "requesting_user_id" "uuid"); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."check_reading_privacy_access"("target_user_id" "uuid", "requesting_user_id" "uuid") IS 'Check if a user can access another user''s reading progress';


--
-- Name: cleanup_old_audit_trail(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."cleanup_old_audit_trail"("p_days_to_keep" integer DEFAULT 365) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM "public"."enterprise_audit_trail"
    WHERE "changed_at" < now() - (p_days_to_keep || ' days')::interval;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_audit_trail"("p_days_to_keep" integer) OWNER TO "postgres";

--
-- Name: FUNCTION "cleanup_old_audit_trail"("p_days_to_keep" integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."cleanup_old_audit_trail"("p_days_to_keep" integer) IS 'Cleans up old audit trail data';


--
-- Name: cleanup_old_monitoring_data(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."cleanup_old_monitoring_data"("p_days_to_keep" integer DEFAULT 90) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Clean old user activity logs
    DELETE FROM "public"."user_activity_log" 
    WHERE "created_at" < "now"() - (p_days_to_keep || ' days')::interval;
    
    -- Clean old performance metrics
    DELETE FROM "public"."performance_metrics" 
    WHERE "recorded_at" < "now"() - (p_days_to_keep || ' days')::interval;
    
    -- Clean old system health checks
    DELETE FROM "public"."system_health_checks" 
    WHERE "checked_at" < "now"() - (p_days_to_keep || ' days')::interval;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_monitoring_data"("p_days_to_keep" integer) OWNER TO "postgres";

--
-- Name: FUNCTION "cleanup_old_monitoring_data"("p_days_to_keep" integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."cleanup_old_monitoring_data"("p_days_to_keep" integer) IS 'Cleans up old monitoring data to maintain performance';


--
-- Name: cleanup_orphaned_records(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."cleanup_orphaned_records"() RETURNS TABLE("table_name" "text", "records_deleted" bigint, "cleanup_type" "text", "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    deleted_count bigint;
BEGIN
    -- Clean up orphaned reading progress records
    DELETE FROM "public"."reading_progress" rp
    WHERE NOT EXISTS (
        SELECT 1 FROM "public"."books" b 
        WHERE b.id = rp.book_id
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN QUERY SELECT 
        'reading_progress'::text,
        deleted_count,
        'orphaned_records'::text,
        'SUCCESS'::text;
    
    -- Clean up orphaned follows records
    DELETE FROM "public"."follows" f
    WHERE NOT EXISTS (
        SELECT 1 FROM "auth"."users" u 
        WHERE u.id = f.follower_id
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN QUERY SELECT 
        'follows'::text,
        deleted_count,
        'orphaned_records'::text,
        'SUCCESS'::text;
    
    -- Log the cleanup operation (only if table exists)
    BEGIN
        INSERT INTO "public"."security_audit_log" (
            action, 
            table_name, 
            new_values
        ) VALUES (
            'CLEANUP_ORPHANED_RECORDS',
            'all_tables',
            jsonb_build_object(
                'cleanup_completed_at', now(),
                'cleanup_type', 'orphaned_records_removal'
            )
        );
    EXCEPTION WHEN OTHERS THEN
        -- Table doesn't exist, continue without logging
    END;
END;
$$;


ALTER FUNCTION "public"."cleanup_orphaned_records"() OWNER TO "postgres";

--
-- Name: FUNCTION "cleanup_orphaned_records"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."cleanup_orphaned_records"() IS 'Clean up orphaned records for data consistency';


--
-- Name: comprehensive_system_health_check_enhanced(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."comprehensive_system_health_check_enhanced"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_health_report "jsonb";
    v_overall_status "text" := 'healthy';
    v_checks "jsonb" := '[]'::"jsonb";
    v_check_result "jsonb";
BEGIN
    -- Check database connectivity
    BEGIN
        PERFORM 1;
        v_check_result := "jsonb_build_object"(
            'check_name', 'database_connectivity',
            'status', 'healthy',
            'details', 'Database connection successful'
        );
    EXCEPTION WHEN OTHERS THEN
        v_overall_status := 'critical';
        v_check_result := "jsonb_build_object"(
            'check_name', 'database_connectivity',
            'status', 'critical',
            'details', 'Database connection failed: ' || SQLERRM
        );
    END;
    v_checks := v_checks || v_check_result;
    
    -- Check table sizes
    BEGIN
        SELECT "jsonb_build_object"(
            'check_name', 'table_sizes',
            'status', CASE 
                WHEN total_size_mb > 1000 THEN 'warning'
                ELSE 'healthy'
            END,
            'details', "jsonb_build_object"(
                'total_size_mb', total_size_mb,
                'largest_table', largest_table
            )
        ) INTO v_check_result
        FROM (
            SELECT 
                ROUND(SUM(pg_total_relation_size(c.oid)) / 1024.0 / 1024.0, 2) as total_size_mb,
                c.relname as largest_table
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
            GROUP BY c.relname
            ORDER BY pg_total_relation_size(c.oid) DESC
            LIMIT 1
        ) size_check;
        
        IF (v_check_result->>'status') = 'warning' THEN
            v_overall_status := 'warning';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_check_result := "jsonb_build_object"(
            'check_name', 'table_sizes',
            'status', 'critical',
            'details', 'Failed to check table sizes: ' || SQLERRM
        );
        v_overall_status := 'critical';
    END;
    v_checks := v_checks || v_check_result;
    
    -- Check for orphaned records
    BEGIN
        SELECT "jsonb_build_object"(
            'check_name', 'data_integrity',
            'status', CASE 
                WHEN orphaned_count > 0 THEN 'warning'
                ELSE 'healthy'
            END,
            'details', "jsonb_build_object"(
                'orphaned_records', orphaned_count
            )
        ) INTO v_check_result
        FROM (
            SELECT COUNT(*) as orphaned_count
            FROM "public"."reading_progress" rp
            LEFT JOIN "public"."books" b ON rp."book_id" = b."id"
            WHERE b."id" IS NULL
        ) integrity_check;
        
        IF (v_check_result->>'status') = 'warning' THEN
            v_overall_status := 'warning';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_check_result := "jsonb_build_object"(
            'check_name', 'data_integrity',
            'status', 'critical',
            'details', 'Failed to check data integrity: ' || SQLERRM
        );
        v_overall_status := 'critical';
    END;
    v_checks := v_checks || v_check_result;
    
    -- Build comprehensive health report
    v_health_report := "jsonb_build_object"(
        'overall_status', v_overall_status,
        'checks', v_checks,
        'health_check_timestamp', "now"()
    );
    
    RETURN v_health_report;
END;
$$;


ALTER FUNCTION "public"."comprehensive_system_health_check_enhanced"() OWNER TO "postgres";

--
-- Name: FUNCTION "comprehensive_system_health_check_enhanced"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."comprehensive_system_health_check_enhanced"() IS 'Enhanced comprehensive system health checks';


--
-- Name: create_data_version("text", "uuid", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_data_version"("p_table_name" "text", "p_record_id" "uuid", "p_change_reason" "text" DEFAULT NULL::"text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_next_version integer;
    v_data_snapshot jsonb;
    v_table_query text;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX("version_number"), 0) + 1 
    INTO v_next_version
    FROM "public"."enterprise_data_versions"
    WHERE "table_name" = p_table_name AND "record_id" = p_record_id;
    
    -- Mark previous version as not current
    UPDATE "public"."enterprise_data_versions"
    SET "is_current" = false
    WHERE "table_name" = p_table_name AND "record_id" = p_record_id;
    
    -- Get current data snapshot
    v_table_query := format('SELECT to_jsonb(t.*) FROM %I t WHERE id = %L', p_table_name, p_record_id);
    EXECUTE v_table_query INTO v_data_snapshot;
    
    -- Insert new version
    INSERT INTO "public"."enterprise_data_versions" (
        "table_name",
        "record_id",
        "version_number",
        "data_snapshot",
        "created_by",
        "change_reason"
    ) VALUES (
        p_table_name,
        p_record_id,
        v_next_version,
        v_data_snapshot,
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
        p_change_reason
    );
    
    RETURN v_next_version;
END;
$$;


ALTER FUNCTION "public"."create_data_version"("p_table_name" "text", "p_record_id" "uuid", "p_change_reason" "text") OWNER TO "postgres";

--
-- Name: FUNCTION "create_data_version"("p_table_name" "text", "p_record_id" "uuid", "p_change_reason" "text"); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."create_data_version"("p_table_name" "text", "p_record_id" "uuid", "p_change_reason" "text") IS 'Creates data versioning for tracking changes';


--
-- Name: create_enterprise_audit_trail(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_enterprise_audit_trail"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_old_values jsonb;
    v_new_values jsonb;
    v_operation text;
BEGIN
    -- Determine operation type
    IF TG_OP = 'INSERT' THEN
        v_operation := 'INSERT';
        v_new_values := to_jsonb(NEW);
        v_old_values := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        v_operation := 'UPDATE';
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_operation := 'DELETE';
        v_old_values := to_jsonb(OLD);
        v_new_values := NULL;
    END IF;
    
    -- Insert audit trail record
    INSERT INTO "public"."enterprise_audit_trail" (
        "table_name",
        "record_id",
        "operation",
        "old_values",
        "new_values",
        "changed_by",
        "ip_address",
        "user_agent",
        "session_id",
        "transaction_id"
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        v_operation,
        v_old_values,
        v_new_values,
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
        inet_client_addr(),
        current_setting('application_name', true),
        current_setting('session_id', true),
        txid_current()::text
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."create_enterprise_audit_trail"() OWNER TO "postgres";

--
-- Name: FUNCTION "create_enterprise_audit_trail"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."create_enterprise_audit_trail"() IS 'Creates enterprise audit trail for data changes';


--
-- Name: decrypt_sensitive_data_enhanced("text", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."decrypt_sensitive_data_enhanced"("p_encrypted_data" "text", "p_key" "text" DEFAULT 'default_key'::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- In production, use proper decryption libraries
    -- This is a placeholder for demonstration
    RETURN SUBSTRING(p_encrypted_data FROM 11);
END;
$$;


ALTER FUNCTION "public"."decrypt_sensitive_data_enhanced"("p_encrypted_data" "text", "p_key" "text") OWNER TO "postgres";

--
-- Name: FUNCTION "decrypt_sensitive_data_enhanced"("p_encrypted_data" "text", "p_key" "text"); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."decrypt_sensitive_data_enhanced"("p_encrypted_data" "text", "p_key" "text") IS 'Enhanced decryption for authorized access';


--
-- Name: delete_follow_record("uuid", "uuid", "uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."delete_follow_record"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") RETURNS TABLE("success" boolean, "error_message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Delete follow record
  DELETE FROM public.follows 
  WHERE follower_id = p_follower_id 
  AND following_id = p_following_id
  AND target_type_id = p_target_type_id;

  -- Check if any rows were affected
  IF FOUND THEN
    RETURN QUERY SELECT TRUE, '';
  ELSE
    RETURN QUERY SELECT FALSE, 'Follow record not found';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, SQLERRM;
END;
$$;


ALTER FUNCTION "public"."delete_follow_record"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") OWNER TO "postgres";

--
-- Name: encrypt_sensitive_data_enhanced("text", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."encrypt_sensitive_data_enhanced"("p_data" "text", "p_key" "text" DEFAULT 'default_key'::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- In production, use proper encryption libraries
    -- This is a placeholder for demonstration
    RETURN 'encrypted_' || encode(digest(p_data || p_key, 'sha256'), 'hex');
END;
$$;


ALTER FUNCTION "public"."encrypt_sensitive_data_enhanced"("p_data" "text", "p_key" "text") OWNER TO "postgres";

--
-- Name: FUNCTION "encrypt_sensitive_data_enhanced"("p_data" "text", "p_key" "text"); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."encrypt_sensitive_data_enhanced"("p_data" "text", "p_key" "text") IS 'Enhanced encryption for sensitive data security';


--
-- Name: ensure_reading_progress_consistency(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."ensure_reading_progress_consistency"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Validate status values
    IF NEW.status NOT IN ('want_to_read', 'currently_reading', 'read', 'not_started', 'in_progress', 'completed', 'on_hold', 'abandoned') THEN
        RAISE EXCEPTION 'Invalid status value: %', NEW.status;
    END IF;
    
    -- Validate progress percentage
    IF NEW.progress_percentage < 0 OR NEW.progress_percentage > 100 THEN
        RAISE EXCEPTION 'Progress percentage must be between 0 and 100';
    END IF;
    
    -- Ensure dates are logical
    IF NEW.finish_date IS NOT NULL AND NEW.start_date IS NOT NULL AND NEW.finish_date < NEW.start_date THEN
        RAISE EXCEPTION 'Finish date cannot be before start date';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_reading_progress_consistency"() OWNER TO "postgres";

--
-- Name: export_user_data_enhanced("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."export_user_data_enhanced"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_export_data "jsonb";
BEGIN
    SELECT "jsonb_build_object"(
        'user_info', (
            SELECT "jsonb_build_object"(
                'id', u."id",
                'email', u."email",
                'created_at', u."created_at"
            )
            FROM "auth"."users" u
            WHERE u."id" = p_user_id
        ),
        'reading_progress', (
            SELECT "jsonb_agg"("jsonb_build_object"(
                'book_id', rp."book_id",
                'status', rp."status",
                'progress_percentage', rp."progress_percentage",
                'start_date', rp."start_date",
                'finish_date', rp."finish_date"
            ))
            FROM "public"."reading_progress" rp
            WHERE rp."user_id" = p_user_id
        ),
        'book_reviews', (
            SELECT "jsonb_agg"("jsonb_build_object"(
                'book_id', br."book_id",
                'rating', br."rating",
                'review_text', br."review_text",
                'created_at', br."created_at"
            ))
            FROM "public"."book_reviews" br
            WHERE br."user_id" = p_user_id
        ),
        'reading_lists', (
            SELECT "jsonb_agg"("jsonb_build_object"(
                'list_id', rl."id",
                'name', rl."name",
                'description', rl."description",
                'created_at', rl."created_at"
            ))
            FROM "public"."reading_lists" rl
            WHERE rl."user_id" = p_user_id
        ),
        'export_timestamp', "now"()
    ) INTO v_export_data;
    
    -- Log the export operation
    PERFORM "public"."log_sensitive_operation_enhanced"(
        'data_export', 'user_data', p_user_id, p_user_id,
        "jsonb_build_object"('export_timestamp', "now"())
    );
    
    RETURN v_export_data;
END;
$$;


ALTER FUNCTION "public"."export_user_data_enhanced"("p_user_id" "uuid") OWNER TO "postgres";

--
-- Name: FUNCTION "export_user_data_enhanced"("p_user_id" "uuid"); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."export_user_data_enhanced"("p_user_id" "uuid") IS 'Enhanced user data export for GDPR compliance';


--
-- Name: extract_book_dimensions("uuid", "jsonb"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."extract_book_dimensions"("book_uuid" "uuid", "dimensions_json" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    width_val NUMERIC;
    height_val NUMERIC;
    depth_val NUMERIC;
    weight_val NUMERIC;
    unit_val TEXT;
BEGIN
    -- Extract dimensions from JSON
    width_val := (dimensions_json->>'width')::NUMERIC;
    height_val := (dimensions_json->>'height')::NUMERIC;
    depth_val := (dimensions_json->>'depth')::NUMERIC;
    weight_val := (dimensions_json->>'weight')::NUMERIC;
    unit_val := dimensions_json->>'unit';
    
    -- Insert or update book dimensions
    INSERT INTO book_dimensions (
        book_id, width, height, depth, weight, unit, source
    ) VALUES (
        book_uuid, width_val, height_val, depth_val, weight_val, unit_val, 'isbndb'
    ) ON CONFLICT (book_id) DO UPDATE SET
        width = EXCLUDED.width,
        height = EXCLUDED.height,
        depth = EXCLUDED.depth,
        weight = EXCLUDED.weight,
        unit = EXCLUDED.unit,
        updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."extract_book_dimensions"("book_uuid" "uuid", "dimensions_json" "jsonb") OWNER TO "postgres";

--
-- Name: fix_missing_publisher_relationships(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."fix_missing_publisher_relationships"() RETURNS TABLE("book_id" "uuid", "book_title" "text", "action_taken" "text", "publisher_id" "uuid", "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    book_record RECORD;
    publisher_record RECORD;
    linked_count integer := 0;
    created_count integer := 0;
BEGIN
    -- First, try to link books to existing publishers by author name
    FOR book_record IN 
        SELECT b.id, b.title, b.author, b.publisher_id
        FROM "public"."books" b
        WHERE b.publisher_id IS NULL
        AND b.author IS NOT NULL
    LOOP
        -- Try to find existing publisher by author name
        SELECT p.id INTO publisher_record
        FROM "public"."publishers" p
        WHERE p.name ILIKE '%' || book_record.author || '%'
        OR book_record.author ILIKE '%' || p.name || '%'
        LIMIT 1;
        
        IF publisher_record.id IS NOT NULL THEN
            -- Link to existing publisher
            UPDATE "public"."books" 
            SET publisher_id = publisher_record.id
            WHERE id = book_record.id;
            
            linked_count := linked_count + 1;
            
            RETURN QUERY SELECT 
                book_record.id,
                book_record.title,
                'LINKED_TO_EXISTING'::text,
                publisher_record.id,
                'SUCCESS'::text;
        ELSE
            -- Create new publisher based on author
            INSERT INTO "public"."publishers" (name, description)
            VALUES (book_record.author || ' Publications', 'Auto-generated publisher for ' || book_record.author)
            RETURNING id INTO publisher_record;
            
            -- Link book to new publisher
            UPDATE "public"."books" 
            SET publisher_id = publisher_record.id
            WHERE id = book_record.id;
            
            created_count := created_count + 1;
            
            RETURN QUERY SELECT 
                book_record.id,
                book_record.title,
                'CREATED_NEW_PUBLISHER'::text,
                publisher_record.id,
                'SUCCESS'::text;
        END IF;
    END LOOP;
    
    -- Log the operation (only if security_audit_log table exists)
    BEGIN
        INSERT INTO "public"."security_audit_log" (
            action, 
            table_name, 
            new_values
        ) VALUES (
            'FIX_PUBLISHER_RELATIONSHIPS',
            'books_publishers',
            jsonb_build_object(
                'linked_count', linked_count,
                'created_count', created_count,
                'total_fixed', linked_count + created_count,
                'fix_type', 'missing_publisher_relationships'
            )
        );
    EXCEPTION WHEN OTHERS THEN
        -- Table doesn't exist, continue without logging
    END;
END;
$$;


ALTER FUNCTION "public"."fix_missing_publisher_relationships"() OWNER TO "postgres";

--
-- Name: FUNCTION "fix_missing_publisher_relationships"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."fix_missing_publisher_relationships"() IS 'Automatically fix missing publisher relationships';


--
-- Name: generate_data_health_report(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."generate_data_health_report"() RETURNS TABLE("report_section" "text", "metric_name" "text", "metric_value" "text", "status" "text", "recommendation" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Publisher relationship health
    RETURN QUERY SELECT 
        'Data Integrity'::text,
        'Books with missing publisher_id'::text,
        COUNT(*)::text,
        CASE WHEN COUNT(*) = 0 THEN 'GOOD' ELSE 'NEEDS_FIX' END,
        CASE WHEN COUNT(*) = 0 THEN 'All books have publishers' ELSE 'Run safe_fix_missing_publishers()' END
    FROM "public"."books" 
    WHERE publisher_id IS NULL;
    
    -- Orphaned records health
    RETURN QUERY SELECT 
        'Data Integrity'::text,
        'Orphaned reading_progress records'::text,
        COUNT(*)::text,
        CASE WHEN COUNT(*) = 0 THEN 'GOOD' ELSE 'NEEDS_CLEANUP' END,
        CASE WHEN COUNT(*) = 0 THEN 'No orphaned records' ELSE 'Run safe_cleanup_orphaned_records()' END
    FROM "public"."reading_progress" rp
    LEFT JOIN "public"."books" b ON rp.book_id = b.id
    WHERE b.id IS NULL;
    
    -- Overall data health
    RETURN QUERY SELECT 
        'System Health'::text,
        'Total books in system'::text,
        COUNT(*)::text,
        'INFO'::text,
        'System is operational'::text
    FROM "public"."books";
    
    -- Publisher distribution
    RETURN QUERY SELECT 
        'System Health'::text,
        'Total publishers in system'::text,
        COUNT(*)::text,
        'INFO'::text,
        'Publisher system is operational'::text
    FROM "public"."publishers";
END;
$$;


ALTER FUNCTION "public"."generate_data_health_report"() OWNER TO "postgres";

--
-- Name: FUNCTION "generate_data_health_report"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."generate_data_health_report"() IS 'Generate comprehensive data health report';


--
-- Name: generate_intelligent_content("text", "jsonb", "uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."generate_intelligent_content"("p_content_type" "text", "p_input_data" "jsonb", "p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("generated_content" "text", "confidence_score" numeric, "metadata" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_job_id UUID;
    v_result TEXT;
    v_confidence DECIMAL(5,4);
    v_metadata JSONB;
BEGIN
    -- Create content generation job
    INSERT INTO public.content_generation_jobs (
        content_type,
        input_parameters,
        created_by
    ) VALUES (
        p_content_type,
        p_input_data,
        p_user_id
    ) RETURNING id INTO v_job_id;
    
    -- Simulate AI content generation (replace with actual AI integration)
    SELECT 
        CASE p_content_type
            WHEN 'book_summary' THEN 'This book explores...'
            WHEN 'author_bio' THEN 'A distinguished author known for...'
            WHEN 'review_analysis' THEN 'Based on the review analysis...'
            ELSE 'Generated content based on input parameters.'
        END,
        0.85,
        jsonb_build_object('job_id', v_job_id, 'generation_method', 'ai_enhanced')
    INTO v_result, v_confidence, v_metadata;
    
    -- Update job status
    UPDATE public.content_generation_jobs 
    SET 
        generation_status = 'completed',
        generated_content = v_result,
        quality_score = v_confidence,
        completed_at = NOW()
    WHERE id = v_job_id;
    
    RETURN QUERY SELECT v_result, v_confidence, v_metadata;
END;
$$;


ALTER FUNCTION "public"."generate_intelligent_content"("p_content_type" "text", "p_input_data" "jsonb", "p_user_id" "uuid") OWNER TO "postgres";

--
-- Name: FUNCTION "generate_intelligent_content"("p_content_type" "text", "p_input_data" "jsonb", "p_user_id" "uuid"); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."generate_intelligent_content"("p_content_type" "text", "p_input_data" "jsonb", "p_user_id" "uuid") IS 'Generate intelligent content using AI';


--
-- Name: generate_monitoring_report(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."generate_monitoring_report"("p_days_back" integer DEFAULT 7) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_report "jsonb";
BEGIN
    SELECT "jsonb_build_object"(
        'report_generated_at', "now"(),
        'period_days', p_days_back,
        'user_activity_summary', (
            SELECT "jsonb_build_object"(
                'total_activities', COUNT(*),
                'unique_users', COUNT(DISTINCT "user_id"),
                'avg_activities_per_user', ROUND(AVG(activity_count), 2)
            )
            FROM (
                SELECT "user_id", COUNT(*) as activity_count
                FROM "public"."user_activity_log"
                WHERE "created_at" >= "now"() - (p_days_back || ' days')::interval
                GROUP BY "user_id"
            ) user_activities
        ),
        'system_health_summary', (
            SELECT "jsonb_build_object"(
                'total_checks', COUNT(*),
                'healthy_checks', COUNT(*) FILTER (WHERE "status" = 'healthy'),
                'warning_checks', COUNT(*) FILTER (WHERE "status" = 'warning'),
                'critical_checks', COUNT(*) FILTER (WHERE "status" = 'critical')
            )
            FROM "public"."system_health_checks"
            WHERE "checked_at" >= "now"() - (p_days_back || ' days')::interval
        ),
        'performance_summary', (
            SELECT "jsonb_build_object"(
                'avg_response_time', ROUND(AVG("metric_value"), 2),
                'max_response_time', MAX("metric_value"),
                'total_measurements', COUNT(*)
            )
            FROM "public"."performance_metrics"
            WHERE "metric_name" = 'response_time' 
            AND "recorded_at" >= "now"() - (p_days_back || ' days')::interval
        ),
        'book_popularity_summary', (
            SELECT "jsonb_build_object"(
                'total_books_tracked', COUNT(*),
                'avg_views_per_book', ROUND(AVG("views_count"), 2),
                'avg_rating', ROUND(AVG("avg_rating"), 2),
                'most_viewed_book', (
                    SELECT "title" FROM "public"."books" 
                    WHERE "id" = bpm."book_id" 
                    ORDER BY "views_count" DESC 
                    LIMIT 1
                )
            )
            FROM "public"."book_popularity_metrics" bpm
            WHERE "last_updated" >= "now"() - (p_days_back || ' days')::interval
        )
    ) INTO v_report;
    
    RETURN v_report;
END;
$$;


ALTER FUNCTION "public"."generate_monitoring_report"("p_days_back" integer) OWNER TO "postgres";

--
-- Name: FUNCTION "generate_monitoring_report"("p_days_back" integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."generate_monitoring_report"("p_days_back" integer) IS 'Generates comprehensive monitoring reports';


--
-- Name: generate_smart_notification("uuid", "text", "jsonb"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."generate_smart_notification"("p_user_id" "uuid", "p_notification_type" "text", "p_context_data" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_notification_id UUID;
    v_title TEXT;
    v_content TEXT;
    v_priority TEXT;
BEGIN
    -- Generate personalized notification content
    SELECT 
        CASE p_notification_type
            WHEN 'recommendation' THEN 'New Book Recommendation'
            WHEN 'reminder' THEN 'Reading Reminder'
            WHEN 'alert' THEN 'Important Update'
            ELSE 'Notification'
        END,
        CASE p_notification_type
            WHEN 'recommendation' THEN 'We found a book you might love!'
            WHEN 'reminder' THEN 'Time to continue your reading journey.'
            WHEN 'alert' THEN 'Important information for you.'
            ELSE 'You have a new notification.'
        END,
        CASE 
            WHEN p_notification_type = 'alert' THEN 'high'
            ELSE 'normal'
        END
    INTO v_title, v_content, v_priority;
    
    -- Create smart notification
    INSERT INTO public.smart_notifications (
        user_id,
        notification_type,
        notification_title,
        notification_content,
        priority_level,
        ai_generated,
        personalization_data
    ) VALUES (
        p_user_id,
        p_notification_type,
        v_title,
        v_content,
        v_priority,
        true,
        p_context_data
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;


ALTER FUNCTION "public"."generate_smart_notification"("p_user_id" "uuid", "p_notification_type" "text", "p_context_data" "jsonb") OWNER TO "postgres";

--
-- Name: FUNCTION "generate_smart_notification"("p_user_id" "uuid", "p_notification_type" "text", "p_context_data" "jsonb"); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."generate_smart_notification"("p_user_id" "uuid", "p_notification_type" "text", "p_context_data" "jsonb") IS 'Generate personalized smart notifications';


--
-- Name: generate_system_alerts_enhanced(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."generate_system_alerts_enhanced"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_alerts "jsonb" := '[]'::"jsonb";
    v_alert "jsonb";
    v_health_status "jsonb";
    v_data_quality "jsonb";
BEGIN
    -- Check system health
    v_health_status := "public"."comprehensive_system_health_check_enhanced"();
    
    IF (v_health_status->>'overall_status') = 'critical' THEN
        v_alert := "jsonb_build_object"(
            'alert_type', 'system_health_critical',
            'severity', 'critical',
            'message', 'System health check failed',
            'details', v_health_status
        );
        v_alerts := v_alerts || v_alert;
    END IF;
    
    -- Check data quality
    v_data_quality := "public"."check_data_quality_issues_enhanced"();
    
    IF (v_data_quality->>'total_issues')::integer > 0 THEN
        v_alert := "jsonb_build_object"(
            'alert_type', 'data_quality_issues',
            'severity', 'warning',
            'message', 'Data quality issues detected',
            'details', v_data_quality
        );
        v_alerts := v_alerts || v_alert;
    END IF;
    
    -- Check performance
    IF EXISTS (
        SELECT 1 FROM "public"."performance_metrics" 
        WHERE "metric_name" = 'response_time' 
        AND "metric_value" > 5000
        AND "recorded_at" >= "now"() - INTERVAL '1 hour'
    ) THEN
        v_alert := "jsonb_build_object"(
            'alert_type', 'performance_degradation',
            'severity', 'warning',
            'message', 'High response times detected',
            'details', "jsonb_build_object"('timeframe', 'last_hour')
        );
        v_alerts := v_alerts || v_alert;
    END IF;
    
    RETURN "jsonb_build_object"(
        'alerts', v_alerts,
        'total_alerts', array_length(v_alerts, 1),
        'alert_timestamp', "now"()
    );
END;
$$;


ALTER FUNCTION "public"."generate_system_alerts_enhanced"() OWNER TO "postgres";

--
-- Name: FUNCTION "generate_system_alerts_enhanced"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."generate_system_alerts_enhanced"() IS 'Enhanced system alert generation';


--
-- Name: get_ai_book_recommendations("uuid", integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_ai_book_recommendations"("p_user_id" "uuid", "p_limit" integer DEFAULT 10) RETURNS TABLE("book_id" "uuid", "title" "text", "author_name" "text", "recommendation_score" numeric, "recommendation_reason" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id as book_id,
        b.title,
        a.name as author_name,
        COALESCE(pr.recommendation_score, 0.5) as recommendation_score,
        pr.recommendation_reason
    FROM public.books b
    LEFT JOIN public.book_authors ba ON b.id = ba.book_id
    LEFT JOIN public.authors a ON ba.author_id = a.id
    LEFT JOIN public.personalized_recommendations pr ON b.id = pr.item_id AND pr.user_id = p_user_id
    WHERE pr.recommendation_type = 'book'
    ORDER BY pr.recommendation_score DESC NULLS LAST
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_ai_book_recommendations"("p_user_id" "uuid", "p_limit" integer) OWNER TO "postgres";

--
-- Name: FUNCTION "get_ai_book_recommendations"("p_user_id" "uuid", "p_limit" integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."get_ai_book_recommendations"("p_user_id" "uuid", "p_limit" integer) IS 'Get AI-powered book recommendations for users';


--
-- Name: get_data_lineage("text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_data_lineage"("p_table_name" "text") RETURNS TABLE("source_table" "text", "source_column" "text", "target_table" "text", "target_column" "text", "transformation_type" "text", "data_flow_description" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dl."source_table",
        dl."source_column",
        dl."target_table",
        dl."target_column",
        dl."transformation_type",
        dl."data_flow_description"
    FROM "public"."enterprise_data_lineage" dl
    WHERE dl."source_table" = p_table_name OR dl."target_table" = p_table_name
    ORDER BY dl."source_table", dl."target_table";
END;
$$;


ALTER FUNCTION "public"."get_data_lineage"("p_table_name" "text") OWNER TO "postgres";

--
-- Name: FUNCTION "get_data_lineage"("p_table_name" "text"); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."get_data_lineage"("p_table_name" "text") IS 'Gets data lineage information for tables';


--
-- Name: get_data_quality_report("text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_data_quality_report"("p_table_name" "text" DEFAULT NULL::"text") RETURNS TABLE("table_name" "text", "total_rules" integer, "passed_rules" integer, "failed_rules" integer, "critical_issues" integer, "overall_score" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    rule_count integer;
    passed_count integer;
    failed_count integer;
    critical_count integer;
BEGIN
    -- Get rule counts
    SELECT COUNT(*), 
           COUNT(*) FILTER (WHERE validation_result = 'PASS'),
           COUNT(*) FILTER (WHERE validation_result = 'FAIL'),
           COUNT(*) FILTER (WHERE validation_result = 'FAIL' AND severity = 'CRITICAL')
    INTO rule_count, passed_count, failed_count, critical_count
    FROM "public"."validate_enterprise_data_quality"(p_table_name);
    
    RETURN QUERY SELECT 
        COALESCE(p_table_name, 'ALL_TABLES'),
        rule_count,
        passed_count,
        failed_count,
        critical_count,
        CASE 
            WHEN rule_count = 0 THEN 100.0
            ELSE ROUND((passed_count::numeric / rule_count::numeric) * 100, 2)
        END;
END;
$$;


ALTER FUNCTION "public"."get_data_quality_report"("p_table_name" "text") OWNER TO "postgres";

--
-- Name: FUNCTION "get_data_quality_report"("p_table_name" "text"); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."get_data_quality_report"("p_table_name" "text") IS 'Generates comprehensive data quality report';


--
-- Name: get_entity_images("text", "uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_entity_images"("p_entity_type" "text", "p_entity_id" "uuid") RETURNS TABLE("image_id" "uuid", "image_url" "text", "thumbnail_url" "text", "alt_text" "text", "file_size" integer, "created_at" timestamp with time zone, "album_name" "text", "album_id" "uuid")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id as image_id,
        i.url as image_url,
        i.thumbnail_url,
        i.alt_text,
        i.file_size,
        i.created_at,
        pa.name as album_name,
        pa.id as album_id
    FROM public.images i
    JOIN public.album_images ai ON i.id = ai.image_id
    JOIN public.photo_albums pa ON ai.album_id = pa.id
    WHERE pa.entity_type = p_entity_type
    AND pa.entity_id = p_entity_id
    AND i.deleted_at IS NULL
    ORDER BY i.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_entity_images"("p_entity_type" "text", "p_entity_id" "uuid") OWNER TO "postgres";

--
-- Name: FUNCTION "get_entity_images"("p_entity_type" "text", "p_entity_id" "uuid"); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."get_entity_images"("p_entity_type" "text", "p_entity_id" "uuid") IS 'Get all images for a specific entity type and ID';


--
-- Name: get_performance_recommendations(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_performance_recommendations"() RETURNS TABLE("recommendation_type" "text", "priority" "text", "description" "text", "estimated_impact" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check for missing indexes on frequently queried columns
    RETURN QUERY
    SELECT 
        'Missing Indexes'::text,
        'HIGH'::text,
        'Add indexes on frequently queried columns'::text,
        '20-50% query improvement'::text
    WHERE EXISTS (
        SELECT 1 FROM pg_stat_user_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('reading_progress', 'books', 'follows')
    );
    
    -- Check for slow queries
    RETURN QUERY
    SELECT 
        'Slow Queries'::text,
        'MEDIUM'::text,
        'Optimize queries taking more than 500ms'::text,
        '10-30% performance improvement'::text
    WHERE EXISTS (
        SELECT 1 FROM pg_stat_statements 
        WHERE mean_time > 500
    );
    
    -- Check for table bloat
    RETURN QUERY
    SELECT 
        'Table Bloat'::text,
        'LOW'::text,
        'Run VACUUM on tables with high dead tuple ratio'::text,
        '5-15% space and performance improvement'::text
    WHERE EXISTS (
        SELECT 1 FROM pg_stat_user_tables 
        WHERE n_dead_tup > 1000
    );
    
    -- Check for materialized view refresh
    RETURN QUERY
    SELECT 
        'Materialized Views'::text,
        'MEDIUM'::text,
        'Refresh materialized views for better performance'::text,
        '50-80% improvement for summary queries'::text
    WHERE EXISTS (
        SELECT 1 FROM pg_matviews 
        WHERE schemaname = 'public'
    );
END;
$$;


ALTER FUNCTION "public"."get_performance_recommendations"() OWNER TO "postgres";

--
-- Name: FUNCTION "get_performance_recommendations"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."get_performance_recommendations"() IS 'Get performance optimization recommendations';


--
-- Name: get_privacy_audit_summary(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_privacy_audit_summary"("days_back" integer DEFAULT 30) RETURNS TABLE("action" "text", "count" bigint, "last_occurrence" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pal.action,
        COUNT(*) as count,
        MAX(pal.created_at) as last_occurrence
    FROM "public"."privacy_audit_log" pal
    WHERE pal.user_id = auth.uid()
    AND pal.created_at >= now() - (days_back || ' days')::interval
    GROUP BY pal.action
    ORDER BY count DESC;
END;
$$;


ALTER FUNCTION "public"."get_privacy_audit_summary"("days_back" integer) OWNER TO "postgres";

--
-- Name: FUNCTION "get_privacy_audit_summary"("days_back" integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."get_privacy_audit_summary"("days_back" integer) IS 'Get summary of privacy audit actions for the current user';


--
-- Name: get_user_feed_activities("uuid", integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "user_id" "uuid", "activity_type" "text", "entity_type" "text", "entity_id" "text", "is_public" boolean, "metadata" "jsonb", "created_at" timestamp with time zone, "user_name" "text", "user_avatar_url" "text", "like_count" bigint, "comment_count" bigint, "is_liked" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Function implementation here
    RETURN QUERY SELECT * FROM public.activities WHERE user_id = p_user_id LIMIT p_limit OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";

--
-- Name: get_user_privacy_settings("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_user_privacy_settings"("user_id_param" "uuid" DEFAULT "auth"."uid"()) RETURNS TABLE("default_privacy_level" "text", "allow_friends_to_see_reading" boolean, "allow_followers_to_see_reading" boolean, "allow_public_reading_profile" boolean, "show_reading_stats_publicly" boolean, "show_currently_reading_publicly" boolean, "show_reading_history_publicly" boolean, "show_reading_goals_publicly" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ups.default_privacy_level,
        ups.allow_friends_to_see_reading,
        ups.allow_followers_to_see_reading,
        ups.allow_public_reading_profile,
        ups.show_reading_stats_publicly,
        ups.show_currently_reading_publicly,
        ups.show_reading_history_publicly,
        ups.show_reading_goals_publicly
    FROM "public"."user_privacy_settings" ups
    WHERE ups.user_id = user_id_param;
END;
$$;


ALTER FUNCTION "public"."get_user_privacy_settings"("user_id_param" "uuid") OWNER TO "postgres";

--
-- Name: grant_reading_permission("uuid", "text", timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."grant_reading_permission"("target_user_id" "uuid", "permission_type" "text" DEFAULT 'view_reading_progress'::"text", "expires_at" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Insert or update permission
    INSERT INTO "public"."custom_permissions" (user_id, target_user_id, permission_type, expires_at)
    VALUES (auth.uid(), target_user_id, permission_type, expires_at)
    ON CONFLICT (user_id, target_user_id, permission_type) 
    DO UPDATE SET 
        expires_at = EXCLUDED.expires_at,
        updated_at = now();

    -- Log the action
    INSERT INTO "public"."privacy_audit_log" (user_id, action, target_user_id, permission_type, new_value)
    VALUES (auth.uid(), 'grant_permission', target_user_id, permission_type, 
            jsonb_build_object('permission_type', permission_type, 'expires_at', expires_at));

    RETURN true;
END;
$$;


ALTER FUNCTION "public"."grant_reading_permission"("target_user_id" "uuid", "permission_type" "text", "expires_at" timestamp with time zone) OWNER TO "postgres";

--
-- Name: FUNCTION "grant_reading_permission"("target_user_id" "uuid", "permission_type" "text", "expires_at" timestamp with time zone); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."grant_reading_permission"("target_user_id" "uuid", "permission_type" "text", "expires_at" timestamp with time zone) IS 'Grant custom permission to view reading progress';


--
-- Name: handle_album_privacy_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."handle_album_privacy_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- When album privacy changes, update related feed entries
    IF OLD.is_public != NEW.is_public THEN
        IF NEW.is_public = true THEN
            -- Album became public, create feed entry
            INSERT INTO feed_entries (
                user_id, 
                activity_type, 
                entity_type, 
                entity_id, 
                visibility,
                metadata
            ) VALUES (
                NEW.owner_id,
                'album_made_public',
                'photo_album',
                NEW.id::text,
                'public',
                jsonb_build_object('album_name', NEW.name, 'album_id', NEW.id)
            );
        ELSE
            -- Album became private, remove public feed entries
            DELETE FROM feed_entries 
            WHERE entity_type = 'photo_album' 
            AND entity_id = NEW.id::text 
            AND visibility = 'public';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_album_privacy_update"() OWNER TO "postgres";

--
-- Name: handle_privacy_level_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."handle_privacy_level_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update boolean flags based on privacy_level
    NEW.allow_friends := (NEW.privacy_level = 'friends');
    NEW.allow_followers := (NEW.privacy_level = 'followers');
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_privacy_level_update"() OWNER TO "postgres";

--
-- Name: handle_public_album_creation(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."handle_public_album_creation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- When a public album is created, create a feed entry
    IF NEW.is_public = true AND OLD.is_public = false THEN
        INSERT INTO feed_entries (
            user_id, 
            activity_type, 
            entity_type, 
            entity_id, 
            visibility,
            metadata
        ) VALUES (
            NEW.owner_id,
            'album_created',
            'photo_album',
            NEW.id::text,
            'public',
            jsonb_build_object('album_name', NEW.name, 'album_id', NEW.id)
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_public_album_creation"() OWNER TO "postgres";

--
-- Name: initialize_user_privacy_settings(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."initialize_user_privacy_settings"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Create default privacy settings for new users
    INSERT INTO "public"."user_privacy_settings" (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."initialize_user_privacy_settings"() OWNER TO "postgres";

--
-- Name: insert_follow_record("uuid", "uuid", "uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."insert_follow_record"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") RETURNS TABLE("success" boolean, "error_message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check if follow already exists
  IF EXISTS (
    SELECT 1 FROM public.follows 
    WHERE follower_id = p_follower_id 
    AND following_id = p_following_id
    AND target_type_id = p_target_type_id
  ) THEN
    RETURN QUERY SELECT FALSE, 'Already following this entity';
    RETURN;
  END IF;

  -- Insert new follow record
  INSERT INTO public.follows (follower_id, following_id, target_type_id)
  VALUES (p_follower_id, p_following_id, p_target_type_id);

  RETURN QUERY SELECT TRUE, '';
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, SQLERRM;
END;
$$;


ALTER FUNCTION "public"."insert_follow_record"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") OWNER TO "postgres";

--
-- Name: log_sensitive_operation_enhanced("text", "text", "uuid", "uuid", "jsonb"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."log_sensitive_operation_enhanced"("p_operation_type" "text", "p_table_name" "text", "p_record_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"(), "p_details" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_audit_id "uuid";
BEGIN
    INSERT INTO "public"."privacy_audit_log" (
        "user_id", "action", "entity_type", "entity_id", "metadata"
    ) VALUES (
        p_user_id, p_operation_type, p_table_name, p_record_id::"text", p_details
    ) RETURNING "id" INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$;


ALTER FUNCTION "public"."log_sensitive_operation_enhanced"("p_operation_type" "text", "p_table_name" "text", "p_record_id" "uuid", "p_user_id" "uuid", "p_details" "jsonb") OWNER TO "postgres";

--
-- Name: FUNCTION "log_sensitive_operation_enhanced"("p_operation_type" "text", "p_table_name" "text", "p_record_id" "uuid", "p_user_id" "uuid", "p_details" "jsonb"); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."log_sensitive_operation_enhanced"("p_operation_type" "text", "p_table_name" "text", "p_record_id" "uuid", "p_user_id" "uuid", "p_details" "jsonb") IS 'Enhanced logging for sensitive operations audit trail';


--
-- Name: log_user_activity("uuid", "text", "jsonb", "inet", "text", "text", integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."log_user_activity"("p_user_id" "uuid", "p_activity_type" "text", "p_activity_details" "jsonb" DEFAULT NULL::"jsonb", "p_ip_address" "inet" DEFAULT NULL::"inet", "p_user_agent" "text" DEFAULT NULL::"text", "p_session_id" "text" DEFAULT NULL::"text", "p_response_time_ms" integer DEFAULT NULL::integer, "p_status_code" integer DEFAULT NULL::integer) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_activity_id "uuid";
BEGIN
    INSERT INTO "public"."user_activity_log" (
        "user_id", "activity_type", "activity_details", "ip_address", 
        "user_agent", "session_id", "response_time_ms", "status_code"
    ) VALUES (
        p_user_id, p_activity_type, p_activity_details, p_ip_address,
        p_user_agent, p_session_id, p_response_time_ms, p_status_code
    ) RETURNING "id" INTO v_activity_id;
    
    RETURN v_activity_id;
END;
$$;


ALTER FUNCTION "public"."log_user_activity"("p_user_id" "uuid", "p_activity_type" "text", "p_activity_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" "text", "p_response_time_ms" integer, "p_status_code" integer) OWNER TO "postgres";

--
-- Name: FUNCTION "log_user_activity"("p_user_id" "uuid", "p_activity_type" "text", "p_activity_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" "text", "p_response_time_ms" integer, "p_status_code" integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."log_user_activity"("p_user_id" "uuid", "p_activity_type" "text", "p_activity_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" "text", "p_response_time_ms" integer, "p_status_code" integer) IS 'Records user activity for analytics and monitoring';


--
-- Name: map_progress_to_reading_status("text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."map_progress_to_reading_status"("status" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
    RETURN CASE status
        WHEN 'not_started' THEN 'want_to_read'
        WHEN 'in_progress' THEN 'currently_reading'
        WHEN 'completed' THEN 'read'
        WHEN 'on_hold' THEN 'on_hold'
        WHEN 'abandoned' THEN 'abandoned'
        ELSE 'want_to_read'
    END;
END;
$$;


ALTER FUNCTION "public"."map_progress_to_reading_status"("status" "text") OWNER TO "postgres";

--
-- Name: map_reading_status_to_progress("text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."map_reading_status_to_progress"("status" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
    RETURN CASE status
        WHEN 'want_to_read' THEN 'not_started'
        WHEN 'currently_reading' THEN 'in_progress'
        WHEN 'read' THEN 'completed'
        WHEN 'on_hold' THEN 'on_hold'
        WHEN 'abandoned' THEN 'abandoned'
        WHEN 'not_started' THEN 'not_started'
        WHEN 'in_progress' THEN 'in_progress'
        WHEN 'completed' THEN 'completed'
        ELSE 'not_started'
    END;
END;
$$;


ALTER FUNCTION "public"."map_reading_status_to_progress"("status" "text") OWNER TO "postgres";

--
-- Name: mask_sensitive_data("text", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mask_sensitive_data"("input_text" "text", "mask_type" "text" DEFAULT 'PARTIAL'::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    CASE mask_type
        WHEN 'FULL' THEN
            RETURN '***MASKED***';
        WHEN 'PARTIAL' THEN
            IF length(input_text) <= 3 THEN
                RETURN '***';
            ELSE
                RETURN left(input_text, 1) || repeat('*', length(input_text) - 2) || right(input_text, 1);
            END IF;
        WHEN 'EMAIL' THEN
            IF position('@' in input_text) > 0 THEN
                RETURN left(input_text, 1) || '***' || '@' || split_part(input_text, '@', 2);
            ELSE
                RETURN '***@***';
            END IF;
        ELSE
            RETURN input_text;
    END CASE;
END;
$$;


ALTER FUNCTION "public"."mask_sensitive_data"("input_text" "text", "mask_type" "text") OWNER TO "postgres";

--
-- Name: FUNCTION "mask_sensitive_data"("input_text" "text", "mask_type" "text"); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."mask_sensitive_data"("input_text" "text", "mask_type" "text") IS 'Mask sensitive data for privacy compliance';


--
-- Name: monitor_data_health(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."monitor_data_health"() RETURNS TABLE("health_metric" "text", "current_value" bigint, "threshold_value" bigint, "status" "text", "last_check" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Monitor books with missing publisher_id
    RETURN QUERY
    SELECT 
        'Books with missing publisher_id'::text,
        COUNT(*)::bigint,
        0::bigint,
        CASE 
            WHEN COUNT(*) = 0 THEN 'GOOD'
            ELSE 'CRITICAL'
        END,
        now()
    FROM "public"."books" 
    WHERE publisher_id IS NULL;
    
    -- Monitor orphaned reading progress records
    RETURN QUERY
    SELECT 
        'Orphaned reading progress records'::text,
        COUNT(*)::bigint,
        0::bigint,
        CASE 
            WHEN COUNT(*) = 0 THEN 'GOOD'
            ELSE 'WARNING'
        END,
        now()
    FROM "public"."reading_progress" rp
    LEFT JOIN "public"."books" b ON rp.book_id = b.id
    WHERE b.id IS NULL;
    
    -- Monitor orphaned follows records
    RETURN QUERY
    SELECT 
        'Orphaned follows records'::text,
        COUNT(*)::bigint,
        0::bigint,
        CASE 
            WHEN COUNT(*) = 0 THEN 'GOOD'
            ELSE 'WARNING'
        END,
        now()
    FROM "public"."follows" f
    LEFT JOIN "auth"."users" u ON f.follower_id = u.id
    WHERE u.id IS NULL;
    
    -- Monitor data consistency (FIXED: Use table alias to avoid ambiguity)
    RETURN QUERY
    SELECT 
        'Inconsistent status values'::text,
        COUNT(*)::bigint,
        0::bigint,
        CASE 
            WHEN COUNT(*) = 0 THEN 'GOOD'
            ELSE 'WARNING'
        END,
        now()
    FROM "public"."reading_progress" rp
    WHERE rp.status NOT IN ('not_started', 'in_progress', 'completed', 'on_hold', 'abandoned');
END;
$$;


ALTER FUNCTION "public"."monitor_data_health"() OWNER TO "postgres";

--
-- Name: FUNCTION "monitor_data_health"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."monitor_data_health"() IS 'Monitor data health metrics continuously';


--
-- Name: monitor_database_performance_enhanced(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."monitor_database_performance_enhanced"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_performance_data "jsonb";
BEGIN
    SELECT "jsonb_build_object"(
        'database_size_mb', (
            SELECT ROUND(SUM(pg_total_relation_size(c.oid)) / 1024.0 / 1024.0, 2)
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
        ),
        'active_connections', (
            SELECT COUNT(*) 
            FROM pg_stat_activity 
            WHERE state = 'active'
        ),
        'cache_hit_ratio', (
            SELECT ROUND(
                (sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read))) * 100, 2
            )
            FROM pg_statio_user_tables
        ),
        'slow_queries', (
            SELECT COUNT(*) 
            FROM pg_stat_statements 
            WHERE mean_time > 1000
        ),
        'monitoring_timestamp', "now"()
    ) INTO v_performance_data;
    
    -- Record performance metrics
    PERFORM "public"."record_performance_metric"(
        'database_size_mb', 
        (v_performance_data->>'database_size_mb')::numeric,
        'MB', 'database'
    );
    
    PERFORM "public"."record_performance_metric"(
        'cache_hit_ratio', 
        (v_performance_data->>'cache_hit_ratio')::numeric,
        '%', 'database'
    );
    
    RETURN v_performance_data;
END;
$$;


ALTER FUNCTION "public"."monitor_database_performance_enhanced"() OWNER TO "postgres";

--
-- Name: FUNCTION "monitor_database_performance_enhanced"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."monitor_database_performance_enhanced"() IS 'Enhanced database performance monitoring';


--
-- Name: monitor_entity_storage_usage(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."monitor_entity_storage_usage"() RETURNS TABLE("entity_type" "text", "entity_id" "uuid", "storage_usage_mb" numeric, "image_count" bigint, "warning_level" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pa.entity_type,
        pa.entity_id,
        ROUND(SUM(i.file_size) / 1024.0 / 1024.0, 2) as storage_usage_mb,
        COUNT(i.id) as image_count,
        CASE 
            WHEN SUM(i.file_size) > 100 * 1024 * 1024 THEN 'CRITICAL' -- 100MB
            WHEN SUM(i.file_size) > 50 * 1024 * 1024 THEN 'WARNING'   -- 50MB
            WHEN SUM(i.file_size) > 10 * 1024 * 1024 THEN 'INFO'      -- 10MB
            ELSE 'OK'
        END as warning_level
    FROM public.images i
    JOIN public.album_images ai ON i.id = ai.image_id
    JOIN public.photo_albums pa ON ai.album_id = pa.id
    WHERE i.deleted_at IS NULL
    GROUP BY pa.entity_type, pa.entity_id
    HAVING SUM(i.file_size) > 5 * 1024 * 1024 -- Only show entities using >5MB
    ORDER BY storage_usage_mb DESC;
END;
$$;


ALTER FUNCTION "public"."monitor_entity_storage_usage"() OWNER TO "postgres";

--
-- Name: FUNCTION "monitor_entity_storage_usage"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."monitor_entity_storage_usage"() IS 'Monitor storage usage with warning levels';


--
-- Name: monitor_query_performance(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."monitor_query_performance"() RETURNS TABLE("query_pattern" "text", "avg_execution_time" numeric, "total_calls" bigint, "performance_status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN query LIKE '%reading_progress%' THEN 'Reading Progress Queries'
            WHEN query LIKE '%books%' AND query LIKE '%publisher%' THEN 'Book-Publisher Queries'
            WHEN query LIKE '%follows%' THEN 'Follow Queries'
            WHEN query LIKE '%auth.users%' THEN 'User Authentication Queries'
            ELSE 'Other Queries'
        END as query_pattern,
        AVG(mean_time) as avg_execution_time,
        SUM(calls) as total_calls,
        CASE 
            WHEN AVG(mean_time) > 1000 THEN 'CRITICAL'
            WHEN AVG(mean_time) > 500 THEN 'WARNING'
            WHEN AVG(mean_time) > 100 THEN 'ATTENTION'
            ELSE 'GOOD'
        END as performance_status
    FROM pg_stat_statements 
    WHERE query LIKE '%public%'
    GROUP BY 
        CASE 
            WHEN query LIKE '%reading_progress%' THEN 'Reading Progress Queries'
            WHEN query LIKE '%books%' AND query LIKE '%publisher%' THEN 'Book-Publisher Queries'
            WHEN query LIKE '%follows%' THEN 'Follow Queries'
            WHEN query LIKE '%auth.users%' THEN 'User Authentication Queries'
            ELSE 'Other Queries'
        END
    ORDER BY avg_execution_time DESC;
END;
$$;


ALTER FUNCTION "public"."monitor_query_performance"() OWNER TO "postgres";

--
-- Name: FUNCTION "monitor_query_performance"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."monitor_query_performance"() IS 'Monitor query performance patterns';


--
-- Name: perform_database_maintenance_enhanced(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."perform_database_maintenance_enhanced"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_maintenance_result "jsonb";
    v_start_time timestamp with time zone := "now"();
    v_operations_completed integer := 0;
    v_errors "text"[] := '{}';
BEGIN
    -- Clean up old monitoring data
    BEGIN
        PERFORM "public"."cleanup_old_monitoring_data"(90);
        v_operations_completed := v_operations_completed + 1;
    EXCEPTION WHEN OTHERS THEN
        v_errors := array_append(v_errors, 'Failed to cleanup monitoring data: ' || SQLERRM);
    END;
    
    -- Update book popularity metrics for all books
    BEGIN
        PERFORM "public"."update_book_popularity_metrics"(b."id")
        FROM "public"."books" b
        WHERE b."id" IN (
            SELECT DISTINCT "book_id" 
            FROM "public"."book_views" 
            WHERE "created_at" >= "now"() - INTERVAL '7 days'
        );
        v_operations_completed := v_operations_completed + 1;
    EXCEPTION WHEN OTHERS THEN
        v_errors := array_append(v_errors, 'Failed to update book popularity: ' || SQLERRM);
    END;
    
    -- Analyze tables for query optimization
    BEGIN
        ANALYZE "public"."books";
        ANALYZE "public"."book_reviews";
        ANALYZE "public"."reading_progress";
        ANALYZE "public"."user_activity_log";
        v_operations_completed := v_operations_completed + 1;
    EXCEPTION WHEN OTHERS THEN
        v_errors := array_append(v_errors, 'Failed to analyze tables: ' || SQLERRM);
    END;
    
    -- Build maintenance result
    v_maintenance_result := "jsonb_build_object"(
        'maintenance_started_at', v_start_time,
        'maintenance_completed_at', "now"(),
        'operations_completed', v_operations_completed,
        'errors', v_errors,
        'duration_seconds', EXTRACT(EPOCH FROM ("now"() - v_start_time))
    );
    
    RETURN v_maintenance_result;
END;
$$;


ALTER FUNCTION "public"."perform_database_maintenance_enhanced"() OWNER TO "postgres";

--
-- Name: FUNCTION "perform_database_maintenance_enhanced"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."perform_database_maintenance_enhanced"() IS 'Enhanced automated database maintenance tasks';


--
-- Name: perform_system_health_check("text", "text", "jsonb", integer, "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."perform_system_health_check"("p_check_name" "text", "p_status" "text", "p_details" "jsonb" DEFAULT NULL::"jsonb", "p_response_time_ms" integer DEFAULT NULL::integer, "p_error_message" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_check_id "uuid";
BEGIN
    INSERT INTO "public"."system_health_checks" (
        "check_name", "status", "details", "response_time_ms", "error_message"
    ) VALUES (
        p_check_name, p_status, p_details, p_response_time_ms, p_error_message
    ) RETURNING "id" INTO v_check_id;
    
    RETURN v_check_id;
END;
$$;


ALTER FUNCTION "public"."perform_system_health_check"("p_check_name" "text", "p_status" "text", "p_details" "jsonb", "p_response_time_ms" integer, "p_error_message" "text") OWNER TO "postgres";

--
-- Name: FUNCTION "perform_system_health_check"("p_check_name" "text", "p_status" "text", "p_details" "jsonb", "p_response_time_ms" integer, "p_error_message" "text"); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."perform_system_health_check"("p_check_name" "text", "p_status" "text", "p_details" "jsonb", "p_response_time_ms" integer, "p_error_message" "text") IS 'Performs and records system health checks';


--
-- Name: populate_album_images_entity_context(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."populate_album_images_entity_context"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update album_images with entity context from photo_albums
    UPDATE public.album_images 
    SET 
        entity_type_id = (
            SELECT et.id 
            FROM public.entity_types et 
            WHERE et.entity_category = pa.entity_type
            LIMIT 1
        ),
        entity_id = pa.entity_id
    FROM public.photo_albums pa
    WHERE album_images.album_id = pa.id
    AND pa.entity_type IS NOT NULL
    AND pa.entity_id IS NOT NULL;
    
    RAISE NOTICE 'Populated entity context for album_images';
END;
$$;


ALTER FUNCTION "public"."populate_album_images_entity_context"() OWNER TO "postgres";

--
-- Name: populate_dewey_decimal_classifications(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."populate_dewey_decimal_classifications"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Insert major Dewey Decimal categories (simplified version)
    INSERT INTO dewey_decimal_classifications (code, description, level) VALUES
    ('000', 'Computer science, information & general works', 1),
    ('100', 'Philosophy & psychology', 1),
    ('200', 'Religion', 1),
    ('300', 'Social sciences', 1),
    ('400', 'Language', 1),
    ('500', 'Pure Science', 1),
    ('600', 'Technology', 1),
    ('700', 'Arts & recreation', 1),
    ('800', 'Literature', 1),
    ('900', 'History & geography', 1)
    ON CONFLICT (code) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."populate_dewey_decimal_classifications"() OWNER TO "postgres";

--
-- Name: populate_images_entity_type_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."populate_images_entity_type_id"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update images with entity_type_id from album_images
    UPDATE public.images 
    SET entity_type_id = ai.entity_type_id
    FROM public.album_images ai
    WHERE images.id = ai.image_id
    AND ai.entity_type_id IS NOT NULL;
    
    RAISE NOTICE 'Populated entity_type_id for images';
END;
$$;


ALTER FUNCTION "public"."populate_images_entity_type_id"() OWNER TO "postgres";

--
-- Name: process_complete_isbndb_book_data("uuid", "jsonb"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."process_complete_isbndb_book_data"("book_uuid" "uuid", "isbndb_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    excerpt_text TEXT;
    reviews_array JSONB;
    review_record JSONB;
    dewey_array TEXT[];
    dimensions_json JSONB;
    other_isbns_json JSONB;
    related_json JSONB;
BEGIN
    -- Extract data from ISBNdb response
    excerpt_text := isbndb_data->>'excerpt';
    reviews_array := isbndb_data->'reviews';
    dewey_array := ARRAY(SELECT jsonb_array_elements_text(isbndb_data->'dewey_decimal'));
    dimensions_json := isbndb_data->'dimensions_structured';
    other_isbns_json := isbndb_data->'other_isbns';
    related_json := isbndb_data->'related';
    
    -- Process excerpt
    IF excerpt_text IS NOT NULL AND length(trim(excerpt_text)) > 0 THEN
        INSERT INTO book_excerpts (book_id, excerpt_text, excerpt_type, excerpt_source)
        VALUES (book_uuid, excerpt_text, 'isbndb', 'isbndb')
        ON CONFLICT (book_id, excerpt_type) DO UPDATE SET
            excerpt_text = EXCLUDED.excerpt_text,
            updated_at = NOW();
    END IF;
    
    -- Process reviews
    IF reviews_array IS NOT NULL AND jsonb_array_length(reviews_array) > 0 THEN
        -- Clear existing reviews
        DELETE FROM book_reviews_isbndb WHERE book_id = book_uuid;
        
        -- Insert new reviews
        FOR review_record IN SELECT * FROM jsonb_array_elements(reviews_array)
        LOOP
            INSERT INTO book_reviews_isbndb (book_id, review_text, review_source)
            VALUES (book_uuid, review_record::TEXT, 'isbndb');
        END LOOP;
    END IF;
    
    -- Process Dewey Decimal classifications
    PERFORM process_dewey_decimal_classifications(book_uuid, dewey_array);
    
    -- Process structured dimensions
    PERFORM extract_book_dimensions(book_uuid, dimensions_json);
    
    -- Process other ISBNs
    PERFORM process_other_isbns(book_uuid, other_isbns_json);
    
    -- Process related books
    PERFORM process_related_books(book_uuid, related_json);
    
    -- Update book record with metadata
    UPDATE books SET
        isbndb_last_updated = NOW(),
        isbndb_data_version = '2.6.0',
        raw_isbndb_data = isbndb_data
    WHERE id = book_uuid;
END;
$$;


ALTER FUNCTION "public"."process_complete_isbndb_book_data"("book_uuid" "uuid", "isbndb_data" "jsonb") OWNER TO "postgres";

--
-- Name: process_dewey_decimal_classifications("uuid", "text"[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."process_dewey_decimal_classifications"("book_uuid" "uuid", "dewey_array" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    dewey_code TEXT;
    dewey_id UUID;
BEGIN
    IF dewey_array IS NULL OR array_length(dewey_array, 1) IS NULL THEN
        RETURN;
    END IF;
    
    -- Clear existing classifications for this book
    DELETE FROM book_dewey_classifications WHERE book_id = book_uuid;
    
    -- Process each Dewey Decimal code
    FOREACH dewey_code IN ARRAY dewey_array
    LOOP
        -- Try to find existing classification
        SELECT id INTO dewey_id FROM dewey_decimal_classifications WHERE code = dewey_code;
        
        -- If not found, create a basic entry
        IF dewey_id IS NULL THEN
            INSERT INTO dewey_decimal_classifications (code, description, level)
            VALUES (dewey_code, 'Dewey Decimal Classification: ' || dewey_code, 1)
            RETURNING id INTO dewey_id;
        END IF;
        
        -- Link book to classification
        INSERT INTO book_dewey_classifications (book_id, dewey_id)
        VALUES (book_uuid, dewey_id);
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."process_dewey_decimal_classifications"("book_uuid" "uuid", "dewey_array" "text"[]) OWNER TO "postgres";

--
-- Name: process_other_isbns("uuid", "jsonb"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."process_other_isbns"("book_uuid" "uuid", "other_isbns_json" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    isbn_record JSONB;
    isbn_text TEXT;
    binding_type TEXT;
BEGIN
    IF other_isbns_json IS NULL OR jsonb_array_length(other_isbns_json) = 0 THEN
        RETURN;
    END IF;
    
    -- Clear existing ISBN variants for this book
    DELETE FROM book_isbn_variants WHERE book_id = book_uuid;
    
    -- Process each ISBN record
    FOR isbn_record IN SELECT * FROM jsonb_array_elements(other_isbns_json)
    LOOP
        isbn_text := isbn_record->>'isbn';
        binding_type := isbn_record->>'binding';
        
        -- Determine ISBN type
        INSERT INTO book_isbn_variants (
            book_id, isbn, isbn_type, binding_type, format_type
        ) VALUES (
            book_uuid,
            isbn_text,
            CASE 
                WHEN length(isbn_text) = 10 THEN 'isbn10'
                WHEN length(isbn_text) = 13 THEN 'isbn13'
                ELSE 'unknown'
            END,
            binding_type,
            'variant'
        );
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."process_other_isbns"("book_uuid" "uuid", "other_isbns_json" "jsonb") OWNER TO "postgres";

--
-- Name: process_related_books("uuid", "jsonb"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."process_related_books"("book_uuid" "uuid", "related_json" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    relation_type TEXT;
BEGIN
    IF related_json IS NULL THEN
        RETURN;
    END IF;
    
    relation_type := related_json->>'type';
    
    -- Store related book information
    INSERT INTO book_relations (
        book_id, relation_type, relation_source, relation_data
    ) VALUES (
        book_uuid, relation_type, 'isbndb', related_json
    ) ON CONFLICT (book_id, relation_type) DO UPDATE SET
        relation_data = EXCLUDED.relation_data,
        updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."process_related_books"("book_uuid" "uuid", "related_json" "jsonb") OWNER TO "postgres";

--
-- Name: record_performance_metric("text", numeric, "text", "text", "jsonb"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."record_performance_metric"("p_metric_name" "text", "p_metric_value" numeric, "p_metric_unit" "text" DEFAULT NULL::"text", "p_category" "text" DEFAULT 'general'::"text", "p_additional_data" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_metric_id "uuid";
BEGIN
    INSERT INTO "public"."performance_metrics" (
        "metric_name", "metric_value", "metric_unit", "category", "additional_data"
    ) VALUES (
        p_metric_name, p_metric_value, p_metric_unit, p_category, p_additional_data
    ) RETURNING "id" INTO v_metric_id;
    
    RETURN v_metric_id;
END;
$$;


ALTER FUNCTION "public"."record_performance_metric"("p_metric_name" "text", "p_metric_value" numeric, "p_metric_unit" "text", "p_category" "text", "p_additional_data" "jsonb") OWNER TO "postgres";

--
-- Name: FUNCTION "record_performance_metric"("p_metric_name" "text", "p_metric_value" numeric, "p_metric_unit" "text", "p_category" "text", "p_additional_data" "jsonb"); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."record_performance_metric"("p_metric_name" "text", "p_metric_value" numeric, "p_metric_unit" "text", "p_category" "text", "p_additional_data" "jsonb") IS 'Records performance metrics for monitoring';


--
-- Name: refresh_materialized_views(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."refresh_materialized_views"() RETURNS TABLE("view_name" "text", "refresh_status" "text", "refresh_time" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Refresh book popularity summary
    REFRESH MATERIALIZED VIEW "public"."book_popularity_summary";
    RETURN QUERY SELECT 'book_popularity_summary'::text, 'REFRESHED'::text, now();
    
    -- Refresh user activity summary
    REFRESH MATERIALIZED VIEW "public"."user_activity_summary";
    RETURN QUERY SELECT 'user_activity_summary'::text, 'REFRESHED'::text, now();
    
    -- Refresh publisher summary
    REFRESH MATERIALIZED VIEW "public"."publisher_summary";
    RETURN QUERY SELECT 'publisher_summary'::text, 'REFRESHED'::text, now();
END;
$$;


ALTER FUNCTION "public"."refresh_materialized_views"() OWNER TO "postgres";

--
-- Name: FUNCTION "refresh_materialized_views"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."refresh_materialized_views"() IS 'Refresh all materialized views';


--
-- Name: revoke_reading_permission("uuid", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."revoke_reading_permission"("target_user_id" "uuid", "permission_type" "text" DEFAULT 'view_reading_progress'::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Delete permission
    DELETE FROM "public"."custom_permissions" 
    WHERE user_id = auth.uid() 
    AND target_user_id = target_user_id 
    AND permission_type = permission_type;

    -- Log the action
    INSERT INTO "public"."privacy_audit_log" (user_id, action, target_user_id, permission_type)
    VALUES (auth.uid(), 'revoke_permission', target_user_id, permission_type);

    RETURN true;
END;
$$;


ALTER FUNCTION "public"."revoke_reading_permission"("target_user_id" "uuid", "permission_type" "text") OWNER TO "postgres";

--
-- Name: FUNCTION "revoke_reading_permission"("target_user_id" "uuid", "permission_type" "text"); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."revoke_reading_permission"("target_user_id" "uuid", "permission_type" "text") IS 'Revoke custom permission to view reading progress';


--
-- Name: run_data_maintenance(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."run_data_maintenance"() RETURNS TABLE("maintenance_step" "text", "records_processed" bigint, "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    processed_count bigint;
BEGIN
    -- Step 1: Fix publisher relationships
    PERFORM * FROM "public"."fix_missing_publisher_relationships"();
    
    SELECT COUNT(*) INTO processed_count
    FROM "public"."books" 
    WHERE publisher_id IS NOT NULL;
    
    RETURN QUERY SELECT 
        'Fix Publisher Relationships'::text,
        processed_count,
        'COMPLETED'::text;
    
    -- Step 2: Clean up orphaned records
    PERFORM * FROM "public"."cleanup_orphaned_records"();
    
    RETURN QUERY SELECT 
        'Cleanup Orphaned Records'::text,
        0::bigint,
        'COMPLETED'::text;
    
    -- Step 3: Standardize status values
    PERFORM * FROM "public"."standardize_reading_statuses"();
    
    RETURN QUERY SELECT 
        'Standardize Status Values'::text,
        0::bigint,
        'COMPLETED'::text;
    
    -- Step 4: Validate and repair data
    PERFORM * FROM "public"."validate_and_repair_data"();
    
    RETURN QUERY SELECT 
        'Validate and Repair Data'::text,
        0::bigint,
        'COMPLETED'::text;
    
    -- Log the maintenance run (only if table exists)
    BEGIN
        INSERT INTO "public"."security_audit_log" (
            action, 
            table_name, 
            new_values
        ) VALUES (
            'DATA_MAINTENANCE',
            'all_tables',
            jsonb_build_object(
                'maintenance_completed_at', now(),
                'maintenance_type', 'comprehensive_data_integrity'
            )
        );
    EXCEPTION WHEN OTHERS THEN
        -- Table doesn't exist, continue without logging
    END;
END;
$$;


ALTER FUNCTION "public"."run_data_maintenance"() OWNER TO "postgres";

--
-- Name: FUNCTION "run_data_maintenance"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."run_data_maintenance"() IS 'Run comprehensive data maintenance procedures';


--
-- Name: run_performance_maintenance(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."run_performance_maintenance"() RETURNS TABLE("maintenance_step" "text", "records_processed" bigint, "performance_improvement" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    table_record record;
    processed_count bigint;
BEGIN
    -- Analyze tables for better query planning
    FOR table_record IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename IN ('reading_progress', 'books', 'follows', 'publishers', 'authors')
    LOOP
        EXECUTE format('ANALYZE %I', table_record.tablename);
        processed_count := 1;
        
        RETURN QUERY SELECT 
            ('ANALYZE ' || table_record.tablename)::text,
            processed_count,
            'Improved query planning'::text;
    END LOOP;
    
    -- Refresh materialized views
    PERFORM refresh_materialized_views();
    
    RETURN QUERY SELECT 
        'Refresh Materialized Views'::text,
        3::bigint,
        'Updated summary data'::text;
    
    -- Log the maintenance run
    INSERT INTO "public"."security_audit_log" (
        action, 
        table_name, 
        new_values
    ) VALUES (
        'PERFORMANCE_MAINTENANCE',
        'all_tables',
        jsonb_build_object(
            'maintenance_run_at', now(),
            'maintenance_type', 'performance_optimization'
        )
    );
END;
$$;


ALTER FUNCTION "public"."run_performance_maintenance"() OWNER TO "postgres";

--
-- Name: FUNCTION "run_performance_maintenance"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."run_performance_maintenance"() IS 'Run automated performance maintenance';


--
-- Name: safe_cleanup_orphaned_records(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."safe_cleanup_orphaned_records"() RETURNS TABLE("table_name" "text", "orphaned_count" bigint, "action_taken" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    orphaned_count bigint;
BEGIN
    -- Clean up orphaned reading_progress records (safe operation)
    DELETE FROM "public"."reading_progress" 
    WHERE book_id NOT IN (SELECT id FROM "public"."books");
    
    GET DIAGNOSTICS orphaned_count = ROW_COUNT;
    RETURN QUERY SELECT 'reading_progress'::text, orphaned_count, 'DELETED_ORPHANED'::text;
    
    -- Clean up orphaned follows records (safe operation)
    DELETE FROM "public"."follows" 
    WHERE follower_id NOT IN (SELECT id FROM "auth"."users")
    OR following_id NOT IN (SELECT id FROM "auth"."users");
    
    GET DIAGNOSTICS orphaned_count = ROW_COUNT;
    RETURN QUERY SELECT 'follows'::text, orphaned_count, 'DELETED_ORPHANED'::text;
    
    -- Log the cleanup operation
    INSERT INTO "public"."security_audit_log" (
        action, 
        table_name, 
        new_values
    ) VALUES (
        'SAFE_ORPHANED_CLEANUP',
        'multiple_tables',
        jsonb_build_object(
            'cleanup_completed_at', now(),
            'cleanup_type', 'orphaned_records_removal'
        )
    );
END;
$$;


ALTER FUNCTION "public"."safe_cleanup_orphaned_records"() OWNER TO "postgres";

--
-- Name: FUNCTION "safe_cleanup_orphaned_records"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."safe_cleanup_orphaned_records"() IS 'Safely remove orphaned records without affecting valid data';


--
-- Name: safe_fix_missing_publishers(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."safe_fix_missing_publishers"() RETURNS TABLE("book_id" "uuid", "book_title" character varying, "action_taken" "text", "publisher_id" "uuid", "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    book_record RECORD;
    publisher_record RECORD;
    linked_count integer := 0;
    created_count integer := 0;
BEGIN
    -- First, try to link books to existing publishers by author name
    FOR book_record IN 
        SELECT b.id, b.title, b.author, b.publisher_id
        FROM "public"."books" b
        WHERE b.publisher_id IS NULL
        AND b.author IS NOT NULL
        AND b.author != ''
    LOOP
        -- Try to find existing publisher by author name
        SELECT p.id INTO publisher_record
        FROM "public"."publishers" p
        WHERE LOWER(p.name) = LOWER(book_record.author)
        LIMIT 1;
        
        IF publisher_record.id IS NOT NULL THEN
            -- Link to existing publisher
            UPDATE "public"."books" 
            SET publisher_id = publisher_record.id
            WHERE id = book_record.id;
            
            linked_count := linked_count + 1;
            
            RETURN QUERY SELECT 
                book_record.id,
                book_record.title,
                'LINKED_TO_EXISTING_PUBLISHER'::text,
                publisher_record.id,
                'SUCCESS'::text;
        ELSE
            -- Create new publisher for this author
            INSERT INTO "public"."publishers" (name, created_at, updated_at)
            VALUES (book_record.author, now(), now())
            RETURNING id INTO publisher_record;
            
            -- Link book to new publisher
            UPDATE "public"."books" 
            SET publisher_id = publisher_record.id
            WHERE id = book_record.id;
            
            created_count := created_count + 1;
            
            RETURN QUERY SELECT 
                book_record.id,
                book_record.title,
                'CREATED_NEW_PUBLISHER'::text,
                publisher_record.id,
                'SUCCESS'::text;
        END IF;
    END LOOP;
    
    -- Log the operation safely
    INSERT INTO "public"."security_audit_log" (
        action, 
        table_name, 
        new_values
    ) VALUES (
        'SAFE_DATA_INTEGRITY_FIX',
        'books_publishers',
        jsonb_build_object(
            'linked_count', linked_count,
            'created_count', created_count,
            'total_fixed', linked_count + created_count,
            'fix_type', 'missing_publisher_relationships'
        )
    );
END;
$$;


ALTER FUNCTION "public"."safe_fix_missing_publishers"() OWNER TO "postgres";

--
-- Name: simple_check_publisher_health(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."simple_check_publisher_health"() RETURNS TABLE("metric_name" "text", "current_value" bigint, "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Count books with missing publisher_id
    RETURN QUERY SELECT 
        'Books with missing publisher_id'::text,
        COUNT(*)::bigint,
        CASE WHEN COUNT(*) = 0 THEN 'GOOD' ELSE 'NEEDS_FIX' END
    FROM "public"."books" 
    WHERE publisher_id IS NULL;
    
    -- Count total books
    RETURN QUERY SELECT 
        'Total books'::text,
        COUNT(*)::bigint,
        'INFO'::text
    FROM "public"."books";
    
    -- Count total publishers
    RETURN QUERY SELECT 
        'Total publishers'::text,
        COUNT(*)::bigint,
        'INFO'::text
    FROM "public"."publishers";
END;
$$;


ALTER FUNCTION "public"."simple_check_publisher_health"() OWNER TO "postgres";

--
-- Name: simple_fix_missing_publishers(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."simple_fix_missing_publishers"() RETURNS TABLE("book_id" "uuid", "book_title" character varying, "action_taken" "text", "publisher_id" "uuid", "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    book_record RECORD;
    publisher_record RECORD;
    linked_count integer := 0;
    created_count integer := 0;
BEGIN
    -- First, try to link books to existing publishers by author name
    FOR book_record IN 
        SELECT b.id, b.title, b.author, b.publisher_id
        FROM "public"."books" b
        WHERE b.publisher_id IS NULL
        AND b.author IS NOT NULL
        AND b.author != ''
    LOOP
        -- Try to find existing publisher by author name
        SELECT p.id INTO publisher_record
        FROM "public"."publishers" p
        WHERE LOWER(p.name) = LOWER(book_record.author)
        LIMIT 1;
        
        IF publisher_record.id IS NOT NULL THEN
            -- Link to existing publisher
            UPDATE "public"."books" 
            SET publisher_id = publisher_record.id
            WHERE id = book_record.id;
            
            linked_count := linked_count + 1;
            
            RETURN QUERY SELECT 
                book_record.id,
                book_record.title,
                'LINKED_TO_EXISTING_PUBLISHER'::text,
                publisher_record.id,
                'SUCCESS'::text;
        ELSE
            -- Create new publisher for this author
            INSERT INTO "public"."publishers" (name, created_at, updated_at)
            VALUES (book_record.author, now(), now())
            RETURNING id INTO publisher_record;
            
            -- Link book to new publisher
            UPDATE "public"."books" 
            SET publisher_id = publisher_record.id
            WHERE id = book_record.id;
            
            created_count := created_count + 1;
            
            RETURN QUERY SELECT 
                book_record.id,
                book_record.title,
                'CREATED_NEW_PUBLISHER'::text,
                publisher_record.id,
                'SUCCESS'::text;
        END IF;
    END LOOP;
    
    -- Simple logging without requiring security_audit_log table
    RAISE NOTICE 'Publisher fix completed: % books linked, % new publishers created', linked_count, created_count;
END;
$$;


ALTER FUNCTION "public"."simple_fix_missing_publishers"() OWNER TO "postgres";

--
-- Name: standardize_reading_status_mappings(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."standardize_reading_status_mappings"() RETURNS TABLE("old_status" "text", "new_status" "text", "updated_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    status_mapping record;
    updated_count bigint;
BEGIN
    -- Define status mappings
    FOR status_mapping IN 
        SELECT 
            'want_to_read' as old_status, 'not_started' as new_status
        UNION ALL
        SELECT 'currently_reading', 'in_progress'
        UNION ALL
        SELECT 'read', 'completed'
        UNION ALL
        SELECT 'on_hold', 'on_hold'
        UNION ALL
        SELECT 'abandoned', 'abandoned'
    LOOP
        -- Update reading_progress table
        UPDATE "public"."reading_progress" 
        SET status = status_mapping.new_status
        WHERE status = status_mapping.old_status;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        
        RETURN QUERY SELECT 
            status_mapping.old_status,
            status_mapping.new_status,
            updated_count;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."standardize_reading_status_mappings"() OWNER TO "postgres";

--
-- Name: FUNCTION "standardize_reading_status_mappings"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."standardize_reading_status_mappings"() IS 'Standardize reading progress status mappings';


--
-- Name: standardize_reading_statuses(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."standardize_reading_statuses"() RETURNS TABLE("old_status" "text", "new_status" "text", "updated_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    status_mapping RECORD;
    updated_count bigint;
BEGIN
    -- Define status mappings
    FOR status_mapping IN 
        SELECT 
            'want_to_read' as old_status, 'not_started' as new_status
        UNION ALL
        SELECT 'currently_reading', 'in_progress'
        UNION ALL
        SELECT 'read', 'completed'
        UNION ALL
        SELECT 'on_hold', 'on_hold'
        UNION ALL
        SELECT 'abandoned', 'abandoned'
    LOOP
        -- Update reading_progress table
        UPDATE "public"."reading_progress" 
        SET status = status_mapping.new_status
        WHERE status = status_mapping.old_status;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        
        RETURN QUERY SELECT 
            status_mapping.old_status,
            status_mapping.new_status,
            updated_count;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."standardize_reading_statuses"() OWNER TO "postgres";

--
-- Name: FUNCTION "standardize_reading_statuses"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."standardize_reading_statuses"() IS 'Standardize reading status values across the application';


--
-- Name: trigger_content_processing(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."trigger_content_processing"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Automatically process new content for NLP analysis
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.nlp_analysis (
            content_id,
            content_type,
            analysis_type,
            original_text
        ) VALUES (
            NEW.id,
            TG_TABLE_NAME,
            'sentiment',
            COALESCE(NEW.description, NEW.title, NEW.content, '')
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_content_processing"() OWNER TO "postgres";

--
-- Name: trigger_recommendation_generation(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."trigger_recommendation_generation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Generate AI recommendations when user activity changes
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- This would integrate with your recommendation engine
        -- For now, we'll just log the activity
        INSERT INTO public.user_activity_log (
            user_id,
            activity_type,
            activity_data
        ) VALUES (
            NEW.user_id,
            'recommendation_trigger',
            jsonb_build_object('trigger_table', TG_TABLE_NAME, 'trigger_operation', TG_OP)
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."trigger_recommendation_generation"() OWNER TO "postgres";

--
-- Name: trigger_update_book_popularity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."trigger_update_book_popularity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM "public"."update_book_popularity_metrics"(NEW."book_id");
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM "public"."update_book_popularity_metrics"(OLD."book_id");
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."trigger_update_book_popularity"() OWNER TO "postgres";

--
-- Name: update_book_popularity_metrics("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_book_popularity_metrics"("p_book_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO "public"."book_popularity_metrics" (
        "book_id", "views_count", "reviews_count", "avg_rating", 
        "reading_progress_count", "reading_list_count"
    )
    SELECT 
        b."id",
        COALESCE(COUNT(DISTINCT bv."id"), 0) as views_count,
        COALESCE(COUNT(DISTINCT br."id"), 0) as reviews_count,
        COALESCE(AVG(br."rating"), 0) as avg_rating,
        COALESCE(COUNT(DISTINCT rp."id"), 0) as reading_progress_count,
        COALESCE(COUNT(DISTINCT rli."id"), 0) as reading_list_count
    FROM "public"."books" b
    LEFT JOIN "public"."book_views" bv ON b."id" = bv."book_id"
    LEFT JOIN "public"."book_reviews" br ON b."id" = br."book_id"
    LEFT JOIN "public"."reading_progress" rp ON b."id" = rp."book_id"
    LEFT JOIN "public"."reading_list_items" rli ON b."id" = rli."book_id"
    WHERE b."id" = p_book_id
    GROUP BY b."id"
    ON CONFLICT ("book_id") DO UPDATE SET
        "views_count" = EXCLUDED."views_count",
        "reviews_count" = EXCLUDED."reviews_count",
        "avg_rating" = EXCLUDED."avg_rating",
        "reading_progress_count" = EXCLUDED."reading_progress_count",
        "reading_list_count" = EXCLUDED."reading_list_count",
        "last_updated" = "now"();
END;
$$;


ALTER FUNCTION "public"."update_book_popularity_metrics"("p_book_id" "uuid") OWNER TO "postgres";

--
-- Name: FUNCTION "update_book_popularity_metrics"("p_book_id" "uuid"); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."update_book_popularity_metrics"("p_book_id" "uuid") IS 'Updates book popularity metrics based on user interactions';


--
-- Name: update_photo_albums_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_photo_albums_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_photo_albums_updated_at"() OWNER TO "postgres";

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

--
-- Name: update_user_privacy_settings("text", boolean, boolean, boolean, boolean, boolean, boolean, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_user_privacy_settings"("default_privacy_level" "text" DEFAULT NULL::"text", "allow_friends_to_see_reading" boolean DEFAULT NULL::boolean, "allow_followers_to_see_reading" boolean DEFAULT NULL::boolean, "allow_public_reading_profile" boolean DEFAULT NULL::boolean, "show_reading_stats_publicly" boolean DEFAULT NULL::boolean, "show_currently_reading_publicly" boolean DEFAULT NULL::boolean, "show_reading_history_publicly" boolean DEFAULT NULL::boolean, "show_reading_goals_publicly" boolean DEFAULT NULL::boolean) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    old_settings jsonb;
    new_settings jsonb;
BEGIN
    -- Get current settings
    SELECT to_jsonb(ups.*) INTO old_settings
    FROM "public"."user_privacy_settings" ups
    WHERE ups.user_id = auth.uid();

    -- Insert or update settings
    INSERT INTO "public"."user_privacy_settings" (
        user_id, default_privacy_level, allow_friends_to_see_reading, 
        allow_followers_to_see_reading, allow_public_reading_profile,
        show_reading_stats_publicly, show_currently_reading_publicly,
        show_reading_history_publicly, show_reading_goals_publicly
    )
    VALUES (
        auth.uid(),
        COALESCE(default_privacy_level, 'private'),
        COALESCE(allow_friends_to_see_reading, false),
        COALESCE(allow_followers_to_see_reading, false),
        COALESCE(allow_public_reading_profile, false),
        COALESCE(show_reading_stats_publicly, false),
        COALESCE(show_currently_reading_publicly, false),
        COALESCE(show_reading_history_publicly, false),
        COALESCE(show_reading_goals_publicly, false)
    )
    ON CONFLICT (user_id) DO UPDATE SET
        default_privacy_level = EXCLUDED.default_privacy_level,
        allow_friends_to_see_reading = EXCLUDED.allow_friends_to_see_reading,
        allow_followers_to_see_reading = EXCLUDED.allow_followers_to_see_reading,
        allow_public_reading_profile = EXCLUDED.allow_public_reading_profile,
        show_reading_stats_publicly = EXCLUDED.show_reading_stats_publicly,
        show_currently_reading_publicly = EXCLUDED.show_currently_reading_publicly,
        show_reading_history_publicly = EXCLUDED.show_reading_history_publicly,
        show_reading_goals_publicly = EXCLUDED.show_reading_goals_publicly,
        updated_at = now();

    -- Get new settings
    SELECT to_jsonb(ups.*) INTO new_settings
    FROM "public"."user_privacy_settings" ups
    WHERE ups.user_id = auth.uid();

    -- Log the action
    INSERT INTO "public"."privacy_audit_log" (user_id, action, old_value, new_value)
    VALUES (auth.uid(), 'update_privacy_settings', old_settings, new_settings);

    RETURN true;
END;
$$;


ALTER FUNCTION "public"."update_user_privacy_settings"("default_privacy_level" "text", "allow_friends_to_see_reading" boolean, "allow_followers_to_see_reading" boolean, "allow_public_reading_profile" boolean, "show_reading_stats_publicly" boolean, "show_currently_reading_publicly" boolean, "show_reading_history_publicly" boolean, "show_reading_goals_publicly" boolean) OWNER TO "postgres";

--
-- Name: FUNCTION "update_user_privacy_settings"("default_privacy_level" "text", "allow_friends_to_see_reading" boolean, "allow_followers_to_see_reading" boolean, "allow_public_reading_profile" boolean, "show_reading_stats_publicly" boolean, "show_currently_reading_publicly" boolean, "show_reading_history_publicly" boolean, "show_reading_goals_publicly" boolean); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."update_user_privacy_settings"("default_privacy_level" "text", "allow_friends_to_see_reading" boolean, "allow_followers_to_see_reading" boolean, "allow_public_reading_profile" boolean, "show_reading_stats_publicly" boolean, "show_currently_reading_publicly" boolean, "show_reading_history_publicly" boolean, "show_reading_goals_publicly" boolean) IS 'Update user privacy settings with audit logging';


--
-- Name: upsert_reading_progress("uuid", "uuid", "text", integer, "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."upsert_reading_progress"("p_user_id" "uuid", "p_book_id" "uuid", "p_status" "text", "p_progress_percentage" integer DEFAULT NULL::integer, "p_privacy_level" "text" DEFAULT 'private'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    normalized_status text;
    progress_percentage integer;
    result_record record;
BEGIN
    -- Normalize the status
    normalized_status := "public"."map_reading_status_to_progress"(p_status);
    
    -- Use provided progress percentage or calculate based on status
    IF p_progress_percentage IS NOT NULL THEN
        progress_percentage := p_progress_percentage;
    ELSE
        progress_percentage := CASE normalized_status
            WHEN 'not_started' THEN 0
            WHEN 'in_progress' THEN 50
            WHEN 'completed' THEN 100
            WHEN 'on_hold' THEN 25
            WHEN 'abandoned' THEN 0
            ELSE 0
        END;
    END IF;
    
    -- Upsert into reading_progress table (only using existing columns)
    INSERT INTO "public"."reading_progress" (
        user_id, book_id, status, progress_percentage, privacy_level, 
        start_date, finish_date, created_at, updated_at
    ) VALUES (
        p_user_id, p_book_id, normalized_status, progress_percentage, p_privacy_level,
        CASE WHEN normalized_status = 'in_progress' THEN now() ELSE NULL END,
        CASE WHEN normalized_status = 'completed' THEN now() ELSE NULL END,
        now(), now()
    )
    ON CONFLICT (user_id, book_id) 
    DO UPDATE SET
        status = EXCLUDED.status,
        progress_percentage = EXCLUDED.progress_percentage,
        privacy_level = EXCLUDED.privacy_level,
        start_date = CASE 
            WHEN EXCLUDED.status = 'in_progress' AND reading_progress.start_date IS NULL 
            THEN now() 
            ELSE reading_progress.start_date 
        END,
        finish_date = CASE 
            WHEN EXCLUDED.status = 'completed' 
            THEN now() 
            ELSE reading_progress.finish_date 
        END,
        updated_at = now()
    RETURNING * INTO result_record;
    
    -- Return the result
    RETURN jsonb_build_object(
        'success', true,
        'data', to_jsonb(result_record),
        'status', normalized_status
    );
END;
$$;


ALTER FUNCTION "public"."upsert_reading_progress"("p_user_id" "uuid", "p_book_id" "uuid", "p_status" "text", "p_progress_percentage" integer, "p_privacy_level" "text") OWNER TO "postgres";

--
-- Name: validate_and_repair_data(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."validate_and_repair_data"() RETURNS TABLE("validation_type" "text", "issue_count" bigint, "fixed_count" bigint, "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    issue_count bigint;
    fixed_count bigint;
BEGIN
    -- Fix books with invalid publisher_id references
    UPDATE "public"."books" 
    SET publisher_id = NULL
    WHERE publisher_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM "public"."publishers" p 
        WHERE p.id = books.publisher_id
    );
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    
    RETURN QUERY SELECT 
        'Invalid publisher references'::text,
        0::bigint,
        fixed_count,
        'FIXED'::text;
    
    -- Fix reading progress with invalid book_id references
    UPDATE "public"."reading_progress" 
    SET book_id = NULL
    WHERE book_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM "public"."books" b 
        WHERE b.id = reading_progress.book_id
    );
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    
    RETURN QUERY SELECT 
        'Invalid book references'::text,
        0::bigint,
        fixed_count,
        'FIXED'::text;
    
    -- Fix follows with invalid user references
    UPDATE "public"."follows" 
    SET follower_id = NULL
    WHERE follower_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM "auth"."users" u 
        WHERE u.id = follows.follower_id
    );
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    
    RETURN QUERY SELECT 
        'Invalid user references'::text,
        0::bigint,
        fixed_count,
        'FIXED'::text;
END;
$$;


ALTER FUNCTION "public"."validate_and_repair_data"() OWNER TO "postgres";

--
-- Name: FUNCTION "validate_and_repair_data"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."validate_and_repair_data"() IS 'Validate and repair data integrity issues';


--
-- Name: validate_book_data("jsonb"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."validate_book_data"("book_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    validation_errors text[] := '{}';
    result jsonb;
BEGIN
    -- Validate required fields
    IF book_data->>'title' IS NULL OR book_data->>'title' = '' THEN
        validation_errors := validation_errors || 'Title is required';
    END IF;
    
    IF book_data->>'author' IS NULL OR book_data->>'author' = '' THEN
        validation_errors := validation_errors || 'Author is required';
    END IF;
    
    -- Validate ISBN format if provided
    IF book_data->>'isbn13' IS NOT NULL AND book_data->>'isbn13' != '' THEN
        IF length(book_data->>'isbn13') != 13 THEN
            validation_errors := validation_errors || 'ISBN-13 must be exactly 13 characters';
        END IF;
    END IF;
    
    IF book_data->>'isbn10' IS NOT NULL AND book_data->>'isbn10' != '' THEN
        IF length(book_data->>'isbn10') != 10 THEN
            validation_errors := validation_errors || 'ISBN-10 must be exactly 10 characters';
        END IF;
    END IF;
    
    -- Validate publication date
    IF book_data->>'publication_date' IS NOT NULL THEN
        BEGIN
            PERFORM (book_data->>'publication_date')::date;
        EXCEPTION WHEN OTHERS THEN
            validation_errors := validation_errors || 'Invalid publication date format';
        END;
    END IF;
    
    -- Return validation result
    IF array_length(validation_errors, 1) > 0 THEN
        result := jsonb_build_object(
            'valid', false,
            'errors', validation_errors
        );
    ELSE
        result := jsonb_build_object(
            'valid', true,
            'data', book_data
        );
    END IF;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."validate_book_data"("book_data" "jsonb") OWNER TO "postgres";

--
-- Name: validate_book_data_enhanced("text", "text", "text", integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."validate_book_data_enhanced"("p_title" "text", "p_author" "text", "p_isbn" "text" DEFAULT NULL::"text", "p_publication_year" integer DEFAULT NULL::integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
    v_validation_result "jsonb";
    v_errors "text"[] := '{}';
    v_warnings "text"[] := '{}';
BEGIN
    -- Title validation
    IF p_title IS NULL OR LENGTH(TRIM(p_title)) = 0 THEN
        v_errors := array_append(v_errors, 'Title is required');
    ELSIF LENGTH(p_title) > 500 THEN
        v_errors := array_append(v_errors, 'Title exceeds maximum length of 500 characters');
    END IF;
    
    -- Author validation
    IF p_author IS NULL OR LENGTH(TRIM(p_author)) = 0 THEN
        v_errors := array_append(v_errors, 'Author is required');
    ELSIF LENGTH(p_author) > 200 THEN
        v_errors := array_append(v_errors, 'Author name exceeds maximum length of 200 characters');
    END IF;
    
    -- ISBN validation
    IF p_isbn IS NOT NULL AND LENGTH(p_isbn) > 0 THEN
        IF NOT p_isbn ~ '^[0-9X-]{10,13}$' THEN
            v_errors := array_append(v_errors, 'Invalid ISBN format');
        END IF;
    END IF;
    
    -- Publication year validation
    IF p_publication_year IS NOT NULL THEN
        IF p_publication_year < 1000 OR p_publication_year > EXTRACT(YEAR FROM CURRENT_DATE) + 5 THEN
            v_warnings := array_append(v_warnings, 'Publication year seems unusual');
        END IF;
    END IF;
    
    -- Build validation result
    v_validation_result := "jsonb_build_object"(
        'is_valid', array_length(v_errors, 1) = 0,
        'errors', v_errors,
        'warnings', v_warnings,
        'validation_timestamp', "now"()
    );
    
    RETURN v_validation_result;
END;
$_$;


ALTER FUNCTION "public"."validate_book_data_enhanced"("p_title" "text", "p_author" "text", "p_isbn" "text", "p_publication_year" integer) OWNER TO "postgres";

--
-- Name: FUNCTION "validate_book_data_enhanced"("p_title" "text", "p_author" "text", "p_isbn" "text", "p_publication_year" integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."validate_book_data_enhanced"("p_title" "text", "p_author" "text", "p_isbn" "text", "p_publication_year" integer) IS 'Enhanced book data validation for integrity and quality';


--
-- Name: validate_enterprise_data_quality("text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."validate_enterprise_data_quality"("p_table_name" "text" DEFAULT NULL::"text") RETURNS TABLE("rule_name" "text", "table_name" "text", "column_name" "text", "rule_type" "text", "validation_result" "text", "error_count" bigint, "severity" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    rule_record RECORD;
    validation_query text;
    error_count_val bigint;
BEGIN
    FOR rule_record IN 
        SELECT * FROM "public"."enterprise_data_quality_rules" 
        WHERE "is_active" = true 
        AND (p_table_name IS NULL OR "table_name" = p_table_name)
    LOOP
        -- Build dynamic validation query based on rule type
        CASE rule_record.rule_type
            WHEN 'NOT_NULL' THEN
                validation_query := format(
                    'SELECT COUNT(*) FROM %I WHERE %I IS NULL',
                    rule_record.table_name,
                    rule_record.column_name
                );
            WHEN 'UNIQUE' THEN
                validation_query := format(
                    'SELECT COUNT(*) FROM (SELECT %I, COUNT(*) FROM %I GROUP BY %I HAVING COUNT(*) > 1) t',
                    rule_record.column_name,
                    rule_record.table_name,
                    rule_record.column_name
                );
            WHEN 'FOREIGN_KEY' THEN
                -- Extract foreign key details from rule_definition
                validation_query := format(
                    'SELECT COUNT(*) FROM %I t1 LEFT JOIN %s t2 ON t1.%I = t2.%I WHERE t2.%I IS NULL',
                    rule_record.table_name,
                    split_part(rule_record.rule_definition, ':', 1),
                    rule_record.column_name,
                    split_part(rule_record.rule_definition, ':', 2),
                    split_part(rule_record.rule_definition, ':', 2)
                );
            WHEN 'CHECK' THEN
                validation_query := format(
                    'SELECT COUNT(*) FROM %I WHERE NOT (%s)',
                    rule_record.table_name,
                    rule_record.rule_definition
                );
            ELSE
                validation_query := rule_record.rule_definition;
        END CASE;
        
        -- Execute validation query
        BEGIN
            EXECUTE validation_query INTO error_count_val;
        EXCEPTION WHEN OTHERS THEN
            error_count_val := -1; -- Error in validation
        END;
        
        RETURN QUERY SELECT 
            rule_record.rule_name,
            rule_record.table_name,
            rule_record.column_name,
            rule_record.rule_type,
            CASE 
                WHEN error_count_val = 0 THEN 'PASS'
                WHEN error_count_val > 0 THEN 'FAIL'
                ELSE 'ERROR'
            END,
            error_count_val,
            rule_record.severity;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."validate_enterprise_data_quality"("p_table_name" "text") OWNER TO "postgres";

--
-- Name: FUNCTION "validate_enterprise_data_quality"("p_table_name" "text"); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."validate_enterprise_data_quality"("p_table_name" "text") IS 'Validates enterprise data quality rules';


--
-- Name: validate_follow_entity("uuid", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."validate_follow_entity"("p_entity_id" "uuid", "p_target_type" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    entity_exists boolean := false;
BEGIN
    -- Check if entity exists based on target type
    CASE p_target_type
        WHEN 'user' THEN
            SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_entity_id) INTO entity_exists;
        WHEN 'book' THEN
            SELECT EXISTS(SELECT 1 FROM public.books WHERE id = p_entity_id) INTO entity_exists;
        WHEN 'author' THEN
            SELECT EXISTS(SELECT 1 FROM public.authors WHERE id = p_entity_id) INTO entity_exists;
        WHEN 'publisher' THEN
            SELECT EXISTS(SELECT 1 FROM public.publishers WHERE id = p_entity_id) INTO entity_exists;
        WHEN 'group' THEN
            SELECT EXISTS(SELECT 1 FROM public.groups WHERE id = p_entity_id) INTO entity_exists;
        ELSE
            entity_exists := false;
    END CASE;
    
    RETURN entity_exists;
END;
$$;


ALTER FUNCTION "public"."validate_follow_entity"("p_entity_id" "uuid", "p_target_type" "text") OWNER TO "postgres";

--
-- Name: FUNCTION "validate_follow_entity"("p_entity_id" "uuid", "p_target_type" "text"); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."validate_follow_entity"("p_entity_id" "uuid", "p_target_type" "text") IS 'Validates that an entity exists before allowing a follow relationship';


--
-- Name: validate_follow_entity_trigger(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."validate_follow_entity_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    target_type_name text;
    entity_exists boolean;
BEGIN
    -- Get the target type name
    SELECT name INTO target_type_name 
    FROM public.follow_target_types 
    WHERE id = NEW.target_type_id;
    
    -- Validate entity exists
    entity_exists := public.validate_follow_entity(NEW.following_id, target_type_name);
    
    IF NOT entity_exists THEN
        RAISE EXCEPTION 'Entity with ID % does not exist in table %', NEW.following_id, target_type_name;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_follow_entity_trigger"() OWNER TO "postgres";

--
-- Name: FUNCTION "validate_follow_entity_trigger"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."validate_follow_entity_trigger"() IS 'Trigger to validate entity existence before follow insert';


--
-- Name: validate_user_data_enhanced("text", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."validate_user_data_enhanced"("p_email" "text", "p_name" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
    v_validation_result "jsonb";
    v_errors "text"[] := '{}';
    v_warnings "text"[] := '{}';
BEGIN
    -- Email validation
    IF p_email IS NULL OR LENGTH(TRIM(p_email)) = 0 THEN
        v_errors := array_append(v_errors, 'Email is required');
    ELSIF NOT p_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        v_errors := array_append(v_errors, 'Invalid email format');
    END IF;
    
    -- Name validation
    IF p_name IS NOT NULL AND LENGTH(TRIM(p_name)) > 0 THEN
        IF LENGTH(p_name) > 100 THEN
            v_errors := array_append(v_errors, 'Name exceeds maximum length of 100 characters');
        END IF;
        
        IF p_name ~ '[0-9]' THEN
            v_warnings := array_append(v_warnings, 'Name contains numbers');
        END IF;
    END IF;
    
    -- Build validation result
    v_validation_result := "jsonb_build_object"(
        'is_valid', array_length(v_errors, 1) = 0,
        'errors', v_errors,
        'warnings', v_warnings,
        'validation_timestamp', "now"()
    );
    
    RETURN v_validation_result;
END;
$_$;


ALTER FUNCTION "public"."validate_user_data_enhanced"("p_email" "text", "p_name" "text") OWNER TO "postgres";

--
-- Name: FUNCTION "validate_user_data_enhanced"("p_email" "text", "p_name" "text"); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."validate_user_data_enhanced"("p_email" "text", "p_name" "text") IS 'Enhanced user data validation for format and completeness';


--
-- Name: apply_rls("jsonb", integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE OR REPLACE FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer DEFAULT (1024 * 1024)) RETURNS SETOF "realtime"."wal_rls"
    LANGUAGE "plpgsql"
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) OWNER TO "supabase_admin";

--
-- Name: broadcast_changes("text", "text", "text", "text", "text", "record", "record", "text"); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE OR REPLACE FUNCTION "realtime"."broadcast_changes"("topic_name" "text", "event_name" "text", "operation" "text", "table_name" "text", "table_schema" "text", "new" "record", "old" "record", "level" "text" DEFAULT 'ROW'::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION "realtime"."broadcast_changes"("topic_name" "text", "event_name" "text", "operation" "text", "table_name" "text", "table_schema" "text", "new" "record", "old" "record", "level" "text") OWNER TO "supabase_admin";

--
-- Name: build_prepared_statement_sql("text", "regclass", "realtime"."wal_column"[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

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


ALTER FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) OWNER TO "supabase_admin";

--
-- Name: cast("text", "regtype"); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE OR REPLACE FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") RETURNS "jsonb"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


ALTER FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") OWNER TO "supabase_admin";

--
-- Name: check_equality_op("realtime"."equality_op", "regtype", "text", "text"); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

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
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


ALTER FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") OWNER TO "supabase_admin";

--
-- Name: is_visible_through_filters("realtime"."wal_column"[], "realtime"."user_defined_filter"[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

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
    $_$;


ALTER FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) OWNER TO "supabase_admin";

--
-- Name: list_changes("name", "name", integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

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


ALTER FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) OWNER TO "supabase_admin";

--
-- Name: quote_wal2json("regclass"); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

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


ALTER FUNCTION "realtime"."quote_wal2json"("entity" "regclass") OWNER TO "supabase_admin";

--
-- Name: send("jsonb", "text", "text", boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE OR REPLACE FUNCTION "realtime"."send"("payload" "jsonb", "event" "text", "topic" "text", "private" boolean DEFAULT true) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (payload, event, topic, private, extension)
    VALUES (payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      PERFORM pg_notify(
          'realtime:system',
          jsonb_build_object(
              'error', SQLERRM,
              'function', 'realtime.send',
              'event', event,
              'topic', topic,
              'private', private
          )::text
      );
  END;
END;
$$;


ALTER FUNCTION "realtime"."send"("payload" "jsonb", "event" "text", "topic" "text", "private" boolean) OWNER TO "supabase_admin";

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

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
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


ALTER FUNCTION "realtime"."subscription_check_filters"() OWNER TO "supabase_admin";

--
-- Name: to_regrole("text"); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE OR REPLACE FUNCTION "realtime"."to_regrole"("role_name" "text") RETURNS "regrole"
    LANGUAGE "sql" IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION "realtime"."to_regrole"("role_name" "text") OWNER TO "supabase_admin";

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE OR REPLACE FUNCTION "realtime"."topic"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION "realtime"."topic"() OWNER TO "supabase_realtime_admin";

--
-- Name: can_insert_object("text", "text", "uuid", "jsonb"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE OR REPLACE FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") OWNER TO "supabase_storage_admin";

--
-- Name: extension("text"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE OR REPLACE FUNCTION "storage"."extension"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION "storage"."extension"("name" "text") OWNER TO "supabase_storage_admin";

--
-- Name: filename("text"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE OR REPLACE FUNCTION "storage"."filename"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION "storage"."filename"("name" "text") OWNER TO "supabase_storage_admin";

--
-- Name: foldername("text"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE OR REPLACE FUNCTION "storage"."foldername"("name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql"
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


ALTER FUNCTION "storage"."foldername"("name" "text") OWNER TO "supabase_storage_admin";

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE OR REPLACE FUNCTION "storage"."get_size_by_bucket"() RETURNS TABLE("size" bigint, "bucket_id" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION "storage"."get_size_by_bucket"() OWNER TO "supabase_storage_admin";

--
-- Name: list_multipart_uploads_with_delimiter("text", "text", "text", integer, "text", "text"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

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
END;
$_$;


ALTER FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "next_key_token" "text", "next_upload_token" "text") OWNER TO "supabase_storage_admin";

--
-- Name: list_objects_with_delimiter("text", "text", "text", integer, "text", "text"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

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
END;
$_$;


ALTER FUNCTION "storage"."list_objects_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "start_after" "text", "next_token" "text") OWNER TO "supabase_storage_admin";

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE OR REPLACE FUNCTION "storage"."operation"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION "storage"."operation"() OWNER TO "supabase_storage_admin";

--
-- Name: search("text", "text", integer, integer, integer, "text", "text", "text"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE OR REPLACE FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
declare
  v_order_by text;
  v_sort_order text;
begin
  case
    when sortcolumn = 'name' then
      v_order_by = 'name';
    when sortcolumn = 'updated_at' then
      v_order_by = 'updated_at';
    when sortcolumn = 'created_at' then
      v_order_by = 'created_at';
    when sortcolumn = 'last_accessed_at' then
      v_order_by = 'last_accessed_at';
    else
      v_order_by = 'name';
  end case;

  case
    when sortorder = 'asc' then
      v_sort_order = 'asc';
    when sortorder = 'desc' then
      v_sort_order = 'desc';
    else
      v_sort_order = 'asc';
  end case;

  v_order_by = v_order_by || ' ' || v_sort_order;

  return query execute
    'with folders as (
       select path_tokens[$1] as folder
       from storage.objects
         where objects.name ilike $2 || $3 || ''%''
           and bucket_id = $4
           and array_length(objects.path_tokens, 1) <> $1
       group by folder
       order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") OWNER TO "supabase_storage_admin";

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE OR REPLACE FUNCTION "storage"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION "storage"."update_updated_at_column"() OWNER TO "supabase_storage_admin";

SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE IF NOT EXISTS "auth"."audit_log_entries" (
    "instance_id" "uuid",
    "id" "uuid" NOT NULL,
    "payload" "json",
    "created_at" timestamp with time zone,
    "ip_address" character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE "auth"."audit_log_entries" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "audit_log_entries"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."audit_log_entries" IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

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


ALTER TABLE "auth"."flow_state" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "flow_state"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."flow_state" IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

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


ALTER TABLE "auth"."identities" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "identities"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."identities" IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN "identities"."email"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN "auth"."identities"."email" IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE IF NOT EXISTS "auth"."instances" (
    "id" "uuid" NOT NULL,
    "uuid" "uuid",
    "raw_base_config" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "auth"."instances" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "instances"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."instances" IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE IF NOT EXISTS "auth"."mfa_amr_claims" (
    "session_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "authentication_method" "text" NOT NULL,
    "id" "uuid" NOT NULL
);


ALTER TABLE "auth"."mfa_amr_claims" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "mfa_amr_claims"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."mfa_amr_claims" IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE IF NOT EXISTS "auth"."mfa_challenges" (
    "id" "uuid" NOT NULL,
    "factor_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "verified_at" timestamp with time zone,
    "ip_address" "inet" NOT NULL,
    "otp_code" "text",
    "web_authn_session_data" "jsonb"
);


ALTER TABLE "auth"."mfa_challenges" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "mfa_challenges"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."mfa_challenges" IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

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


ALTER TABLE "auth"."mfa_factors" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "mfa_factors"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."mfa_factors" IS 'auth: stores metadata about factors';


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

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


ALTER TABLE "auth"."one_time_tokens" OWNER TO "supabase_auth_admin";

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

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


ALTER TABLE "auth"."refresh_tokens" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "refresh_tokens"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."refresh_tokens" IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE IF NOT EXISTS "auth"."refresh_tokens_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "auth"."refresh_tokens_id_seq" OWNER TO "supabase_auth_admin";

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE "auth"."refresh_tokens_id_seq" OWNED BY "auth"."refresh_tokens"."id";


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

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


ALTER TABLE "auth"."saml_providers" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "saml_providers"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."saml_providers" IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

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


ALTER TABLE "auth"."saml_relay_states" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "saml_relay_states"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."saml_relay_states" IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE IF NOT EXISTS "auth"."schema_migrations" (
    "version" character varying(255) NOT NULL
);


ALTER TABLE "auth"."schema_migrations" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "schema_migrations"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."schema_migrations" IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

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


ALTER TABLE "auth"."sessions" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "sessions"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."sessions" IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN "sessions"."not_after"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN "auth"."sessions"."not_after" IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE IF NOT EXISTS "auth"."sso_domains" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "domain" "text" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK (("char_length"("domain") > 0))
);


ALTER TABLE "auth"."sso_domains" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "sso_domains"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."sso_domains" IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE IF NOT EXISTS "auth"."sso_providers" (
    "id" "uuid" NOT NULL,
    "resource_id" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    CONSTRAINT "resource_id not empty" CHECK ((("resource_id" = NULL::"text") OR ("char_length"("resource_id") > 0)))
);


ALTER TABLE "auth"."sso_providers" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "sso_providers"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."sso_providers" IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN "sso_providers"."resource_id"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN "auth"."sso_providers"."resource_id" IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

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


ALTER TABLE "auth"."users" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "users"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."users" IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN "users"."is_sso_user"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN "auth"."users"."is_sso_user" IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: activities; Type: TABLE; Schema: public; Owner: postgres
--

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
    "author_id" "uuid",
    "entity_type" "text",
    "entity_id" "uuid"
);


ALTER TABLE "public"."activities" OWNER TO "postgres";

--
-- Name: TABLE "activities"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."activities" IS 'User activities for tracking engagement';


--
-- Name: COLUMN "activities"."entity_type"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."activities"."entity_type" IS 'Type of entity this activity relates to (book, author, event, etc.)';


--
-- Name: COLUMN "activities"."entity_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."activities"."entity_id" IS 'ID of the entity this activity relates to';


--
-- Name: activity_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "target_type" "text",
    "target_id" "uuid",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_log" OWNER TO "postgres";

--
-- Name: book_reviews; Type: TABLE; Schema: public; Owner: postgres
--

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
    "book_id" "uuid"
);


ALTER TABLE "public"."book_reviews" OWNER TO "postgres";

--
-- Name: book_views; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."book_views" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "book_id" "uuid",
    "viewed_at" timestamp with time zone
);


ALTER TABLE "public"."book_views" OWNER TO "postgres";

--
-- Name: books; Type: TABLE; Schema: public; Owner: postgres
--

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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."books" OWNER TO "postgres";

--
-- Name: TABLE "books"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."books" IS 'Book catalog with metadata';


--
-- Name: COLUMN "books"."isbn10"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."books"."isbn10" IS 'ISBN-10 identifier';


--
-- Name: COLUMN "books"."isbn13"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."books"."isbn13" IS 'ISBN-13 identifier';


--
-- Name: COLUMN "books"."title"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."books"."title" IS 'Book title';


--
-- Name: COLUMN "books"."publication_date"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."books"."publication_date" IS 'Book publication date';


--
-- Name: reading_lists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."reading_lists" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "is_public" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reading_lists" OWNER TO "postgres";

--
-- Name: reading_progress; Type: TABLE; Schema: public; Owner: postgres
--

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
    "privacy_level" "text" DEFAULT 'private'::"text" NOT NULL,
    "allow_friends" boolean DEFAULT false NOT NULL,
    "allow_followers" boolean DEFAULT false NOT NULL,
    "custom_permissions" "jsonb" DEFAULT '[]'::"jsonb",
    "privacy_audit_log" "jsonb" DEFAULT '[]'::"jsonb",
    CONSTRAINT "reading_progress_privacy_level_check" CHECK (("privacy_level" = ANY (ARRAY['private'::"text", 'friends'::"text", 'followers'::"text", 'public'::"text"])))
);


ALTER TABLE "public"."reading_progress" OWNER TO "postgres";

--
-- Name: TABLE "reading_progress"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."reading_progress" IS 'User reading progress tracking';


--
-- Name: system_health_checks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."system_health_checks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "check_name" "text" NOT NULL,
    "status" "text" NOT NULL,
    "details" "jsonb",
    "checked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "response_time_ms" integer,
    "error_message" "text",
    CONSTRAINT "system_health_checks_status_check" CHECK (("status" = ANY (ARRAY['healthy'::"text", 'warning'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."system_health_checks" OWNER TO "postgres";

--
-- Name: TABLE "system_health_checks"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."system_health_checks" IS 'System health monitoring data for enterprise monitoring';


--
-- Name: user_activity_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."user_activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "activity_details" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "session_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "response_time_ms" integer,
    "status_code" integer
);


ALTER TABLE "public"."user_activity_log" OWNER TO "postgres";

--
-- Name: TABLE "user_activity_log"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."user_activity_log" IS 'Detailed user activity tracking for analytics and security';


--
-- Name: advanced_analytics_dashboard_enhanced; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."advanced_analytics_dashboard_enhanced" AS
 SELECT ( SELECT "count"(DISTINCT "reading_progress"."user_id") AS "count"
           FROM "public"."reading_progress") AS "active_readers",
    ( SELECT "count"(DISTINCT "book_reviews"."user_id") AS "count"
           FROM "public"."book_reviews") AS "active_reviewers",
    ( SELECT "count"(DISTINCT "reading_lists"."user_id") AS "count"
           FROM "public"."reading_lists") AS "list_creators",
    ( SELECT "count"(*) AS "count"
           FROM "public"."books") AS "total_books",
    ( SELECT "count"(*) AS "count"
           FROM "public"."book_views") AS "total_book_views",
    ( SELECT "count"(*) AS "count"
           FROM "public"."book_reviews") AS "total_reviews",
    ( SELECT "round"("avg"("book_reviews"."rating"), 2) AS "round"
           FROM "public"."book_reviews"
          WHERE ("book_reviews"."rating" IS NOT NULL)) AS "avg_rating",
    ( SELECT "count"(*) AS "count"
           FROM "public"."user_activity_log"
          WHERE ("user_activity_log"."created_at" >= ("now"() - '24:00:00'::interval))) AS "activities_last_24h",
    ( SELECT "count"(*) AS "count"
           FROM "public"."system_health_checks"
          WHERE ("system_health_checks"."checked_at" >= ("now"() - '24:00:00'::interval))) AS "health_checks_last_24h",
    ( SELECT "count"(*) AS "count"
           FROM "public"."books"
          WHERE (("books"."title" IS NULL) OR ("length"(TRIM(BOTH FROM "books"."title")) = 0))) AS "books_without_title",
    ( SELECT "count"(*) AS "count"
           FROM "public"."books"
          WHERE (("books"."author" IS NULL) OR ("length"(TRIM(BOTH FROM "books"."author")) = 0))) AS "books_without_author",
    "now"() AS "dashboard_timestamp";


ALTER TABLE "public"."advanced_analytics_dashboard_enhanced" OWNER TO "postgres";

--
-- Name: album_analytics; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."album_analytics" OWNER TO "postgres";

--
-- Name: album_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."album_images" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "image_id" "uuid" NOT NULL,
    "display_order" integer NOT NULL,
    "is_cover" boolean DEFAULT false,
    "is_featured" boolean DEFAULT false,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "entity_type_id" "uuid",
    "entity_id" "uuid"
);


ALTER TABLE "public"."album_images" OWNER TO "postgres";

--
-- Name: album_shares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."album_shares" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "shared_by" "uuid" NOT NULL,
    "shared_with" "uuid",
    "share_type" character varying(50) NOT NULL,
    "access_token" "uuid",
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."album_shares" OWNER TO "postgres";

--
-- Name: authors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."authors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "bio" "text",
    "featured" boolean DEFAULT false,
    "birth_date" "date",
    "nationality" "text",
    "website" "text",
    "author_image_id" "uuid",
    "twitter_handle" "text",
    "facebook_handle" "text",
    "instagram_handle" "text",
    "goodreads_url" "text",
    "cover_image_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "author_gallery_id" "uuid"
);


ALTER TABLE "public"."authors" OWNER TO "postgres";

--
-- Name: TABLE "authors"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."authors" IS 'Book authors information';


--
-- Name: automation_executions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."automation_executions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid",
    "execution_status" "text" NOT NULL,
    "start_time" timestamp with time zone DEFAULT "now"(),
    "end_time" timestamp with time zone,
    "execution_duration" interval,
    "input_data" "jsonb",
    "output_data" "jsonb",
    "error_message" "text",
    "performance_metrics" "jsonb",
    CONSTRAINT "automation_executions_execution_status_check" CHECK (("execution_status" = ANY (ARRAY['started'::"text", 'running'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."automation_executions" OWNER TO "postgres";

--
-- Name: TABLE "automation_executions"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."automation_executions" IS 'Logs automation workflow executions and performance';


--
-- Name: automation_workflows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."automation_workflows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_name" "text" NOT NULL,
    "workflow_type" "text" NOT NULL,
    "trigger_conditions" "jsonb" NOT NULL,
    "workflow_steps" "jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "execution_frequency" "text" DEFAULT 'on_demand'::"text",
    "last_executed" timestamp with time zone,
    "next_execution" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "automation_workflows_workflow_type_check" CHECK (("workflow_type" = ANY (ARRAY['data_processing'::"text", 'content_generation'::"text", 'notification'::"text", 'maintenance'::"text", 'analytics'::"text"])))
);


ALTER TABLE "public"."automation_workflows" OWNER TO "postgres";

--
-- Name: TABLE "automation_workflows"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."automation_workflows" IS 'Workflow automation engine for enterprise processes';


--
-- Name: binding_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."binding_types" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying,
    "description" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."binding_types" OWNER TO "postgres";

--
-- Name: blocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "blocked_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."blocks" OWNER TO "postgres";

--
-- Name: book_authors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."book_authors" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."book_authors" OWNER TO "postgres";

--
-- Name: book_club_books; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."book_club_books" OWNER TO "postgres";

--
-- Name: book_club_discussion_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."book_club_discussion_comments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "discussion_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."book_club_discussion_comments" OWNER TO "postgres";

--
-- Name: book_club_discussions; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."book_club_discussions" OWNER TO "postgres";

--
-- Name: book_club_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."book_club_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_club_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "role" character varying(50) DEFAULT 'member'::character varying
);


ALTER TABLE "public"."book_club_members" OWNER TO "postgres";

--
-- Name: book_clubs; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."book_clubs" OWNER TO "postgres";

--
-- Name: book_genre_mappings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."book_genre_mappings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "genre_id" "uuid" NOT NULL
);


ALTER TABLE "public"."book_genre_mappings" OWNER TO "postgres";

--
-- Name: book_genres; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."book_genres" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."book_genres" OWNER TO "postgres";

--
-- Name: book_id_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."book_id_mapping" (
    "old_id" integer NOT NULL,
    "new_id" "uuid" NOT NULL,
    "match_method" "text" NOT NULL
);


ALTER TABLE "public"."book_id_mapping" OWNER TO "postgres";

--
-- Name: book_popularity_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."book_popularity_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "views_count" integer DEFAULT 0,
    "reviews_count" integer DEFAULT 0,
    "avg_rating" numeric(3,2),
    "reading_progress_count" integer DEFAULT 0,
    "reading_list_count" integer DEFAULT 0,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."book_popularity_metrics" OWNER TO "postgres";

--
-- Name: TABLE "book_popularity_metrics"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."book_popularity_metrics" IS 'Aggregated book popularity metrics for recommendations';


--
-- Name: book_popularity_analytics; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."book_popularity_analytics" AS
 SELECT "b"."id",
    "b"."title",
    "b"."author",
    "bpm"."views_count",
    "bpm"."reviews_count",
    "bpm"."avg_rating",
    "bpm"."reading_progress_count",
    "bpm"."reading_list_count",
    "bpm"."last_updated",
    "rank"() OVER (ORDER BY "bpm"."views_count" DESC) AS "popularity_rank",
    "rank"() OVER (ORDER BY "bpm"."avg_rating" DESC NULLS LAST) AS "rating_rank"
   FROM ("public"."books" "b"
     LEFT JOIN "public"."book_popularity_metrics" "bpm" ON (("b"."id" = "bpm"."book_id")))
  WHERE ("bpm"."book_id" IS NOT NULL);


ALTER TABLE "public"."book_popularity_analytics" OWNER TO "postgres";

--
-- Name: book_popularity_summary; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW "public"."book_popularity_summary" AS
 SELECT "b"."id" AS "book_id",
    "b"."title",
    "b"."author",
    "b"."average_rating",
    "b"."review_count",
    "count"("rp"."id") AS "total_reading_entries",
    "count"(DISTINCT "rp"."user_id") AS "unique_readers",
    "count"(
        CASE
            WHEN ("rp"."status" = 'completed'::"text") THEN 1
            ELSE NULL::integer
        END) AS "completed_reads",
    "count"(
        CASE
            WHEN ("rp"."status" = 'in_progress'::"text") THEN 1
            ELSE NULL::integer
        END) AS "active_reads",
    "avg"("rp"."progress_percentage") AS "avg_progress",
    "b"."created_at",
    "b"."updated_at"
   FROM ("public"."books" "b"
     LEFT JOIN "public"."reading_progress" "rp" ON (("b"."id" = "rp"."book_id")))
  GROUP BY "b"."id", "b"."title", "b"."author", "b"."average_rating", "b"."review_count", "b"."created_at", "b"."updated_at"
  WITH NO DATA;


ALTER TABLE "public"."book_popularity_summary" OWNER TO "postgres";

--
-- Name: MATERIALIZED VIEW "book_popularity_summary"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON MATERIALIZED VIEW "public"."book_popularity_summary" IS 'Cached book popularity data for performance';


--
-- Name: book_publishers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."book_publishers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "publisher_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."book_publishers" OWNER TO "postgres";

--
-- Name: book_recommendations; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."book_recommendations" OWNER TO "postgres";

--
-- Name: book_similarity_scores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."book_similarity_scores" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid",
    "similar_book_id" "uuid",
    "similarity_score" double precision,
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."book_similarity_scores" OWNER TO "postgres";

--
-- Name: book_subjects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."book_subjects" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."book_subjects" OWNER TO "postgres";

--
-- Name: book_tag_mappings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."book_tag_mappings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."book_tag_mappings" OWNER TO "postgres";

--
-- Name: book_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."book_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."book_tags" OWNER TO "postgres";

--
-- Name: carousel_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."carousel_images" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "carousel_name" character varying,
    "image_url" "text",
    "alt_text" character varying,
    "position" integer,
    "active" boolean
);


ALTER TABLE "public"."carousel_images" OWNER TO "postgres";

--
-- Name: collaborative_filtering_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."collaborative_filtering_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "item_id" "uuid",
    "item_type" "text" NOT NULL,
    "interaction_type" "text" NOT NULL,
    "interaction_strength" numeric(3,2) DEFAULT 1.0,
    "interaction_timestamp" timestamp with time zone DEFAULT "now"(),
    "context_data" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "collaborative_filtering_data_interaction_type_check" CHECK (("interaction_type" = ANY (ARRAY['view'::"text", 'like'::"text", 'share'::"text", 'comment'::"text", 'read'::"text", 'purchase'::"text"]))),
    CONSTRAINT "collaborative_filtering_data_item_type_check" CHECK (("item_type" = ANY (ARRAY['book'::"text", 'author'::"text", 'publisher'::"text", 'event'::"text"])))
);


ALTER TABLE "public"."collaborative_filtering_data" OWNER TO "postgres";

--
-- Name: TABLE "collaborative_filtering_data"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."collaborative_filtering_data" IS 'User interaction data for collaborative filtering';


--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."comments" OWNER TO "postgres";

--
-- Name: TABLE "comments"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."comments" IS 'Comments on feed entries';


--
-- Name: COLUMN "comments"."user_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."comments"."user_id" IS 'User who made the comment';


--
-- Name: COLUMN "comments"."feed_entry_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."comments"."feed_entry_id" IS 'Feed entry being commented on';


--
-- Name: contact_info; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."contact_info" OWNER TO "postgres";

--
-- Name: content_features; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."content_features" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid" NOT NULL,
    "content_type" "text" NOT NULL,
    "feature_name" "text" NOT NULL,
    "feature_value" "jsonb" NOT NULL,
    "feature_importance" numeric(5,4),
    "last_updated" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "content_features_content_type_check" CHECK (("content_type" = ANY (ARRAY['book'::"text", 'author'::"text", 'publisher'::"text", 'event'::"text"])))
);


ALTER TABLE "public"."content_features" OWNER TO "postgres";

--
-- Name: TABLE "content_features"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."content_features" IS 'Content features for content-based recommendation systems';


--
-- Name: content_generation_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."content_generation_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_type" "text" NOT NULL,
    "input_parameters" "jsonb" NOT NULL,
    "generation_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "generated_content" "text",
    "content_metadata" "jsonb",
    "quality_score" numeric(3,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "created_by" "uuid",
    CONSTRAINT "content_generation_jobs_content_type_check" CHECK (("content_type" = ANY (ARRAY['book_summary'::"text", 'author_bio'::"text", 'review_analysis'::"text", 'recommendation_text'::"text", 'event_description'::"text"]))),
    CONSTRAINT "content_generation_jobs_generation_status_check" CHECK (("generation_status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."content_generation_jobs" OWNER TO "postgres";

--
-- Name: TABLE "content_generation_jobs"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."content_generation_jobs" IS 'AI-powered content generation jobs and results';


--
-- Name: countries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."countries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "phone_code" "text",
    "continent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."countries" OWNER TO "postgres";

--
-- Name: custom_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."custom_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "target_user_id" "uuid" NOT NULL,
    "permission_type" "text" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "custom_permissions_permission_type_check" CHECK (("permission_type" = ANY (ARRAY['view_reading_progress'::"text", 'view_reading_stats'::"text", 'view_reading_history'::"text"])))
);


ALTER TABLE "public"."custom_permissions" OWNER TO "postgres";

--
-- Name: TABLE "custom_permissions"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."custom_permissions" IS 'Granular permissions for specific users to view reading progress';


--
-- Name: data_consistency_monitoring; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."data_consistency_monitoring" AS
 SELECT 'Books without publishers'::"text" AS "issue_type",
    "count"(*) AS "issue_count",
        CASE
            WHEN ("count"(*) > 100) THEN 'CRITICAL'::"text"
            WHEN ("count"(*) > 10) THEN 'WARNING'::"text"
            ELSE 'INFO'::"text"
        END AS "severity"
   FROM "public"."books"
  WHERE ("books"."publisher_id" IS NULL)
UNION ALL
 SELECT 'Orphaned reading progress'::"text" AS "issue_type",
    "count"(*) AS "issue_count",
        CASE
            WHEN ("count"(*) > 50) THEN 'CRITICAL'::"text"
            WHEN ("count"(*) > 10) THEN 'WARNING'::"text"
            ELSE 'INFO'::"text"
        END AS "severity"
   FROM "public"."reading_progress" "rp"
  WHERE ((NOT (EXISTS ( SELECT 1
           FROM "auth"."users" "u"
          WHERE ("u"."id" = "rp"."user_id")))) OR (NOT (EXISTS ( SELECT 1
           FROM "public"."books" "b"
          WHERE ("b"."id" = "rp"."book_id")))))
UNION ALL
 SELECT 'Invalid publication dates'::"text" AS "issue_type",
    "count"(*) AS "issue_count",
        CASE
            WHEN ("count"(*) > 20) THEN 'CRITICAL'::"text"
            WHEN ("count"(*) > 5) THEN 'WARNING'::"text"
            ELSE 'INFO'::"text"
        END AS "severity"
   FROM "public"."books"
  WHERE ("books"."publication_date" > CURRENT_DATE)
UNION ALL
 SELECT 'Invalid progress percentages'::"text" AS "issue_type",
    "count"(*) AS "issue_count",
        CASE
            WHEN ("count"(*) > 30) THEN 'CRITICAL'::"text"
            WHEN ("count"(*) > 10) THEN 'WARNING'::"text"
            ELSE 'INFO'::"text"
        END AS "severity"
   FROM "public"."reading_progress"
  WHERE (("reading_progress"."progress_percentage" < 0) OR ("reading_progress"."progress_percentage" > 100));


ALTER TABLE "public"."data_consistency_monitoring" OWNER TO "postgres";

--
-- Name: VIEW "data_consistency_monitoring"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW "public"."data_consistency_monitoring" IS 'Real-time data consistency monitoring';


--
-- Name: data_enrichment_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."data_enrichment_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "target_table" "text" NOT NULL,
    "target_column" "text" NOT NULL,
    "enrichment_type" "text" NOT NULL,
    "enrichment_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "records_processed" integer DEFAULT 0,
    "records_updated" integer DEFAULT 0,
    "enrichment_config" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "created_by" "uuid",
    CONSTRAINT "data_enrichment_jobs_enrichment_status_check" CHECK (("enrichment_status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"]))),
    CONSTRAINT "data_enrichment_jobs_enrichment_type_check" CHECK (("enrichment_type" = ANY (ARRAY['author_info'::"text", 'book_details'::"text", 'publisher_data'::"text", 'genre_classification'::"text", 'similarity_scoring'::"text"])))
);


ALTER TABLE "public"."data_enrichment_jobs" OWNER TO "postgres";

--
-- Name: TABLE "data_enrichment_jobs"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."data_enrichment_jobs" IS 'Intelligent data enrichment and processing jobs';


--
-- Name: dewey_decimal_classifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."dewey_decimal_classifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "description" "text" NOT NULL,
    "parent_code" "text",
    "level" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."dewey_decimal_classifications" OWNER TO "postgres";

--
-- Name: TABLE "dewey_decimal_classifications"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."dewey_decimal_classifications" IS 'Dewey Decimal Classification system';


--
-- Name: discussion_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."discussion_comments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "discussion_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."discussion_comments" OWNER TO "postgres";

--
-- Name: discussions; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."discussions" OWNER TO "postgres";

--
-- Name: enterprise_audit_trail; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."enterprise_audit_trail" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "operation" "text" NOT NULL,
    "old_values" "jsonb",
    "new_values" "jsonb",
    "changed_by" "uuid" NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "session_id" "text",
    "transaction_id" "text",
    "application_version" "text",
    "environment" "text" DEFAULT 'production'::"text",
    CONSTRAINT "enterprise_audit_trail_operation_check" CHECK (("operation" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text", 'TRUNCATE'::"text"])))
);


ALTER TABLE "public"."enterprise_audit_trail" OWNER TO "postgres";

--
-- Name: TABLE "enterprise_audit_trail"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."enterprise_audit_trail" IS 'Enterprise audit trail for all data changes with full context';


--
-- Name: enterprise_audit_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."enterprise_audit_summary" AS
 SELECT "enterprise_audit_trail"."table_name",
    "enterprise_audit_trail"."operation",
    "count"(*) AS "operation_count",
    "count"(DISTINCT "enterprise_audit_trail"."changed_by") AS "unique_users",
    "min"("enterprise_audit_trail"."changed_at") AS "first_operation",
    "max"("enterprise_audit_trail"."changed_at") AS "last_operation"
   FROM "public"."enterprise_audit_trail"
  WHERE ("enterprise_audit_trail"."changed_at" >= ("now"() - '30 days'::interval))
  GROUP BY "enterprise_audit_trail"."table_name", "enterprise_audit_trail"."operation"
  ORDER BY "enterprise_audit_trail"."table_name", "enterprise_audit_trail"."operation";


ALTER TABLE "public"."enterprise_audit_summary" OWNER TO "postgres";

--
-- Name: enterprise_data_lineage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."enterprise_data_lineage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_table" "text" NOT NULL,
    "source_column" "text",
    "target_table" "text" NOT NULL,
    "target_column" "text",
    "transformation_type" "text" NOT NULL,
    "transformation_logic" "text",
    "data_flow_description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "enterprise_data_lineage_transformation_type_check" CHECK (("transformation_type" = ANY (ARRAY['DIRECT'::"text", 'AGGREGATED'::"text", 'TRANSFORMED'::"text", 'DERIVED'::"text"])))
);


ALTER TABLE "public"."enterprise_data_lineage" OWNER TO "postgres";

--
-- Name: TABLE "enterprise_data_lineage"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."enterprise_data_lineage" IS 'Data lineage tracking for enterprise data governance';


--
-- Name: enterprise_data_quality_dashboard; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."enterprise_data_quality_dashboard" AS
 SELECT "t"."table_name",
    "t"."total_rules",
    "t"."passed_rules",
    "t"."failed_rules",
    "t"."critical_issues",
    "t"."overall_score",
        CASE
            WHEN ("t"."overall_score" >= (95)::numeric) THEN 'EXCELLENT'::"text"
            WHEN ("t"."overall_score" >= (85)::numeric) THEN 'GOOD'::"text"
            WHEN ("t"."overall_score" >= (70)::numeric) THEN 'FAIR'::"text"
            ELSE 'POOR'::"text"
        END AS "quality_status"
   FROM "public"."get_data_quality_report"() "t"("table_name", "total_rules", "passed_rules", "failed_rules", "critical_issues", "overall_score");


ALTER TABLE "public"."enterprise_data_quality_dashboard" OWNER TO "postgres";

--
-- Name: enterprise_data_quality_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."enterprise_data_quality_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rule_name" "text" NOT NULL,
    "table_name" "text" NOT NULL,
    "column_name" "text",
    "rule_type" "text" NOT NULL,
    "rule_definition" "text" NOT NULL,
    "severity" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "enterprise_data_quality_rules_rule_type_check" CHECK (("rule_type" = ANY (ARRAY['NOT_NULL'::"text", 'UNIQUE'::"text", 'FOREIGN_KEY'::"text", 'CHECK'::"text", 'CUSTOM'::"text"]))),
    CONSTRAINT "enterprise_data_quality_rules_severity_check" CHECK (("severity" = ANY (ARRAY['LOW'::"text", 'MEDIUM'::"text", 'HIGH'::"text", 'CRITICAL'::"text"])))
);


ALTER TABLE "public"."enterprise_data_quality_rules" OWNER TO "postgres";

--
-- Name: TABLE "enterprise_data_quality_rules"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."enterprise_data_quality_rules" IS 'Data quality rules for enterprise data validation';


--
-- Name: enterprise_data_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."enterprise_data_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "version_number" integer NOT NULL,
    "data_snapshot" "jsonb" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "change_reason" "text",
    "is_current" boolean DEFAULT true
);


ALTER TABLE "public"."enterprise_data_versions" OWNER TO "postgres";

--
-- Name: TABLE "enterprise_data_versions"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."enterprise_data_versions" IS 'Data versioning for tracking changes over time';


--
-- Name: entity_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."entity_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "entity_category" "text"
);


ALTER TABLE "public"."entity_types" OWNER TO "postgres";

--
-- Name: TABLE "entity_types"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."entity_types" IS 'Centralized entity type definitions for enterprise-grade entity management';


--
-- Name: COLUMN "entity_types"."entity_category"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."entity_types"."entity_category" IS 'Entity category for grouping and permissions';


--
-- Name: images; Type: TABLE; Schema: public; Owner: postgres
--

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
    "entity_type_id" "uuid"
);


ALTER TABLE "public"."images" OWNER TO "postgres";

--
-- Name: entity_image_analytics; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."entity_image_analytics" AS
 SELECT "et"."name" AS "entity_type_name",
    "et"."entity_category",
    "count"("i"."id") AS "total_images",
    "count"(DISTINCT "ai"."entity_id") AS "unique_entities",
    "avg"("i"."file_size") AS "avg_file_size",
    "sum"("i"."file_size") AS "total_storage_used",
    "min"("i"."created_at") AS "earliest_image",
    "max"("i"."created_at") AS "latest_image"
   FROM (("public"."images" "i"
     JOIN "public"."album_images" "ai" ON (("i"."id" = "ai"."image_id")))
     JOIN "public"."entity_types" "et" ON (("i"."entity_type_id" = "et"."id")))
  WHERE ("i"."deleted_at" IS NULL)
  GROUP BY "et"."id", "et"."name", "et"."entity_category"
  ORDER BY ("count"("i"."id")) DESC;


ALTER TABLE "public"."entity_image_analytics" OWNER TO "postgres";

--
-- Name: VIEW "entity_image_analytics"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW "public"."entity_image_analytics" IS 'Enterprise analytics view for entity-based image usage and storage';


--
-- Name: event_analytics; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."event_analytics" OWNER TO "postgres";

--
-- Name: event_approvals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."event_approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "submitted_by" "uuid" NOT NULL,
    "approval_status" "text",
    "reviewer_id" "uuid",
    "review_notes" "text",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_approvals" OWNER TO "postgres";

--
-- Name: event_books; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."event_books" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "feature_type" "text",
    "display_order" integer,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid" NOT NULL
);


ALTER TABLE "public"."event_books" OWNER TO "postgres";

--
-- Name: event_calendar_exports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."event_calendar_exports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "calendar_type" "text",
    "calendar_event_id" "text",
    "synced_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_calendar_exports" OWNER TO "postgres";

--
-- Name: event_categories; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."event_categories" OWNER TO "postgres";

--
-- Name: event_chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."event_chat_messages" OWNER TO "postgres";

--
-- Name: event_chat_rooms; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."event_chat_rooms" OWNER TO "postgres";

--
-- Name: event_comments; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."event_comments" OWNER TO "postgres";

--
-- Name: event_creator_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."event_creator_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "permission_level" "text",
    "can_create_paid_events" boolean DEFAULT false,
    "attendee_limit" integer DEFAULT 100,
    "requires_approval" boolean DEFAULT true,
    "approved_categories" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_creator_permissions" OWNER TO "postgres";

--
-- Name: event_financials; Type: TABLE; Schema: public; Owner: postgres
--

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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_financials" OWNER TO "postgres";

--
-- Name: event_interests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."event_interests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "interest_level" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_interests" OWNER TO "postgres";

--
-- Name: event_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."event_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_likes" OWNER TO "postgres";

--
-- Name: event_livestreams; Type: TABLE; Schema: public; Owner: postgres
--

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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_livestreams" OWNER TO "postgres";

--
-- Name: event_locations; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."event_locations" OWNER TO "postgres";

--
-- Name: event_media; Type: TABLE; Schema: public; Owner: postgres
--

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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_media" OWNER TO "postgres";

--
-- Name: event_permission_requests; Type: TABLE; Schema: public; Owner: postgres
--

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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_permission_requests" OWNER TO "postgres";

--
-- Name: event_questions; Type: TABLE; Schema: public; Owner: postgres
--

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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_questions" OWNER TO "postgres";

--
-- Name: event_registrations; Type: TABLE; Schema: public; Owner: postgres
--

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
    "session_ids" "uuid"[] DEFAULT '{}'::"uuid"[]
);


ALTER TABLE "public"."event_registrations" OWNER TO "postgres";

--
-- Name: event_reminders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."event_reminders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reminder_time" timestamp with time zone NOT NULL,
    "notification_sent" boolean DEFAULT false,
    "notification_time" timestamp with time zone,
    "reminder_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_reminders" OWNER TO "postgres";

--
-- Name: event_sessions; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."event_sessions" OWNER TO "postgres";

--
-- Name: event_shares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."event_shares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "share_platform" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_shares" OWNER TO "postgres";

--
-- Name: event_speakers; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."event_speakers" OWNER TO "postgres";

--
-- Name: event_sponsors; Type: TABLE; Schema: public; Owner: postgres
--

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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_sponsors" OWNER TO "postgres";

--
-- Name: event_staff; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."event_staff" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text",
    "permissions" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_staff" OWNER TO "postgres";

--
-- Name: event_surveys; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."event_surveys" OWNER TO "postgres";

--
-- Name: event_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."event_tags" (
    "event_id" "uuid" NOT NULL,
    "tag_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_tags" OWNER TO "postgres";

--
-- Name: event_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."event_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_types" OWNER TO "postgres";

--
-- Name: event_views; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."event_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "ip_address" "text",
    "viewed_at" timestamp with time zone DEFAULT "now"(),
    "user_agent" "text",
    "referrer" "text"
);


ALTER TABLE "public"."event_views" OWNER TO "postgres";

--
-- Name: event_waitlists; Type: TABLE; Schema: public; Owner: postgres
--

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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_waitlists" OWNER TO "postgres";

--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

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
    "publisher_id" "uuid"
);


ALTER TABLE "public"."events" OWNER TO "postgres";

--
-- Name: feed_entries; Type: TABLE; Schema: public; Owner: postgres
--

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
    "is_deleted" boolean DEFAULT false NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid"
);


ALTER TABLE "public"."feed_entries" OWNER TO "postgres";

--
-- Name: TABLE "feed_entries"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."feed_entries" IS 'User activity feed entries';


--
-- Name: COLUMN "feed_entries"."entity_type"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."feed_entries"."entity_type" IS 'Type of entity this feed entry relates to (book, author, event, etc.)';


--
-- Name: COLUMN "feed_entries"."entity_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."feed_entries"."entity_id" IS 'ID of the entity this feed entry relates to';


--
-- Name: feed_entry_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."feed_entry_tags" (
    "feed_entry_id" "uuid" NOT NULL,
    "tag_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feed_entry_tags" OWNER TO "postgres";

--
-- Name: follow_target_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."follow_target_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."follow_target_types" OWNER TO "postgres";

--
-- Name: follows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."follows" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "target_type_id_uuid_temp" "uuid",
    "target_type_id" "uuid"
);


ALTER TABLE "public"."follows" OWNER TO "postgres";

--
-- Name: TABLE "follows"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."follows" IS 'Follows table - allows following users, books, authors, publishers, and groups. following_id can reference any entity type.';


--
-- Name: COLUMN "follows"."following_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."follows"."following_id" IS 'ID of the entity being followed (can be user, book, author, etc.)';


--
-- Name: COLUMN "follows"."target_type_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."follows"."target_type_id" IS 'Reference to follow_target_types table to specify entity type';


--
-- Name: format_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."format_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL
);


ALTER TABLE "public"."format_types" OWNER TO "postgres";

--
-- Name: friends; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."friends" OWNER TO "postgres";

--
-- Name: group_achievements; Type: TABLE; Schema: public; Owner: postgres
--

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
    "type" "text"
);


ALTER TABLE "public"."group_achievements" OWNER TO "postgres";

--
-- Name: group_analytics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "metric_name" "text" NOT NULL,
    "metric_value" numeric,
    "recorded_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_analytics" OWNER TO "postgres";

--
-- Name: group_announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "content" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_pinned" boolean DEFAULT false
);


ALTER TABLE "public"."group_announcements" OWNER TO "postgres";

--
-- Name: group_audit_log; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."group_audit_log" OWNER TO "postgres";

--
-- Name: group_author_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_author_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "event_id" "uuid",
    "scheduled_at" timestamp with time zone,
    "author_id" "uuid"
);


ALTER TABLE "public"."group_author_events" OWNER TO "postgres";

--
-- Name: group_book_list_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_book_list_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "list_id" "uuid",
    "added_by" "uuid",
    "added_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid"
);


ALTER TABLE "public"."group_book_list_items" OWNER TO "postgres";

--
-- Name: group_book_lists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_book_lists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "description" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_book_lists" OWNER TO "postgres";

--
-- Name: group_book_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_book_reviews" (
    "id" "uuid" NOT NULL,
    "group_id" "uuid",
    "book_id" "uuid",
    "user_id" "uuid",
    "rating" integer,
    "review" "text",
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."group_book_reviews" OWNER TO "postgres";

--
-- Name: group_book_swaps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_book_swaps" (
    "id" "uuid" NOT NULL,
    "group_id" "uuid",
    "book_id" "uuid",
    "offered_by" "uuid",
    "status" "text",
    "accepted_by" "uuid",
    "created_at" timestamp with time zone,
    "accepted_at" timestamp with time zone
);


ALTER TABLE "public"."group_book_swaps" OWNER TO "postgres";

--
-- Name: group_book_wishlist_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_book_wishlist_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "wishlist_id" "uuid",
    "added_by" "uuid",
    "added_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid"
);


ALTER TABLE "public"."group_book_wishlist_items" OWNER TO "postgres";

--
-- Name: group_book_wishlists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_book_wishlists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_book_wishlists" OWNER TO "postgres";

--
-- Name: group_bots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_bots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "name" "text",
    "description" "text",
    "config" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_bots" OWNER TO "postgres";

--
-- Name: group_chat_channels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_chat_channels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "name" "text",
    "description" "text",
    "is_event_channel" boolean DEFAULT false,
    "event_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_chat_channels" OWNER TO "postgres";

--
-- Name: group_chat_message_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_chat_message_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "uuid",
    "url" "text",
    "file_type" "text",
    "file_size" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_chat_message_attachments" OWNER TO "postgres";

--
-- Name: group_chat_message_reactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_chat_message_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "uuid",
    "user_id" "uuid",
    "reaction" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_chat_message_reactions" OWNER TO "postgres";

--
-- Name: group_chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "channel_id" "uuid",
    "user_id" "uuid",
    "message" "text",
    "is_hidden" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_chat_messages" OWNER TO "postgres";

--
-- Name: group_content_moderation_logs; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."group_content_moderation_logs" OWNER TO "postgres";

--
-- Name: group_custom_fields; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_custom_fields" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "field_name" "text",
    "field_type" "text",
    "field_options" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_custom_fields" OWNER TO "postgres";

--
-- Name: group_discussion_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_discussion_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_discussion_categories" OWNER TO "postgres";

--
-- Name: group_event_feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_event_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid",
    "group_id" "uuid",
    "user_id" "uuid",
    "rating" integer,
    "feedback" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_event_feedback" OWNER TO "postgres";

--
-- Name: group_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "event_id" "uuid",
    "is_recurring" boolean DEFAULT false,
    "recurrence_pattern" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "chat_channel_id" "uuid"
);


ALTER TABLE "public"."group_events" OWNER TO "postgres";

--
-- Name: group_integrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "type" "text",
    "config" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_integrations" OWNER TO "postgres";

--
-- Name: group_invites; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."group_invites" OWNER TO "postgres";

--
-- Name: group_leaderboards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_leaderboards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "leaderboard_type" "text",
    "data" "jsonb",
    "generated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_leaderboards" OWNER TO "postgres";

--
-- Name: group_member_achievements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_member_achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "achievement_id" "uuid" NOT NULL,
    "earned_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_member_achievements" OWNER TO "postgres";

--
-- Name: group_member_devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_member_devices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "user_id" "uuid",
    "device_token" "text",
    "device_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_member_devices" OWNER TO "postgres";

--
-- Name: group_member_streaks; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."group_member_streaks" OWNER TO "postgres";

--
-- Name: group_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_members" (
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role_id" integer,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "joined_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."group_members" OWNER TO "postgres";

--
-- Name: group_membership_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_membership_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "is_required" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_membership_questions" OWNER TO "postgres";

--
-- Name: group_moderation_logs; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."group_moderation_logs" OWNER TO "postgres";

--
-- Name: group_onboarding_checklists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_onboarding_checklists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_onboarding_checklists" OWNER TO "postgres";

--
-- Name: group_onboarding_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_onboarding_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "checklist_id" "uuid",
    "user_id" "uuid",
    "task_id" "uuid",
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."group_onboarding_progress" OWNER TO "postgres";

--
-- Name: group_onboarding_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_onboarding_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "checklist_id" "uuid",
    "task" "text",
    "order_index" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_onboarding_tasks" OWNER TO "postgres";

--
-- Name: group_poll_votes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_poll_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "poll_id" "uuid",
    "user_id" "uuid",
    "option_index" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_poll_votes" OWNER TO "postgres";

--
-- Name: group_polls; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."group_polls" OWNER TO "postgres";

--
-- Name: group_reading_challenge_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_reading_challenge_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "challenge_id" "uuid",
    "user_id" "uuid",
    "books_read" integer DEFAULT 0,
    "progress_details" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_reading_challenge_progress" OWNER TO "postgres";

--
-- Name: group_reading_challenges; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."group_reading_challenges" OWNER TO "postgres";

--
-- Name: group_reading_progress; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."group_reading_progress" OWNER TO "postgres";

--
-- Name: group_reading_sessions; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."group_reading_sessions" OWNER TO "postgres";

--
-- Name: group_reports; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."group_reports" OWNER TO "postgres";

--
-- Name: group_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "permissions" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_default" boolean DEFAULT false
);


ALTER TABLE "public"."group_roles" OWNER TO "postgres";

--
-- Name: group_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "order_index" integer
);


ALTER TABLE "public"."group_rules" OWNER TO "postgres";

--
-- Name: group_shared_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_shared_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "content" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."group_shared_documents" OWNER TO "postgres";

--
-- Name: group_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_tags" OWNER TO "postgres";

--
-- Name: group_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "display_name" "text" NOT NULL,
    "slug" "text" NOT NULL
);


ALTER TABLE "public"."group_types" OWNER TO "postgres";

--
-- Name: group_webhook_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_webhook_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "webhook_id" "uuid",
    "event_type" "text",
    "payload" "jsonb",
    "status" "text",
    "response_code" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_webhook_logs" OWNER TO "postgres";

--
-- Name: group_webhooks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_webhooks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "url" "text",
    "event_types" "text"[],
    "secret" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_webhooks" OWNER TO "postgres";

--
-- Name: group_welcome_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."group_welcome_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "role_id" integer,
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_welcome_messages" OWNER TO "postgres";

--
-- Name: groups; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."groups" OWNER TO "postgres";

--
-- Name: id_mappings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."id_mappings" (
    "table_name" "text" NOT NULL,
    "old_id" integer NOT NULL,
    "new_id" "uuid" NOT NULL
);


ALTER TABLE "public"."id_mappings" OWNER TO "postgres";

--
-- Name: image_tag_mappings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."image_tag_mappings" (
    "image_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."image_tag_mappings" OWNER TO "postgres";

--
-- Name: image_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."image_tags" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "slug" character varying(100) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."image_tags" OWNER TO "postgres";

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";

--
-- Name: likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "feed_entry_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."likes" OWNER TO "postgres";

--
-- Name: TABLE "likes"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."likes" IS 'User likes on feed entries';


--
-- Name: COLUMN "likes"."user_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."likes"."user_id" IS 'User who liked the feed entry';


--
-- Name: COLUMN "likes"."feed_entry_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."likes"."feed_entry_id" IS 'Feed entry being liked';


--
-- Name: list_followers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."list_followers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "list_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."list_followers" OWNER TO "postgres";

--
-- Name: media_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."media_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feed_entry_id" "uuid",
    "url" "text" NOT NULL,
    "type" "text",
    "alt_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."media_attachments" OWNER TO "postgres";

--
-- Name: mentions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."mentions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feed_entry_id" "uuid",
    "comment_id" "uuid",
    "mentioned_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mentions" OWNER TO "postgres";

--
-- Name: ml_models; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."ml_models" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "model_name" "text" NOT NULL,
    "model_version" "text" NOT NULL,
    "model_type" "text" NOT NULL,
    "model_parameters" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "training_data_snapshot" "jsonb",
    "model_metrics" "jsonb",
    "model_file_path" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "ml_models_model_type_check" CHECK (("model_type" = ANY (ARRAY['recommendation'::"text", 'classification'::"text", 'regression'::"text", 'clustering'::"text", 'nlp'::"text"])))
);


ALTER TABLE "public"."ml_models" OWNER TO "postgres";

--
-- Name: TABLE "ml_models"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."ml_models" IS 'AI/ML model registry for enterprise-grade machine learning capabilities';


--
-- Name: ml_predictions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."ml_predictions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "model_id" "uuid",
    "user_id" "uuid",
    "input_data" "jsonb" NOT NULL,
    "prediction_result" "jsonb" NOT NULL,
    "confidence_score" numeric(5,4),
    "prediction_timestamp" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."ml_predictions" OWNER TO "postgres";

--
-- Name: TABLE "ml_predictions"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."ml_predictions" IS 'Stores AI/ML prediction results and confidence scores';


--
-- Name: ml_training_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."ml_training_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "model_id" "uuid",
    "job_name" "text" NOT NULL,
    "job_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "training_config" "jsonb" NOT NULL,
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "progress_percentage" integer DEFAULT 0,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ml_training_jobs_job_status_check" CHECK (("job_status" = ANY (ARRAY['pending'::"text", 'running'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."ml_training_jobs" OWNER TO "postgres";

--
-- Name: TABLE "ml_training_jobs"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."ml_training_jobs" IS 'Tracks AI/ML model training jobs and their status';


--
-- Name: nlp_analysis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."nlp_analysis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid",
    "content_type" "text" NOT NULL,
    "analysis_type" "text" NOT NULL,
    "original_text" "text" NOT NULL,
    "processed_text" "text",
    "analysis_results" "jsonb" NOT NULL,
    "confidence_score" numeric(5,4),
    "language_detected" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "nlp_analysis_analysis_type_check" CHECK (("analysis_type" = ANY (ARRAY['sentiment'::"text", 'topic'::"text", 'keyword'::"text", 'summary'::"text", 'translation'::"text"]))),
    CONSTRAINT "nlp_analysis_content_type_check" CHECK (("content_type" = ANY (ARRAY['book'::"text", 'review'::"text", 'comment'::"text", 'event'::"text", 'discussion'::"text"])))
);


ALTER TABLE "public"."nlp_analysis" OWNER TO "postgres";

--
-- Name: TABLE "nlp_analysis"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."nlp_analysis" IS 'Natural Language Processing analysis results';


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."notifications" OWNER TO "postgres";

--
-- Name: TABLE "notifications"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."notifications" IS 'User notifications';


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: postgres
--

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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_methods" OWNER TO "postgres";

--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: postgres
--

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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_transactions" OWNER TO "postgres";

--
-- Name: performance_dashboard; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."performance_dashboard" AS
 SELECT 'Query Performance'::"text" AS "category",
    "monitor_query_performance"."query_pattern" AS "metric",
    ("monitor_query_performance"."avg_execution_time")::"text" AS "value",
    "monitor_query_performance"."performance_status" AS "status"
   FROM "public"."monitor_query_performance"() "monitor_query_performance"("query_pattern", "avg_execution_time", "total_calls", "performance_status")
UNION ALL
 SELECT 'Table Performance'::"text" AS "category",
    "pg_tables"."tablename" AS "metric",
    "pg_size_pretty"("pg_total_relation_size"((((("pg_tables"."schemaname")::"text" || '.'::"text") || ("pg_tables"."tablename")::"text"))::"regclass")) AS "value",
        CASE
            WHEN ("pg_total_relation_size"((((("pg_tables"."schemaname")::"text" || '.'::"text") || ("pg_tables"."tablename")::"text"))::"regclass") > 1073741824) THEN 'WARNING'::"text"
            ELSE 'GOOD'::"text"
        END AS "status"
   FROM "pg_tables"
  WHERE ("pg_tables"."schemaname" = 'public'::"name")
UNION ALL
 SELECT 'Index Usage'::"text" AS "category",
    "pg_stat_user_indexes"."indexrelname" AS "metric",
    'Active'::"text" AS "value",
    'GOOD'::"text" AS "status"
   FROM "pg_stat_user_indexes"
  WHERE ("pg_stat_user_indexes"."schemaname" = 'public'::"name")
 LIMIT 10;


ALTER TABLE "public"."performance_dashboard" OWNER TO "postgres";

--
-- Name: performance_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."performance_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "metric_name" "text" NOT NULL,
    "metric_value" numeric NOT NULL,
    "metric_unit" "text",
    "category" "text" NOT NULL,
    "recorded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "additional_data" "jsonb"
);


ALTER TABLE "public"."performance_metrics" OWNER TO "postgres";

--
-- Name: TABLE "performance_metrics"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."performance_metrics" IS 'Application performance metrics for monitoring and optimization';


--
-- Name: personalized_recommendations; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."personalized_recommendations" OWNER TO "postgres";

--
-- Name: photo_album; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."photo_album" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "entity_id" integer NOT NULL,
    "entity_type" character varying(50) NOT NULL,
    "image_type_id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."photo_album" OWNER TO "postgres";

--
-- Name: photo_albums; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."photo_albums" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "cover_image_id" "uuid",
    "owner_id" "uuid" NOT NULL,
    "is_public" boolean DEFAULT false NOT NULL,
    "view_count" integer DEFAULT 0,
    "like_count" integer DEFAULT 0,
    "share_count" integer DEFAULT 0,
    "entity_id" "uuid",
    "entity_type" character varying(50),
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "entity_consistency" CHECK (((("entity_type" IS NULL) AND ("entity_id" IS NULL)) OR (("entity_type" IS NOT NULL) AND ("entity_id" IS NOT NULL)))),
    CONSTRAINT "valid_counts" CHECK ((("view_count" >= 0) AND ("like_count" >= 0) AND ("share_count" >= 0))),
    CONSTRAINT "valid_entity_type" CHECK ((("entity_type" IS NULL) OR (("entity_type")::"text" = ANY ((ARRAY['user'::character varying, 'publisher'::character varying, 'author'::character varying, 'group'::character varying])::"text"[])))),
    CONSTRAINT "valid_timestamps" CHECK (("updated_at" >= "created_at"))
);


ALTER TABLE "public"."photo_albums" OWNER TO "postgres";

--
-- Name: TABLE "photo_albums"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."photo_albums" IS 'Photo albums with privacy controls';


--
-- Name: COLUMN "photo_albums"."owner_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."photo_albums"."owner_id" IS 'Album owner user ID';


--
-- Name: COLUMN "photo_albums"."is_public"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."photo_albums"."is_public" IS 'Whether album is public';


--
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."posts" OWNER TO "postgres";

--
-- Name: prices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."prices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "price" numeric(10,2),
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "condition" character varying(50),
    "merchant" character varying(255),
    "total" numeric(10,2),
    "link" "text"
);


ALTER TABLE "public"."prices" OWNER TO "postgres";

--
-- Name: privacy_audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."privacy_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "target_user_id" "uuid",
    "permission_type" "text",
    "old_value" "jsonb",
    "new_value" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "privacy_audit_log_action_check" CHECK (("action" = ANY (ARRAY['grant_permission'::"text", 'revoke_permission'::"text", 'update_privacy_settings'::"text", 'view_reading_progress'::"text"])))
);


ALTER TABLE "public"."privacy_audit_log" OWNER TO "postgres";

--
-- Name: TABLE "privacy_audit_log"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."privacy_audit_log" IS 'Audit trail for all privacy-related actions and changes';


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "bio" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "role" character varying(50) DEFAULT 'user'::character varying NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";

--
-- Name: TABLE "profiles"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."profiles" IS 'Extended user profile information';


--
-- Name: COLUMN "profiles"."user_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."profiles"."user_id" IS 'Reference to user account';


--
-- Name: COLUMN "profiles"."bio"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."profiles"."bio" IS 'User biography text';


--
-- Name: COLUMN "profiles"."role"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."profiles"."role" IS 'User role (user, admin, moderator)';


--
-- Name: promo_codes; Type: TABLE; Schema: public; Owner: postgres
--

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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."promo_codes" OWNER TO "postgres";

--
-- Name: publishers; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."publishers" OWNER TO "postgres";

--
-- Name: TABLE "publishers"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."publishers" IS 'Book publishers information';


--
-- Name: publisher_summary; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW "public"."publisher_summary" AS
 SELECT "p"."id" AS "publisher_id",
    "p"."name" AS "publisher_name",
    "count"("b"."id") AS "total_books",
    "avg"("b"."average_rating") AS "avg_rating",
    "sum"("b"."review_count") AS "total_reviews",
    "count"("rp"."id") AS "total_reading_entries",
    "count"(DISTINCT "rp"."user_id") AS "unique_readers"
   FROM (("public"."publishers" "p"
     LEFT JOIN "public"."books" "b" ON (("p"."id" = "b"."publisher_id")))
     LEFT JOIN "public"."reading_progress" "rp" ON (("b"."id" = "rp"."book_id")))
  GROUP BY "p"."id", "p"."name"
  WITH NO DATA;


ALTER TABLE "public"."publisher_summary" OWNER TO "postgres";

--
-- Name: MATERIALIZED VIEW "publisher_summary"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON MATERIALIZED VIEW "public"."publisher_summary" IS 'Cached publisher data for performance';


--
-- Name: reactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "feed_entry_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reactions" OWNER TO "postgres";

--
-- Name: reading_challenges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."reading_challenges" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "year" integer NOT NULL,
    "target_books" integer NOT NULL,
    "books_read" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reading_challenges" OWNER TO "postgres";

--
-- Name: TABLE "reading_challenges"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."reading_challenges" IS 'Reading challenge participation';


--
-- Name: reading_goals; Type: TABLE; Schema: public; Owner: postgres
--

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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reading_goals" OWNER TO "postgres";

--
-- Name: reading_list_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."reading_list_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "list_id" "uuid" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text",
    "book_id" "uuid"
);


ALTER TABLE "public"."reading_list_items" OWNER TO "postgres";

--
-- Name: reading_series; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."reading_series" OWNER TO "postgres";

--
-- Name: reading_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."reading_sessions" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid",
    "book_id" "uuid",
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "pages_read" integer,
    "minutes_spent" integer,
    "notes" "text",
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."reading_sessions" OWNER TO "postgres";

--
-- Name: reading_stats_daily; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."reading_stats_daily" OWNER TO "postgres";

--
-- Name: reading_streaks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."reading_streaks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "days" integer NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reading_streaks" OWNER TO "postgres";

--
-- Name: review_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."review_likes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "review_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."review_likes" OWNER TO "postgres";

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "book_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "review_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."roles" OWNER TO "postgres";

--
-- Name: series_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."series_events" (
    "series_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "event_number" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."series_events" OWNER TO "postgres";

--
-- Name: session_registrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."session_registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "registration_status" "text",
    "registration_time" timestamp with time zone DEFAULT "now"(),
    "check_in_time" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."session_registrations" OWNER TO "postgres";

--
-- Name: similar_books; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."similar_books" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "similar_book_id" "uuid" NOT NULL,
    "similarity_score" numeric,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."similar_books" OWNER TO "postgres";

--
-- Name: smart_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."smart_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "notification_type" "text" NOT NULL,
    "notification_title" "text" NOT NULL,
    "notification_content" "text" NOT NULL,
    "priority_level" "text" DEFAULT 'normal'::"text" NOT NULL,
    "delivery_channel" "text" DEFAULT 'in_app'::"text" NOT NULL,
    "delivery_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "ai_generated" boolean DEFAULT false,
    "personalization_data" "jsonb" DEFAULT '{}'::"jsonb",
    "scheduled_for" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "smart_notifications_delivery_channel_check" CHECK (("delivery_channel" = ANY (ARRAY['in_app'::"text", 'email'::"text", 'push'::"text", 'sms'::"text"]))),
    CONSTRAINT "smart_notifications_delivery_status_check" CHECK (("delivery_status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'delivered'::"text", 'read'::"text", 'failed'::"text"]))),
    CONSTRAINT "smart_notifications_notification_type_check" CHECK (("notification_type" = ANY (ARRAY['recommendation'::"text", 'reminder'::"text", 'alert'::"text", 'update'::"text", 'social'::"text"]))),
    CONSTRAINT "smart_notifications_priority_level_check" CHECK (("priority_level" = ANY (ARRAY['low'::"text", 'normal'::"text", 'high'::"text", 'urgent'::"text"])))
);


ALTER TABLE "public"."smart_notifications" OWNER TO "postgres";

--
-- Name: TABLE "smart_notifications"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."smart_notifications" IS 'AI-powered intelligent notification system';


--
-- Name: statuses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."statuses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."statuses" OWNER TO "postgres";

--
-- Name: subjects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."subjects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "parent_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subjects" OWNER TO "postgres";

--
-- Name: survey_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."survey_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "survey_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "question_type" "text",
    "options" "jsonb",
    "is_required" boolean DEFAULT false,
    "display_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."survey_questions" OWNER TO "postgres";

--
-- Name: survey_responses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."survey_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "survey_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "registration_id" "uuid",
    "response_data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."survey_responses" OWNER TO "postgres";

--
-- Name: sync_state; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."sync_state" OWNER TO "postgres";

--
-- Name: system_performance_overview; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."system_performance_overview" AS
 SELECT "pm"."category",
    "pm"."metric_name",
    "avg"("pm"."metric_value") AS "avg_value",
    "max"("pm"."metric_value") AS "max_value",
    "min"("pm"."metric_value") AS "min_value",
    "count"(*) AS "measurement_count",
    "max"("pm"."recorded_at") AS "last_measured"
   FROM "public"."performance_metrics" "pm"
  WHERE ("pm"."recorded_at" >= ("now"() - '24:00:00'::interval))
  GROUP BY "pm"."category", "pm"."metric_name";


ALTER TABLE "public"."system_performance_overview" OWNER TO "postgres";

--
-- Name: tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tags" OWNER TO "postgres";

--
-- Name: ticket_benefits; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."ticket_benefits" OWNER TO "postgres";

--
-- Name: ticket_types; Type: TABLE; Schema: public; Owner: postgres
--

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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ticket_types" OWNER TO "postgres";

--
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tickets" OWNER TO "postgres";

--
-- Name: unified_book_data; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."unified_book_data" AS
 SELECT "b"."id",
    "b"."title",
    "b"."title_long",
    "b"."isbn10",
    "b"."isbn13",
    "b"."publication_date",
    "b"."binding",
    "b"."pages",
    "b"."list_price",
    "b"."language",
    "b"."edition",
    "b"."synopsis",
    "b"."overview",
    "b"."dimensions",
    "b"."weight",
    "b"."cover_image_id",
    "b"."original_image_url",
    "b"."author",
    "b"."featured",
    "b"."book_gallery_img",
    "b"."average_rating",
    "b"."review_count",
    "b"."created_at",
    "b"."updated_at",
    "b"."author_id",
    "b"."binding_type_id",
    "b"."format_type_id",
    "b"."status_id",
    "b"."publisher_id",
    "p"."name" AS "publisher_name",
    "p"."website" AS "publisher_website",
    "a"."name" AS "author_name",
    "a"."author_image_id",
    "bt"."name" AS "binding_type_name",
    "ft"."name" AS "format_type_name"
   FROM (((("public"."books" "b"
     LEFT JOIN "public"."publishers" "p" ON (("b"."publisher_id" = "p"."id")))
     LEFT JOIN "public"."authors" "a" ON (("b"."author_id" = "a"."id")))
     LEFT JOIN "public"."binding_types" "bt" ON (("b"."binding_type_id" = "bt"."id")))
     LEFT JOIN "public"."format_types" "ft" ON (("b"."format_type_id" = "ft"."id")));


ALTER TABLE "public"."unified_book_data" OWNER TO "postgres";

--
-- Name: unified_reading_progress; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."unified_reading_progress" AS
 SELECT "rp"."id",
    "rp"."user_id",
    "rp"."book_id",
    "rp"."status",
    "rp"."progress_percentage",
    "rp"."start_date",
    "rp"."finish_date",
    COALESCE("rp"."privacy_level", 'private'::"text") AS "privacy_level",
    COALESCE("rp"."allow_friends", false) AS "allow_friends",
    COALESCE("rp"."allow_followers", false) AS "allow_followers",
    "rp"."custom_permissions",
    "rp"."privacy_audit_log",
    "rp"."created_at",
    "rp"."updated_at"
   FROM "public"."reading_progress" "rp";


ALTER TABLE "public"."unified_reading_progress" OWNER TO "postgres";

--
-- Name: user_activity_metrics; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."user_activity_metrics" AS
 SELECT "ual"."user_id",
    "u"."email",
    "count"(*) AS "total_activities",
    "count"(
        CASE
            WHEN ("ual"."activity_type" = 'login'::"text") THEN 1
            ELSE NULL::integer
        END) AS "login_count",
    "count"(
        CASE
            WHEN ("ual"."activity_type" = 'book_view'::"text") THEN 1
            ELSE NULL::integer
        END) AS "book_views",
    "count"(
        CASE
            WHEN ("ual"."activity_type" = 'review'::"text") THEN 1
            ELSE NULL::integer
        END) AS "reviews",
    "avg"("ual"."response_time_ms") AS "avg_response_time",
    "max"("ual"."created_at") AS "last_activity",
    "min"("ual"."created_at") AS "first_activity"
   FROM ("public"."user_activity_log" "ual"
     JOIN "auth"."users" "u" ON (("ual"."user_id" = "u"."id")))
  GROUP BY "ual"."user_id", "u"."email";


ALTER TABLE "public"."user_activity_metrics" OWNER TO "postgres";

--
-- Name: user_activity_summary; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW "public"."user_activity_summary" AS
 SELECT "u"."id" AS "user_id",
    "u"."email",
    "count"("rp"."id") AS "total_reading_entries",
    "count"(DISTINCT "rp"."book_id") AS "unique_books_read",
    "count"(
        CASE
            WHEN ("rp"."status" = 'completed'::"text") THEN 1
            ELSE NULL::integer
        END) AS "books_completed",
    "count"(
        CASE
            WHEN ("rp"."status" = 'in_progress'::"text") THEN 1
            ELSE NULL::integer
        END) AS "books_in_progress",
    "avg"("rp"."progress_percentage") AS "avg_progress_percentage",
    "max"("rp"."created_at") AS "last_activity",
    "count"("f"."id") AS "total_follows",
    "count"("fr"."id") AS "total_friends"
   FROM ((("auth"."users" "u"
     LEFT JOIN "public"."reading_progress" "rp" ON (("u"."id" = "rp"."user_id")))
     LEFT JOIN "public"."follows" "f" ON (("u"."id" = "f"."follower_id")))
     LEFT JOIN "public"."friends" "fr" ON (("u"."id" = "fr"."user_id")))
  GROUP BY "u"."id", "u"."email"
  WITH NO DATA;


ALTER TABLE "public"."user_activity_summary" OWNER TO "postgres";

--
-- Name: MATERIALIZED VIEW "user_activity_summary"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON MATERIALIZED VIEW "public"."user_activity_summary" IS 'Cached user activity data for performance';


--
-- Name: user_book_interactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."user_book_interactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "interaction_type" "text" NOT NULL,
    "interaction_value" double precision,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid"
);


ALTER TABLE "public"."user_book_interactions" OWNER TO "postgres";

--
-- Name: user_engagement_analytics; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."user_engagement_analytics" AS
 SELECT "u"."id",
    "u"."email",
    "count"(DISTINCT "rp"."book_id") AS "books_in_progress",
    "count"(DISTINCT "br"."book_id") AS "books_reviewed",
    "count"(DISTINCT "rli"."book_id") AS "books_in_lists",
    "count"(DISTINCT "rl"."id") AS "reading_lists_created",
    "avg"("br"."rating") AS "avg_review_rating",
    "max"("ual"."created_at") AS "last_activity",
    "count"(DISTINCT "ual"."id") AS "total_activities"
   FROM ((((("auth"."users" "u"
     LEFT JOIN "public"."reading_progress" "rp" ON (("u"."id" = "rp"."user_id")))
     LEFT JOIN "public"."book_reviews" "br" ON (("u"."id" = "br"."user_id")))
     LEFT JOIN "public"."reading_lists" "rl" ON (("u"."id" = "rl"."user_id")))
     LEFT JOIN "public"."reading_list_items" "rli" ON (("rl"."id" = "rli"."list_id")))
     LEFT JOIN "public"."user_activity_log" "ual" ON (("u"."id" = "ual"."user_id")))
  GROUP BY "u"."id", "u"."email";


ALTER TABLE "public"."user_engagement_analytics" OWNER TO "postgres";

--
-- Name: user_friends; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."user_friends" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friend_id" "uuid" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "requested_at" timestamp with time zone DEFAULT "now"(),
    "responded_at" timestamp with time zone,
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_friends_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'declined'::"text", 'blocked'::"text"])))
);


ALTER TABLE "public"."user_friends" OWNER TO "postgres";

--
-- Name: user_privacy_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."user_privacy_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "default_privacy_level" "text" DEFAULT 'private'::"text" NOT NULL,
    "allow_friends_to_see_reading" boolean DEFAULT false NOT NULL,
    "allow_followers_to_see_reading" boolean DEFAULT false NOT NULL,
    "allow_public_reading_profile" boolean DEFAULT false NOT NULL,
    "show_reading_stats_publicly" boolean DEFAULT false NOT NULL,
    "show_currently_reading_publicly" boolean DEFAULT false NOT NULL,
    "show_reading_history_publicly" boolean DEFAULT false NOT NULL,
    "show_reading_goals_publicly" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_privacy_settings_default_privacy_level_check" CHECK (("default_privacy_level" = ANY (ARRAY['private'::"text", 'friends'::"text", 'followers'::"text", 'public'::"text"])))
);


ALTER TABLE "public"."user_privacy_settings" OWNER TO "postgres";

--
-- Name: TABLE "user_privacy_settings"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."user_privacy_settings" IS 'User privacy preferences and settings for reading progress visibility';


--
-- Name: user_privacy_overview; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."user_privacy_overview" AS
 SELECT "u"."id" AS "user_id",
    "u"."email",
    "ups"."default_privacy_level",
    "ups"."allow_public_reading_profile",
    "count"("cp"."id") AS "active_custom_permissions",
    "count"("pal"."id") AS "privacy_actions_last_30_days"
   FROM ((("auth"."users" "u"
     LEFT JOIN "public"."user_privacy_settings" "ups" ON (("u"."id" = "ups"."user_id")))
     LEFT JOIN "public"."custom_permissions" "cp" ON ((("u"."id" = "cp"."user_id") AND (("cp"."expires_at" IS NULL) OR ("cp"."expires_at" > "now"())))))
     LEFT JOIN "public"."privacy_audit_log" "pal" ON ((("u"."id" = "pal"."user_id") AND ("pal"."created_at" >= ("now"() - '30 days'::interval)))))
  GROUP BY "u"."id", "u"."email", "ups"."default_privacy_level", "ups"."allow_public_reading_profile";


ALTER TABLE "public"."user_privacy_overview" OWNER TO "postgres";

--
-- Name: user_reading_preferences; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."user_reading_preferences" OWNER TO "postgres";

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" character varying(255),
    "name" character varying(255),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "role_id" "uuid"
);


ALTER TABLE "public"."users" OWNER TO "postgres";

--
-- Name: TABLE "users"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."users" IS 'User accounts and basic information';


--
-- Name: COLUMN "users"."email"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."users"."email" IS 'User email address for authentication';


--
-- Name: COLUMN "users"."name"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."users"."name" IS 'User display name';


--
-- Name: COLUMN "users"."role_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."users"."role_id" IS 'Reference to user role for permissions';


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

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


ALTER TABLE "realtime"."messages" OWNER TO "supabase_realtime_admin";

--
-- Name: messages_2025_05_28; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

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


ALTER TABLE "realtime"."messages_2025_05_28" OWNER TO "supabase_admin";

--
-- Name: messages_2025_05_29; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

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


ALTER TABLE "realtime"."messages_2025_05_29" OWNER TO "supabase_admin";

--
-- Name: messages_2025_05_30; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

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


ALTER TABLE "realtime"."messages_2025_05_30" OWNER TO "supabase_admin";

--
-- Name: messages_2025_05_31; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

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


ALTER TABLE "realtime"."messages_2025_05_31" OWNER TO "supabase_admin";

--
-- Name: messages_2025_06_01; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

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


ALTER TABLE "realtime"."messages_2025_06_01" OWNER TO "supabase_admin";

--
-- Name: messages_2025_06_02; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

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


ALTER TABLE "realtime"."messages_2025_06_02" OWNER TO "supabase_admin";

--
-- Name: messages_2025_06_03; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

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


ALTER TABLE "realtime"."messages_2025_06_03" OWNER TO "supabase_admin";

--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE IF NOT EXISTS "realtime"."schema_migrations" (
    "version" bigint NOT NULL,
    "inserted_at" timestamp(0) without time zone
);


ALTER TABLE "realtime"."schema_migrations" OWNER TO "supabase_admin";

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE IF NOT EXISTS "realtime"."subscription" (
    "id" bigint NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "entity" "regclass" NOT NULL,
    "filters" "realtime"."user_defined_filter"[] DEFAULT '{}'::"realtime"."user_defined_filter"[] NOT NULL,
    "claims" "jsonb" NOT NULL,
    "claims_role" "regrole" GENERATED ALWAYS AS ("realtime"."to_regrole"(("claims" ->> 'role'::"text"))) STORED NOT NULL,
    "created_at" timestamp without time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "realtime"."subscription" OWNER TO "supabase_admin";

--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE "realtime"."subscription" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "realtime"."subscription_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

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


ALTER TABLE "storage"."buckets" OWNER TO "supabase_storage_admin";

--
-- Name: COLUMN "buckets"."owner"; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN "storage"."buckets"."owner" IS 'Field is deprecated, use owner_id instead';


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE IF NOT EXISTS "storage"."migrations" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "hash" character varying(40) NOT NULL,
    "executed_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "storage"."migrations" OWNER TO "supabase_storage_admin";

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

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


ALTER TABLE "storage"."objects" OWNER TO "supabase_storage_admin";

--
-- Name: COLUMN "objects"."owner"; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN "storage"."objects"."owner" IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

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


ALTER TABLE "storage"."s3_multipart_uploads" OWNER TO "supabase_storage_admin";

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

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


ALTER TABLE "storage"."s3_multipart_uploads_parts" OWNER TO "supabase_storage_admin";

--
-- Name: messages_2025_05_28; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2025_05_28" FOR VALUES FROM ('2025-05-28 00:00:00') TO ('2025-05-29 00:00:00');


--
-- Name: messages_2025_05_29; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2025_05_29" FOR VALUES FROM ('2025-05-29 00:00:00') TO ('2025-05-30 00:00:00');


--
-- Name: messages_2025_05_30; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2025_05_30" FOR VALUES FROM ('2025-05-30 00:00:00') TO ('2025-05-31 00:00:00');


--
-- Name: messages_2025_05_31; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2025_05_31" FOR VALUES FROM ('2025-05-31 00:00:00') TO ('2025-06-01 00:00:00');


--
-- Name: messages_2025_06_01; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2025_06_01" FOR VALUES FROM ('2025-06-01 00:00:00') TO ('2025-06-02 00:00:00');


--
-- Name: messages_2025_06_02; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2025_06_02" FOR VALUES FROM ('2025-06-02 00:00:00') TO ('2025-06-03 00:00:00');


--
-- Name: messages_2025_06_03; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2025_06_03" FOR VALUES FROM ('2025-06-03 00:00:00') TO ('2025-06-04 00:00:00');


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."refresh_tokens" ALTER COLUMN "id" SET DEFAULT "nextval"('"auth"."refresh_tokens_id_seq"'::"regclass");


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "amr_id_pk" PRIMARY KEY ("id");


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."audit_log_entries"
    ADD CONSTRAINT "audit_log_entries_pkey" PRIMARY KEY ("id");


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."flow_state"
    ADD CONSTRAINT "flow_state_pkey" PRIMARY KEY ("id");


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_pkey" PRIMARY KEY ("id");


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_provider_id_provider_unique" UNIQUE ("provider_id", "provider");


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."instances"
    ADD CONSTRAINT "instances_pkey" PRIMARY KEY ("id");


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "mfa_amr_claims_session_id_authentication_method_pkey" UNIQUE ("session_id", "authentication_method");


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_challenges"
    ADD CONSTRAINT "mfa_challenges_pkey" PRIMARY KEY ("id");


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_last_challenged_at_key" UNIQUE ("last_challenged_at");


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_pkey" PRIMARY KEY ("id");


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."one_time_tokens"
    ADD CONSTRAINT "one_time_tokens_pkey" PRIMARY KEY ("id");


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id");


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_token_unique" UNIQUE ("token");


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_entity_id_key" UNIQUE ("entity_id");


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_pkey" PRIMARY KEY ("id");


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_pkey" PRIMARY KEY ("id");


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version");


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."sso_domains"
    ADD CONSTRAINT "sso_domains_pkey" PRIMARY KEY ("id");


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."sso_providers"
    ADD CONSTRAINT "sso_providers_pkey" PRIMARY KEY ("id");


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."users"
    ADD CONSTRAINT "users_phone_key" UNIQUE ("phone");


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");


--
-- Name: activity_log activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id");


--
-- Name: album_analytics album_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."album_analytics"
    ADD CONSTRAINT "album_analytics_pkey" PRIMARY KEY ("id");


--
-- Name: album_images album_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."album_images"
    ADD CONSTRAINT "album_images_pkey" PRIMARY KEY ("id");


--
-- Name: album_shares album_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."album_shares"
    ADD CONSTRAINT "album_shares_pkey" PRIMARY KEY ("id");


--
-- Name: authors authors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."authors"
    ADD CONSTRAINT "authors_pkey" PRIMARY KEY ("id");


--
-- Name: automation_executions automation_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."automation_executions"
    ADD CONSTRAINT "automation_executions_pkey" PRIMARY KEY ("id");


--
-- Name: automation_workflows automation_workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."automation_workflows"
    ADD CONSTRAINT "automation_workflows_pkey" PRIMARY KEY ("id");


--
-- Name: binding_types binding_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."binding_types"
    ADD CONSTRAINT "binding_types_pkey" PRIMARY KEY ("id");


--
-- Name: blocks blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_pkey" PRIMARY KEY ("id");


--
-- Name: book_authors book_authors_book_author_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_authors"
    ADD CONSTRAINT "book_authors_book_author_unique" UNIQUE ("book_id", "author_id");


--
-- Name: book_authors book_authors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_authors"
    ADD CONSTRAINT "book_authors_pkey" PRIMARY KEY ("id");


--
-- Name: book_club_books book_club_books_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_club_books"
    ADD CONSTRAINT "book_club_books_pkey" PRIMARY KEY ("id");


--
-- Name: book_club_discussion_comments book_club_discussion_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_club_discussion_comments"
    ADD CONSTRAINT "book_club_discussion_comments_pkey" PRIMARY KEY ("id");


--
-- Name: book_club_discussions book_club_discussions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_club_discussions"
    ADD CONSTRAINT "book_club_discussions_pkey" PRIMARY KEY ("id");


--
-- Name: book_club_members book_club_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_club_members"
    ADD CONSTRAINT "book_club_members_pkey" PRIMARY KEY ("id");


--
-- Name: book_clubs book_clubs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_clubs"
    ADD CONSTRAINT "book_clubs_pkey" PRIMARY KEY ("id");


--
-- Name: book_genre_mappings book_genre_mappings_book_genre_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_genre_mappings"
    ADD CONSTRAINT "book_genre_mappings_book_genre_unique" UNIQUE ("book_id", "genre_id");


--
-- Name: book_genre_mappings book_genre_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_genre_mappings"
    ADD CONSTRAINT "book_genre_mappings_pkey" PRIMARY KEY ("id");


--
-- Name: book_genres book_genres_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_genres"
    ADD CONSTRAINT "book_genres_pkey" PRIMARY KEY ("id");


--
-- Name: book_popularity_metrics book_popularity_metrics_book_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_popularity_metrics"
    ADD CONSTRAINT "book_popularity_metrics_book_id_key" UNIQUE ("book_id");


--
-- Name: book_popularity_metrics book_popularity_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_popularity_metrics"
    ADD CONSTRAINT "book_popularity_metrics_pkey" PRIMARY KEY ("id");


--
-- Name: book_publishers book_publishers_book_publisher_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_publishers"
    ADD CONSTRAINT "book_publishers_book_publisher_unique" UNIQUE ("book_id", "publisher_id");


--
-- Name: book_publishers book_publishers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_publishers"
    ADD CONSTRAINT "book_publishers_pkey" PRIMARY KEY ("id");


--
-- Name: book_recommendations book_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_recommendations"
    ADD CONSTRAINT "book_recommendations_pkey" PRIMARY KEY ("id");


--
-- Name: book_reviews book_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_reviews"
    ADD CONSTRAINT "book_reviews_pkey" PRIMARY KEY ("id");


--
-- Name: book_similarity_scores book_similarity_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_similarity_scores"
    ADD CONSTRAINT "book_similarity_scores_pkey" PRIMARY KEY ("id");


--
-- Name: book_subjects book_subjects_book_subject_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_subjects"
    ADD CONSTRAINT "book_subjects_book_subject_unique" UNIQUE ("book_id", "subject_id");


--
-- Name: book_subjects book_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_subjects"
    ADD CONSTRAINT "book_subjects_pkey" PRIMARY KEY ("id");


--
-- Name: book_tag_mappings book_tag_mappings_book_tag_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_tag_mappings"
    ADD CONSTRAINT "book_tag_mappings_book_tag_unique" UNIQUE ("book_id", "tag_id");


--
-- Name: book_tag_mappings book_tag_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_tag_mappings"
    ADD CONSTRAINT "book_tag_mappings_pkey" PRIMARY KEY ("id");


--
-- Name: book_tags book_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_tags"
    ADD CONSTRAINT "book_tags_pkey" PRIMARY KEY ("id");


--
-- Name: book_views book_views_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_views"
    ADD CONSTRAINT "book_views_pkey" PRIMARY KEY ("id");


--
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_pkey" PRIMARY KEY ("id");


--
-- Name: carousel_images carousel_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."carousel_images"
    ADD CONSTRAINT "carousel_images_pkey" PRIMARY KEY ("id");


--
-- Name: collaborative_filtering_data collaborative_filtering_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."collaborative_filtering_data"
    ADD CONSTRAINT "collaborative_filtering_data_pkey" PRIMARY KEY ("id");


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");


--
-- Name: contact_info contact_info_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."contact_info"
    ADD CONSTRAINT "contact_info_pkey" PRIMARY KEY ("id");


--
-- Name: content_features content_features_content_id_content_type_feature_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."content_features"
    ADD CONSTRAINT "content_features_content_id_content_type_feature_name_key" UNIQUE ("content_id", "content_type", "feature_name");


--
-- Name: content_features content_features_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."content_features"
    ADD CONSTRAINT "content_features_pkey" PRIMARY KEY ("id");


--
-- Name: content_generation_jobs content_generation_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."content_generation_jobs"
    ADD CONSTRAINT "content_generation_jobs_pkey" PRIMARY KEY ("id");


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."countries"
    ADD CONSTRAINT "countries_pkey" PRIMARY KEY ("id");


--
-- Name: custom_permissions custom_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."custom_permissions"
    ADD CONSTRAINT "custom_permissions_pkey" PRIMARY KEY ("id");


--
-- Name: custom_permissions custom_permissions_user_target_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."custom_permissions"
    ADD CONSTRAINT "custom_permissions_user_target_unique" UNIQUE ("user_id", "target_user_id", "permission_type");


--
-- Name: data_enrichment_jobs data_enrichment_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."data_enrichment_jobs"
    ADD CONSTRAINT "data_enrichment_jobs_pkey" PRIMARY KEY ("id");


--
-- Name: dewey_decimal_classifications dewey_decimal_classifications_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."dewey_decimal_classifications"
    ADD CONSTRAINT "dewey_decimal_classifications_code_key" UNIQUE ("code");


--
-- Name: dewey_decimal_classifications dewey_decimal_classifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."dewey_decimal_classifications"
    ADD CONSTRAINT "dewey_decimal_classifications_pkey" PRIMARY KEY ("id");


--
-- Name: discussion_comments discussion_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."discussion_comments"
    ADD CONSTRAINT "discussion_comments_pkey" PRIMARY KEY ("id");


--
-- Name: discussions discussions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."discussions"
    ADD CONSTRAINT "discussions_pkey" PRIMARY KEY ("id");


--
-- Name: enterprise_audit_trail enterprise_audit_trail_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."enterprise_audit_trail"
    ADD CONSTRAINT "enterprise_audit_trail_pkey" PRIMARY KEY ("id");


--
-- Name: enterprise_data_lineage enterprise_data_lineage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."enterprise_data_lineage"
    ADD CONSTRAINT "enterprise_data_lineage_pkey" PRIMARY KEY ("id");


--
-- Name: enterprise_data_lineage enterprise_data_lineage_source_table_target_table_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."enterprise_data_lineage"
    ADD CONSTRAINT "enterprise_data_lineage_source_table_target_table_key" UNIQUE ("source_table", "target_table");


--
-- Name: enterprise_data_quality_rules enterprise_data_quality_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."enterprise_data_quality_rules"
    ADD CONSTRAINT "enterprise_data_quality_rules_pkey" PRIMARY KEY ("id");


--
-- Name: enterprise_data_quality_rules enterprise_data_quality_rules_rule_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."enterprise_data_quality_rules"
    ADD CONSTRAINT "enterprise_data_quality_rules_rule_name_key" UNIQUE ("rule_name");


--
-- Name: enterprise_data_versions enterprise_data_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."enterprise_data_versions"
    ADD CONSTRAINT "enterprise_data_versions_pkey" PRIMARY KEY ("id");


--
-- Name: enterprise_data_versions enterprise_data_versions_table_name_record_id_version_numbe_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."enterprise_data_versions"
    ADD CONSTRAINT "enterprise_data_versions_table_name_record_id_version_numbe_key" UNIQUE ("table_name", "record_id", "version_number");


--
-- Name: entity_types entity_types_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."entity_types"
    ADD CONSTRAINT "entity_types_name_key" UNIQUE ("name");


--
-- Name: event_analytics event_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_analytics"
    ADD CONSTRAINT "event_analytics_pkey" PRIMARY KEY ("id");


--
-- Name: event_approvals event_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_approvals"
    ADD CONSTRAINT "event_approvals_pkey" PRIMARY KEY ("id");


--
-- Name: event_books event_books_event_book_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_books"
    ADD CONSTRAINT "event_books_event_book_unique" UNIQUE ("event_id", "book_id");


--
-- Name: event_books event_books_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_books"
    ADD CONSTRAINT "event_books_pkey" PRIMARY KEY ("id");


--
-- Name: event_calendar_exports event_calendar_exports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_calendar_exports"
    ADD CONSTRAINT "event_calendar_exports_pkey" PRIMARY KEY ("id");


--
-- Name: event_categories event_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_categories"
    ADD CONSTRAINT "event_categories_pkey" PRIMARY KEY ("id");


--
-- Name: event_chat_messages event_chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_chat_messages"
    ADD CONSTRAINT "event_chat_messages_pkey" PRIMARY KEY ("id");


--
-- Name: event_chat_rooms event_chat_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_chat_rooms"
    ADD CONSTRAINT "event_chat_rooms_pkey" PRIMARY KEY ("id");


--
-- Name: event_comments event_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_comments"
    ADD CONSTRAINT "event_comments_pkey" PRIMARY KEY ("id");


--
-- Name: event_creator_permissions event_creator_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_creator_permissions"
    ADD CONSTRAINT "event_creator_permissions_pkey" PRIMARY KEY ("id");


--
-- Name: event_financials event_financials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_financials"
    ADD CONSTRAINT "event_financials_pkey" PRIMARY KEY ("id");


--
-- Name: event_interests event_interests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_interests"
    ADD CONSTRAINT "event_interests_pkey" PRIMARY KEY ("id");


--
-- Name: event_likes event_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_likes"
    ADD CONSTRAINT "event_likes_pkey" PRIMARY KEY ("id");


--
-- Name: event_livestreams event_livestreams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_livestreams"
    ADD CONSTRAINT "event_livestreams_pkey" PRIMARY KEY ("id");


--
-- Name: event_locations event_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_locations"
    ADD CONSTRAINT "event_locations_pkey" PRIMARY KEY ("id");


--
-- Name: event_media event_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_media"
    ADD CONSTRAINT "event_media_pkey" PRIMARY KEY ("id");


--
-- Name: event_permission_requests event_permission_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_permission_requests"
    ADD CONSTRAINT "event_permission_requests_pkey" PRIMARY KEY ("id");


--
-- Name: event_questions event_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_questions"
    ADD CONSTRAINT "event_questions_pkey" PRIMARY KEY ("id");


--
-- Name: event_registrations event_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id");


--
-- Name: event_reminders event_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_reminders"
    ADD CONSTRAINT "event_reminders_pkey" PRIMARY KEY ("id");


--
-- Name: event_sessions event_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_sessions"
    ADD CONSTRAINT "event_sessions_pkey" PRIMARY KEY ("id");


--
-- Name: event_shares event_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_shares"
    ADD CONSTRAINT "event_shares_pkey" PRIMARY KEY ("id");


--
-- Name: event_speakers event_speakers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_speakers"
    ADD CONSTRAINT "event_speakers_pkey" PRIMARY KEY ("id");


--
-- Name: event_sponsors event_sponsors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_sponsors"
    ADD CONSTRAINT "event_sponsors_pkey" PRIMARY KEY ("id");


--
-- Name: event_staff event_staff_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_staff"
    ADD CONSTRAINT "event_staff_pkey" PRIMARY KEY ("id");


--
-- Name: event_surveys event_surveys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_surveys"
    ADD CONSTRAINT "event_surveys_pkey" PRIMARY KEY ("id");


--
-- Name: event_tags event_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_tags"
    ADD CONSTRAINT "event_tags_pkey" PRIMARY KEY ("event_id", "tag_id");


--
-- Name: event_types event_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_types"
    ADD CONSTRAINT "event_types_pkey" PRIMARY KEY ("id");


--
-- Name: event_views event_views_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_views"
    ADD CONSTRAINT "event_views_pkey" PRIMARY KEY ("id");


--
-- Name: event_waitlists event_waitlists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_waitlists"
    ADD CONSTRAINT "event_waitlists_pkey" PRIMARY KEY ("id");


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");


--
-- Name: feed_entries feed_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."feed_entries"
    ADD CONSTRAINT "feed_entries_pkey" PRIMARY KEY ("id");


--
-- Name: follow_target_types follow_target_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."follow_target_types"
    ADD CONSTRAINT "follow_target_types_pkey" PRIMARY KEY ("id");


--
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_pkey" PRIMARY KEY ("follower_id", "following_id");


--
-- Name: format_types format_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."format_types"
    ADD CONSTRAINT "format_types_pkey" PRIMARY KEY ("id");


--
-- Name: friends friends_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."friends"
    ADD CONSTRAINT "friends_pkey" PRIMARY KEY ("user_id", "friend_id");


--
-- Name: group_achievements group_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_achievements"
    ADD CONSTRAINT "group_achievements_pkey" PRIMARY KEY ("id");


--
-- Name: group_analytics group_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_analytics"
    ADD CONSTRAINT "group_analytics_pkey" PRIMARY KEY ("id");


--
-- Name: group_announcements group_announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_announcements"
    ADD CONSTRAINT "group_announcements_pkey" PRIMARY KEY ("id");


--
-- Name: group_audit_log group_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_audit_log"
    ADD CONSTRAINT "group_audit_log_pkey" PRIMARY KEY ("id");


--
-- Name: group_author_events group_author_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_author_events"
    ADD CONSTRAINT "group_author_events_pkey" PRIMARY KEY ("id");


--
-- Name: group_book_list_items group_book_list_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_list_items"
    ADD CONSTRAINT "group_book_list_items_pkey" PRIMARY KEY ("id");


--
-- Name: group_book_lists group_book_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_lists"
    ADD CONSTRAINT "group_book_lists_pkey" PRIMARY KEY ("id");


--
-- Name: group_book_reviews group_book_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_reviews"
    ADD CONSTRAINT "group_book_reviews_pkey" PRIMARY KEY ("id");


--
-- Name: group_book_swaps group_book_swaps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_swaps"
    ADD CONSTRAINT "group_book_swaps_pkey" PRIMARY KEY ("id");


--
-- Name: group_book_wishlist_items group_book_wishlist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_wishlist_items"
    ADD CONSTRAINT "group_book_wishlist_items_pkey" PRIMARY KEY ("id");


--
-- Name: group_book_wishlists group_book_wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_wishlists"
    ADD CONSTRAINT "group_book_wishlists_pkey" PRIMARY KEY ("id");


--
-- Name: group_bots group_bots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_bots"
    ADD CONSTRAINT "group_bots_pkey" PRIMARY KEY ("id");


--
-- Name: group_chat_channels group_chat_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_chat_channels"
    ADD CONSTRAINT "group_chat_channels_pkey" PRIMARY KEY ("id");


--
-- Name: group_chat_message_attachments group_chat_message_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_chat_message_attachments"
    ADD CONSTRAINT "group_chat_message_attachments_pkey" PRIMARY KEY ("id");


--
-- Name: group_chat_message_reactions group_chat_message_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_chat_message_reactions"
    ADD CONSTRAINT "group_chat_message_reactions_pkey" PRIMARY KEY ("id");


--
-- Name: group_chat_messages group_chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_chat_messages"
    ADD CONSTRAINT "group_chat_messages_pkey" PRIMARY KEY ("id");


--
-- Name: group_content_moderation_logs group_content_moderation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_content_moderation_logs"
    ADD CONSTRAINT "group_content_moderation_logs_pkey" PRIMARY KEY ("id");


--
-- Name: group_custom_fields group_custom_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_custom_fields"
    ADD CONSTRAINT "group_custom_fields_pkey" PRIMARY KEY ("id");


--
-- Name: group_discussion_categories group_discussion_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_discussion_categories"
    ADD CONSTRAINT "group_discussion_categories_pkey" PRIMARY KEY ("id");


--
-- Name: group_event_feedback group_event_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_event_feedback"
    ADD CONSTRAINT "group_event_feedback_pkey" PRIMARY KEY ("id");


--
-- Name: group_events group_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_events"
    ADD CONSTRAINT "group_events_pkey" PRIMARY KEY ("id");


--
-- Name: group_integrations group_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_integrations"
    ADD CONSTRAINT "group_integrations_pkey" PRIMARY KEY ("id");


--
-- Name: group_invites group_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_invites"
    ADD CONSTRAINT "group_invites_pkey" PRIMARY KEY ("id");


--
-- Name: group_leaderboards group_leaderboards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_leaderboards"
    ADD CONSTRAINT "group_leaderboards_pkey" PRIMARY KEY ("id");


--
-- Name: group_member_achievements group_member_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_member_achievements"
    ADD CONSTRAINT "group_member_achievements_pkey" PRIMARY KEY ("id");


--
-- Name: group_member_devices group_member_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_member_devices"
    ADD CONSTRAINT "group_member_devices_pkey" PRIMARY KEY ("id");


--
-- Name: group_member_streaks group_member_streaks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_member_streaks"
    ADD CONSTRAINT "group_member_streaks_pkey" PRIMARY KEY ("id");


--
-- Name: group_members group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_pkey" PRIMARY KEY ("group_id", "user_id");


--
-- Name: group_membership_questions group_membership_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_membership_questions"
    ADD CONSTRAINT "group_membership_questions_pkey" PRIMARY KEY ("id");


--
-- Name: group_moderation_logs group_moderation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_moderation_logs"
    ADD CONSTRAINT "group_moderation_logs_pkey" PRIMARY KEY ("id");


--
-- Name: group_onboarding_checklists group_onboarding_checklists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_onboarding_checklists"
    ADD CONSTRAINT "group_onboarding_checklists_pkey" PRIMARY KEY ("id");


--
-- Name: group_onboarding_progress group_onboarding_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_onboarding_progress"
    ADD CONSTRAINT "group_onboarding_progress_pkey" PRIMARY KEY ("id");


--
-- Name: group_onboarding_tasks group_onboarding_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_onboarding_tasks"
    ADD CONSTRAINT "group_onboarding_tasks_pkey" PRIMARY KEY ("id");


--
-- Name: group_poll_votes group_poll_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_poll_votes"
    ADD CONSTRAINT "group_poll_votes_pkey" PRIMARY KEY ("id");


--
-- Name: group_polls group_polls_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_polls"
    ADD CONSTRAINT "group_polls_pkey" PRIMARY KEY ("id");


--
-- Name: group_reading_challenge_progress group_reading_challenge_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_reading_challenge_progress"
    ADD CONSTRAINT "group_reading_challenge_progress_pkey" PRIMARY KEY ("id");


--
-- Name: group_reading_challenges group_reading_challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_reading_challenges"
    ADD CONSTRAINT "group_reading_challenges_pkey" PRIMARY KEY ("id");


--
-- Name: group_reading_progress group_reading_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_reading_progress"
    ADD CONSTRAINT "group_reading_progress_pkey" PRIMARY KEY ("id");


--
-- Name: group_reading_sessions group_reading_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_reading_sessions"
    ADD CONSTRAINT "group_reading_sessions_pkey" PRIMARY KEY ("id");


--
-- Name: group_reports group_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_reports"
    ADD CONSTRAINT "group_reports_pkey" PRIMARY KEY ("id");


--
-- Name: group_roles group_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_roles"
    ADD CONSTRAINT "group_roles_pkey" PRIMARY KEY ("id");


--
-- Name: group_rules group_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_rules"
    ADD CONSTRAINT "group_rules_pkey" PRIMARY KEY ("id");


--
-- Name: group_shared_documents group_shared_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_shared_documents"
    ADD CONSTRAINT "group_shared_documents_pkey" PRIMARY KEY ("id");


--
-- Name: group_tags group_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_tags"
    ADD CONSTRAINT "group_tags_pkey" PRIMARY KEY ("id");


--
-- Name: group_types group_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_types"
    ADD CONSTRAINT "group_types_pkey" PRIMARY KEY ("id");


--
-- Name: group_webhook_logs group_webhook_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_webhook_logs"
    ADD CONSTRAINT "group_webhook_logs_pkey" PRIMARY KEY ("id");


--
-- Name: group_webhooks group_webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_webhooks"
    ADD CONSTRAINT "group_webhooks_pkey" PRIMARY KEY ("id");


--
-- Name: group_welcome_messages group_welcome_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_welcome_messages"
    ADD CONSTRAINT "group_welcome_messages_pkey" PRIMARY KEY ("id");


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");


--
-- Name: image_tags image_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."image_tags"
    ADD CONSTRAINT "image_tags_pkey" PRIMARY KEY ("id");


--
-- Name: entity_types image_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."entity_types"
    ADD CONSTRAINT "image_types_pkey" PRIMARY KEY ("id");


--
-- Name: images images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_pkey" PRIMARY KEY ("id");


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");


--
-- Name: likes likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_pkey" PRIMARY KEY ("id");


--
-- Name: list_followers list_followers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."list_followers"
    ADD CONSTRAINT "list_followers_pkey" PRIMARY KEY ("id");


--
-- Name: media_attachments media_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."media_attachments"
    ADD CONSTRAINT "media_attachments_pkey" PRIMARY KEY ("id");


--
-- Name: mentions mentions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."mentions"
    ADD CONSTRAINT "mentions_pkey" PRIMARY KEY ("id");


--
-- Name: ml_models ml_models_model_name_model_version_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."ml_models"
    ADD CONSTRAINT "ml_models_model_name_model_version_key" UNIQUE ("model_name", "model_version");


--
-- Name: ml_models ml_models_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."ml_models"
    ADD CONSTRAINT "ml_models_pkey" PRIMARY KEY ("id");


--
-- Name: ml_predictions ml_predictions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."ml_predictions"
    ADD CONSTRAINT "ml_predictions_pkey" PRIMARY KEY ("id");


--
-- Name: ml_training_jobs ml_training_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."ml_training_jobs"
    ADD CONSTRAINT "ml_training_jobs_pkey" PRIMARY KEY ("id");


--
-- Name: nlp_analysis nlp_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."nlp_analysis"
    ADD CONSTRAINT "nlp_analysis_pkey" PRIMARY KEY ("id");


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id");


--
-- Name: performance_metrics performance_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."performance_metrics"
    ADD CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id");


--
-- Name: personalized_recommendations personalized_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."personalized_recommendations"
    ADD CONSTRAINT "personalized_recommendations_pkey" PRIMARY KEY ("id");


--
-- Name: photo_album photo_album_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."photo_album"
    ADD CONSTRAINT "photo_album_pkey" PRIMARY KEY ("id");


--
-- Name: photo_albums photo_albums_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."photo_albums"
    ADD CONSTRAINT "photo_albums_pkey" PRIMARY KEY ("id");


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");


--
-- Name: prices prices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."prices"
    ADD CONSTRAINT "prices_pkey" PRIMARY KEY ("id");


--
-- Name: privacy_audit_log privacy_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."privacy_audit_log"
    ADD CONSTRAINT "privacy_audit_log_pkey" PRIMARY KEY ("id");


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");


--
-- Name: promo_codes promo_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id");


--
-- Name: publishers publishers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."publishers"
    ADD CONSTRAINT "publishers_pkey" PRIMARY KEY ("id");


--
-- Name: reactions reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reactions"
    ADD CONSTRAINT "reactions_pkey" PRIMARY KEY ("id");


--
-- Name: reading_challenges reading_challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_challenges"
    ADD CONSTRAINT "reading_challenges_pkey" PRIMARY KEY ("id");


--
-- Name: reading_goals reading_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_goals"
    ADD CONSTRAINT "reading_goals_pkey" PRIMARY KEY ("id");


--
-- Name: reading_list_items reading_list_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_list_items"
    ADD CONSTRAINT "reading_list_items_pkey" PRIMARY KEY ("id");


--
-- Name: reading_lists reading_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_lists"
    ADD CONSTRAINT "reading_lists_pkey" PRIMARY KEY ("id");


--
-- Name: reading_progress reading_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_progress"
    ADD CONSTRAINT "reading_progress_pkey" PRIMARY KEY ("id");


--
-- Name: reading_series reading_series_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_series"
    ADD CONSTRAINT "reading_series_pkey" PRIMARY KEY ("id");


--
-- Name: reading_sessions reading_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_sessions"
    ADD CONSTRAINT "reading_sessions_pkey" PRIMARY KEY ("id");


--
-- Name: reading_stats_daily reading_stats_daily_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_stats_daily"
    ADD CONSTRAINT "reading_stats_daily_pkey" PRIMARY KEY ("id");


--
-- Name: reading_streaks reading_streaks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_streaks"
    ADD CONSTRAINT "reading_streaks_pkey" PRIMARY KEY ("id");


--
-- Name: review_likes review_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."review_likes"
    ADD CONSTRAINT "review_likes_pkey" PRIMARY KEY ("id");


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");


--
-- Name: session_registrations session_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."session_registrations"
    ADD CONSTRAINT "session_registrations_pkey" PRIMARY KEY ("id");


--
-- Name: similar_books similar_books_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."similar_books"
    ADD CONSTRAINT "similar_books_pkey" PRIMARY KEY ("id");


--
-- Name: smart_notifications smart_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."smart_notifications"
    ADD CONSTRAINT "smart_notifications_pkey" PRIMARY KEY ("id");


--
-- Name: statuses statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."statuses"
    ADD CONSTRAINT "statuses_pkey" PRIMARY KEY ("id");


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."subjects"
    ADD CONSTRAINT "subjects_pkey" PRIMARY KEY ("id");


--
-- Name: survey_questions survey_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."survey_questions"
    ADD CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("id");


--
-- Name: survey_responses survey_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."survey_responses"
    ADD CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id");


--
-- Name: sync_state sync_state_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."sync_state"
    ADD CONSTRAINT "sync_state_pkey" PRIMARY KEY ("id");


--
-- Name: system_health_checks system_health_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."system_health_checks"
    ADD CONSTRAINT "system_health_checks_pkey" PRIMARY KEY ("id");


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");


--
-- Name: ticket_benefits ticket_benefits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."ticket_benefits"
    ADD CONSTRAINT "ticket_benefits_pkey" PRIMARY KEY ("id");


--
-- Name: ticket_types ticket_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."ticket_types"
    ADD CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id");


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_pkey" PRIMARY KEY ("id");


--
-- Name: user_activity_log user_activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_activity_log"
    ADD CONSTRAINT "user_activity_log_pkey" PRIMARY KEY ("id");


--
-- Name: user_book_interactions user_book_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_book_interactions"
    ADD CONSTRAINT "user_book_interactions_pkey" PRIMARY KEY ("id");


--
-- Name: user_friends user_friends_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_friends"
    ADD CONSTRAINT "user_friends_pkey" PRIMARY KEY ("id");


--
-- Name: user_friends user_friends_user_id_friend_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_friends"
    ADD CONSTRAINT "user_friends_user_id_friend_id_key" UNIQUE ("user_id", "friend_id");


--
-- Name: user_privacy_settings user_privacy_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_privacy_settings"
    ADD CONSTRAINT "user_privacy_settings_pkey" PRIMARY KEY ("id");


--
-- Name: user_privacy_settings user_privacy_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_privacy_settings"
    ADD CONSTRAINT "user_privacy_settings_user_id_key" UNIQUE ("user_id");


--
-- Name: user_reading_preferences user_reading_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_reading_preferences"
    ADD CONSTRAINT "user_reading_preferences_pkey" PRIMARY KEY ("id");


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY "realtime"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id", "inserted_at");


--
-- Name: messages_2025_05_28 messages_2025_05_28_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages_2025_05_28"
    ADD CONSTRAINT "messages_2025_05_28_pkey" PRIMARY KEY ("id", "inserted_at");


--
-- Name: messages_2025_05_29 messages_2025_05_29_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages_2025_05_29"
    ADD CONSTRAINT "messages_2025_05_29_pkey" PRIMARY KEY ("id", "inserted_at");


--
-- Name: messages_2025_05_30 messages_2025_05_30_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages_2025_05_30"
    ADD CONSTRAINT "messages_2025_05_30_pkey" PRIMARY KEY ("id", "inserted_at");


--
-- Name: messages_2025_05_31 messages_2025_05_31_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages_2025_05_31"
    ADD CONSTRAINT "messages_2025_05_31_pkey" PRIMARY KEY ("id", "inserted_at");


--
-- Name: messages_2025_06_01 messages_2025_06_01_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages_2025_06_01"
    ADD CONSTRAINT "messages_2025_06_01_pkey" PRIMARY KEY ("id", "inserted_at");


--
-- Name: messages_2025_06_02 messages_2025_06_02_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages_2025_06_02"
    ADD CONSTRAINT "messages_2025_06_02_pkey" PRIMARY KEY ("id", "inserted_at");


--
-- Name: messages_2025_06_03 messages_2025_06_03_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages_2025_06_03"
    ADD CONSTRAINT "messages_2025_06_03_pkey" PRIMARY KEY ("id", "inserted_at");


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."subscription"
    ADD CONSTRAINT "pk_subscription" PRIMARY KEY ("id");


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version");


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."buckets"
    ADD CONSTRAINT "buckets_pkey" PRIMARY KEY ("id");


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_name_key" UNIQUE ("name");


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_pkey" PRIMARY KEY ("id");


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_pkey" PRIMARY KEY ("id");


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_pkey" PRIMARY KEY ("id");


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_pkey" PRIMARY KEY ("id");


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "audit_logs_instance_id_idx" ON "auth"."audit_log_entries" USING "btree" ("instance_id");


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "confirmation_token_idx" ON "auth"."users" USING "btree" ("confirmation_token") WHERE (("confirmation_token")::"text" !~ '^[0-9 ]*$'::"text");


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "email_change_token_current_idx" ON "auth"."users" USING "btree" ("email_change_token_current") WHERE (("email_change_token_current")::"text" !~ '^[0-9 ]*$'::"text");


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "email_change_token_new_idx" ON "auth"."users" USING "btree" ("email_change_token_new") WHERE (("email_change_token_new")::"text" !~ '^[0-9 ]*$'::"text");


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "factor_id_created_at_idx" ON "auth"."mfa_factors" USING "btree" ("user_id", "created_at");


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "flow_state_created_at_idx" ON "auth"."flow_state" USING "btree" ("created_at" DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "identities_email_idx" ON "auth"."identities" USING "btree" ("email" "text_pattern_ops");


--
-- Name: INDEX "identities_email_idx"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX "auth"."identities_email_idx" IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "identities_user_id_idx" ON "auth"."identities" USING "btree" ("user_id");


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "idx_auth_code" ON "auth"."flow_state" USING "btree" ("auth_code");


--
-- Name: idx_auth_users_email; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "idx_auth_users_email" ON "auth"."users" USING "btree" ("email");


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "idx_user_id_auth_method" ON "auth"."flow_state" USING "btree" ("user_id", "authentication_method");


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "mfa_challenge_created_at_idx" ON "auth"."mfa_challenges" USING "btree" ("created_at" DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "mfa_factors_user_friendly_name_unique" ON "auth"."mfa_factors" USING "btree" ("friendly_name", "user_id") WHERE (TRIM(BOTH FROM "friendly_name") <> ''::"text");


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "mfa_factors_user_id_idx" ON "auth"."mfa_factors" USING "btree" ("user_id");


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "one_time_tokens_relates_to_hash_idx" ON "auth"."one_time_tokens" USING "hash" ("relates_to");


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "one_time_tokens_token_hash_hash_idx" ON "auth"."one_time_tokens" USING "hash" ("token_hash");


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "one_time_tokens_user_id_token_type_key" ON "auth"."one_time_tokens" USING "btree" ("user_id", "token_type");


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "reauthentication_token_idx" ON "auth"."users" USING "btree" ("reauthentication_token") WHERE (("reauthentication_token")::"text" !~ '^[0-9 ]*$'::"text");


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "recovery_token_idx" ON "auth"."users" USING "btree" ("recovery_token") WHERE (("recovery_token")::"text" !~ '^[0-9 ]*$'::"text");


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "refresh_tokens_instance_id_idx" ON "auth"."refresh_tokens" USING "btree" ("instance_id");


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "refresh_tokens_instance_id_user_id_idx" ON "auth"."refresh_tokens" USING "btree" ("instance_id", "user_id");


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "refresh_tokens_parent_idx" ON "auth"."refresh_tokens" USING "btree" ("parent");


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "refresh_tokens_session_id_revoked_idx" ON "auth"."refresh_tokens" USING "btree" ("session_id", "revoked");


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "refresh_tokens_updated_at_idx" ON "auth"."refresh_tokens" USING "btree" ("updated_at" DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "saml_providers_sso_provider_id_idx" ON "auth"."saml_providers" USING "btree" ("sso_provider_id");


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "saml_relay_states_created_at_idx" ON "auth"."saml_relay_states" USING "btree" ("created_at" DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "saml_relay_states_for_email_idx" ON "auth"."saml_relay_states" USING "btree" ("for_email");


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "saml_relay_states_sso_provider_id_idx" ON "auth"."saml_relay_states" USING "btree" ("sso_provider_id");


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "sessions_not_after_idx" ON "auth"."sessions" USING "btree" ("not_after" DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "sessions_user_id_idx" ON "auth"."sessions" USING "btree" ("user_id");


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "sso_domains_domain_idx" ON "auth"."sso_domains" USING "btree" ("lower"("domain"));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "sso_domains_sso_provider_id_idx" ON "auth"."sso_domains" USING "btree" ("sso_provider_id");


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "sso_providers_resource_id_idx" ON "auth"."sso_providers" USING "btree" ("lower"("resource_id"));


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "unique_phone_factor_per_user" ON "auth"."mfa_factors" USING "btree" ("user_id", "phone");


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "user_id_created_at_idx" ON "auth"."sessions" USING "btree" ("user_id", "created_at");


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "users_email_partial_key" ON "auth"."users" USING "btree" ("email") WHERE ("is_sso_user" = false);


--
-- Name: INDEX "users_email_partial_key"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX "auth"."users_email_partial_key" IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "users_instance_id_email_idx" ON "auth"."users" USING "btree" ("instance_id", "lower"(("email")::"text"));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "users_instance_id_idx" ON "auth"."users" USING "btree" ("instance_id");


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "users_is_anonymous_idx" ON "auth"."users" USING "btree" ("is_anonymous");


--
-- Name: idx_activities_author_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_activities_author_id" ON "public"."activities" USING "btree" ("author_id");


--
-- Name: idx_activities_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_activities_book_id" ON "public"."activities" USING "btree" ("book_id");


--
-- Name: idx_activities_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_activities_created_at" ON "public"."activities" USING "btree" ("created_at");


--
-- Name: idx_activities_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_activities_event_id" ON "public"."activities" USING "btree" ("event_id");


--
-- Name: idx_activities_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_activities_group_id" ON "public"."activities" USING "btree" ("group_id");


--
-- Name: idx_activities_list_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_activities_list_id" ON "public"."activities" USING "btree" ("list_id");


--
-- Name: idx_activities_review_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_activities_review_id" ON "public"."activities" USING "btree" ("review_id");


--
-- Name: idx_activities_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_activities_user_id" ON "public"."activities" USING "btree" ("user_id");


--
-- Name: idx_activity_log_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_activity_log_user_id" ON "public"."activity_log" USING "btree" ("user_id");


--
-- Name: idx_album_images_album_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_album_images_album_id" ON "public"."album_images" USING "btree" ("album_id");


--
-- Name: idx_album_images_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_album_images_entity" ON "public"."album_images" USING "btree" ("entity_type_id", "entity_id");


--
-- Name: idx_album_images_entity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_album_images_entity_id" ON "public"."album_images" USING "btree" ("entity_id");


--
-- Name: idx_album_images_entity_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_album_images_entity_type" ON "public"."album_images" USING "btree" ("entity_type_id");


--
-- Name: idx_album_images_image_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_album_images_image_id" ON "public"."album_images" USING "btree" ("image_id");


--
-- Name: idx_album_shares_album_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_album_shares_album_id" ON "public"."album_shares" USING "btree" ("album_id");


--
-- Name: idx_album_shares_shared_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_album_shares_shared_by" ON "public"."album_shares" USING "btree" ("shared_by");


--
-- Name: idx_album_shares_shared_with; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_album_shares_shared_with" ON "public"."album_shares" USING "btree" ("shared_with");


--
-- Name: idx_authors_author_image_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_authors_author_image_id" ON "public"."authors" USING "btree" ("author_image_id");


--
-- Name: idx_authors_cover_image_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_authors_cover_image_id" ON "public"."authors" USING "btree" ("cover_image_id");


--
-- Name: idx_authors_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_authors_created_at" ON "public"."authors" USING "btree" ("created_at" DESC);


--
-- Name: idx_authors_featured; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_authors_featured" ON "public"."authors" USING "btree" ("featured");


--
-- Name: idx_authors_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_authors_name" ON "public"."authors" USING "btree" ("name");


--
-- Name: idx_automation_workflows_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_automation_workflows_active" ON "public"."automation_workflows" USING "btree" ("is_active");


--
-- Name: idx_automation_workflows_next_execution; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_automation_workflows_next_execution" ON "public"."automation_workflows" USING "btree" ("next_execution");


--
-- Name: idx_automation_workflows_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_automation_workflows_type" ON "public"."automation_workflows" USING "btree" ("workflow_type");


--
-- Name: idx_blocks_blocked_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_blocks_blocked_user_id" ON "public"."blocks" USING "btree" ("blocked_user_id");


--
-- Name: idx_blocks_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_blocks_user_id" ON "public"."blocks" USING "btree" ("user_id");


--
-- Name: idx_book_authors_author_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_authors_author_id" ON "public"."book_authors" USING "btree" ("author_id");


--
-- Name: idx_book_authors_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_authors_book_id" ON "public"."book_authors" USING "btree" ("book_id");


--
-- Name: idx_book_club_books_book_club_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_club_books_book_club_id" ON "public"."book_club_books" USING "btree" ("book_club_id");


--
-- Name: idx_book_club_books_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_club_books_book_id" ON "public"."book_club_books" USING "btree" ("book_id");


--
-- Name: idx_book_club_books_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_club_books_created_by" ON "public"."book_club_books" USING "btree" ("created_by");


--
-- Name: idx_book_club_discussion_comments_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_club_discussion_comments_created_by" ON "public"."book_club_discussion_comments" USING "btree" ("created_by");


--
-- Name: idx_book_club_discussion_comments_discussion_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_club_discussion_comments_discussion_id" ON "public"."book_club_discussion_comments" USING "btree" ("discussion_id");


--
-- Name: idx_book_club_discussions_book_club_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_club_discussions_book_club_id" ON "public"."book_club_discussions" USING "btree" ("book_club_id");


--
-- Name: idx_book_club_discussions_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_club_discussions_book_id" ON "public"."book_club_discussions" USING "btree" ("book_id");


--
-- Name: idx_book_club_discussions_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_club_discussions_created_by" ON "public"."book_club_discussions" USING "btree" ("created_by");


--
-- Name: idx_book_club_members_book_club_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_club_members_book_club_id" ON "public"."book_club_members" USING "btree" ("book_club_id");


--
-- Name: idx_book_club_members_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_club_members_user_id" ON "public"."book_club_members" USING "btree" ("user_id");


--
-- Name: idx_book_clubs_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_clubs_created_by" ON "public"."book_clubs" USING "btree" ("created_by");


--
-- Name: idx_book_clubs_current_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_clubs_current_book_id" ON "public"."book_clubs" USING "btree" ("current_book_id");


--
-- Name: idx_book_genre_mappings_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_genre_mappings_book_id" ON "public"."book_genre_mappings" USING "btree" ("book_id");


--
-- Name: idx_book_genre_mappings_genre_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_genre_mappings_genre_id" ON "public"."book_genre_mappings" USING "btree" ("genre_id");


--
-- Name: idx_book_popularity_metrics_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_popularity_metrics_book_id" ON "public"."book_popularity_metrics" USING "btree" ("book_id");


--
-- Name: idx_book_popularity_metrics_rating; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_popularity_metrics_rating" ON "public"."book_popularity_metrics" USING "btree" ("avg_rating" DESC NULLS LAST);


--
-- Name: idx_book_popularity_metrics_updated; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_popularity_metrics_updated" ON "public"."book_popularity_metrics" USING "btree" ("last_updated");


--
-- Name: idx_book_popularity_metrics_views; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_popularity_metrics_views" ON "public"."book_popularity_metrics" USING "btree" ("views_count" DESC);


--
-- Name: idx_book_publishers_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_publishers_book_id" ON "public"."book_publishers" USING "btree" ("book_id");


--
-- Name: idx_book_publishers_publisher_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_publishers_publisher_id" ON "public"."book_publishers" USING "btree" ("publisher_id");


--
-- Name: idx_book_recommendations_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_recommendations_book_id" ON "public"."book_recommendations" USING "btree" ("book_id");


--
-- Name: idx_book_recommendations_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_recommendations_user_id" ON "public"."book_recommendations" USING "btree" ("user_id");


--
-- Name: idx_book_reviews_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_reviews_book_id" ON "public"."book_reviews" USING "btree" ("book_id");


--
-- Name: idx_book_reviews_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_reviews_group_id" ON "public"."book_reviews" USING "btree" ("group_id");


--
-- Name: idx_book_reviews_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_reviews_user_id" ON "public"."book_reviews" USING "btree" ("user_id");


--
-- Name: idx_book_similarity_scores_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_similarity_scores_book_id" ON "public"."book_similarity_scores" USING "btree" ("book_id");


--
-- Name: idx_book_subjects_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_subjects_book_id" ON "public"."book_subjects" USING "btree" ("book_id");


--
-- Name: idx_book_subjects_subject_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_subjects_subject_id" ON "public"."book_subjects" USING "btree" ("subject_id");


--
-- Name: idx_book_tag_mappings_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_tag_mappings_book_id" ON "public"."book_tag_mappings" USING "btree" ("book_id");


--
-- Name: idx_book_tag_mappings_tag_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_tag_mappings_tag_id" ON "public"."book_tag_mappings" USING "btree" ("tag_id");


--
-- Name: idx_book_views_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_views_book_id" ON "public"."book_views" USING "btree" ("book_id");


--
-- Name: idx_book_views_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_views_user_id" ON "public"."book_views" USING "btree" ("user_id");


--
-- Name: idx_books_author_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_author_id" ON "public"."books" USING "btree" ("author_id");


--
-- Name: idx_books_binding_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_binding_type_id" ON "public"."books" USING "btree" ("binding_type_id");


--
-- Name: idx_books_cover_image_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_cover_image_id" ON "public"."books" USING "btree" ("cover_image_id");


--
-- Name: idx_books_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_created_at" ON "public"."books" USING "btree" ("created_at" DESC);


--
-- Name: idx_books_featured; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_featured" ON "public"."books" USING "btree" ("featured");


--
-- Name: idx_books_featured_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_featured_created" ON "public"."books" USING "btree" ("featured", "created_at" DESC);


--
-- Name: idx_books_format_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_format_type_id" ON "public"."books" USING "btree" ("format_type_id");


--
-- Name: idx_books_isbn10; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_isbn10" ON "public"."books" USING "btree" ("isbn10");


--
-- Name: idx_books_isbn13; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_isbn13" ON "public"."books" USING "btree" ("isbn13");


--
-- Name: idx_books_publication_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_publication_date" ON "public"."books" USING "btree" ("publication_date");


--
-- Name: idx_books_publisher_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_publisher_date" ON "public"."books" USING "btree" ("publisher_id", "created_at" DESC);


--
-- Name: idx_books_publisher_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_publisher_id" ON "public"."books" USING "btree" ("publisher_id");


--
-- Name: idx_books_publisher_id_null; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_publisher_id_null" ON "public"."books" USING "btree" ("publisher_id") WHERE ("publisher_id" IS NULL);


--
-- Name: idx_books_status_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_status_id" ON "public"."books" USING "btree" ("status_id");


--
-- Name: idx_books_title; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_title" ON "public"."books" USING "btree" ("title");


--
-- Name: idx_books_title_publisher; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_title_publisher" ON "public"."books" USING "btree" ("title", "publisher_id");


--
-- Name: idx_collaborative_filtering_interaction; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_collaborative_filtering_interaction" ON "public"."collaborative_filtering_data" USING "btree" ("interaction_type", "interaction_timestamp");


--
-- Name: idx_collaborative_filtering_item; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_collaborative_filtering_item" ON "public"."collaborative_filtering_data" USING "btree" ("item_id", "item_type");


--
-- Name: idx_collaborative_filtering_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_collaborative_filtering_user" ON "public"."collaborative_filtering_data" USING "btree" ("user_id");


--
-- Name: idx_comments_feed_entry_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_comments_feed_entry_id" ON "public"."comments" USING "btree" ("feed_entry_id");


--
-- Name: idx_comments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_comments_user_id" ON "public"."comments" USING "btree" ("user_id");


--
-- Name: idx_content_generation_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_content_generation_created_at" ON "public"."content_generation_jobs" USING "btree" ("created_at");


--
-- Name: idx_content_generation_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_content_generation_status" ON "public"."content_generation_jobs" USING "btree" ("generation_status");


--
-- Name: idx_content_generation_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_content_generation_type" ON "public"."content_generation_jobs" USING "btree" ("content_type");


--
-- Name: idx_custom_permissions_target_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_custom_permissions_target_user_id" ON "public"."custom_permissions" USING "btree" ("target_user_id");


--
-- Name: idx_custom_permissions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_custom_permissions_user_id" ON "public"."custom_permissions" USING "btree" ("user_id");


--
-- Name: idx_custom_permissions_user_target; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_custom_permissions_user_target" ON "public"."custom_permissions" USING "btree" ("user_id", "target_user_id");


--
-- Name: idx_dewey_decimal_classifications_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_dewey_decimal_classifications_code" ON "public"."dewey_decimal_classifications" USING "btree" ("code");


--
-- Name: idx_dewey_decimal_classifications_parent_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_dewey_decimal_classifications_parent_code" ON "public"."dewey_decimal_classifications" USING "btree" ("parent_code");


--
-- Name: idx_discussion_comments_discussion_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_discussion_comments_discussion_id" ON "public"."discussion_comments" USING "btree" ("discussion_id");


--
-- Name: idx_discussion_comments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_discussion_comments_user_id" ON "public"."discussion_comments" USING "btree" ("user_id");


--
-- Name: idx_discussions_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_discussions_book_id" ON "public"."discussions" USING "btree" ("book_id");


--
-- Name: idx_discussions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_discussions_user_id" ON "public"."discussions" USING "btree" ("user_id");


--
-- Name: idx_enterprise_audit_trail_changed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_enterprise_audit_trail_changed_at" ON "public"."enterprise_audit_trail" USING "btree" ("changed_at");


--
-- Name: idx_enterprise_audit_trail_changed_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_enterprise_audit_trail_changed_by" ON "public"."enterprise_audit_trail" USING "btree" ("changed_by");


--
-- Name: idx_enterprise_audit_trail_operation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_enterprise_audit_trail_operation" ON "public"."enterprise_audit_trail" USING "btree" ("operation");


--
-- Name: idx_enterprise_audit_trail_table_record; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_enterprise_audit_trail_table_record" ON "public"."enterprise_audit_trail" USING "btree" ("table_name", "record_id");


--
-- Name: idx_enterprise_data_quality_rules_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_enterprise_data_quality_rules_active" ON "public"."enterprise_data_quality_rules" USING "btree" ("is_active") WHERE ("is_active" = true);


--
-- Name: idx_enterprise_data_quality_rules_table; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_enterprise_data_quality_rules_table" ON "public"."enterprise_data_quality_rules" USING "btree" ("table_name");


--
-- Name: idx_enterprise_data_versions_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_enterprise_data_versions_created_by" ON "public"."enterprise_data_versions" USING "btree" ("created_by");


--
-- Name: idx_enterprise_data_versions_current; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_enterprise_data_versions_current" ON "public"."enterprise_data_versions" USING "btree" ("is_current") WHERE ("is_current" = true);


--
-- Name: idx_enterprise_data_versions_table_record; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_enterprise_data_versions_table_record" ON "public"."enterprise_data_versions" USING "btree" ("table_name", "record_id");


--
-- Name: idx_event_books_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_books_book_id" ON "public"."event_books" USING "btree" ("book_id");


--
-- Name: idx_event_books_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_books_event_id" ON "public"."event_books" USING "btree" ("event_id");


--
-- Name: idx_event_chat_messages_chat_room_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_chat_messages_chat_room_id" ON "public"."event_chat_messages" USING "btree" ("chat_room_id");


--
-- Name: idx_event_chat_messages_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_chat_messages_user_id" ON "public"."event_chat_messages" USING "btree" ("user_id");


--
-- Name: idx_event_chat_rooms_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_chat_rooms_event_id" ON "public"."event_chat_rooms" USING "btree" ("event_id");


--
-- Name: idx_event_comments_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_comments_event_id" ON "public"."event_comments" USING "btree" ("event_id");


--
-- Name: idx_event_comments_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_comments_parent_id" ON "public"."event_comments" USING "btree" ("parent_id");


--
-- Name: idx_event_comments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_comments_user_id" ON "public"."event_comments" USING "btree" ("user_id");


--
-- Name: idx_event_creator_permissions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_creator_permissions_user_id" ON "public"."event_creator_permissions" USING "btree" ("user_id");


--
-- Name: idx_event_financials_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_financials_event_id" ON "public"."event_financials" USING "btree" ("event_id");


--
-- Name: idx_event_interests_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_interests_event_id" ON "public"."event_interests" USING "btree" ("event_id");


--
-- Name: idx_event_interests_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_interests_user_id" ON "public"."event_interests" USING "btree" ("user_id");


--
-- Name: idx_event_likes_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_likes_event_id" ON "public"."event_likes" USING "btree" ("event_id");


--
-- Name: idx_event_likes_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_likes_user_id" ON "public"."event_likes" USING "btree" ("user_id");


--
-- Name: idx_event_livestreams_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_livestreams_event_id" ON "public"."event_livestreams" USING "btree" ("event_id");


--
-- Name: idx_event_locations_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_locations_event_id" ON "public"."event_locations" USING "btree" ("event_id");


--
-- Name: idx_event_media_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_media_event_id" ON "public"."event_media" USING "btree" ("event_id");


--
-- Name: idx_event_permission_requests_reviewed_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_permission_requests_reviewed_by" ON "public"."event_permission_requests" USING "btree" ("reviewed_by");


--
-- Name: idx_event_permission_requests_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_permission_requests_user_id" ON "public"."event_permission_requests" USING "btree" ("user_id");


--
-- Name: idx_event_questions_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_questions_event_id" ON "public"."event_questions" USING "btree" ("event_id");


--
-- Name: idx_event_registrations_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_registrations_event_id" ON "public"."event_registrations" USING "btree" ("event_id");


--
-- Name: idx_event_registrations_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_registrations_user_id" ON "public"."event_registrations" USING "btree" ("user_id");


--
-- Name: idx_event_reminders_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_reminders_event_id" ON "public"."event_reminders" USING "btree" ("event_id");


--
-- Name: idx_event_reminders_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_reminders_user_id" ON "public"."event_reminders" USING "btree" ("user_id");


--
-- Name: idx_event_sessions_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_sessions_event_id" ON "public"."event_sessions" USING "btree" ("event_id");


--
-- Name: idx_event_shares_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_shares_event_id" ON "public"."event_shares" USING "btree" ("event_id");


--
-- Name: idx_event_shares_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_shares_user_id" ON "public"."event_shares" USING "btree" ("user_id");


--
-- Name: idx_event_speakers_author_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_speakers_author_id" ON "public"."event_speakers" USING "btree" ("author_id");


--
-- Name: idx_event_speakers_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_speakers_event_id" ON "public"."event_speakers" USING "btree" ("event_id");


--
-- Name: idx_event_speakers_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_speakers_user_id" ON "public"."event_speakers" USING "btree" ("user_id");


--
-- Name: idx_event_sponsors_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_sponsors_event_id" ON "public"."event_sponsors" USING "btree" ("event_id");


--
-- Name: idx_event_staff_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_staff_event_id" ON "public"."event_staff" USING "btree" ("event_id");


--
-- Name: idx_event_staff_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_staff_user_id" ON "public"."event_staff" USING "btree" ("user_id");


--
-- Name: idx_event_surveys_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_surveys_event_id" ON "public"."event_surveys" USING "btree" ("event_id");


--
-- Name: idx_event_tags_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_tags_event_id" ON "public"."event_tags" USING "btree" ("event_id");


--
-- Name: idx_event_views_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_views_event_id" ON "public"."event_views" USING "btree" ("event_id");


--
-- Name: idx_event_views_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_views_user_id" ON "public"."event_views" USING "btree" ("user_id");


--
-- Name: idx_event_waitlists_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_waitlists_event_id" ON "public"."event_waitlists" USING "btree" ("event_id");


--
-- Name: idx_events_author_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_events_author_id" ON "public"."events" USING "btree" ("author_id");


--
-- Name: idx_events_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_events_book_id" ON "public"."events" USING "btree" ("book_id");


--
-- Name: idx_events_cover_image_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_events_cover_image_id" ON "public"."events" USING "btree" ("cover_image_id");


--
-- Name: idx_events_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_events_created_at" ON "public"."events" USING "btree" ("created_at" DESC);


--
-- Name: idx_events_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_events_created_by" ON "public"."events" USING "btree" ("created_by");


--
-- Name: idx_events_date_range; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_events_date_range" ON "public"."events" USING "btree" ("start_date", "end_date");


--
-- Name: idx_events_end_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_events_end_date" ON "public"."events" USING "btree" ("end_date");


--
-- Name: idx_events_event_image_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_events_event_image_id" ON "public"."events" USING "btree" ("event_image_id");


--
-- Name: idx_events_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_events_group_id" ON "public"."events" USING "btree" ("group_id");


--
-- Name: idx_events_parent_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_events_parent_event_id" ON "public"."events" USING "btree" ("parent_event_id");


--
-- Name: idx_events_publisher_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_events_publisher_id" ON "public"."events" USING "btree" ("publisher_id");


--
-- Name: idx_events_start_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_events_start_date" ON "public"."events" USING "btree" ("start_date");


--
-- Name: idx_events_title; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_events_title" ON "public"."events" USING "gin" ("to_tsvector"('"english"'::"regconfig", "title"));


--
-- Name: idx_feed_entries_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_feed_entries_created_at" ON "public"."feed_entries" USING "btree" ("created_at");


--
-- Name: idx_feed_entries_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_feed_entries_group_id" ON "public"."feed_entries" USING "btree" ("group_id");


--
-- Name: idx_feed_entries_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_feed_entries_user_id" ON "public"."feed_entries" USING "btree" ("user_id");


--
-- Name: idx_feed_entries_visibility; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_feed_entries_visibility" ON "public"."feed_entries" USING "btree" ("visibility");


--
-- Name: idx_feed_entry_tags_feed_entry_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_feed_entry_tags_feed_entry_id" ON "public"."feed_entry_tags" USING "btree" ("feed_entry_id");


--
-- Name: idx_follows_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_follows_created_at" ON "public"."follows" USING "btree" ("created_at" DESC);


--
-- Name: idx_follows_follower_following; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_follows_follower_following" ON "public"."follows" USING "btree" ("follower_id", "following_id");


--
-- Name: idx_follows_follower_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_follows_follower_id" ON "public"."follows" USING "btree" ("follower_id");


--
-- Name: idx_follows_following_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_follows_following_id" ON "public"."follows" USING "btree" ("following_id");


--
-- Name: idx_follows_target_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_follows_target_type" ON "public"."follows" USING "btree" ("target_type_id");


--
-- Name: idx_friends_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_friends_created_at" ON "public"."friends" USING "btree" ("created_at" DESC);


--
-- Name: idx_friends_friend_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_friends_friend_id" ON "public"."friends" USING "btree" ("friend_id");


--
-- Name: idx_friends_requested_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_friends_requested_by" ON "public"."friends" USING "btree" ("requested_by");


--
-- Name: idx_friends_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_friends_user_id" ON "public"."friends" USING "btree" ("user_id");


--
-- Name: idx_group_members_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_members_group_id" ON "public"."group_members" USING "btree" ("group_id");


--
-- Name: idx_group_members_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_members_status" ON "public"."group_members" USING "btree" ("status");


--
-- Name: idx_group_members_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_members_user_id" ON "public"."group_members" USING "btree" ("user_id");


--
-- Name: idx_groups_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_groups_created_at" ON "public"."groups" USING "btree" ("created_at" DESC);


--
-- Name: idx_groups_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_groups_created_by" ON "public"."groups" USING "btree" ("created_by");


--
-- Name: idx_groups_is_private; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_groups_is_private" ON "public"."groups" USING "btree" ("is_private");


--
-- Name: idx_groups_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_groups_name" ON "public"."groups" USING "gin" ("to_tsvector"('"english"'::"regconfig", ("name")::"text"));


--
-- Name: idx_groups_private_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_groups_private_created" ON "public"."groups" USING "btree" ("is_private", "created_at" DESC);


--
-- Name: idx_images_img_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_images_img_type_id" ON "public"."images" USING "btree" ("entity_type_id");


--
-- Name: idx_likes_feed_entry_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_likes_feed_entry_id" ON "public"."likes" USING "btree" ("feed_entry_id");


--
-- Name: idx_likes_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_likes_user_id" ON "public"."likes" USING "btree" ("user_id");


--
-- Name: idx_ml_models_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_ml_models_active" ON "public"."ml_models" USING "btree" ("is_active");


--
-- Name: idx_ml_models_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_ml_models_created_at" ON "public"."ml_models" USING "btree" ("created_at");


--
-- Name: idx_ml_models_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_ml_models_type" ON "public"."ml_models" USING "btree" ("model_type");


--
-- Name: idx_ml_predictions_confidence; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_ml_predictions_confidence" ON "public"."ml_predictions" USING "btree" ("confidence_score");


--
-- Name: idx_ml_predictions_model; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_ml_predictions_model" ON "public"."ml_predictions" USING "btree" ("model_id");


--
-- Name: idx_ml_predictions_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_ml_predictions_timestamp" ON "public"."ml_predictions" USING "btree" ("prediction_timestamp");


--
-- Name: idx_ml_predictions_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_ml_predictions_user" ON "public"."ml_predictions" USING "btree" ("user_id");


--
-- Name: idx_nlp_analysis_confidence; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_nlp_analysis_confidence" ON "public"."nlp_analysis" USING "btree" ("confidence_score");


--
-- Name: idx_nlp_analysis_content; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_nlp_analysis_content" ON "public"."nlp_analysis" USING "btree" ("content_id", "content_type");


--
-- Name: idx_nlp_analysis_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_nlp_analysis_type" ON "public"."nlp_analysis" USING "btree" ("analysis_type");


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_notifications_is_read" ON "public"."notifications" USING "btree" ("is_read");


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");


--
-- Name: idx_performance_metrics_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_performance_metrics_category" ON "public"."performance_metrics" USING "btree" ("category");


--
-- Name: idx_performance_metrics_name_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_performance_metrics_name_category" ON "public"."performance_metrics" USING "btree" ("metric_name", "category");


--
-- Name: idx_performance_metrics_recorded_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_performance_metrics_recorded_at" ON "public"."performance_metrics" USING "btree" ("recorded_at");


--
-- Name: idx_photo_albums_cover_image_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_photo_albums_cover_image_id" ON "public"."photo_albums" USING "btree" ("cover_image_id");


--
-- Name: idx_photo_albums_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_photo_albums_created_at" ON "public"."photo_albums" USING "btree" ("created_at");


--
-- Name: idx_photo_albums_deleted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_photo_albums_deleted" ON "public"."photo_albums" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);


--
-- Name: idx_photo_albums_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_photo_albums_entity" ON "public"."photo_albums" USING "btree" ("entity_type", "entity_id");


--
-- Name: idx_photo_albums_is_public; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_photo_albums_is_public" ON "public"."photo_albums" USING "btree" ("is_public");


--
-- Name: idx_photo_albums_owner_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_photo_albums_owner_entity" ON "public"."photo_albums" USING "btree" ("owner_id", "entity_type");


--
-- Name: idx_photo_albums_owner_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_photo_albums_owner_id" ON "public"."photo_albums" USING "btree" ("owner_id");


--
-- Name: idx_photo_albums_public_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_photo_albums_public_created" ON "public"."photo_albums" USING "btree" ("is_public", "created_at") WHERE (("is_public" = true) AND ("deleted_at" IS NULL));


--
-- Name: idx_privacy_audit_log_user_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_privacy_audit_log_user_action" ON "public"."privacy_audit_log" USING "btree" ("user_id", "action", "created_at");


--
-- Name: idx_profiles_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");


--
-- Name: idx_profiles_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_profiles_user_id" ON "public"."profiles" USING "btree" ("user_id");


--
-- Name: idx_publishers_country_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_publishers_country_id" ON "public"."publishers" USING "btree" ("country_id");


--
-- Name: idx_publishers_cover_image_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_publishers_cover_image_id" ON "public"."publishers" USING "btree" ("cover_image_id");


--
-- Name: idx_publishers_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_publishers_created_at" ON "public"."publishers" USING "btree" ("created_at" DESC);


--
-- Name: idx_publishers_featured; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_publishers_featured" ON "public"."publishers" USING "btree" ("featured");


--
-- Name: idx_publishers_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_publishers_name" ON "public"."publishers" USING "btree" ("name");


--
-- Name: idx_publishers_publisher_image_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_publishers_publisher_image_id" ON "public"."publishers" USING "btree" ("publisher_image_id");


--
-- Name: idx_reading_challenges_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_challenges_user_id" ON "public"."reading_challenges" USING "btree" ("user_id");


--
-- Name: idx_reading_lists_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_lists_user_id" ON "public"."reading_lists" USING "btree" ("user_id");


--
-- Name: idx_reading_progress_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_progress_book_id" ON "public"."reading_progress" USING "btree" ("book_id");


--
-- Name: idx_reading_progress_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_progress_created_at" ON "public"."reading_progress" USING "btree" ("created_at" DESC);


--
-- Name: idx_reading_progress_created_at_desc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_progress_created_at_desc" ON "public"."reading_progress" USING "btree" ("created_at" DESC);


--
-- Name: idx_reading_progress_privacy_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_progress_privacy_level" ON "public"."reading_progress" USING "btree" ("privacy_level");


--
-- Name: idx_reading_progress_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_progress_status" ON "public"."reading_progress" USING "btree" ("status");


--
-- Name: idx_reading_progress_status_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_progress_status_user" ON "public"."reading_progress" USING "btree" ("status", "user_id");


--
-- Name: idx_reading_progress_user_book_composite; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_progress_user_book_composite" ON "public"."reading_progress" USING "btree" ("user_id", "book_id");


--
-- Name: idx_reading_progress_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_progress_user_id" ON "public"."reading_progress" USING "btree" ("user_id");


--
-- Name: idx_reading_progress_user_privacy; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_progress_user_privacy" ON "public"."reading_progress" USING "btree" ("user_id", "privacy_level");


--
-- Name: idx_reading_progress_user_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_progress_user_status" ON "public"."reading_progress" USING "btree" ("user_id", "status");


--
-- Name: idx_smart_notifications_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_smart_notifications_priority" ON "public"."smart_notifications" USING "btree" ("priority_level");


--
-- Name: idx_smart_notifications_scheduled; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_smart_notifications_scheduled" ON "public"."smart_notifications" USING "btree" ("scheduled_for");


--
-- Name: idx_smart_notifications_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_smart_notifications_status" ON "public"."smart_notifications" USING "btree" ("delivery_status");


--
-- Name: idx_smart_notifications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_smart_notifications_user" ON "public"."smart_notifications" USING "btree" ("user_id");


--
-- Name: idx_system_health_checks_checked_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_system_health_checks_checked_at" ON "public"."system_health_checks" USING "btree" ("checked_at");


--
-- Name: idx_system_health_checks_name_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_system_health_checks_name_status" ON "public"."system_health_checks" USING "btree" ("check_name", "status");


--
-- Name: idx_system_health_checks_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_system_health_checks_status" ON "public"."system_health_checks" USING "btree" ("status");


--
-- Name: idx_user_activity_log_activity_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_activity_log_activity_type" ON "public"."user_activity_log" USING "btree" ("activity_type");


--
-- Name: idx_user_activity_log_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_activity_log_created_at" ON "public"."user_activity_log" USING "btree" ("created_at");


--
-- Name: idx_user_activity_log_user_activity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_activity_log_user_activity" ON "public"."user_activity_log" USING "btree" ("user_id", "activity_type");


--
-- Name: idx_user_activity_log_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_activity_log_user_id" ON "public"."user_activity_log" USING "btree" ("user_id");


--
-- Name: idx_user_friends_friend_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_friends_friend_id" ON "public"."user_friends" USING "btree" ("friend_id");


--
-- Name: idx_user_friends_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_friends_status" ON "public"."user_friends" USING "btree" ("status");


--
-- Name: idx_user_friends_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_friends_user_id" ON "public"."user_friends" USING "btree" ("user_id");


--
-- Name: idx_user_privacy_settings_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_privacy_settings_user_id" ON "public"."user_privacy_settings" USING "btree" ("user_id");


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");


--
-- Name: idx_users_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_users_role_id" ON "public"."users" USING "btree" ("role_id");


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX "ix_realtime_subscription_entity" ON "realtime"."subscription" USING "btree" ("entity");


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX "subscription_subscription_id_entity_filters_key" ON "realtime"."subscription" USING "btree" ("subscription_id", "entity", "filters");


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX "bname" ON "storage"."buckets" USING "btree" ("name");


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX "bucketid_objname" ON "storage"."objects" USING "btree" ("bucket_id", "name");


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX "idx_multipart_uploads_list" ON "storage"."s3_multipart_uploads" USING "btree" ("bucket_id", "key", "created_at");


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX "idx_objects_bucket_id_name" ON "storage"."objects" USING "btree" ("bucket_id", "name" COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX "name_prefix_search" ON "storage"."objects" USING "btree" ("name" "text_pattern_ops");


--
-- Name: messages_2025_05_28_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2025_05_28_pkey";


--
-- Name: messages_2025_05_29_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2025_05_29_pkey";


--
-- Name: messages_2025_05_30_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2025_05_30_pkey";


--
-- Name: messages_2025_05_31_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2025_05_31_pkey";


--
-- Name: messages_2025_06_01_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2025_06_01_pkey";


--
-- Name: messages_2025_06_02_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2025_06_02_pkey";


--
-- Name: messages_2025_06_03_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2025_06_03_pkey";


--
-- Name: users trigger_initialize_user_privacy_settings; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--

CREATE OR REPLACE TRIGGER "trigger_initialize_user_privacy_settings" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."initialize_user_privacy_settings"();


--
-- Name: authors audit_trail_authors; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "audit_trail_authors" AFTER INSERT OR DELETE OR UPDATE ON "public"."authors" FOR EACH ROW EXECUTE FUNCTION "public"."create_enterprise_audit_trail"();


--
-- Name: books audit_trail_books; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "audit_trail_books" AFTER INSERT OR DELETE OR UPDATE ON "public"."books" FOR EACH ROW EXECUTE FUNCTION "public"."create_enterprise_audit_trail"();


--
-- Name: publishers audit_trail_publishers; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "audit_trail_publishers" AFTER INSERT OR DELETE OR UPDATE ON "public"."publishers" FOR EACH ROW EXECUTE FUNCTION "public"."create_enterprise_audit_trail"();


--
-- Name: reading_progress audit_trail_reading_progress; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "audit_trail_reading_progress" AFTER INSERT OR DELETE OR UPDATE ON "public"."reading_progress" FOR EACH ROW EXECUTE FUNCTION "public"."create_enterprise_audit_trail"();


--
-- Name: users audit_trail_users; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "audit_trail_users" AFTER INSERT OR DELETE OR UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."create_enterprise_audit_trail"();


--
-- Name: photo_albums set_photo_albums_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_photo_albums_updated_at" BEFORE UPDATE ON "public"."photo_albums" FOR EACH ROW EXECUTE FUNCTION "public"."update_photo_albums_updated_at"();


--
-- Name: book_reviews trigger_book_reviews_popularity; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trigger_book_reviews_popularity" AFTER INSERT OR DELETE OR UPDATE ON "public"."book_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_book_popularity"();


--
-- Name: book_views trigger_book_views_popularity; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trigger_book_views_popularity" AFTER INSERT OR DELETE OR UPDATE ON "public"."book_views" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_book_popularity"();


--
-- Name: reading_progress trigger_handle_privacy_level_update; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trigger_handle_privacy_level_update" BEFORE INSERT OR UPDATE ON "public"."reading_progress" FOR EACH ROW EXECUTE FUNCTION "public"."handle_privacy_level_update"();


--
-- Name: reading_progress trigger_reading_progress_consistency; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trigger_reading_progress_consistency" BEFORE INSERT OR UPDATE ON "public"."reading_progress" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_reading_progress_consistency"();


--
-- Name: reading_progress trigger_reading_progress_popularity; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trigger_reading_progress_popularity" AFTER INSERT OR DELETE OR UPDATE ON "public"."reading_progress" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_book_popularity"();


--
-- Name: dewey_decimal_classifications update_dewey_decimal_classifications_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "update_dewey_decimal_classifications_updated_at" BEFORE UPDATE ON "public"."dewey_decimal_classifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: follows validate_follow_entity_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "validate_follow_entity_trigger" BEFORE INSERT ON "public"."follows" FOR EACH ROW EXECUTE FUNCTION "public"."validate_follow_entity_trigger"();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE OR REPLACE TRIGGER "tr_check_filters" BEFORE INSERT OR UPDATE ON "realtime"."subscription" FOR EACH ROW EXECUTE FUNCTION "realtime"."subscription_check_filters"();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE OR REPLACE TRIGGER "update_objects_updated_at" BEFORE UPDATE ON "storage"."objects" FOR EACH ROW EXECUTE FUNCTION "storage"."update_updated_at_column"();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "mfa_amr_claims_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_challenges"
    ADD CONSTRAINT "mfa_challenges_auth_factor_id_fkey" FOREIGN KEY ("factor_id") REFERENCES "auth"."mfa_factors"("id") ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."one_time_tokens"
    ADD CONSTRAINT "one_time_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_flow_state_id_fkey" FOREIGN KEY ("flow_state_id") REFERENCES "auth"."flow_state"("id") ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."sso_domains"
    ADD CONSTRAINT "sso_domains_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;


--
-- Name: activities activities_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE SET NULL;


--
-- Name: activities activities_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL;


--
-- Name: activities activities_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL;


--
-- Name: activities activities_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE SET NULL;


--
-- Name: activities activities_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."reading_lists"("id") ON DELETE SET NULL;


--
-- Name: activities activities_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."book_reviews"("id") ON DELETE SET NULL;


--
-- Name: activities activities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: activity_log activity_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: album_images album_images_album_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."album_images"
    ADD CONSTRAINT "album_images_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."photo_albums"("id") ON DELETE CASCADE;


--
-- Name: album_images album_images_entity_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."album_images"
    ADD CONSTRAINT "album_images_entity_type_id_fkey" FOREIGN KEY ("entity_type_id") REFERENCES "public"."entity_types"("id") ON DELETE SET NULL;


--
-- Name: album_images album_images_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."album_images"
    ADD CONSTRAINT "album_images_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;


--
-- Name: album_shares album_shares_album_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."album_shares"
    ADD CONSTRAINT "album_shares_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."photo_albums"("id") ON DELETE CASCADE;


--
-- Name: album_shares album_shares_shared_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."album_shares"
    ADD CONSTRAINT "album_shares_shared_by_fkey" FOREIGN KEY ("shared_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: album_shares album_shares_shared_with_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."album_shares"
    ADD CONSTRAINT "album_shares_shared_with_fkey" FOREIGN KEY ("shared_with") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: authors authors_author_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."authors"
    ADD CONSTRAINT "authors_author_image_id_fkey" FOREIGN KEY ("author_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;


--
-- Name: authors authors_cover_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."authors"
    ADD CONSTRAINT "authors_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;


--
-- Name: automation_executions automation_executions_workflow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."automation_executions"
    ADD CONSTRAINT "automation_executions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."automation_workflows"("id");


--
-- Name: automation_workflows automation_workflows_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."automation_workflows"
    ADD CONSTRAINT "automation_workflows_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");


--
-- Name: blocks blocks_blocked_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_blocked_user_id_fkey" FOREIGN KEY ("blocked_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: blocks blocks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: book_authors book_authors_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_authors"
    ADD CONSTRAINT "book_authors_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE CASCADE;


--
-- Name: book_authors book_authors_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_authors"
    ADD CONSTRAINT "book_authors_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: book_club_books book_club_books_book_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_club_books"
    ADD CONSTRAINT "book_club_books_book_club_id_fkey" FOREIGN KEY ("book_club_id") REFERENCES "public"."book_clubs"("id") ON DELETE CASCADE;


--
-- Name: book_club_books book_club_books_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_club_books"
    ADD CONSTRAINT "book_club_books_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: book_club_books book_club_books_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_club_books"
    ADD CONSTRAINT "book_club_books_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: book_club_discussion_comments book_club_discussion_comments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_club_discussion_comments"
    ADD CONSTRAINT "book_club_discussion_comments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: book_club_discussion_comments book_club_discussion_comments_discussion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_club_discussion_comments"
    ADD CONSTRAINT "book_club_discussion_comments_discussion_id_fkey" FOREIGN KEY ("discussion_id") REFERENCES "public"."book_club_discussions"("id") ON DELETE CASCADE;


--
-- Name: book_club_discussions book_club_discussions_book_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_club_discussions"
    ADD CONSTRAINT "book_club_discussions_book_club_id_fkey" FOREIGN KEY ("book_club_id") REFERENCES "public"."book_clubs"("id") ON DELETE CASCADE;


--
-- Name: book_club_discussions book_club_discussions_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_club_discussions"
    ADD CONSTRAINT "book_club_discussions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL;


--
-- Name: book_club_discussions book_club_discussions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_club_discussions"
    ADD CONSTRAINT "book_club_discussions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: book_club_members book_club_members_book_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_club_members"
    ADD CONSTRAINT "book_club_members_book_club_id_fkey" FOREIGN KEY ("book_club_id") REFERENCES "public"."book_clubs"("id") ON DELETE CASCADE;


--
-- Name: book_club_members book_club_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_club_members"
    ADD CONSTRAINT "book_club_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: book_clubs book_clubs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_clubs"
    ADD CONSTRAINT "book_clubs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: book_clubs book_clubs_current_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_clubs"
    ADD CONSTRAINT "book_clubs_current_book_id_fkey" FOREIGN KEY ("current_book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL;


--
-- Name: book_genre_mappings book_genre_mappings_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_genre_mappings"
    ADD CONSTRAINT "book_genre_mappings_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: book_genre_mappings book_genre_mappings_genre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_genre_mappings"
    ADD CONSTRAINT "book_genre_mappings_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "public"."book_genres"("id") ON DELETE CASCADE;


--
-- Name: book_popularity_metrics book_popularity_metrics_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_popularity_metrics"
    ADD CONSTRAINT "book_popularity_metrics_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: book_publishers book_publishers_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_publishers"
    ADD CONSTRAINT "book_publishers_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: book_publishers book_publishers_publisher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_publishers"
    ADD CONSTRAINT "book_publishers_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE CASCADE;


--
-- Name: book_recommendations book_recommendations_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_recommendations"
    ADD CONSTRAINT "book_recommendations_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: book_recommendations book_recommendations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_recommendations"
    ADD CONSTRAINT "book_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: book_reviews book_reviews_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_reviews"
    ADD CONSTRAINT "book_reviews_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: book_reviews book_reviews_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_reviews"
    ADD CONSTRAINT "book_reviews_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE SET NULL;


--
-- Name: book_reviews book_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_reviews"
    ADD CONSTRAINT "book_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: book_similarity_scores book_similarity_scores_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_similarity_scores"
    ADD CONSTRAINT "book_similarity_scores_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: book_subjects book_subjects_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_subjects"
    ADD CONSTRAINT "book_subjects_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: book_subjects book_subjects_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_subjects"
    ADD CONSTRAINT "book_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE;


--
-- Name: book_tag_mappings book_tag_mappings_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_tag_mappings"
    ADD CONSTRAINT "book_tag_mappings_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: book_tag_mappings book_tag_mappings_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_tag_mappings"
    ADD CONSTRAINT "book_tag_mappings_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."book_tags"("id") ON DELETE CASCADE;


--
-- Name: book_views book_views_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_views"
    ADD CONSTRAINT "book_views_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: book_views book_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_views"
    ADD CONSTRAINT "book_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: books books_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE SET NULL;


--
-- Name: books books_binding_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_binding_type_id_fkey" FOREIGN KEY ("binding_type_id") REFERENCES "public"."binding_types"("id") ON DELETE SET NULL;


--
-- Name: books books_cover_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;


--
-- Name: books books_format_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_format_type_id_fkey" FOREIGN KEY ("format_type_id") REFERENCES "public"."format_types"("id") ON DELETE SET NULL;


--
-- Name: books books_publisher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE SET NULL;


--
-- Name: books books_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "public"."statuses"("id") ON DELETE SET NULL;


--
-- Name: collaborative_filtering_data collaborative_filtering_data_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."collaborative_filtering_data"
    ADD CONSTRAINT "collaborative_filtering_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");


--
-- Name: comments comments_feed_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_feed_entry_id_fkey" FOREIGN KEY ("feed_entry_id") REFERENCES "public"."feed_entries"("id") ON DELETE CASCADE;


--
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: content_generation_jobs content_generation_jobs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."content_generation_jobs"
    ADD CONSTRAINT "content_generation_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");


--
-- Name: custom_permissions custom_permissions_target_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."custom_permissions"
    ADD CONSTRAINT "custom_permissions_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: custom_permissions custom_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."custom_permissions"
    ADD CONSTRAINT "custom_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: data_enrichment_jobs data_enrichment_jobs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."data_enrichment_jobs"
    ADD CONSTRAINT "data_enrichment_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");


--
-- Name: dewey_decimal_classifications dewey_decimal_classifications_parent_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."dewey_decimal_classifications"
    ADD CONSTRAINT "dewey_decimal_classifications_parent_code_fkey" FOREIGN KEY ("parent_code") REFERENCES "public"."dewey_decimal_classifications"("code");


--
-- Name: discussion_comments discussion_comments_discussion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."discussion_comments"
    ADD CONSTRAINT "discussion_comments_discussion_id_fkey" FOREIGN KEY ("discussion_id") REFERENCES "public"."discussions"("id") ON DELETE CASCADE;


--
-- Name: discussion_comments discussion_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."discussion_comments"
    ADD CONSTRAINT "discussion_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: discussions discussions_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."discussions"
    ADD CONSTRAINT "discussions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL;


--
-- Name: discussions discussions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."discussions"
    ADD CONSTRAINT "discussions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: enterprise_data_versions enterprise_data_versions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."enterprise_data_versions"
    ADD CONSTRAINT "enterprise_data_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;


--
-- Name: event_books event_books_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_books"
    ADD CONSTRAINT "event_books_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: event_books event_books_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_books"
    ADD CONSTRAINT "event_books_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_chat_messages event_chat_messages_chat_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_chat_messages"
    ADD CONSTRAINT "event_chat_messages_chat_room_id_fkey" FOREIGN KEY ("chat_room_id") REFERENCES "public"."event_chat_rooms"("id") ON DELETE CASCADE;


--
-- Name: event_chat_messages event_chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_chat_messages"
    ADD CONSTRAINT "event_chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: event_chat_rooms event_chat_rooms_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_chat_rooms"
    ADD CONSTRAINT "event_chat_rooms_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_comments event_comments_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_comments"
    ADD CONSTRAINT "event_comments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_comments event_comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_comments"
    ADD CONSTRAINT "event_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."event_comments"("id") ON DELETE SET NULL;


--
-- Name: event_comments event_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_comments"
    ADD CONSTRAINT "event_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: event_creator_permissions event_creator_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_creator_permissions"
    ADD CONSTRAINT "event_creator_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: event_financials event_financials_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_financials"
    ADD CONSTRAINT "event_financials_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_interests event_interests_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_interests"
    ADD CONSTRAINT "event_interests_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_interests event_interests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_interests"
    ADD CONSTRAINT "event_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: event_likes event_likes_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_likes"
    ADD CONSTRAINT "event_likes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_likes event_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_likes"
    ADD CONSTRAINT "event_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: event_livestreams event_livestreams_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_livestreams"
    ADD CONSTRAINT "event_livestreams_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_locations event_locations_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_locations"
    ADD CONSTRAINT "event_locations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_media event_media_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_media"
    ADD CONSTRAINT "event_media_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_permission_requests event_permission_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_permission_requests"
    ADD CONSTRAINT "event_permission_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;


--
-- Name: event_permission_requests event_permission_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_permission_requests"
    ADD CONSTRAINT "event_permission_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: event_questions event_questions_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_questions"
    ADD CONSTRAINT "event_questions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_registrations event_registrations_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_registrations event_registrations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: event_reminders event_reminders_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_reminders"
    ADD CONSTRAINT "event_reminders_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_reminders event_reminders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_reminders"
    ADD CONSTRAINT "event_reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: event_sessions event_sessions_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_sessions"
    ADD CONSTRAINT "event_sessions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_shares event_shares_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_shares"
    ADD CONSTRAINT "event_shares_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_shares event_shares_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_shares"
    ADD CONSTRAINT "event_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: event_speakers event_speakers_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_speakers"
    ADD CONSTRAINT "event_speakers_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE SET NULL;


--
-- Name: event_speakers event_speakers_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_speakers"
    ADD CONSTRAINT "event_speakers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_speakers event_speakers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_speakers"
    ADD CONSTRAINT "event_speakers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: event_sponsors event_sponsors_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_sponsors"
    ADD CONSTRAINT "event_sponsors_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_staff event_staff_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_staff"
    ADD CONSTRAINT "event_staff_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_staff event_staff_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_staff"
    ADD CONSTRAINT "event_staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: event_surveys event_surveys_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_surveys"
    ADD CONSTRAINT "event_surveys_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_tags event_tags_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_tags"
    ADD CONSTRAINT "event_tags_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_views event_views_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_views"
    ADD CONSTRAINT "event_views_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_views event_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_views"
    ADD CONSTRAINT "event_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: event_waitlists event_waitlists_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_waitlists"
    ADD CONSTRAINT "event_waitlists_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: events events_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE SET NULL;


--
-- Name: events events_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL;


--
-- Name: events events_cover_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: events events_event_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_event_image_id_fkey" FOREIGN KEY ("event_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;


--
-- Name: events events_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE SET NULL;


--
-- Name: events events_parent_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_parent_event_id_fkey" FOREIGN KEY ("parent_event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL;


--
-- Name: events events_publisher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE SET NULL;


--
-- Name: feed_entries feed_entries_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."feed_entries"
    ADD CONSTRAINT "feed_entries_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE SET NULL;


--
-- Name: feed_entries feed_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."feed_entries"
    ADD CONSTRAINT "feed_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: feed_entry_tags feed_entry_tags_feed_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."feed_entry_tags"
    ADD CONSTRAINT "feed_entry_tags_feed_entry_id_fkey" FOREIGN KEY ("feed_entry_id") REFERENCES "public"."feed_entries"("id") ON DELETE CASCADE;


--
-- Name: follows follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: friends friends_friend_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."friends"
    ADD CONSTRAINT "friends_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: friends friends_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."friends"
    ADD CONSTRAINT "friends_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: friends friends_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."friends"
    ADD CONSTRAINT "friends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: group_members group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;


--
-- Name: group_members group_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: images images_entity_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_entity_type_id_fkey" FOREIGN KEY ("entity_type_id") REFERENCES "public"."entity_types"("id") ON DELETE SET NULL;


--
-- Name: ml_models ml_models_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."ml_models"
    ADD CONSTRAINT "ml_models_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");


--
-- Name: ml_predictions ml_predictions_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."ml_predictions"
    ADD CONSTRAINT "ml_predictions_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."ml_models"("id");


--
-- Name: ml_predictions ml_predictions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."ml_predictions"
    ADD CONSTRAINT "ml_predictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");


--
-- Name: ml_training_jobs ml_training_jobs_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."ml_training_jobs"
    ADD CONSTRAINT "ml_training_jobs_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."ml_models"("id");


--
-- Name: photo_albums photo_albums_cover_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."photo_albums"
    ADD CONSTRAINT "photo_albums_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;


--
-- Name: photo_albums photo_albums_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."photo_albums"
    ADD CONSTRAINT "photo_albums_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: publishers publishers_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."publishers"
    ADD CONSTRAINT "publishers_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE SET NULL;


--
-- Name: publishers publishers_cover_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."publishers"
    ADD CONSTRAINT "publishers_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;


--
-- Name: publishers publishers_publisher_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."publishers"
    ADD CONSTRAINT "publishers_publisher_image_id_fkey" FOREIGN KEY ("publisher_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;


--
-- Name: reading_lists reading_lists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_lists"
    ADD CONSTRAINT "reading_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: reading_progress reading_progress_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_progress"
    ADD CONSTRAINT "reading_progress_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: reading_progress reading_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_progress"
    ADD CONSTRAINT "reading_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: smart_notifications smart_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."smart_notifications"
    ADD CONSTRAINT "smart_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");


--
-- Name: user_friends user_friends_friend_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_friends"
    ADD CONSTRAINT "user_friends_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: user_friends user_friends_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_friends"
    ADD CONSTRAINT "user_friends_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: user_friends user_friends_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_friends"
    ADD CONSTRAINT "user_friends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE SET NULL;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "storage"."s3_multipart_uploads"("id") ON DELETE CASCADE;


--
-- Name: users Users can read basic auth user info for follows; Type: POLICY; Schema: auth; Owner: supabase_auth_admin
--

CREATE POLICY "Users can read basic auth user info for follows" ON "auth"."users" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."audit_log_entries" ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."flow_state" ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."identities" ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."instances" ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."mfa_amr_claims" ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."mfa_challenges" ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."mfa_factors" ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."one_time_tokens" ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."refresh_tokens" ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."saml_providers" ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."saml_relay_states" ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."schema_migrations" ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."sessions" ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."sso_domains" ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."sso_providers" ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."users" ENABLE ROW LEVEL SECURITY;

--
-- Name: ml_models Admins can manage ML models; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage ML models" ON "public"."ml_models" USING ((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
  WHERE (("u"."id" = "auth"."uid"()) AND (("r"."name")::"text" = 'admin'::"text")))));


--
-- Name: automation_workflows Admins can manage automation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage automation" ON "public"."automation_workflows" USING ((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
  WHERE (("u"."id" = "auth"."uid"()) AND (("r"."name")::"text" = 'admin'::"text")))));


--
-- Name: dewey_decimal_classifications Allow admin access to dewey_decimal_classifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow admin access to dewey_decimal_classifications" ON "public"."dewey_decimal_classifications" USING (("auth"."role"() = 'admin'::"text"));


--
-- Name: activity_log Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."activity_log" FOR SELECT USING (true);


--
-- Name: album_analytics Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."album_analytics" FOR SELECT USING (true);


--
-- Name: album_shares Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."album_shares" FOR SELECT USING (true);


--
-- Name: book_authors Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."book_authors" FOR SELECT USING (true);


--
-- Name: book_club_books Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."book_club_books" FOR SELECT USING (true);


--
-- Name: book_club_discussion_comments Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."book_club_discussion_comments" FOR SELECT USING (true);


--
-- Name: book_club_discussions Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."book_club_discussions" FOR SELECT USING (true);


--
-- Name: book_club_members Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."book_club_members" FOR SELECT USING (true);


--
-- Name: book_clubs Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."book_clubs" FOR SELECT USING (true);


--
-- Name: book_genre_mappings Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."book_genre_mappings" FOR SELECT USING (true);


--
-- Name: book_publishers Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."book_publishers" FOR SELECT USING (true);


--
-- Name: book_recommendations Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."book_recommendations" FOR SELECT USING (true);


--
-- Name: book_similarity_scores Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."book_similarity_scores" FOR SELECT USING (true);


--
-- Name: book_subjects Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."book_subjects" FOR SELECT USING (true);


--
-- Name: book_tag_mappings Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."book_tag_mappings" FOR SELECT USING (true);


--
-- Name: book_tags Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."book_tags" FOR SELECT USING (true);


--
-- Name: book_views Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."book_views" FOR SELECT USING (true);


--
-- Name: carousel_images Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."carousel_images" FOR SELECT USING (true);


--
-- Name: contact_info Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."contact_info" FOR SELECT USING (true);


--
-- Name: discussion_comments Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."discussion_comments" FOR SELECT USING (true);


--
-- Name: discussions Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."discussions" FOR SELECT USING (true);


--
-- Name: entity_types Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."entity_types" FOR SELECT USING (true);


--
-- Name: event_analytics Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_analytics" FOR SELECT USING (true);


--
-- Name: event_approvals Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_approvals" FOR SELECT USING (true);


--
-- Name: event_books Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_books" FOR SELECT USING (true);


--
-- Name: event_calendar_exports Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_calendar_exports" FOR SELECT USING (true);


--
-- Name: event_categories Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_categories" FOR SELECT USING (true);


--
-- Name: event_chat_messages Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_chat_messages" FOR SELECT USING (true);


--
-- Name: event_chat_rooms Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_chat_rooms" FOR SELECT USING (true);


--
-- Name: event_comments Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_comments" FOR SELECT USING (true);


--
-- Name: event_creator_permissions Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_creator_permissions" FOR SELECT USING (true);


--
-- Name: event_financials Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_financials" FOR SELECT USING (true);


--
-- Name: event_interests Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_interests" FOR SELECT USING (true);


--
-- Name: event_likes Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_likes" FOR SELECT USING (true);


--
-- Name: event_livestreams Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_livestreams" FOR SELECT USING (true);


--
-- Name: event_locations Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_locations" FOR SELECT USING (true);


--
-- Name: event_media Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_media" FOR SELECT USING (true);


--
-- Name: event_permission_requests Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_permission_requests" FOR SELECT USING (true);


--
-- Name: event_questions Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_questions" FOR SELECT USING (true);


--
-- Name: event_registrations Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_registrations" FOR SELECT USING (true);


--
-- Name: event_reminders Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_reminders" FOR SELECT USING (true);


--
-- Name: event_sessions Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_sessions" FOR SELECT USING (true);


--
-- Name: event_shares Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_shares" FOR SELECT USING (true);


--
-- Name: event_speakers Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_speakers" FOR SELECT USING (true);


--
-- Name: event_sponsors Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_sponsors" FOR SELECT USING (true);


--
-- Name: event_staff Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_staff" FOR SELECT USING (true);


--
-- Name: event_surveys Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_surveys" FOR SELECT USING (true);


--
-- Name: event_tags Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_tags" FOR SELECT USING (true);


--
-- Name: event_types Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_types" FOR SELECT USING (true);


--
-- Name: event_views Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_views" FOR SELECT USING (true);


--
-- Name: event_waitlists Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."event_waitlists" FOR SELECT USING (true);


--
-- Name: feed_entry_tags Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."feed_entry_tags" FOR SELECT USING (true);


--
-- Name: follow_target_types Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."follow_target_types" FOR SELECT USING (true);


--
-- Name: group_achievements Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_achievements" FOR SELECT USING (true);


--
-- Name: group_analytics Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_analytics" FOR SELECT USING (true);


--
-- Name: group_announcements Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_announcements" FOR SELECT USING (true);


--
-- Name: group_audit_log Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_audit_log" FOR SELECT USING (true);


--
-- Name: group_author_events Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_author_events" FOR SELECT USING (true);


--
-- Name: group_book_list_items Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_book_list_items" FOR SELECT USING (true);


--
-- Name: group_book_lists Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_book_lists" FOR SELECT USING (true);


--
-- Name: group_book_reviews Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_book_reviews" FOR SELECT USING (true);


--
-- Name: group_book_swaps Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_book_swaps" FOR SELECT USING (true);


--
-- Name: group_book_wishlist_items Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_book_wishlist_items" FOR SELECT USING (true);


--
-- Name: group_book_wishlists Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_book_wishlists" FOR SELECT USING (true);


--
-- Name: group_bots Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_bots" FOR SELECT USING (true);


--
-- Name: group_chat_channels Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_chat_channels" FOR SELECT USING (true);


--
-- Name: group_chat_message_attachments Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_chat_message_attachments" FOR SELECT USING (true);


--
-- Name: group_chat_message_reactions Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_chat_message_reactions" FOR SELECT USING (true);


--
-- Name: group_chat_messages Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_chat_messages" FOR SELECT USING (true);


--
-- Name: group_content_moderation_logs Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_content_moderation_logs" FOR SELECT USING (true);


--
-- Name: group_custom_fields Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_custom_fields" FOR SELECT USING (true);


--
-- Name: group_discussion_categories Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_discussion_categories" FOR SELECT USING (true);


--
-- Name: group_event_feedback Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_event_feedback" FOR SELECT USING (true);


--
-- Name: group_events Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_events" FOR SELECT USING (true);


--
-- Name: group_integrations Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_integrations" FOR SELECT USING (true);


--
-- Name: group_invites Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_invites" FOR SELECT USING (true);


--
-- Name: group_leaderboards Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_leaderboards" FOR SELECT USING (true);


--
-- Name: group_member_achievements Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_member_achievements" FOR SELECT USING (true);


--
-- Name: group_member_devices Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_member_devices" FOR SELECT USING (true);


--
-- Name: group_member_streaks Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_member_streaks" FOR SELECT USING (true);


--
-- Name: group_membership_questions Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_membership_questions" FOR SELECT USING (true);


--
-- Name: group_moderation_logs Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_moderation_logs" FOR SELECT USING (true);


--
-- Name: group_onboarding_checklists Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_onboarding_checklists" FOR SELECT USING (true);


--
-- Name: group_onboarding_progress Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_onboarding_progress" FOR SELECT USING (true);


--
-- Name: group_onboarding_tasks Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_onboarding_tasks" FOR SELECT USING (true);


--
-- Name: group_poll_votes Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_poll_votes" FOR SELECT USING (true);


--
-- Name: group_polls Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_polls" FOR SELECT USING (true);


--
-- Name: group_reading_challenge_progress Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_reading_challenge_progress" FOR SELECT USING (true);


--
-- Name: group_reading_challenges Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_reading_challenges" FOR SELECT USING (true);


--
-- Name: group_reading_progress Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_reading_progress" FOR SELECT USING (true);


--
-- Name: group_reading_sessions Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_reading_sessions" FOR SELECT USING (true);


--
-- Name: group_reports Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_reports" FOR SELECT USING (true);


--
-- Name: group_roles Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_roles" FOR SELECT USING (true);


--
-- Name: group_rules Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_rules" FOR SELECT USING (true);


--
-- Name: group_shared_documents Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_shared_documents" FOR SELECT USING (true);


--
-- Name: group_tags Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_tags" FOR SELECT USING (true);


--
-- Name: group_types Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_types" FOR SELECT USING (true);


--
-- Name: group_webhook_logs Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_webhook_logs" FOR SELECT USING (true);


--
-- Name: group_webhooks Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_webhooks" FOR SELECT USING (true);


--
-- Name: group_welcome_messages Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."group_welcome_messages" FOR SELECT USING (true);


--
-- Name: id_mappings Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."id_mappings" FOR SELECT USING (true);


--
-- Name: image_tag_mappings Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."image_tag_mappings" FOR SELECT USING (true);


--
-- Name: image_tags Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."image_tags" FOR SELECT USING (true);


--
-- Name: images Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."images" FOR SELECT USING (true);


--
-- Name: invoices Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."invoices" FOR SELECT USING (true);


--
-- Name: list_followers Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."list_followers" FOR SELECT USING (true);


--
-- Name: media_attachments Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."media_attachments" FOR SELECT USING (true);


--
-- Name: mentions Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."mentions" FOR SELECT USING (true);


--
-- Name: payment_methods Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."payment_methods" FOR SELECT USING (true);


--
-- Name: payment_transactions Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."payment_transactions" FOR SELECT USING (true);


--
-- Name: personalized_recommendations Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."personalized_recommendations" FOR SELECT USING (true);


--
-- Name: photo_album Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."photo_album" FOR SELECT USING (true);


--
-- Name: prices Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."prices" FOR SELECT USING (true);


--
-- Name: promo_codes Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."promo_codes" FOR SELECT USING (true);


--
-- Name: reactions Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."reactions" FOR SELECT USING (true);


--
-- Name: reading_challenges Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."reading_challenges" FOR SELECT USING (true);


--
-- Name: reading_goals Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."reading_goals" FOR SELECT USING (true);


--
-- Name: reading_list_items Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."reading_list_items" FOR SELECT USING (true);


--
-- Name: reading_series Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."reading_series" FOR SELECT USING (true);


--
-- Name: reading_sessions Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."reading_sessions" FOR SELECT USING (true);


--
-- Name: reading_stats_daily Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."reading_stats_daily" FOR SELECT USING (true);


--
-- Name: reading_streaks Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."reading_streaks" FOR SELECT USING (true);


--
-- Name: review_likes Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."review_likes" FOR SELECT USING (true);


--
-- Name: reviews Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."reviews" FOR SELECT USING (true);


--
-- Name: roles Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."roles" FOR SELECT USING (true);


--
-- Name: series_events Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."series_events" FOR SELECT USING (true);


--
-- Name: session_registrations Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."session_registrations" FOR SELECT USING (true);


--
-- Name: similar_books Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."similar_books" FOR SELECT USING (true);


--
-- Name: statuses Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."statuses" FOR SELECT USING (true);


--
-- Name: subjects Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."subjects" FOR SELECT USING (true);


--
-- Name: survey_questions Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."survey_questions" FOR SELECT USING (true);


--
-- Name: survey_responses Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."survey_responses" FOR SELECT USING (true);


--
-- Name: sync_state Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."sync_state" FOR SELECT USING (true);


--
-- Name: ticket_benefits Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."ticket_benefits" FOR SELECT USING (true);


--
-- Name: ticket_types Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."ticket_types" FOR SELECT USING (true);


--
-- Name: tickets Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."tickets" FOR SELECT USING (true);


--
-- Name: user_book_interactions Allow public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read" ON "public"."user_book_interactions" FOR SELECT USING (true);


--
-- Name: dewey_decimal_classifications Allow read access to dewey_decimal_classifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow read access to dewey_decimal_classifications" ON "public"."dewey_decimal_classifications" FOR SELECT USING (true);


--
-- Name: photo_albums Public albums are viewable by everyone; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public albums are viewable by everyone" ON "public"."photo_albums" FOR SELECT USING ((("is_public" = true) AND (("deleted_at" IS NULL) OR ("deleted_at" > "now"()))));


--
-- Name: authors Public read access for authors; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read access for authors" ON "public"."authors" FOR SELECT USING (true);


--
-- Name: book_id_mapping Public read access for book_id_mapping; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read access for book_id_mapping" ON "public"."book_id_mapping" FOR SELECT USING (true);


--
-- Name: books Public read access for books; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read access for books" ON "public"."books" FOR SELECT USING (true);


--
-- Name: events Public read access for public events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read access for public events" ON "public"."events" FOR SELECT USING ((("visibility" = 'public'::"text") OR ("auth"."uid"() = "created_by")));


--
-- Name: groups Public read access for public groups; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read access for public groups" ON "public"."groups" FOR SELECT USING (((NOT "is_private") OR ("auth"."uid"() IN ( SELECT "group_members"."user_id"
   FROM "public"."group_members"
  WHERE ("group_members"."group_id" = "groups"."id")))));


--
-- Name: publishers Public read access for publishers; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read access for publishers" ON "public"."publishers" FOR SELECT USING (true);


--
-- Name: content_generation_jobs Users can create content jobs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create content jobs" ON "public"."content_generation_jobs" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));


--
-- Name: user_friends Users can create friend requests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create friend requests" ON "public"."user_friends" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));


--
-- Name: photo_albums Users can create their own albums; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own albums" ON "public"."photo_albums" FOR INSERT WITH CHECK (("owner_id" = "auth"."uid"()));


--
-- Name: photo_albums Users can delete their own albums; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own albums" ON "public"."photo_albums" FOR UPDATE USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()));


--
-- Name: user_friends Users can delete their own friends; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own friends" ON "public"."user_friends" FOR DELETE USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));


--
-- Name: ml_predictions Users can insert their own predictions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own predictions" ON "public"."ml_predictions" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: comments Users can manage own comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage own comments" ON "public"."comments" USING (("auth"."uid"() = "user_id"));


--
-- Name: likes Users can manage own likes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage own likes" ON "public"."likes" USING (("auth"."uid"() = "user_id"));


--
-- Name: photo_albums Users can manage own photo albums; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage own photo albums" ON "public"."photo_albums" USING (("auth"."uid"() = "owner_id"));


--
-- Name: profiles Users can read basic profile info for follows; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read basic profile info for follows" ON "public"."profiles" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: users Users can read basic user info for follows; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read basic user info for follows" ON "public"."users" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));


--
-- Name: users Users can update own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));


--
-- Name: photo_albums Users can update their own albums; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own albums" ON "public"."photo_albums" FOR UPDATE USING (("owner_id" = "auth"."uid"()));


--
-- Name: user_friends Users can update their own friends; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own friends" ON "public"."user_friends" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));


--
-- Name: smart_notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own notifications" ON "public"."smart_notifications" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: ml_models Users can view active ML models; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view active ML models" ON "public"."ml_models" FOR SELECT USING (("is_active" = true));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: users Users can view own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));


--
-- Name: photo_albums Users can view their own albums; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own albums" ON "public"."photo_albums" FOR SELECT USING ((("owner_id" = "auth"."uid"()) AND (("deleted_at" IS NULL) OR ("deleted_at" > "now"()))));


--
-- Name: content_generation_jobs Users can view their own content jobs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own content jobs" ON "public"."content_generation_jobs" FOR SELECT USING (("created_by" = "auth"."uid"()));


--
-- Name: user_friends Users can view their own friends; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own friends" ON "public"."user_friends" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));


--
-- Name: smart_notifications Users can view their own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own notifications" ON "public"."smart_notifications" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: ml_predictions Users can view their own predictions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own predictions" ON "public"."ml_predictions" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: activities; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;

--
-- Name: activities activities_delete_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "activities_delete_policy" ON "public"."activities" FOR DELETE USING (("auth"."uid"() = "user_id"));


--
-- Name: activities activities_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "activities_insert_policy" ON "public"."activities" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: activities activities_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "activities_select_policy" ON "public"."activities" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: activities activities_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "activities_update_policy" ON "public"."activities" FOR UPDATE USING (("auth"."uid"() = "user_id"));


--
-- Name: activity_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."activity_log" ENABLE ROW LEVEL SECURITY;

--
-- Name: book_reviews admin_full_access_enhanced; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin_full_access_enhanced" ON "public"."book_reviews" TO "authenticated" USING (("auth"."role"() = 'service_role'::"text"));


--
-- Name: books admin_full_access_enhanced; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin_full_access_enhanced" ON "public"."books" TO "authenticated" USING (("auth"."role"() = 'service_role'::"text"));


--
-- Name: reading_progress admin_full_access_enhanced; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin_full_access_enhanced" ON "public"."reading_progress" TO "authenticated" USING (("auth"."role"() = 'service_role'::"text"));


--
-- Name: performance_metrics admin_performance_metrics; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin_performance_metrics" ON "public"."performance_metrics" TO "authenticated" USING (("auth"."role"() = 'service_role'::"text"));


--
-- Name: system_health_checks admin_system_health_checks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin_system_health_checks" ON "public"."system_health_checks" TO "authenticated" USING (("auth"."role"() = 'service_role'::"text"));


--
-- Name: album_analytics; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."album_analytics" ENABLE ROW LEVEL SECURITY;

--
-- Name: album_images; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."album_images" ENABLE ROW LEVEL SECURITY;

--
-- Name: album_images album_images_delete_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "album_images_delete_policy" ON "public"."album_images" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."photo_albums"
  WHERE (("photo_albums"."id" = "album_images"."album_id") AND ("photo_albums"."owner_id" = "auth"."uid"())))));


--
-- Name: album_images album_images_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "album_images_insert_policy" ON "public"."album_images" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."photo_albums"
  WHERE (("photo_albums"."id" = "album_images"."album_id") AND ("photo_albums"."owner_id" = "auth"."uid"())))));


--
-- Name: album_images album_images_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "album_images_select_policy" ON "public"."album_images" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."photo_albums"
  WHERE (("photo_albums"."id" = "album_images"."album_id") AND (("photo_albums"."is_public" = true) OR ("photo_albums"."owner_id" = "auth"."uid"()))))));


--
-- Name: album_images album_images_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "album_images_update_policy" ON "public"."album_images" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."photo_albums"
  WHERE (("photo_albums"."id" = "album_images"."album_id") AND ("photo_albums"."owner_id" = "auth"."uid"())))));


--
-- Name: album_shares; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."album_shares" ENABLE ROW LEVEL SECURITY;

--
-- Name: enterprise_audit_trail audit_trail_admin_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "audit_trail_admin_read" ON "public"."enterprise_audit_trail" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role_id" IS NOT NULL)))));


--
-- Name: enterprise_audit_trail audit_trail_own_changes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "audit_trail_own_changes" ON "public"."enterprise_audit_trail" FOR SELECT TO "authenticated" USING (("changed_by" = "auth"."uid"()));


--
-- Name: authors; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."authors" ENABLE ROW LEVEL SECURITY;

--
-- Name: authors authors_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "authors_select_policy" ON "public"."authors" FOR SELECT USING (true);


--
-- Name: automation_executions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."automation_executions" ENABLE ROW LEVEL SECURITY;

--
-- Name: automation_workflows; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."automation_workflows" ENABLE ROW LEVEL SECURITY;

--
-- Name: binding_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."binding_types" ENABLE ROW LEVEL SECURITY;

--
-- Name: binding_types binding_types_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "binding_types_select_policy" ON "public"."binding_types" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: blocks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."blocks" ENABLE ROW LEVEL SECURITY;

--
-- Name: blocks blocks_delete_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "blocks_delete_policy" ON "public"."blocks" FOR DELETE USING (("auth"."uid"() = "user_id"));


--
-- Name: blocks blocks_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "blocks_insert_policy" ON "public"."blocks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: blocks blocks_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "blocks_select_policy" ON "public"."blocks" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "blocked_user_id")));


--
-- Name: book_authors; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."book_authors" ENABLE ROW LEVEL SECURITY;

--
-- Name: book_club_books; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."book_club_books" ENABLE ROW LEVEL SECURITY;

--
-- Name: book_club_discussion_comments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."book_club_discussion_comments" ENABLE ROW LEVEL SECURITY;

--
-- Name: book_club_discussions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."book_club_discussions" ENABLE ROW LEVEL SECURITY;

--
-- Name: book_club_members; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."book_club_members" ENABLE ROW LEVEL SECURITY;

--
-- Name: book_clubs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."book_clubs" ENABLE ROW LEVEL SECURITY;

--
-- Name: book_genre_mappings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."book_genre_mappings" ENABLE ROW LEVEL SECURITY;

--
-- Name: book_genres; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."book_genres" ENABLE ROW LEVEL SECURITY;

--
-- Name: book_genres book_genres_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "book_genres_select_policy" ON "public"."book_genres" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: book_id_mapping; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."book_id_mapping" ENABLE ROW LEVEL SECURITY;

--
-- Name: book_popularity_metrics; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."book_popularity_metrics" ENABLE ROW LEVEL SECURITY;

--
-- Name: book_publishers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."book_publishers" ENABLE ROW LEVEL SECURITY;

--
-- Name: book_recommendations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."book_recommendations" ENABLE ROW LEVEL SECURITY;

--
-- Name: book_reviews; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."book_reviews" ENABLE ROW LEVEL SECURITY;

--
-- Name: book_reviews book_reviews_delete_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "book_reviews_delete_policy" ON "public"."book_reviews" FOR DELETE USING (("auth"."uid"() = "user_id"));


--
-- Name: book_reviews book_reviews_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "book_reviews_insert_policy" ON "public"."book_reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: book_reviews book_reviews_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "book_reviews_select_policy" ON "public"."book_reviews" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: book_reviews book_reviews_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "book_reviews_update_policy" ON "public"."book_reviews" FOR UPDATE USING (("auth"."uid"() = "user_id"));


--
-- Name: book_similarity_scores; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."book_similarity_scores" ENABLE ROW LEVEL SECURITY;

--
-- Name: book_subjects; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."book_subjects" ENABLE ROW LEVEL SECURITY;

--
-- Name: book_tag_mappings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."book_tag_mappings" ENABLE ROW LEVEL SECURITY;

--
-- Name: book_tags; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."book_tags" ENABLE ROW LEVEL SECURITY;

--
-- Name: book_views; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."book_views" ENABLE ROW LEVEL SECURITY;

--
-- Name: books; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."books" ENABLE ROW LEVEL SECURITY;

--
-- Name: books books_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "books_select_policy" ON "public"."books" FOR SELECT USING (true);


--
-- Name: carousel_images; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."carousel_images" ENABLE ROW LEVEL SECURITY;

--
-- Name: collaborative_filtering_data; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."collaborative_filtering_data" ENABLE ROW LEVEL SECURITY;

--
-- Name: comments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_info; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."contact_info" ENABLE ROW LEVEL SECURITY;

--
-- Name: content_features; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."content_features" ENABLE ROW LEVEL SECURITY;

--
-- Name: content_generation_jobs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."content_generation_jobs" ENABLE ROW LEVEL SECURITY;

--
-- Name: countries; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."countries" ENABLE ROW LEVEL SECURITY;

--
-- Name: countries countries_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "countries_select_policy" ON "public"."countries" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: custom_permissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."custom_permissions" ENABLE ROW LEVEL SECURITY;

--
-- Name: custom_permissions custom_permissions_owner_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "custom_permissions_owner_policy" ON "public"."custom_permissions" USING (("auth"."uid"() = "user_id"));


--
-- Name: custom_permissions custom_permissions_target_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "custom_permissions_target_policy" ON "public"."custom_permissions" FOR SELECT USING (("auth"."uid"() = "target_user_id"));


--
-- Name: data_enrichment_jobs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."data_enrichment_jobs" ENABLE ROW LEVEL SECURITY;

--
-- Name: enterprise_data_lineage data_lineage_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "data_lineage_read" ON "public"."enterprise_data_lineage" FOR SELECT TO "authenticated" USING (true);


--
-- Name: enterprise_data_quality_rules data_quality_rules_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "data_quality_rules_read" ON "public"."enterprise_data_quality_rules" FOR SELECT TO "authenticated" USING (("is_active" = true));


--
-- Name: enterprise_data_versions data_versions_admin_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "data_versions_admin_access" ON "public"."enterprise_data_versions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role_id" IS NOT NULL)))));


--
-- Name: dewey_decimal_classifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."dewey_decimal_classifications" ENABLE ROW LEVEL SECURITY;

--
-- Name: discussion_comments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."discussion_comments" ENABLE ROW LEVEL SECURITY;

--
-- Name: discussions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."discussions" ENABLE ROW LEVEL SECURITY;

--
-- Name: enterprise_audit_trail; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."enterprise_audit_trail" ENABLE ROW LEVEL SECURITY;

--
-- Name: enterprise_data_lineage; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."enterprise_data_lineage" ENABLE ROW LEVEL SECURITY;

--
-- Name: enterprise_data_quality_rules; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."enterprise_data_quality_rules" ENABLE ROW LEVEL SECURITY;

--
-- Name: enterprise_data_versions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."enterprise_data_versions" ENABLE ROW LEVEL SECURITY;

--
-- Name: entity_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."entity_types" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_analytics; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_analytics" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_approvals; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_approvals" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_books; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_books" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_calendar_exports; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_calendar_exports" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_categories; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_categories" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_chat_messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_chat_messages" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_chat_rooms; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_chat_rooms" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_comments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_comments" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_creator_permissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_creator_permissions" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_financials; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_financials" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_interests; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_interests" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_likes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_likes" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_livestreams; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_livestreams" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_locations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_locations" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_media; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_media" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_permission_requests; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_permission_requests" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_questions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_questions" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_registrations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_registrations" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_reminders; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_reminders" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_sessions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_sessions" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_shares; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_shares" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_speakers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_speakers" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_sponsors; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_sponsors" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_staff; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_staff" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_surveys; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_surveys" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_tags; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_tags" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_types" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_views; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_views" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_waitlists; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_waitlists" ENABLE ROW LEVEL SECURITY;

--
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;

--
-- Name: feed_entries; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."feed_entries" ENABLE ROW LEVEL SECURITY;

--
-- Name: feed_entries feed_entries_delete_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "feed_entries_delete_policy" ON "public"."feed_entries" FOR DELETE USING (("auth"."uid"() = "user_id"));


--
-- Name: feed_entries feed_entries_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "feed_entries_insert_policy" ON "public"."feed_entries" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: feed_entries feed_entries_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "feed_entries_select_policy" ON "public"."feed_entries" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: feed_entries feed_entries_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "feed_entries_update_policy" ON "public"."feed_entries" FOR UPDATE USING (("auth"."uid"() = "user_id"));


--
-- Name: feed_entry_tags; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."feed_entry_tags" ENABLE ROW LEVEL SECURITY;

--
-- Name: follow_target_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."follow_target_types" ENABLE ROW LEVEL SECURITY;

--
-- Name: follows; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;

--
-- Name: follows follows_delete_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "follows_delete_policy" ON "public"."follows" FOR DELETE USING (("auth"."uid"() = "follower_id"));


--
-- Name: follows follows_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "follows_insert_policy" ON "public"."follows" FOR INSERT WITH CHECK (("auth"."uid"() = "follower_id"));


--
-- Name: follows follows_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "follows_select_policy" ON "public"."follows" FOR SELECT USING ((("auth"."uid"() = "follower_id") OR ("auth"."uid"() = "following_id")));


--
-- Name: follows follows_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "follows_update_policy" ON "public"."follows" FOR UPDATE USING (("auth"."uid"() = "follower_id"));


--
-- Name: format_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."format_types" ENABLE ROW LEVEL SECURITY;

--
-- Name: format_types format_types_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "format_types_select_policy" ON "public"."format_types" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: friends; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."friends" ENABLE ROW LEVEL SECURITY;

--
-- Name: friends friends_delete_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "friends_delete_policy" ON "public"."friends" FOR DELETE USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));


--
-- Name: friends friends_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "friends_insert_policy" ON "public"."friends" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: friends friends_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "friends_select_policy" ON "public"."friends" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));


--
-- Name: group_achievements; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_achievements" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_analytics; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_analytics" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_announcements; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_announcements" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_audit_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_audit_log" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_author_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_author_events" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_book_list_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_book_list_items" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_book_lists; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_book_lists" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_book_reviews; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_book_reviews" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_book_swaps; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_book_swaps" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_book_wishlist_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_book_wishlist_items" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_book_wishlists; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_book_wishlists" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_bots; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_bots" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_chat_channels; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_chat_channels" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_chat_message_attachments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_chat_message_attachments" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_chat_message_reactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_chat_message_reactions" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_chat_messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_chat_messages" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_content_moderation_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_content_moderation_logs" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_custom_fields; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_custom_fields" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_discussion_categories; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_discussion_categories" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_event_feedback; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_event_feedback" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_events" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_integrations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_integrations" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_invites; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_invites" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_leaderboards; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_leaderboards" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_member_achievements; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_member_achievements" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_member_devices; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_member_devices" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_member_streaks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_member_streaks" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_members; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_members" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_members group_members_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_members_select_policy" ON "public"."group_members" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."groups"
  WHERE (("groups"."id" = "group_members"."group_id") AND ("groups"."is_private" = false))))));


--
-- Name: group_membership_questions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_membership_questions" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_moderation_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_moderation_logs" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_onboarding_checklists; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_onboarding_checklists" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_onboarding_progress; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_onboarding_progress" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_onboarding_tasks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_onboarding_tasks" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_poll_votes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_poll_votes" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_polls; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_polls" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_reading_challenge_progress; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_reading_challenge_progress" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_reading_challenges; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_reading_challenges" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_reading_progress; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_reading_progress" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_reading_sessions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_reading_sessions" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_reports; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_reports" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_roles" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_rules; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_rules" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_shared_documents; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_shared_documents" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_tags; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_tags" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_types" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_webhook_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_webhook_logs" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_webhooks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_webhooks" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_welcome_messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_welcome_messages" ENABLE ROW LEVEL SECURITY;

--
-- Name: groups; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;

--
-- Name: id_mappings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."id_mappings" ENABLE ROW LEVEL SECURITY;

--
-- Name: image_tag_mappings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."image_tag_mappings" ENABLE ROW LEVEL SECURITY;

--
-- Name: image_tags; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."image_tags" ENABLE ROW LEVEL SECURITY;

--
-- Name: images; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."images" ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;

--
-- Name: likes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."likes" ENABLE ROW LEVEL SECURITY;

--
-- Name: list_followers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."list_followers" ENABLE ROW LEVEL SECURITY;

--
-- Name: media_attachments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."media_attachments" ENABLE ROW LEVEL SECURITY;

--
-- Name: mentions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."mentions" ENABLE ROW LEVEL SECURITY;

--
-- Name: ml_models; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."ml_models" ENABLE ROW LEVEL SECURITY;

--
-- Name: ml_predictions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."ml_predictions" ENABLE ROW LEVEL SECURITY;

--
-- Name: ml_training_jobs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."ml_training_jobs" ENABLE ROW LEVEL SECURITY;

--
-- Name: nlp_analysis; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."nlp_analysis" ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications notifications_delete_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "notifications_delete_policy" ON "public"."notifications" FOR DELETE USING (("auth"."uid"() = "user_id"));


--
-- Name: notifications notifications_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "notifications_insert_policy" ON "public"."notifications" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: notifications notifications_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "notifications_select_policy" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: notifications notifications_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "notifications_update_policy" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));


--
-- Name: payment_methods; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."payment_methods" ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_transactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."payment_transactions" ENABLE ROW LEVEL SECURITY;

--
-- Name: performance_metrics; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."performance_metrics" ENABLE ROW LEVEL SECURITY;

--
-- Name: personalized_recommendations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."personalized_recommendations" ENABLE ROW LEVEL SECURITY;

--
-- Name: photo_album; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."photo_album" ENABLE ROW LEVEL SECURITY;

--
-- Name: photo_albums; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."photo_albums" ENABLE ROW LEVEL SECURITY;

--
-- Name: photo_albums photo_albums_delete_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "photo_albums_delete_policy" ON "public"."photo_albums" FOR DELETE USING (("auth"."uid"() = "owner_id"));


--
-- Name: photo_albums photo_albums_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "photo_albums_insert_policy" ON "public"."photo_albums" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));


--
-- Name: photo_albums photo_albums_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "photo_albums_select_policy" ON "public"."photo_albums" FOR SELECT USING ((("is_public" = true) OR ("auth"."uid"() = "owner_id")));


--
-- Name: photo_albums photo_albums_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "photo_albums_update_policy" ON "public"."photo_albums" FOR UPDATE USING (("auth"."uid"() = "owner_id"));


--
-- Name: posts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;

--
-- Name: posts posts_delete_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "posts_delete_policy" ON "public"."posts" FOR DELETE USING (("auth"."uid"() = "user_id"));


--
-- Name: posts posts_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "posts_insert_policy" ON "public"."posts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: posts posts_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "posts_select_policy" ON "public"."posts" FOR SELECT USING ((("visibility" = 'public'::"text") OR ("auth"."uid"() = "user_id")));


--
-- Name: posts posts_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "posts_update_policy" ON "public"."posts" FOR UPDATE USING (("auth"."uid"() = "user_id"));


--
-- Name: prices; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."prices" ENABLE ROW LEVEL SECURITY;

--
-- Name: privacy_audit_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."privacy_audit_log" ENABLE ROW LEVEL SECURITY;

--
-- Name: privacy_audit_log privacy_audit_log_owner_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "privacy_audit_log_owner_policy" ON "public"."privacy_audit_log" USING (("auth"."uid"() = "user_id"));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

--
-- Name: promo_codes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."promo_codes" ENABLE ROW LEVEL SECURITY;

--
-- Name: book_popularity_metrics public_book_popularity_metrics; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_book_popularity_metrics" ON "public"."book_popularity_metrics" FOR SELECT TO "authenticated" USING (true);


--
-- Name: publishers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."publishers" ENABLE ROW LEVEL SECURITY;

--
-- Name: reactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."reactions" ENABLE ROW LEVEL SECURITY;

--
-- Name: reading_challenges; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."reading_challenges" ENABLE ROW LEVEL SECURITY;

--
-- Name: reading_goals; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."reading_goals" ENABLE ROW LEVEL SECURITY;

--
-- Name: reading_list_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."reading_list_items" ENABLE ROW LEVEL SECURITY;

--
-- Name: reading_lists; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."reading_lists" ENABLE ROW LEVEL SECURITY;

--
-- Name: reading_lists reading_lists_delete_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "reading_lists_delete_policy" ON "public"."reading_lists" FOR DELETE USING (("auth"."uid"() = "user_id"));


--
-- Name: reading_lists reading_lists_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "reading_lists_insert_policy" ON "public"."reading_lists" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: reading_lists reading_lists_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "reading_lists_select_policy" ON "public"."reading_lists" FOR SELECT USING ((("is_public" = true) OR ("auth"."uid"() = "user_id")));


--
-- Name: reading_lists reading_lists_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "reading_lists_update_policy" ON "public"."reading_lists" FOR UPDATE USING (("auth"."uid"() = "user_id"));


--
-- Name: reading_progress; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."reading_progress" ENABLE ROW LEVEL SECURITY;

--
-- Name: reading_progress reading_progress_owner_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "reading_progress_owner_policy" ON "public"."reading_progress" USING (("auth"."uid"() = "user_id"));


--
-- Name: reading_progress reading_progress_public_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "reading_progress_public_policy" ON "public"."reading_progress" FOR SELECT USING ((("privacy_level" = 'public'::"text") OR (("privacy_level" = 'friends'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."user_friends"
  WHERE ((("user_friends"."user_id" = "auth"."uid"()) AND ("user_friends"."friend_id" = "reading_progress"."user_id")) OR (("user_friends"."friend_id" = "auth"."uid"()) AND ("user_friends"."user_id" = "reading_progress"."user_id")))))) OR (("privacy_level" = 'followers'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."follows"
  WHERE (("follows"."follower_id" = "auth"."uid"()) AND ("follows"."following_id" = "reading_progress"."user_id")))))));


--
-- Name: reading_series; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."reading_series" ENABLE ROW LEVEL SECURITY;

--
-- Name: reading_sessions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."reading_sessions" ENABLE ROW LEVEL SECURITY;

--
-- Name: reading_stats_daily; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."reading_stats_daily" ENABLE ROW LEVEL SECURITY;

--
-- Name: reading_streaks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."reading_streaks" ENABLE ROW LEVEL SECURITY;

--
-- Name: review_likes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."review_likes" ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;

--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;

--
-- Name: series_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."series_events" ENABLE ROW LEVEL SECURITY;

--
-- Name: session_registrations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."session_registrations" ENABLE ROW LEVEL SECURITY;

--
-- Name: similar_books; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."similar_books" ENABLE ROW LEVEL SECURITY;

--
-- Name: smart_notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."smart_notifications" ENABLE ROW LEVEL SECURITY;

--
-- Name: statuses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."statuses" ENABLE ROW LEVEL SECURITY;

--
-- Name: subjects; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."subjects" ENABLE ROW LEVEL SECURITY;

--
-- Name: survey_questions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."survey_questions" ENABLE ROW LEVEL SECURITY;

--
-- Name: survey_responses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."survey_responses" ENABLE ROW LEVEL SECURITY;

--
-- Name: sync_state; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."sync_state" ENABLE ROW LEVEL SECURITY;

--
-- Name: system_health_checks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."system_health_checks" ENABLE ROW LEVEL SECURITY;

--
-- Name: tags; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;

--
-- Name: tags tags_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "tags_select_policy" ON "public"."tags" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: ticket_benefits; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."ticket_benefits" ENABLE ROW LEVEL SECURITY;

--
-- Name: ticket_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."ticket_types" ENABLE ROW LEVEL SECURITY;

--
-- Name: tickets; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;

--
-- Name: user_activity_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."user_activity_log" ENABLE ROW LEVEL SECURITY;

--
-- Name: user_book_interactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."user_book_interactions" ENABLE ROW LEVEL SECURITY;

--
-- Name: user_book_interactions user_book_interactions_delete_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_book_interactions_delete_policy" ON "public"."user_book_interactions" FOR DELETE USING (("auth"."uid"() = "user_id"));


--
-- Name: user_book_interactions user_book_interactions_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_book_interactions_insert_policy" ON "public"."user_book_interactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: user_book_interactions user_book_interactions_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_book_interactions_select_policy" ON "public"."user_book_interactions" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: user_book_interactions user_book_interactions_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_book_interactions_update_policy" ON "public"."user_book_interactions" FOR UPDATE USING (("auth"."uid"() = "user_id"));


--
-- Name: user_friends; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."user_friends" ENABLE ROW LEVEL SECURITY;

--
-- Name: user_activity_log user_own_activity_log; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_own_activity_log" ON "public"."user_activity_log" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));


--
-- Name: user_privacy_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."user_privacy_settings" ENABLE ROW LEVEL SECURITY;

--
-- Name: user_privacy_settings user_privacy_settings_owner_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_privacy_settings_owner_policy" ON "public"."user_privacy_settings" USING (("auth"."uid"() = "user_id"));


--
-- Name: user_reading_preferences; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."user_reading_preferences" ENABLE ROW LEVEL SECURITY;

--
-- Name: user_reading_preferences user_reading_preferences_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_reading_preferences_select_policy" ON "public"."user_reading_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE "realtime"."messages" ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE "storage"."buckets" ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE "storage"."migrations" ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE "storage"."objects" ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE "storage"."s3_multipart_uploads" ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE "storage"."s3_multipart_uploads_parts" ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA "auth"; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA "auth" TO "anon";
GRANT USAGE ON SCHEMA "auth" TO "authenticated";
GRANT USAGE ON SCHEMA "auth" TO "service_role";
GRANT ALL ON SCHEMA "auth" TO "supabase_auth_admin";
GRANT ALL ON SCHEMA "auth" TO "dashboard_user";
GRANT ALL ON SCHEMA "auth" TO "postgres";


--
-- Name: SCHEMA "extensions"; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA "extensions" TO "anon";
GRANT USAGE ON SCHEMA "extensions" TO "authenticated";
GRANT USAGE ON SCHEMA "extensions" TO "service_role";
GRANT ALL ON SCHEMA "extensions" TO "dashboard_user";


--
-- Name: SCHEMA "public"; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


--
-- Name: SCHEMA "realtime"; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA "realtime" TO "postgres";
GRANT USAGE ON SCHEMA "realtime" TO "anon";
GRANT USAGE ON SCHEMA "realtime" TO "authenticated";
GRANT USAGE ON SCHEMA "realtime" TO "service_role";
GRANT ALL ON SCHEMA "realtime" TO "supabase_realtime_admin";


--
-- Name: SCHEMA "storage"; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT ALL ON SCHEMA "storage" TO "postgres";
GRANT USAGE ON SCHEMA "storage" TO "anon";
GRANT USAGE ON SCHEMA "storage" TO "authenticated";
GRANT USAGE ON SCHEMA "storage" TO "service_role";
GRANT ALL ON SCHEMA "storage" TO "supabase_storage_admin";
GRANT ALL ON SCHEMA "storage" TO "dashboard_user";


--
-- Name: FUNCTION "email"(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION "auth"."email"() TO "dashboard_user";


--
-- Name: FUNCTION "jwt"(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION "auth"."jwt"() TO "postgres";
GRANT ALL ON FUNCTION "auth"."jwt"() TO "dashboard_user";


--
-- Name: FUNCTION "role"(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION "auth"."role"() TO "dashboard_user";


--
-- Name: FUNCTION "uid"(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION "auth"."uid"() TO "dashboard_user";


--
-- Name: FUNCTION "grant_pg_cron_access"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."grant_pg_cron_access"() FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."grant_pg_cron_access"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."grant_pg_cron_access"() TO "dashboard_user";


--
-- Name: FUNCTION "grant_pg_graphql_access"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."grant_pg_graphql_access"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "grant_pg_net_access"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."grant_pg_net_access"() FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."grant_pg_net_access"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."grant_pg_net_access"() TO "dashboard_user";


--
-- Name: FUNCTION "pgrst_ddl_watch"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgrst_ddl_watch"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgrst_drop_watch"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgrst_drop_watch"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "set_graphql_placeholder"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."set_graphql_placeholder"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "anonymize_user_data_enhanced"("p_user_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."anonymize_user_data_enhanced"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."anonymize_user_data_enhanced"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."anonymize_user_data_enhanced"("p_user_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "check_data_health"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."check_data_health"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_data_health"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_data_health"() TO "service_role";


--
-- Name: FUNCTION "check_data_integrity_health"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."check_data_integrity_health"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_data_integrity_health"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_data_integrity_health"() TO "service_role";


--
-- Name: FUNCTION "check_data_quality_issues_enhanced"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."check_data_quality_issues_enhanced"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_data_quality_issues_enhanced"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_data_quality_issues_enhanced"() TO "service_role";


--
-- Name: FUNCTION "check_existing_follow"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."check_existing_follow"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_existing_follow"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_existing_follow"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "check_is_following"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."check_is_following"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_is_following"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_is_following"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "check_publisher_data_health"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."check_publisher_data_health"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_publisher_data_health"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_publisher_data_health"() TO "service_role";


--
-- Name: FUNCTION "check_rate_limit_enhanced"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer, "p_window_minutes" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."check_rate_limit_enhanced"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer, "p_window_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_rate_limit_enhanced"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer, "p_window_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_rate_limit_enhanced"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer, "p_window_minutes" integer) TO "service_role";


--
-- Name: FUNCTION "check_reading_privacy_access"("target_user_id" "uuid", "requesting_user_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."check_reading_privacy_access"("target_user_id" "uuid", "requesting_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_reading_privacy_access"("target_user_id" "uuid", "requesting_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_reading_privacy_access"("target_user_id" "uuid", "requesting_user_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "cleanup_old_audit_trail"("p_days_to_keep" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."cleanup_old_audit_trail"("p_days_to_keep" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_audit_trail"("p_days_to_keep" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_audit_trail"("p_days_to_keep" integer) TO "service_role";


--
-- Name: FUNCTION "cleanup_old_monitoring_data"("p_days_to_keep" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."cleanup_old_monitoring_data"("p_days_to_keep" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_monitoring_data"("p_days_to_keep" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_monitoring_data"("p_days_to_keep" integer) TO "service_role";


--
-- Name: FUNCTION "cleanup_orphaned_records"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."cleanup_orphaned_records"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_orphaned_records"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_orphaned_records"() TO "service_role";


--
-- Name: FUNCTION "comprehensive_system_health_check_enhanced"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."comprehensive_system_health_check_enhanced"() TO "anon";
GRANT ALL ON FUNCTION "public"."comprehensive_system_health_check_enhanced"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."comprehensive_system_health_check_enhanced"() TO "service_role";


--
-- Name: FUNCTION "create_data_version"("p_table_name" "text", "p_record_id" "uuid", "p_change_reason" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_data_version"("p_table_name" "text", "p_record_id" "uuid", "p_change_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_data_version"("p_table_name" "text", "p_record_id" "uuid", "p_change_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_data_version"("p_table_name" "text", "p_record_id" "uuid", "p_change_reason" "text") TO "service_role";


--
-- Name: FUNCTION "create_enterprise_audit_trail"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_enterprise_audit_trail"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_enterprise_audit_trail"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_enterprise_audit_trail"() TO "service_role";


--
-- Name: FUNCTION "decrypt_sensitive_data_enhanced"("p_encrypted_data" "text", "p_key" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."decrypt_sensitive_data_enhanced"("p_encrypted_data" "text", "p_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."decrypt_sensitive_data_enhanced"("p_encrypted_data" "text", "p_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrypt_sensitive_data_enhanced"("p_encrypted_data" "text", "p_key" "text") TO "service_role";


--
-- Name: FUNCTION "delete_follow_record"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."delete_follow_record"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_follow_record"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_follow_record"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "encrypt_sensitive_data_enhanced"("p_data" "text", "p_key" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."encrypt_sensitive_data_enhanced"("p_data" "text", "p_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."encrypt_sensitive_data_enhanced"("p_data" "text", "p_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."encrypt_sensitive_data_enhanced"("p_data" "text", "p_key" "text") TO "service_role";


--
-- Name: FUNCTION "ensure_reading_progress_consistency"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."ensure_reading_progress_consistency"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_reading_progress_consistency"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_reading_progress_consistency"() TO "service_role";


--
-- Name: FUNCTION "export_user_data_enhanced"("p_user_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."export_user_data_enhanced"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."export_user_data_enhanced"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."export_user_data_enhanced"("p_user_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "extract_book_dimensions"("book_uuid" "uuid", "dimensions_json" "jsonb"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."extract_book_dimensions"("book_uuid" "uuid", "dimensions_json" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."extract_book_dimensions"("book_uuid" "uuid", "dimensions_json" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."extract_book_dimensions"("book_uuid" "uuid", "dimensions_json" "jsonb") TO "service_role";


--
-- Name: FUNCTION "fix_missing_publisher_relationships"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."fix_missing_publisher_relationships"() TO "anon";
GRANT ALL ON FUNCTION "public"."fix_missing_publisher_relationships"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fix_missing_publisher_relationships"() TO "service_role";


--
-- Name: FUNCTION "generate_data_health_report"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."generate_data_health_report"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_data_health_report"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_data_health_report"() TO "service_role";


--
-- Name: FUNCTION "generate_intelligent_content"("p_content_type" "text", "p_input_data" "jsonb", "p_user_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."generate_intelligent_content"("p_content_type" "text", "p_input_data" "jsonb", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_intelligent_content"("p_content_type" "text", "p_input_data" "jsonb", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_intelligent_content"("p_content_type" "text", "p_input_data" "jsonb", "p_user_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "generate_monitoring_report"("p_days_back" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."generate_monitoring_report"("p_days_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_monitoring_report"("p_days_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_monitoring_report"("p_days_back" integer) TO "service_role";


--
-- Name: FUNCTION "generate_smart_notification"("p_user_id" "uuid", "p_notification_type" "text", "p_context_data" "jsonb"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."generate_smart_notification"("p_user_id" "uuid", "p_notification_type" "text", "p_context_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_smart_notification"("p_user_id" "uuid", "p_notification_type" "text", "p_context_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_smart_notification"("p_user_id" "uuid", "p_notification_type" "text", "p_context_data" "jsonb") TO "service_role";


--
-- Name: FUNCTION "generate_system_alerts_enhanced"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."generate_system_alerts_enhanced"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_system_alerts_enhanced"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_system_alerts_enhanced"() TO "service_role";


--
-- Name: FUNCTION "get_ai_book_recommendations"("p_user_id" "uuid", "p_limit" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_ai_book_recommendations"("p_user_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_ai_book_recommendations"("p_user_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ai_book_recommendations"("p_user_id" "uuid", "p_limit" integer) TO "service_role";


--
-- Name: FUNCTION "get_data_lineage"("p_table_name" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_data_lineage"("p_table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_data_lineage"("p_table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_data_lineage"("p_table_name" "text") TO "service_role";


--
-- Name: FUNCTION "get_data_quality_report"("p_table_name" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_data_quality_report"("p_table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_data_quality_report"("p_table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_data_quality_report"("p_table_name" "text") TO "service_role";


--
-- Name: FUNCTION "get_entity_images"("p_entity_type" "text", "p_entity_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_entity_images"("p_entity_type" "text", "p_entity_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_entity_images"("p_entity_type" "text", "p_entity_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_entity_images"("p_entity_type" "text", "p_entity_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "get_performance_recommendations"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_performance_recommendations"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_performance_recommendations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_performance_recommendations"() TO "service_role";


--
-- Name: FUNCTION "get_privacy_audit_summary"("days_back" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_privacy_audit_summary"("days_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_privacy_audit_summary"("days_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_privacy_audit_summary"("days_back" integer) TO "service_role";


--
-- Name: FUNCTION "get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";


--
-- Name: FUNCTION "get_user_privacy_settings"("user_id_param" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_user_privacy_settings"("user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_privacy_settings"("user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_privacy_settings"("user_id_param" "uuid") TO "service_role";


--
-- Name: FUNCTION "grant_reading_permission"("target_user_id" "uuid", "permission_type" "text", "expires_at" timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."grant_reading_permission"("target_user_id" "uuid", "permission_type" "text", "expires_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."grant_reading_permission"("target_user_id" "uuid", "permission_type" "text", "expires_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."grant_reading_permission"("target_user_id" "uuid", "permission_type" "text", "expires_at" timestamp with time zone) TO "service_role";


--
-- Name: FUNCTION "handle_album_privacy_update"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."handle_album_privacy_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_album_privacy_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_album_privacy_update"() TO "service_role";


--
-- Name: FUNCTION "handle_privacy_level_update"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."handle_privacy_level_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_privacy_level_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_privacy_level_update"() TO "service_role";


--
-- Name: FUNCTION "handle_public_album_creation"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."handle_public_album_creation"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_public_album_creation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_public_album_creation"() TO "service_role";


--
-- Name: FUNCTION "initialize_user_privacy_settings"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."initialize_user_privacy_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_user_privacy_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_user_privacy_settings"() TO "service_role";


--
-- Name: FUNCTION "insert_follow_record"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."insert_follow_record"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_follow_record"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_follow_record"("p_follower_id" "uuid", "p_following_id" "uuid", "p_target_type_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "log_sensitive_operation_enhanced"("p_operation_type" "text", "p_table_name" "text", "p_record_id" "uuid", "p_user_id" "uuid", "p_details" "jsonb"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."log_sensitive_operation_enhanced"("p_operation_type" "text", "p_table_name" "text", "p_record_id" "uuid", "p_user_id" "uuid", "p_details" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_sensitive_operation_enhanced"("p_operation_type" "text", "p_table_name" "text", "p_record_id" "uuid", "p_user_id" "uuid", "p_details" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_sensitive_operation_enhanced"("p_operation_type" "text", "p_table_name" "text", "p_record_id" "uuid", "p_user_id" "uuid", "p_details" "jsonb") TO "service_role";


--
-- Name: FUNCTION "log_user_activity"("p_user_id" "uuid", "p_activity_type" "text", "p_activity_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" "text", "p_response_time_ms" integer, "p_status_code" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."log_user_activity"("p_user_id" "uuid", "p_activity_type" "text", "p_activity_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" "text", "p_response_time_ms" integer, "p_status_code" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."log_user_activity"("p_user_id" "uuid", "p_activity_type" "text", "p_activity_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" "text", "p_response_time_ms" integer, "p_status_code" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_user_activity"("p_user_id" "uuid", "p_activity_type" "text", "p_activity_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" "text", "p_response_time_ms" integer, "p_status_code" integer) TO "service_role";


--
-- Name: FUNCTION "map_progress_to_reading_status"("status" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."map_progress_to_reading_status"("status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."map_progress_to_reading_status"("status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."map_progress_to_reading_status"("status" "text") TO "service_role";


--
-- Name: FUNCTION "map_reading_status_to_progress"("status" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."map_reading_status_to_progress"("status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."map_reading_status_to_progress"("status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."map_reading_status_to_progress"("status" "text") TO "service_role";


--
-- Name: FUNCTION "mask_sensitive_data"("input_text" "text", "mask_type" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mask_sensitive_data"("input_text" "text", "mask_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mask_sensitive_data"("input_text" "text", "mask_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mask_sensitive_data"("input_text" "text", "mask_type" "text") TO "service_role";


--
-- Name: FUNCTION "monitor_data_health"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."monitor_data_health"() TO "anon";
GRANT ALL ON FUNCTION "public"."monitor_data_health"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."monitor_data_health"() TO "service_role";


--
-- Name: FUNCTION "monitor_database_performance_enhanced"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."monitor_database_performance_enhanced"() TO "anon";
GRANT ALL ON FUNCTION "public"."monitor_database_performance_enhanced"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."monitor_database_performance_enhanced"() TO "service_role";


--
-- Name: FUNCTION "monitor_entity_storage_usage"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."monitor_entity_storage_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."monitor_entity_storage_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."monitor_entity_storage_usage"() TO "service_role";


--
-- Name: FUNCTION "monitor_query_performance"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."monitor_query_performance"() TO "anon";
GRANT ALL ON FUNCTION "public"."monitor_query_performance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."monitor_query_performance"() TO "service_role";


--
-- Name: FUNCTION "perform_database_maintenance_enhanced"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."perform_database_maintenance_enhanced"() TO "anon";
GRANT ALL ON FUNCTION "public"."perform_database_maintenance_enhanced"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."perform_database_maintenance_enhanced"() TO "service_role";


--
-- Name: FUNCTION "perform_system_health_check"("p_check_name" "text", "p_status" "text", "p_details" "jsonb", "p_response_time_ms" integer, "p_error_message" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."perform_system_health_check"("p_check_name" "text", "p_status" "text", "p_details" "jsonb", "p_response_time_ms" integer, "p_error_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."perform_system_health_check"("p_check_name" "text", "p_status" "text", "p_details" "jsonb", "p_response_time_ms" integer, "p_error_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."perform_system_health_check"("p_check_name" "text", "p_status" "text", "p_details" "jsonb", "p_response_time_ms" integer, "p_error_message" "text") TO "service_role";


--
-- Name: FUNCTION "populate_album_images_entity_context"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."populate_album_images_entity_context"() TO "anon";
GRANT ALL ON FUNCTION "public"."populate_album_images_entity_context"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_album_images_entity_context"() TO "service_role";


--
-- Name: FUNCTION "populate_dewey_decimal_classifications"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."populate_dewey_decimal_classifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."populate_dewey_decimal_classifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_dewey_decimal_classifications"() TO "service_role";


--
-- Name: FUNCTION "populate_images_entity_type_id"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."populate_images_entity_type_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."populate_images_entity_type_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_images_entity_type_id"() TO "service_role";


--
-- Name: FUNCTION "process_complete_isbndb_book_data"("book_uuid" "uuid", "isbndb_data" "jsonb"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."process_complete_isbndb_book_data"("book_uuid" "uuid", "isbndb_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."process_complete_isbndb_book_data"("book_uuid" "uuid", "isbndb_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_complete_isbndb_book_data"("book_uuid" "uuid", "isbndb_data" "jsonb") TO "service_role";


--
-- Name: FUNCTION "process_dewey_decimal_classifications"("book_uuid" "uuid", "dewey_array" "text"[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."process_dewey_decimal_classifications"("book_uuid" "uuid", "dewey_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."process_dewey_decimal_classifications"("book_uuid" "uuid", "dewey_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_dewey_decimal_classifications"("book_uuid" "uuid", "dewey_array" "text"[]) TO "service_role";


--
-- Name: FUNCTION "process_other_isbns"("book_uuid" "uuid", "other_isbns_json" "jsonb"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."process_other_isbns"("book_uuid" "uuid", "other_isbns_json" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."process_other_isbns"("book_uuid" "uuid", "other_isbns_json" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_other_isbns"("book_uuid" "uuid", "other_isbns_json" "jsonb") TO "service_role";


--
-- Name: FUNCTION "process_related_books"("book_uuid" "uuid", "related_json" "jsonb"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."process_related_books"("book_uuid" "uuid", "related_json" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."process_related_books"("book_uuid" "uuid", "related_json" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_related_books"("book_uuid" "uuid", "related_json" "jsonb") TO "service_role";


--
-- Name: FUNCTION "record_performance_metric"("p_metric_name" "text", "p_metric_value" numeric, "p_metric_unit" "text", "p_category" "text", "p_additional_data" "jsonb"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."record_performance_metric"("p_metric_name" "text", "p_metric_value" numeric, "p_metric_unit" "text", "p_category" "text", "p_additional_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."record_performance_metric"("p_metric_name" "text", "p_metric_value" numeric, "p_metric_unit" "text", "p_category" "text", "p_additional_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_performance_metric"("p_metric_name" "text", "p_metric_value" numeric, "p_metric_unit" "text", "p_category" "text", "p_additional_data" "jsonb") TO "service_role";


--
-- Name: FUNCTION "refresh_materialized_views"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."refresh_materialized_views"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_materialized_views"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_materialized_views"() TO "service_role";


--
-- Name: FUNCTION "revoke_reading_permission"("target_user_id" "uuid", "permission_type" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."revoke_reading_permission"("target_user_id" "uuid", "permission_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."revoke_reading_permission"("target_user_id" "uuid", "permission_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."revoke_reading_permission"("target_user_id" "uuid", "permission_type" "text") TO "service_role";


--
-- Name: FUNCTION "run_data_maintenance"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."run_data_maintenance"() TO "anon";
GRANT ALL ON FUNCTION "public"."run_data_maintenance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_data_maintenance"() TO "service_role";


--
-- Name: FUNCTION "run_performance_maintenance"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."run_performance_maintenance"() TO "anon";
GRANT ALL ON FUNCTION "public"."run_performance_maintenance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_performance_maintenance"() TO "service_role";


--
-- Name: FUNCTION "safe_cleanup_orphaned_records"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."safe_cleanup_orphaned_records"() TO "anon";
GRANT ALL ON FUNCTION "public"."safe_cleanup_orphaned_records"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_cleanup_orphaned_records"() TO "service_role";


--
-- Name: FUNCTION "safe_fix_missing_publishers"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."safe_fix_missing_publishers"() TO "anon";
GRANT ALL ON FUNCTION "public"."safe_fix_missing_publishers"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_fix_missing_publishers"() TO "service_role";


--
-- Name: FUNCTION "simple_check_publisher_health"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."simple_check_publisher_health"() TO "anon";
GRANT ALL ON FUNCTION "public"."simple_check_publisher_health"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."simple_check_publisher_health"() TO "service_role";


--
-- Name: FUNCTION "simple_fix_missing_publishers"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."simple_fix_missing_publishers"() TO "anon";
GRANT ALL ON FUNCTION "public"."simple_fix_missing_publishers"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."simple_fix_missing_publishers"() TO "service_role";


--
-- Name: FUNCTION "standardize_reading_status_mappings"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."standardize_reading_status_mappings"() TO "anon";
GRANT ALL ON FUNCTION "public"."standardize_reading_status_mappings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."standardize_reading_status_mappings"() TO "service_role";


--
-- Name: FUNCTION "standardize_reading_statuses"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."standardize_reading_statuses"() TO "anon";
GRANT ALL ON FUNCTION "public"."standardize_reading_statuses"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."standardize_reading_statuses"() TO "service_role";


--
-- Name: FUNCTION "trigger_content_processing"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."trigger_content_processing"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_content_processing"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_content_processing"() TO "service_role";


--
-- Name: FUNCTION "trigger_recommendation_generation"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."trigger_recommendation_generation"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_recommendation_generation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_recommendation_generation"() TO "service_role";


--
-- Name: FUNCTION "trigger_update_book_popularity"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."trigger_update_book_popularity"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_book_popularity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_book_popularity"() TO "service_role";


--
-- Name: FUNCTION "update_book_popularity_metrics"("p_book_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_book_popularity_metrics"("p_book_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_book_popularity_metrics"("p_book_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_book_popularity_metrics"("p_book_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "update_photo_albums_updated_at"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_photo_albums_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_photo_albums_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_photo_albums_updated_at"() TO "service_role";


--
-- Name: FUNCTION "update_updated_at_column"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


--
-- Name: FUNCTION "update_user_privacy_settings"("default_privacy_level" "text", "allow_friends_to_see_reading" boolean, "allow_followers_to_see_reading" boolean, "allow_public_reading_profile" boolean, "show_reading_stats_publicly" boolean, "show_currently_reading_publicly" boolean, "show_reading_history_publicly" boolean, "show_reading_goals_publicly" boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_user_privacy_settings"("default_privacy_level" "text", "allow_friends_to_see_reading" boolean, "allow_followers_to_see_reading" boolean, "allow_public_reading_profile" boolean, "show_reading_stats_publicly" boolean, "show_currently_reading_publicly" boolean, "show_reading_history_publicly" boolean, "show_reading_goals_publicly" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_privacy_settings"("default_privacy_level" "text", "allow_friends_to_see_reading" boolean, "allow_followers_to_see_reading" boolean, "allow_public_reading_profile" boolean, "show_reading_stats_publicly" boolean, "show_currently_reading_publicly" boolean, "show_reading_history_publicly" boolean, "show_reading_goals_publicly" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_privacy_settings"("default_privacy_level" "text", "allow_friends_to_see_reading" boolean, "allow_followers_to_see_reading" boolean, "allow_public_reading_profile" boolean, "show_reading_stats_publicly" boolean, "show_currently_reading_publicly" boolean, "show_reading_history_publicly" boolean, "show_reading_goals_publicly" boolean) TO "service_role";


--
-- Name: FUNCTION "upsert_reading_progress"("p_user_id" "uuid", "p_book_id" "uuid", "p_status" "text", "p_progress_percentage" integer, "p_privacy_level" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."upsert_reading_progress"("p_user_id" "uuid", "p_book_id" "uuid", "p_status" "text", "p_progress_percentage" integer, "p_privacy_level" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_reading_progress"("p_user_id" "uuid", "p_book_id" "uuid", "p_status" "text", "p_progress_percentage" integer, "p_privacy_level" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_reading_progress"("p_user_id" "uuid", "p_book_id" "uuid", "p_status" "text", "p_progress_percentage" integer, "p_privacy_level" "text") TO "service_role";


--
-- Name: FUNCTION "validate_and_repair_data"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."validate_and_repair_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_and_repair_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_and_repair_data"() TO "service_role";


--
-- Name: FUNCTION "validate_book_data"("book_data" "jsonb"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."validate_book_data"("book_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_book_data"("book_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_book_data"("book_data" "jsonb") TO "service_role";


--
-- Name: FUNCTION "validate_book_data_enhanced"("p_title" "text", "p_author" "text", "p_isbn" "text", "p_publication_year" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."validate_book_data_enhanced"("p_title" "text", "p_author" "text", "p_isbn" "text", "p_publication_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."validate_book_data_enhanced"("p_title" "text", "p_author" "text", "p_isbn" "text", "p_publication_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_book_data_enhanced"("p_title" "text", "p_author" "text", "p_isbn" "text", "p_publication_year" integer) TO "service_role";


--
-- Name: FUNCTION "validate_enterprise_data_quality"("p_table_name" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."validate_enterprise_data_quality"("p_table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_enterprise_data_quality"("p_table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_enterprise_data_quality"("p_table_name" "text") TO "service_role";


--
-- Name: FUNCTION "validate_follow_entity"("p_entity_id" "uuid", "p_target_type" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."validate_follow_entity"("p_entity_id" "uuid", "p_target_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_follow_entity"("p_entity_id" "uuid", "p_target_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_follow_entity"("p_entity_id" "uuid", "p_target_type" "text") TO "service_role";


--
-- Name: FUNCTION "validate_follow_entity_trigger"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."validate_follow_entity_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_follow_entity_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_follow_entity_trigger"() TO "service_role";


--
-- Name: FUNCTION "validate_user_data_enhanced"("p_email" "text", "p_name" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."validate_user_data_enhanced"("p_email" "text", "p_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_user_data_enhanced"("p_email" "text", "p_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_user_data_enhanced"("p_email" "text", "p_name" "text") TO "service_role";


--
-- Name: FUNCTION "apply_rls"("wal" "jsonb", "max_record_bytes" integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "postgres";
GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "anon";
GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "service_role";
GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "supabase_realtime_admin";


--
-- Name: FUNCTION "broadcast_changes"("topic_name" "text", "event_name" "text", "operation" "text", "table_name" "text", "table_schema" "text", "new" "record", "old" "record", "level" "text"); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."broadcast_changes"("topic_name" "text", "event_name" "text", "operation" "text", "table_name" "text", "table_schema" "text", "new" "record", "old" "record", "level" "text") TO "postgres";
GRANT ALL ON FUNCTION "realtime"."broadcast_changes"("topic_name" "text", "event_name" "text", "operation" "text", "table_name" "text", "table_schema" "text", "new" "record", "old" "record", "level" "text") TO "dashboard_user";


--
-- Name: FUNCTION "build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "postgres";
GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "anon";
GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "service_role";
GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "supabase_realtime_admin";


--
-- Name: FUNCTION "cast"("val" "text", "type_" "regtype"); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "postgres";
GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "anon";
GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "service_role";
GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "supabase_realtime_admin";


--
-- Name: FUNCTION "check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text"); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "postgres";
GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "anon";
GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "service_role";
GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "supabase_realtime_admin";


--
-- Name: FUNCTION "is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "postgres";
GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "anon";
GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "service_role";
GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "supabase_realtime_admin";


--
-- Name: FUNCTION "list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "postgres";
GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "anon";
GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "service_role";
GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "supabase_realtime_admin";


--
-- Name: FUNCTION "quote_wal2json"("entity" "regclass"); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "postgres";
GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "anon";
GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "service_role";
GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "supabase_realtime_admin";


--
-- Name: FUNCTION "send"("payload" "jsonb", "event" "text", "topic" "text", "private" boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."send"("payload" "jsonb", "event" "text", "topic" "text", "private" boolean) TO "postgres";
GRANT ALL ON FUNCTION "realtime"."send"("payload" "jsonb", "event" "text", "topic" "text", "private" boolean) TO "dashboard_user";


--
-- Name: FUNCTION "subscription_check_filters"(); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "postgres";
GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "anon";
GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "service_role";
GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "supabase_realtime_admin";


--
-- Name: FUNCTION "to_regrole"("role_name" "text"); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "postgres";
GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "anon";
GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "service_role";
GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "supabase_realtime_admin";


--
-- Name: FUNCTION "topic"(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION "realtime"."topic"() TO "postgres";
GRANT ALL ON FUNCTION "realtime"."topic"() TO "dashboard_user";


--
-- Name: TABLE "audit_log_entries"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE "auth"."audit_log_entries" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."audit_log_entries" TO "postgres";
GRANT SELECT ON TABLE "auth"."audit_log_entries" TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "flow_state"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."flow_state" TO "postgres";
GRANT SELECT ON TABLE "auth"."flow_state" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."flow_state" TO "dashboard_user";


--
-- Name: TABLE "identities"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."identities" TO "postgres";
GRANT SELECT ON TABLE "auth"."identities" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."identities" TO "dashboard_user";


--
-- Name: TABLE "instances"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE "auth"."instances" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."instances" TO "postgres";
GRANT SELECT ON TABLE "auth"."instances" TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "mfa_amr_claims"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."mfa_amr_claims" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_amr_claims" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_amr_claims" TO "dashboard_user";


--
-- Name: TABLE "mfa_challenges"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."mfa_challenges" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_challenges" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_challenges" TO "dashboard_user";


--
-- Name: TABLE "mfa_factors"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."mfa_factors" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_factors" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_factors" TO "dashboard_user";


--
-- Name: TABLE "one_time_tokens"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."one_time_tokens" TO "postgres";
GRANT SELECT ON TABLE "auth"."one_time_tokens" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."one_time_tokens" TO "dashboard_user";


--
-- Name: TABLE "refresh_tokens"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE "auth"."refresh_tokens" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."refresh_tokens" TO "postgres";
GRANT SELECT ON TABLE "auth"."refresh_tokens" TO "postgres" WITH GRANT OPTION;


--
-- Name: SEQUENCE "refresh_tokens_id_seq"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE "auth"."refresh_tokens_id_seq" TO "dashboard_user";
GRANT ALL ON SEQUENCE "auth"."refresh_tokens_id_seq" TO "postgres";


--
-- Name: TABLE "saml_providers"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."saml_providers" TO "postgres";
GRANT SELECT ON TABLE "auth"."saml_providers" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."saml_providers" TO "dashboard_user";


--
-- Name: TABLE "saml_relay_states"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."saml_relay_states" TO "postgres";
GRANT SELECT ON TABLE "auth"."saml_relay_states" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."saml_relay_states" TO "dashboard_user";


--
-- Name: TABLE "schema_migrations"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE "auth"."schema_migrations" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."schema_migrations" TO "postgres";
GRANT SELECT ON TABLE "auth"."schema_migrations" TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "sessions"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."sessions" TO "postgres";
GRANT SELECT ON TABLE "auth"."sessions" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sessions" TO "dashboard_user";


--
-- Name: TABLE "sso_domains"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."sso_domains" TO "postgres";
GRANT SELECT ON TABLE "auth"."sso_domains" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sso_domains" TO "dashboard_user";


--
-- Name: TABLE "sso_providers"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."sso_providers" TO "postgres";
GRANT SELECT ON TABLE "auth"."sso_providers" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sso_providers" TO "dashboard_user";


--
-- Name: TABLE "users"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE "auth"."users" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."users" TO "postgres";
GRANT SELECT ON TABLE "auth"."users" TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "activities"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";


--
-- Name: TABLE "activity_log"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."activity_log" TO "anon";
GRANT ALL ON TABLE "public"."activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log" TO "service_role";


--
-- Name: TABLE "book_reviews"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."book_reviews" TO "anon";
GRANT ALL ON TABLE "public"."book_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."book_reviews" TO "service_role";


--
-- Name: TABLE "book_views"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."book_views" TO "anon";
GRANT ALL ON TABLE "public"."book_views" TO "authenticated";
GRANT ALL ON TABLE "public"."book_views" TO "service_role";


--
-- Name: TABLE "books"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."books" TO "anon";
GRANT ALL ON TABLE "public"."books" TO "authenticated";
GRANT ALL ON TABLE "public"."books" TO "service_role";


--
-- Name: TABLE "reading_lists"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."reading_lists" TO "anon";
GRANT ALL ON TABLE "public"."reading_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_lists" TO "service_role";


--
-- Name: TABLE "reading_progress"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."reading_progress" TO "anon";
GRANT ALL ON TABLE "public"."reading_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_progress" TO "service_role";


--
-- Name: TABLE "system_health_checks"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."system_health_checks" TO "anon";
GRANT ALL ON TABLE "public"."system_health_checks" TO "authenticated";
GRANT ALL ON TABLE "public"."system_health_checks" TO "service_role";


--
-- Name: TABLE "user_activity_log"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_activity_log" TO "anon";
GRANT ALL ON TABLE "public"."user_activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity_log" TO "service_role";


--
-- Name: TABLE "advanced_analytics_dashboard_enhanced"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."advanced_analytics_dashboard_enhanced" TO "anon";
GRANT ALL ON TABLE "public"."advanced_analytics_dashboard_enhanced" TO "authenticated";
GRANT ALL ON TABLE "public"."advanced_analytics_dashboard_enhanced" TO "service_role";


--
-- Name: TABLE "album_analytics"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."album_analytics" TO "anon";
GRANT ALL ON TABLE "public"."album_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."album_analytics" TO "service_role";


--
-- Name: TABLE "album_images"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."album_images" TO "anon";
GRANT ALL ON TABLE "public"."album_images" TO "authenticated";
GRANT ALL ON TABLE "public"."album_images" TO "service_role";


--
-- Name: TABLE "album_shares"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."album_shares" TO "anon";
GRANT ALL ON TABLE "public"."album_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."album_shares" TO "service_role";


--
-- Name: TABLE "authors"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."authors" TO "anon";
GRANT ALL ON TABLE "public"."authors" TO "authenticated";
GRANT ALL ON TABLE "public"."authors" TO "service_role";


--
-- Name: TABLE "automation_executions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."automation_executions" TO "anon";
GRANT ALL ON TABLE "public"."automation_executions" TO "authenticated";
GRANT ALL ON TABLE "public"."automation_executions" TO "service_role";


--
-- Name: TABLE "automation_workflows"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."automation_workflows" TO "anon";
GRANT ALL ON TABLE "public"."automation_workflows" TO "authenticated";
GRANT ALL ON TABLE "public"."automation_workflows" TO "service_role";


--
-- Name: TABLE "binding_types"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."binding_types" TO "anon";
GRANT ALL ON TABLE "public"."binding_types" TO "authenticated";
GRANT ALL ON TABLE "public"."binding_types" TO "service_role";


--
-- Name: TABLE "blocks"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."blocks" TO "anon";
GRANT ALL ON TABLE "public"."blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."blocks" TO "service_role";


--
-- Name: TABLE "book_authors"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."book_authors" TO "anon";
GRANT ALL ON TABLE "public"."book_authors" TO "authenticated";
GRANT ALL ON TABLE "public"."book_authors" TO "service_role";


--
-- Name: TABLE "book_club_books"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."book_club_books" TO "anon";
GRANT ALL ON TABLE "public"."book_club_books" TO "authenticated";
GRANT ALL ON TABLE "public"."book_club_books" TO "service_role";


--
-- Name: TABLE "book_club_discussion_comments"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."book_club_discussion_comments" TO "anon";
GRANT ALL ON TABLE "public"."book_club_discussion_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."book_club_discussion_comments" TO "service_role";


--
-- Name: TABLE "book_club_discussions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."book_club_discussions" TO "anon";
GRANT ALL ON TABLE "public"."book_club_discussions" TO "authenticated";
GRANT ALL ON TABLE "public"."book_club_discussions" TO "service_role";


--
-- Name: TABLE "book_club_members"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."book_club_members" TO "anon";
GRANT ALL ON TABLE "public"."book_club_members" TO "authenticated";
GRANT ALL ON TABLE "public"."book_club_members" TO "service_role";


--
-- Name: TABLE "book_clubs"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."book_clubs" TO "anon";
GRANT ALL ON TABLE "public"."book_clubs" TO "authenticated";
GRANT ALL ON TABLE "public"."book_clubs" TO "service_role";


--
-- Name: TABLE "book_genre_mappings"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."book_genre_mappings" TO "anon";
GRANT ALL ON TABLE "public"."book_genre_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."book_genre_mappings" TO "service_role";


--
-- Name: TABLE "book_genres"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."book_genres" TO "anon";
GRANT ALL ON TABLE "public"."book_genres" TO "authenticated";
GRANT ALL ON TABLE "public"."book_genres" TO "service_role";


--
-- Name: TABLE "book_id_mapping"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."book_id_mapping" TO "anon";
GRANT ALL ON TABLE "public"."book_id_mapping" TO "authenticated";
GRANT ALL ON TABLE "public"."book_id_mapping" TO "service_role";


--
-- Name: TABLE "book_popularity_metrics"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."book_popularity_metrics" TO "anon";
GRANT ALL ON TABLE "public"."book_popularity_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."book_popularity_metrics" TO "service_role";


--
-- Name: TABLE "book_popularity_analytics"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."book_popularity_analytics" TO "anon";
GRANT ALL ON TABLE "public"."book_popularity_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."book_popularity_analytics" TO "service_role";


--
-- Name: TABLE "book_popularity_summary"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."book_popularity_summary" TO "anon";
GRANT ALL ON TABLE "public"."book_popularity_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."book_popularity_summary" TO "service_role";


--
-- Name: TABLE "book_publishers"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."book_publishers" TO "anon";
GRANT ALL ON TABLE "public"."book_publishers" TO "authenticated";
GRANT ALL ON TABLE "public"."book_publishers" TO "service_role";


--
-- Name: TABLE "book_recommendations"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."book_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."book_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."book_recommendations" TO "service_role";


--
-- Name: TABLE "book_similarity_scores"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."book_similarity_scores" TO "anon";
GRANT ALL ON TABLE "public"."book_similarity_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."book_similarity_scores" TO "service_role";


--
-- Name: TABLE "book_subjects"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."book_subjects" TO "anon";
GRANT ALL ON TABLE "public"."book_subjects" TO "authenticated";
GRANT ALL ON TABLE "public"."book_subjects" TO "service_role";


--
-- Name: TABLE "book_tag_mappings"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."book_tag_mappings" TO "anon";
GRANT ALL ON TABLE "public"."book_tag_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."book_tag_mappings" TO "service_role";


--
-- Name: TABLE "book_tags"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."book_tags" TO "anon";
GRANT ALL ON TABLE "public"."book_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."book_tags" TO "service_role";


--
-- Name: TABLE "carousel_images"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."carousel_images" TO "anon";
GRANT ALL ON TABLE "public"."carousel_images" TO "authenticated";
GRANT ALL ON TABLE "public"."carousel_images" TO "service_role";


--
-- Name: TABLE "collaborative_filtering_data"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."collaborative_filtering_data" TO "anon";
GRANT ALL ON TABLE "public"."collaborative_filtering_data" TO "authenticated";
GRANT ALL ON TABLE "public"."collaborative_filtering_data" TO "service_role";


--
-- Name: TABLE "comments"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";


--
-- Name: TABLE "contact_info"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."contact_info" TO "anon";
GRANT ALL ON TABLE "public"."contact_info" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_info" TO "service_role";


--
-- Name: TABLE "content_features"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."content_features" TO "anon";
GRANT ALL ON TABLE "public"."content_features" TO "authenticated";
GRANT ALL ON TABLE "public"."content_features" TO "service_role";


--
-- Name: TABLE "content_generation_jobs"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."content_generation_jobs" TO "anon";
GRANT ALL ON TABLE "public"."content_generation_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."content_generation_jobs" TO "service_role";


--
-- Name: TABLE "countries"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."countries" TO "anon";
GRANT ALL ON TABLE "public"."countries" TO "authenticated";
GRANT ALL ON TABLE "public"."countries" TO "service_role";


--
-- Name: TABLE "custom_permissions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."custom_permissions" TO "anon";
GRANT ALL ON TABLE "public"."custom_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_permissions" TO "service_role";


--
-- Name: TABLE "data_consistency_monitoring"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."data_consistency_monitoring" TO "anon";
GRANT ALL ON TABLE "public"."data_consistency_monitoring" TO "authenticated";
GRANT ALL ON TABLE "public"."data_consistency_monitoring" TO "service_role";


--
-- Name: TABLE "data_enrichment_jobs"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."data_enrichment_jobs" TO "anon";
GRANT ALL ON TABLE "public"."data_enrichment_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."data_enrichment_jobs" TO "service_role";


--
-- Name: TABLE "dewey_decimal_classifications"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."dewey_decimal_classifications" TO "anon";
GRANT ALL ON TABLE "public"."dewey_decimal_classifications" TO "authenticated";
GRANT ALL ON TABLE "public"."dewey_decimal_classifications" TO "service_role";


--
-- Name: TABLE "discussion_comments"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."discussion_comments" TO "anon";
GRANT ALL ON TABLE "public"."discussion_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."discussion_comments" TO "service_role";


--
-- Name: TABLE "discussions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."discussions" TO "anon";
GRANT ALL ON TABLE "public"."discussions" TO "authenticated";
GRANT ALL ON TABLE "public"."discussions" TO "service_role";


--
-- Name: TABLE "enterprise_audit_trail"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."enterprise_audit_trail" TO "anon";
GRANT ALL ON TABLE "public"."enterprise_audit_trail" TO "authenticated";
GRANT ALL ON TABLE "public"."enterprise_audit_trail" TO "service_role";


--
-- Name: TABLE "enterprise_audit_summary"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."enterprise_audit_summary" TO "anon";
GRANT ALL ON TABLE "public"."enterprise_audit_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."enterprise_audit_summary" TO "service_role";


--
-- Name: TABLE "enterprise_data_lineage"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."enterprise_data_lineage" TO "anon";
GRANT ALL ON TABLE "public"."enterprise_data_lineage" TO "authenticated";
GRANT ALL ON TABLE "public"."enterprise_data_lineage" TO "service_role";


--
-- Name: TABLE "enterprise_data_quality_dashboard"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."enterprise_data_quality_dashboard" TO "anon";
GRANT ALL ON TABLE "public"."enterprise_data_quality_dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."enterprise_data_quality_dashboard" TO "service_role";


--
-- Name: TABLE "enterprise_data_quality_rules"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."enterprise_data_quality_rules" TO "anon";
GRANT ALL ON TABLE "public"."enterprise_data_quality_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."enterprise_data_quality_rules" TO "service_role";


--
-- Name: TABLE "enterprise_data_versions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."enterprise_data_versions" TO "anon";
GRANT ALL ON TABLE "public"."enterprise_data_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."enterprise_data_versions" TO "service_role";


--
-- Name: TABLE "entity_types"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."entity_types" TO "anon";
GRANT ALL ON TABLE "public"."entity_types" TO "authenticated";
GRANT ALL ON TABLE "public"."entity_types" TO "service_role";


--
-- Name: TABLE "images"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."images" TO "anon";
GRANT ALL ON TABLE "public"."images" TO "authenticated";
GRANT ALL ON TABLE "public"."images" TO "service_role";


--
-- Name: TABLE "entity_image_analytics"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."entity_image_analytics" TO "anon";
GRANT ALL ON TABLE "public"."entity_image_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."entity_image_analytics" TO "service_role";


--
-- Name: TABLE "event_analytics"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_analytics" TO "anon";
GRANT ALL ON TABLE "public"."event_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."event_analytics" TO "service_role";


--
-- Name: TABLE "event_approvals"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_approvals" TO "anon";
GRANT ALL ON TABLE "public"."event_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."event_approvals" TO "service_role";


--
-- Name: TABLE "event_books"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_books" TO "anon";
GRANT ALL ON TABLE "public"."event_books" TO "authenticated";
GRANT ALL ON TABLE "public"."event_books" TO "service_role";


--
-- Name: TABLE "event_calendar_exports"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_calendar_exports" TO "anon";
GRANT ALL ON TABLE "public"."event_calendar_exports" TO "authenticated";
GRANT ALL ON TABLE "public"."event_calendar_exports" TO "service_role";


--
-- Name: TABLE "event_categories"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_categories" TO "anon";
GRANT ALL ON TABLE "public"."event_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."event_categories" TO "service_role";


--
-- Name: TABLE "event_chat_messages"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."event_chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."event_chat_messages" TO "service_role";


--
-- Name: TABLE "event_chat_rooms"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_chat_rooms" TO "anon";
GRANT ALL ON TABLE "public"."event_chat_rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."event_chat_rooms" TO "service_role";


--
-- Name: TABLE "event_comments"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_comments" TO "anon";
GRANT ALL ON TABLE "public"."event_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."event_comments" TO "service_role";


--
-- Name: TABLE "event_creator_permissions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_creator_permissions" TO "anon";
GRANT ALL ON TABLE "public"."event_creator_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."event_creator_permissions" TO "service_role";


--
-- Name: TABLE "event_financials"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_financials" TO "anon";
GRANT ALL ON TABLE "public"."event_financials" TO "authenticated";
GRANT ALL ON TABLE "public"."event_financials" TO "service_role";


--
-- Name: TABLE "event_interests"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_interests" TO "anon";
GRANT ALL ON TABLE "public"."event_interests" TO "authenticated";
GRANT ALL ON TABLE "public"."event_interests" TO "service_role";


--
-- Name: TABLE "event_likes"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_likes" TO "anon";
GRANT ALL ON TABLE "public"."event_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."event_likes" TO "service_role";


--
-- Name: TABLE "event_livestreams"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_livestreams" TO "anon";
GRANT ALL ON TABLE "public"."event_livestreams" TO "authenticated";
GRANT ALL ON TABLE "public"."event_livestreams" TO "service_role";


--
-- Name: TABLE "event_locations"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_locations" TO "anon";
GRANT ALL ON TABLE "public"."event_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."event_locations" TO "service_role";


--
-- Name: TABLE "event_media"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_media" TO "anon";
GRANT ALL ON TABLE "public"."event_media" TO "authenticated";
GRANT ALL ON TABLE "public"."event_media" TO "service_role";


--
-- Name: TABLE "event_permission_requests"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_permission_requests" TO "anon";
GRANT ALL ON TABLE "public"."event_permission_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."event_permission_requests" TO "service_role";


--
-- Name: TABLE "event_questions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_questions" TO "anon";
GRANT ALL ON TABLE "public"."event_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."event_questions" TO "service_role";


--
-- Name: TABLE "event_registrations"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_registrations" TO "anon";
GRANT ALL ON TABLE "public"."event_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."event_registrations" TO "service_role";


--
-- Name: TABLE "event_reminders"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_reminders" TO "anon";
GRANT ALL ON TABLE "public"."event_reminders" TO "authenticated";
GRANT ALL ON TABLE "public"."event_reminders" TO "service_role";


--
-- Name: TABLE "event_sessions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_sessions" TO "anon";
GRANT ALL ON TABLE "public"."event_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."event_sessions" TO "service_role";


--
-- Name: TABLE "event_shares"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_shares" TO "anon";
GRANT ALL ON TABLE "public"."event_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."event_shares" TO "service_role";


--
-- Name: TABLE "event_speakers"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_speakers" TO "anon";
GRANT ALL ON TABLE "public"."event_speakers" TO "authenticated";
GRANT ALL ON TABLE "public"."event_speakers" TO "service_role";


--
-- Name: TABLE "event_sponsors"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_sponsors" TO "anon";
GRANT ALL ON TABLE "public"."event_sponsors" TO "authenticated";
GRANT ALL ON TABLE "public"."event_sponsors" TO "service_role";


--
-- Name: TABLE "event_staff"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_staff" TO "anon";
GRANT ALL ON TABLE "public"."event_staff" TO "authenticated";
GRANT ALL ON TABLE "public"."event_staff" TO "service_role";


--
-- Name: TABLE "event_surveys"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_surveys" TO "anon";
GRANT ALL ON TABLE "public"."event_surveys" TO "authenticated";
GRANT ALL ON TABLE "public"."event_surveys" TO "service_role";


--
-- Name: TABLE "event_tags"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_tags" TO "anon";
GRANT ALL ON TABLE "public"."event_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."event_tags" TO "service_role";


--
-- Name: TABLE "event_types"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_types" TO "anon";
GRANT ALL ON TABLE "public"."event_types" TO "authenticated";
GRANT ALL ON TABLE "public"."event_types" TO "service_role";


--
-- Name: TABLE "event_views"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_views" TO "anon";
GRANT ALL ON TABLE "public"."event_views" TO "authenticated";
GRANT ALL ON TABLE "public"."event_views" TO "service_role";


--
-- Name: TABLE "event_waitlists"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_waitlists" TO "anon";
GRANT ALL ON TABLE "public"."event_waitlists" TO "authenticated";
GRANT ALL ON TABLE "public"."event_waitlists" TO "service_role";


--
-- Name: TABLE "events"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";


--
-- Name: TABLE "feed_entries"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."feed_entries" TO "anon";
GRANT ALL ON TABLE "public"."feed_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."feed_entries" TO "service_role";


--
-- Name: TABLE "feed_entry_tags"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."feed_entry_tags" TO "anon";
GRANT ALL ON TABLE "public"."feed_entry_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."feed_entry_tags" TO "service_role";


--
-- Name: TABLE "follow_target_types"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."follow_target_types" TO "anon";
GRANT ALL ON TABLE "public"."follow_target_types" TO "authenticated";
GRANT ALL ON TABLE "public"."follow_target_types" TO "service_role";


--
-- Name: TABLE "follows"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."follows" TO "anon";
GRANT ALL ON TABLE "public"."follows" TO "authenticated";
GRANT ALL ON TABLE "public"."follows" TO "service_role";


--
-- Name: TABLE "format_types"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."format_types" TO "anon";
GRANT ALL ON TABLE "public"."format_types" TO "authenticated";
GRANT ALL ON TABLE "public"."format_types" TO "service_role";


--
-- Name: TABLE "friends"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."friends" TO "anon";
GRANT ALL ON TABLE "public"."friends" TO "authenticated";
GRANT ALL ON TABLE "public"."friends" TO "service_role";


--
-- Name: TABLE "group_achievements"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_achievements" TO "anon";
GRANT ALL ON TABLE "public"."group_achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."group_achievements" TO "service_role";


--
-- Name: TABLE "group_analytics"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_analytics" TO "anon";
GRANT ALL ON TABLE "public"."group_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."group_analytics" TO "service_role";


--
-- Name: TABLE "group_announcements"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_announcements" TO "anon";
GRANT ALL ON TABLE "public"."group_announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."group_announcements" TO "service_role";


--
-- Name: TABLE "group_audit_log"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."group_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."group_audit_log" TO "service_role";


--
-- Name: TABLE "group_author_events"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_author_events" TO "anon";
GRANT ALL ON TABLE "public"."group_author_events" TO "authenticated";
GRANT ALL ON TABLE "public"."group_author_events" TO "service_role";


--
-- Name: TABLE "group_book_list_items"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_book_list_items" TO "anon";
GRANT ALL ON TABLE "public"."group_book_list_items" TO "authenticated";
GRANT ALL ON TABLE "public"."group_book_list_items" TO "service_role";


--
-- Name: TABLE "group_book_lists"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_book_lists" TO "anon";
GRANT ALL ON TABLE "public"."group_book_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."group_book_lists" TO "service_role";


--
-- Name: TABLE "group_book_reviews"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_book_reviews" TO "anon";
GRANT ALL ON TABLE "public"."group_book_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."group_book_reviews" TO "service_role";


--
-- Name: TABLE "group_book_swaps"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_book_swaps" TO "anon";
GRANT ALL ON TABLE "public"."group_book_swaps" TO "authenticated";
GRANT ALL ON TABLE "public"."group_book_swaps" TO "service_role";


--
-- Name: TABLE "group_book_wishlist_items"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_book_wishlist_items" TO "anon";
GRANT ALL ON TABLE "public"."group_book_wishlist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."group_book_wishlist_items" TO "service_role";


--
-- Name: TABLE "group_book_wishlists"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_book_wishlists" TO "anon";
GRANT ALL ON TABLE "public"."group_book_wishlists" TO "authenticated";
GRANT ALL ON TABLE "public"."group_book_wishlists" TO "service_role";


--
-- Name: TABLE "group_bots"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_bots" TO "anon";
GRANT ALL ON TABLE "public"."group_bots" TO "authenticated";
GRANT ALL ON TABLE "public"."group_bots" TO "service_role";


--
-- Name: TABLE "group_chat_channels"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_chat_channels" TO "anon";
GRANT ALL ON TABLE "public"."group_chat_channels" TO "authenticated";
GRANT ALL ON TABLE "public"."group_chat_channels" TO "service_role";


--
-- Name: TABLE "group_chat_message_attachments"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_chat_message_attachments" TO "anon";
GRANT ALL ON TABLE "public"."group_chat_message_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."group_chat_message_attachments" TO "service_role";


--
-- Name: TABLE "group_chat_message_reactions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_chat_message_reactions" TO "anon";
GRANT ALL ON TABLE "public"."group_chat_message_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."group_chat_message_reactions" TO "service_role";


--
-- Name: TABLE "group_chat_messages"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."group_chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."group_chat_messages" TO "service_role";


--
-- Name: TABLE "group_content_moderation_logs"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_content_moderation_logs" TO "anon";
GRANT ALL ON TABLE "public"."group_content_moderation_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."group_content_moderation_logs" TO "service_role";


--
-- Name: TABLE "group_custom_fields"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_custom_fields" TO "anon";
GRANT ALL ON TABLE "public"."group_custom_fields" TO "authenticated";
GRANT ALL ON TABLE "public"."group_custom_fields" TO "service_role";


--
-- Name: TABLE "group_discussion_categories"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_discussion_categories" TO "anon";
GRANT ALL ON TABLE "public"."group_discussion_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."group_discussion_categories" TO "service_role";


--
-- Name: TABLE "group_event_feedback"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_event_feedback" TO "anon";
GRANT ALL ON TABLE "public"."group_event_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."group_event_feedback" TO "service_role";


--
-- Name: TABLE "group_events"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_events" TO "anon";
GRANT ALL ON TABLE "public"."group_events" TO "authenticated";
GRANT ALL ON TABLE "public"."group_events" TO "service_role";


--
-- Name: TABLE "group_integrations"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_integrations" TO "anon";
GRANT ALL ON TABLE "public"."group_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."group_integrations" TO "service_role";


--
-- Name: TABLE "group_invites"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_invites" TO "anon";
GRANT ALL ON TABLE "public"."group_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."group_invites" TO "service_role";


--
-- Name: TABLE "group_leaderboards"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_leaderboards" TO "anon";
GRANT ALL ON TABLE "public"."group_leaderboards" TO "authenticated";
GRANT ALL ON TABLE "public"."group_leaderboards" TO "service_role";


--
-- Name: TABLE "group_member_achievements"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_member_achievements" TO "anon";
GRANT ALL ON TABLE "public"."group_member_achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."group_member_achievements" TO "service_role";


--
-- Name: TABLE "group_member_devices"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_member_devices" TO "anon";
GRANT ALL ON TABLE "public"."group_member_devices" TO "authenticated";
GRANT ALL ON TABLE "public"."group_member_devices" TO "service_role";


--
-- Name: TABLE "group_member_streaks"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_member_streaks" TO "anon";
GRANT ALL ON TABLE "public"."group_member_streaks" TO "authenticated";
GRANT ALL ON TABLE "public"."group_member_streaks" TO "service_role";


--
-- Name: TABLE "group_members"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_members" TO "anon";
GRANT ALL ON TABLE "public"."group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."group_members" TO "service_role";


--
-- Name: TABLE "group_membership_questions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_membership_questions" TO "anon";
GRANT ALL ON TABLE "public"."group_membership_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."group_membership_questions" TO "service_role";


--
-- Name: TABLE "group_moderation_logs"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_moderation_logs" TO "anon";
GRANT ALL ON TABLE "public"."group_moderation_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."group_moderation_logs" TO "service_role";


--
-- Name: TABLE "group_onboarding_checklists"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_onboarding_checklists" TO "anon";
GRANT ALL ON TABLE "public"."group_onboarding_checklists" TO "authenticated";
GRANT ALL ON TABLE "public"."group_onboarding_checklists" TO "service_role";


--
-- Name: TABLE "group_onboarding_progress"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_onboarding_progress" TO "anon";
GRANT ALL ON TABLE "public"."group_onboarding_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."group_onboarding_progress" TO "service_role";


--
-- Name: TABLE "group_onboarding_tasks"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_onboarding_tasks" TO "anon";
GRANT ALL ON TABLE "public"."group_onboarding_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."group_onboarding_tasks" TO "service_role";


--
-- Name: TABLE "group_poll_votes"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_poll_votes" TO "anon";
GRANT ALL ON TABLE "public"."group_poll_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."group_poll_votes" TO "service_role";


--
-- Name: TABLE "group_polls"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_polls" TO "anon";
GRANT ALL ON TABLE "public"."group_polls" TO "authenticated";
GRANT ALL ON TABLE "public"."group_polls" TO "service_role";


--
-- Name: TABLE "group_reading_challenge_progress"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_reading_challenge_progress" TO "anon";
GRANT ALL ON TABLE "public"."group_reading_challenge_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."group_reading_challenge_progress" TO "service_role";


--
-- Name: TABLE "group_reading_challenges"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_reading_challenges" TO "anon";
GRANT ALL ON TABLE "public"."group_reading_challenges" TO "authenticated";
GRANT ALL ON TABLE "public"."group_reading_challenges" TO "service_role";


--
-- Name: TABLE "group_reading_progress"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_reading_progress" TO "anon";
GRANT ALL ON TABLE "public"."group_reading_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."group_reading_progress" TO "service_role";


--
-- Name: TABLE "group_reading_sessions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_reading_sessions" TO "anon";
GRANT ALL ON TABLE "public"."group_reading_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."group_reading_sessions" TO "service_role";


--
-- Name: TABLE "group_reports"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_reports" TO "anon";
GRANT ALL ON TABLE "public"."group_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."group_reports" TO "service_role";


--
-- Name: TABLE "group_roles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_roles" TO "anon";
GRANT ALL ON TABLE "public"."group_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."group_roles" TO "service_role";


--
-- Name: TABLE "group_rules"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_rules" TO "anon";
GRANT ALL ON TABLE "public"."group_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."group_rules" TO "service_role";


--
-- Name: TABLE "group_shared_documents"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_shared_documents" TO "anon";
GRANT ALL ON TABLE "public"."group_shared_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."group_shared_documents" TO "service_role";


--
-- Name: TABLE "group_tags"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_tags" TO "anon";
GRANT ALL ON TABLE "public"."group_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."group_tags" TO "service_role";


--
-- Name: TABLE "group_types"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_types" TO "anon";
GRANT ALL ON TABLE "public"."group_types" TO "authenticated";
GRANT ALL ON TABLE "public"."group_types" TO "service_role";


--
-- Name: TABLE "group_webhook_logs"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_webhook_logs" TO "anon";
GRANT ALL ON TABLE "public"."group_webhook_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."group_webhook_logs" TO "service_role";


--
-- Name: TABLE "group_webhooks"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_webhooks" TO "anon";
GRANT ALL ON TABLE "public"."group_webhooks" TO "authenticated";
GRANT ALL ON TABLE "public"."group_webhooks" TO "service_role";


--
-- Name: TABLE "group_welcome_messages"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."group_welcome_messages" TO "anon";
GRANT ALL ON TABLE "public"."group_welcome_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."group_welcome_messages" TO "service_role";


--
-- Name: TABLE "groups"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";


--
-- Name: TABLE "id_mappings"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."id_mappings" TO "anon";
GRANT ALL ON TABLE "public"."id_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."id_mappings" TO "service_role";


--
-- Name: TABLE "image_tag_mappings"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."image_tag_mappings" TO "anon";
GRANT ALL ON TABLE "public"."image_tag_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."image_tag_mappings" TO "service_role";


--
-- Name: TABLE "image_tags"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."image_tags" TO "anon";
GRANT ALL ON TABLE "public"."image_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."image_tags" TO "service_role";


--
-- Name: TABLE "invoices"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";


--
-- Name: TABLE "likes"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."likes" TO "anon";
GRANT ALL ON TABLE "public"."likes" TO "authenticated";
GRANT ALL ON TABLE "public"."likes" TO "service_role";


--
-- Name: TABLE "list_followers"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."list_followers" TO "anon";
GRANT ALL ON TABLE "public"."list_followers" TO "authenticated";
GRANT ALL ON TABLE "public"."list_followers" TO "service_role";


--
-- Name: TABLE "media_attachments"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."media_attachments" TO "anon";
GRANT ALL ON TABLE "public"."media_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."media_attachments" TO "service_role";


--
-- Name: TABLE "mentions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."mentions" TO "anon";
GRANT ALL ON TABLE "public"."mentions" TO "authenticated";
GRANT ALL ON TABLE "public"."mentions" TO "service_role";


--
-- Name: TABLE "ml_models"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."ml_models" TO "anon";
GRANT ALL ON TABLE "public"."ml_models" TO "authenticated";
GRANT ALL ON TABLE "public"."ml_models" TO "service_role";


--
-- Name: TABLE "ml_predictions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."ml_predictions" TO "anon";
GRANT ALL ON TABLE "public"."ml_predictions" TO "authenticated";
GRANT ALL ON TABLE "public"."ml_predictions" TO "service_role";


--
-- Name: TABLE "ml_training_jobs"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."ml_training_jobs" TO "anon";
GRANT ALL ON TABLE "public"."ml_training_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."ml_training_jobs" TO "service_role";


--
-- Name: TABLE "nlp_analysis"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."nlp_analysis" TO "anon";
GRANT ALL ON TABLE "public"."nlp_analysis" TO "authenticated";
GRANT ALL ON TABLE "public"."nlp_analysis" TO "service_role";


--
-- Name: TABLE "notifications"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";


--
-- Name: TABLE "payment_methods"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_methods" TO "service_role";


--
-- Name: TABLE "payment_transactions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."payment_transactions" TO "anon";
GRANT ALL ON TABLE "public"."payment_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_transactions" TO "service_role";


--
-- Name: TABLE "performance_dashboard"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."performance_dashboard" TO "anon";
GRANT ALL ON TABLE "public"."performance_dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."performance_dashboard" TO "service_role";


--
-- Name: TABLE "performance_metrics"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."performance_metrics" TO "anon";
GRANT ALL ON TABLE "public"."performance_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."performance_metrics" TO "service_role";


--
-- Name: TABLE "personalized_recommendations"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."personalized_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."personalized_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."personalized_recommendations" TO "service_role";


--
-- Name: TABLE "photo_album"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."photo_album" TO "anon";
GRANT ALL ON TABLE "public"."photo_album" TO "authenticated";
GRANT ALL ON TABLE "public"."photo_album" TO "service_role";


--
-- Name: TABLE "photo_albums"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."photo_albums" TO "anon";
GRANT ALL ON TABLE "public"."photo_albums" TO "authenticated";
GRANT ALL ON TABLE "public"."photo_albums" TO "service_role";


--
-- Name: TABLE "posts"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";


--
-- Name: TABLE "prices"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."prices" TO "anon";
GRANT ALL ON TABLE "public"."prices" TO "authenticated";
GRANT ALL ON TABLE "public"."prices" TO "service_role";


--
-- Name: TABLE "privacy_audit_log"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."privacy_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."privacy_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."privacy_audit_log" TO "service_role";


--
-- Name: TABLE "profiles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";


--
-- Name: TABLE "promo_codes"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."promo_codes" TO "anon";
GRANT ALL ON TABLE "public"."promo_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."promo_codes" TO "service_role";


--
-- Name: TABLE "publishers"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."publishers" TO "anon";
GRANT ALL ON TABLE "public"."publishers" TO "authenticated";
GRANT ALL ON TABLE "public"."publishers" TO "service_role";


--
-- Name: TABLE "publisher_summary"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."publisher_summary" TO "anon";
GRANT ALL ON TABLE "public"."publisher_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."publisher_summary" TO "service_role";


--
-- Name: TABLE "reactions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."reactions" TO "anon";
GRANT ALL ON TABLE "public"."reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."reactions" TO "service_role";


--
-- Name: TABLE "reading_challenges"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."reading_challenges" TO "anon";
GRANT ALL ON TABLE "public"."reading_challenges" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_challenges" TO "service_role";


--
-- Name: TABLE "reading_goals"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."reading_goals" TO "anon";
GRANT ALL ON TABLE "public"."reading_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_goals" TO "service_role";


--
-- Name: TABLE "reading_list_items"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."reading_list_items" TO "anon";
GRANT ALL ON TABLE "public"."reading_list_items" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_list_items" TO "service_role";


--
-- Name: TABLE "reading_series"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."reading_series" TO "anon";
GRANT ALL ON TABLE "public"."reading_series" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_series" TO "service_role";


--
-- Name: TABLE "reading_sessions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."reading_sessions" TO "anon";
GRANT ALL ON TABLE "public"."reading_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_sessions" TO "service_role";


--
-- Name: TABLE "reading_stats_daily"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."reading_stats_daily" TO "anon";
GRANT ALL ON TABLE "public"."reading_stats_daily" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_stats_daily" TO "service_role";


--
-- Name: TABLE "reading_streaks"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."reading_streaks" TO "anon";
GRANT ALL ON TABLE "public"."reading_streaks" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_streaks" TO "service_role";


--
-- Name: TABLE "review_likes"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."review_likes" TO "anon";
GRANT ALL ON TABLE "public"."review_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."review_likes" TO "service_role";


--
-- Name: TABLE "reviews"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";


--
-- Name: TABLE "roles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";


--
-- Name: TABLE "series_events"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."series_events" TO "anon";
GRANT ALL ON TABLE "public"."series_events" TO "authenticated";
GRANT ALL ON TABLE "public"."series_events" TO "service_role";


--
-- Name: TABLE "session_registrations"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."session_registrations" TO "anon";
GRANT ALL ON TABLE "public"."session_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."session_registrations" TO "service_role";


--
-- Name: TABLE "similar_books"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."similar_books" TO "anon";
GRANT ALL ON TABLE "public"."similar_books" TO "authenticated";
GRANT ALL ON TABLE "public"."similar_books" TO "service_role";


--
-- Name: TABLE "smart_notifications"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."smart_notifications" TO "anon";
GRANT ALL ON TABLE "public"."smart_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."smart_notifications" TO "service_role";


--
-- Name: TABLE "statuses"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."statuses" TO "anon";
GRANT ALL ON TABLE "public"."statuses" TO "authenticated";
GRANT ALL ON TABLE "public"."statuses" TO "service_role";


--
-- Name: TABLE "subjects"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."subjects" TO "anon";
GRANT ALL ON TABLE "public"."subjects" TO "authenticated";
GRANT ALL ON TABLE "public"."subjects" TO "service_role";


--
-- Name: TABLE "survey_questions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."survey_questions" TO "anon";
GRANT ALL ON TABLE "public"."survey_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."survey_questions" TO "service_role";


--
-- Name: TABLE "survey_responses"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."survey_responses" TO "anon";
GRANT ALL ON TABLE "public"."survey_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."survey_responses" TO "service_role";


--
-- Name: TABLE "sync_state"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."sync_state" TO "anon";
GRANT ALL ON TABLE "public"."sync_state" TO "authenticated";
GRANT ALL ON TABLE "public"."sync_state" TO "service_role";


--
-- Name: TABLE "system_performance_overview"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."system_performance_overview" TO "anon";
GRANT ALL ON TABLE "public"."system_performance_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."system_performance_overview" TO "service_role";


--
-- Name: TABLE "tags"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";


--
-- Name: TABLE "ticket_benefits"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."ticket_benefits" TO "anon";
GRANT ALL ON TABLE "public"."ticket_benefits" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_benefits" TO "service_role";


--
-- Name: TABLE "ticket_types"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."ticket_types" TO "anon";
GRANT ALL ON TABLE "public"."ticket_types" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_types" TO "service_role";


--
-- Name: TABLE "tickets"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."tickets" TO "anon";
GRANT ALL ON TABLE "public"."tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."tickets" TO "service_role";


--
-- Name: TABLE "unified_book_data"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."unified_book_data" TO "anon";
GRANT ALL ON TABLE "public"."unified_book_data" TO "authenticated";
GRANT ALL ON TABLE "public"."unified_book_data" TO "service_role";


--
-- Name: TABLE "unified_reading_progress"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."unified_reading_progress" TO "anon";
GRANT ALL ON TABLE "public"."unified_reading_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."unified_reading_progress" TO "service_role";


--
-- Name: TABLE "user_activity_metrics"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_activity_metrics" TO "anon";
GRANT ALL ON TABLE "public"."user_activity_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity_metrics" TO "service_role";


--
-- Name: TABLE "user_activity_summary"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_activity_summary" TO "anon";
GRANT ALL ON TABLE "public"."user_activity_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity_summary" TO "service_role";


--
-- Name: TABLE "user_book_interactions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_book_interactions" TO "anon";
GRANT ALL ON TABLE "public"."user_book_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_book_interactions" TO "service_role";


--
-- Name: TABLE "user_engagement_analytics"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_engagement_analytics" TO "anon";
GRANT ALL ON TABLE "public"."user_engagement_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."user_engagement_analytics" TO "service_role";


--
-- Name: TABLE "user_friends"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_friends" TO "anon";
GRANT ALL ON TABLE "public"."user_friends" TO "authenticated";
GRANT ALL ON TABLE "public"."user_friends" TO "service_role";


--
-- Name: TABLE "user_privacy_settings"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_privacy_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_privacy_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_privacy_settings" TO "service_role";


--
-- Name: TABLE "user_privacy_overview"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_privacy_overview" TO "anon";
GRANT ALL ON TABLE "public"."user_privacy_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."user_privacy_overview" TO "service_role";


--
-- Name: TABLE "user_reading_preferences"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_reading_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_reading_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_reading_preferences" TO "service_role";


--
-- Name: TABLE "users"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";


--
-- Name: TABLE "messages"; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE "realtime"."messages" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages" TO "dashboard_user";
GRANT SELECT,INSERT,UPDATE ON TABLE "realtime"."messages" TO "anon";
GRANT SELECT,INSERT,UPDATE ON TABLE "realtime"."messages" TO "authenticated";
GRANT SELECT,INSERT,UPDATE ON TABLE "realtime"."messages" TO "service_role";


--
-- Name: TABLE "messages_2025_05_28"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE "realtime"."messages_2025_05_28" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2025_05_28" TO "dashboard_user";


--
-- Name: TABLE "messages_2025_05_29"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE "realtime"."messages_2025_05_29" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2025_05_29" TO "dashboard_user";


--
-- Name: TABLE "messages_2025_05_30"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE "realtime"."messages_2025_05_30" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2025_05_30" TO "dashboard_user";


--
-- Name: TABLE "messages_2025_05_31"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE "realtime"."messages_2025_05_31" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2025_05_31" TO "dashboard_user";


--
-- Name: TABLE "messages_2025_06_01"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE "realtime"."messages_2025_06_01" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2025_06_01" TO "dashboard_user";


--
-- Name: TABLE "messages_2025_06_02"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE "realtime"."messages_2025_06_02" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2025_06_02" TO "dashboard_user";


--
-- Name: TABLE "messages_2025_06_03"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE "realtime"."messages_2025_06_03" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2025_06_03" TO "dashboard_user";


--
-- Name: TABLE "schema_migrations"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE "realtime"."schema_migrations" TO "postgres";
GRANT ALL ON TABLE "realtime"."schema_migrations" TO "dashboard_user";
GRANT SELECT ON TABLE "realtime"."schema_migrations" TO "anon";
GRANT SELECT ON TABLE "realtime"."schema_migrations" TO "authenticated";
GRANT SELECT ON TABLE "realtime"."schema_migrations" TO "service_role";
GRANT ALL ON TABLE "realtime"."schema_migrations" TO "supabase_realtime_admin";


--
-- Name: TABLE "subscription"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE "realtime"."subscription" TO "postgres";
GRANT ALL ON TABLE "realtime"."subscription" TO "dashboard_user";
GRANT SELECT ON TABLE "realtime"."subscription" TO "anon";
GRANT SELECT ON TABLE "realtime"."subscription" TO "authenticated";
GRANT SELECT ON TABLE "realtime"."subscription" TO "service_role";
GRANT ALL ON TABLE "realtime"."subscription" TO "supabase_realtime_admin";


--
-- Name: SEQUENCE "subscription_id_seq"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE "realtime"."subscription_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "realtime"."subscription_id_seq" TO "dashboard_user";
GRANT USAGE ON SEQUENCE "realtime"."subscription_id_seq" TO "anon";
GRANT USAGE ON SEQUENCE "realtime"."subscription_id_seq" TO "authenticated";
GRANT USAGE ON SEQUENCE "realtime"."subscription_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "realtime"."subscription_id_seq" TO "supabase_realtime_admin";


--
-- Name: TABLE "buckets"; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE "storage"."buckets" TO "anon";
GRANT ALL ON TABLE "storage"."buckets" TO "authenticated";
GRANT ALL ON TABLE "storage"."buckets" TO "service_role";
GRANT ALL ON TABLE "storage"."buckets" TO "postgres";


--
-- Name: TABLE "migrations"; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE "storage"."migrations" TO "anon";
GRANT ALL ON TABLE "storage"."migrations" TO "authenticated";
GRANT ALL ON TABLE "storage"."migrations" TO "service_role";
GRANT ALL ON TABLE "storage"."migrations" TO "postgres";


--
-- Name: TABLE "objects"; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE "storage"."objects" TO "anon";
GRANT ALL ON TABLE "storage"."objects" TO "authenticated";
GRANT ALL ON TABLE "storage"."objects" TO "service_role";
GRANT ALL ON TABLE "storage"."objects" TO "postgres";


--
-- Name: TABLE "s3_multipart_uploads"; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE "storage"."s3_multipart_uploads" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "anon";


--
-- Name: TABLE "s3_multipart_uploads_parts"; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE "storage"."s3_multipart_uploads_parts" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "anon";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON SEQUENCES  TO "dashboard_user";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON FUNCTIONS  TO "dashboard_user";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON TABLES  TO "dashboard_user";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "extensions" GRANT ALL ON SEQUENCES  TO "postgres" WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "extensions" GRANT ALL ON FUNCTIONS  TO "postgres" WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "extensions" GRANT ALL ON TABLES  TO "postgres" WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON SEQUENCES  TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON SEQUENCES  TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON SEQUENCES  TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON FUNCTIONS  TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON FUNCTIONS  TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON FUNCTIONS  TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON TABLES  TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON TABLES  TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON TABLES  TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON TABLES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "realtime" GRANT ALL ON SEQUENCES  TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "realtime" GRANT ALL ON SEQUENCES  TO "dashboard_user";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "realtime" GRANT ALL ON FUNCTIONS  TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "realtime" GRANT ALL ON FUNCTIONS  TO "dashboard_user";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "realtime" GRANT ALL ON TABLES  TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "realtime" GRANT ALL ON TABLES  TO "dashboard_user";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES  TO "service_role";


--
-- PostgreSQL database dump complete
--

RESET ALL;
