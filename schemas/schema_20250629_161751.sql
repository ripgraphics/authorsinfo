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
-- Name: compute_similar_books(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."compute_similar_books"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Clear existing similarities
  DELETE FROM public.similar_books;

  -- Insert new similarities based on genre overlap
  INSERT INTO public.similar_books (book_id, similar_book_id, similarity_score, created_at)
  SELECT 
    a.book_id, 
    b.book_id, 
    COUNT(*)::float / (
      SELECT COUNT(*) FROM public.book_genre_mappings_new WHERE book_id = a.book_id
    ) AS similarity_score,
    NOW()
  FROM 
    public.book_genre_mappings_new a
  JOIN 
    public.book_genre_mappings_new b ON a.genre_id = b.genre_id AND a.book_id <> b.book_id
  GROUP BY 
    a.book_id, b.book_id
  HAVING 
    COUNT(*) > 0
  ORDER BY 
    similarity_score DESC;
    
  -- Add similarities based on common tags
  INSERT INTO public.similar_books (book_id, similar_book_id, similarity_score, created_at)
  SELECT 
    a.book_id, 
    b.book_id, 
    COUNT(*)::float / (
      SELECT COUNT(*) FROM public.book_tag_mappings_new WHERE book_id = a.book_id
    ) * 0.8 AS similarity_score,
    NOW()
  FROM 
    public.book_tag_mappings_new a
  JOIN 
    public.book_tag_mappings_new b ON a.tag_id = b.tag_id AND a.book_id <> b.book_id
  WHERE 
    NOT EXISTS (
      SELECT 1 FROM public.similar_books 
      WHERE book_id = a.book_id AND similar_book_id = b.book_id
    )
  GROUP BY 
    a.book_id, b.book_id
  HAVING 
    COUNT(*) > 0
  ORDER BY 
    similarity_score DESC;
    
  -- Add similarities based on users who read both books
  INSERT INTO public.similar_books (book_id, similar_book_id, similarity_score, created_at)
  SELECT 
    a.book_id, 
    b.book_id, 
    COUNT(*)::float / (
      SELECT COUNT(*) FROM public.reading_progress_new WHERE book_id = a.book_id AND status = 'read'
    ) * 0.7 AS similarity_score,
    NOW()
  FROM 
    public.reading_progress_new a
  JOIN 
    public.reading_progress_new b ON a.user_id = b.user_id AND a.book_id <> b.book_id
  WHERE
    a.status = 'read' AND b.status = 'read'
    AND NOT EXISTS (
      SELECT 1 FROM public.similar_books 
      WHERE book_id = a.book_id AND similar_book_id = b.book_id
    )
  GROUP BY 
    a.book_id, b.book_id
  HAVING 
    COUNT(*) > 1
  ORDER BY 
    similarity_score DESC;
END;
$$;


ALTER FUNCTION "public"."compute_similar_books"() OWNER TO "postgres";

--
-- Name: count_authors_per_book(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."count_authors_per_book"() RETURNS TABLE("book_id" "uuid", "author_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT ba.book_id, COUNT(ba.author_id) as author_count
  FROM book_authors_new ba
  GROUP BY ba.book_id
  ORDER BY author_count DESC;
END;
$$;


ALTER FUNCTION "public"."count_authors_per_book"() OWNER TO "postgres";

--
-- Name: count_books_with_multiple_authors(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."count_books_with_multiple_authors"() RETURNS TABLE("book_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(DISTINCT book_id)
  FROM book_authors
  GROUP BY book_id
  HAVING COUNT(author_id) > 1;
END;
$$;


ALTER FUNCTION "public"."count_books_with_multiple_authors"() OWNER TO "postgres";

--
-- Name: count_publishers_per_book(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."count_publishers_per_book"() RETURNS TABLE("book_id" integer, "publisher_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT bp.book_id, COUNT(bp.publisher_id) as publisher_count
  FROM book_publishers bp
  GROUP BY bp.book_id
  ORDER BY publisher_count DESC;
END;
$$;


ALTER FUNCTION "public"."count_publishers_per_book"() OWNER TO "postgres";

--
-- Name: create_author_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_author_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get an admin user ID (first user with admin role)
  SELECT user_id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
  
  -- If no admin found, use the first user
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM users ORDER BY created_at LIMIT 1;
  END IF;
  
  -- Insert author_created activity
  INSERT INTO activities (
    user_id,
    activity_type,
    author_id,
    data,
    created_at
  ) VALUES (
    admin_user_id,
    'author_created',
    NEW.id,
    jsonb_build_object(
      'author_id', NEW.id,
      'author_name', NEW.name
    ),
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_author_activity"() OWNER TO "postgres";

--
-- Name: create_book_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_book_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  admin_user_id UUID;
  author_name TEXT := 'Unknown Author';
BEGIN
  -- Get an admin user ID
  SELECT user_id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
  
  -- If no admin found, use the first user
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM users ORDER BY created_at LIMIT 1;
  END IF;
  
  -- Get author name if available
  IF NEW.author_id IS NOT NULL THEN
    SELECT name INTO author_name FROM authors WHERE id = NEW.author_id;
  END IF;
  
  -- Insert book_added activity
  INSERT INTO activities (
    user_id,
    activity_type,
    book_id,
    author_id,
    data,
    created_at
  ) VALUES (
    admin_user_id,
    'book_added',
    NEW.id,
    NEW.author_id,
    jsonb_build_object(
      'book_title', NEW.title,
      'book_author', author_name,
      'author_id', NEW.author_id,
      'author_name', author_name
    ),
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_book_activity"() OWNER TO "postgres";

--
-- Name: create_book_club_event("uuid", "uuid", "text", "text", timestamp with time zone, integer, boolean, "uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_book_club_event"("book_club_id" "uuid", "discussion_id" "uuid", "title" "text", "description" "text", "start_time" timestamp with time zone, "duration_minutes" integer, "is_virtual" boolean, "created_by" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  book_id INTEGER;
  new_event_id UUID;
BEGIN
  -- Get book ID from discussion
  SELECT d.book_id INTO book_id
  FROM book_club_discussions d
  WHERE d.id = discussion_id;
  
  -- Create the event
  INSERT INTO events (
    title,
    description,
    format,
    status,
    visibility,
    start_date,
    end_date,
    book_id,
    requires_registration,
    is_free,
    created_by,
    group_id
  ) VALUES (
    title,
    description,
    CASE WHEN is_virtual THEN 'virtual' ELSE 'physical' END,
    'published',
    'group_only',
    start_time,
    start_time + (duration_minutes * INTERVAL '1 minute'),
    book_id,
    true,
    true,
    created_by,
    book_club_id
  )
  RETURNING id INTO new_event_id;
  
  -- If virtual, create a chat room
  IF is_virtual THEN
    INSERT INTO event_chat_rooms (
      event_id,
      name,
      description,
      is_active,
      is_moderated,
      requires_ticket
    ) VALUES (
      new_event_id,
      title || ' Chat',
      'Chat room for ' || title,
      true,
      true,
      false
    );
  END IF;
  
  -- Notify all club members
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link,
    data,
    is_read
  )
  SELECT 
    bcm.user_id,
    'book_club_event',
    'New Book Club Event: ' || title,
    'A new event has been scheduled for your book club',
    '/events/' || new_event_id,
    jsonb_build_object(
      'event_id', new_event_id,
      'book_club_id', book_club_id,
      'discussion_id', discussion_id
    ),
    false
  FROM book_club_members bcm
  WHERE bcm.book_club_id = book_club_id;
  
  RETURN new_event_id;
END;
$$;


ALTER FUNCTION "public"."create_book_club_event"("book_club_id" "uuid", "discussion_id" "uuid", "title" "text", "description" "text", "start_time" timestamp with time zone, "duration_minutes" integer, "is_virtual" boolean, "created_by" "uuid") OWNER TO "postgres";

--
-- Name: create_book_update_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_book_update_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get an admin user ID (first user with admin role or first user)
    SELECT user_id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
    
    -- If no admin found, use the first user
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM users ORDER BY created_at LIMIT 1;
    END IF;
    
    -- Only create activity if we have a valid user
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.activities (
            user_id,
            activity_type,
            book_id,
            data,
            created_at
        ) VALUES (
            admin_user_id,
            'book_updated',
            NEW.id,
            jsonb_build_object(
                'book_title', NEW.title,
                'book_id', NEW.id
            ),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_book_update_activity"() OWNER TO "postgres";

--
-- Name: create_challenge_complete_notification(); Type: FUNCTION; Schema: public; Owner: postgres
--

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
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_challenge_complete_notification"() OWNER TO "postgres";

--
-- Name: create_default_reading_lists(); Type: FUNCTION; Schema: public; Owner: postgres
--

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
  
  -- Create "To Read" list
  INSERT INTO public.reading_lists (user_id, name, description, is_public, created_at, updated_at)
  VALUES (
    NEW.id,
    'To Read',
    'Books I want to read next',
    false,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_reading_lists"() OWNER TO "postgres";

--
-- Name: create_discussion_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

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
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_discussion_activity"() OWNER TO "postgres";

--
-- Name: create_discussion_comment_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_discussion_comment_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    book_id_val INTEGER;
    discussion_title_val TEXT;
BEGIN
    -- Get the book_id and discussion title from the parent discussion
    SELECT bd.book_id, bd.title INTO book_id_val, discussion_title_val
    FROM public.book_discussions bd
    WHERE bd.id = NEW.discussion_id;
    
    INSERT INTO public.activities (user_id, activity_type, book_id, data)
    VALUES (
        NEW.user_id,
        'discussion_comment_created',
        book_id_val,
        jsonb_build_object(
            'discussion_id', NEW.discussion_id,
            'discussion_title', discussion_title_val,
            'comment_id', NEW.id
        )
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_discussion_comment_activity"() OWNER TO "postgres";

--
-- Name: create_event_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

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
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_event_activity"() OWNER TO "postgres";

--
-- Name: create_event_approval_record(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_event_approval_record"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  permission_record RECORD;
BEGIN
  -- Get permission level for this user
  SELECT * INTO permission_record
  FROM event_creator_permissions
  WHERE user_id = NEW.created_by;
  
  -- If user requires approval and is not an admin, create approval record
  IF permission_record IS NOT NULL AND permission_record.requires_approval AND
     NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.created_by AND role_id = (SELECT id FROM roles WHERE name = 'admin')) THEN
    
    INSERT INTO event_approvals (
      event_id, 
      submitted_by,
      approval_status,
      submitted_at
    ) VALUES (
      NEW.id,
      NEW.created_by,
      'pending',
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_event_approval_record"() OWNER TO "postgres";

--
-- Name: create_event_notification(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_event_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  follower_id UUID;
  author_followers UUID[];
BEGIN
  -- If event is for an author, notify author's followers
  IF NEW.author_id IS NOT NULL THEN
    -- Get all users following this author
    SELECT ARRAY_AGG(follower_id) INTO author_followers
    FROM follows 
    WHERE following_id = NEW.author_id::TEXT
    AND target_type_id = (SELECT id FROM follow_target_types WHERE name = 'author');
    
    -- Create notifications for each follower
    IF author_followers IS NOT NULL THEN
      FOREACH follower_id IN ARRAY author_followers
      LOOP
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          link,
          data,
          is_read,
          created_at
        ) VALUES (
          follower_id,
          'event_created',
          'New Event',
          'An author you follow has a new event: ' || NEW.title,
          '/events/' || NEW.id,
          jsonb_build_object(
            'event_id', NEW.id,
            'author_id', NEW.author_id,
            'event_title', NEW.title,
            'event_start_date', NEW.start_date
          ),
          false,
          NOW()
        );
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_event_notification"() OWNER TO "postgres";

--
-- Name: create_event_registration_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_event_registration_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  event_title TEXT;
  event_start_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get event details
  SELECT title, start_date INTO event_title, event_start_date 
  FROM events WHERE id = NEW.event_id;
  
  -- Insert registration activity
  INSERT INTO activities (
    user_id,
    activity_type,
    event_id,
    data,
    created_at
  ) VALUES (
    NEW.user_id,
    'event_registration',
    NEW.event_id,
    jsonb_build_object(
      'event_id', NEW.event_id,
      'event_title', event_title,
      'event_start_date', event_start_date,
      'registration_status', NEW.registration_status
    ),
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_event_registration_activity"() OWNER TO "postgres";

--
-- Name: create_follow_notification(); Type: FUNCTION; Schema: public; Owner: postgres
--

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

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_follow_notification"() OWNER TO "postgres";

--
-- Name: create_get_user_reading_stats_function(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_get_user_reading_stats_function"() RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- The function is already created above, so this is just a placeholder
  -- that can be called from the API to ensure the function exists
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."create_get_user_reading_stats_function"() OWNER TO "postgres";

--
-- Name: create_group_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_group_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get an admin user ID
  SELECT user_id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
  
  -- If no admin found, use the first user
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM users ORDER BY created_at LIMIT 1;
  END IF;
  
  -- Insert group_created activity
  INSERT INTO activities (
    user_id,
    activity_type,
    group_id, -- Use the new column
    data,
    created_at
  ) VALUES (
    NEW.created_by,
    'group_created',
    NEW.id, -- Store in dedicated column
    jsonb_build_object(
      'group_id', NEW.id,
      'group_name', NEW.name
    ),
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_group_activity"() OWNER TO "postgres";

--
-- Name: create_group_with_roles("text", "text", integer, integer, "uuid", integer, "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_group_with_roles"("p_name" "text", "p_description" "text", "p_cover_image_id" integer, "p_group_image_id" integer, "p_created_by" "uuid", "p_target_type_id" integer, "p_target_id" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_group_id UUID;
  v_owner_role_id INTEGER;
BEGIN
  -- Start transaction
  BEGIN
    -- 1. Create the group
    INSERT INTO groups (
      name,
      description,
      cover_image_id,
      group_image_id,
      created_by
    ) VALUES (
      p_name,
      p_description,
      p_cover_image_id,
      p_group_image_id,
      p_created_by
    ) RETURNING id INTO v_group_id;

    -- 2. Create owner role
    INSERT INTO group_roles (
      group_id,
      name,
      description,
      permissions,
      is_default
    ) VALUES (
      v_group_id,
      'Owner',
      'Group owner with full permissions',
      '["manage_group", "manage_members", "manage_content"]',
      false
    ) RETURNING id INTO v_owner_role_id;

    -- 3. Create member role
    INSERT INTO group_roles (
      group_id,
      name,
      description,
      permissions,
      is_default
    ) VALUES (
      v_group_id,
      'Member',
      'Regular group member',
      '["view_content", "create_content"]',
      true
    );

    -- 4. Add creator as member with owner role
    INSERT INTO group_members (
      group_id,
      user_id,
      role_id,
      joined_at,
      status
    ) VALUES (
      v_group_id,
      p_created_by,
      v_owner_role_id,
      NOW(),
      'active'
    );

    -- 5. Add target type if provided
    IF p_target_type_id IS NOT NULL AND p_target_id IS NOT NULL THEN
      INSERT INTO group_target_type (
        group_id,
        target_type_id,
        target_id
      ) VALUES (
        v_group_id,
        p_target_type_id,
        p_target_id
      );
    END IF;

    -- Return the group ID
    RETURN json_build_object('id', v_group_id);
  END;
END;
$$;


ALTER FUNCTION "public"."create_group_with_roles"("p_name" "text", "p_description" "text", "p_cover_image_id" integer, "p_group_image_id" integer, "p_created_by" "uuid", "p_target_type_id" integer, "p_target_id" "text") OWNER TO "postgres";

--
-- Name: create_list_follow_notification(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_list_follow_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_list_owner_id UUID;
  v_list_name TEXT;
  v_follower_name TEXT;
BEGIN
  -- Get the list owner and list name
  SELECT l.user_id, l.name, u.name
  INTO v_list_owner_id, v_list_name, v_follower_name
  FROM public.reading_lists l
  JOIN public.users u ON u.id = NEW.user_id
  WHERE l.id = NEW.list_id;
  
  -- Don't notify if the user is following their own list
  IF v_list_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Create a notification for the list owner
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    link,
    data,
    created_at
  ) VALUES (
    v_list_owner_id,
    'list_followed',
    'Reading List Followed',
    CONCAT(v_follower_name, ' followed your reading list "', v_list_name, '"'),
    CONCAT('/reading-lists/', NEW.list_id),
    json_build_object(
      'list_id', NEW.list_id,
      'list_name', v_list_name,
      'follower_id', NEW.user_id,
      'follower_name', v_follower_name
    ),
    NOW()
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_list_follow_notification"() OWNER TO "postgres";

--
-- Name: create_list_item_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_list_item_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_list_id UUID;
  v_list_name TEXT;
  v_is_public BOOLEAN;
  v_user_id UUID;
BEGIN
  -- Get list details
  SELECT l.id, l.name, l.is_public, l.user_id
  INTO v_list_id, v_list_name, v_is_public, v_user_id
  FROM public.reading_lists l
  WHERE l.id = NEW.list_id;
  
  -- Only create activity for public lists
  IF v_is_public THEN
    INSERT INTO public.activities (
      user_id,
      activity_type,
      book_id,
      list_id,
      data,
      created_at
    ) VALUES (
      v_user_id,
      'book_added_to_list',
      NEW.book_id,
      NEW.list_id,
      json_build_object(
        'list_name', v_list_name,
        'notes', NEW.notes
      ),
      NEW.added_at
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_list_item_activity"() OWNER TO "postgres";

--
-- Name: create_new_user("uuid", "text", timestamp without time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_new_user"("user_id" "uuid", "user_email" "text", "created_timestamp" timestamp without time zone) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO users (id, email, created_at)
  VALUES (user_id, user_email, created_timestamp);
END;
$$;


ALTER FUNCTION "public"."create_new_user"("user_id" "uuid", "user_email" "text", "created_timestamp" timestamp without time zone) OWNER TO "postgres";

--
-- Name: create_or_update_user("uuid", "text", timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_or_update_user"("p_user_id" "uuid", "p_email" "text", "p_created_at" timestamp with time zone DEFAULT "now"()) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (p_user_id, p_email, p_created_at)
  ON CONFLICT (id) DO UPDATE
  SET email = p_email
  WHERE users.id = p_user_id;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in create_or_update_user: %', SQLERRM;
  RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."create_or_update_user"("p_user_id" "uuid", "p_email" "text", "p_created_at" timestamp with time zone) OWNER TO "postgres";

--
-- Name: create_publisher_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_publisher_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get an admin user ID
  SELECT user_id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
  
  -- If no admin found, use the first user
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM users ORDER BY created_at LIMIT 1;
  END IF;
  
  -- Insert publisher_created activity
  INSERT INTO activities (
    user_id,
    activity_type,
    publisher_id,
    data,
    created_at
  ) VALUES (
    admin_user_id,
    'publisher_created',
    NEW.id,
    jsonb_build_object(
      'publisher_id', NEW.id,
      'publisher_name', NEW.name
    ),
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_publisher_activity"() OWNER TO "postgres";

--
-- Name: create_reading_list_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

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
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_reading_list_activity"() OWNER TO "postgres";

--
-- Name: create_reading_progress_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

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
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_reading_progress_activity"() OWNER TO "postgres";

--
-- Name: create_review_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

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
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_review_activity"() OWNER TO "postgres";

--
-- Name: create_review_like_notification(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_review_like_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_review_user_id UUID;
  v_book_title TEXT;
  v_liker_name TEXT;
BEGIN
  -- Get the review owner and book title
  SELECT r.user_id, b.title, u.name
  INTO v_review_user_id, v_book_title, v_liker_name
  FROM public.book_reviews r
  JOIN public.books b ON b.id = r.book_id
  JOIN public.users u ON u.id = NEW.user_id
  WHERE r.id = NEW.review_id;
  
  -- Don't notify if the user is liking their own review
  IF v_review_user_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Create a notification for the review owner
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    link,
    data,
    created_at
  ) VALUES (
    v_review_user_id,
    'review_liked',
    'Review Liked',
    CONCAT(v_liker_name, ' liked your review of "', v_book_title, '"'),
    CONCAT('/books/', (SELECT book_id FROM public.book_reviews WHERE id = NEW.review_id)),
    json_build_object(
      'review_id', NEW.review_id,
      'liker_id', NEW.user_id,
      'liker_name', v_liker_name,
      'book_id', (SELECT book_id FROM public.book_reviews WHERE id = NEW.review_id),
      'book_title', v_book_title
    ),
    NOW()
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_review_like_notification"() OWNER TO "postgres";

--
-- Name: create_user_profile_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_user_profile_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    user_name TEXT := 'Unknown User';
    changed_fields TEXT[] := '{}';
BEGIN
    -- Only create activity if significant fields changed
    IF OLD.bio != NEW.bio THEN
        -- Get user name
        SELECT name INTO user_name FROM users WHERE id = NEW.user_id;
        
        -- Build changed fields array
        IF OLD.bio != NEW.bio THEN
            changed_fields := array_append(changed_fields, 'bio');
        END IF;
        
        -- Insert profile_updated activity
        INSERT INTO activities (
            user_id,
            activity_type,
            user_profile_id,
            data,
            created_at
        ) VALUES (
            NEW.user_id,
            'profile_updated',
            NEW.user_id,
            jsonb_build_object(
                'user_id', NEW.user_id,
                'user_name', user_name,
                'updated_fields', changed_fields
            ),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_user_profile_activity"() OWNER TO "postgres";

--
-- Name: create_want_to_read_review_notification(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_want_to_read_review_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  user_rec RECORD;
BEGIN
  -- Find users who have this book in their want-to-read list
  FOR user_rec IN (
    SELECT rp.user_id
    FROM public.reading_progress rp
    WHERE rp.book_id = NEW.book_id
    AND rp.status = 'want_to_read'
    AND rp.user_id != NEW.user_id  -- Don't notify the reviewer
  ) LOOP
    -- Create a notification for each user
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      link,
      data,
      created_at
    ) VALUES (
      user_rec.user_id,
      'want_to_read_reviewed',
      'New Review for Book on Your List',
      CONCAT('A book on your want-to-read list, "', (SELECT title FROM public.books WHERE id = NEW.book_id), '", has a new review'),
      CONCAT('/books/', NEW.book_id),
      json_build_object(
        'book_id', NEW.book_id,
        'book_title', (SELECT title FROM public.books WHERE id = NEW.book_id),
        'reviewer_id', NEW.user_id,
        'reviewer_name', (SELECT name FROM public.users WHERE id = NEW.user_id),
        'rating', NEW.rating
      ),
      NOW()
    );
  END LOOP;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_want_to_read_review_notification"() OWNER TO "postgres";

--
-- Name: export_schema_definitions(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."export_schema_definitions"() RETURNS TABLE("definition" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT table_name, 'CREATE TABLE ' || table_name || ' (' || string_agg(column_name || ' ' || data_type, ', ') || ');'
        FROM information_schema.columns
        WHERE table_schema = 'public'
        GROUP BY table_name
    LOOP
        RETURN QUERY SELECT rec.table_name || ': ' || rec.definition;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."export_schema_definitions"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

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
-- Name: generate_personalized_recommendations("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."generate_personalized_recommendations"("user_uuid" "uuid") RETURNS SETOF "public"."personalized_recommendations"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  max_recommendations INTEGER := 50;
  min_similarity_score FLOAT := 0.3;
  user_genres TEXT[];
  user_authors TEXT[];
  disliked_genres TEXT[];
  read_books UUID[];
  rec_book_id UUID;
  rec_score FLOAT;
  rec_type TEXT;
  rec_explanation TEXT;
BEGIN
  -- Get user preferences
  SELECT 
    favorite_genres, 
    favorite_authors, 
    disliked_genres 
  INTO 
    user_genres, 
    user_authors, 
    disliked_genres
  FROM user_reading_preferences
  WHERE user_id = user_uuid;
  
  -- If no preferences exist, create default ones
  IF user_genres IS NULL THEN
    INSERT INTO user_reading_preferences (user_id)
    VALUES (user_uuid)
    RETURNING favorite_genres, favorite_authors, disliked_genres
    INTO user_genres, user_authors, disliked_genres;
  END IF;
  
  -- Get books the user has already read
  SELECT array_agg(book_id) INTO read_books
  FROM reading_progress_new
  WHERE user_id = user_uuid AND status = 'read';
  
  IF read_books IS NULL THEN
    read_books := '{}';
  END IF;
  
  -- Clear existing recommendations
  DELETE FROM personalized_recommendations
  WHERE user_id = user_uuid AND is_dismissed = FALSE;
  
  -- 1. Collaborative filtering recommendations
  -- Find books similar to those the user has rated highly
  INSERT INTO personalized_recommendations (
    user_id, book_id, recommendation_type, score, explanation
  )
  SELECT 
    user_uuid,
    bs.similar_book_id,
    'collaborative',
    AVG(bs.similarity_score * ubi.interaction_value / 5) AS score,
    'Based on books you rated highly'
  FROM user_book_interactions_new ubi
  JOIN book_similarity_scores_new bs ON ubi.book_id = bs.book_id
  WHERE 
    ubi.user_id = user_uuid 
    AND ubi.interaction_type = 'rated'
    AND ubi.interaction_value >= 4
    AND bs.similarity_score >= min_similarity_score
    AND NOT (bs.similar_book_id = ANY(read_books))
  GROUP BY bs.similar_book_id
  ORDER BY score DESC
  LIMIT max_recommendations / 3;
  
  -- 2. Content-based recommendations
  -- Recommend books based on favorite genres and authors
  -- (This section can be expanded as needed)
  RETURN QUERY SELECT * FROM personalized_recommendations WHERE user_id = user_uuid;
END;
$$;


ALTER FUNCTION "public"."generate_personalized_recommendations"("user_uuid" "uuid") OWNER TO "postgres";

--
-- Name: generate_recommendations("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."generate_recommendations"("user_id_param" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  genre_rec RECORD;
  book_rec RECORD;
  read_books UUID[];
BEGIN
  -- Clear existing recommendations for this user
  DELETE FROM public.book_recommendations WHERE user_id = user_id_param;

  -- Get books the user has already read
  SELECT array_agg(book_id) INTO read_books
  FROM reading_progress_new
  WHERE user_id = user_id_param AND status = 'read';
  IF read_books IS NULL THEN
    read_books := '{}';
  END IF;

  -- 1. Generate recommendations based on genres the user has read
  FOR genre_rec IN (
    SELECT DISTINCT g.id AS genre_id, g.name AS genre_name
    FROM public.book_genre_mappings_new gm
    JOIN public.book_genres g ON g.id = gm.genre_id
    JOIN public.reading_progress_new rp ON rp.book_id = gm.book_id
    WHERE rp.user_id = user_id_param AND rp.status = 'read'
  ) LOOP
    -- Find books in this genre that the user hasn't read yet
    FOR book_rec IN (
      SELECT b.id AS book_id, 
             COUNT(r.id) AS review_count, 
             COALESCE(AVG(r.rating), 0) AS avg_rating
      FROM public.books_new b
      JOIN public.book_genre_mappings_new gm ON gm.book_id = b.id
      LEFT JOIN public.book_reviews_new r ON r.book_id = b.id
      WHERE gm.genre_id = genre_rec.genre_id
      AND NOT (b.id = ANY(read_books))
      GROUP BY b.id
      ORDER BY avg_rating DESC, review_count DESC
      LIMIT 10
    ) LOOP
      -- Calculate a score based on average rating and review count
      -- Score is between 0 and 1
      INSERT INTO public.book_recommendations (
        user_id, 
        book_id, 
        source_type, 
        score, 
        created_at, 
        updated_at
      ) VALUES (
        user_id_param,
        book_rec.book_id,
        'genre_based',
        LEAST(book_rec.avg_rating / 5 * 0.7 + LEAST(book_rec.review_count / 100, 1) * 0.3, 1),
        NOW(),
        NOW()
      ) ON CONFLICT (user_id, book_id, source_type) DO NOTHING;
    END LOOP;
  END LOOP;

  -- 2. Generate recommendations based on similar books to what the user has read
  FOR book_rec IN (
    SELECT rp.book_id
    FROM public.reading_progress_new rp
    WHERE rp.user_id = user_id_param AND rp.status = 'read'
  ) LOOP
    -- (Add your logic for similar books here, using _new tables)
    -- This section can be expanded as needed
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."generate_recommendations"("user_id_param" "uuid") OWNER TO "postgres";

--
-- Name: get_column_names("text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_column_names"("table_name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    column_names text[];
BEGIN
    SELECT array_agg(column_name::text)
    INTO column_names
    FROM information_schema.columns
    WHERE table_name = $1
    AND table_schema = 'public';
    
    RETURN column_names;
END;
$_$;


ALTER FUNCTION "public"."get_column_names"("table_name" "text") OWNER TO "postgres";

--
-- Name: get_search_suggestions("text", integer); Type: FUNCTION; Schema: public; Owner: postgres
--

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

-- Author name suggestions
RETURN QUERY
SELECT DISTINCT
  b.author AS suggestion,
  'author' AS entity_type
FROM
  public.books b
WHERE
  search_query IS NULL
  OR search_query = ''
  OR b.author ILIKE '%' || search_query || '%'
ORDER BY
  similarity(b.author, search_query) DESC
LIMIT max_results / 3;

-- Genre name suggestions
RETURN QUERY
SELECT DISTINCT
  g.name AS suggestion,
  'genre' AS entity_type
FROM
  public.book_genres g
WHERE
  search_query IS NULL
  OR search_query = ''
  OR g.name ILIKE '%' || search_query || '%'
ORDER BY
  similarity(g.name, search_query) DESC
LIMIT max_results / 3;
END;
$$;


ALTER FUNCTION "public"."get_search_suggestions"("search_query" "text", "max_results" integer) OWNER TO "postgres";

--
-- Name: get_table_columns("text"); Type: FUNCTION; Schema: public; Owner: postgres
--

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
END;
$$;


ALTER FUNCTION "public"."get_table_columns"("table_name_param" "text") OWNER TO "postgres";

--
-- Name: get_user_reading_stats("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

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
END;
$$;


ALTER FUNCTION "public"."get_user_reading_stats"("user_id_param" "uuid") OWNER TO "postgres";

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

--
-- Name: handle_new_user_profile(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."handle_new_user_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user_profile"() OWNER TO "postgres";

--
-- Name: increment_album_view_count("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."increment_album_view_count"("album_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update the album's view count
    UPDATE photo_albums
    SET view_count = view_count + 1
    WHERE id = album_id;

    -- Update or insert analytics
    INSERT INTO album_analytics (album_id, date, views, unique_views)
    VALUES (album_id, CURRENT_DATE, 1, 1)
    ON CONFLICT (album_id, date)
    DO UPDATE SET
        views = album_analytics.views + 1,
        unique_views = album_analytics.unique_views + 1;
END;
$$;


ALTER FUNCTION "public"."increment_album_view_count"("album_id" "uuid") OWNER TO "postgres";

--
-- Name: initialize_group_member_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."initialize_group_member_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.member_count := 0;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."initialize_group_member_count"() OWNER TO "postgres";

--
-- Name: integer_to_uuid(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."integer_to_uuid"("integer_id" integer) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN uuid_generate_v4(); -- Replace this with your logic to convert integer to UUID
END;
$$;


ALTER FUNCTION "public"."integer_to_uuid"("integer_id" integer) OWNER TO "postgres";

--
-- Name: integer_to_uuid("text", integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."integer_to_uuid"("table_name_param" "text", "integer_id_param" integer) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    uuid_result UUID;
BEGIN
    IF integer_id_param IS NULL THEN
        RETURN NULL;
    END IF;
    SELECT new_id INTO uuid_result FROM public.id_mappings WHERE table_name = table_name_param AND old_id = integer_id_param;
    IF uuid_result IS NULL THEN
        RAISE WARNING 'No UUID mapping found for table % and old_id %. Referenced FK might be invalid or missing from previous migration mappings.', table_name_param, integer_id_param;
    END IF;
    RETURN uuid_result;
END;
$$;


ALTER FUNCTION "public"."integer_to_uuid"("table_name_param" "text", "integer_id_param" integer) OWNER TO "postgres";

--
-- Name: is_admin("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"("user_id" "uuid") OWNER TO "postgres";

--
-- Name: is_admin_safe(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."is_admin_safe"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;


ALTER FUNCTION "public"."is_admin_safe"() OWNER TO "postgres";

--
-- Name: is_group_owner("uuid", "uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

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
END;
$$;


ALTER FUNCTION "public"."is_group_owner"("group_id" "uuid", "user_id" "uuid") OWNER TO "postgres";

--
-- Name: is_super_admin("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."is_super_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role = 'super_admin'
  );
END;
$$;


ALTER FUNCTION "public"."is_super_admin"("user_id" "uuid") OWNER TO "postgres";

--
-- Name: manage_series_event_number(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."manage_series_event_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- If event_number wasn't provided, auto-assign the next number
  IF NEW.event_number IS NULL THEN
    SELECT COALESCE(MAX(event_number), 0) + 1 INTO next_number
    FROM series_events
    WHERE series_id = NEW.series_id;
    
    NEW.event_number := next_number;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."manage_series_event_number"() OWNER TO "postgres";

--
-- Name: manage_waitlist_position(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."manage_waitlist_position"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  next_position INTEGER;
BEGIN
  -- For new waitlist entries, calculate the next position
  IF TG_OP = 'INSERT' THEN
    SELECT COALESCE(MAX(position), 0) + 1 INTO next_position
    FROM event_waitlists
    WHERE event_id = NEW.event_id
    AND (ticket_type_id = NEW.ticket_type_id OR (ticket_type_id IS NULL AND NEW.ticket_type_id IS NULL));
    
    NEW.position := next_position;
  -- For waitlist removal, reorder positions
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE event_waitlists
    SET position = position - 1
    WHERE event_id = OLD.event_id
    AND (ticket_type_id = OLD.ticket_type_id OR (ticket_type_id IS NULL AND OLD.ticket_type_id IS NULL))
    AND position > OLD.position;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."manage_waitlist_position"() OWNER TO "postgres";

--
-- Name: mark_all_notifications_read("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_read"("user_id_param" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true
  WHERE user_id = user_id_param AND is_read = false;
END;
$$;


ALTER FUNCTION "public"."mark_all_notifications_read"("user_id_param" "uuid") OWNER TO "postgres";

--
-- Name: notify_author_followers_of_event(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."notify_author_followers_of_event"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  follower_user_id UUID;
  author_name TEXT;
BEGIN
  -- Only proceed if this is an author event
  IF NEW.author_id IS NOT NULL THEN
    -- Get author name
    SELECT name INTO author_name FROM authors WHERE id = NEW.author_id;
    
    -- Find followers of this author
    FOR follower_user_id IN 
      SELECT follower_id FROM follows 
      WHERE following_id = NEW.author_id::TEXT
      AND target_type_id = (SELECT id FROM follow_target_types WHERE name = 'author')
    LOOP
      -- Create notification for each follower
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        link,
        data,
        is_read,
        created_at
      ) VALUES (
        follower_user_id,
        'author_event',
        'New Event by ' || author_name,
        author_name || ' has scheduled a new event: ' || NEW.title,
        '/events/' || NEW.id,
        jsonb_build_object(
          'event_id', NEW.id,
          'author_id', NEW.author_id,
          'author_name', author_name,
          'event_title', NEW.title,
          'event_time', NEW.start_date
        ),
        false,
        NOW()
      );
      
      -- Create activity
      INSERT INTO activities (
        user_id,
        activity_type,
        author_id,
        event_id,
        data,
        created_at
      ) VALUES (
        follower_user_id,
        'author_event_announced',
        NEW.author_id,
        NEW.id,
        jsonb_build_object(
          'event_id', NEW.id,
          'author_id', NEW.author_id,
          'author_name', author_name,
          'event_title', NEW.title
        ),
        NOW()
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_author_followers_of_event"() OWNER TO "postgres";

--
-- Name: notify_challenge_completion(); Type: FUNCTION; Schema: public; Owner: postgres
--

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
  end if;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."notify_challenge_completion"() OWNER TO "postgres";

--
-- Name: notify_challenge_lead(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."notify_challenge_lead"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  top_user uuid;
begin
  -- Find the current top user after this update
  select user_id into top_user
  from group_reading_challenge_progress
  where challenge_id = NEW.challenge_id
  order by books_read desc, updated_at asc
  limit 1;

  -- Only notify if the new top user is the one just updated, and they weren't the top user before
  if top_user = NEW.user_id and (OLD.books_read is null or OLD.books_read < NEW.books_read) then
    insert into notifications (user_id, group_id, type, message, data)
    values (
      NEW.user_id,
      NEW.group_id,
      'challenge_lead',
      'You just took the lead in the group reading challenge!',
      jsonb_build_object('challenge_id', NEW.challenge_id)
    );
  end if;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."notify_challenge_lead"() OWNER TO "postgres";

--
-- Name: notify_waitlist_when_ticket_available(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."notify_waitlist_when_ticket_available"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  waitlist_entry RECORD;
BEGIN
  -- When a ticket becomes available (refunded, canceled), notify waitlist
  IF OLD.status = 'purchased' AND NEW.status IN ('refunded', 'cancelled') THEN
    -- Find the first person on the waitlist for this ticket type
    SELECT * INTO waitlist_entry
    FROM event_waitlists
    WHERE event_id = NEW.event_id
    AND ticket_type_id = NEW.ticket_type_id
    AND status = 'waiting'
    ORDER BY position
    LIMIT 1;
    
    -- If there's someone on the waitlist, update their status to notified
    IF waitlist_entry.id IS NOT NULL THEN
      UPDATE event_waitlists
      SET status = 'notified',
          notification_sent_at = NOW(),
          expiration_time = NOW() + INTERVAL '24 hours',
          updated_at = NOW()
      WHERE id = waitlist_entry.id;
      
      -- Here you would trigger a notification to the user
      -- This is just schema, we'd handle the actual notification in application code
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_waitlist_when_ticket_available"() OWNER TO "postgres";

--
-- Name: prevent_spam_posts(); Type: FUNCTION; Schema: public; Owner: postgres
--

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
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_spam_posts"() OWNER TO "postgres";

--
-- Name: record_book_view(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."record_book_view"("book_id_param" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Only proceed if the user is authenticated
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO book_views (user_id, book_id)
    VALUES (auth.uid(), book_id_param);
  END IF;
END;
$$;


ALTER FUNCTION "public"."record_book_view"("book_id_param" bigint) OWNER TO "postgres";

--
-- Name: record_user_book_interaction(); Type: FUNCTION; Schema: public; Owner: postgres
--

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

  -- Record reading status interactions
  ELSIF TG_TABLE_NAME = 'reading_progress_new' THEN
    IF NEW.status = 'want_to_read' THEN
      INSERT INTO user_book_interactions_new (user_id, book_id, interaction_type, created_at, updated_at)
      VALUES (NEW.user_id, NEW.book_id, 'want_to_read', NOW(), NOW())
      ON CONFLICT (user_id, book_id, interaction_type) 
      DO UPDATE SET updated_at = NOW();
    ELSIF NEW.status = 'currently_reading' THEN
      INSERT INTO user_book_interactions_new (user_id, book_id, interaction_type, created_at, updated_at)
      VALUES (NEW.user_id, NEW.book_id, 'reading', NOW(), NOW())
      ON CONFLICT (user_id, book_id, interaction_type) 
      DO UPDATE SET updated_at = NOW();
    ELSIF NEW.status = 'read' THEN
      INSERT INTO user_book_interactions_new (user_id, book_id, interaction_type, created_at, updated_at)
      VALUES (NEW.user_id, NEW.book_id, 'finished', NOW(), NOW())
      ON CONFLICT (user_id, book_id, interaction_type) 
      DO UPDATE SET updated_at = NOW();
    END IF;

  -- Record rating interactions
  ELSIF TG_TABLE_NAME = 'book_reviews_new' THEN
    INSERT INTO user_book_interactions_new (user_id, book_id, interaction_type, interaction_value, created_at, updated_at)
    VALUES (NEW.user_id, NEW.book_id, 'rated', NEW.rating, NOW(), NOW())
    ON CONFLICT (user_id, book_id, interaction_type) 
    DO UPDATE SET interaction_value = NEW.rating, updated_at = NOW();
    
    INSERT INTO user_book_interactions_new (user_id, book_id, interaction_type, interaction_value, created_at, updated_at)
    VALUES (NEW.user_id, NEW.book_id, 'reviewed', 1, NOW(), NOW())
    ON CONFLICT (user_id, book_id, interaction_type) 
    DO UPDATE SET updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."record_user_book_interaction"() OWNER TO "postgres";

--
-- Name: search_all("text", integer); Type: FUNCTION; Schema: public; Owner: postgres
--

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

-- Search users
RETURN QUERY
SELECT
  'user' AS entity_type,
  u.id::TEXT,
  u.name,
  u.email,
  NULL::INTEGER,
  similarity(u.name, search_query) AS similarity
FROM
  public.users u
WHERE
  search_query IS NULL
  OR search_query = ''
  OR u.name ILIKE '%' || search_query || '%'
  OR u.email ILIKE '%' || search_query || '%'
ORDER BY
  similarity DESC
LIMIT max_results / 3;

-- Search reading lists
RETURN QUERY
SELECT
  'list' AS entity_type,
  rl.id::TEXT,
  rl.name,
  COALESCE(rl.description, ''),
  NULL::INTEGER,
  similarity(rl.name, search_query) AS similarity
FROM
  public.reading_lists rl
WHERE
  rl.is_public = true
  AND (
    search_query IS NULL
    OR search_query = ''
    OR rl.name ILIKE '%' || search_query || '%'
  )
ORDER BY
  similarity DESC
LIMIT max_results / 3;
END;
$$;


ALTER FUNCTION "public"."search_all"("search_query" "text", "max_results" integer) OWNER TO "postgres";

--
-- Name: search_books("text", "uuid", numeric, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

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
END;
$$;


ALTER FUNCTION "public"."search_books"("search_query" "text", "genre_filter" "uuid", "min_rating" numeric, "max_results" integer) OWNER TO "postgres";

--
-- Name: search_reading_lists("text", integer); Type: FUNCTION; Schema: public; Owner: postgres
--

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
END;
$$;


ALTER FUNCTION "public"."search_reading_lists"("search_query" "text", "max_results" integer) OWNER TO "postgres";

--
-- Name: search_users("text", integer); Type: FUNCTION; Schema: public; Owner: postgres
--

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
END;
$$;


ALTER FUNCTION "public"."search_users"("search_query" "text", "max_results" integer) OWNER TO "postgres";

--
-- Name: sync_book_author(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."sync_book_author"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- If author_id is updated, update the author name
    IF NEW.author_id IS NOT NULL AND 
       (OLD.author_id IS NULL OR OLD.author_id <> NEW.author_id) THEN
        SELECT name INTO NEW.author FROM authors WHERE id = NEW.author_id;
    -- If author name is updated, try to find matching author_id
    ELSIF NEW.author IS NOT NULL AND 
          (OLD.author IS NULL OR OLD.author <> NEW.author) THEN
        SELECT id INTO NEW.author_id FROM authors WHERE name = NEW.author LIMIT 1;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_book_author"() OWNER TO "postgres";

--
-- Name: track_book_view(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."track_book_view"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Insert into book_views table
  INSERT INTO book_views (user_id, book_id)
  VALUES (auth.uid(), NEW.id);
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."track_book_view"() OWNER TO "postgres";

--
-- Name: track_event_view(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."track_event_view"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  current_date DATE := CURRENT_DATE;
  analytics_record UUID;
BEGIN
  -- Check if we have a record for this event/date combination
  SELECT id INTO analytics_record
  FROM event_analytics
  WHERE event_id = NEW.event_id AND date = current_date;
  
  IF analytics_record IS NULL THEN
    -- Create new analytics record
    INSERT INTO event_analytics (event_id, date, views, unique_visitors)
    VALUES (NEW.event_id, current_date, 1, 1);
  ELSE
    -- Update existing record
    UPDATE event_analytics
    SET views = views + 1
    WHERE id = analytics_record;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."track_event_view"() OWNER TO "postgres";

--
-- Name: update_album_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_album_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_album_updated_at"() OWNER TO "postgres";

--
-- Name: update_author_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_author_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  admin_user_id UUID;
  changed_fields TEXT[] := '{}';
BEGIN
  -- Only create activity if significant fields changed
  IF OLD.name != NEW.name OR OLD.bio != NEW.bio OR OLD.author_image_id != NEW.author_image_id THEN
    -- Get an admin user ID
    SELECT user_id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
    
    -- If no admin found, use the first user
    IF admin_user_id IS NULL THEN
      SELECT id INTO admin_user_id FROM users ORDER BY created_at LIMIT 1;
    END IF;
    
    -- Build changed fields array
    IF OLD.name != NEW.name THEN
      changed_fields := array_append(changed_fields, 'name');
    END IF;
    
    IF OLD.bio != NEW.bio THEN
      changed_fields := array_append(changed_fields, 'bio');
    END IF;
    
    IF OLD.author_image_id != NEW.author_image_id THEN
      changed_fields := array_append(changed_fields, 'image');
    END IF;
    
    -- Insert author_profile_updated activity
    INSERT INTO activities (
      user_id,
      activity_type,
      author_id,
      data,
      created_at
    ) VALUES (
      admin_user_id,
      'author_profile_updated',
      NEW.id,
      jsonb_build_object(
        'author_id', NEW.id,
        'author_name', NEW.name,
        'updated_fields', changed_fields
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_author_activity"() OWNER TO "postgres";

--
-- Name: update_book_club_member_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_book_club_member_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE book_clubs
    SET member_count = member_count + 1
    WHERE id = NEW.book_club_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE book_clubs
    SET member_count = member_count - 1
    WHERE id = OLD.book_club_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_book_club_member_count"() OWNER TO "postgres";

--
-- Name: update_book_rating(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_book_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  avg_rating NUMERIC;
  review_count INTEGER;
BEGIN
  -- Calculate the new average rating for the book
  SELECT 
    AVG(rating)::NUMERIC(3,2), 
    COUNT(*)
  INTO 
    avg_rating, 
    review_count
  FROM 
    public.book_reviews
  WHERE 
    book_id = COALESCE(NEW.book_id, OLD.book_id);
  
  -- Update the book's rating
  UPDATE public.books
  SET 
    average_rating = avg_rating,
    review_count = review_count,
    updated_at = NOW()
  WHERE 
    id = COALESCE(NEW.book_id, OLD.book_id);
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_book_rating"() OWNER TO "postgres";

--
-- Name: update_book_rating_from_reviews(); Type: FUNCTION; Schema: public; Owner: postgres
--

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
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_book_rating_from_reviews"() OWNER TO "postgres";

--
-- Name: update_contact_info_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_contact_info_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_contact_info_updated_at"() OWNER TO "postgres";

--
-- Name: update_daily_stats_from_progress(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_daily_stats_from_progress"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  progress_date DATE;
BEGIN
  -- Get the current date
  progress_date := CURRENT_DATE;
  
  -- If a book was started
  IF (NEW.status = 'currently_reading' AND (OLD.status IS NULL OR OLD.status = 'want_to_read')) THEN
    -- Insert or update the daily stats for books started
    INSERT INTO public.reading_stats_daily (
      user_id,
      date,
      books_started,
      updated_at
    ) VALUES (
      NEW.user_id,
      progress_date,
      1,
      NOW()
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
      books_started = reading_stats_daily.books_started + 1,
      updated_at = NOW();
  END IF;
  
  -- If a book was finished
  IF (NEW.status = 'read' AND OLD.status = 'currently_reading') THEN
    -- Insert or update the daily stats for books finished
    INSERT INTO public.reading_stats_daily (
      user_id,
      date,
      books_finished,
      books_read,
      updated_at
    ) VALUES (
      NEW.user_id,
      progress_date,
      1,
      1,
      NOW()
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
      books_finished = reading_stats_daily.books_finished + 1,
      books_read = reading_stats_daily.books_read + 1,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_daily_stats_from_progress"() OWNER TO "postgres";

--
-- Name: update_daily_stats_from_session(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_daily_stats_from_session"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  session_date DATE;
BEGIN
  -- Get the date from the session start time
  session_date := DATE(NEW.start_time);
  
  -- Insert or update the daily stats
  INSERT INTO public.reading_stats_daily (
    user_id,
    date,
    total_pages,
    total_minutes,
    updated_at
  ) VALUES (
    NEW.user_id,
    session_date,
    NEW.pages_read,
    NEW.minutes_spent,
    NOW()
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_pages = reading_stats_daily.total_pages + NEW.pages_read,
    total_minutes = reading_stats_daily.total_minutes + NEW.minutes_spent,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_daily_stats_from_session"() OWNER TO "postgres";

--
-- Name: update_event_financials(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_event_financials"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  event_currency TEXT;
  ticket_type_id UUID;
  ticket_type_name TEXT;
  current_breakdown JSONB;
BEGIN
  -- Get event currency
  SELECT currency INTO event_currency FROM events WHERE id = NEW.event_id;
  
  -- Create financial record if it doesn't exist
  INSERT INTO event_financials (event_id, currency)
  VALUES (NEW.event_id, event_currency)
  ON CONFLICT (event_id) DO NOTHING;
  
  -- Handle different transaction types
  IF NEW.transaction_type = 'purchase' AND NEW.status = 'completed' THEN
    -- Get ticket type for this transaction
    SELECT t.ticket_type_id, tt.name INTO ticket_type_id, ticket_type_name
    FROM tickets t
    JOIN ticket_types tt ON t.ticket_type_id = tt.id
    WHERE t.registration_id = NEW.registration_id
    LIMIT 1;
    
    -- Get current breakdown
    SELECT ticket_sales_breakdown INTO current_breakdown
    FROM event_financials
    WHERE event_id = NEW.event_id;
    
    -- Update ticket breakdown
    IF current_breakdown IS NULL THEN
      current_breakdown := jsonb_build_object(ticket_type_id::text, jsonb_build_object(
        'name', ticket_type_name,
        'count', 1,
        'revenue', NEW.amount
      ));
    ELSE
      IF current_breakdown ? ticket_type_id::text THEN
        current_breakdown := jsonb_set(
          current_breakdown,
          ARRAY[ticket_type_id::text, 'count'],
          to_jsonb((current_breakdown -> ticket_type_id::text ->> 'count')::int + 1)
        );
        current_breakdown := jsonb_set(
          current_breakdown,
          ARRAY[ticket_type_id::text, 'revenue'],
          to_jsonb((current_breakdown -> ticket_type_id::text ->> 'revenue')::numeric + NEW.amount)
        );
      ELSE
        current_breakdown := current_breakdown || jsonb_build_object(
          ticket_type_id::text, jsonb_build_object(
            'name', ticket_type_name,
            'count', 1,
            'revenue', NEW.amount
          )
        );
      END IF;
    END IF;
    
    -- Update financial summary
    UPDATE event_financials
    SET total_revenue = total_revenue + NEW.amount,
        total_fees = total_fees + NEW.fees,
        total_taxes = total_taxes + NEW.taxes,
        net_revenue = net_revenue + (NEW.amount - NEW.fees - NEW.taxes),
        ticket_sales_breakdown = current_breakdown,
        updated_at = NOW()
    WHERE event_id = NEW.event_id;
    
  ELSIF NEW.transaction_type IN ('refund', 'partial_refund') AND NEW.status = 'completed' THEN
    -- Update financial summary for refunds
    UPDATE event_financials
    SET total_refunds = total_refunds + NEW.amount,
        net_revenue = net_revenue - NEW.amount,
        updated_at = NOW()
    WHERE event_id = NEW.event_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_event_financials"() OWNER TO "postgres";

--
-- Name: update_event_status(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_event_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If event is updated to published status
  IF OLD.status != 'published' AND NEW.status = 'published' THEN
    -- Update published_at timestamp
    NEW.published_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_event_status"() OWNER TO "postgres";

--
-- Name: update_feed_entry_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_feed_entry_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_feed_entry_updated_at"() OWNER TO "postgres";

--
-- Name: update_follow_counts(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_follow_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Update follower count for the user being followed
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET follower_count = follower_count + 1
    WHERE user_id = NEW.following_id;
    
    -- Update following count for the follower
    UPDATE public.profiles
    SET following_count = following_count + 1
    WHERE user_id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET follower_count = follower_count - 1
    WHERE user_id = OLD.following_id;
    
    -- Update following count for the follower
    UPDATE public.profiles
    SET following_count = following_count - 1
    WHERE user_id = OLD.follower_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_follow_counts"() OWNER TO "postgres";

--
-- Name: update_group_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_group_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  changed_fields TEXT[] := '{}';
  admin_user_id UUID;
BEGIN
  -- Only create activity if significant fields changed
  IF OLD.name != NEW.name OR OLD.description != NEW.description THEN
    -- Get an admin user ID if needed
    IF NEW.created_by IS NULL THEN
      SELECT user_id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
      
      -- If no admin found, use the first user
      IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM users ORDER BY created_at LIMIT 1;
      END IF;
    END IF;
    
    -- Build changed fields array
    IF OLD.name != NEW.name THEN
      changed_fields := array_append(changed_fields, 'name');
    END IF;
    
    IF OLD.description != NEW.description THEN
      changed_fields := array_append(changed_fields, 'description');
    END IF;
    
    -- Insert group_updated activity
    INSERT INTO activities (
      user_id,
      activity_type,
      group_id,
      data,
      created_at
    ) VALUES (
      COALESCE(NEW.created_by, admin_user_id),
      'group_updated',
      NEW.id,
      jsonb_build_object(
        'group_id', NEW.id,
        'group_name', NEW.name,
        'updated_fields', changed_fields
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_group_activity"() OWNER TO "postgres";

--
-- Name: update_group_member_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_group_member_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE groups 
        SET member_count = member_count + 1 
        WHERE id = NEW.group_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE groups 
        SET member_count = member_count - 1 
        WHERE id = OLD.group_id;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_group_member_count"() OWNER TO "postgres";

--
-- Name: update_image_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_image_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_image_updated_at"() OWNER TO "postgres";

--
-- Name: update_modified_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";

--
-- Name: update_publisher_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_publisher_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  admin_user_id UUID;
  changed_fields TEXT[] := '{}';
BEGIN
  -- Only create activity if significant fields changed
  IF OLD.name != NEW.name OR OLD.about != NEW.about OR OLD.publisher_image_id != NEW.publisher_image_id THEN
    -- Get an admin user ID
    SELECT user_id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
    
    -- If no admin found, use the first user
    IF admin_user_id IS NULL THEN
      SELECT id INTO admin_user_id FROM users ORDER BY created_at LIMIT 1;
    END IF;
    
    -- Build changed fields array
    IF OLD.name != NEW.name THEN
      changed_fields := array_append(changed_fields, 'name');
    END IF;
    
    IF OLD.about != NEW.about THEN
      changed_fields := array_append(changed_fields, 'about');
    END IF;
    
    IF OLD.publisher_image_id != NEW.publisher_image_id THEN
      changed_fields := array_append(changed_fields, 'image');
    END IF;
    
    -- Insert publisher_profile_updated activity
    INSERT INTO activities (
      user_id,
      activity_type,
      publisher_id,
      data,
      created_at
    ) VALUES (
      admin_user_id,
      'publisher_updated',
      NEW.id,
      jsonb_build_object(
        'publisher_id', NEW.id,
        'publisher_name', NEW.name,
        'updated_fields', changed_fields
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_publisher_activity"() OWNER TO "postgres";

--
-- Name: update_publishers_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_publishers_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_publishers_updated_at"() OWNER TO "postgres";

--
-- Name: update_reading_challenge(); Type: FUNCTION; Schema: public; Owner: postgres
--

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
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_reading_challenge"() OWNER TO "postgres";

--
-- Name: update_reading_goals(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_reading_goals"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  goal RECORD;
BEGIN
  -- Update books read goals
  IF NEW.books_read > 0 THEN
    FOR goal IN 
      SELECT * FROM public.reading_goals 
      WHERE user_id = NEW.user_id 
        AND goal_type = 'books' 
        AND is_completed = FALSE
        AND start_date <= NEW.date 
        AND end_date >= NEW.date
    LOOP
      UPDATE public.reading_goals
      SET 
        current_value = current_value + NEW.books_read,
        is_completed = CASE WHEN current_value + NEW.books_read >= target_value THEN TRUE ELSE FALSE END,
        updated_at = NOW()
      WHERE id = goal.id;
    END LOOP;
  END IF;
  
  -- Update pages read goals
  IF NEW.total_pages > 0 THEN
    FOR goal IN 
      SELECT * FROM public.reading_goals 
      WHERE user_id = NEW.user_id 
        AND goal_type = 'pages' 
        AND is_completed = FALSE
        AND start_date <= NEW.date 
        AND end_date >= NEW.date
    LOOP
      UPDATE public.reading_goals
      SET 
        current_value = current_value + NEW.total_pages,
        is_completed = CASE WHEN current_value + NEW.total_pages >= target_value THEN TRUE ELSE FALSE END,
        updated_at = NOW()
      WHERE id = goal.id;
    END LOOP;
  END IF;
  
  -- Update minutes read goals
  IF NEW.total_minutes > 0 THEN
    FOR goal IN 
      SELECT * FROM public.reading_goals 
      WHERE user_id = NEW.user_id 
        AND goal_type = 'minutes' 
        AND is_completed = FALSE
        AND start_date <= NEW.date 
        AND end_date >= NEW.date
    LOOP
      UPDATE public.reading_goals
      SET 
        current_value = current_value + NEW.total_minutes,
        is_completed = CASE WHEN current_value + NEW.total_minutes >= target_value THEN TRUE ELSE FALSE END,
        updated_at = NOW()
      WHERE id = goal.id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_reading_goals"() OWNER TO "postgres";

--
-- Name: update_reading_streaks(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_reading_streaks"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  last_streak RECORD;
  last_activity_date DATE;
BEGIN
  -- Find the user's last active streak
  SELECT * INTO last_streak
  FROM public.reading_streaks
  WHERE user_id = NEW.user_id AND is_active = TRUE
  ORDER BY end_date DESC
  LIMIT 1;
  
  -- If no active streak exists, create a new one
  IF last_streak IS NULL THEN
    INSERT INTO public.reading_streaks (
      user_id,
      start_date,
      end_date,
      days,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      NEW.user_id,
      NEW.date,
      NEW.date,
      1,
      TRUE,
      NOW(),
      NOW()
    );
  ELSE
    -- Check if this activity continues the streak (next day)
    IF NEW.date = last_streak.end_date + INTERVAL '1 day' THEN
      -- Update the existing streak
      UPDATE public.reading_streaks
      SET 
        end_date = NEW.date,
        days = days + 1,
        updated_at = NOW()
      WHERE id = last_streak.id;
    -- Check if this activity is on the same day as the streak end
    ELSIF NEW.date = last_streak.end_date THEN
      -- Do nothing, already counted
      NULL;
    -- Check if this activity breaks the streak (gap in days)
    ELSIF NEW.date > last_streak.end_date + INTERVAL '1 day' THEN
      -- Mark the old streak as inactive
      UPDATE public.reading_streaks
      SET 
        is_active = FALSE,
        updated_at = NOW()
      WHERE id = last_streak.id;
      
      -- Create a new streak
      INSERT INTO public.reading_streaks (
        user_id,
        start_date,
        end_date,
        days,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        NEW.user_id,
        NEW.date,
        NEW.date,
        1,
        TRUE,
        NOW(),
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_reading_streaks"() OWNER TO "postgres";

--
-- Name: update_streak_goals(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_streak_goals"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  goal RECORD;
BEGIN
  -- Only process if the streak is active and updated
  IF NEW.is_active = TRUE AND (TG_OP = 'INSERT' OR OLD.days <> NEW.days) THEN
    FOR goal IN 
      SELECT * FROM public.reading_goals 
      WHERE user_id = NEW.user_id 
        AND goal_type = 'streak' 
        AND is_completed = FALSE
        AND start_date <= NEW.end_date 
        AND end_date >= NEW.end_date
    LOOP
      UPDATE public.reading_goals
      SET 
        current_value = NEW.days,
        is_completed = CASE WHEN NEW.days >= target_value THEN TRUE ELSE FALSE END,
        updated_at = NOW()
      WHERE id = goal.id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_streak_goals"() OWNER TO "postgres";

--
-- Name: update_ticket_quantity_sold(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_ticket_quantity_sold"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'purchased') THEN
    -- Increment quantity sold for this ticket type
    UPDATE ticket_types
    SET quantity_sold = quantity_sold + 1
    WHERE id = NEW.ticket_type_id;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status != 'purchased' AND NEW.status = 'purchased') THEN
    -- Increment quantity sold for this ticket type
    UPDATE ticket_types
    SET quantity_sold = quantity_sold + 1
    WHERE id = NEW.ticket_type_id;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'purchased' AND NEW.status IN ('refunded', 'cancelled')) THEN
    -- Decrement quantity sold for this ticket type
    UPDATE ticket_types
    SET quantity_sold = quantity_sold - 1
    WHERE id = NEW.ticket_type_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_ticket_quantity_sold"() OWNER TO "postgres";

--
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_timestamp"() OWNER TO "postgres";

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

--
-- Name: update_user_profile_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_user_profile_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  user_name TEXT := 'Unknown User';
  changed_fields TEXT[] := '{}';
BEGIN
  -- Only create activity if significant fields changed
  IF OLD.bio != NEW.bio THEN
    -- Get user name
    SELECT name INTO user_name FROM users WHERE id = NEW.user_id;
    
    -- Build changed fields array
    IF OLD.bio != NEW.bio THEN
      changed_fields := array_append(changed_fields, 'bio');
    END IF;
    
    -- Insert profile_updated activity
    INSERT INTO activities (
      user_id,
      activity_type,
      user_profile_id,
      data,
      created_at
    ) VALUES (
      NEW.user_id,
      'profile_updated',
      NEW.user_id,
      jsonb_build_object(
        'user_id', NEW.user_id,
        'user_name', user_name,
        'updated_fields', changed_fields
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_profile_activity"() OWNER TO "postgres";

--
-- Name: update_user_recommendations(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_user_recommendations"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Schedule recommendation generation for this user
  PERFORM public.generate_recommendations(NEW.user_id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_recommendations"() OWNER TO "postgres";

--
-- Name: validate_book_data(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."validate_book_data"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Ensure at least one ISBN is provided
    IF NEW.isbn10 IS NULL AND NEW.isbn13 IS NULL THEN
        RAISE EXCEPTION 'At least one ISBN (ISBN-10 or ISBN-13) must be provided';
    END IF;
    
    -- Ensure title is not empty
    IF NEW.title IS NULL OR TRIM(NEW.title) = '' THEN
        RAISE EXCEPTION 'Book title cannot be empty';
    END IF;
    
    -- Ensure author is not empty
    IF NEW.author IS NULL OR TRIM(NEW.author) = '' THEN
        RAISE EXCEPTION 'Book author cannot be empty';
    END IF;
    
    -- Validate publication date is not in the future
    IF NEW.publication_date IS NOT NULL AND NEW.publication_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Publication date cannot be in the future';
    END IF;
    
    -- Validate rating range
    IF NEW.average_rating < 0 OR NEW.average_rating > 5 THEN
        RAISE EXCEPTION 'Average rating must be between 0 and 5';
    END IF;
    
    -- Validate review count is non-negative
    IF NEW.review_count < 0 THEN
        RAISE EXCEPTION 'Review count cannot be negative';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_book_data"() OWNER TO "postgres";

--
-- Name: validate_chat_message(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."validate_chat_message"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  chat_room RECORD;
  has_ticket BOOLEAN;
BEGIN
  -- Get chat room details
  SELECT * INTO chat_room FROM event_chat_rooms WHERE id = NEW.chat_room_id;
  
  -- If chat room requires ticket, check if user has one
  IF chat_room.requires_ticket THEN
    SELECT EXISTS (
      SELECT 1 FROM tickets t
      JOIN event_registrations er ON t.registration_id = er.id
      WHERE t.event_id = chat_room.event_id
      AND t.user_id = NEW.user_id
      AND t.status IN ('purchased', 'checked_in')
    ) INTO has_ticket;
    
    IF NOT has_ticket THEN
      RAISE EXCEPTION 'User must have a valid ticket to post in this chat room';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_chat_message"() OWNER TO "postgres";

--
-- Name: validate_event_creation(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."validate_event_creation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  permission_record RECORD;
BEGIN
  -- Get permission level for this user
  SELECT * INTO permission_record
  FROM event_creator_permissions
  WHERE user_id = NEW.created_by;
  
  -- If no permission record found, user can't create events
  IF permission_record IS NULL THEN
    IF EXISTS (SELECT 1 FROM users WHERE id = NEW.created_by AND role_id = (SELECT id FROM roles WHERE name = 'admin')) THEN
      -- Admins can always create events
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'You do not have permission to create events';
    END IF;
  END IF;
  
  -- Check if user can create paid events
  IF NOT NEW.is_free AND NOT permission_record.can_create_paid_events THEN
    RAISE EXCEPTION 'You do not have permission to create paid events';
  END IF;
  
  -- Check if user can create events in this category
  IF NEW.category_id IS NOT NULL AND 
     permission_record.approved_categories IS NOT NULL AND 
     array_length(permission_record.approved_categories, 1) > 0 AND
     NOT (NEW.category_id = ANY(permission_record.approved_categories)) THEN
    RAISE EXCEPTION 'You do not have permission to create events in this category';
  END IF;
  
  -- If user requires approval, set initial status to draft
  IF permission_record.requires_approval THEN
    NEW.status := 'draft';
    
    -- Create approval record after event is created
    -- This has to be handled by a separate trigger because we need NEW.id
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_event_creation"() OWNER TO "postgres";

--
-- Name: validate_follow_target(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."validate_follow_target"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
    DECLARE
        target_type_name TEXT;
        target_id_int INTEGER;
        v_target_type_id_int INTEGER;
        target_exists BOOLEAN;
    BEGIN
        -- During this specific UPDATE for target_type_id migration,
        -- NEW.target_type_id is the original INTEGER value.
        v_target_type_id_int := NEW.target_type_id;

        SELECT name INTO target_type_name
        FROM public.follow_target_types_old -- Query the OLD table to get type name
        WHERE id = v_target_type_id_int;

        IF NOT FOUND THEN
            -- This is a critical integrity issue for target_type_id itself.
            RAISE EXCEPTION 'Follow target type name not found for ID % in follow_target_types_old', v_target_type_id_int;
        END IF;

        IF target_type_name = 'user' THEN
            -- User validation remains strict as auth.users.id is already UUID
            IF NEW.following_id IS NOT NULL AND TRIM(NEW.following_id) <> '' THEN
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM auth.users WHERE id = NEW.following_id::uuid
                    ) THEN
                        RAISE EXCEPTION 'Invalid user ID or user does not exist: %', NEW.following_id;
                    END IF;
                EXCEPTION
                    WHEN invalid_text_representation THEN
                        RAISE EXCEPTION 'Invalid user ID format for user target (expected UUID string): %', NEW.following_id;
                END;
            ELSIF NEW.following_id IS NOT NULL THEN
                 RAISE EXCEPTION 'Invalid user ID format for user target: %', NEW.following_id;
            END IF;

        ELSIF target_type_name = 'book' THEN
            IF NEW.following_id IS NOT NULL AND TRIM(NEW.following_id) <> '' THEN
                BEGIN
                    target_id_int := NEW.following_id::integer;
                    SELECT EXISTS (
                        SELECT 1 FROM public.books b
                        WHERE b.id = integer_to_uuid(target_id_int)
                    ) INTO target_exists;
                    IF NOT target_exists THEN
                        RAISE NOTICE '[MIGRATION NOTICE] Book follow integrity: Book with original integer ID % (maps to UUID %) not found in public.books. Allowing target_type_id update.', NEW.following_id, integer_to_uuid(target_id_int);
                        -- DO NOT RAISE EXCEPTION for now to allow target_type_id migration
                    END IF;
                EXCEPTION
                    WHEN invalid_text_representation THEN
                        RAISE NOTICE '[MIGRATION NOTICE] Book follow integrity: Invalid book ID format (expected integer string): %. Allowing target_type_id update.', NEW.following_id;
                         -- DO NOT RAISE EXCEPTION
                    WHEN others THEN
                        RAISE NOTICE '[MIGRATION NOTICE] Book follow integrity: Error validating book ID %: %. Allowing target_type_id update.', NEW.following_id, SQLERRM;
                         -- DO NOT RAISE EXCEPTION
                END;
            END IF;

        ELSIF target_type_name = 'author' THEN
             IF NEW.following_id IS NOT NULL AND TRIM(NEW.following_id) <> '' THEN
                BEGIN
                    target_id_int := NEW.following_id::integer;
                     SELECT EXISTS (
                        SELECT 1 FROM public.authors a
                        WHERE a.id = integer_to_uuid(target_id_int)
                    ) INTO target_exists;
                    IF NOT target_exists THEN
                        RAISE NOTICE '[MIGRATION NOTICE] Author follow integrity: Author with original integer ID % (maps to UUID %) not found in public.authors. Allowing target_type_id update.', NEW.following_id, integer_to_uuid(target_id_int);
                        -- DO NOT RAISE EXCEPTION
                    END IF;
                EXCEPTION
                    WHEN invalid_text_representation THEN
                        RAISE NOTICE '[MIGRATION NOTICE] Author follow integrity: Invalid author ID format (expected integer string): %. Allowing target_type_id update.', NEW.following_id;
                        -- DO NOT RAISE EXCEPTION
                    WHEN others THEN
                        RAISE NOTICE '[MIGRATION NOTICE] Author follow integrity: Error validating author ID %: %. Allowing target_type_id update.', NEW.following_id, SQLERRM;
                        -- DO NOT RAISE EXCEPTION
                END;
            END IF;
        END IF;

        RETURN NEW;
    END;
    $$;


ALTER FUNCTION "public"."validate_follow_target"() OWNER TO "postgres";

--
-- Name: validate_livestream_activation(); Type: FUNCTION; Schema: public; Owner: postgres
--

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
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_livestream_activation"() OWNER TO "postgres";

--
-- Name: validate_survey_response(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."validate_survey_response"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  required_question_ids UUID[];
  provided_question_ids TEXT[];
BEGIN
  -- Get all required question IDs for this survey
  SELECT ARRAY_AGG(id) INTO required_question_ids
  FROM survey_questions
  WHERE survey_id = NEW.survey_id
  AND is_required = true;
  
  -- Check if response data is missing any required questions
  IF required_question_ids IS NOT NULL THEN
    SELECT ARRAY_AGG(key) INTO provided_question_ids
    FROM jsonb_object_keys(NEW.response_data) AS key;
    
    FOR i IN 1..array_length(required_question_ids, 1) LOOP
      IF NOT required_question_ids[i]::TEXT = ANY(provided_question_ids) THEN
        RAISE EXCEPTION 'Missing response for required question: %', required_question_ids[i];
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_survey_response"() OWNER TO "postgres";

--
-- Name: validate_ticket_purchase(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."validate_ticket_purchase"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  available_qty INTEGER;
  ticket_active BOOLEAN;
  sale_active BOOLEAN;
BEGIN
  -- Get available quantity and active status
  SELECT 
    (quantity_total - quantity_sold) AS qty_left,
    is_active,
    (CURRENT_TIMESTAMP BETWEEN sale_start_date AND sale_end_date) AS in_sales_period
  INTO available_qty, ticket_active, sale_active
  FROM ticket_types
  WHERE id = NEW.ticket_type_id;
  
  -- Check if ticket type is active
  IF NOT ticket_active THEN
    RAISE EXCEPTION 'This ticket type is not currently available for purchase';
  END IF;
  
  -- Check if sale period is active
  IF NOT sale_active THEN
    RAISE EXCEPTION 'Ticket sales are not active at this time';
  END IF;
  
  -- Check if tickets are available
  IF available_qty <= 0 THEN
    RAISE EXCEPTION 'No more tickets available for this ticket type';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_ticket_purchase"() OWNER TO "postgres";

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

COMMENT ON TABLE "public"."users" IS 'Stores user profile information';


--
-- Name: accepted_friends; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."accepted_friends" WITH ("security_invoker"='true') AS
 SELECT "f"."id",
        CASE
            WHEN ("f"."user_id" = "u"."id") THEN "f"."friend_id"
            ELSE "f"."user_id"
        END AS "friend_user_id",
    "f"."status",
    "f"."requested_at",
    "f"."responded_at"
   FROM ("public"."friends" "f"
     JOIN "public"."users" "u" ON ((("u"."id" = "f"."user_id") OR ("u"."id" = "f"."friend_id"))))
  WHERE ("f"."status" = 'accepted'::"text");


ALTER TABLE "public"."accepted_friends" OWNER TO "postgres";

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
    "author_id" "uuid"
);


ALTER TABLE "public"."activities" OWNER TO "postgres";

--
-- Name: TABLE "activities"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."activities" IS 'Stores activity events for various entity types. Use dedicated ID columns (book_id, review_id, list_id, user_profile_id, group_id, event_id) for foreign keys, and the data JSONB field for additional attributes.';


--
-- Name: COLUMN "activities"."author_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."activities"."author_id" IS 'Reference to the author associated with this activity';


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
    "updated_at" timestamp with time zone DEFAULT "now"()
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_share_type" CHECK ((("share_type")::"text" = ANY ((ARRAY['public'::character varying, 'private'::character varying, 'link'::character varying])::"text"[])))
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
    "author_gallery_id" integer,
    "twitter_handle" "text",
    "facebook_handle" "text",
    "instagram_handle" "text",
    "goodreads_url" "text",
    "cover_image_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."authors" OWNER TO "postgres";

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
    "book_id" "uuid",
    "author_id" "uuid",
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
    "role" character varying(50) DEFAULT 'member'::character varying,
    CONSTRAINT "book_club_members_role_check" CHECK ((("role")::"text" = ANY ((ARRAY['admin'::character varying, 'moderator'::character varying, 'member'::character varying])::"text"[])))
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
    "book_id" "uuid",
    "genre_id" "uuid"
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
    "book_id" "uuid",
    CONSTRAINT "book_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "book_reviews_visibility_check" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'private'::"text"])))
);


ALTER TABLE "public"."book_reviews" OWNER TO "postgres";

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
    "book_id" "uuid",
    "subject_id" "uuid",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."book_subjects" OWNER TO "postgres";

--
-- Name: book_tag_mappings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."book_tag_mappings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid",
    "tag_id" "uuid",
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


ALTER TABLE "public"."books" OWNER TO "postgres";

--
-- Name: TABLE "books"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."books" IS 'Main books table containing all book information including metadata, ratings, and relationships';


--
-- Name: COLUMN "books"."id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."books"."id" IS 'Unique identifier for the book';


--
-- Name: COLUMN "books"."isbn10"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."books"."isbn10" IS 'ISBN-10 identifier (optional, must be valid format if provided)';


--
-- Name: COLUMN "books"."isbn13"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."books"."isbn13" IS 'ISBN-13 identifier (optional, must be valid format if provided)';


--
-- Name: COLUMN "books"."title"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."books"."title" IS 'Title of the book (required, max 500 characters)';


--
-- Name: COLUMN "books"."publication_date"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."books"."publication_date" IS 'Date when the book was published (cannot be in the future)';


--
-- Name: COLUMN "books"."pages"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."books"."pages" IS 'Number of pages in the book (must be positive if provided)';


--
-- Name: COLUMN "books"."list_price"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."books"."list_price" IS 'List price of the book (must be non-negative if provided)';


--
-- Name: COLUMN "books"."author"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."books"."author" IS 'Author of the book (required)';


--
-- Name: COLUMN "books"."featured"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."books"."featured" IS 'Whether this book is featured in recommendations';


--
-- Name: COLUMN "books"."average_rating"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."books"."average_rating" IS 'Average rating from all reviews (0-5 scale)';


--
-- Name: COLUMN "books"."review_count"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."books"."review_count" IS 'Total number of reviews for this book';


--
-- Name: COLUMN "books"."created_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."books"."created_at" IS 'Timestamp when the book record was created';


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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_approvals_approval_status_check" CHECK (("approval_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'changes_requested'::"text"])))
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
    "book_id" "uuid",
    CONSTRAINT "event_books_feature_type_check" CHECK (("feature_type" = ANY (ARRAY['primary'::"text", 'related'::"text", 'recommendation'::"text"])))
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_calendar_exports_calendar_type_check" CHECK (("calendar_type" = ANY (ARRAY['google'::"text", 'apple'::"text", 'outlook'::"text", 'ical'::"text"])))
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_creator_permissions_permission_level_check" CHECK (("permission_level" = ANY (ARRAY['admin'::"text", 'organizer'::"text", 'staff'::"text", 'limited'::"text"])))
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_financials_payout_status_check" CHECK (("payout_status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_interests_interest_level_check" CHECK (("interest_level" = ANY (ARRAY['interested'::"text", 'maybe'::"text"])))
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_livestreams_provider_check" CHECK (("provider" = ANY (ARRAY['youtube'::"text", 'vimeo'::"text", 'twitch'::"text", 'facebook'::"text", 'custom'::"text"])))
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_media_media_type_check" CHECK (("media_type" = ANY (ARRAY['image'::"text", 'video'::"text", 'document'::"text", 'audio'::"text"])))
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_permission_requests_requested_level_check" CHECK (("requested_level" = ANY (ARRAY['organizer'::"text", 'staff'::"text", 'limited'::"text"]))),
    CONSTRAINT "event_permission_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_questions_question_type_check" CHECK (("question_type" = ANY (ARRAY['text'::"text", 'multiple_choice'::"text", 'checkbox'::"text", 'dropdown'::"text", 'date'::"text", 'file'::"text"])))
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
    "session_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    CONSTRAINT "event_registrations_registration_status_check" CHECK (("registration_status" = ANY (ARRAY['registered'::"text", 'waitlisted'::"text", 'cancelled'::"text", 'attended'::"text", 'no_show'::"text"])))
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_reminders_reminder_type_check" CHECK (("reminder_type" = ANY (ARRAY['email'::"text", 'push'::"text", 'sms'::"text", 'in_app'::"text"])))
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
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_shares_share_platform_check" CHECK (("share_platform" = ANY (ARRAY['facebook'::"text", 'twitter'::"text", 'linkedin'::"text", 'email'::"text", 'whatsapp'::"text", 'other'::"text"])))
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_sponsors_sponsor_level_check" CHECK (("sponsor_level" = ANY (ARRAY['platinum'::"text", 'gold'::"text", 'silver'::"text", 'bronze'::"text", 'partner'::"text", 'media'::"text"])))
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_staff_role_check" CHECK (("role" = ANY (ARRAY['organizer'::"text", 'co-organizer'::"text", 'staff'::"text", 'check-in'::"text", 'moderator'::"text"])))
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_waitlists_status_check" CHECK (("status" = ANY (ARRAY['waiting'::"text", 'notified'::"text", 'converted'::"text", 'expired'::"text"])))
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
    "publisher_id" "uuid",
    CONSTRAINT "events_format_check" CHECK (("format" = ANY (ARRAY['physical'::"text", 'virtual'::"text", 'hybrid'::"text"]))),
    CONSTRAINT "events_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'cancelled'::"text", 'completed'::"text", 'postponed'::"text"]))),
    CONSTRAINT "events_visibility_check" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'private'::"text", 'invite_only'::"text", 'group_only'::"text"])))
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
    "is_deleted" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."feed_entries" OWNER TO "postgres";

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
    "following_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "target_type_id_uuid_temp" "uuid",
    "target_type_id" "uuid"
);


ALTER TABLE "public"."follows" OWNER TO "postgres";

--
-- Name: format_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."format_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL
);


ALTER TABLE "public"."format_types" OWNER TO "postgres";

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
    "type" "text",
    CONSTRAINT "group_achievements_name_check" CHECK (("length"(TRIM(BOTH FROM "name")) > 0)),
    CONSTRAINT "group_achievements_points_check" CHECK (("points" >= 0)),
    CONSTRAINT "group_achievements_type_check" CHECK ((("type" IS NULL) OR ("length"(TRIM(BOTH FROM "type")) > 0)))
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
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "group_analytics_created_at_check" CHECK (("created_at" <= CURRENT_TIMESTAMP)),
    CONSTRAINT "group_analytics_metric_name_check" CHECK (("length"(TRIM(BOTH FROM "metric_name")) > 0)),
    CONSTRAINT "group_analytics_recorded_at_check" CHECK (("recorded_at" <= CURRENT_TIMESTAMP))
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
    "created_at" timestamp with time zone,
    CONSTRAINT "group_book_reviews_new_book_id_required_check" CHECK (("book_id" IS NOT NULL)),
    CONSTRAINT "group_book_reviews_new_content_check" CHECK ((("rating" IS NOT NULL) OR (("review" IS NOT NULL) AND ("length"(TRIM(BOTH FROM "review")) > 0)))),
    CONSTRAINT "group_book_reviews_new_created_at_required_check" CHECK (("created_at" IS NOT NULL)),
    CONSTRAINT "group_book_reviews_new_group_id_required_check" CHECK (("group_id" IS NOT NULL)),
    CONSTRAINT "group_book_reviews_new_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "group_book_reviews_new_review_check" CHECK ((("review" IS NULL) OR ("length"(TRIM(BOTH FROM "review")) > 0))),
    CONSTRAINT "group_book_reviews_new_user_id_required_check" CHECK (("user_id" IS NOT NULL))
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "group_discussion_categories_created_at_required_check" CHECK (("created_at" IS NOT NULL)),
    CONSTRAINT "group_discussion_categories_description_check" CHECK ((("description" IS NULL) OR ("length"(TRIM(BOTH FROM "description")) > 0))),
    CONSTRAINT "group_discussion_categories_description_length_check" CHECK ((("description" IS NULL) OR ("length"("description") <= 500))),
    CONSTRAINT "group_discussion_categories_name_check" CHECK (("length"(TRIM(BOTH FROM "name")) > 0)),
    CONSTRAINT "group_discussion_categories_name_length_check" CHECK (("length"("name") <= 100)),
    CONSTRAINT "group_discussion_categories_updated_at_check" CHECK ((("updated_at" IS NULL) OR ("updated_at" >= "created_at"))),
    CONSTRAINT "group_discussion_categories_updated_at_required_check" CHECK (("updated_at" IS NOT NULL))
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
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "group_member_achievements_created_at_check" CHECK (("created_at" IS NOT NULL)),
    CONSTRAINT "group_member_achievements_earned_at_check" CHECK (("earned_at" IS NOT NULL)),
    CONSTRAINT "group_member_achievements_earned_at_timing_check" CHECK (("earned_at" >= "created_at"))
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "group_membership_questions_created_at_check" CHECK (("created_at" IS NOT NULL)),
    CONSTRAINT "group_membership_questions_question_check" CHECK ((("question" IS NOT NULL) AND ("length"(TRIM(BOTH FROM "question")) > 0))),
    CONSTRAINT "group_membership_questions_updated_at_check" CHECK (("updated_at" IS NOT NULL)),
    CONSTRAINT "group_membership_questions_updated_at_timing_check" CHECK (("updated_at" >= "created_at"))
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
    "is_default" boolean DEFAULT false,
    CONSTRAINT "group_roles_created_at_check" CHECK (("created_at" IS NOT NULL)),
    CONSTRAINT "group_roles_name_check" CHECK ((("name" IS NOT NULL) AND ("length"(TRIM(BOTH FROM "name")) > 0))),
    CONSTRAINT "group_roles_updated_at_check" CHECK (("updated_at" IS NOT NULL)),
    CONSTRAINT "group_roles_updated_at_timing_check" CHECK (("updated_at" >= "created_at"))
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
    "order_index" integer,
    CONSTRAINT "group_rules_created_at_check" CHECK (("created_at" IS NOT NULL)),
    CONSTRAINT "group_rules_order_index_check" CHECK ((("order_index" IS NULL) OR ("order_index" >= 0))),
    CONSTRAINT "group_rules_title_check" CHECK ((("title" IS NOT NULL) AND ("length"(TRIM(BOTH FROM "title")) > 0))),
    CONSTRAINT "group_rules_updated_at_check" CHECK (("updated_at" IS NOT NULL)),
    CONSTRAINT "group_rules_updated_at_timing_check" CHECK (("updated_at" >= "created_at"))
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "group_tags_created_at_check" CHECK (("created_at" IS NOT NULL)),
    CONSTRAINT "group_tags_name_check" CHECK ((("name" IS NOT NULL) AND ("length"(TRIM(BOTH FROM "name")) > 0))),
    CONSTRAINT "group_tags_updated_at_check" CHECK (("updated_at" IS NOT NULL)),
    CONSTRAINT "group_tags_updated_at_timing_check" CHECK (("updated_at" >= "created_at"))
);


ALTER TABLE "public"."group_tags" OWNER TO "postgres";

--
-- Name: group_types; Type: TABLE; Schema: public; Owner: postgres
--

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
-- Name: image_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."image_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."image_types" OWNER TO "postgres";

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
    "img_type_id" "uuid"
);


ALTER TABLE "public"."images" OWNER TO "postgres";

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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "invoices_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'paid'::"text", 'cancelled'::"text", 'refunded'::"text"])))
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payment_methods_payment_type_check" CHECK (("payment_type" = ANY (ARRAY['credit_card'::"text", 'paypal'::"text", 'bank_transfer'::"text", 'crypto'::"text", 'apple_pay'::"text", 'google_pay'::"text"])))
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payment_transactions_payment_provider_check" CHECK (("payment_provider" = ANY (ARRAY['stripe'::"text", 'paypal'::"text", 'square'::"text", 'braintree'::"text", 'manual'::"text"]))),
    CONSTRAINT "payment_transactions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text", 'refunded'::"text", 'disputed'::"text"]))),
    CONSTRAINT "payment_transactions_transaction_type_check" CHECK (("transaction_type" = ANY (ARRAY['purchase'::"text", 'refund'::"text", 'partial_refund'::"text", 'chargeback'::"text"])))
);


ALTER TABLE "public"."payment_transactions" OWNER TO "postgres";

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
-- Name: COLUMN "publishers"."created_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."publishers"."created_at" IS 'Timestamp when the publisher was created';


--
-- Name: COLUMN "publishers"."updated_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."publishers"."updated_at" IS 'Timestamp when the publisher was last updated';


--
-- Name: personalized_recommendations_with_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."personalized_recommendations_with_details" WITH ("security_invoker"='true') AS
 SELECT "pr"."id",
    "pr"."user_id",
    "pr"."book_id",
    "pr"."score",
    "pr"."created_at",
    "b"."title",
    "b"."synopsis",
    "b"."cover_image_id",
    "b"."pages",
    "b"."publication_date",
    "b"."isbn13",
    "b"."review_count",
    "b"."average_rating",
    "string_agg"(DISTINCT "a"."name", ', '::"text") AS "authors",
    "string_agg"(DISTINCT ("p"."name")::"text", ', '::"text") AS "publishers"
   FROM (((((("public"."personalized_recommendations" "pr"
     JOIN "public"."book_id_mapping" "bim" ON (("bim"."old_id" = "pr"."book_id")))
     JOIN "public"."books" "b" ON (("b"."id" = "bim"."new_id")))
     LEFT JOIN "public"."book_authors" "ba" ON (("ba"."book_id" = "b"."id")))
     LEFT JOIN "public"."authors" "a" ON (("a"."id" = "ba"."author_id")))
     LEFT JOIN "public"."book_publishers" "bp" ON (("bp"."book_id" = "b"."id")))
     LEFT JOIN "public"."publishers" "p" ON (("p"."id" = "bp"."publisher_id")))
  GROUP BY "pr"."id", "pr"."user_id", "pr"."book_id", "pr"."score", "pr"."created_at", "b"."title", "b"."synopsis", "b"."cover_image_id", "b"."pages", "b"."publication_date", "b"."isbn13", "b"."review_count", "b"."average_rating";


ALTER TABLE "public"."personalized_recommendations_with_details" OWNER TO "postgres";

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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "photo_album_entity_type_check" CHECK ((("entity_type")::"text" = ANY ((ARRAY['author'::character varying, 'publisher'::character varying, 'book'::character varying])::"text"[])))
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


ALTER TABLE "public"."photo_albums" OWNER TO "postgres";

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


ALTER TABLE "public"."prices" OWNER TO "postgres";

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE "public"."profiles" OWNER TO "postgres";

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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "promo_codes_discount_type_check" CHECK (("discount_type" = ANY (ARRAY['percentage'::"text", 'fixed_amount'::"text"])))
);


ALTER TABLE "public"."promo_codes" OWNER TO "postgres";

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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reading_goals_goal_type_check" CHECK (("goal_type" = ANY (ARRAY['books'::"text", 'pages'::"text", 'minutes'::"text", 'streak'::"text"]))),
    CONSTRAINT "valid_goal" CHECK ((("target_value" > 0) AND ("end_date" >= "start_date")))
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
    CONSTRAINT "reading_progress_progress_percentage_check" CHECK ((("progress_percentage" >= 0) AND ("progress_percentage" <= 100))),
    CONSTRAINT "reading_progress_status_check" CHECK (("status" = ANY (ARRAY['want_to_read'::"text", 'currently_reading'::"text", 'read'::"text"])))
);


ALTER TABLE "public"."reading_progress" OWNER TO "postgres";

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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_streak" CHECK ((("days" > 0) AND ("end_date" >= "start_date")))
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reviews_created_at_check" CHECK (("created_at" IS NOT NULL)),
    CONSTRAINT "reviews_new_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "reviews_text_content_check" CHECK ((("review_text" IS NULL) OR ("length"(TRIM(BOTH FROM "review_text")) > 0))),
    CONSTRAINT "reviews_text_length_check" CHECK ((("review_text" IS NULL) OR ("length"("review_text") <= 10000))),
    CONSTRAINT "reviews_updated_at_check" CHECK (("updated_at" IS NOT NULL)),
    CONSTRAINT "reviews_updated_at_timing_check" CHECK (("updated_at" >= "created_at"))
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "session_registrations_registration_status_check" CHECK (("registration_status" = ANY (ARRAY['registered'::"text", 'waitlisted'::"text", 'cancelled'::"text", 'attended'::"text", 'no_show'::"text"])))
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
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "similar_books_book_ids_not_null" CHECK ((("book_id" IS NOT NULL) AND ("similar_book_id" IS NOT NULL))),
    CONSTRAINT "similar_books_created_at_check" CHECK (("created_at" IS NOT NULL)),
    CONSTRAINT "similar_books_no_self_reference" CHECK (("book_id" <> "similar_book_id")),
    CONSTRAINT "similar_books_similarity_score_check" CHECK ((("similarity_score" IS NULL) OR (("similarity_score" >= (0)::numeric) AND ("similarity_score" <= (1)::numeric))))
);


ALTER TABLE "public"."similar_books" OWNER TO "postgres";

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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "survey_questions_question_type_check" CHECK (("question_type" = ANY (ARRAY['rating'::"text", 'text'::"text", 'multiple_choice'::"text", 'checkbox'::"text"])))
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ticket_types_visibility_check" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'private'::"text", 'hidden'::"text", 'code_required'::"text"])))
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tickets_status_check" CHECK (("status" = ANY (ARRAY['reserved'::"text", 'purchased'::"text", 'refunded'::"text", 'cancelled'::"text", 'checked_in'::"text"])))
);


ALTER TABLE "public"."tickets" OWNER TO "postgres";

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


ALTER TABLE "public"."user_book_interactions" OWNER TO "postgres";

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
-- Name: album_analytics album_analytics_album_id_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."album_analytics"
    ADD CONSTRAINT "album_analytics_album_id_date_key" UNIQUE ("album_id", "date");


--
-- Name: album_analytics album_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."album_analytics"
    ADD CONSTRAINT "album_analytics_pkey" PRIMARY KEY ("id");


--
-- Name: album_images album_images_album_id_image_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."album_images"
    ADD CONSTRAINT "album_images_album_id_image_id_key" UNIQUE ("album_id", "image_id");


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
-- Name: authors authors_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."authors"
    ADD CONSTRAINT "authors_new_pkey" PRIMARY KEY ("id");


--
-- Name: binding_types binding_types_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."binding_types"
    ADD CONSTRAINT "binding_types_new_pkey" PRIMARY KEY ("id");


--
-- Name: blocks blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_pkey" PRIMARY KEY ("id");


--
-- Name: book_authors book_authors_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_authors"
    ADD CONSTRAINT "book_authors_new_pkey" PRIMARY KEY ("id");


--
-- Name: book_club_books book_club_books_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_club_books"
    ADD CONSTRAINT "book_club_books_new_pkey" PRIMARY KEY ("id");


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
-- Name: book_club_members book_club_members_book_club_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_club_members"
    ADD CONSTRAINT "book_club_members_book_club_id_user_id_key" UNIQUE ("book_club_id", "user_id");


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
-- Name: discussions book_discussions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."discussions"
    ADD CONSTRAINT "book_discussions_pkey" PRIMARY KEY ("id");


--
-- Name: book_genre_mappings book_genre_mappings_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_genre_mappings"
    ADD CONSTRAINT "book_genre_mappings_new_pkey" PRIMARY KEY ("id");


--
-- Name: book_genres book_genres_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_genres"
    ADD CONSTRAINT "book_genres_new_pkey" PRIMARY KEY ("id");


--
-- Name: book_id_mapping book_id_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_id_mapping"
    ADD CONSTRAINT "book_id_mapping_pkey" PRIMARY KEY ("old_id", "new_id");


--
-- Name: book_publishers book_publishers_new_book_id_publisher_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_publishers"
    ADD CONSTRAINT "book_publishers_new_book_id_publisher_id_key" UNIQUE ("book_id", "publisher_id");


--
-- Name: book_publishers book_publishers_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_publishers"
    ADD CONSTRAINT "book_publishers_new_pkey" PRIMARY KEY ("id");


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
-- Name: book_similarity_scores book_similarity_scores_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_similarity_scores"
    ADD CONSTRAINT "book_similarity_scores_new_pkey" PRIMARY KEY ("id");


--
-- Name: book_subjects book_subjects_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_subjects"
    ADD CONSTRAINT "book_subjects_new_pkey" PRIMARY KEY ("id");


--
-- Name: book_tag_mappings book_tag_mappings_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_tag_mappings"
    ADD CONSTRAINT "book_tag_mappings_new_pkey" PRIMARY KEY ("id");


--
-- Name: book_tags book_tags_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_tags"
    ADD CONSTRAINT "book_tags_new_pkey" PRIMARY KEY ("id");


--
-- Name: book_views book_views_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_views"
    ADD CONSTRAINT "book_views_new_pkey" PRIMARY KEY ("id");


--
-- Name: books books_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_new_pkey" PRIMARY KEY ("id");


--
-- Name: carousel_images carousel_images_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."carousel_images"
    ADD CONSTRAINT "carousel_images_new_pkey" PRIMARY KEY ("id");


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");


--
-- Name: contact_info contact_info_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."contact_info"
    ADD CONSTRAINT "contact_info_new_pkey" PRIMARY KEY ("id");


--
-- Name: countries countries_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."countries"
    ADD CONSTRAINT "countries_new_pkey" PRIMARY KEY ("id");


--
-- Name: discussion_comments discussion_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."discussion_comments"
    ADD CONSTRAINT "discussion_comments_pkey" PRIMARY KEY ("id");


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
-- Name: event_registrations event_registrations_ticket_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_ticket_id_key" UNIQUE ("ticket_id");


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
-- Name: events events_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_slug_key" UNIQUE ("slug");


--
-- Name: feed_entries feed_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."feed_entries"
    ADD CONSTRAINT "feed_entries_pkey" PRIMARY KEY ("id");


--
-- Name: feed_entry_tags feed_entry_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."feed_entry_tags"
    ADD CONSTRAINT "feed_entry_tags_pkey" PRIMARY KEY ("feed_entry_id", "tag_id");


--
-- Name: follow_target_types follow_target_types_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."follow_target_types"
    ADD CONSTRAINT "follow_target_types_new_pkey" PRIMARY KEY ("id");


--
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_pkey" PRIMARY KEY ("id");


--
-- Name: format_types format_types_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."format_types"
    ADD CONSTRAINT "format_types_new_pkey" PRIMARY KEY ("id");


--
-- Name: friends friends_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."friends"
    ADD CONSTRAINT "friends_pkey" PRIMARY KEY ("id");


--
-- Name: group_achievements group_achievements_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_achievements"
    ADD CONSTRAINT "group_achievements_new_pkey" PRIMARY KEY ("id");


--
-- Name: group_analytics group_analytics_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_analytics"
    ADD CONSTRAINT "group_analytics_new_pkey" PRIMARY KEY ("id");


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
-- Name: group_book_reviews group_book_reviews_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_reviews"
    ADD CONSTRAINT "group_book_reviews_new_pkey" PRIMARY KEY ("id");


--
-- Name: group_book_reviews group_book_reviews_new_unique_user_book_group; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_reviews"
    ADD CONSTRAINT "group_book_reviews_new_unique_user_book_group" UNIQUE ("group_id", "book_id", "user_id");


--
-- Name: group_book_swaps group_book_swaps_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_swaps"
    ADD CONSTRAINT "group_book_swaps_new_pkey" PRIMARY KEY ("id");


--
-- Name: group_book_swaps group_book_swaps_unique_book_offered; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_swaps"
    ADD CONSTRAINT "group_book_swaps_unique_book_offered" UNIQUE ("group_id", "book_id", "offered_by");


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
-- Name: group_discussion_categories group_discussion_categories_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_discussion_categories"
    ADD CONSTRAINT "group_discussion_categories_new_pkey" PRIMARY KEY ("id");


--
-- Name: group_discussion_categories group_discussion_categories_unique_name_per_group; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_discussion_categories"
    ADD CONSTRAINT "group_discussion_categories_unique_name_per_group" UNIQUE ("group_id", "name");


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
-- Name: group_member_achievements group_member_achievements_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_member_achievements"
    ADD CONSTRAINT "group_member_achievements_new_pkey" PRIMARY KEY ("id");


--
-- Name: group_member_achievements group_member_achievements_unique_user_achievement; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_member_achievements"
    ADD CONSTRAINT "group_member_achievements_unique_user_achievement" UNIQUE ("group_id", "user_id", "achievement_id");


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
-- Name: group_membership_questions group_membership_questions_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_membership_questions"
    ADD CONSTRAINT "group_membership_questions_new_pkey" PRIMARY KEY ("id");


--
-- Name: group_membership_questions group_membership_questions_unique_group_question; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_membership_questions"
    ADD CONSTRAINT "group_membership_questions_unique_group_question" UNIQUE ("group_id", "question");


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
-- Name: group_roles group_roles_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_roles"
    ADD CONSTRAINT "group_roles_new_pkey" PRIMARY KEY ("id");


--
-- Name: group_roles group_roles_unique_group_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_roles"
    ADD CONSTRAINT "group_roles_unique_group_name" UNIQUE ("group_id", "name");


--
-- Name: group_rules group_rules_pkey1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_rules"
    ADD CONSTRAINT "group_rules_pkey1" PRIMARY KEY ("id");


--
-- Name: group_rules group_rules_unique_group_title; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_rules"
    ADD CONSTRAINT "group_rules_unique_group_title" UNIQUE ("group_id", "title");


--
-- Name: group_shared_documents group_shared_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_shared_documents"
    ADD CONSTRAINT "group_shared_documents_pkey" PRIMARY KEY ("id");


--
-- Name: group_tags group_tags_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_tags"
    ADD CONSTRAINT "group_tags_new_pkey" PRIMARY KEY ("id");


--
-- Name: group_tags group_tags_unique_group_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_tags"
    ADD CONSTRAINT "group_tags_unique_group_name" UNIQUE ("group_id", "name");


--
-- Name: group_types group_types_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_types"
    ADD CONSTRAINT "group_types_new_pkey" PRIMARY KEY ("id");


--
-- Name: group_types group_types_unique_display_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_types"
    ADD CONSTRAINT "group_types_unique_display_name" UNIQUE ("display_name");


--
-- Name: group_types group_types_unique_slug; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_types"
    ADD CONSTRAINT "group_types_unique_slug" UNIQUE ("slug");


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
-- Name: id_mappings id_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."id_mappings"
    ADD CONSTRAINT "id_mappings_pkey" PRIMARY KEY ("table_name", "old_id");


--
-- Name: image_tag_mappings image_tag_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."image_tag_mappings"
    ADD CONSTRAINT "image_tag_mappings_pkey" PRIMARY KEY ("image_id", "tag_id");


--
-- Name: image_tags image_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."image_tags"
    ADD CONSTRAINT "image_tags_pkey" PRIMARY KEY ("id");


--
-- Name: image_tags image_tags_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."image_tags"
    ADD CONSTRAINT "image_tags_slug_key" UNIQUE ("slug");


--
-- Name: image_types image_types_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."image_types"
    ADD CONSTRAINT "image_types_new_pkey" PRIMARY KEY ("id");


--
-- Name: images images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_pkey" PRIMARY KEY ("id");


--
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_invoice_number_key" UNIQUE ("invoice_number");


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
-- Name: list_followers list_followers_user_id_list_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."list_followers"
    ADD CONSTRAINT "list_followers_user_id_list_id_key" UNIQUE ("user_id", "list_id");


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
-- Name: personalized_recommendations personalized_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."personalized_recommendations"
    ADD CONSTRAINT "personalized_recommendations_pkey" PRIMARY KEY ("id");


--
-- Name: personalized_recommendations personalized_recommendations_user_id_book_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."personalized_recommendations"
    ADD CONSTRAINT "personalized_recommendations_user_id_book_id_key" UNIQUE ("user_id", "book_id");


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
-- Name: prices prices_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."prices"
    ADD CONSTRAINT "prices_new_pkey" PRIMARY KEY ("id");


--
-- Name: profiles profiles_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_new_pkey" PRIMARY KEY ("id");


--
-- Name: profiles profiles_unique_user_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_unique_user_id" UNIQUE ("user_id");


--
-- Name: promo_codes promo_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id");


--
-- Name: publishers publishers_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."publishers"
    ADD CONSTRAINT "publishers_new_pkey" PRIMARY KEY ("id");


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
-- Name: reading_challenges reading_challenges_user_id_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_challenges"
    ADD CONSTRAINT "reading_challenges_user_id_year_key" UNIQUE ("user_id", "year");


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
-- Name: reading_sessions reading_sessions_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_sessions"
    ADD CONSTRAINT "reading_sessions_new_pkey" PRIMARY KEY ("id");


--
-- Name: reading_stats_daily reading_stats_daily_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_stats_daily"
    ADD CONSTRAINT "reading_stats_daily_pkey" PRIMARY KEY ("id");


--
-- Name: reading_stats_daily reading_stats_daily_user_id_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_stats_daily"
    ADD CONSTRAINT "reading_stats_daily_user_id_date_key" UNIQUE ("user_id", "date");


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
-- Name: review_likes review_likes_user_id_review_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."review_likes"
    ADD CONSTRAINT "review_likes_user_id_review_id_key" UNIQUE ("user_id", "review_id");


--
-- Name: reviews reviews_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_new_pkey" PRIMARY KEY ("id");


--
-- Name: reviews reviews_unique_user_book; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_unique_user_book" UNIQUE ("user_id", "book_id");


--
-- Name: roles roles_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_new_pkey" PRIMARY KEY ("id");


--
-- Name: series_events series_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."series_events"
    ADD CONSTRAINT "series_events_pkey" PRIMARY KEY ("series_id", "event_id");


--
-- Name: session_registrations session_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."session_registrations"
    ADD CONSTRAINT "session_registrations_pkey" PRIMARY KEY ("id");


--
-- Name: similar_books similar_books_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."similar_books"
    ADD CONSTRAINT "similar_books_new_pkey" PRIMARY KEY ("id");


--
-- Name: similar_books similar_books_unique_relationship; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."similar_books"
    ADD CONSTRAINT "similar_books_unique_relationship" UNIQUE ("book_id", "similar_book_id");


--
-- Name: statuses statuses_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."statuses"
    ADD CONSTRAINT "statuses_new_pkey" PRIMARY KEY ("id");


--
-- Name: subjects subjects_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."subjects"
    ADD CONSTRAINT "subjects_new_pkey" PRIMARY KEY ("id");


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
-- Name: sync_state sync_state_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."sync_state"
    ADD CONSTRAINT "sync_state_type_key" UNIQUE ("type");


--
-- Name: tags tags_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_new_pkey" PRIMARY KEY ("id");


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
-- Name: tickets tickets_ticket_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_ticket_number_key" UNIQUE ("ticket_number");


--
-- Name: user_book_interactions user_book_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_book_interactions"
    ADD CONSTRAINT "user_book_interactions_pkey" PRIMARY KEY ("id");


--
-- Name: user_reading_preferences user_reading_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_reading_preferences"
    ADD CONSTRAINT "user_reading_preferences_pkey" PRIMARY KEY ("id");


--
-- Name: user_reading_preferences user_reading_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_reading_preferences"
    ADD CONSTRAINT "user_reading_preferences_user_id_key" UNIQUE ("user_id");


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");


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
-- Name: books_isbn10_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "books_isbn10_unique" ON "public"."books" USING "btree" ("isbn10") WHERE ("isbn10" IS NOT NULL);


--
-- Name: books_isbn13_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "books_isbn13_unique" ON "public"."books" USING "btree" ("isbn13") WHERE ("isbn13" IS NOT NULL);


--
-- Name: idx_activities_author_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_activities_author_id" ON "public"."activities" USING "btree" ("author_id");


--
-- Name: idx_activities_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_activities_event_id" ON "public"."activities" USING "btree" ("event_id");


--
-- Name: idx_activities_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_activities_group_id" ON "public"."activities" USING "btree" ("group_id");


--
-- Name: idx_activities_user_profile_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_activities_user_profile_id" ON "public"."activities" USING "btree" ("user_profile_id");


--
-- Name: idx_album_analytics_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_album_analytics_date" ON "public"."album_analytics" USING "btree" ("album_id", "date");


--
-- Name: idx_album_images_cover; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_album_images_cover" ON "public"."album_images" USING "btree" ("album_id", "is_cover") WHERE ("is_cover" = true);


--
-- Name: idx_album_images_featured; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_album_images_featured" ON "public"."album_images" USING "btree" ("album_id", "is_featured") WHERE ("is_featured" = true);


--
-- Name: idx_album_images_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_album_images_order" ON "public"."album_images" USING "btree" ("album_id", "display_order");


--
-- Name: idx_album_shares_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_album_shares_expires" ON "public"."album_shares" USING "btree" ("expires_at") WHERE ("expires_at" IS NOT NULL);


--
-- Name: idx_album_shares_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_album_shares_token" ON "public"."album_shares" USING "btree" ("access_token");


--
-- Name: idx_authors_featured; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_authors_featured" ON "public"."authors" USING "btree" ("featured");


--
-- Name: idx_authors_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_authors_name" ON "public"."authors" USING "btree" ("name");


--
-- Name: idx_book_discussions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_discussions_user_id" ON "public"."discussions" USING "btree" ("user_id");


--
-- Name: idx_book_genres_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_genres_name" ON "public"."book_genres" USING "btree" ("name");


--
-- Name: idx_book_reviews_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_reviews_group_id" ON "public"."book_reviews" USING "btree" ("group_id");


--
-- Name: idx_book_reviews_visibility; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_reviews_visibility" ON "public"."book_reviews" USING "btree" ("visibility");


--
-- Name: idx_book_tags_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_book_tags_name" ON "public"."book_tags" USING "btree" ("name");


--
-- Name: idx_books_author; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_author" ON "public"."books" USING "btree" ("author");


--
-- Name: idx_books_author_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_author_date" ON "public"."books" USING "btree" ("author_id", "publication_date");


--
-- Name: idx_books_author_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_author_id" ON "public"."books" USING "btree" ("author_id");


--
-- Name: idx_books_author_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_author_trgm" ON "public"."books" USING "gin" ("author" "public"."gin_trgm_ops");


--
-- Name: idx_books_average_rating; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_average_rating" ON "public"."books" USING "btree" ("average_rating" DESC);


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

CREATE INDEX "idx_books_created_at" ON "public"."books" USING "btree" ("created_at");


--
-- Name: idx_books_featured; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_featured" ON "public"."books" USING "btree" ("featured") WHERE ("featured" = true);


--
-- Name: idx_books_format_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_format_type_id" ON "public"."books" USING "btree" ("format_type_id");


--
-- Name: idx_books_isbn10; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_isbn10" ON "public"."books" USING "btree" ("isbn10") WHERE ("isbn10" IS NOT NULL);


--
-- Name: idx_books_isbn13; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_isbn13" ON "public"."books" USING "btree" ("isbn13") WHERE ("isbn13" IS NOT NULL);


--
-- Name: idx_books_overview_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_overview_trgm" ON "public"."books" USING "gin" ("overview" "public"."gin_trgm_ops");


--
-- Name: idx_books_publication_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_publication_date" ON "public"."books" USING "btree" ("publication_date");


--
-- Name: idx_books_publisher_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_publisher_date" ON "public"."books" USING "btree" ("publisher_id", "publication_date");


--
-- Name: idx_books_publisher_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_publisher_id" ON "public"."books" USING "btree" ("publisher_id");


--
-- Name: idx_books_rating_reviews; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_rating_reviews" ON "public"."books" USING "btree" ("average_rating" DESC, "review_count" DESC);


--
-- Name: idx_books_review_count; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_review_count" ON "public"."books" USING "btree" ("review_count" DESC);


--
-- Name: idx_books_synopsis_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_synopsis_trgm" ON "public"."books" USING "gin" ("synopsis" "public"."gin_trgm_ops");


--
-- Name: idx_books_title; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_title" ON "public"."books" USING "btree" ("title");


--
-- Name: idx_books_title_author; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_title_author" ON "public"."books" USING "btree" ("title", "author");


--
-- Name: idx_books_title_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_books_title_trgm" ON "public"."books" USING "gin" ("title" "public"."gin_trgm_ops");


--
-- Name: idx_contact_info_new_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_contact_info_new_entity" ON "public"."contact_info" USING "btree" ("entity_type", "entity_id");


--
-- Name: idx_countries_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_countries_code" ON "public"."countries" USING "btree" ("code");


--
-- Name: idx_countries_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_countries_name" ON "public"."countries" USING "btree" ("name");


--
-- Name: idx_discussion_comments_discussion_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_discussion_comments_discussion_id" ON "public"."discussion_comments" USING "btree" ("discussion_id");


--
-- Name: idx_discussion_comments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_discussion_comments_user_id" ON "public"."discussion_comments" USING "btree" ("user_id");


--
-- Name: idx_event_analytics_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_analytics_date" ON "public"."event_analytics" USING "btree" ("date");


--
-- Name: idx_event_analytics_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_analytics_event_id" ON "public"."event_analytics" USING "btree" ("event_id");


--
-- Name: idx_event_approvals_approval_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_approvals_approval_status" ON "public"."event_approvals" USING "btree" ("approval_status");


--
-- Name: idx_event_approvals_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_approvals_event_id" ON "public"."event_approvals" USING "btree" ("event_id");


--
-- Name: idx_event_books_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_books_event_id" ON "public"."event_books" USING "btree" ("event_id");


--
-- Name: idx_event_calendar_exports_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_calendar_exports_event_id" ON "public"."event_calendar_exports" USING "btree" ("event_id");


--
-- Name: idx_event_calendar_exports_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_calendar_exports_user_id" ON "public"."event_calendar_exports" USING "btree" ("user_id");


--
-- Name: idx_event_categories_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_categories_parent_id" ON "public"."event_categories" USING "btree" ("parent_id");


--
-- Name: idx_event_chat_messages_chat_room_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_chat_messages_chat_room_id" ON "public"."event_chat_messages" USING "btree" ("chat_room_id");


--
-- Name: idx_event_chat_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_chat_messages_created_at" ON "public"."event_chat_messages" USING "btree" ("created_at");


--
-- Name: idx_event_chat_messages_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_chat_messages_user_id" ON "public"."event_chat_messages" USING "btree" ("user_id");


--
-- Name: idx_event_chat_rooms_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_chat_rooms_event_id" ON "public"."event_chat_rooms" USING "btree" ("event_id");


--
-- Name: idx_event_chat_rooms_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_chat_rooms_is_active" ON "public"."event_chat_rooms" USING "btree" ("is_active");


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
-- Name: idx_event_livestreams_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_livestreams_is_active" ON "public"."event_livestreams" USING "btree" ("is_active");


--
-- Name: idx_event_locations_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_locations_event_id" ON "public"."event_locations" USING "btree" ("event_id");


--
-- Name: idx_event_media_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_media_event_id" ON "public"."event_media" USING "btree" ("event_id");


--
-- Name: idx_event_permission_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_permission_requests_status" ON "public"."event_permission_requests" USING "btree" ("status");


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
-- Name: idx_event_registrations_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_registrations_status" ON "public"."event_registrations" USING "btree" ("registration_status");


--
-- Name: idx_event_registrations_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_registrations_user_id" ON "public"."event_registrations" USING "btree" ("user_id");


--
-- Name: idx_event_reminders_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_reminders_event_id" ON "public"."event_reminders" USING "btree" ("event_id");


--
-- Name: idx_event_reminders_reminder_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_reminders_reminder_time" ON "public"."event_reminders" USING "btree" ("reminder_time");


--
-- Name: idx_event_reminders_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_reminders_user_id" ON "public"."event_reminders" USING "btree" ("user_id");


--
-- Name: idx_event_sessions_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_sessions_event_id" ON "public"."event_sessions" USING "btree" ("event_id");


--
-- Name: idx_event_sessions_location_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_sessions_location_id" ON "public"."event_sessions" USING "btree" ("location_id");


--
-- Name: idx_event_shares_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_shares_event_id" ON "public"."event_shares" USING "btree" ("event_id");


--
-- Name: idx_event_shares_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_shares_user_id" ON "public"."event_shares" USING "btree" ("user_id");


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
-- Name: idx_event_sponsors_is_featured; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_sponsors_is_featured" ON "public"."event_sponsors" USING "btree" ("is_featured");


--
-- Name: idx_event_sponsors_sponsor_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_sponsors_sponsor_level" ON "public"."event_sponsors" USING "btree" ("sponsor_level");


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
-- Name: idx_event_surveys_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_surveys_is_active" ON "public"."event_surveys" USING "btree" ("is_active");


--
-- Name: idx_event_views_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_views_event_id" ON "public"."event_views" USING "btree" ("event_id");


--
-- Name: idx_event_views_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_views_user_id" ON "public"."event_views" USING "btree" ("user_id");


--
-- Name: idx_event_views_viewed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_views_viewed_at" ON "public"."event_views" USING "btree" ("viewed_at");


--
-- Name: idx_event_waitlists_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_waitlists_event_id" ON "public"."event_waitlists" USING "btree" ("event_id");


--
-- Name: idx_event_waitlists_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_waitlists_status" ON "public"."event_waitlists" USING "btree" ("status");


--
-- Name: idx_event_waitlists_ticket_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_waitlists_ticket_type_id" ON "public"."event_waitlists" USING "btree" ("ticket_type_id");


--
-- Name: idx_event_waitlists_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_event_waitlists_user_id" ON "public"."event_waitlists" USING "btree" ("user_id");


--
-- Name: idx_events_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_events_category_id" ON "public"."events" USING "btree" ("event_category_id");


--
-- Name: idx_events_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_events_created_by" ON "public"."events" USING "btree" ("created_by");


--
-- Name: idx_events_featured; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_events_featured" ON "public"."events" USING "btree" ("featured") WHERE ("featured" = true);


--
-- Name: idx_events_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_events_group_id" ON "public"."events" USING "btree" ("group_id");


--
-- Name: idx_events_parent_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_events_parent_event_id" ON "public"."events" USING "btree" ("parent_event_id");


--
-- Name: idx_events_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_events_slug" ON "public"."events" USING "btree" ("slug");


--
-- Name: idx_events_start_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_events_start_date" ON "public"."events" USING "btree" ("start_date");


--
-- Name: idx_events_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_events_status" ON "public"."events" USING "btree" ("status");


--
-- Name: idx_events_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_events_type_id" ON "public"."events" USING "btree" ("type_id");


--
-- Name: idx_events_visibility; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_events_visibility" ON "public"."events" USING "btree" ("visibility");


--
-- Name: idx_feed_entries_content_author_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_feed_entries_content_author_id" ON "public"."feed_entries" USING "btree" ((("content" ->> 'author_id'::"text")));


--
-- Name: idx_feed_entries_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_feed_entries_created_at" ON "public"."feed_entries" USING "btree" ("created_at");


--
-- Name: idx_feed_entries_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_feed_entries_group_id" ON "public"."feed_entries" USING "btree" ("group_id");


--
-- Name: idx_feed_entries_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_feed_entries_type" ON "public"."feed_entries" USING "btree" ("type");


--
-- Name: idx_feed_entries_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_feed_entries_user_id" ON "public"."feed_entries" USING "btree" ("user_id");


--
-- Name: idx_feed_entries_visibility; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_feed_entries_visibility" ON "public"."feed_entries" USING "btree" ("visibility");


--
-- Name: idx_follow_target_types_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_follow_target_types_name" ON "public"."follow_target_types" USING "btree" ("name");


--
-- Name: idx_follows_follower_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_follows_follower_id" ON "public"."follows" USING "btree" ("follower_id");


--
-- Name: idx_follows_following_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_follows_following_id" ON "public"."follows" USING "btree" ("following_id");


--
-- Name: idx_friends_friend_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_friends_friend_id" ON "public"."friends" USING "btree" ("friend_id");


--
-- Name: idx_friends_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_friends_status" ON "public"."friends" USING "btree" ("status");


--
-- Name: idx_friends_unique_pair; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "idx_friends_unique_pair" ON "public"."friends" USING "btree" (LEAST("user_id", "friend_id"), GREATEST("user_id", "friend_id"));


--
-- Name: idx_friends_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_friends_user_id" ON "public"."friends" USING "btree" ("user_id");


--
-- Name: idx_group_achievements_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_achievements_group_id" ON "public"."group_achievements" USING "btree" ("group_id");


--
-- Name: idx_group_achievements_group_id_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_achievements_group_id_type" ON "public"."group_achievements" USING "btree" ("group_id", "type");


--
-- Name: idx_group_analytics_activity_count; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_analytics_activity_count" ON "public"."group_analytics" USING "btree" ("group_id", "recorded_at") WHERE ("metric_name" = 'activity_count'::"text");


--
-- Name: idx_group_analytics_group_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_analytics_group_date" ON "public"."group_analytics" USING "btree" ("group_id", "recorded_at");


--
-- Name: idx_group_analytics_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_analytics_group_id" ON "public"."group_analytics" USING "btree" ("group_id");


--
-- Name: idx_group_analytics_group_metric; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_analytics_group_metric" ON "public"."group_analytics" USING "btree" ("group_id", "metric_name");


--
-- Name: idx_group_analytics_member_count; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_analytics_member_count" ON "public"."group_analytics" USING "btree" ("group_id", "recorded_at") WHERE ("metric_name" = 'member_count'::"text");


--
-- Name: idx_group_analytics_metric_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_analytics_metric_name" ON "public"."group_analytics" USING "btree" ("metric_name");


--
-- Name: idx_group_analytics_post_count; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_analytics_post_count" ON "public"."group_analytics" USING "btree" ("group_id", "recorded_at") WHERE ("metric_name" = 'post_count'::"text");


--
-- Name: idx_group_analytics_recorded_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_analytics_recorded_at" ON "public"."group_analytics" USING "btree" ("recorded_at");


--
-- Name: idx_group_announcements_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_announcements_group_id" ON "public"."group_announcements" USING "btree" ("group_id");


--
-- Name: idx_group_audit_log_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_audit_log_group_id" ON "public"."group_audit_log" USING "btree" ("group_id");


--
-- Name: idx_group_book_lists_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_lists_group_id" ON "public"."group_book_lists" USING "btree" ("group_id");


--
-- Name: idx_group_book_reviews_new_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_reviews_new_book_id" ON "public"."group_book_reviews" USING "btree" ("book_id");


--
-- Name: idx_group_book_reviews_new_book_rating; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_reviews_new_book_rating" ON "public"."group_book_reviews" USING "btree" ("book_id", "rating");


--
-- Name: idx_group_book_reviews_new_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_reviews_new_created_at" ON "public"."group_book_reviews" USING "btree" ("created_at");


--
-- Name: idx_group_book_reviews_new_group_book; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_reviews_new_group_book" ON "public"."group_book_reviews" USING "btree" ("group_id", "book_id");


--
-- Name: idx_group_book_reviews_new_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_reviews_new_group_id" ON "public"."group_book_reviews" USING "btree" ("group_id");


--
-- Name: idx_group_book_reviews_new_group_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_reviews_new_group_user" ON "public"."group_book_reviews" USING "btree" ("group_id", "user_id");


--
-- Name: idx_group_book_reviews_new_high_ratings; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_reviews_new_high_ratings" ON "public"."group_book_reviews" USING "btree" ("group_id", "book_id", "rating") WHERE ("rating" >= 4);


--
-- Name: idx_group_book_reviews_new_low_ratings; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_reviews_new_low_ratings" ON "public"."group_book_reviews" USING "btree" ("group_id", "book_id", "rating") WHERE ("rating" <= 2);


--
-- Name: idx_group_book_reviews_new_rating; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_reviews_new_rating" ON "public"."group_book_reviews" USING "btree" ("rating");


--
-- Name: idx_group_book_reviews_new_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_reviews_new_user_id" ON "public"."group_book_reviews" USING "btree" ("user_id");


--
-- Name: idx_group_book_reviews_new_with_reviews; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_reviews_new_with_reviews" ON "public"."group_book_reviews" USING "btree" ("group_id", "book_id", "created_at") WHERE ("review" IS NOT NULL);


--
-- Name: idx_group_book_swaps_accepted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_swaps_accepted_at" ON "public"."group_book_swaps" USING "btree" ("accepted_at");


--
-- Name: idx_group_book_swaps_accepted_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_swaps_accepted_by" ON "public"."group_book_swaps" USING "btree" ("accepted_by");


--
-- Name: idx_group_book_swaps_accepted_pending; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_swaps_accepted_pending" ON "public"."group_book_swaps" USING "btree" ("group_id", "accepted_at") WHERE ("status" = 'accepted'::"text");


--
-- Name: idx_group_book_swaps_available; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_swaps_available" ON "public"."group_book_swaps" USING "btree" ("group_id", "created_at") WHERE ("status" = 'available'::"text");


--
-- Name: idx_group_book_swaps_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_swaps_book_id" ON "public"."group_book_swaps" USING "btree" ("book_id");


--
-- Name: idx_group_book_swaps_cancelled_expired; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_swaps_cancelled_expired" ON "public"."group_book_swaps" USING "btree" ("group_id", "created_at") WHERE ("status" = ANY (ARRAY['cancelled'::"text", 'expired'::"text"]));


--
-- Name: idx_group_book_swaps_completed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_swaps_completed" ON "public"."group_book_swaps" USING "btree" ("group_id", "accepted_at") WHERE ("status" = 'completed'::"text");


--
-- Name: idx_group_book_swaps_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_swaps_created_at" ON "public"."group_book_swaps" USING "btree" ("created_at");


--
-- Name: idx_group_book_swaps_group_book; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_swaps_group_book" ON "public"."group_book_swaps" USING "btree" ("group_id", "book_id");


--
-- Name: idx_group_book_swaps_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_swaps_group_id" ON "public"."group_book_swaps" USING "btree" ("group_id");


--
-- Name: idx_group_book_swaps_group_offered; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_swaps_group_offered" ON "public"."group_book_swaps" USING "btree" ("group_id", "offered_by");


--
-- Name: idx_group_book_swaps_group_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_swaps_group_status" ON "public"."group_book_swaps" USING "btree" ("group_id", "status");


--
-- Name: idx_group_book_swaps_offered_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_swaps_offered_by" ON "public"."group_book_swaps" USING "btree" ("offered_by");


--
-- Name: idx_group_book_swaps_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_swaps_status" ON "public"."group_book_swaps" USING "btree" ("status");


--
-- Name: idx_group_book_wishlists_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_book_wishlists_group_id" ON "public"."group_book_wishlists" USING "btree" ("group_id");


--
-- Name: idx_group_chat_channels_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_chat_channels_group_id" ON "public"."group_chat_channels" USING "btree" ("group_id");


--
-- Name: idx_group_chat_messages_channel_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_chat_messages_channel_id" ON "public"."group_chat_messages" USING "btree" ("channel_id");


--
-- Name: idx_group_discussion_categories_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_discussion_categories_created_at" ON "public"."group_discussion_categories" USING "btree" ("created_at");


--
-- Name: idx_group_discussion_categories_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_discussion_categories_group_id" ON "public"."group_discussion_categories" USING "btree" ("group_id");


--
-- Name: idx_group_discussion_categories_group_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_discussion_categories_group_name" ON "public"."group_discussion_categories" USING "btree" ("group_id", "name");


--
-- Name: idx_group_discussion_categories_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_discussion_categories_name" ON "public"."group_discussion_categories" USING "btree" ("name");


--
-- Name: idx_group_discussion_categories_name_lower; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_discussion_categories_name_lower" ON "public"."group_discussion_categories" USING "btree" ("group_id", "lower"("name"));


--
-- Name: idx_group_discussion_categories_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_discussion_categories_updated_at" ON "public"."group_discussion_categories" USING "btree" ("updated_at");


--
-- Name: idx_group_discussion_categories_with_description; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_discussion_categories_with_description" ON "public"."group_discussion_categories" USING "btree" ("group_id", "name") WHERE ("description" IS NOT NULL);


--
-- Name: idx_group_event_feedback_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_event_feedback_event_id" ON "public"."group_event_feedback" USING "btree" ("event_id");


--
-- Name: idx_group_events_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_events_group_id" ON "public"."group_events" USING "btree" ("group_id");


--
-- Name: idx_group_member_achievements_achievement_analysis; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_member_achievements_achievement_analysis" ON "public"."group_member_achievements" USING "btree" ("achievement_id", "group_id", "earned_at");


--
-- Name: idx_group_member_achievements_achievement_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_member_achievements_achievement_id" ON "public"."group_member_achievements" USING "btree" ("achievement_id");


--
-- Name: idx_group_member_achievements_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_member_achievements_created_at" ON "public"."group_member_achievements" USING "btree" ("created_at");


--
-- Name: idx_group_member_achievements_earned_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_member_achievements_earned_at" ON "public"."group_member_achievements" USING "btree" ("earned_at");


--
-- Name: idx_group_member_achievements_group_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_member_achievements_group_user" ON "public"."group_member_achievements" USING "btree" ("group_id", "user_id");


--
-- Name: idx_group_member_achievements_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_member_achievements_user_id" ON "public"."group_member_achievements" USING "btree" ("user_id");


--
-- Name: idx_group_membership_questions_analysis; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_membership_questions_analysis" ON "public"."group_membership_questions" USING "btree" ("group_id", "is_required", "created_at");


--
-- Name: idx_group_membership_questions_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_membership_questions_created_at" ON "public"."group_membership_questions" USING "btree" ("created_at");


--
-- Name: idx_group_membership_questions_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_membership_questions_group_id" ON "public"."group_membership_questions" USING "btree" ("group_id");


--
-- Name: idx_group_membership_questions_is_required; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_membership_questions_is_required" ON "public"."group_membership_questions" USING "btree" ("is_required");


--
-- Name: idx_group_membership_questions_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_membership_questions_updated_at" ON "public"."group_membership_questions" USING "btree" ("updated_at");


--
-- Name: idx_group_reading_progress_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_reading_progress_group_id" ON "public"."group_reading_progress" USING "btree" ("group_id");


--
-- Name: idx_group_roles_analysis; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_roles_analysis" ON "public"."group_roles" USING "btree" ("group_id", "is_default", "created_at");


--
-- Name: idx_group_roles_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_roles_created_at" ON "public"."group_roles" USING "btree" ("created_at");


--
-- Name: idx_group_roles_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_roles_group_id" ON "public"."group_roles" USING "btree" ("group_id");


--
-- Name: idx_group_roles_is_default; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_roles_is_default" ON "public"."group_roles" USING "btree" ("is_default");


--
-- Name: idx_group_roles_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_roles_name" ON "public"."group_roles" USING "btree" ("name");


--
-- Name: idx_group_roles_permissions; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_roles_permissions" ON "public"."group_roles" USING "gin" ("permissions");


--
-- Name: idx_group_roles_unique_default; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "idx_group_roles_unique_default" ON "public"."group_roles" USING "btree" ("group_id") WHERE ("is_default" = true);


--
-- Name: idx_group_roles_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_roles_updated_at" ON "public"."group_roles" USING "btree" ("updated_at");


--
-- Name: idx_group_rules_analysis; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_rules_analysis" ON "public"."group_rules" USING "btree" ("group_id", "created_at", "order_index");


--
-- Name: idx_group_rules_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_rules_created_at" ON "public"."group_rules" USING "btree" ("created_at");


--
-- Name: idx_group_rules_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_rules_group_id" ON "public"."group_rules" USING "btree" ("group_id");


--
-- Name: idx_group_rules_order_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_rules_order_index" ON "public"."group_rules" USING "btree" ("order_index");


--
-- Name: idx_group_rules_ordering; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_rules_ordering" ON "public"."group_rules" USING "btree" ("group_id", "order_index") WHERE ("order_index" IS NOT NULL);


--
-- Name: idx_group_rules_unique_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "idx_group_rules_unique_order" ON "public"."group_rules" USING "btree" ("group_id", "order_index") WHERE ("order_index" IS NOT NULL);


--
-- Name: idx_group_rules_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_rules_updated_at" ON "public"."group_rules" USING "btree" ("updated_at");


--
-- Name: idx_group_tags_analysis; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_tags_analysis" ON "public"."group_tags" USING "btree" ("group_id", "created_at");


--
-- Name: idx_group_tags_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_tags_created_at" ON "public"."group_tags" USING "btree" ("created_at");


--
-- Name: idx_group_tags_description_search; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_tags_description_search" ON "public"."group_tags" USING "gin" ("to_tsvector"('"english"'::"regconfig", "description")) WHERE ("description" IS NOT NULL);


--
-- Name: idx_group_tags_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_tags_group_id" ON "public"."group_tags" USING "btree" ("group_id");


--
-- Name: idx_group_tags_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_tags_name" ON "public"."group_tags" USING "btree" ("name");


--
-- Name: idx_group_tags_name_search; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_tags_name_search" ON "public"."group_tags" USING "gin" ("to_tsvector"('"english"'::"regconfig", "name"));


--
-- Name: idx_group_tags_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_tags_updated_at" ON "public"."group_tags" USING "btree" ("updated_at");


--
-- Name: idx_group_types_display_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_types_display_name" ON "public"."group_types" USING "btree" ("display_name");


--
-- Name: idx_group_types_display_name_search; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_types_display_name_search" ON "public"."group_types" USING "gin" ("to_tsvector"('"english"'::"regconfig", "display_name"));


--
-- Name: idx_group_types_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_types_lookup" ON "public"."group_types" USING "btree" ("slug", "display_name");


--
-- Name: idx_group_types_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_types_slug" ON "public"."group_types" USING "btree" ("slug");


--
-- Name: idx_group_types_slug_search; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_group_types_slug_search" ON "public"."group_types" USING "gin" ("to_tsvector"('"english"'::"regconfig", "slug"));


--
-- Name: idx_id_mappings_new_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_id_mappings_new_id" ON "public"."id_mappings" USING "btree" ("new_id");


--
-- Name: idx_image_tags_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_image_tags_slug" ON "public"."image_tags" USING "btree" ("slug");


--
-- Name: idx_image_types_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_image_types_name" ON "public"."image_types" USING "btree" ("name");


--
-- Name: idx_images_deleted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_images_deleted" ON "public"."images" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);


--
-- Name: idx_images_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_images_id" ON "public"."images" USING "btree" ("id");


--
-- Name: idx_images_processed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_images_processed" ON "public"."images" USING "btree" ("is_processed");


--
-- Name: idx_images_storage; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_images_storage" ON "public"."images" USING "btree" ("storage_path");


--
-- Name: idx_invoices_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_invoices_event_id" ON "public"."invoices" USING "btree" ("event_id");


--
-- Name: idx_invoices_invoice_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_invoices_invoice_number" ON "public"."invoices" USING "btree" ("invoice_number");


--
-- Name: idx_invoices_registration_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_invoices_registration_id" ON "public"."invoices" USING "btree" ("registration_id");


--
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_invoices_status" ON "public"."invoices" USING "btree" ("status");


--
-- Name: idx_invoices_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_invoices_user_id" ON "public"."invoices" USING "btree" ("user_id");


--
-- Name: idx_media_attachments_feed_entry_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_media_attachments_feed_entry_id" ON "public"."media_attachments" USING "btree" ("feed_entry_id");


--
-- Name: idx_mentions_mentioned_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_mentions_mentioned_user_id" ON "public"."mentions" USING "btree" ("mentioned_user_id");


--
-- Name: idx_payment_methods_payment_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_payment_methods_payment_type" ON "public"."payment_methods" USING "btree" ("payment_type");


--
-- Name: idx_payment_methods_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_payment_methods_user_id" ON "public"."payment_methods" USING "btree" ("user_id");


--
-- Name: idx_payment_transactions_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_payment_transactions_event_id" ON "public"."payment_transactions" USING "btree" ("event_id");


--
-- Name: idx_payment_transactions_registration_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_payment_transactions_registration_id" ON "public"."payment_transactions" USING "btree" ("registration_id");


--
-- Name: idx_payment_transactions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_payment_transactions_status" ON "public"."payment_transactions" USING "btree" ("status");


--
-- Name: idx_payment_transactions_transaction_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_payment_transactions_transaction_type" ON "public"."payment_transactions" USING "btree" ("transaction_type");


--
-- Name: idx_payment_transactions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_payment_transactions_user_id" ON "public"."payment_transactions" USING "btree" ("user_id");


--
-- Name: idx_photo_albums_deleted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_photo_albums_deleted" ON "public"."photo_albums" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);


--
-- Name: idx_photo_albums_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_photo_albums_entity" ON "public"."photo_albums" USING "btree" ("entity_id", "entity_type");


--
-- Name: idx_photo_albums_owner; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_photo_albums_owner" ON "public"."photo_albums" USING "btree" ("owner_id");


--
-- Name: idx_photo_albums_public; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_photo_albums_public" ON "public"."photo_albums" USING "btree" ("is_public") WHERE ("is_public" = true);


--
-- Name: idx_photo_albums_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_photo_albums_type" ON "public"."photo_albums" USING "btree" ("album_type");


--
-- Name: idx_prices_analysis; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_prices_analysis" ON "public"."prices" USING "btree" ("book_id", "price", "currency");


--
-- Name: idx_prices_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_prices_book_id" ON "public"."prices" USING "btree" ("book_id");


--
-- Name: idx_prices_condition; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_prices_condition" ON "public"."prices" USING "btree" ("condition");


--
-- Name: idx_prices_condition_analysis; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_prices_condition_analysis" ON "public"."prices" USING "btree" ("condition", "price") WHERE ("condition" IS NOT NULL);


--
-- Name: idx_prices_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_prices_created_at" ON "public"."prices" USING "btree" ("created_at");


--
-- Name: idx_prices_currency; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_prices_currency" ON "public"."prices" USING "btree" ("currency");


--
-- Name: idx_prices_currency_analysis; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_prices_currency_analysis" ON "public"."prices" USING "btree" ("currency", "price");


--
-- Name: idx_prices_merchant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_prices_merchant" ON "public"."prices" USING "btree" ("merchant");


--
-- Name: idx_prices_merchant_analysis; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_prices_merchant_analysis" ON "public"."prices" USING "btree" ("merchant", "price") WHERE ("merchant" IS NOT NULL);


--
-- Name: idx_prices_price; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_prices_price" ON "public"."prices" USING "btree" ("price");


--
-- Name: idx_prices_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_prices_updated_at" ON "public"."prices" USING "btree" ("updated_at");


--
-- Name: idx_profiles_analysis; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_profiles_analysis" ON "public"."profiles" USING "btree" ("created_at", "updated_at");


--
-- Name: idx_profiles_bio_search; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_profiles_bio_search" ON "public"."profiles" USING "gin" ("to_tsvector"('"english"'::"regconfig", "bio")) WHERE ("bio" IS NOT NULL);


--
-- Name: idx_profiles_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_profiles_created_at" ON "public"."profiles" USING "btree" ("created_at");


--
-- Name: idx_profiles_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");


--
-- Name: idx_profiles_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_profiles_updated_at" ON "public"."profiles" USING "btree" ("updated_at");


--
-- Name: idx_profiles_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_profiles_user_id" ON "public"."profiles" USING "btree" ("user_id");


--
-- Name: idx_promo_codes_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_promo_codes_code" ON "public"."promo_codes" USING "btree" ("code");


--
-- Name: idx_promo_codes_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_promo_codes_event_id" ON "public"."promo_codes" USING "btree" ("event_id");


--
-- Name: idx_promo_codes_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_promo_codes_is_active" ON "public"."promo_codes" USING "btree" ("is_active");


--
-- Name: idx_publishers_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_publishers_created_at" ON "public"."publishers" USING "btree" ("created_at");


--
-- Name: idx_reactions_feed_entry_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reactions_feed_entry_id" ON "public"."reactions" USING "btree" ("feed_entry_id");


--
-- Name: idx_reactions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reactions_user_id" ON "public"."reactions" USING "btree" ("user_id");


--
-- Name: idx_reading_lists_description_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_lists_description_trgm" ON "public"."reading_lists" USING "gin" ("description" "public"."gin_trgm_ops");


--
-- Name: idx_reading_lists_name_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_lists_name_trgm" ON "public"."reading_lists" USING "gin" ("name" "public"."gin_trgm_ops");


--
-- Name: idx_reading_series_organizer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_series_organizer_id" ON "public"."reading_series" USING "btree" ("organizer_id");


--
-- Name: idx_reading_series_publisher_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_series_publisher_id" ON "public"."reading_series" USING "btree" ("publisher_id");


--
-- Name: idx_reading_sessions_new_analysis; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_sessions_new_analysis" ON "public"."reading_sessions" USING "btree" ("user_id", "book_id", "start_time");


--
-- Name: idx_reading_sessions_new_book_analysis; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_sessions_new_book_analysis" ON "public"."reading_sessions" USING "btree" ("book_id", "start_time", "pages_read") WHERE ("pages_read" IS NOT NULL);


--
-- Name: idx_reading_sessions_new_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_sessions_new_book_id" ON "public"."reading_sessions" USING "btree" ("book_id");


--
-- Name: idx_reading_sessions_new_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_sessions_new_created_at" ON "public"."reading_sessions" USING "btree" ("created_at");


--
-- Name: idx_reading_sessions_new_end_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_sessions_new_end_time" ON "public"."reading_sessions" USING "btree" ("end_time");


--
-- Name: idx_reading_sessions_new_progress; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_sessions_new_progress" ON "public"."reading_sessions" USING "btree" ("user_id", "start_time", "pages_read") WHERE ("pages_read" IS NOT NULL);


--
-- Name: idx_reading_sessions_new_start_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_sessions_new_start_time" ON "public"."reading_sessions" USING "btree" ("start_time");


--
-- Name: idx_reading_sessions_new_time_range; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_sessions_new_time_range" ON "public"."reading_sessions" USING "btree" ("start_time", "end_time") WHERE ("end_time" IS NOT NULL);


--
-- Name: idx_reading_sessions_new_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reading_sessions_new_user_id" ON "public"."reading_sessions" USING "btree" ("user_id");


--
-- Name: idx_reviews_analysis; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reviews_analysis" ON "public"."reviews" USING "btree" ("book_id", "rating", "created_at");


--
-- Name: idx_reviews_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reviews_book_id" ON "public"."reviews" USING "btree" ("book_id");


--
-- Name: idx_reviews_book_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reviews_book_user" ON "public"."reviews" USING "btree" ("book_id", "user_id");


--
-- Name: idx_reviews_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reviews_created_at" ON "public"."reviews" USING "btree" ("created_at");


--
-- Name: idx_reviews_high_ratings; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reviews_high_ratings" ON "public"."reviews" USING "btree" ("book_id", "rating") WHERE ("rating" >= 4);


--
-- Name: idx_reviews_low_ratings; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reviews_low_ratings" ON "public"."reviews" USING "btree" ("book_id", "rating") WHERE ("rating" <= 2);


--
-- Name: idx_reviews_rating; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reviews_rating" ON "public"."reviews" USING "btree" ("rating");


--
-- Name: idx_reviews_rating_analysis; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reviews_rating_analysis" ON "public"."reviews" USING "btree" ("rating", "created_at");


--
-- Name: idx_reviews_text_search; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reviews_text_search" ON "public"."reviews" USING "gin" ("to_tsvector"('"english"'::"regconfig", "review_text")) WHERE ("review_text" IS NOT NULL);


--
-- Name: idx_reviews_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reviews_updated_at" ON "public"."reviews" USING "btree" ("updated_at");


--
-- Name: idx_reviews_user_analysis; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reviews_user_analysis" ON "public"."reviews" USING "btree" ("user_id", "rating", "created_at");


--
-- Name: idx_reviews_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reviews_user_id" ON "public"."reviews" USING "btree" ("user_id");


--
-- Name: idx_reviews_with_text; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reviews_with_text" ON "public"."reviews" USING "btree" ("book_id", "created_at") WHERE ("review_text" IS NOT NULL);


--
-- Name: idx_series_events_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_series_events_event_id" ON "public"."series_events" USING "btree" ("event_id");


--
-- Name: idx_series_events_series_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_series_events_series_id" ON "public"."series_events" USING "btree" ("series_id");


--
-- Name: idx_session_registrations_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_session_registrations_session_id" ON "public"."session_registrations" USING "btree" ("session_id");


--
-- Name: idx_session_registrations_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_session_registrations_user_id" ON "public"."session_registrations" USING "btree" ("user_id");


--
-- Name: idx_similar_books_bidirectional; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_similar_books_bidirectional" ON "public"."similar_books" USING "btree" ("similar_book_id", "book_id", "similarity_score");


--
-- Name: idx_similar_books_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_similar_books_book_id" ON "public"."similar_books" USING "btree" ("book_id");


--
-- Name: idx_similar_books_book_similar; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_similar_books_book_similar" ON "public"."similar_books" USING "btree" ("book_id", "similar_book_id");


--
-- Name: idx_similar_books_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_similar_books_created_at" ON "public"."similar_books" USING "btree" ("created_at");


--
-- Name: idx_similar_books_high_similarity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_similar_books_high_similarity" ON "public"."similar_books" USING "btree" ("book_id", "similarity_score") WHERE ("similarity_score" >= 0.8);


--
-- Name: idx_similar_books_moderate_similarity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_similar_books_moderate_similarity" ON "public"."similar_books" USING "btree" ("book_id", "similarity_score") WHERE (("similarity_score" >= 0.5) AND ("similarity_score" < 0.8));


--
-- Name: idx_similar_books_no_score; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_similar_books_no_score" ON "public"."similar_books" USING "btree" ("book_id", "created_at") WHERE ("similarity_score" IS NULL);


--
-- Name: idx_similar_books_popular; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_similar_books_popular" ON "public"."similar_books" USING "btree" ("book_id", "similarity_score") WHERE ("similarity_score" >= 0.7);


--
-- Name: idx_similar_books_reverse_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_similar_books_reverse_lookup" ON "public"."similar_books" USING "btree" ("similar_book_id", "similarity_score", "created_at");


--
-- Name: idx_similar_books_score_distribution; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_similar_books_score_distribution" ON "public"."similar_books" USING "btree" ("similarity_score", "created_at");


--
-- Name: idx_similar_books_similar_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_similar_books_similar_book_id" ON "public"."similar_books" USING "btree" ("similar_book_id");


--
-- Name: idx_similar_books_similarity_analysis; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_similar_books_similarity_analysis" ON "public"."similar_books" USING "btree" ("book_id", "similarity_score", "created_at");


--
-- Name: idx_similar_books_similarity_score; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_similar_books_similarity_score" ON "public"."similar_books" USING "btree" ("similarity_score");


--
-- Name: idx_subjects_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_subjects_name" ON "public"."subjects" USING "btree" ("name");


--
-- Name: idx_subjects_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_subjects_parent_id" ON "public"."subjects" USING "btree" ("parent_id");


--
-- Name: idx_survey_questions_survey_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_survey_questions_survey_id" ON "public"."survey_questions" USING "btree" ("survey_id");


--
-- Name: idx_survey_responses_registration_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_survey_responses_registration_id" ON "public"."survey_responses" USING "btree" ("registration_id");


--
-- Name: idx_survey_responses_survey_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_survey_responses_survey_id" ON "public"."survey_responses" USING "btree" ("survey_id");


--
-- Name: idx_survey_responses_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_survey_responses_user_id" ON "public"."survey_responses" USING "btree" ("user_id");


--
-- Name: idx_tags_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_tags_name" ON "public"."tags" USING "btree" ("name");


--
-- Name: idx_ticket_benefits_ticket_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_ticket_benefits_ticket_type_id" ON "public"."ticket_benefits" USING "btree" ("ticket_type_id");


--
-- Name: idx_ticket_types_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_ticket_types_event_id" ON "public"."ticket_types" USING "btree" ("event_id");


--
-- Name: idx_ticket_types_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_ticket_types_is_active" ON "public"."ticket_types" USING "btree" ("is_active");


--
-- Name: idx_tickets_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_tickets_event_id" ON "public"."tickets" USING "btree" ("event_id");


--
-- Name: idx_tickets_registration_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_tickets_registration_id" ON "public"."tickets" USING "btree" ("registration_id");


--
-- Name: idx_tickets_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_tickets_status" ON "public"."tickets" USING "btree" ("status");


--
-- Name: idx_tickets_ticket_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_tickets_ticket_number" ON "public"."tickets" USING "btree" ("ticket_number");


--
-- Name: idx_tickets_ticket_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_tickets_ticket_type_id" ON "public"."tickets" USING "btree" ("ticket_type_id");


--
-- Name: idx_tickets_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_tickets_user_id" ON "public"."tickets" USING "btree" ("user_id");


--
-- Name: idx_unique_calendar_export; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "idx_unique_calendar_export" ON "public"."event_calendar_exports" USING "btree" ("event_id", "user_id", "calendar_type");


--
-- Name: idx_unique_creator_permission; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "idx_unique_creator_permission" ON "public"."event_creator_permissions" USING "btree" ("user_id");


--
-- Name: idx_unique_event_analytics; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "idx_unique_event_analytics" ON "public"."event_analytics" USING "btree" ("event_id", "date");


--
-- Name: idx_unique_event_approval; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "idx_unique_event_approval" ON "public"."event_approvals" USING "btree" ("event_id");


--
-- Name: idx_unique_event_financials; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "idx_unique_event_financials" ON "public"."event_financials" USING "btree" ("event_id");


--
-- Name: idx_unique_event_interest; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "idx_unique_event_interest" ON "public"."event_interests" USING "btree" ("event_id", "user_id");


--
-- Name: idx_unique_event_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "idx_unique_event_like" ON "public"."event_likes" USING "btree" ("event_id", "user_id");


--
-- Name: idx_unique_event_promo_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "idx_unique_event_promo_code" ON "public"."promo_codes" USING "btree" ("event_id", "code");


--
-- Name: idx_unique_event_registration; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "idx_unique_event_registration" ON "public"."event_registrations" USING "btree" ("event_id", "user_id");


--
-- Name: idx_unique_event_staff; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "idx_unique_event_staff" ON "public"."event_staff" USING "btree" ("event_id", "user_id");


--
-- Name: idx_unique_session_registration; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "idx_unique_session_registration" ON "public"."session_registrations" USING "btree" ("session_id", "user_id");


--
-- Name: idx_user_book_interactions_book_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_book_created" ON "public"."user_book_interactions" USING "btree" ("book_id", "created_at");


--
-- Name: idx_user_book_interactions_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_book_id" ON "public"."user_book_interactions" USING "btree" ("book_id");


--
-- Name: idx_user_book_interactions_book_patterns; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_book_patterns" ON "public"."user_book_interactions" USING "btree" ("book_id", "interaction_type", "interaction_value", "created_at");


--
-- Name: idx_user_book_interactions_book_popularity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_book_popularity" ON "public"."user_book_interactions" USING "btree" ("book_id", "interaction_type", "created_at");


--
-- Name: idx_user_book_interactions_book_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_book_type" ON "public"."user_book_interactions" USING "btree" ("book_id", "interaction_type");


--
-- Name: idx_user_book_interactions_book_value; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_book_value" ON "public"."user_book_interactions" USING "btree" ("book_id", "interaction_value");


--
-- Name: idx_user_book_interactions_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_created_at" ON "public"."user_book_interactions" USING "btree" ("created_at");


--
-- Name: idx_user_book_interactions_high_value; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_high_value" ON "public"."user_book_interactions" USING "btree" ("book_id", "interaction_value") WHERE ("interaction_value" >= (8.0)::double precision);


--
-- Name: idx_user_book_interactions_interaction_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_interaction_type" ON "public"."user_book_interactions" USING "btree" ("interaction_type");


--
-- Name: idx_user_book_interactions_likes; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_likes" ON "public"."user_book_interactions" USING "btree" ("book_id", "created_at") WHERE ("interaction_type" = 'like'::"text");


--
-- Name: idx_user_book_interactions_purchases; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_purchases" ON "public"."user_book_interactions" USING "btree" ("book_id", "created_at") WHERE ("interaction_type" = 'purchase'::"text");


--
-- Name: idx_user_book_interactions_ratings; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_ratings" ON "public"."user_book_interactions" USING "btree" ("book_id", "interaction_value", "created_at") WHERE ("interaction_type" = 'rating'::"text");


--
-- Name: idx_user_book_interactions_reviews; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_reviews" ON "public"."user_book_interactions" USING "btree" ("book_id", "created_at") WHERE ("interaction_type" = 'review'::"text");


--
-- Name: idx_user_book_interactions_type_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_type_created" ON "public"."user_book_interactions" USING "btree" ("interaction_type", "created_at");


--
-- Name: idx_user_book_interactions_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_updated_at" ON "public"."user_book_interactions" USING "btree" ("updated_at");


--
-- Name: idx_user_book_interactions_user_behavior; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_user_behavior" ON "public"."user_book_interactions" USING "btree" ("user_id", "interaction_type", "interaction_value", "created_at");


--
-- Name: idx_user_book_interactions_user_book; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_user_book" ON "public"."user_book_interactions" USING "btree" ("user_id", "book_id");


--
-- Name: idx_user_book_interactions_user_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_user_created" ON "public"."user_book_interactions" USING "btree" ("user_id", "created_at");


--
-- Name: idx_user_book_interactions_user_engagement; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_user_engagement" ON "public"."user_book_interactions" USING "btree" ("user_id", "interaction_type", "created_at");


--
-- Name: idx_user_book_interactions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_user_id" ON "public"."user_book_interactions" USING "btree" ("user_id");


--
-- Name: idx_user_book_interactions_user_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_user_type" ON "public"."user_book_interactions" USING "btree" ("user_id", "interaction_type");


--
-- Name: idx_user_book_interactions_user_value; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_user_value" ON "public"."user_book_interactions" USING "btree" ("user_id", "interaction_value");


--
-- Name: idx_user_book_interactions_value; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_value" ON "public"."user_book_interactions" USING "btree" ("interaction_value");


--
-- Name: idx_user_book_interactions_value_analysis; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_value_analysis" ON "public"."user_book_interactions" USING "btree" ("interaction_type", "interaction_value", "created_at") WHERE ("interaction_value" IS NOT NULL);


--
-- Name: idx_user_book_interactions_views; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_book_interactions_views" ON "public"."user_book_interactions" USING "btree" ("book_id", "created_at") WHERE ("interaction_type" = 'view'::"text");


--
-- Name: idx_users_name_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_users_name_trgm" ON "public"."users" USING "gin" ("name" "public"."gin_trgm_ops");


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
-- Name: users create_default_reading_lists_for_new_user; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--

CREATE OR REPLACE TRIGGER "create_default_reading_lists_for_new_user" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."create_default_reading_lists"();


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--

CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();


--
-- Name: events author_event_notification_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "author_event_notification_trigger" AFTER INSERT ON "public"."events" FOR EACH ROW WHEN (("new"."status" = 'published'::"text")) EXECUTE FUNCTION "public"."notify_author_followers_of_event"();


--
-- Name: book_club_members book_club_member_count_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "book_club_member_count_trigger" AFTER INSERT OR DELETE ON "public"."book_club_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_book_club_member_count"();


--
-- Name: contact_info contact_info_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "contact_info_updated_at" BEFORE UPDATE ON "public"."contact_info" FOR EACH ROW EXECUTE FUNCTION "public"."update_contact_info_updated_at"();


--
-- Name: reading_challenges create_challenge_complete_notification_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "create_challenge_complete_notification_trigger" AFTER UPDATE ON "public"."reading_challenges" FOR EACH ROW EXECUTE FUNCTION "public"."create_challenge_complete_notification"();


--
-- Name: events create_event_approval_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "create_event_approval_trigger" AFTER INSERT ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."create_event_approval_record"();


--
-- Name: list_followers create_list_follow_notification_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "create_list_follow_notification_trigger" AFTER INSERT ON "public"."list_followers" FOR EACH ROW EXECUTE FUNCTION "public"."create_list_follow_notification"();


--
-- Name: reading_list_items create_list_item_activity_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "create_list_item_activity_trigger" AFTER INSERT ON "public"."reading_list_items" FOR EACH ROW EXECUTE FUNCTION "public"."create_list_item_activity"();


--
-- Name: reading_lists create_reading_list_activity_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "create_reading_list_activity_trigger" AFTER INSERT ON "public"."reading_lists" FOR EACH ROW EXECUTE FUNCTION "public"."create_reading_list_activity"();


--
-- Name: reading_progress create_reading_progress_activity_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "create_reading_progress_activity_trigger" AFTER UPDATE ON "public"."reading_progress" FOR EACH ROW EXECUTE FUNCTION "public"."create_reading_progress_activity"();


--
-- Name: book_reviews create_review_activity_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "create_review_activity_trigger" AFTER INSERT ON "public"."book_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."create_review_activity"();


--
-- Name: review_likes create_review_like_notification_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "create_review_like_notification_trigger" AFTER INSERT ON "public"."review_likes" FOR EACH ROW EXECUTE FUNCTION "public"."create_review_like_notification"();


--
-- Name: book_reviews create_want_to_read_review_notification_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "create_want_to_read_review_notification_trigger" AFTER INSERT ON "public"."book_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."create_want_to_read_review_notification"();


--
-- Name: events event_created_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "event_created_trigger" AFTER INSERT ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."create_event_activity"();


--
-- Name: events event_notification_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "event_notification_trigger" AFTER INSERT ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."create_event_notification"();


--
-- Name: event_registrations event_registration_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "event_registration_trigger" AFTER INSERT ON "public"."event_registrations" FOR EACH ROW EXECUTE FUNCTION "public"."create_event_registration_activity"();


--
-- Name: events event_status_update_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "event_status_update_trigger" BEFORE UPDATE ON "public"."events" FOR EACH ROW WHEN (("old"."status" IS DISTINCT FROM "new"."status")) EXECUTE FUNCTION "public"."update_event_status"();


--
-- Name: event_views event_view_tracking_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "event_view_tracking_trigger" AFTER INSERT ON "public"."event_views" FOR EACH ROW EXECUTE FUNCTION "public"."track_event_view"();


--
-- Name: group_members group_member_count_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "group_member_count_trigger" AFTER INSERT OR DELETE ON "public"."group_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_group_member_count"();


--
-- Name: series_events manage_series_event_number_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "manage_series_event_number_trigger" BEFORE INSERT ON "public"."series_events" FOR EACH ROW EXECUTE FUNCTION "public"."manage_series_event_number"();


--
-- Name: event_waitlists manage_waitlist_position_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "manage_waitlist_position_trigger" BEFORE INSERT ON "public"."event_waitlists" FOR EACH ROW EXECUTE FUNCTION "public"."manage_waitlist_position"();


--
-- Name: tickets notify_waitlist_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "notify_waitlist_trigger" AFTER UPDATE ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."notify_waitlist_when_ticket_available"();


--
-- Name: discussion_comments on_discussion_comment_created; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "on_discussion_comment_created" AFTER INSERT ON "public"."discussion_comments" FOR EACH ROW EXECUTE FUNCTION "public"."create_discussion_comment_activity"();


--
-- Name: discussions on_discussion_created; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "on_discussion_created" AFTER INSERT ON "public"."discussions" FOR EACH ROW EXECUTE FUNCTION "public"."create_discussion_activity"();


--
-- Name: users on_public_user_created_profile; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "on_public_user_created_profile" AFTER INSERT ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user_profile"();


--
-- Name: event_waitlists reorder_waitlist_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "reorder_waitlist_trigger" AFTER DELETE ON "public"."event_waitlists" FOR EACH ROW EXECUTE FUNCTION "public"."manage_waitlist_position"();


--
-- Name: photo_albums set_album_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_album_updated_at" BEFORE UPDATE ON "public"."photo_albums" FOR EACH ROW EXECUTE FUNCTION "public"."update_album_updated_at"();


--
-- Name: images set_image_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_image_updated_at" BEFORE UPDATE ON "public"."images" FOR EACH ROW EXECUTE FUNCTION "public"."update_image_updated_at"();


--
-- Name: group_reading_challenge_progress trg_notify_challenge_completion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_notify_challenge_completion" AFTER INSERT OR UPDATE ON "public"."group_reading_challenge_progress" FOR EACH ROW EXECUTE FUNCTION "public"."notify_challenge_completion"();


--
-- Name: group_reading_challenge_progress trg_notify_challenge_lead; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_notify_challenge_lead" AFTER INSERT OR UPDATE ON "public"."group_reading_challenge_progress" FOR EACH ROW EXECUTE FUNCTION "public"."notify_challenge_lead"();


--
-- Name: books trigger_book_update_activity; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trigger_book_update_activity" AFTER UPDATE ON "public"."books" FOR EACH ROW EXECUTE FUNCTION "public"."create_book_update_activity"();


--
-- Name: posts trigger_prevent_spam_posts; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trigger_prevent_spam_posts" BEFORE INSERT ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_spam_posts"();


--
-- Name: reviews trigger_update_book_rating; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trigger_update_book_rating" AFTER INSERT OR DELETE OR UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_book_rating_from_reviews"();


--
-- Name: feed_entries trigger_update_feed_entry_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trigger_update_feed_entry_updated_at" BEFORE UPDATE ON "public"."feed_entries" FOR EACH ROW EXECUTE FUNCTION "public"."update_feed_entry_updated_at"();


--
-- Name: books trigger_validate_book_data; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trigger_validate_book_data" BEFORE INSERT OR UPDATE ON "public"."books" FOR EACH ROW EXECUTE FUNCTION "public"."validate_book_data"();


--
-- Name: discussions update_book_discussions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "update_book_discussions_updated_at" BEFORE UPDATE ON "public"."discussions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: book_reviews update_book_rating_on_review_delete; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "update_book_rating_on_review_delete" AFTER DELETE ON "public"."book_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_book_rating"();


--
-- Name: book_reviews update_book_rating_on_review_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "update_book_rating_on_review_insert" AFTER INSERT ON "public"."book_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_book_rating"();


--
-- Name: book_reviews update_book_rating_on_review_update; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "update_book_rating_on_review_update" AFTER UPDATE ON "public"."book_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_book_rating"();


--
-- Name: books update_books_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "update_books_updated_at" BEFORE UPDATE ON "public"."books" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: reading_progress update_daily_stats_after_progress_update; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "update_daily_stats_after_progress_update" AFTER UPDATE ON "public"."reading_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_daily_stats_from_progress"();


--
-- Name: discussion_comments update_discussion_comments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "update_discussion_comments_updated_at" BEFORE UPDATE ON "public"."discussion_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: payment_transactions update_financials_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "update_financials_trigger" AFTER INSERT OR UPDATE ON "public"."payment_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_event_financials"();


--
-- Name: follows update_follows_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "update_follows_updated_at" BEFORE UPDATE ON "public"."follows" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: reading_stats_daily update_goals_after_daily_stats_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "update_goals_after_daily_stats_insert" AFTER INSERT OR UPDATE ON "public"."reading_stats_daily" FOR EACH ROW EXECUTE FUNCTION "public"."update_reading_goals"();


--
-- Name: reading_streaks update_goals_after_streak_update; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "update_goals_after_streak_update" AFTER INSERT OR UPDATE ON "public"."reading_streaks" FOR EACH ROW EXECUTE FUNCTION "public"."update_streak_goals"();


--
-- Name: publishers update_publishers_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "update_publishers_updated_at_trigger" BEFORE UPDATE ON "public"."publishers" FOR EACH ROW EXECUTE FUNCTION "public"."update_publishers_updated_at"();


--
-- Name: reading_progress update_reading_challenge_on_progress; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "update_reading_challenge_on_progress" AFTER INSERT OR UPDATE ON "public"."reading_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_reading_challenge"();


--
-- Name: reading_progress update_recommendations_on_progress_change; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "update_recommendations_on_progress_change" AFTER INSERT OR UPDATE ON "public"."reading_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_recommendations"();


--
-- Name: book_reviews update_recommendations_on_review; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "update_recommendations_on_review" AFTER INSERT OR UPDATE ON "public"."book_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_recommendations"();


--
-- Name: reading_stats_daily update_streaks_after_daily_stats_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "update_streaks_after_daily_stats_insert" AFTER INSERT ON "public"."reading_stats_daily" FOR EACH ROW EXECUTE FUNCTION "public"."update_reading_streaks"();


--
-- Name: sync_state update_sync_state_modified; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "update_sync_state_modified" BEFORE UPDATE ON "public"."sync_state" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();


--
-- Name: tickets update_ticket_quantity_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "update_ticket_quantity_trigger" AFTER INSERT OR UPDATE ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."update_ticket_quantity_sold"();


--
-- Name: event_chat_messages validate_chat_message_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "validate_chat_message_trigger" BEFORE INSERT ON "public"."event_chat_messages" FOR EACH ROW EXECUTE FUNCTION "public"."validate_chat_message"();


--
-- Name: events validate_event_creation_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "validate_event_creation_trigger" BEFORE INSERT ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."validate_event_creation"();


--
-- Name: follows validate_follow_target_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "validate_follow_target_trigger" BEFORE INSERT OR UPDATE ON "public"."follows" FOR EACH ROW EXECUTE FUNCTION "public"."validate_follow_target"();


--
-- Name: event_livestreams validate_livestream_activation_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "validate_livestream_activation_trigger" BEFORE INSERT OR UPDATE ON "public"."event_livestreams" FOR EACH ROW EXECUTE FUNCTION "public"."validate_livestream_activation"();


--
-- Name: survey_responses validate_survey_response_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "validate_survey_response_trigger" BEFORE INSERT ON "public"."survey_responses" FOR EACH ROW EXECUTE FUNCTION "public"."validate_survey_response"();


--
-- Name: tickets validate_ticket_purchase_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "validate_ticket_purchase_trigger" BEFORE INSERT ON "public"."tickets" FOR EACH ROW WHEN (("new"."status" = 'reserved'::"text")) EXECUTE FUNCTION "public"."validate_ticket_purchase"();


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
-- Name: activities activities_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: activities activities_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."reading_lists"("id") ON DELETE CASCADE;


--
-- Name: activities activities_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."book_reviews"("id") ON DELETE CASCADE;


--
-- Name: activities activities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: activity_log activity_log_target_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: activity_log activity_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: album_analytics album_analytics_album_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."album_analytics"
    ADD CONSTRAINT "album_analytics_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."photo_albums"("id") ON DELETE CASCADE;


--
-- Name: album_images album_images_album_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."album_images"
    ADD CONSTRAINT "album_images_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."photo_albums"("id") ON DELETE CASCADE;


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
    ADD CONSTRAINT "album_shares_shared_by_fkey" FOREIGN KEY ("shared_by") REFERENCES "auth"."users"("id");


--
-- Name: album_shares album_shares_shared_with_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."album_shares"
    ADD CONSTRAINT "album_shares_shared_with_fkey" FOREIGN KEY ("shared_with") REFERENCES "auth"."users"("id");


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
-- Name: book_authors book_authors_new_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_authors"
    ADD CONSTRAINT "book_authors_new_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id");


--
-- Name: book_club_books book_club_books_new_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_club_books"
    ADD CONSTRAINT "book_club_books_new_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id");


--
-- Name: book_club_discussion_comments book_club_discussion_comments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_club_discussion_comments"
    ADD CONSTRAINT "book_club_discussion_comments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");


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
    ADD CONSTRAINT "book_club_discussions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id");


--
-- Name: book_club_discussions book_club_discussions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_club_discussions"
    ADD CONSTRAINT "book_club_discussions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");


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
    ADD CONSTRAINT "book_clubs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");


--
-- Name: book_clubs book_clubs_current_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_clubs"
    ADD CONSTRAINT "book_clubs_current_book_id_fkey" FOREIGN KEY ("current_book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL;


--
-- Name: discussions book_discussions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."discussions"
    ADD CONSTRAINT "book_discussions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: book_genre_mappings book_genre_mappings_new_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_genre_mappings"
    ADD CONSTRAINT "book_genre_mappings_new_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id");


--
-- Name: book_genre_mappings book_genre_mappings_new_genre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_genre_mappings"
    ADD CONSTRAINT "book_genre_mappings_new_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "public"."book_genres"("id");


--
-- Name: book_publishers book_publishers_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_publishers"
    ADD CONSTRAINT "book_publishers_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: book_publishers book_publishers_new_publisher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_publishers"
    ADD CONSTRAINT "book_publishers_new_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE CASCADE;


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
-- Name: book_recommendations book_recommendations_source_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_recommendations"
    ADD CONSTRAINT "book_recommendations_source_book_id_fkey" FOREIGN KEY ("source_book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL;


--
-- Name: book_recommendations book_recommendations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_recommendations"
    ADD CONSTRAINT "book_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: book_reviews book_reviews_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_reviews"
    ADD CONSTRAINT "book_reviews_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: book_reviews book_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_reviews"
    ADD CONSTRAINT "book_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: book_similarity_scores book_similarity_scores_new_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_similarity_scores"
    ADD CONSTRAINT "book_similarity_scores_new_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id");


--
-- Name: book_similarity_scores book_similarity_scores_new_similar_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_similarity_scores"
    ADD CONSTRAINT "book_similarity_scores_new_similar_book_id_fkey" FOREIGN KEY ("similar_book_id") REFERENCES "public"."books"("id");


--
-- Name: book_subjects book_subjects_new_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_subjects"
    ADD CONSTRAINT "book_subjects_new_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id");


--
-- Name: book_subjects book_subjects_new_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_subjects"
    ADD CONSTRAINT "book_subjects_new_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id");


--
-- Name: book_tag_mappings book_tag_mappings_new_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_tag_mappings"
    ADD CONSTRAINT "book_tag_mappings_new_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id");


--
-- Name: book_tag_mappings book_tag_mappings_new_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_tag_mappings"
    ADD CONSTRAINT "book_tag_mappings_new_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."book_tags"("id");


--
-- Name: book_views book_views_new_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_views"
    ADD CONSTRAINT "book_views_new_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id");


--
-- Name: book_views book_views_new_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_views"
    ADD CONSTRAINT "book_views_new_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


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
-- Name: discussion_comments discussion_comments_discussion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."discussion_comments"
    ADD CONSTRAINT "discussion_comments_discussion_id_fkey" FOREIGN KEY ("discussion_id") REFERENCES "public"."discussions"("id") ON DELETE CASCADE;


--
-- Name: discussion_comments discussion_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."discussion_comments"
    ADD CONSTRAINT "discussion_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: discussions discussions_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."discussions"
    ADD CONSTRAINT "discussions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id");


--
-- Name: discussions discussions_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."discussions"
    ADD CONSTRAINT "discussions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id");


--
-- Name: event_analytics event_analytics_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_analytics"
    ADD CONSTRAINT "event_analytics_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_approvals event_approvals_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_approvals"
    ADD CONSTRAINT "event_approvals_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_approvals event_approvals_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_approvals"
    ADD CONSTRAINT "event_approvals_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id");


--
-- Name: event_approvals event_approvals_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_approvals"
    ADD CONSTRAINT "event_approvals_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id");


--
-- Name: event_books event_books_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_books"
    ADD CONSTRAINT "event_books_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id");


--
-- Name: event_books event_books_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_books"
    ADD CONSTRAINT "event_books_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_calendar_exports event_calendar_exports_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_calendar_exports"
    ADD CONSTRAINT "event_calendar_exports_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_calendar_exports event_calendar_exports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_calendar_exports"
    ADD CONSTRAINT "event_calendar_exports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- Name: event_categories event_categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_categories"
    ADD CONSTRAINT "event_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."event_categories"("id");


--
-- Name: event_chat_messages event_chat_messages_chat_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_chat_messages"
    ADD CONSTRAINT "event_chat_messages_chat_room_id_fkey" FOREIGN KEY ("chat_room_id") REFERENCES "public"."event_chat_rooms"("id") ON DELETE CASCADE;


--
-- Name: event_chat_messages event_chat_messages_hidden_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_chat_messages"
    ADD CONSTRAINT "event_chat_messages_hidden_by_fkey" FOREIGN KEY ("hidden_by") REFERENCES "public"."users"("id");


--
-- Name: event_chat_messages event_chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_chat_messages"
    ADD CONSTRAINT "event_chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


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
    ADD CONSTRAINT "event_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."event_comments"("id");


--
-- Name: event_comments event_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_comments"
    ADD CONSTRAINT "event_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


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
    ADD CONSTRAINT "event_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- Name: event_likes event_likes_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_likes"
    ADD CONSTRAINT "event_likes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_likes event_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_likes"
    ADD CONSTRAINT "event_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


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
    ADD CONSTRAINT "event_permission_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id");


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
    ADD CONSTRAINT "event_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- Name: event_reminders event_reminders_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_reminders"
    ADD CONSTRAINT "event_reminders_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_reminders event_reminders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_reminders"
    ADD CONSTRAINT "event_reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- Name: event_sessions event_sessions_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_sessions"
    ADD CONSTRAINT "event_sessions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_sessions event_sessions_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_sessions"
    ADD CONSTRAINT "event_sessions_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."event_locations"("id");


--
-- Name: event_shares event_shares_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_shares"
    ADD CONSTRAINT "event_shares_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_shares event_shares_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_shares"
    ADD CONSTRAINT "event_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


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
    ADD CONSTRAINT "event_speakers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


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
    ADD CONSTRAINT "event_staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


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
    ADD CONSTRAINT "event_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- Name: event_waitlists event_waitlists_converted_to_registration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_waitlists"
    ADD CONSTRAINT "event_waitlists_converted_to_registration_id_fkey" FOREIGN KEY ("converted_to_registration_id") REFERENCES "public"."event_registrations"("id");


--
-- Name: event_waitlists event_waitlists_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_waitlists"
    ADD CONSTRAINT "event_waitlists_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_waitlists event_waitlists_ticket_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_waitlists"
    ADD CONSTRAINT "event_waitlists_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id");


--
-- Name: event_waitlists event_waitlists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_waitlists"
    ADD CONSTRAINT "event_waitlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- Name: events events_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE SET NULL;


--
-- Name: events events_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON UPDATE CASCADE;


--
-- Name: events events_cover_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");


--
-- Name: events events_event_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_event_category_id_fkey" FOREIGN KEY ("event_category_id") REFERENCES "public"."event_categories"("id");


--
-- Name: events events_event_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_event_image_id_fkey" FOREIGN KEY ("event_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;


--
-- Name: events events_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON UPDATE CASCADE;


--
-- Name: events events_parent_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_parent_event_id_fkey" FOREIGN KEY ("parent_event_id") REFERENCES "public"."events"("id");


--
-- Name: events events_publisher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON UPDATE CASCADE;


--
-- Name: events events_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "public"."event_types"("id");


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
-- Name: book_reviews fk_book_reviews_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."book_reviews"
    ADD CONSTRAINT "fk_book_reviews_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- Name: follows follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: follows follows_target_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_target_type_id_fkey" FOREIGN KEY ("target_type_id") REFERENCES "public"."follow_target_types"("id") ON DELETE CASCADE;


--
-- Name: friends friends_friend_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."friends"
    ADD CONSTRAINT "friends_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: friends friends_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."friends"
    ADD CONSTRAINT "friends_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: friends friends_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."friends"
    ADD CONSTRAINT "friends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: group_achievements group_achievements_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_achievements"
    ADD CONSTRAINT "group_achievements_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;


--
-- Name: group_analytics group_analytics_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_analytics"
    ADD CONSTRAINT "group_analytics_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;


--
-- Name: group_announcements group_announcements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_announcements"
    ADD CONSTRAINT "group_announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");


--
-- Name: group_audit_log group_audit_log_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_audit_log"
    ADD CONSTRAINT "group_audit_log_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id");


--
-- Name: group_author_events group_author_events_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_author_events"
    ADD CONSTRAINT "group_author_events_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE CASCADE;


--
-- Name: group_author_events group_author_events_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_author_events"
    ADD CONSTRAINT "group_author_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");


--
-- Name: group_book_list_items group_book_list_items_added_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_list_items"
    ADD CONSTRAINT "group_book_list_items_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id");


--
-- Name: group_book_list_items group_book_list_items_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_list_items"
    ADD CONSTRAINT "group_book_list_items_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id");


--
-- Name: group_book_list_items group_book_list_items_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_list_items"
    ADD CONSTRAINT "group_book_list_items_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."group_book_lists"("id") ON DELETE CASCADE;


--
-- Name: group_book_lists group_book_lists_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_lists"
    ADD CONSTRAINT "group_book_lists_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");


--
-- Name: group_book_reviews group_book_reviews_new_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_reviews"
    ADD CONSTRAINT "group_book_reviews_new_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: group_book_reviews group_book_reviews_new_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_reviews"
    ADD CONSTRAINT "group_book_reviews_new_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;


--
-- Name: group_book_reviews group_book_reviews_new_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_reviews"
    ADD CONSTRAINT "group_book_reviews_new_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: group_book_swaps group_book_swaps_accepted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_swaps"
    ADD CONSTRAINT "group_book_swaps_accepted_by_fkey" FOREIGN KEY ("accepted_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;


--
-- Name: group_book_swaps group_book_swaps_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_swaps"
    ADD CONSTRAINT "group_book_swaps_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: group_book_swaps group_book_swaps_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_swaps"
    ADD CONSTRAINT "group_book_swaps_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;


--
-- Name: group_book_swaps group_book_swaps_offered_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_swaps"
    ADD CONSTRAINT "group_book_swaps_offered_by_fkey" FOREIGN KEY ("offered_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: group_book_wishlist_items group_book_wishlist_items_added_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_wishlist_items"
    ADD CONSTRAINT "group_book_wishlist_items_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id");


--
-- Name: group_book_wishlist_items group_book_wishlist_items_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_wishlist_items"
    ADD CONSTRAINT "group_book_wishlist_items_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON UPDATE CASCADE;


--
-- Name: group_book_wishlist_items group_book_wishlist_items_wishlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_wishlist_items"
    ADD CONSTRAINT "group_book_wishlist_items_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "public"."group_book_wishlists"("id") ON DELETE CASCADE;


--
-- Name: group_book_wishlists group_book_wishlists_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_book_wishlists"
    ADD CONSTRAINT "group_book_wishlists_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");


--
-- Name: group_chat_channels group_chat_channels_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_chat_channels"
    ADD CONSTRAINT "group_chat_channels_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");


--
-- Name: group_chat_message_attachments group_chat_message_attachments_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_chat_message_attachments"
    ADD CONSTRAINT "group_chat_message_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."group_chat_messages"("id") ON DELETE CASCADE;


--
-- Name: group_chat_message_reactions group_chat_message_reactions_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_chat_message_reactions"
    ADD CONSTRAINT "group_chat_message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."group_chat_messages"("id") ON DELETE CASCADE;


--
-- Name: group_chat_message_reactions group_chat_message_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_chat_message_reactions"
    ADD CONSTRAINT "group_chat_message_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- Name: group_chat_messages group_chat_messages_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_chat_messages"
    ADD CONSTRAINT "group_chat_messages_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."group_chat_channels"("id") ON DELETE CASCADE;


--
-- Name: group_chat_messages group_chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_chat_messages"
    ADD CONSTRAINT "group_chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- Name: group_content_moderation_logs group_content_moderation_logs_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_content_moderation_logs"
    ADD CONSTRAINT "group_content_moderation_logs_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id");


--
-- Name: group_discussion_categories group_discussion_categories_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_discussion_categories"
    ADD CONSTRAINT "group_discussion_categories_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;


--
-- Name: group_event_feedback group_event_feedback_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_event_feedback"
    ADD CONSTRAINT "group_event_feedback_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: group_event_feedback group_event_feedback_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_event_feedback"
    ADD CONSTRAINT "group_event_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- Name: group_events group_events_chat_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_events"
    ADD CONSTRAINT "group_events_chat_channel_id_fkey" FOREIGN KEY ("chat_channel_id") REFERENCES "public"."group_chat_channels"("id");


--
-- Name: group_events group_events_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_events"
    ADD CONSTRAINT "group_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: group_events group_events_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_events"
    ADD CONSTRAINT "group_events_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON UPDATE CASCADE;


--
-- Name: group_invites group_invites_invited_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_invites"
    ADD CONSTRAINT "group_invites_invited_user_id_fkey" FOREIGN KEY ("invited_user_id") REFERENCES "public"."users"("id");


--
-- Name: group_member_achievements group_member_achievements_achievement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_member_achievements"
    ADD CONSTRAINT "group_member_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "public"."group_achievements"("id") ON DELETE CASCADE;


--
-- Name: group_member_achievements group_member_achievements_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_member_achievements"
    ADD CONSTRAINT "group_member_achievements_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;


--
-- Name: group_member_achievements group_member_achievements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_member_achievements"
    ADD CONSTRAINT "group_member_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: group_member_devices group_member_devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_member_devices"
    ADD CONSTRAINT "group_member_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- Name: group_member_streaks group_member_streaks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_member_streaks"
    ADD CONSTRAINT "group_member_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


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
-- Name: group_membership_questions group_membership_questions_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_membership_questions"
    ADD CONSTRAINT "group_membership_questions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;


--
-- Name: group_moderation_logs group_moderation_logs_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_moderation_logs"
    ADD CONSTRAINT "group_moderation_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id");


--
-- Name: group_onboarding_progress group_onboarding_progress_checklist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_onboarding_progress"
    ADD CONSTRAINT "group_onboarding_progress_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "public"."group_onboarding_checklists"("id") ON DELETE CASCADE;


--
-- Name: group_onboarding_progress group_onboarding_progress_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_onboarding_progress"
    ADD CONSTRAINT "group_onboarding_progress_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."group_onboarding_tasks"("id");


--
-- Name: group_onboarding_progress group_onboarding_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_onboarding_progress"
    ADD CONSTRAINT "group_onboarding_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- Name: group_onboarding_tasks group_onboarding_tasks_checklist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_onboarding_tasks"
    ADD CONSTRAINT "group_onboarding_tasks_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "public"."group_onboarding_checklists"("id") ON DELETE CASCADE;


--
-- Name: group_poll_votes group_poll_votes_poll_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_poll_votes"
    ADD CONSTRAINT "group_poll_votes_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "public"."group_polls"("id") ON DELETE CASCADE;


--
-- Name: group_poll_votes group_poll_votes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_poll_votes"
    ADD CONSTRAINT "group_poll_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- Name: group_polls group_polls_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_polls"
    ADD CONSTRAINT "group_polls_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");


--
-- Name: group_reading_challenge_progress group_reading_challenge_progress_challenge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_reading_challenge_progress"
    ADD CONSTRAINT "group_reading_challenge_progress_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."group_reading_challenges"("id") ON DELETE CASCADE;


--
-- Name: group_reading_challenge_progress group_reading_challenge_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_reading_challenge_progress"
    ADD CONSTRAINT "group_reading_challenge_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- Name: group_reading_challenges group_reading_challenges_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_reading_challenges"
    ADD CONSTRAINT "group_reading_challenges_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");


--
-- Name: group_reading_progress group_reading_progress_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_reading_progress"
    ADD CONSTRAINT "group_reading_progress_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON UPDATE CASCADE;


--
-- Name: group_reading_progress group_reading_progress_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_reading_progress"
    ADD CONSTRAINT "group_reading_progress_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON UPDATE CASCADE;


--
-- Name: group_reading_progress group_reading_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_reading_progress"
    ADD CONSTRAINT "group_reading_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- Name: group_reading_sessions group_reading_sessions_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_reading_sessions"
    ADD CONSTRAINT "group_reading_sessions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON UPDATE CASCADE;


--
-- Name: group_reading_sessions group_reading_sessions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_reading_sessions"
    ADD CONSTRAINT "group_reading_sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");


--
-- Name: group_reading_sessions group_reading_sessions_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_reading_sessions"
    ADD CONSTRAINT "group_reading_sessions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id");


--
-- Name: group_reports group_reports_reported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_reports"
    ADD CONSTRAINT "group_reports_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id");


--
-- Name: group_reports group_reports_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_reports"
    ADD CONSTRAINT "group_reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id");


--
-- Name: group_rules group_rules_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_rules"
    ADD CONSTRAINT "group_rules_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;


--
-- Name: group_shared_documents group_shared_documents_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_shared_documents"
    ADD CONSTRAINT "group_shared_documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");


--
-- Name: group_tags group_tags_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_tags"
    ADD CONSTRAINT "group_tags_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;


--
-- Name: group_webhook_logs group_webhook_logs_webhook_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."group_webhook_logs"
    ADD CONSTRAINT "group_webhook_logs_webhook_id_fkey" FOREIGN KEY ("webhook_id") REFERENCES "public"."group_webhooks"("id") ON DELETE CASCADE;


--
-- Name: groups groups_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: image_tag_mappings image_tag_mappings_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."image_tag_mappings"
    ADD CONSTRAINT "image_tag_mappings_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;


--
-- Name: image_tag_mappings image_tag_mappings_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."image_tag_mappings"
    ADD CONSTRAINT "image_tag_mappings_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."image_tags"("id") ON DELETE CASCADE;


--
-- Name: images images_img_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_img_type_id_fkey" FOREIGN KEY ("img_type_id") REFERENCES "public"."image_types"("id") ON DELETE SET NULL;


--
-- Name: invoices invoices_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: invoices invoices_registration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."event_registrations"("id") ON DELETE CASCADE;


--
-- Name: invoices invoices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- Name: likes likes_feed_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_feed_entry_id_fkey" FOREIGN KEY ("feed_entry_id") REFERENCES "public"."feed_entries"("id") ON DELETE CASCADE;


--
-- Name: likes likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: list_followers list_followers_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."list_followers"
    ADD CONSTRAINT "list_followers_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."reading_lists"("id") ON DELETE CASCADE;


--
-- Name: list_followers list_followers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."list_followers"
    ADD CONSTRAINT "list_followers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: media_attachments media_attachments_feed_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."media_attachments"
    ADD CONSTRAINT "media_attachments_feed_entry_id_fkey" FOREIGN KEY ("feed_entry_id") REFERENCES "public"."feed_entries"("id") ON DELETE CASCADE;


--
-- Name: mentions mentions_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."mentions"
    ADD CONSTRAINT "mentions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;


--
-- Name: mentions mentions_feed_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."mentions"
    ADD CONSTRAINT "mentions_feed_entry_id_fkey" FOREIGN KEY ("feed_entry_id") REFERENCES "public"."feed_entries"("id") ON DELETE CASCADE;


--
-- Name: mentions mentions_mentioned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."mentions"
    ADD CONSTRAINT "mentions_mentioned_user_id_fkey" FOREIGN KEY ("mentioned_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: payment_methods payment_methods_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: payment_transactions payment_transactions_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: payment_transactions payment_transactions_payment_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id");


--
-- Name: payment_transactions payment_transactions_registration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."event_registrations"("id") ON DELETE CASCADE;


--
-- Name: payment_transactions payment_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- Name: personalized_recommendations personalized_recommendations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."personalized_recommendations"
    ADD CONSTRAINT "personalized_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: photo_albums photo_albums_cover_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."photo_albums"
    ADD CONSTRAINT "photo_albums_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;


--
-- Name: photo_albums photo_albums_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."photo_albums"
    ADD CONSTRAINT "photo_albums_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");


--
-- Name: posts posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: prices prices_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."prices"
    ADD CONSTRAINT "prices_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: profiles profiles_new_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_new_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");


--
-- Name: promo_codes promo_codes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");


--
-- Name: promo_codes promo_codes_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: publishers publishers_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."publishers"
    ADD CONSTRAINT "publishers_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON UPDATE CASCADE;


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
-- Name: reactions reactions_feed_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reactions"
    ADD CONSTRAINT "reactions_feed_entry_id_fkey" FOREIGN KEY ("feed_entry_id") REFERENCES "public"."feed_entries"("id") ON DELETE CASCADE;


--
-- Name: reactions reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reactions"
    ADD CONSTRAINT "reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: reading_challenges reading_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_challenges"
    ADD CONSTRAINT "reading_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: reading_goals reading_goals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_goals"
    ADD CONSTRAINT "reading_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: reading_list_items reading_list_items_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_list_items"
    ADD CONSTRAINT "reading_list_items_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: reading_list_items reading_list_items_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_list_items"
    ADD CONSTRAINT "reading_list_items_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."reading_lists"("id") ON DELETE CASCADE;


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
-- Name: reading_series reading_series_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_series"
    ADD CONSTRAINT "reading_series_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE SET NULL;


--
-- Name: reading_series reading_series_organizer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_series"
    ADD CONSTRAINT "reading_series_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id");


--
-- Name: reading_sessions reading_sessions_new_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_sessions"
    ADD CONSTRAINT "reading_sessions_new_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: reading_sessions reading_sessions_new_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_sessions"
    ADD CONSTRAINT "reading_sessions_new_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: reading_stats_daily reading_stats_daily_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_stats_daily"
    ADD CONSTRAINT "reading_stats_daily_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: reading_streaks reading_streaks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reading_streaks"
    ADD CONSTRAINT "reading_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: review_likes review_likes_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."review_likes"
    ADD CONSTRAINT "review_likes_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."book_reviews"("id") ON DELETE CASCADE;


--
-- Name: review_likes review_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."review_likes"
    ADD CONSTRAINT "review_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: reviews reviews_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: series_events series_events_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."series_events"
    ADD CONSTRAINT "series_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: series_events series_events_series_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."series_events"
    ADD CONSTRAINT "series_events_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "public"."reading_series"("id") ON DELETE CASCADE;


--
-- Name: session_registrations session_registrations_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."session_registrations"
    ADD CONSTRAINT "session_registrations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."event_sessions"("id") ON DELETE CASCADE;


--
-- Name: session_registrations session_registrations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."session_registrations"
    ADD CONSTRAINT "session_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- Name: similar_books similar_books_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."similar_books"
    ADD CONSTRAINT "similar_books_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: similar_books similar_books_similar_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."similar_books"
    ADD CONSTRAINT "similar_books_similar_book_id_fkey" FOREIGN KEY ("similar_book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: survey_questions survey_questions_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."survey_questions"
    ADD CONSTRAINT "survey_questions_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "public"."event_surveys"("id") ON DELETE CASCADE;


--
-- Name: survey_responses survey_responses_registration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."survey_responses"
    ADD CONSTRAINT "survey_responses_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."event_registrations"("id");


--
-- Name: survey_responses survey_responses_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."survey_responses"
    ADD CONSTRAINT "survey_responses_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "public"."event_surveys"("id") ON DELETE CASCADE;


--
-- Name: survey_responses survey_responses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."survey_responses"
    ADD CONSTRAINT "survey_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- Name: ticket_benefits ticket_benefits_ticket_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."ticket_benefits"
    ADD CONSTRAINT "ticket_benefits_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id") ON DELETE CASCADE;


--
-- Name: ticket_types ticket_types_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."ticket_types"
    ADD CONSTRAINT "ticket_types_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: tickets tickets_checked_in_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_checked_in_by_fkey" FOREIGN KEY ("checked_in_by") REFERENCES "public"."users"("id");


--
-- Name: tickets tickets_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: tickets tickets_registration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."event_registrations"("id") ON DELETE CASCADE;


--
-- Name: tickets tickets_ticket_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id");


--
-- Name: tickets tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- Name: user_book_interactions user_book_interactions_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_book_interactions"
    ADD CONSTRAINT "user_book_interactions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;


--
-- Name: user_book_interactions user_book_interactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_book_interactions"
    ADD CONSTRAINT "user_book_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: user_reading_preferences user_reading_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_reading_preferences"
    ADD CONSTRAINT "user_reading_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id");


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
-- Name: book_clubs Admins and moderators can update book clubs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins and moderators can update book clubs" ON "public"."book_clubs" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."book_club_members"
  WHERE (("book_club_members"."book_club_id" = "book_clubs"."id") AND ("book_club_members"."user_id" = "auth"."uid"()) AND (("book_club_members"."role")::"text" = ANY ((ARRAY['admin'::character varying, 'moderator'::character varying])::"text"[]))))));


--
-- Name: activity_log Admins and moderators can view activity log; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins and moderators can view activity log" ON "public"."activity_log" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role_id" IN ( SELECT "roles"."id"
           FROM "public"."roles"
          WHERE (("roles"."name")::"text" = ANY ((ARRAY['admin'::character varying, 'moderator'::character varying])::"text"[]))))))));


--
-- Name: book_clubs Admins can delete book clubs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete book clubs" ON "public"."book_clubs" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."book_club_members"
  WHERE (("book_club_members"."book_club_id" = "book_clubs"."id") AND ("book_club_members"."user_id" = "auth"."uid"()) AND (("book_club_members"."role")::"text" = 'admin'::"text")))));


--
-- Name: feed_entries Admins can do anything; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can do anything" ON "public"."feed_entries" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role_id" IN ( SELECT "roles"."id"
           FROM "public"."roles"
          WHERE (("roles"."name")::"text" = 'admin'::"text")))))));


--
-- Name: users Admins can do anything; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can do anything" ON "public"."users" USING (("public"."is_admin_safe"() OR (("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")));


--
-- Name: album_images Album images are viewable by album access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Album images are viewable by album access" ON "public"."album_images" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."photo_albums"
  WHERE (("photo_albums"."id" = "album_images"."album_id") AND (("photo_albums"."is_public" = true) OR ("photo_albums"."owner_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."album_shares"
          WHERE (("album_shares"."album_id" = "photo_albums"."id") AND (("album_shares"."shared_with" = "auth"."uid"()) OR (("album_shares"."share_type")::"text" = 'public'::"text"))))))))));


