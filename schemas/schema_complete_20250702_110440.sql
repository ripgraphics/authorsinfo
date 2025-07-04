--
-- PostgreSQL database cluster dump
--

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

-- CREATE ROLE "anon";
-- ALTER ROLE "anon" WITH INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOBYPASSRLS;
-- CREATE ROLE "authenticated";
-- ALTER ROLE "authenticated" WITH INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOBYPASSRLS;
-- CREATE ROLE "authenticator";
-- ALTER ROLE "authenticator" WITH NOINHERIT NOCREATEROLE NOCREATEDB LOGIN NOBYPASSRLS;
-- CREATE ROLE "dashboard_user";
-- ALTER ROLE "dashboard_user" WITH INHERIT CREATEROLE CREATEDB NOLOGIN REPLICATION NOBYPASSRLS;
-- CREATE ROLE "pgbouncer";
-- ALTER ROLE "pgbouncer" WITH INHERIT NOCREATEROLE NOCREATEDB LOGIN NOBYPASSRLS;
-- CREATE ROLE "pgsodium_keyholder";
-- ALTER ROLE "pgsodium_keyholder" WITH INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOBYPASSRLS;
-- CREATE ROLE "pgsodium_keyiduser";
-- ALTER ROLE "pgsodium_keyiduser" WITH INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOBYPASSRLS;
-- CREATE ROLE "pgsodium_keymaker";
-- ALTER ROLE "pgsodium_keymaker" WITH INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOBYPASSRLS;
-- CREATE ROLE "postgres";
-- ALTER ROLE "postgres" WITH INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS;
-- CREATE ROLE "service_role";
-- ALTER ROLE "service_role" WITH INHERIT NOCREATEROLE NOCREATEDB NOLOGIN BYPASSRLS;
-- CREATE ROLE "supabase_admin";
-- ALTER ROLE "supabase_admin" WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS;
-- CREATE ROLE "supabase_auth_admin";
-- ALTER ROLE "supabase_auth_admin" WITH NOINHERIT CREATEROLE NOCREATEDB LOGIN NOBYPASSRLS;
-- CREATE ROLE "supabase_read_only_user";
-- ALTER ROLE "supabase_read_only_user" WITH INHERIT NOCREATEROLE NOCREATEDB LOGIN BYPASSRLS;
-- CREATE ROLE "supabase_realtime_admin";
-- ALTER ROLE "supabase_realtime_admin" WITH NOINHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOBYPASSRLS;
-- CREATE ROLE "supabase_replication_admin";
-- ALTER ROLE "supabase_replication_admin" WITH INHERIT NOCREATEROLE NOCREATEDB LOGIN REPLICATION NOBYPASSRLS;
-- CREATE ROLE "supabase_storage_admin";
-- ALTER ROLE "supabase_storage_admin" WITH NOINHERIT CREATEROLE NOCREATEDB LOGIN NOBYPASSRLS;

--
-- User Configurations
--

--
-- User Config "anon"
--

ALTER ROLE "anon" SET "statement_timeout" TO '3s';

--
-- User Config "authenticated"
--

ALTER ROLE "authenticated" SET "statement_timeout" TO '8s';

--
-- User Config "authenticator"
--

-- ALTER ROLE "authenticator" SET "session_preload_libraries" TO 'safeupdate';
ALTER ROLE "authenticator" SET "statement_timeout" TO '8s';
-- ALTER ROLE "authenticator" SET "lock_timeout" TO '8s';

--
-- User Config "postgres"
--

-- ALTER ROLE "postgres" SET "search_path" TO E'\\$user', 'public', 'extensions';

--
-- User Config "supabase_admin"
--

-- ALTER ROLE "supabase_admin" SET "search_path" TO '$user', 'public', 'auth', 'extensions';
-- ALTER ROLE "supabase_admin" SET "log_statement" TO 'none';

--
-- User Config "supabase_auth_admin"
--

-- ALTER ROLE "supabase_auth_admin" SET "search_path" TO 'auth';
-- ALTER ROLE "supabase_auth_admin" SET "idle_in_transaction_session_timeout" TO '60000';
-- ALTER ROLE "supabase_auth_admin" SET "log_statement" TO 'none';

--
-- User Config "supabase_storage_admin"
--

-- ALTER ROLE "supabase_storage_admin" SET "search_path" TO 'storage';
-- ALTER ROLE "supabase_storage_admin" SET "log_statement" TO 'none';

--
-- Role memberships
--

-- GRANT "anon" TO "authenticator" GRANTED BY "postgres";
-- GRANT "anon" TO "postgres" GRANTED BY "supabase_admin";
-- GRANT "authenticated" TO "authenticator" GRANTED BY "postgres";
-- GRANT "authenticated" TO "postgres" GRANTED BY "supabase_admin";
-- GRANT "authenticator" TO "supabase_storage_admin" GRANTED BY "supabase_admin";
-- GRANT "pg_monitor" TO "postgres" GRANTED BY "supabase_admin";
-- GRANT "pg_read_all_data" TO "postgres" GRANTED BY "supabase_admin";
-- GRANT "pg_read_all_data" TO "supabase_read_only_user" GRANTED BY "postgres";
-- GRANT "pg_signal_backend" TO "postgres" GRANTED BY "supabase_admin";
-- GRANT "pgsodium_keyholder" TO "pgsodium_keymaker" GRANTED BY "supabase_admin";
-- GRANT "pgsodium_keyholder" TO "postgres" WITH ADMIN OPTION GRANTED BY "supabase_admin";
-- GRANT "pgsodium_keyholder" TO "service_role" GRANTED BY "supabase_admin";
-- GRANT "pgsodium_keyiduser" TO "pgsodium_keyholder" GRANTED BY "supabase_admin";
-- GRANT "pgsodium_keyiduser" TO "pgsodium_keymaker" GRANTED BY "supabase_admin";
-- GRANT "pgsodium_keyiduser" TO "postgres" WITH ADMIN OPTION GRANTED BY "supabase_admin";
-- GRANT "pgsodium_keymaker" TO "postgres" WITH ADMIN OPTION GRANTED BY "supabase_admin";
-- GRANT "service_role" TO "authenticator" GRANTED BY "postgres";
-- GRANT "service_role" TO "postgres" GRANTED BY "supabase_admin";
-- GRANT "supabase_auth_admin" TO "postgres" GRANTED BY "supabase_admin";
-- GRANT "supabase_realtime_admin" TO "postgres" GRANTED BY "supabase_admin";
-- GRANT "supabase_storage_admin" TO "postgres" GRANTED BY "supabase_admin";

--
-- PostgreSQL database cluster dump complete
--

RESET ALL;