--
-- Name: feed_entries Allow private timeline entries to allowed users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow private timeline entries to allowed users" ON "public"."feed_entries" FOR SELECT USING ((("visibility" = 'private'::"text") AND ("auth"."uid"() = ANY ("allowed_user_ids"))));


--
-- Name: feed_entries Allow public timeline entries; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public timeline entries" ON "public"."feed_entries" FOR SELECT USING (("visibility" = 'public'::"text"));


--
-- Name: discussions Anyone can read book discussions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can read book discussions" ON "public"."discussions" FOR SELECT USING (true);


--
-- Name: discussion_comments Anyone can read discussion comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can read discussion comments" ON "public"."discussion_comments" FOR SELECT USING (true);


--
-- Name: discussions Authenticated users can create book discussions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can create book discussions" ON "public"."discussions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: discussion_comments Authenticated users can create discussion comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can create discussion comments" ON "public"."discussion_comments" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: contact_info Authenticated users can delete contact info; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can delete contact info" ON "public"."contact_info" FOR DELETE TO "authenticated" USING (true);


--
-- Name: contact_info Authenticated users can insert contact info; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can insert contact info" ON "public"."contact_info" FOR INSERT TO "authenticated" WITH CHECK (true);


--
-- Name: contact_info Authenticated users can update contact info; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can update contact info" ON "public"."contact_info" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);


--
-- Name: contact_info Authenticated users can view contact info; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can view contact info" ON "public"."contact_info" FOR SELECT TO "authenticated" USING (true);


--
-- Name: users Authenticated users can view other users' basic info; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can view other users' basic info" ON "public"."users" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: feed_entries Blocked users cannot see my entries; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Blocked users cannot see my entries" ON "public"."feed_entries" FOR SELECT USING ((NOT (EXISTS ( SELECT 1
   FROM "public"."blocks"
  WHERE (("blocks"."user_id" = "feed_entries"."user_id") AND ("blocks"."blocked_user_id" = "auth"."uid"()))))));


--
-- Name: contact_info Contact info can be deleted by authenticated users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Contact info can be deleted by authenticated users" ON "public"."contact_info" FOR DELETE TO "authenticated" USING (true);


--
-- Name: contact_info Contact info can be inserted by authenticated users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Contact info can be inserted by authenticated users" ON "public"."contact_info" FOR INSERT TO "authenticated" WITH CHECK (true);


--
-- Name: contact_info Contact info can be updated by authenticated users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Contact info can be updated by authenticated users" ON "public"."contact_info" FOR UPDATE TO "authenticated" USING (true);


--
-- Name: contact_info Contact info is viewable by authenticated users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Contact info is viewable by authenticated users" ON "public"."contact_info" FOR SELECT TO "authenticated" USING (true);


--
-- Name: feed_entries Custom allowed users can see entry; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Custom allowed users can see entry" ON "public"."feed_entries" FOR SELECT USING ((("visibility" = 'custom'::"text") AND ("is_hidden" = false) AND ("is_deleted" = false) AND ("allowed_user_ids" @> ARRAY["auth"."uid"()])));


--
-- Name: users Enable insert access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable insert access for all users" ON "public"."users" FOR INSERT WITH CHECK (true);


--
-- Name: feed_entries Friends can see friends-only entries; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Friends can see friends-only entries" ON "public"."feed_entries" FOR SELECT USING ((("visibility" = 'friends'::"text") AND ("is_hidden" = false) AND ("is_deleted" = false) AND (EXISTS ( SELECT 1
   FROM "public"."friends"
  WHERE ((("friends"."user_id" = "auth"."uid"()) AND ("friends"."friend_id" = "feed_entries"."user_id")) OR (("friends"."user_id" = "feed_entries"."user_id") AND ("friends"."friend_id" = "auth"."uid"()) AND ("friends"."status" = 'accepted'::"text")))))));


--
-- Name: group_members Group members are viewable by everyone; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Group members are viewable by everyone" ON "public"."group_members" FOR SELECT USING (true);


--
-- Name: groups Groups are viewable by everyone; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Groups are viewable by everyone" ON "public"."groups" FOR SELECT USING (true);


--
-- Name: book_club_discussion_comments Members can view book club discussion comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Members can view book club discussion comments" ON "public"."book_club_discussion_comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."book_club_discussions"
     JOIN "public"."book_club_members" ON (("book_club_discussions"."book_club_id" = "book_club_members"."book_club_id")))
  WHERE (("book_club_discussions"."id" = "book_club_discussion_comments"."discussion_id") AND ("book_club_members"."user_id" = "auth"."uid"())))));


--
-- Name: book_club_discussions Members can view book club discussions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Members can view book club discussions" ON "public"."book_club_discussions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."book_club_members"
  WHERE (("book_club_members"."book_club_id" = "book_club_discussions"."book_club_id") AND ("book_club_members"."user_id" = "auth"."uid"())))));


--
-- Name: book_clubs Members can view private book clubs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Members can view private book clubs" ON "public"."book_clubs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."book_club_members"
  WHERE (("book_club_members"."book_club_id" = "book_clubs"."id") AND ("book_club_members"."user_id" = "auth"."uid"())))));


--
-- Name: comments Moderators can hide or delete any comment; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Moderators can hide or delete any comment" ON "public"."comments" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role_id" IN ( SELECT "roles"."id"
           FROM "public"."roles"
          WHERE (("roles"."name")::"text" = ANY ((ARRAY['admin'::character varying, 'moderator'::character varying])::"text"[]))))))));


--
-- Name: feed_entries Only show non-deleted, non-hidden entries; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Only show non-deleted, non-hidden entries" ON "public"."feed_entries" FOR SELECT USING ((("is_deleted" = false) AND ("is_hidden" = false)));


--
-- Name: feed_entries Owner can do anything; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owner can do anything" ON "public"."feed_entries" USING (("user_id" = "auth"."uid"()));


--
-- Name: photo_albums Public albums are viewable by everyone; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public albums are viewable by everyone" ON "public"."photo_albums" FOR SELECT USING ((("is_public" = true) AND ("deleted_at" IS NULL)));


--
-- Name: book_clubs Public book clubs are viewable by everyone; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public book clubs are viewable by everyone" ON "public"."book_clubs" FOR SELECT USING (("is_private" = false));


--
-- Name: feed_entries Public entries are visible; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public entries are visible" ON "public"."feed_entries" FOR SELECT USING ((("visibility" = 'public'::"text") AND ("is_hidden" = false) AND ("is_deleted" = false)));


--
-- Name: media_attachments Select media for visible feed entries; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Select media for visible feed entries" ON "public"."media_attachments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."feed_entries"
  WHERE (("feed_entries"."id" = "media_attachments"."feed_entry_id") AND (("feed_entries"."visibility" = 'public'::"text") OR ("feed_entries"."user_id" = "auth"."uid"()) OR (("feed_entries"."visibility" = 'friends'::"text") AND ("feed_entries"."user_id" = "auth"."uid"())) OR (("feed_entries"."visibility" = 'group'::"text") AND ("feed_entries"."user_id" = "auth"."uid"())) OR (("feed_entries"."visibility" = 'custom'::"text") AND ("feed_entries"."allowed_user_ids" @> ARRAY["auth"."uid"()])))))));


--
-- Name: reactions Select reactions for visible feed entries; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Select reactions for visible feed entries" ON "public"."reactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."feed_entries"
  WHERE (("feed_entries"."id" = "reactions"."feed_entry_id") AND (("feed_entries"."visibility" = 'public'::"text") OR ("feed_entries"."user_id" = "auth"."uid"()) OR (("feed_entries"."visibility" = 'friends'::"text") AND ("reactions"."user_id" = "auth"."uid"())) OR (("feed_entries"."visibility" = 'group'::"text") AND ("reactions"."user_id" = "auth"."uid"())) OR (("feed_entries"."visibility" = 'custom'::"text") AND ("feed_entries"."allowed_user_ids" @> ARRAY["auth"."uid"()])))))));


--
-- Name: feed_entry_tags Select tags for visible feed entries; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Select tags for visible feed entries" ON "public"."feed_entry_tags" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."feed_entries"
  WHERE (("feed_entries"."id" = "feed_entry_tags"."feed_entry_id") AND (("feed_entries"."visibility" = 'public'::"text") OR ("feed_entries"."user_id" = "auth"."uid"()) OR (("feed_entries"."visibility" = 'friends'::"text") AND ("feed_entries"."user_id" = "auth"."uid"())) OR (("feed_entries"."visibility" = 'group'::"text") AND ("feed_entries"."user_id" = "auth"."uid"())) OR (("feed_entries"."visibility" = 'custom'::"text") AND ("feed_entries"."allowed_user_ids" @> ARRAY["auth"."uid"()])))))));


--
-- Name: users Service role has full access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Service role has full access" ON "public"."users" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));


--
-- Name: activities System can insert activities; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "System can insert activities" ON "public"."activities" FOR INSERT WITH CHECK (true);


--
-- Name: groups Users can create groups; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create groups" ON "public"."groups" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));


--
-- Name: photo_albums Users can create their own albums; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own albums" ON "public"."photo_albums" FOR INSERT WITH CHECK (("owner_id" = "auth"."uid"()));


--
-- Name: reading_list_items Users can delete items from their own lists; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete items from their own lists" ON "public"."reading_list_items" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."reading_lists"
  WHERE (("reading_lists"."id" = "reading_list_items"."list_id") AND ("reading_lists"."user_id" = "auth"."uid"())))));


--
-- Name: media_attachments Users can delete media for their own feed entries; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete media for their own feed entries" ON "public"."media_attachments" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."feed_entries"
  WHERE (("feed_entries"."id" = "media_attachments"."feed_entry_id") AND ("feed_entries"."user_id" = "auth"."uid"())))));


--
-- Name: mentions Users can delete mentions they created; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete mentions they created" ON "public"."mentions" FOR DELETE USING (((EXISTS ( SELECT 1
   FROM "public"."feed_entries"
  WHERE (("feed_entries"."id" = "mentions"."feed_entry_id") AND ("feed_entries"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."comments"
  WHERE (("comments"."id" = "mentions"."comment_id") AND ("comments"."user_id" = "auth"."uid"()))))));


--
-- Name: feed_entry_tags Users can delete tags for their own feed entries; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete tags for their own feed entries" ON "public"."feed_entry_tags" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."feed_entries"
  WHERE (("feed_entries"."id" = "feed_entry_tags"."feed_entry_id") AND ("feed_entries"."user_id" = "auth"."uid"())))));


--
-- Name: photo_albums Users can delete their own albums; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own albums" ON "public"."photo_albums" FOR DELETE USING (("owner_id" = "auth"."uid"()));


--
-- Name: discussions Users can delete their own book discussions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own book discussions" ON "public"."discussions" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));


--
-- Name: book_reviews Users can delete their own book reviews; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own book reviews" ON "public"."book_reviews" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));


--
-- Name: discussion_comments Users can delete their own discussion comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own discussion comments" ON "public"."discussion_comments" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));


--
-- Name: friends Users can delete their own friendships; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own friendships" ON "public"."friends" FOR DELETE USING ((("user_id" = "auth"."uid"()) OR ("friend_id" = "auth"."uid"())));


--
-- Name: review_likes Users can delete their own likes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own likes" ON "public"."review_likes" FOR DELETE USING (("auth"."uid"() = "user_id"));


--
-- Name: list_followers Users can delete their own list follows; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own list follows" ON "public"."list_followers" FOR DELETE USING (("auth"."uid"() = "user_id"));


--
-- Name: reactions Users can delete their own reactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own reactions" ON "public"."reactions" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: reading_goals Users can delete their own reading goals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own reading goals" ON "public"."reading_goals" FOR DELETE USING (("auth"."uid"() = "user_id"));


--
-- Name: reading_lists Users can delete their own reading lists; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own reading lists" ON "public"."reading_lists" FOR DELETE USING (("auth"."uid"() = "user_id"));


--
-- Name: reading_list_items Users can insert items into their own lists; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert items into their own lists" ON "public"."reading_list_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."reading_lists"
  WHERE (("reading_lists"."id" = "reading_list_items"."list_id") AND ("reading_lists"."user_id" = "auth"."uid"())))));


--
-- Name: media_attachments Users can insert media for their own feed entries; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert media for their own feed entries" ON "public"."media_attachments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."feed_entries"
  WHERE (("feed_entries"."id" = "media_attachments"."feed_entry_id") AND ("feed_entries"."user_id" = "auth"."uid"())))));


--
-- Name: mentions Users can insert mentions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert mentions" ON "public"."mentions" FOR INSERT WITH CHECK (true);


--
-- Name: feed_entry_tags Users can insert tags for their own feed entries; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert tags for their own feed entries" ON "public"."feed_entry_tags" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."feed_entries"
  WHERE (("feed_entries"."id" = "feed_entry_tags"."feed_entry_id") AND ("feed_entries"."user_id" = "auth"."uid"())))));


--
-- Name: book_reviews Users can insert their own book reviews; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own book reviews" ON "public"."book_reviews" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: user_book_interactions Users can insert their own interactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own interactions" ON "public"."user_book_interactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: review_likes Users can insert their own likes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own likes" ON "public"."review_likes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: list_followers Users can insert their own list follows; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own list follows" ON "public"."list_followers" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: user_reading_preferences Users can insert their own preferences; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own preferences" ON "public"."user_reading_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: reactions Users can insert their own reactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own reactions" ON "public"."reactions" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: reading_challenges Users can insert their own reading challenges; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own reading challenges" ON "public"."reading_challenges" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: reading_goals Users can insert their own reading goals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own reading goals" ON "public"."reading_goals" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: reading_lists Users can insert their own reading lists; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own reading lists" ON "public"."reading_lists" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: reading_progress Users can insert their own reading progress; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own reading progress" ON "public"."reading_progress" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: group_members Users can join public groups; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can join public groups" ON "public"."group_members" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND (("status")::"text" = 'active'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."groups"
  WHERE (("groups"."id" = "group_members"."group_id") AND ("groups"."is_private" = false))))));


--
-- Name: mentions Users can see their own mentions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can see their own mentions" ON "public"."mentions" FOR SELECT USING (("mentioned_user_id" = "auth"."uid"()));


--
-- Name: notifications Users can see their own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can see their own notifications" ON "public"."notifications" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: friends Users can send friend requests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can send friend requests" ON "public"."friends" FOR INSERT WITH CHECK ((("requested_by" = "auth"."uid"()) AND ("user_id" = "auth"."uid"())));


--
-- Name: reading_list_items Users can update items in their own lists; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update items in their own lists" ON "public"."reading_list_items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."reading_lists"
  WHERE (("reading_lists"."id" = "reading_list_items"."list_id") AND ("reading_lists"."user_id" = "auth"."uid"())))));


--
-- Name: users Users can update own data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own data" ON "public"."users" FOR UPDATE USING ((("auth"."uid"())::"text" = ("id")::"text"));


--
-- Name: photo_albums Users can update their own albums; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own albums" ON "public"."photo_albums" FOR UPDATE USING (("owner_id" = "auth"."uid"()));


--
-- Name: discussions Users can update their own book discussions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own book discussions" ON "public"."discussions" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));


--
-- Name: book_reviews Users can update their own book reviews; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own book reviews" ON "public"."book_reviews" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));


--
-- Name: discussion_comments Users can update their own discussion comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own discussion comments" ON "public"."discussion_comments" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));


--
-- Name: friends Users can update their own friendships; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own friendships" ON "public"."friends" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR ("friend_id" = "auth"."uid"())));


--
-- Name: user_book_interactions Users can update their own interactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own interactions" ON "public"."user_book_interactions" FOR UPDATE USING (("auth"."uid"() = "user_id"));


--
-- Name: notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));


--
-- Name: user_reading_preferences Users can update their own preferences; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own preferences" ON "public"."user_reading_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));


--
-- Name: reading_challenges Users can update their own reading challenges; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own reading challenges" ON "public"."reading_challenges" FOR UPDATE USING (("auth"."uid"() = "user_id"));


--
-- Name: reading_goals Users can update their own reading goals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own reading goals" ON "public"."reading_goals" FOR UPDATE USING (("auth"."uid"() = "user_id"));


--
-- Name: reading_lists Users can update their own reading lists; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own reading lists" ON "public"."reading_lists" FOR UPDATE USING (("auth"."uid"() = "user_id"));


--
-- Name: reading_progress Users can update their own reading progress; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own reading progress" ON "public"."reading_progress" FOR UPDATE USING (("auth"."uid"() = "user_id"));


--
-- Name: personalized_recommendations Users can update their own recommendations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own recommendations" ON "public"."personalized_recommendations" FOR UPDATE USING (("auth"."uid"() = "user_id"));


--
-- Name: book_reviews Users can view all book reviews; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view all book reviews" ON "public"."book_reviews" FOR SELECT TO "authenticated" USING (true);


--
-- Name: list_followers Users can view all list followers; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view all list followers" ON "public"."list_followers" FOR SELECT USING (true);


--
-- Name: review_likes Users can view all review likes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view all review likes" ON "public"."review_likes" FOR SELECT USING (true);


--
-- Name: reading_list_items Users can view items in public lists or their own lists; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view items in public lists or their own lists" ON "public"."reading_list_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."reading_lists"
  WHERE (("reading_lists"."id" = "reading_list_items"."list_id") AND (("reading_lists"."is_public" = true) OR ("reading_lists"."user_id" = "auth"."uid"()))))));


--
-- Name: users Users can view own data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own data" ON "public"."users" FOR SELECT USING ((("auth"."uid"())::"text" = ("id")::"text"));


--
-- Name: reading_lists Users can view public reading lists; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view public reading lists" ON "public"."reading_lists" FOR SELECT USING ((("is_public" = true) OR ("auth"."uid"() = "user_id")));


--
-- Name: photo_albums Users can view their own albums; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own albums" ON "public"."photo_albums" FOR SELECT USING ((("owner_id" = "auth"."uid"()) AND ("deleted_at" IS NULL)));


--
-- Name: reading_stats_daily Users can view their own daily stats; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own daily stats" ON "public"."reading_stats_daily" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: friends Users can view their own friendships; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own friendships" ON "public"."friends" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("friend_id" = "auth"."uid"())));


--
-- Name: user_book_interactions Users can view their own interactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own interactions" ON "public"."user_book_interactions" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: notifications Users can view their own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: user_reading_preferences Users can view their own preferences; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own preferences" ON "public"."user_reading_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: reading_challenges Users can view their own reading challenges; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own reading challenges" ON "public"."reading_challenges" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: reading_goals Users can view their own reading goals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own reading goals" ON "public"."reading_goals" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: reading_progress Users can view their own reading progress; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own reading progress" ON "public"."reading_progress" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: reading_streaks Users can view their own reading streaks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own reading streaks" ON "public"."reading_streaks" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: book_recommendations Users can view their own recommendations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own recommendations" ON "public"."book_recommendations" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: personalized_recommendations Users can view their own recommendations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own recommendations" ON "public"."personalized_recommendations" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: activities; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;

--
-- Name: activity_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."activity_log" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_book_list_items added_by_can_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "added_by_can_delete" ON "public"."group_book_list_items" FOR DELETE USING (("added_by" = "auth"."uid"()));


--
-- Name: group_book_wishlist_items added_by_can_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "added_by_can_delete" ON "public"."group_book_wishlist_items" FOR DELETE USING (("added_by" = "auth"."uid"()));


--
-- Name: group_book_list_items added_by_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "added_by_can_modify" ON "public"."group_book_list_items" FOR UPDATE USING (("added_by" = "auth"."uid"()));


--
-- Name: group_book_wishlist_items added_by_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "added_by_can_modify" ON "public"."group_book_wishlist_items" FOR UPDATE USING (("added_by" = "auth"."uid"()));


--
-- Name: authors admin_author_manage; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin_author_manage" ON "public"."authors" USING ("public"."is_admin_safe"());


--
-- Name: books admin_book_manage; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin_book_manage" ON "public"."books" USING ("public"."is_admin_safe"());


--
-- Name: event_approvals admin_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin_can_select" ON "public"."event_approvals" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));


--
-- Name: event_financials admin_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin_can_select" ON "public"."event_financials" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));


--
-- Name: event_permission_requests admin_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin_can_select" ON "public"."event_permission_requests" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));


--
-- Name: group_audit_log admin_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin_can_select" ON "public"."group_audit_log" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));


--
-- Name: group_content_moderation_logs admin_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin_can_select" ON "public"."group_content_moderation_logs" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));


--
-- Name: group_moderation_logs admin_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin_can_select" ON "public"."group_moderation_logs" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));


--
-- Name: payment_transactions admin_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin_can_select" ON "public"."payment_transactions" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));


--
-- Name: binding_types admin_only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin_only" ON "public"."binding_types" USING ("public"."is_admin_safe"());


--
-- Name: id_mappings admin_only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin_only" ON "public"."id_mappings" USING ("public"."is_admin_safe"());


--
-- Name: sync_state admin_only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin_only" ON "public"."sync_state" USING ("public"."is_admin_safe"());


--
-- Name: publishers admin_publisher_manage; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin_publisher_manage" ON "public"."publishers" USING ("public"."is_admin_safe"());


--
-- Name: album_analytics; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."album_analytics" ENABLE ROW LEVEL SECURITY;

--
-- Name: album_images; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."album_images" ENABLE ROW LEVEL SECURITY;

--
-- Name: album_images album_owner_can_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "album_owner_can_delete" ON "public"."album_images" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."photo_albums"
  WHERE (("photo_albums"."id" = "album_images"."album_id") AND ("photo_albums"."owner_id" = "auth"."uid"())))));


--
-- Name: album_images album_owner_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "album_owner_can_modify" ON "public"."album_images" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."photo_albums"
  WHERE (("photo_albums"."id" = "album_images"."album_id") AND ("photo_albums"."owner_id" = "auth"."uid"())))));


--
-- Name: album_analytics album_owner_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "album_owner_can_select" ON "public"."album_analytics" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."photo_albums"
  WHERE (("photo_albums"."id" = "album_analytics"."album_id") AND ("photo_albums"."owner_id" = "auth"."uid"())))));


--
-- Name: album_images album_owner_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "album_owner_can_select" ON "public"."album_images" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."photo_albums"
  WHERE (("photo_albums"."id" = "album_images"."album_id") AND ("photo_albums"."owner_id" = "auth"."uid"())))));


--
-- Name: album_shares; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."album_shares" ENABLE ROW LEVEL SECURITY;

--
-- Name: blocks authenticated_users_crud; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "authenticated_users_crud" ON "public"."blocks" USING (("auth"."uid"() IS NOT NULL));


--
-- Name: comments authenticated_users_crud; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "authenticated_users_crud" ON "public"."comments" USING (("auth"."uid"() IS NOT NULL));


--
-- Name: follows authenticated_users_crud; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "authenticated_users_crud" ON "public"."follows" USING (("auth"."uid"() IS NOT NULL));


--
-- Name: likes authenticated_users_crud; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "authenticated_users_crud" ON "public"."likes" USING (("auth"."uid"() IS NOT NULL));


--
-- Name: posts authenticated_users_crud; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "authenticated_users_crud" ON "public"."posts" USING (("auth"."uid"() IS NOT NULL));


--
-- Name: reading_sessions authenticated_users_crud; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "authenticated_users_crud" ON "public"."reading_sessions" USING (("auth"."uid"() IS NOT NULL));


--
-- Name: reviews authenticated_users_crud; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "authenticated_users_crud" ON "public"."reviews" USING (("auth"."uid"() IS NOT NULL));


--
-- Name: authors; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."authors" ENABLE ROW LEVEL SECURITY;

--
-- Name: binding_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."binding_types" ENABLE ROW LEVEL SECURITY;

--
-- Name: blocks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."blocks" ENABLE ROW LEVEL SECURITY;

--
-- Name: blocks blocks_authenticated_crud; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "blocks_authenticated_crud" ON "public"."blocks" USING (("auth"."uid"() IS NOT NULL));


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
-- Name: book_id_mapping; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."book_id_mapping" ENABLE ROW LEVEL SECURITY;

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
-- Name: book_views book_views_owner_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "book_views_owner_access" ON "public"."book_views" USING (("auth"."uid"() = "user_id"));


--
-- Name: book_views book_views_public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "book_views_public_read" ON "public"."book_views" FOR SELECT USING (true);


--
-- Name: books; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."books" ENABLE ROW LEVEL SECURITY;

--
-- Name: books books_admin_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "books_admin_delete" ON "public"."books" FOR DELETE USING ("public"."is_admin_safe"());


--
-- Name: POLICY "books_admin_delete" ON "books"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY "books_admin_delete" ON "public"."books" IS 'Allow only admin users to delete books';


--
-- Name: books books_admin_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "books_admin_insert" ON "public"."books" FOR INSERT WITH CHECK ("public"."is_admin_safe"());


--
-- Name: POLICY "books_admin_insert" ON "books"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY "books_admin_insert" ON "public"."books" IS 'Allow only admin users to insert new books';


--
-- Name: books books_admin_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "books_admin_update" ON "public"."books" FOR UPDATE USING ("public"."is_admin_safe"());


--
-- Name: POLICY "books_admin_update" ON "books"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY "books_admin_update" ON "public"."books" IS 'Allow only admin users to update books';


--
-- Name: books books_public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "books_public_read" ON "public"."books" FOR SELECT USING (true);


--
-- Name: POLICY "books_public_read" ON "books"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY "books_public_read" ON "public"."books" IS 'Allow public read access to all books';


--
-- Name: books books_service_role_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "books_service_role_access" ON "public"."books" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));


--
-- Name: POLICY "books_service_role_access" ON "books"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY "books_service_role_access" ON "public"."books" IS 'Allow service role full access for API operations';


--
-- Name: carousel_images; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."carousel_images" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_reading_challenge_progress challenge_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "challenge_member_can_select" ON "public"."group_reading_challenge_progress" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."group_reading_challenges"
     JOIN "public"."group_members" ON (("group_reading_challenges"."group_id" = "group_members"."group_id")))
  WHERE (("group_reading_challenges"."id" = "group_reading_challenge_progress"."challenge_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_chat_message_attachments chat_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "chat_member_can_select" ON "public"."group_chat_message_attachments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."group_chat_messages"
     JOIN "public"."group_chat_channels" ON (("group_chat_messages"."channel_id" = "group_chat_channels"."id")))
     JOIN "public"."group_members" ON (("group_chat_channels"."group_id" = "group_members"."group_id")))
  WHERE (("group_chat_messages"."id" = "group_chat_message_attachments"."message_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_chat_message_reactions chat_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "chat_member_can_select" ON "public"."group_chat_message_reactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."group_chat_messages"
     JOIN "public"."group_chat_channels" ON (("group_chat_messages"."channel_id" = "group_chat_channels"."id")))
     JOIN "public"."group_members" ON (("group_chat_channels"."group_id" = "group_members"."group_id")))
  WHERE (("group_chat_messages"."id" = "group_chat_message_reactions"."message_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_chat_messages chat_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "chat_member_can_select" ON "public"."group_chat_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."group_chat_channels"
     JOIN "public"."group_members" ON (("group_chat_channels"."group_id" = "group_members"."group_id")))
  WHERE (("group_chat_channels"."id" = "group_chat_messages"."channel_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: event_chat_messages chat_room_participant_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "chat_room_participant_can_select" ON "public"."event_chat_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."event_chat_rooms"
     JOIN "public"."event_registrations" ON (("event_chat_rooms"."event_id" = "event_registrations"."event_id")))
  WHERE (("event_chat_rooms"."id" = "event_chat_messages"."chat_room_id") AND ("event_registrations"."user_id" = "auth"."uid"())))));


--
-- Name: group_onboarding_progress checklist_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "checklist_member_can_select" ON "public"."group_onboarding_progress" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."group_onboarding_checklists"
     JOIN "public"."group_members" ON (("group_onboarding_checklists"."group_id" = "group_members"."group_id")))
  WHERE (("group_onboarding_checklists"."id" = "group_onboarding_progress"."checklist_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_onboarding_tasks checklist_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "checklist_member_can_select" ON "public"."group_onboarding_tasks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."group_onboarding_checklists"
     JOIN "public"."group_members" ON (("group_onboarding_checklists"."group_id" = "group_members"."group_id")))
  WHERE (("group_onboarding_checklists"."id" = "group_onboarding_tasks"."checklist_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: book_club_books club_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "club_member_can_select" ON "public"."book_club_books" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."book_club_members"
  WHERE (("book_club_members"."book_club_id" = "book_club_books"."book_club_id") AND ("book_club_members"."user_id" = "auth"."uid"())))));


--
-- Name: book_club_discussion_comments club_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "club_member_can_select" ON "public"."book_club_discussion_comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."book_club_discussions"
     JOIN "public"."book_club_members" ON (("book_club_discussions"."book_club_id" = "book_club_members"."book_club_id")))
  WHERE (("book_club_discussions"."id" = "book_club_discussion_comments"."discussion_id") AND ("book_club_members"."user_id" = "auth"."uid"())))));


--
-- Name: book_club_discussions club_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "club_member_can_select" ON "public"."book_club_discussions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."book_club_members"
  WHERE (("book_club_members"."book_club_id" = "book_club_discussions"."book_club_id") AND ("book_club_members"."user_id" = "auth"."uid"())))));


--
-- Name: book_club_members club_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "club_member_can_select" ON "public"."book_club_members" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."book_club_members" "bcm"
  WHERE (("bcm"."book_club_id" = "book_club_members"."book_club_id") AND ("bcm"."user_id" = "auth"."uid"())))));


--
-- Name: book_clubs club_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "club_member_can_select" ON "public"."book_clubs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."book_club_members"
  WHERE (("book_club_members"."book_club_id" = "book_clubs"."id") AND ("book_club_members"."user_id" = "auth"."uid"())))));


--
-- Name: comments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_info; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."contact_info" ENABLE ROW LEVEL SECURITY;

--
-- Name: countries; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."countries" ENABLE ROW LEVEL SECURITY;

--
-- Name: book_club_discussion_comments creator_can_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "creator_can_delete" ON "public"."book_club_discussion_comments" FOR DELETE USING (("created_by" = "auth"."uid"()));


--
-- Name: book_club_discussions creator_can_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "creator_can_delete" ON "public"."book_club_discussions" FOR DELETE USING (("created_by" = "auth"."uid"()));


--
-- Name: book_clubs creator_can_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "creator_can_delete" ON "public"."book_clubs" FOR DELETE USING (("created_by" = "auth"."uid"()));


--
-- Name: group_announcements creator_can_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "creator_can_delete" ON "public"."group_announcements" FOR DELETE USING (("created_by" = "auth"."uid"()));


--
-- Name: group_book_lists creator_can_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "creator_can_delete" ON "public"."group_book_lists" FOR DELETE USING (("created_by" = "auth"."uid"()));


--
-- Name: group_book_wishlists creator_can_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "creator_can_delete" ON "public"."group_book_wishlists" FOR DELETE USING (("created_by" = "auth"."uid"()));


--
-- Name: group_polls creator_can_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "creator_can_delete" ON "public"."group_polls" FOR DELETE USING (("created_by" = "auth"."uid"()));


--
-- Name: group_reading_challenges creator_can_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "creator_can_delete" ON "public"."group_reading_challenges" FOR DELETE USING (("created_by" = "auth"."uid"()));


--
-- Name: group_reading_sessions creator_can_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "creator_can_delete" ON "public"."group_reading_sessions" FOR DELETE USING (("created_by" = "auth"."uid"()));


--
-- Name: promo_codes creator_can_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "creator_can_delete" ON "public"."promo_codes" FOR DELETE USING (("created_by" = "auth"."uid"()));


--
-- Name: book_club_discussion_comments creator_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "creator_can_modify" ON "public"."book_club_discussion_comments" FOR UPDATE USING (("created_by" = "auth"."uid"()));


--
-- Name: book_club_discussions creator_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "creator_can_modify" ON "public"."book_club_discussions" FOR UPDATE USING (("created_by" = "auth"."uid"()));


--
-- Name: book_clubs creator_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "creator_can_modify" ON "public"."book_clubs" FOR UPDATE USING (("created_by" = "auth"."uid"()));


--
-- Name: group_announcements creator_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "creator_can_modify" ON "public"."group_announcements" FOR UPDATE USING (("created_by" = "auth"."uid"()));


--
-- Name: group_book_lists creator_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "creator_can_modify" ON "public"."group_book_lists" FOR UPDATE USING (("created_by" = "auth"."uid"()));


--
-- Name: group_book_wishlists creator_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "creator_can_modify" ON "public"."group_book_wishlists" FOR UPDATE USING (("created_by" = "auth"."uid"()));


--
-- Name: group_polls creator_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "creator_can_modify" ON "public"."group_polls" FOR UPDATE USING (("created_by" = "auth"."uid"()));


--
-- Name: group_reading_challenges creator_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "creator_can_modify" ON "public"."group_reading_challenges" FOR UPDATE USING (("created_by" = "auth"."uid"()));


--
-- Name: group_reading_sessions creator_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "creator_can_modify" ON "public"."group_reading_sessions" FOR UPDATE USING (("created_by" = "auth"."uid"()));


--
-- Name: promo_codes creator_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "creator_can_modify" ON "public"."promo_codes" FOR UPDATE USING (("created_by" = "auth"."uid"()));


--
-- Name: discussion_comments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."discussion_comments" ENABLE ROW LEVEL SECURITY;

--
-- Name: discussions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."discussions" ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_info entity_owner_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "entity_owner_can_modify" ON "public"."contact_info" FOR UPDATE USING (((("entity_type" = 'user'::"text") AND ("entity_id" = ("auth"."uid"())::"text")) OR (("entity_type" = 'author'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."authors"
  WHERE (("authors"."id")::"text" = "contact_info"."entity_id")))) OR (("entity_type" = 'publisher'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."publishers"
  WHERE (("publishers"."id")::"text" = "contact_info"."entity_id"))))));


--
-- Name: contact_info entity_owner_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "entity_owner_can_select" ON "public"."contact_info" FOR SELECT USING (((("entity_type" = 'user'::"text") AND ("entity_id" = ("auth"."uid"())::"text")) OR (("entity_type" = 'author'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."authors"
  WHERE (("authors"."id")::"text" = "contact_info"."entity_id")))) OR (("entity_type" = 'publisher'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."publishers"
  WHERE (("publishers"."id")::"text" = "contact_info"."entity_id"))))));


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
-- Name: event_approvals event_creator_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_creator_can_select" ON "public"."event_approvals" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "event_approvals"."event_id") AND ("events"."created_by" = "auth"."uid"())))));


--
-- Name: event_financials event_creator_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_creator_can_select" ON "public"."event_financials" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "event_financials"."event_id") AND ("events"."created_by" = "auth"."uid"())))));


--
-- Name: event_registrations event_creator_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_creator_can_select" ON "public"."event_registrations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "event_registrations"."event_id") AND ("events"."created_by" = "auth"."uid"())))));


--
-- Name: event_waitlists event_creator_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_creator_can_select" ON "public"."event_waitlists" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "event_waitlists"."event_id") AND ("events"."created_by" = "auth"."uid"())))));


--
-- Name: payment_transactions event_creator_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_creator_can_select" ON "public"."payment_transactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "payment_transactions"."event_id") AND ("events"."created_by" = "auth"."uid"())))));


--
-- Name: promo_codes event_creator_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_creator_can_select" ON "public"."promo_codes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "promo_codes"."event_id") AND ("events"."created_by" = "auth"."uid"())))));


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
-- Name: events event_owner_manage; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_owner_manage" ON "public"."events" USING ((("auth"."uid"() = "created_by") OR "public"."is_admin_safe"()));


--
-- Name: event_analytics event_participant_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_participant_can_select" ON "public"."event_analytics" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."event_registrations"
  WHERE (("event_registrations"."event_id" = "event_analytics"."event_id") AND ("event_registrations"."user_id" = "auth"."uid"())))));


--
-- Name: event_books event_participant_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_participant_can_select" ON "public"."event_books" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."event_registrations"
  WHERE (("event_registrations"."event_id" = "event_books"."event_id") AND ("event_registrations"."user_id" = "auth"."uid"())))));


--
-- Name: event_chat_rooms event_participant_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_participant_can_select" ON "public"."event_chat_rooms" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."event_registrations"
  WHERE (("event_registrations"."event_id" = "event_chat_rooms"."event_id") AND ("event_registrations"."user_id" = "auth"."uid"())))));


--
-- Name: event_comments event_participant_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_participant_can_select" ON "public"."event_comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."event_registrations"
  WHERE (("event_registrations"."event_id" = "event_comments"."event_id") AND ("event_registrations"."user_id" = "auth"."uid"())))));


--
-- Name: event_interests event_participant_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_participant_can_select" ON "public"."event_interests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."event_registrations"
  WHERE (("event_registrations"."event_id" = "event_interests"."event_id") AND ("event_registrations"."user_id" = "auth"."uid"())))));


--
-- Name: event_likes event_participant_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_participant_can_select" ON "public"."event_likes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."event_registrations"
  WHERE (("event_registrations"."event_id" = "event_likes"."event_id") AND ("event_registrations"."user_id" = "auth"."uid"())))));


--
-- Name: event_livestreams event_participant_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_participant_can_select" ON "public"."event_livestreams" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."event_registrations"
  WHERE (("event_registrations"."event_id" = "event_livestreams"."event_id") AND ("event_registrations"."user_id" = "auth"."uid"())))));


--
-- Name: event_locations event_participant_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_participant_can_select" ON "public"."event_locations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."event_registrations"
  WHERE (("event_registrations"."event_id" = "event_locations"."event_id") AND ("event_registrations"."user_id" = "auth"."uid"())))));


--
-- Name: event_media event_participant_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_participant_can_select" ON "public"."event_media" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."event_registrations"
  WHERE (("event_registrations"."event_id" = "event_media"."event_id") AND ("event_registrations"."user_id" = "auth"."uid"())))));


--
-- Name: event_questions event_participant_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_participant_can_select" ON "public"."event_questions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."event_registrations"
  WHERE (("event_registrations"."event_id" = "event_questions"."event_id") AND ("event_registrations"."user_id" = "auth"."uid"())))));


--
-- Name: event_sessions event_participant_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_participant_can_select" ON "public"."event_sessions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."event_registrations"
  WHERE (("event_registrations"."event_id" = "event_sessions"."event_id") AND ("event_registrations"."user_id" = "auth"."uid"())))));


--
-- Name: event_speakers event_participant_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_participant_can_select" ON "public"."event_speakers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."event_registrations"
  WHERE (("event_registrations"."event_id" = "event_speakers"."event_id") AND ("event_registrations"."user_id" = "auth"."uid"())))));


--
-- Name: event_sponsors event_participant_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_participant_can_select" ON "public"."event_sponsors" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."event_registrations"
  WHERE (("event_registrations"."event_id" = "event_sponsors"."event_id") AND ("event_registrations"."user_id" = "auth"."uid"())))));


--
-- Name: event_staff event_participant_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_participant_can_select" ON "public"."event_staff" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."event_registrations"
  WHERE (("event_registrations"."event_id" = "event_staff"."event_id") AND ("event_registrations"."user_id" = "auth"."uid"())))));


--
-- Name: event_surveys event_participant_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_participant_can_select" ON "public"."event_surveys" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."event_registrations"
  WHERE (("event_registrations"."event_id" = "event_surveys"."event_id") AND ("event_registrations"."user_id" = "auth"."uid"())))));


--
-- Name: event_tags event_participant_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_participant_can_select" ON "public"."event_tags" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."event_registrations"
  WHERE (("event_registrations"."event_id" = "event_tags"."event_id") AND ("event_registrations"."user_id" = "auth"."uid"())))));


--
-- Name: event_views event_participant_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_participant_can_select" ON "public"."event_views" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."event_registrations"
  WHERE (("event_registrations"."event_id" = "event_views"."event_id") AND ("event_registrations"."user_id" = "auth"."uid"())))));


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
-- Name: follows follows_authenticated_crud; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "follows_authenticated_crud" ON "public"."follows" USING (("auth"."uid"() IS NOT NULL));


--
-- Name: format_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."format_types" ENABLE ROW LEVEL SECURITY;

--
-- Name: friends; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."friends" ENABLE ROW LEVEL SECURITY;

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
-- Name: group_events group_member_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_access" ON "public"."group_events" USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_events"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_member_achievements; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."group_member_achievements" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_achievements group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_achievements" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_achievements"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_analytics group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_analytics" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_analytics"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_announcements group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_announcements" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_announcements"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_author_events group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_author_events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_author_events"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_book_lists group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_book_lists" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_book_lists"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_book_reviews group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_book_reviews" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_book_reviews"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_book_swaps group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_book_swaps" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_book_swaps"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_book_wishlists group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_book_wishlists" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_book_wishlists"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_bots group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_bots" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_bots"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_chat_channels group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_chat_channels" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_chat_channels"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_custom_fields group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_custom_fields" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_custom_fields"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_discussion_categories group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_discussion_categories" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_discussion_categories"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_event_feedback group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_event_feedback" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."group_events"
     JOIN "public"."group_members" ON (("group_events"."group_id" = "group_members"."group_id")))
  WHERE (("group_events"."id" = "group_event_feedback"."event_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_events group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_events"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_integrations group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_integrations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_integrations"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_invites group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_invites" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_invites"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_leaderboards group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_leaderboards" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_leaderboards"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_member_achievements group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_member_achievements" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."group_achievements"
     JOIN "public"."group_members" ON (("group_achievements"."group_id" = "group_members"."group_id")))
  WHERE (("group_achievements"."id" = "group_member_achievements"."achievement_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_member_streaks group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_member_streaks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_member_streaks"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_members group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_members" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members" "gm"
  WHERE (("gm"."group_id" = "group_members"."group_id") AND ("gm"."user_id" = "auth"."uid"())))));


--
-- Name: group_membership_questions group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_membership_questions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_membership_questions"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_onboarding_checklists group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_onboarding_checklists" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_onboarding_checklists"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_polls group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_polls" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_polls"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_reading_challenges group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_reading_challenges" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_reading_challenges"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_reading_progress group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_reading_progress" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_reading_progress"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_reading_sessions group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_reading_sessions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_reading_sessions"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_reports group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_reports" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_reports"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_roles group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_roles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_roles"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_rules group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_rules" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_rules"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_shared_documents group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_shared_documents" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_shared_documents"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_tags group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_tags" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_tags"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_webhook_logs group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_webhook_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."group_webhooks"
     JOIN "public"."group_members" ON (("group_webhooks"."group_id" = "group_members"."group_id")))
  WHERE (("group_webhooks"."id" = "group_webhook_logs"."webhook_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_webhooks group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_webhooks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_webhooks"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: group_welcome_messages group_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "group_member_can_select" ON "public"."group_welcome_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_welcome_messages"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));


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
-- Name: image_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."image_types" ENABLE ROW LEVEL SECURITY;

--
-- Name: images; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."images" ENABLE ROW LEVEL SECURITY;

--
-- Name: images images_delete_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "images_delete_policy" ON "public"."images" FOR DELETE TO "authenticated" USING (true);


--
-- Name: images images_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "images_insert_policy" ON "public"."images" FOR INSERT TO "authenticated" WITH CHECK (true);


--
-- Name: images images_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "images_select_policy" ON "public"."images" FOR SELECT TO "authenticated" USING (true);


--
-- Name: images images_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "images_update_policy" ON "public"."images" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);


--
-- Name: group_invites invited_user_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "invited_user_can_select" ON "public"."group_invites" FOR SELECT USING (("invited_user_id" = "auth"."uid"()));


--
-- Name: group_invites invited_user_can_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "invited_user_can_update" ON "public"."group_invites" FOR UPDATE USING (("invited_user_id" = "auth"."uid"()));


--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices invoices_owner_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "invoices_owner_access" ON "public"."invoices" USING (("auth"."uid"() = "user_id"));


--
-- Name: likes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."likes" ENABLE ROW LEVEL SECURITY;

--
-- Name: likes likes_authenticated_crud; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "likes_authenticated_crud" ON "public"."likes" USING (("auth"."uid"() IS NOT NULL));


--
-- Name: list_followers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."list_followers" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_book_list_items list_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "list_member_can_select" ON "public"."group_book_list_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."group_book_lists"
     JOIN "public"."group_members" ON (("group_book_lists"."group_id" = "group_members"."group_id")))
  WHERE (("group_book_lists"."id" = "group_book_list_items"."list_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: media_attachments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."media_attachments" ENABLE ROW LEVEL SECURITY;

--
-- Name: mentions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."mentions" ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_book_swaps offered_by_can_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "offered_by_can_delete" ON "public"."group_book_swaps" FOR DELETE USING (("offered_by" = "auth"."uid"()));


--
-- Name: group_book_swaps offered_by_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "offered_by_can_modify" ON "public"."group_book_swaps" FOR UPDATE USING (("offered_by" = "auth"."uid"()));


--
-- Name: reading_series organizer_can_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "organizer_can_delete" ON "public"."reading_series" FOR DELETE USING (("organizer_id" = "auth"."uid"()));


--
-- Name: reading_series organizer_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "organizer_can_modify" ON "public"."reading_series" FOR UPDATE USING (("organizer_id" = "auth"."uid"()));


--
-- Name: book_views owner_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner_access" ON "public"."book_views" USING (("auth"."uid"() = "user_id"));


--
-- Name: invoices owner_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner_access" ON "public"."invoices" USING (("auth"."uid"() = "user_id"));


--
-- Name: payment_methods owner_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner_access" ON "public"."payment_methods" USING (("auth"."uid"() = "user_id"));


--
-- Name: payment_transactions owner_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner_access" ON "public"."payment_transactions" USING (("auth"."uid"() = "user_id"));


--
-- Name: photo_album owner_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner_access" ON "public"."photo_album" USING ((("auth"."uid"())::"text" = ("entity_id")::"text"));


--
-- Name: profiles owner_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner_access" ON "public"."profiles" USING (("auth"."uid"() = "id"));


--
-- Name: tickets owner_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner_access" ON "public"."tickets" USING (("auth"."uid"() = "user_id"));


--
-- Name: payment_methods; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."payment_methods" ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_methods payment_methods_owner_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "payment_methods_owner_access" ON "public"."payment_methods" USING (("auth"."uid"() = "user_id"));


--
-- Name: payment_transactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."payment_transactions" ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_transactions payment_transactions_owner_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "payment_transactions_owner_access" ON "public"."payment_transactions" USING (("auth"."uid"() = "user_id"));


--
-- Name: personalized_recommendations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."personalized_recommendations" ENABLE ROW LEVEL SECURITY;

--
-- Name: photo_album; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."photo_album" ENABLE ROW LEVEL SECURITY;

--
-- Name: photo_album photo_album_owner_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "photo_album_owner_access" ON "public"."photo_album" USING ((("auth"."uid"())::"text" = ("entity_id")::"text"));


--
-- Name: photo_album photo_album_public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "photo_album_public_read" ON "public"."photo_album" FOR SELECT USING (true);


--
-- Name: photo_albums; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."photo_albums" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_poll_votes poll_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "poll_member_can_select" ON "public"."group_poll_votes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."group_polls"
     JOIN "public"."group_members" ON (("group_polls"."group_id" = "group_members"."group_id")))
  WHERE (("group_polls"."id" = "group_poll_votes"."poll_id") AND ("group_members"."user_id" = "auth"."uid"())))));


--
-- Name: posts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;

--
-- Name: posts posts_authenticated_crud; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "posts_authenticated_crud" ON "public"."posts" USING (("auth"."uid"() IS NOT NULL));


--
-- Name: prices; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."prices" ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_owner_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "profiles_owner_access" ON "public"."profiles" USING (("auth"."uid"() = "id"));


--
-- Name: profiles profiles_public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "profiles_public_read" ON "public"."profiles" FOR SELECT USING (true);


--
-- Name: promo_codes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."promo_codes" ENABLE ROW LEVEL SECURITY;

--
-- Name: authors public_author_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_author_read" ON "public"."authors" FOR SELECT USING (true);


--
-- Name: books public_book_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_book_read" ON "public"."books" FOR SELECT USING (true);


--
-- Name: events public_event_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_event_read" ON "public"."events" FOR SELECT USING (true);


--
-- Name: publishers public_publisher_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_publisher_read" ON "public"."publishers" FOR SELECT USING (true);


--
-- Name: authors public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."authors" FOR SELECT USING (true);


--
-- Name: book_authors public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."book_authors" FOR SELECT USING (true);


--
-- Name: book_genre_mappings public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."book_genre_mappings" FOR SELECT USING (true);


--
-- Name: book_genres public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."book_genres" FOR SELECT USING (true);


--
-- Name: book_id_mapping public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."book_id_mapping" FOR SELECT USING (true);


--
-- Name: book_publishers public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."book_publishers" FOR SELECT USING (true);


--
-- Name: book_reviews public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."book_reviews" FOR SELECT USING (("visibility" = 'public'::"text"));


--
-- Name: book_similarity_scores public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."book_similarity_scores" FOR SELECT USING (true);


--
-- Name: book_subjects public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."book_subjects" FOR SELECT USING (true);


--
-- Name: book_tag_mappings public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."book_tag_mappings" FOR SELECT USING (true);


--
-- Name: book_tags public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."book_tags" FOR SELECT USING (true);


--
-- Name: books public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."books" FOR SELECT USING (true);


--
-- Name: carousel_images public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."carousel_images" FOR SELECT USING (true);


--
-- Name: comments public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."comments" FOR SELECT USING (true);


--
-- Name: countries public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."countries" FOR SELECT USING (true);


--
-- Name: event_categories public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."event_categories" FOR SELECT USING (true);


--
-- Name: event_types public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."event_types" FOR SELECT USING (true);


--
-- Name: group_types public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."group_types" FOR SELECT USING (true);


--
-- Name: image_tag_mappings public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."image_tag_mappings" FOR SELECT USING (true);


--
-- Name: image_tags public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."image_tags" FOR SELECT USING (true);


--
-- Name: prices public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."prices" FOR SELECT USING (true);


--
-- Name: reading_series public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."reading_series" FOR SELECT USING (true);


--
-- Name: series_events public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."series_events" FOR SELECT USING (true);


--
-- Name: similar_books public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."similar_books" FOR SELECT USING (true);


--
-- Name: survey_questions public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."survey_questions" FOR SELECT USING (true);


--
-- Name: ticket_benefits public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."ticket_benefits" FOR SELECT USING (true);


--
-- Name: ticket_types public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read" ON "public"."ticket_types" FOR SELECT USING (true);


--
-- Name: binding_types public_read_reference_tables; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read_reference_tables" ON "public"."binding_types" FOR SELECT USING (true);


--
-- Name: book_genres public_read_reference_tables; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read_reference_tables" ON "public"."book_genres" FOR SELECT USING (true);


--
-- Name: countries public_read_reference_tables; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read_reference_tables" ON "public"."countries" FOR SELECT USING (true);


--
-- Name: event_categories public_read_reference_tables; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read_reference_tables" ON "public"."event_categories" FOR SELECT USING (true);


--
-- Name: event_types public_read_reference_tables; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read_reference_tables" ON "public"."event_types" FOR SELECT USING (true);


--
-- Name: follow_target_types public_read_reference_tables; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read_reference_tables" ON "public"."follow_target_types" FOR SELECT USING (true);


--
-- Name: format_types public_read_reference_tables; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read_reference_tables" ON "public"."format_types" FOR SELECT USING (true);


--
-- Name: image_types public_read_reference_tables; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read_reference_tables" ON "public"."image_types" FOR SELECT USING (true);


--
-- Name: roles public_read_reference_tables; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read_reference_tables" ON "public"."roles" FOR SELECT USING (true);


--
-- Name: statuses public_read_reference_tables; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read_reference_tables" ON "public"."statuses" FOR SELECT USING (true);


--
-- Name: subjects public_read_reference_tables; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read_reference_tables" ON "public"."subjects" FOR SELECT USING (true);


--
-- Name: tags public_read_reference_tables; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_read_reference_tables" ON "public"."tags" FOR SELECT USING (true);


--
-- Name: users public_select_users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_select_users" ON "public"."users" FOR SELECT USING (true);


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
-- Name: reading_progress; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."reading_progress" ENABLE ROW LEVEL SECURITY;

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
-- Name: binding_types reference_public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "reference_public_read" ON "public"."binding_types" FOR SELECT USING (true);


--
-- Name: book_genres reference_public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "reference_public_read" ON "public"."book_genres" FOR SELECT USING (true);


--
-- Name: countries reference_public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "reference_public_read" ON "public"."countries" FOR SELECT USING (true);


--
-- Name: event_categories reference_public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "reference_public_read" ON "public"."event_categories" FOR SELECT USING (true);


--
-- Name: event_types reference_public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "reference_public_read" ON "public"."event_types" FOR SELECT USING (true);


--
-- Name: format_types reference_public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "reference_public_read" ON "public"."format_types" FOR SELECT USING (true);


--
-- Name: image_types reference_public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "reference_public_read" ON "public"."image_types" FOR SELECT USING (true);


--
-- Name: roles reference_public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "reference_public_read" ON "public"."roles" FOR SELECT USING (true);


--
-- Name: statuses reference_public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "reference_public_read" ON "public"."statuses" FOR SELECT USING (true);


--
-- Name: subjects reference_public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "reference_public_read" ON "public"."subjects" FOR SELECT USING (true);


--
-- Name: tags reference_public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "reference_public_read" ON "public"."tags" FOR SELECT USING (true);


--
-- Name: group_reports reporter_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "reporter_can_modify" ON "public"."group_reports" FOR UPDATE USING (("reported_by" = "auth"."uid"()));


--
-- Name: group_reports reporter_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "reporter_can_select" ON "public"."group_reports" FOR SELECT USING (("reported_by" = "auth"."uid"()));


--
-- Name: review_likes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."review_likes" ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews reviews_authenticated_crud; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "reviews_authenticated_crud" ON "public"."reviews" USING (("auth"."uid"() IS NOT NULL));


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
-- Name: event_speakers speaker_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "speaker_can_modify_own" ON "public"."event_speakers" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: event_speakers speaker_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "speaker_can_select_own" ON "public"."event_speakers" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: event_staff staff_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "staff_can_modify_own" ON "public"."event_staff" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: event_staff staff_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "staff_can_select_own" ON "public"."event_staff" FOR SELECT USING (("user_id" = "auth"."uid"()));


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
-- Name: tags; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;

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
-- Name: tickets tickets_owner_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "tickets_owner_access" ON "public"."tickets" USING (("auth"."uid"() = "user_id"));


--
-- Name: user_book_interactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."user_book_interactions" ENABLE ROW LEVEL SECURITY;

--
-- Name: comments user_can_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete" ON "public"."comments" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: event_chat_messages user_can_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete" ON "public"."event_chat_messages" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: event_comments user_can_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete" ON "public"."event_comments" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: group_book_reviews user_can_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete" ON "public"."group_book_reviews" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: group_chat_message_reactions user_can_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete" ON "public"."group_chat_message_reactions" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: group_chat_messages user_can_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete" ON "public"."group_chat_messages" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: group_event_feedback user_can_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete" ON "public"."group_event_feedback" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: activities user_can_delete_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete_own" ON "public"."activities" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: activity_log user_can_delete_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete_own" ON "public"."activity_log" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: album_shares user_can_delete_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete_own" ON "public"."album_shares" FOR DELETE USING (("shared_by" = "auth"."uid"()));


--
-- Name: blocks user_can_delete_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete_own" ON "public"."blocks" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: book_recommendations user_can_delete_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete_own" ON "public"."book_recommendations" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: book_reviews user_can_delete_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete_own" ON "public"."book_reviews" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: book_views user_can_delete_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete_own" ON "public"."book_views" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: event_calendar_exports user_can_delete_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete_own" ON "public"."event_calendar_exports" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: event_interests user_can_delete_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete_own" ON "public"."event_interests" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: event_likes user_can_delete_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete_own" ON "public"."event_likes" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: event_reminders user_can_delete_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete_own" ON "public"."event_reminders" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: event_shares user_can_delete_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete_own" ON "public"."event_shares" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: event_waitlists user_can_delete_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete_own" ON "public"."event_waitlists" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: group_member_devices user_can_delete_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete_own" ON "public"."group_member_devices" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: group_poll_votes user_can_delete_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete_own" ON "public"."group_poll_votes" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: payment_methods user_can_delete_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete_own" ON "public"."payment_methods" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: session_registrations user_can_delete_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete_own" ON "public"."session_registrations" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: survey_responses user_can_delete_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_delete_own" ON "public"."survey_responses" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: comments user_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify" ON "public"."comments" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: event_chat_messages user_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify" ON "public"."event_chat_messages" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: event_comments user_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify" ON "public"."event_comments" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: group_book_reviews user_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify" ON "public"."group_book_reviews" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: group_chat_message_reactions user_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify" ON "public"."group_chat_message_reactions" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: group_chat_messages user_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify" ON "public"."group_chat_messages" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: group_event_feedback user_can_modify; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify" ON "public"."group_event_feedback" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: activities user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."activities" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: activity_log user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."activity_log" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: album_shares user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."album_shares" FOR UPDATE USING (("shared_by" = "auth"."uid"()));


--
-- Name: blocks user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."blocks" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: book_club_members user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."book_club_members" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: book_recommendations user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."book_recommendations" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: book_reviews user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."book_reviews" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: book_views user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."book_views" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: event_calendar_exports user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."event_calendar_exports" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: event_creator_permissions user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."event_creator_permissions" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: event_interests user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."event_interests" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: event_permission_requests user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."event_permission_requests" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: event_registrations user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."event_registrations" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: event_reminders user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."event_reminders" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: event_shares user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."event_shares" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: event_waitlists user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."event_waitlists" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: group_member_devices user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."group_member_devices" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: group_onboarding_progress user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."group_onboarding_progress" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: group_poll_votes user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."group_poll_votes" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: group_reading_challenge_progress user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."group_reading_challenge_progress" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: group_reading_progress user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."group_reading_progress" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: payment_methods user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."payment_methods" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: session_registrations user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."session_registrations" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: survey_responses user_can_modify_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_modify_own" ON "public"."survey_responses" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: activities user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."activities" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: activity_log user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."activity_log" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: album_shares user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."album_shares" FOR SELECT USING (("shared_by" = "auth"."uid"()));


--
-- Name: blocks user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."blocks" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: book_club_members user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."book_club_members" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: book_recommendations user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."book_recommendations" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: book_reviews user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."book_reviews" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: book_views user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."book_views" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: event_calendar_exports user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."event_calendar_exports" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: event_creator_permissions user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."event_creator_permissions" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: event_interests user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."event_interests" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: event_likes user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."event_likes" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: event_permission_requests user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."event_permission_requests" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: event_registrations user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."event_registrations" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: event_reminders user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."event_reminders" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: event_shares user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."event_shares" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: event_views user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."event_views" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: event_waitlists user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."event_waitlists" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: group_member_achievements user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."group_member_achievements" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: group_member_devices user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."group_member_devices" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: group_member_streaks user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."group_member_streaks" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: group_members user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."group_members" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: group_onboarding_progress user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."group_onboarding_progress" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: group_poll_votes user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."group_poll_votes" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: group_reading_challenge_progress user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."group_reading_challenge_progress" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: group_reading_progress user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."group_reading_progress" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: payment_methods user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."payment_methods" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: payment_transactions user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."payment_transactions" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: session_registrations user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."session_registrations" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: survey_responses user_can_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_select_own" ON "public"."survey_responses" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: group_members user_can_update_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_can_update_own" ON "public"."group_members" FOR UPDATE USING (("user_id" = "auth"."uid"()));


--
-- Name: user_reading_preferences; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."user_reading_preferences" ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

--
-- Name: group_book_wishlist_items wishlist_member_can_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "wishlist_member_can_select" ON "public"."group_book_wishlist_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."group_book_wishlists"
     JOIN "public"."group_members" ON (("group_book_wishlists"."group_id" = "group_members"."group_id")))
  WHERE (("group_book_wishlists"."id" = "group_book_wishlist_items"."wishlist_id") AND ("group_members"."user_id" = "auth"."uid"())))));


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
-- Name: FUNCTION "compute_similar_books"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."compute_similar_books"() TO "anon";
GRANT ALL ON FUNCTION "public"."compute_similar_books"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."compute_similar_books"() TO "service_role";


--
-- Name: FUNCTION "count_authors_per_book"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."count_authors_per_book"() TO "anon";
GRANT ALL ON FUNCTION "public"."count_authors_per_book"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_authors_per_book"() TO "service_role";


--
-- Name: FUNCTION "count_books_with_multiple_authors"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."count_books_with_multiple_authors"() TO "anon";
GRANT ALL ON FUNCTION "public"."count_books_with_multiple_authors"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_books_with_multiple_authors"() TO "service_role";


--
-- Name: FUNCTION "count_publishers_per_book"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."count_publishers_per_book"() TO "anon";
GRANT ALL ON FUNCTION "public"."count_publishers_per_book"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_publishers_per_book"() TO "service_role";


--
-- Name: FUNCTION "create_author_activity"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_author_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_author_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_author_activity"() TO "service_role";


--
-- Name: FUNCTION "create_book_activity"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_book_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_book_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_book_activity"() TO "service_role";


--
-- Name: FUNCTION "create_book_club_event"("book_club_id" "uuid", "discussion_id" "uuid", "title" "text", "description" "text", "start_time" timestamp with time zone, "duration_minutes" integer, "is_virtual" boolean, "created_by" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_book_club_event"("book_club_id" "uuid", "discussion_id" "uuid", "title" "text", "description" "text", "start_time" timestamp with time zone, "duration_minutes" integer, "is_virtual" boolean, "created_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_book_club_event"("book_club_id" "uuid", "discussion_id" "uuid", "title" "text", "description" "text", "start_time" timestamp with time zone, "duration_minutes" integer, "is_virtual" boolean, "created_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_book_club_event"("book_club_id" "uuid", "discussion_id" "uuid", "title" "text", "description" "text", "start_time" timestamp with time zone, "duration_minutes" integer, "is_virtual" boolean, "created_by" "uuid") TO "service_role";


--
-- Name: FUNCTION "create_book_update_activity"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_book_update_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_book_update_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_book_update_activity"() TO "service_role";


--
-- Name: FUNCTION "create_challenge_complete_notification"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_challenge_complete_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_challenge_complete_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_challenge_complete_notification"() TO "service_role";


--
-- Name: FUNCTION "create_default_reading_lists"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_default_reading_lists"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_reading_lists"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_reading_lists"() TO "service_role";


--
-- Name: FUNCTION "create_discussion_activity"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_discussion_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_discussion_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_discussion_activity"() TO "service_role";


--
-- Name: FUNCTION "create_discussion_comment_activity"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_discussion_comment_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_discussion_comment_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_discussion_comment_activity"() TO "service_role";


--
-- Name: FUNCTION "create_event_activity"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_event_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_event_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_event_activity"() TO "service_role";


--
-- Name: FUNCTION "create_event_approval_record"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_event_approval_record"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_event_approval_record"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_event_approval_record"() TO "service_role";


--
-- Name: FUNCTION "create_event_notification"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_event_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_event_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_event_notification"() TO "service_role";


--
-- Name: FUNCTION "create_event_registration_activity"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_event_registration_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_event_registration_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_event_registration_activity"() TO "service_role";


--
-- Name: FUNCTION "create_follow_notification"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_follow_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_follow_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_follow_notification"() TO "service_role";


--
-- Name: FUNCTION "create_get_user_reading_stats_function"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_get_user_reading_stats_function"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_get_user_reading_stats_function"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_get_user_reading_stats_function"() TO "service_role";


--
-- Name: FUNCTION "create_group_activity"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_group_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_group_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_group_activity"() TO "service_role";


--
-- Name: FUNCTION "create_group_with_roles"("p_name" "text", "p_description" "text", "p_cover_image_id" integer, "p_group_image_id" integer, "p_created_by" "uuid", "p_target_type_id" integer, "p_target_id" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_group_with_roles"("p_name" "text", "p_description" "text", "p_cover_image_id" integer, "p_group_image_id" integer, "p_created_by" "uuid", "p_target_type_id" integer, "p_target_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_group_with_roles"("p_name" "text", "p_description" "text", "p_cover_image_id" integer, "p_group_image_id" integer, "p_created_by" "uuid", "p_target_type_id" integer, "p_target_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_group_with_roles"("p_name" "text", "p_description" "text", "p_cover_image_id" integer, "p_group_image_id" integer, "p_created_by" "uuid", "p_target_type_id" integer, "p_target_id" "text") TO "service_role";


--
-- Name: FUNCTION "create_list_follow_notification"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_list_follow_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_list_follow_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_list_follow_notification"() TO "service_role";


--
-- Name: FUNCTION "create_list_item_activity"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_list_item_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_list_item_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_list_item_activity"() TO "service_role";


--
-- Name: FUNCTION "create_new_user"("user_id" "uuid", "user_email" "text", "created_timestamp" timestamp without time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_new_user"("user_id" "uuid", "user_email" "text", "created_timestamp" timestamp without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."create_new_user"("user_id" "uuid", "user_email" "text", "created_timestamp" timestamp without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_new_user"("user_id" "uuid", "user_email" "text", "created_timestamp" timestamp without time zone) TO "service_role";


--
-- Name: FUNCTION "create_or_update_user"("p_user_id" "uuid", "p_email" "text", "p_created_at" timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_or_update_user"("p_user_id" "uuid", "p_email" "text", "p_created_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."create_or_update_user"("p_user_id" "uuid", "p_email" "text", "p_created_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_or_update_user"("p_user_id" "uuid", "p_email" "text", "p_created_at" timestamp with time zone) TO "service_role";


--
-- Name: FUNCTION "create_publisher_activity"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_publisher_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_publisher_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_publisher_activity"() TO "service_role";


--
-- Name: FUNCTION "create_reading_list_activity"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_reading_list_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_reading_list_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_reading_list_activity"() TO "service_role";


--
-- Name: FUNCTION "create_reading_progress_activity"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_reading_progress_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_reading_progress_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_reading_progress_activity"() TO "service_role";


--
-- Name: FUNCTION "create_review_activity"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_review_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_review_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_review_activity"() TO "service_role";


--
-- Name: FUNCTION "create_review_like_notification"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_review_like_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_review_like_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_review_like_notification"() TO "service_role";


--
-- Name: FUNCTION "create_user_profile_activity"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_user_profile_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_profile_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_profile_activity"() TO "service_role";


--
-- Name: FUNCTION "create_want_to_read_review_notification"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_want_to_read_review_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_want_to_read_review_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_want_to_read_review_notification"() TO "service_role";


--
-- Name: FUNCTION "export_schema_definitions"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."export_schema_definitions"() TO "anon";
GRANT ALL ON FUNCTION "public"."export_schema_definitions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."export_schema_definitions"() TO "service_role";


--
-- Name: TABLE "personalized_recommendations"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."personalized_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."personalized_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."personalized_recommendations" TO "service_role";


--
-- Name: FUNCTION "generate_personalized_recommendations"("user_uuid" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."generate_personalized_recommendations"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_personalized_recommendations"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_personalized_recommendations"("user_uuid" "uuid") TO "service_role";


--
-- Name: FUNCTION "generate_recommendations"("user_id_param" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."generate_recommendations"("user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_recommendations"("user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_recommendations"("user_id_param" "uuid") TO "service_role";


--
-- Name: FUNCTION "get_column_names"("table_name" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_column_names"("table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_column_names"("table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_column_names"("table_name" "text") TO "service_role";


--
-- Name: FUNCTION "get_search_suggestions"("search_query" "text", "max_results" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_search_suggestions"("search_query" "text", "max_results" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_search_suggestions"("search_query" "text", "max_results" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_search_suggestions"("search_query" "text", "max_results" integer) TO "service_role";


--
-- Name: FUNCTION "get_table_columns"("table_name_param" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_table_columns"("table_name_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_table_columns"("table_name_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_table_columns"("table_name_param" "text") TO "service_role";


--
-- Name: FUNCTION "get_user_reading_stats"("user_id_param" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_user_reading_stats"("user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_reading_stats"("user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_reading_stats"("user_id_param" "uuid") TO "service_role";


--
-- Name: FUNCTION "handle_new_user"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";


--
-- Name: FUNCTION "handle_new_user_profile"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."handle_new_user_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_profile"() TO "service_role";


--
-- Name: FUNCTION "increment_album_view_count"("album_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."increment_album_view_count"("album_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_album_view_count"("album_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_album_view_count"("album_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "initialize_group_member_count"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."initialize_group_member_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_group_member_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_group_member_count"() TO "service_role";


--
-- Name: FUNCTION "integer_to_uuid"("integer_id" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."integer_to_uuid"("integer_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."integer_to_uuid"("integer_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."integer_to_uuid"("integer_id" integer) TO "service_role";


--
-- Name: FUNCTION "integer_to_uuid"("table_name_param" "text", "integer_id_param" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."integer_to_uuid"("table_name_param" "text", "integer_id_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."integer_to_uuid"("table_name_param" "text", "integer_id_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."integer_to_uuid"("table_name_param" "text", "integer_id_param" integer) TO "service_role";


--
-- Name: FUNCTION "is_admin"("user_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "is_admin_safe"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."is_admin_safe"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_safe"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_safe"() TO "service_role";


--
-- Name: FUNCTION "is_group_owner"("group_id" "uuid", "user_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."is_group_owner"("group_id" "uuid", "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_group_owner"("group_id" "uuid", "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_group_owner"("group_id" "uuid", "user_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "is_super_admin"("user_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."is_super_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"("user_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "manage_series_event_number"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."manage_series_event_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."manage_series_event_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."manage_series_event_number"() TO "service_role";


--
-- Name: FUNCTION "manage_waitlist_position"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."manage_waitlist_position"() TO "anon";
GRANT ALL ON FUNCTION "public"."manage_waitlist_position"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."manage_waitlist_position"() TO "service_role";


--
-- Name: FUNCTION "mark_all_notifications_read"("user_id_param" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("user_id_param" "uuid") TO "service_role";


--
-- Name: FUNCTION "notify_author_followers_of_event"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."notify_author_followers_of_event"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_author_followers_of_event"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_author_followers_of_event"() TO "service_role";


--
-- Name: FUNCTION "notify_challenge_completion"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."notify_challenge_completion"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_challenge_completion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_challenge_completion"() TO "service_role";


--
-- Name: FUNCTION "notify_challenge_lead"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."notify_challenge_lead"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_challenge_lead"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_challenge_lead"() TO "service_role";


--
-- Name: FUNCTION "notify_waitlist_when_ticket_available"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."notify_waitlist_when_ticket_available"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_waitlist_when_ticket_available"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_waitlist_when_ticket_available"() TO "service_role";


--
-- Name: FUNCTION "prevent_spam_posts"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."prevent_spam_posts"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_spam_posts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_spam_posts"() TO "service_role";


--
-- Name: FUNCTION "record_book_view"("book_id_param" bigint); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."record_book_view"("book_id_param" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."record_book_view"("book_id_param" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_book_view"("book_id_param" bigint) TO "service_role";


--
-- Name: FUNCTION "record_user_book_interaction"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."record_user_book_interaction"() TO "anon";
GRANT ALL ON FUNCTION "public"."record_user_book_interaction"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_user_book_interaction"() TO "service_role";


--
-- Name: FUNCTION "search_all"("search_query" "text", "max_results" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."search_all"("search_query" "text", "max_results" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_all"("search_query" "text", "max_results" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_all"("search_query" "text", "max_results" integer) TO "service_role";


--
-- Name: FUNCTION "search_books"("search_query" "text", "genre_filter" "uuid", "min_rating" numeric, "max_results" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."search_books"("search_query" "text", "genre_filter" "uuid", "min_rating" numeric, "max_results" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_books"("search_query" "text", "genre_filter" "uuid", "min_rating" numeric, "max_results" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_books"("search_query" "text", "genre_filter" "uuid", "min_rating" numeric, "max_results" integer) TO "service_role";


--
-- Name: FUNCTION "search_reading_lists"("search_query" "text", "max_results" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."search_reading_lists"("search_query" "text", "max_results" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_reading_lists"("search_query" "text", "max_results" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_reading_lists"("search_query" "text", "max_results" integer) TO "service_role";


--
-- Name: FUNCTION "search_users"("search_query" "text", "max_results" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."search_users"("search_query" "text", "max_results" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_users"("search_query" "text", "max_results" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_users"("search_query" "text", "max_results" integer) TO "service_role";


--
-- Name: FUNCTION "sync_book_author"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."sync_book_author"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_book_author"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_book_author"() TO "service_role";


--
-- Name: FUNCTION "track_book_view"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."track_book_view"() TO "anon";
GRANT ALL ON FUNCTION "public"."track_book_view"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_book_view"() TO "service_role";


--
-- Name: FUNCTION "track_event_view"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."track_event_view"() TO "anon";
GRANT ALL ON FUNCTION "public"."track_event_view"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_event_view"() TO "service_role";


--
-- Name: FUNCTION "update_album_updated_at"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_album_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_album_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_album_updated_at"() TO "service_role";


--
-- Name: FUNCTION "update_author_activity"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_author_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_author_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_author_activity"() TO "service_role";


--
-- Name: FUNCTION "update_book_club_member_count"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_book_club_member_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_book_club_member_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_book_club_member_count"() TO "service_role";


--
-- Name: FUNCTION "update_book_rating"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_book_rating"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_book_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_book_rating"() TO "service_role";


--
-- Name: FUNCTION "update_book_rating_from_reviews"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_book_rating_from_reviews"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_book_rating_from_reviews"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_book_rating_from_reviews"() TO "service_role";


--
-- Name: FUNCTION "update_contact_info_updated_at"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_contact_info_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_contact_info_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_contact_info_updated_at"() TO "service_role";


--
-- Name: FUNCTION "update_daily_stats_from_progress"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_daily_stats_from_progress"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_daily_stats_from_progress"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_daily_stats_from_progress"() TO "service_role";


--
-- Name: FUNCTION "update_daily_stats_from_session"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_daily_stats_from_session"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_daily_stats_from_session"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_daily_stats_from_session"() TO "service_role";


--
-- Name: FUNCTION "update_event_financials"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_event_financials"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_event_financials"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_event_financials"() TO "service_role";


--
-- Name: FUNCTION "update_event_status"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_event_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_event_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_event_status"() TO "service_role";


--
-- Name: FUNCTION "update_feed_entry_updated_at"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_feed_entry_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_feed_entry_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_feed_entry_updated_at"() TO "service_role";


--
-- Name: FUNCTION "update_follow_counts"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_follow_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_follow_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_follow_counts"() TO "service_role";


--
-- Name: FUNCTION "update_group_activity"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_group_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_group_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_group_activity"() TO "service_role";


--
-- Name: FUNCTION "update_group_member_count"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_group_member_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_group_member_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_group_member_count"() TO "service_role";


--
-- Name: FUNCTION "update_image_updated_at"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_image_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_image_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_image_updated_at"() TO "service_role";


--
-- Name: FUNCTION "update_modified_column"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";


--
-- Name: FUNCTION "update_publisher_activity"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_publisher_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_publisher_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_publisher_activity"() TO "service_role";


--
-- Name: FUNCTION "update_publishers_updated_at"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_publishers_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_publishers_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_publishers_updated_at"() TO "service_role";


--
-- Name: FUNCTION "update_reading_challenge"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_reading_challenge"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_reading_challenge"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_reading_challenge"() TO "service_role";


--
-- Name: FUNCTION "update_reading_goals"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_reading_goals"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_reading_goals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_reading_goals"() TO "service_role";


--
-- Name: FUNCTION "update_reading_streaks"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_reading_streaks"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_reading_streaks"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_reading_streaks"() TO "service_role";


--
-- Name: FUNCTION "update_streak_goals"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_streak_goals"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_streak_goals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_streak_goals"() TO "service_role";


--
-- Name: FUNCTION "update_ticket_quantity_sold"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_ticket_quantity_sold"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_ticket_quantity_sold"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_ticket_quantity_sold"() TO "service_role";


--
-- Name: FUNCTION "update_timestamp"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "service_role";


--
-- Name: FUNCTION "update_updated_at_column"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


--
-- Name: FUNCTION "update_user_profile_activity"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_user_profile_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_profile_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_profile_activity"() TO "service_role";


--
-- Name: FUNCTION "update_user_recommendations"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_user_recommendations"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_recommendations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_recommendations"() TO "service_role";


--
-- Name: FUNCTION "validate_book_data"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."validate_book_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_book_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_book_data"() TO "service_role";


--
-- Name: FUNCTION "validate_chat_message"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."validate_chat_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_chat_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_chat_message"() TO "service_role";


--
-- Name: FUNCTION "validate_event_creation"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."validate_event_creation"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_event_creation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_event_creation"() TO "service_role";


--
-- Name: FUNCTION "validate_follow_target"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."validate_follow_target"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_follow_target"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_follow_target"() TO "service_role";


--
-- Name: FUNCTION "validate_livestream_activation"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."validate_livestream_activation"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_livestream_activation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_livestream_activation"() TO "service_role";


--
-- Name: FUNCTION "validate_survey_response"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."validate_survey_response"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_survey_response"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_survey_response"() TO "service_role";


--
-- Name: FUNCTION "validate_ticket_purchase"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."validate_ticket_purchase"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_ticket_purchase"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_ticket_purchase"() TO "service_role";


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
-- Name: TABLE "friends"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."friends" TO "anon";
GRANT ALL ON TABLE "public"."friends" TO "authenticated";
GRANT ALL ON TABLE "public"."friends" TO "service_role";


--
-- Name: TABLE "users"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";


--
-- Name: TABLE "accepted_friends"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."accepted_friends" TO "anon";
GRANT ALL ON TABLE "public"."accepted_friends" TO "authenticated";
GRANT ALL ON TABLE "public"."accepted_friends" TO "service_role";


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
-- Name: TABLE "book_reviews"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."book_reviews" TO "anon";
GRANT ALL ON TABLE "public"."book_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."book_reviews" TO "service_role";


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
-- Name: TABLE "carousel_images"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."carousel_images" TO "anon";
GRANT ALL ON TABLE "public"."carousel_images" TO "authenticated";
GRANT ALL ON TABLE "public"."carousel_images" TO "service_role";


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
-- Name: TABLE "countries"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."countries" TO "anon";
GRANT ALL ON TABLE "public"."countries" TO "authenticated";
GRANT ALL ON TABLE "public"."countries" TO "service_role";


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
-- Name: TABLE "image_types"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."image_types" TO "anon";
GRANT ALL ON TABLE "public"."image_types" TO "authenticated";
GRANT ALL ON TABLE "public"."image_types" TO "service_role";


--
-- Name: TABLE "images"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."images" TO "anon";
GRANT ALL ON TABLE "public"."images" TO "authenticated";
GRANT ALL ON TABLE "public"."images" TO "service_role";


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
-- Name: TABLE "publishers"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."publishers" TO "anon";
GRANT ALL ON TABLE "public"."publishers" TO "authenticated";
GRANT ALL ON TABLE "public"."publishers" TO "service_role";


--
-- Name: TABLE "personalized_recommendations_with_details"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."personalized_recommendations_with_details" TO "anon";
GRANT ALL ON TABLE "public"."personalized_recommendations_with_details" TO "authenticated";
GRANT ALL ON TABLE "public"."personalized_recommendations_with_details" TO "service_role";


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
-- Name: TABLE "user_book_interactions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_book_interactions" TO "anon";
GRANT ALL ON TABLE "public"."user_book_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_book_interactions" TO "service_role";


--
-- Name: TABLE "user_reading_preferences"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_reading_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_reading_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_reading_preferences" TO "service_role";


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
