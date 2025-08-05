SET session_replication_role = replica;

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
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', 'bb0a2ab5-2ffa-40aa-9438-8f988f5b00b1', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"testuser@authorsinfo.com","user_id":"1cd12917-899d-4676-a2bc-cad281a68c36","user_phone":""}}', '2025-07-03 09:15:12.886465+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f56c5d03-61ac-4e20-9f6f-ecaeb99e0fcf', '{"action":"login","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-04 03:29:05.298196+00', ''),
	('00000000-0000-0000-0000-000000000000', '1dcd56d0-591c-4120-9bf2-0df7d3923279', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 05:05:30.208926+00', ''),
	('00000000-0000-0000-0000-000000000000', '5f7f838c-f473-49cf-91b6-34bbc080fe10', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 05:05:30.21513+00', ''),
	('00000000-0000-0000-0000-000000000000', '2a506025-176e-47da-b16e-43606bcbf273', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 06:04:10.238547+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b20d5411-0d0e-479e-9d4d-035b6a9ce032', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 06:04:10.240112+00', ''),
	('00000000-0000-0000-0000-000000000000', '09c2d629-f27e-44fd-8352-377fe29eda8a', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 08:45:57.179423+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b72f0be9-7d87-44a1-8ccf-b11674fe8af1', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 08:45:57.217235+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c19faa68-5ca6-48cd-9a3a-4f60e0baf50f', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 09:46:42.754902+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cf4f0c67-ad2e-4edb-b9f6-1bdb17d48294', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 09:46:42.756438+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f322d0e3-0d1f-4f56-8c23-1b557cff4961', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 09:46:42.79681+00', ''),
	('00000000-0000-0000-0000-000000000000', '42b645a1-27d9-4c30-983c-3340a4c909cf', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 09:48:27.566621+00', ''),
	('00000000-0000-0000-0000-000000000000', '950c23dc-7641-4e03-b601-e7c844a7ee84', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 10:46:32.58575+00', ''),
	('00000000-0000-0000-0000-000000000000', '3b6f2033-91ad-45d5-bf63-2586627c5d1e', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 10:46:32.591827+00', ''),
	('00000000-0000-0000-0000-000000000000', '65e006f7-f291-4069-be70-f9361455a854', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 11:44:35.053054+00', ''),
	('00000000-0000-0000-0000-000000000000', '4d372775-76af-44ce-827a-f1e23515952d', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 11:44:35.066021+00', ''),
	('00000000-0000-0000-0000-000000000000', '7f3f0af5-d226-4ead-85d7-4c8026d967f1', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 12:45:26.220451+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a5bc7cef-ea62-41a9-b58d-63fbd2f8fe94', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 12:45:26.224306+00', ''),
	('00000000-0000-0000-0000-000000000000', '80784961-5f0a-4ea6-bcb6-13d761d5f8fc', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 12:45:32.815799+00', ''),
	('00000000-0000-0000-0000-000000000000', '15eba893-9ed3-4f3c-9b67-c85c126abd2c', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 13:44:12.253792+00', ''),
	('00000000-0000-0000-0000-000000000000', 'de60c48f-5378-4622-95fb-7c1a35267c77', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 13:44:12.255912+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f5523eac-fa23-48aa-97db-c258f8f56316', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 13:44:39.972344+00', ''),
	('00000000-0000-0000-0000-000000000000', '19104a87-c675-4a4a-8c9a-cd23fad22a22', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 00:09:15.091341+00', ''),
	('00000000-0000-0000-0000-000000000000', '5bdd838d-66a2-4f93-bc7e-9dc7079406a9', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 00:09:15.115499+00', ''),
	('00000000-0000-0000-0000-000000000000', '6c77a1fb-3a53-46ac-a812-c64148cb748d', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 02:54:01.96168+00', ''),
	('00000000-0000-0000-0000-000000000000', '3f74dd61-09b7-476b-be26-975bffc2983e', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 05:38:52.102704+00', ''),
	('00000000-0000-0000-0000-000000000000', '9405becb-8c17-412f-8411-09dc4cf7fa15', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 05:38:52.109156+00', ''),
	('00000000-0000-0000-0000-000000000000', '299d3e79-932f-4224-af3c-4d8a15df2d62', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 06:38:53.648683+00', ''),
	('00000000-0000-0000-0000-000000000000', '4d0207d7-2d4a-45d4-9e44-b3d19b102a7e', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 06:38:53.656081+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dc20fae2-f051-446e-bf93-9b6292f053b9', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-05 14:08:58.721359+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a94227fb-7b9a-497a-9b0b-35f58c31593f', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-06 02:27:32.312121+00', ''),
	('00000000-0000-0000-0000-000000000000', '3c03dc5b-3ebf-4bf3-a44f-ad1253881f43', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-06 02:27:32.319234+00', ''),
	('00000000-0000-0000-0000-000000000000', '893bb7d0-02cc-48e3-accb-bd89b4e418f0', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-06 03:25:34.207956+00', ''),
	('00000000-0000-0000-0000-000000000000', 'afef9aa1-13ee-4890-b8e7-8b7757551427', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-06 03:25:34.211237+00', ''),
	('00000000-0000-0000-0000-000000000000', 'aad7a99a-4cad-4f39-8865-6b5943448aea', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-06 04:24:30.46984+00', ''),
	('00000000-0000-0000-0000-000000000000', '88888e85-49cb-4948-aeae-6e348e8e83c9', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-06 04:24:30.474775+00', ''),
	('00000000-0000-0000-0000-000000000000', 'af81cc26-4dbe-4c76-82c8-2800c3f65be6', '{"action":"logout","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"account"}', '2025-07-06 04:41:33.06561+00', ''),
	('00000000-0000-0000-0000-000000000000', '130938e1-dbe6-41ae-88c8-d30ea4ef8822', '{"action":"login","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-06 04:42:10.536377+00', ''),
	('00000000-0000-0000-0000-000000000000', '5fa7a45d-c737-4608-a678-6948d4c63869', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-06 06:46:51.889555+00', ''),
	('00000000-0000-0000-0000-000000000000', '44a2b6d4-65f6-4084-bae4-c03b7ca384d5', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-06 06:46:51.89542+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e3aef895-98ff-4473-9e95-df5af9eb4e8d', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-06 18:51:33.462313+00', ''),
	('00000000-0000-0000-0000-000000000000', '3ee12294-ef19-4882-9227-02f1bc875bd5', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-06 18:51:33.475586+00', ''),
	('00000000-0000-0000-0000-000000000000', '4c8d859e-8a5f-4553-a6cb-71ed62710c90', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-06 18:51:33.879516+00', ''),
	('00000000-0000-0000-0000-000000000000', '825f820c-57b1-4488-b52f-d31722c99f79', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-06 19:59:43.077022+00', ''),
	('00000000-0000-0000-0000-000000000000', '2a3c694d-ad37-43b8-9146-5a1027967eec', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-06 19:59:43.079316+00', ''),
	('00000000-0000-0000-0000-000000000000', '460b68a6-66d9-4052-8d1c-d94374aae72c', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-06 21:09:41.231559+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c3f767e6-1902-4b9a-8cbf-afa19bd7ce53', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-06 21:09:41.237991+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e66e6da7-50e6-4e86-a014-567c5519908b', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-06 22:13:44.516854+00', ''),
	('00000000-0000-0000-0000-000000000000', '18e6bdda-8173-463f-b04b-5a375a4d29bb', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-06 22:13:44.523651+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a7112359-7c5c-45f3-bafc-a2df0600d1ae', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 02:56:37.637556+00', ''),
	('00000000-0000-0000-0000-000000000000', '2d5eec03-f14b-4032-98a5-f980ccad51a5', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 02:56:37.643716+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fb1a958a-1f28-48df-b3bd-9e30568f6522', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 03:57:36.836495+00', ''),
	('00000000-0000-0000-0000-000000000000', '896cd26d-1039-4725-a95f-4be0693494a0', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 03:57:36.843841+00', ''),
	('00000000-0000-0000-0000-000000000000', '74f016a8-2316-4313-b426-d7b1c017ad71', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 05:12:54.75548+00', ''),
	('00000000-0000-0000-0000-000000000000', '1a3e269d-6996-4fa9-b804-1996f2b32380', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 05:12:54.766659+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd9f9fa49-acae-4eb2-87ed-00a6c22b112e', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 06:20:49.2496+00', ''),
	('00000000-0000-0000-0000-000000000000', '86e1eb60-b600-4623-bef2-d4daf2994341', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 06:20:49.260651+00', ''),
	('00000000-0000-0000-0000-000000000000', '6b0ff5e4-fba2-4f17-9eb5-6283e738dfad', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 07:25:01.445431+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c2a2d702-14c1-4624-b270-fe56c5e48eba', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 07:25:01.459853+00', ''),
	('00000000-0000-0000-0000-000000000000', '5ecd4b14-54b7-4d71-89db-ac770bf01245', '{"action":"logout","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"account"}', '2025-07-07 07:36:24.477083+00', ''),
	('00000000-0000-0000-0000-000000000000', '95809ca9-6d3d-4204-885f-6bcca86b1fb0', '{"action":"login","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-07 07:52:29.54858+00', ''),
	('00000000-0000-0000-0000-000000000000', '401a7752-4290-4bfe-a789-cdef5f56e565', '{"action":"logout","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"account"}', '2025-07-07 08:24:12.044334+00', ''),
	('00000000-0000-0000-0000-000000000000', '35c97fd4-b29b-4f13-84bc-ccaeeb19dc45', '{"action":"login","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-07 08:24:35.284594+00', ''),
	('00000000-0000-0000-0000-000000000000', '51996911-d402-4180-861d-32d0c23a2d3b', '{"action":"logout","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"account"}', '2025-07-07 08:54:57.718113+00', ''),
	('00000000-0000-0000-0000-000000000000', '48ba4d7b-1e29-417e-bb9b-45a4109674f2', '{"action":"login","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-07 08:55:58.974216+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c690d5eb-fe68-4129-aa4e-5f0abaa8afc9', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 17:27:35.580127+00', ''),
	('00000000-0000-0000-0000-000000000000', '13bf14a5-9550-4d56-b88d-a2823e84d28b', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 17:27:35.589464+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd8a7c3c4-f9bf-4df9-a3f3-e5cd9cf71f9a', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 19:09:04.090907+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c96d7080-f178-4016-9065-6ceb5010d444', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 19:09:04.097221+00', ''),
	('00000000-0000-0000-0000-000000000000', '806e394f-9df7-4320-823d-3b0fefd4545a', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 20:20:50.17264+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e878a335-42c8-4289-81da-c09a930c2947', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 20:20:50.180055+00', ''),
	('00000000-0000-0000-0000-000000000000', '09879ed5-377d-4fa7-877f-508091d391d9', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 21:19:19.584622+00', ''),
	('00000000-0000-0000-0000-000000000000', 'eafd0b40-2648-44f0-9b10-5174b5df2c6a', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 21:19:19.590049+00', ''),
	('00000000-0000-0000-0000-000000000000', '2ab6aedc-7f5b-4011-b10c-1aba321a5769', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 22:17:49.883588+00', ''),
	('00000000-0000-0000-0000-000000000000', '831420c6-b4d0-4f85-991e-8b2aa8c8b81e', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 22:17:49.893708+00', ''),
	('00000000-0000-0000-0000-000000000000', '2c8dcb05-9bba-494b-81bc-ede0ad6d9183', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 23:35:48.178881+00', ''),
	('00000000-0000-0000-0000-000000000000', '2294bb93-303f-4f06-83c1-45dd13b698f5', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 23:35:48.187536+00', ''),
	('00000000-0000-0000-0000-000000000000', '4ef1bb24-73b9-41a5-b21c-9c1f1d3fa6c1', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 00:37:55.456557+00', ''),
	('00000000-0000-0000-0000-000000000000', '5fb2c92e-32c4-4d87-bfcf-c9e31694a4bb', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 00:37:55.464544+00', ''),
	('00000000-0000-0000-0000-000000000000', 'aa7c5fac-ddbf-4f32-a90a-7ef013b4d8fe', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 00:44:32.346576+00', ''),
	('00000000-0000-0000-0000-000000000000', '8d52b232-20ad-4813-b460-79c23ef1ca49', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 01:52:30.374707+00', ''),
	('00000000-0000-0000-0000-000000000000', '5133d486-6ba2-4136-ad70-b15cb3a21dfa', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 01:52:30.387172+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e1fccb50-ad51-4aee-9506-d21033ff2720', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 01:53:00.446357+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd329bf3e-88d4-4711-b19c-eb419108c6b3', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 02:51:38.739259+00', ''),
	('00000000-0000-0000-0000-000000000000', '262cc26b-45a3-417f-bb60-3752b2d9377d', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 02:51:38.745467+00', ''),
	('00000000-0000-0000-0000-000000000000', '3dc9fad7-383f-4925-830a-714095015683', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 03:59:04.516012+00', ''),
	('00000000-0000-0000-0000-000000000000', '5d7032e1-a382-48d0-803e-1d5e05f93a86', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 03:59:04.524501+00', ''),
	('00000000-0000-0000-0000-000000000000', '35ddb65d-42e1-4890-aca6-f86050eec66a', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 09:07:35.907486+00', ''),
	('00000000-0000-0000-0000-000000000000', '4a09c02c-d74a-4222-8e0d-879d2fefc135', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 09:07:35.91339+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a824e2a5-145a-4156-9dcc-5e51d79c4aac', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 10:10:51.265466+00', ''),
	('00000000-0000-0000-0000-000000000000', '2efe20a1-e9c8-4fc8-b8ef-0f57a61db541', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 10:10:51.275118+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b7331c0b-db9c-4e6a-b13d-51b324ee58a7', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 10:10:51.807935+00', ''),
	('00000000-0000-0000-0000-000000000000', '3a92fa64-8c0c-4419-9cc3-e27ab742e780', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 11:12:47.355251+00', ''),
	('00000000-0000-0000-0000-000000000000', '0bfeb0a2-5e20-4532-87fd-95dc1ffafb59', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 11:12:47.364695+00', ''),
	('00000000-0000-0000-0000-000000000000', '0ef2face-ce99-4e25-83da-a8c5f1a5759c', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 12:19:25.136881+00', ''),
	('00000000-0000-0000-0000-000000000000', '33949de7-95b8-4e54-a676-75f5133e8469', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 12:19:25.153211+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f4bcbbe3-62b5-4a8f-9ac1-bdd78af3d032', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 13:26:52.952002+00', ''),
	('00000000-0000-0000-0000-000000000000', '5902ba3a-3400-46d3-8d2f-b967722ccc16', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 13:26:52.963567+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd243d14b-2a9c-46c1-a249-18c91c1285aa', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 16:50:37.22399+00', ''),
	('00000000-0000-0000-0000-000000000000', '63c67a2c-0301-4f89-8b70-b921fba9a5a2', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 16:50:37.244071+00', ''),
	('00000000-0000-0000-0000-000000000000', '7734b99e-c23d-4d1e-abc7-e28cbd909d78', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 17:58:24.86455+00', ''),
	('00000000-0000-0000-0000-000000000000', 'daa4a63a-f545-48b0-86c2-79f7b9e1de2b', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 17:58:24.875139+00', ''),
	('00000000-0000-0000-0000-000000000000', '08c8c435-d5b8-4f79-b788-2ab1477a9efb', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 19:32:26.164354+00', ''),
	('00000000-0000-0000-0000-000000000000', '128a7aac-2e3a-440d-8bb0-da92be6f96e4', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 19:32:26.172697+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f8f445a7-7eaa-48c8-9a18-69de74b6a35d', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 20:57:06.829029+00', ''),
	('00000000-0000-0000-0000-000000000000', '55762c32-72e0-44b5-aca4-0faf5b2db875', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 21:56:04.263256+00', ''),
	('00000000-0000-0000-0000-000000000000', '7769de82-475e-4208-b90a-946c7e8dc2cc', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 21:56:04.27213+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e0797503-2d44-424b-92a4-61f38d2b0f9f', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 23:14:58.277554+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a766f664-e949-4afe-b89b-0c48cf1e331d', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 23:14:58.284672+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c66cf851-b86c-4c9f-80dd-d1bbee163de3', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 00:13:07.880797+00', ''),
	('00000000-0000-0000-0000-000000000000', '88f3fe3d-a1b7-4ce8-8aec-c589b6748817', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 00:13:07.89122+00', ''),
	('00000000-0000-0000-0000-000000000000', 'af841e93-4a1b-4c05-88a7-76e171391b31', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 01:11:11.43246+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ab3e1e80-3580-49a7-98b8-f514d46f443d', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 01:11:11.443993+00', ''),
	('00000000-0000-0000-0000-000000000000', '7821280f-c4b1-4357-a2c2-1cff4b6a0522', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 02:09:41.141012+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd04db32f-3b1a-47f4-9873-4be09b990add', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 02:09:41.145363+00', ''),
	('00000000-0000-0000-0000-000000000000', '8d2928b2-1617-4510-b2e3-6d1a544e1e6b', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 16:47:36.046375+00', ''),
	('00000000-0000-0000-0000-000000000000', '0506cb4c-f6e1-4d6d-84fc-ff1c36eeabb1', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 16:47:36.056939+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a4e668e5-0cf0-47d9-ae19-d38ccebb9f0c', '{"action":"login","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-13 04:17:31.27965+00', ''),
	('00000000-0000-0000-0000-000000000000', '018ccd8d-c06b-41da-8732-0c030b774994', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 05:59:08.23174+00', ''),
	('00000000-0000-0000-0000-000000000000', '34327566-c3f5-447d-a826-3311d9f31052', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 05:59:08.236263+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cb00e3e4-2d45-4675-8a7e-cef7c2d558ec', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 07:10:25.956327+00', ''),
	('00000000-0000-0000-0000-000000000000', '511afb52-cf30-4bcf-820b-58176ed1bc5a', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 07:10:25.964926+00', ''),
	('00000000-0000-0000-0000-000000000000', '7e4dcd8e-d3d1-40fe-86ee-260231b993f2', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 08:16:43.687645+00', ''),
	('00000000-0000-0000-0000-000000000000', '70a5643e-c13b-4325-a357-5ac29820f712', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 08:16:43.69863+00', ''),
	('00000000-0000-0000-0000-000000000000', '181b6c96-5389-482b-9032-3a4eaff5474c', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 23:55:03.341963+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd1ffd70b-3667-488f-891f-492eab9feb1b', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 23:55:03.356553+00', ''),
	('00000000-0000-0000-0000-000000000000', '44f6c5d0-fe87-4d47-b899-d42e0b23b2c9', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-14 11:47:51.195782+00', ''),
	('00000000-0000-0000-0000-000000000000', '156ddc5d-a9b5-4fa6-b004-504efa14dbe8', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-14 11:47:51.206052+00', ''),
	('00000000-0000-0000-0000-000000000000', '5cfd40d4-d66b-4147-b8cd-e518c9536dc9', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-28 21:06:43.739456+00', ''),
	('00000000-0000-0000-0000-000000000000', '5a0ebe01-6fdf-4951-b5a8-adb349fb097d', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-28 21:06:43.753192+00', ''),
	('00000000-0000-0000-0000-000000000000', '6d985d88-7e23-4829-b9f2-b54a2a19a54a', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 00:40:20.982068+00', ''),
	('00000000-0000-0000-0000-000000000000', '5c171786-20eb-4ed0-bdbb-e1db4bfccb7e', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 00:40:20.993307+00', ''),
	('00000000-0000-0000-0000-000000000000', '834d625e-2631-4c5e-ab78-f46cf897c3bb', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 01:38:29.899199+00', ''),
	('00000000-0000-0000-0000-000000000000', '2a98ef04-c512-467a-b58e-d134f35a1eaf', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 01:38:29.919197+00', ''),
	('00000000-0000-0000-0000-000000000000', '17b63420-3f7f-4bb5-866d-4a7f8f27cb63', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 02:36:30.030132+00', ''),
	('00000000-0000-0000-0000-000000000000', '25814d19-c767-46c0-b174-07a871ed1cf3', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 02:36:30.047381+00', ''),
	('00000000-0000-0000-0000-000000000000', '69949c59-9359-486a-9226-280ed9621ae3', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 03:46:52.348633+00', ''),
	('00000000-0000-0000-0000-000000000000', 'edbfdb5b-eba6-4b38-80dc-c7e9ee8500d1', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 03:46:52.367103+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f2230f26-425f-4107-bf40-74cdba0eee9f', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 05:31:10.180881+00', ''),
	('00000000-0000-0000-0000-000000000000', '63a6d0d0-59b6-48a6-b6b1-5701cb9f8e5e', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 05:31:10.192017+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f0d56678-a945-4a94-b4bf-5f7f669d0009', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 15:39:47.545863+00', ''),
	('00000000-0000-0000-0000-000000000000', '62066080-acc6-45d7-ae4e-6da42f45f381', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 15:39:47.56864+00', ''),
	('00000000-0000-0000-0000-000000000000', '4f45deca-dc14-4d88-865e-a49dcd3ede57', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 17:27:44.449286+00', ''),
	('00000000-0000-0000-0000-000000000000', '40091c48-b000-42f4-906e-d68c57b97596', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 17:27:44.47126+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fef3fadd-9289-4cc1-ade0-b47b66445239', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 21:13:18.823422+00', ''),
	('00000000-0000-0000-0000-000000000000', '71fa576d-cdc0-48e1-ad49-e2ad83a33daa', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 21:13:18.845246+00', ''),
	('00000000-0000-0000-0000-000000000000', '7007d729-e77f-4f1e-b00d-4d3d763a4a84', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 22:11:43.453477+00', ''),
	('00000000-0000-0000-0000-000000000000', '91f99596-3409-4d29-8206-36014a936517', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 22:11:43.45977+00', ''),
	('00000000-0000-0000-0000-000000000000', '94d3d7bf-496b-40b9-9d92-2547cdf43133', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 23:09:43.786713+00', ''),
	('00000000-0000-0000-0000-000000000000', '6ce8100b-d135-4513-9c7b-0851e0a73fff', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 23:09:43.805535+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ab14fc2b-e063-4240-a1d2-ed6ed9340d43', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 00:07:43.775617+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c72a9a73-865c-4d8f-ad91-8403f30ff971', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 00:07:43.792975+00', ''),
	('00000000-0000-0000-0000-000000000000', '898efca2-4138-49ed-8861-20de9d0c2575', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 01:05:43.75809+00', ''),
	('00000000-0000-0000-0000-000000000000', '7cc63f0f-ce89-4ad5-b49b-2ace44da3f26', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 01:05:43.773553+00', ''),
	('00000000-0000-0000-0000-000000000000', '3b652c95-3824-4f5d-96bf-9e2aa6661282', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 02:03:43.779705+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a4c47418-9398-43ee-a6a3-e41d2cefc0ab', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 02:03:43.79985+00', ''),
	('00000000-0000-0000-0000-000000000000', '06bcc13b-ed0c-4a49-9dd3-7d0bef281bcb', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 03:02:01.520886+00', ''),
	('00000000-0000-0000-0000-000000000000', 'eb4b1b9c-700c-48e9-958e-8203ab06a12d', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 03:02:01.535008+00', ''),
	('00000000-0000-0000-0000-000000000000', '7ce0681e-1bfd-495d-800d-1b944ba2a982', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 04:00:29.96826+00', ''),
	('00000000-0000-0000-0000-000000000000', '9650e187-9605-457b-87d8-15f23c93d2d6', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 04:00:29.983774+00', ''),
	('00000000-0000-0000-0000-000000000000', '52b6c7e9-6762-4858-bea8-1af6063a2fc1', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 05:01:03.246427+00', ''),
	('00000000-0000-0000-0000-000000000000', '0b08c719-4e9a-478f-9535-5f866ac541e9', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 05:01:03.26807+00', ''),
	('00000000-0000-0000-0000-000000000000', '00e3e3b2-552d-4fe4-a0ef-2fb0b66eddc6', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 06:17:35.361761+00', ''),
	('00000000-0000-0000-0000-000000000000', '8432339d-6183-41cb-af93-34690e7509fe', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 06:17:35.380535+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cae1b178-4262-4d08-81a9-134e995846e8', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 07:15:55.229333+00', ''),
	('00000000-0000-0000-0000-000000000000', '0196137b-5ba0-4044-8676-de5e86fea10f', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 07:15:55.25036+00', ''),
	('00000000-0000-0000-0000-000000000000', '6414db9d-6eec-417d-ab88-2c2b79ae0bf3', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 08:14:25.258807+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a82cdb5c-c2c0-4199-a5c7-6afcac87e221', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 08:14:25.281997+00', ''),
	('00000000-0000-0000-0000-000000000000', '63fb540c-c719-4f83-bb87-47603b2b4fd7', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 09:12:55.193162+00', ''),
	('00000000-0000-0000-0000-000000000000', '991658c2-4c2c-43b7-82a4-3f729ab8901e', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 09:12:55.21219+00', ''),
	('00000000-0000-0000-0000-000000000000', '0549acdf-309e-48c9-8bda-21ba5b76be00', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 10:11:25.269648+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f0dc8d0b-7093-4579-a28b-bb0a8849ddfe', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 10:11:25.287139+00', ''),
	('00000000-0000-0000-0000-000000000000', '8361335e-7803-4429-855b-bfcb125a6e80', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 11:09:55.152202+00', ''),
	('00000000-0000-0000-0000-000000000000', '147b2a68-70ee-4b45-a98a-68488d1de16d', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 11:09:55.165167+00', ''),
	('00000000-0000-0000-0000-000000000000', '70b60e33-5b75-4b5f-b3eb-1e8b6f1fb9a6', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 14:20:37.421643+00', ''),
	('00000000-0000-0000-0000-000000000000', '63e51d43-da0f-454e-b2c2-06e14032b518', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 14:20:37.444686+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b02b51c6-44d6-4c34-8fb2-da9e2212e8c3', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 15:37:23.468146+00', ''),
	('00000000-0000-0000-0000-000000000000', '96bc14de-f7bd-4322-9be0-7c71e1b68685', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 15:37:23.484745+00', ''),
	('00000000-0000-0000-0000-000000000000', '1327194a-daf4-40b5-adf2-dd8fe255841c', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 16:39:18.827866+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e1963ee6-3078-446c-9dd2-b89268bc8803', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 16:39:18.845774+00', ''),
	('00000000-0000-0000-0000-000000000000', '98386bd6-22a7-4f0f-9ac5-a928e6f0dff0', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 18:13:54.981364+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a247b6bd-f208-4a5e-8e43-db8503870b6e', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 18:13:55.003164+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a29f96a2-472c-47f5-a84f-e3216f42787a', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 19:12:12.031223+00', ''),
	('00000000-0000-0000-0000-000000000000', '8ba59595-86cf-4738-b314-8515024d6d45', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 19:12:12.039599+00', ''),
	('00000000-0000-0000-0000-000000000000', '76e63005-cdd9-42ed-81c1-365f9f594bb7', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 20:14:41.111312+00', ''),
	('00000000-0000-0000-0000-000000000000', '03ce96c8-0b05-4a3a-b43d-1fbbe03c5eb1', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 20:14:41.117959+00', ''),
	('00000000-0000-0000-0000-000000000000', '4c4c4e00-64eb-410a-ac65-d7ce6a183cc3', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 22:49:55.661689+00', ''),
	('00000000-0000-0000-0000-000000000000', '9c03438c-f303-4f2d-8a53-c2b8ce4008d6', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 22:49:55.683649+00', ''),
	('00000000-0000-0000-0000-000000000000', '87cdfa6b-8a90-4135-a51f-0fc54e59b89f', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 00:06:29.634295+00', ''),
	('00000000-0000-0000-0000-000000000000', '3fc6dc69-187b-4afd-9598-734131801159', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 00:06:29.642116+00', ''),
	('00000000-0000-0000-0000-000000000000', '9c714371-256f-4b55-b4c7-7829ca4320de', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 01:04:31.265603+00', ''),
	('00000000-0000-0000-0000-000000000000', '55bfdf24-7752-430c-893f-79cb36a31fc5', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 01:04:31.281843+00', ''),
	('00000000-0000-0000-0000-000000000000', '237216db-1972-4c21-9355-f81636e1118c', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 02:08:42.571613+00', ''),
	('00000000-0000-0000-0000-000000000000', '62927800-4288-459f-9a69-22ad87e9df23', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 02:08:42.582072+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd0c471e5-082d-4124-a18f-356253e35a8b', '{"action":"login","actor_id":"2474659f-003e-4faa-8c53-9969c33f20b2","actor_username":"bob.brown@authorsinfo.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-31 02:41:22.370794+00', ''),
	('00000000-0000-0000-0000-000000000000', '3040c487-dd07-40f7-9285-7779433c3ad1', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 05:09:44.817533+00', ''),
	('00000000-0000-0000-0000-000000000000', '5c13ed8a-6e31-43bc-9fa0-7e71aa1c8d3d', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 05:09:44.828034+00', ''),
	('00000000-0000-0000-0000-000000000000', '57d0d85e-ec35-48cb-b42f-d085dfbe0c86', '{"action":"token_refreshed","actor_id":"2474659f-003e-4faa-8c53-9969c33f20b2","actor_username":"bob.brown@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 05:09:51.044784+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e542987d-d602-4b50-8a8f-3139666fd4ba', '{"action":"token_revoked","actor_id":"2474659f-003e-4faa-8c53-9969c33f20b2","actor_username":"bob.brown@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 05:09:51.047781+00', ''),
	('00000000-0000-0000-0000-000000000000', '89b13473-eb3b-400f-adbf-211ca07e3741', '{"action":"token_refreshed","actor_id":"2474659f-003e-4faa-8c53-9969c33f20b2","actor_username":"bob.brown@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 06:21:55.997221+00', ''),
	('00000000-0000-0000-0000-000000000000', '3405b7b5-40a4-4701-a6e0-38185213b552', '{"action":"token_revoked","actor_id":"2474659f-003e-4faa-8c53-9969c33f20b2","actor_username":"bob.brown@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 06:21:56.00763+00', ''),
	('00000000-0000-0000-0000-000000000000', '39f2fc96-a992-4c8c-8599-4ebd7a5dd5a8', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 07:08:59.905077+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e9c78523-03fb-421c-82c5-cca608ab9bf6', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 07:08:59.917443+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cb23cf26-57fa-4b3c-bf3e-30f017ecd016', '{"action":"token_refreshed","actor_id":"2474659f-003e-4faa-8c53-9969c33f20b2","actor_username":"bob.brown@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 08:04:28.662614+00', ''),
	('00000000-0000-0000-0000-000000000000', '6f977422-853d-47fe-ad45-2a20ec58d8d8', '{"action":"token_revoked","actor_id":"2474659f-003e-4faa-8c53-9969c33f20b2","actor_username":"bob.brown@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 08:04:28.673261+00', ''),
	('00000000-0000-0000-0000-000000000000', '6b31cb0f-8f3a-4f9c-88e8-dac9dcf22fb1', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 08:09:11.807744+00', ''),
	('00000000-0000-0000-0000-000000000000', '54a4db91-083e-45ee-8a58-473af38fb39b', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 08:09:11.812313+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ca5f695c-c846-42fb-8392-ce03e8a6d2e8', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 09:07:41.603761+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f3745efb-4239-487c-9056-2103c4722563', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 09:07:41.619123+00', ''),
	('00000000-0000-0000-0000-000000000000', '20ad720e-153e-4c3d-8a64-e7e48747b0c1', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 09:07:41.679773+00', ''),
	('00000000-0000-0000-0000-000000000000', '5e139820-9081-4d86-a6bd-c8072af8ef86', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 09:07:41.698523+00', ''),
	('00000000-0000-0000-0000-000000000000', '787a657a-ffae-47bd-9e56-1ce68cb976f0', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 09:07:41.711191+00', ''),
	('00000000-0000-0000-0000-000000000000', '3af70e87-3a9f-48b3-977b-68cd9dfe1505', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 09:07:41.721341+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e228698f-6288-4ef3-ab26-6c738dae5231', '{"action":"token_refreshed","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 15:09:03.99847+00', ''),
	('00000000-0000-0000-0000-000000000000', '298fa43b-ee21-453c-8be6-fd5c63d0c9b8', '{"action":"token_revoked","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 15:09:04.022666+00', ''),
	('00000000-0000-0000-0000-000000000000', '29f2da7e-2aa9-4641-9fca-ce84455539dc', '{"action":"logout","actor_id":"e06cdf85-b449-4dcb-b943-068aaad8cfa3","actor_username":"alice.anderson@authorsinfo.com","actor_via_sso":false,"log_type":"account"}', '2025-07-31 15:27:04.665862+00', ''),
	('00000000-0000-0000-0000-000000000000', '2ff6f983-21aa-4809-a204-8c8e9b25452d', '{"action":"login","actor_id":"45f98998-ba1d-4439-b2ee-1d403fee0e7c","actor_username":"charlie.clark@authorsinfo.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-31 15:27:28.496265+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a96af3ba-436c-41d0-bbf3-0f4092ab2faa', '{"action":"token_refreshed","actor_id":"45f98998-ba1d-4439-b2ee-1d403fee0e7c","actor_username":"charlie.clark@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 16:43:19.518975+00', ''),
	('00000000-0000-0000-0000-000000000000', 'aff6b8c2-7c04-4545-ad3c-5bb27c578a5c', '{"action":"token_revoked","actor_id":"45f98998-ba1d-4439-b2ee-1d403fee0e7c","actor_username":"charlie.clark@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 16:43:19.536906+00', ''),
	('00000000-0000-0000-0000-000000000000', '2697c89e-b3a6-4ba6-bd4c-6241d54d4d64', '{"action":"token_refreshed","actor_id":"45f98998-ba1d-4439-b2ee-1d403fee0e7c","actor_username":"charlie.clark@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 16:43:19.651798+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd87d06ce-c2e4-4807-9bc3-51aa51ab30ff', '{"action":"token_refreshed","actor_id":"45f98998-ba1d-4439-b2ee-1d403fee0e7c","actor_username":"charlie.clark@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 16:43:20.545372+00', ''),
	('00000000-0000-0000-0000-000000000000', '833a4e9d-9ae1-42de-a9a7-ef85a8471176', '{"action":"logout","actor_id":"45f98998-ba1d-4439-b2ee-1d403fee0e7c","actor_username":"charlie.clark@authorsinfo.com","actor_via_sso":false,"log_type":"account"}', '2025-07-31 17:37:57.478999+00', ''),
	('00000000-0000-0000-0000-000000000000', '6aff0fcd-a34b-4b73-8c88-94b667829dfd', '{"action":"login","actor_id":"8dd18808-4777-4877-bde1-b54b1d3ffa81","actor_username":"grace.garcia@authorsinfo.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-31 19:40:59.720244+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b74cff5a-b876-43f3-b151-f6ae3426ac71', '{"action":"token_refreshed","actor_id":"8dd18808-4777-4877-bde1-b54b1d3ffa81","actor_username":"grace.garcia@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 20:39:49.98147+00', ''),
	('00000000-0000-0000-0000-000000000000', '8c133b82-23db-4629-953b-947cdab1a939', '{"action":"token_revoked","actor_id":"8dd18808-4777-4877-bde1-b54b1d3ffa81","actor_username":"grace.garcia@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 20:39:49.996502+00', ''),
	('00000000-0000-0000-0000-000000000000', '6e8b707d-dcdc-40bb-a71f-6f032dbfd1a5', '{"action":"token_refreshed","actor_id":"8dd18808-4777-4877-bde1-b54b1d3ffa81","actor_username":"grace.garcia@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-08-01 04:01:08.809232+00', ''),
	('00000000-0000-0000-0000-000000000000', '3fc8474d-cb0b-4dc2-ae92-6010adb17820', '{"action":"token_revoked","actor_id":"8dd18808-4777-4877-bde1-b54b1d3ffa81","actor_username":"grace.garcia@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-08-01 04:01:08.83239+00', ''),
	('00000000-0000-0000-0000-000000000000', '04a8df2d-4235-40af-829a-5098a4c3aa3f', '{"action":"token_refreshed","actor_id":"8dd18808-4777-4877-bde1-b54b1d3ffa81","actor_username":"grace.garcia@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-08-01 04:01:15.396954+00', ''),
	('00000000-0000-0000-0000-000000000000', '88fb8d67-2a0d-4040-a31c-b5be16edf89d', '{"action":"token_refreshed","actor_id":"8dd18808-4777-4877-bde1-b54b1d3ffa81","actor_username":"grace.garcia@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-08-01 04:01:18.274325+00', ''),
	('00000000-0000-0000-0000-000000000000', '9177b018-6aaf-4940-a918-596c9f74bdd9', '{"action":"logout","actor_id":"8dd18808-4777-4877-bde1-b54b1d3ffa81","actor_username":"grace.garcia@authorsinfo.com","actor_via_sso":false,"log_type":"account"}', '2025-08-01 04:11:38.133449+00', ''),
	('00000000-0000-0000-0000-000000000000', '58ff722d-a717-4c2e-8402-065c1da2406e', '{"action":"login","actor_id":"c5b68ab4-e8bc-4291-a646-7f8ab4b99528","actor_username":"diana.davis@authorsinfo.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-01 04:11:51.760489+00', ''),
	('00000000-0000-0000-0000-000000000000', '12ab7bf1-32e8-4d29-8818-df60f12ad7c7', '{"action":"token_refreshed","actor_id":"c5b68ab4-e8bc-4291-a646-7f8ab4b99528","actor_username":"diana.davis@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-08-02 00:41:54.972141+00', ''),
	('00000000-0000-0000-0000-000000000000', '27712d9a-7a66-4468-8273-b6761c526bb1', '{"action":"token_revoked","actor_id":"c5b68ab4-e8bc-4291-a646-7f8ab4b99528","actor_username":"diana.davis@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-08-02 00:41:54.996487+00', ''),
	('00000000-0000-0000-0000-000000000000', '0051d8a9-6e95-42e8-912c-3972d285a00d', '{"action":"token_refreshed","actor_id":"c5b68ab4-e8bc-4291-a646-7f8ab4b99528","actor_username":"diana.davis@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-08-02 01:40:14.721266+00', ''),
	('00000000-0000-0000-0000-000000000000', '03bb6be4-02ae-4a43-baee-1dbfb1603368', '{"action":"token_revoked","actor_id":"c5b68ab4-e8bc-4291-a646-7f8ab4b99528","actor_username":"diana.davis@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-08-02 01:40:14.739693+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a48b0788-0bc8-4e3c-8080-17a9c077d2da', '{"action":"token_refreshed","actor_id":"c5b68ab4-e8bc-4291-a646-7f8ab4b99528","actor_username":"diana.davis@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-08-02 02:45:35.136799+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f04b84bb-f736-4c3b-8495-510b76c32113', '{"action":"token_revoked","actor_id":"c5b68ab4-e8bc-4291-a646-7f8ab4b99528","actor_username":"diana.davis@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-08-02 02:45:35.156449+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f56227e9-6385-48bd-be00-8dbfe16d09d6', '{"action":"token_refreshed","actor_id":"c5b68ab4-e8bc-4291-a646-7f8ab4b99528","actor_username":"diana.davis@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-08-02 04:05:34.621943+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e88103b1-5d36-4c14-adae-ed04c6f4b16e', '{"action":"token_revoked","actor_id":"c5b68ab4-e8bc-4291-a646-7f8ab4b99528","actor_username":"diana.davis@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-08-02 04:05:34.638073+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b69a8949-ae26-4901-9358-e0400f1fdcb4', '{"action":"token_refreshed","actor_id":"c5b68ab4-e8bc-4291-a646-7f8ab4b99528","actor_username":"diana.davis@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-08-02 05:12:46.40315+00', ''),
	('00000000-0000-0000-0000-000000000000', '35faefe1-36ae-4f98-b5c2-1d6ed42c1502', '{"action":"token_revoked","actor_id":"c5b68ab4-e8bc-4291-a646-7f8ab4b99528","actor_username":"diana.davis@authorsinfo.com","actor_via_sso":false,"log_type":"token"}', '2025-08-02 05:12:46.421377+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '355dd8d6-7ef5-46cf-9bad-67fd863cbc88', 'authenticated', 'authenticated', 'eve.evans@authorsinfo.com', '$2a$06$0JPE9qXB5raKkVLu5oXiYObTx0CfWDMaQQY45RdHpqTzqpDN5Agmq', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Eve Evans"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '62be2226-e3d4-4b10-951d-13c3972145b1', 'authenticated', 'authenticated', 'frank.fisher@authorsinfo.com', '$2a$06$akp.YJW5cfrOZ8tt86.jNOEbHFbUnx0Quh2xlXAn0m/r.GOqFA6Ca', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Frank Fisher"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '0d1f32d3-18b4-4aa8-b858-141b139aacd8', 'authenticated', 'authenticated', 'henry.harris@authorsinfo.com', '$2a$06$w7g6FSwJnyKjiudBsXdkN.QusCW9nUHBb.1tU462RRac6p4GJua7m', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Henry Harris"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'e8f2a30e-de7f-40a4-9772-06fca7419908', 'authenticated', 'authenticated', 'ivy.ivanov@authorsinfo.com', '$2a$06$MoClFJsEMdEGgoHdttSYkO76VTScGPqGlyBGfoNvRtYId/4Pi0clq', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Ivy Ivanov"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'b3bd5d6b-e22a-4d61-a4a7-eee77a7063ce', 'authenticated', 'authenticated', 'jack.johnson@authorsinfo.com', '$2a$06$b56Pph8ty/yNWl1nx05XE.LKDkL/tt7rUUb9rEDJHLOGDLSDgkWOi', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Jack Johnson"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '04d0c415-9de4-43dc-99fd-bcc8f980cefc', 'authenticated', 'authenticated', 'kate.king@authorsinfo.com', '$2a$06$b9Se91zU9kLhOyC9FCMrUuVFu09OMgbjveimChCec8EssLRdDHGWC', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Kate King"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'da99da90-51c9-46b6-9b1a-5b28603a2aa7', 'authenticated', 'authenticated', 'liam.lee@authorsinfo.com', '$2a$06$PQpdVFtd5HCC5RCAPa3SsuLfT6pby4BpVDTJy/WGkFRx0q1ntpWq6', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Liam Lee"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'fdcbe6e9-108d-4939-b10f-77b422731a18', 'authenticated', 'authenticated', 'maya.miller@authorsinfo.com', '$2a$06$e5gP2QR36p3FwGonFDmEY.yM2jAuIxZlbhn.hqlIUAMTxA9X2W8bW', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Maya Miller"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'deca955d-e8c5-4c28-b190-f3ab7b382748', 'authenticated', 'authenticated', 'noah.nelson@authorsinfo.com', '$2a$06$04O7dE9XFPqTj0Qu8Sok2OhKPghLFRwM4d666ag3TD8JySIzY.yni', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Noah Nelson"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '97f1407e-dcab-4143-a59e-873634654503', 'authenticated', 'authenticated', 'olivia.o''connor@authorsinfo.com', '$2a$06$qjck1fL144bjXsBpvV0IbeMmmJACJ3yWcRAIRqmxhLMMT5Tm5DuTq', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Olivia O''Connor"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '05b4dc59-ae8e-47a1-8409-936b159c2c22', 'authenticated', 'authenticated', 'paul.parker@authorsinfo.com', '$2a$06$6enBqQupSu94LhKBpbyv7OKHHkMqmN9Hw0B4UEAW8qrM0vzrmGRJ2', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Paul Parker"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '6bea7109-b400-4124-839e-3fe6466f3ae8', 'authenticated', 'authenticated', 'quinn.quinn@authorsinfo.com', '$2a$06$0XbFU5Fk3.GK5b.Sxa367O/oRQpBBbGd9ZTCRarLebnR8q17R8Rda', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Quinn Quinn"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '5969c24a-1dd6-47ec-9e19-e22a0d5ebf40', 'authenticated', 'authenticated', 'ruby.roberts@authorsinfo.com', '$2a$06$kW4NWGWfFEON392/DHQJCuCnO0D7x.EMXNd1UhD7A.TPwmDqX28JK', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Ruby Roberts"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '4ca9b634-8557-427f-9b7f-1d8679b7f332', 'authenticated', 'authenticated', 'sam.smith@authorsinfo.com', '$2a$06$aQk0T3NBYJpq.nTUAIAvzu8mg5LLd3TDKtGxDLbIoAnCnPa9w4ue2', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Sam Smith"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '2f4e5e3b-9aa3-45cf-9edf-86815d76f735', 'authenticated', 'authenticated', 'tara.taylor@authorsinfo.com', '$2a$06$mkGQ3LhNke2g0NuNbRymIOg5ieCiqVqyG/BfnEl1.cGUZN2jYkZ9q', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Tara Taylor"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '78b8de0c-9469-4b38-96bb-c97bbf3d8607', 'authenticated', 'authenticated', 'uma.upton@authorsinfo.com', '$2a$06$VK4fuYhP/5e04pkDu4guReVK8MTkrMJ26dkv4qmx4Tm1k8Ay/YHaG', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Uma Upton"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'e81a2715-e3dd-4133-ad2a-e400a74e24ad', 'authenticated', 'authenticated', 'victor.vargas@authorsinfo.com', '$2a$06$WRHcASWAV2X8Fq5rY.JPj.LMlVVcBysPEXM5nRbAYkv7aLczK22mG', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Victor Vargas"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'c954586e-f506-48b3-ba5d-c6b0d3d561c8', 'authenticated', 'authenticated', 'wendy.wilson@authorsinfo.com', '$2a$06$hem.Jw11X6k4J67W.bwc4OSoL7wbVpeYuUOCz8I7dcXSmijxex/rq', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Wendy Wilson"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '8dd18808-4777-4877-bde1-b54b1d3ffa81', 'authenticated', 'authenticated', 'grace.garcia@authorsinfo.com', '$2a$06$aR.K7tBBcjqr1dOcijGlceT0cl2vxP96KD.o7HNuNLztGhZ3T6nOe', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-31 19:40:59.74628+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Grace Garcia"}', false, '2025-07-03 09:08:57.268783+00', '2025-08-01 04:01:08.877353+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '45f98998-ba1d-4439-b2ee-1d403fee0e7c', 'authenticated', 'authenticated', 'charlie.clark@authorsinfo.com', '$2a$06$MromcojVE95DDcpA3hkpt.0zJsJ9Yf86rQoG87uTzgpwDQzU8CtaG', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-31 15:27:28.500089+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Charlie Clark"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-31 16:43:19.569874+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', 'authenticated', 'authenticated', 'diana.davis@authorsinfo.com', '$2a$06$wSvX1r4eMRKNDJV2q0FPzu4ppDrW3JQqH5Ey68Vww.bgyyizRpMZq', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-08-01 04:11:51.769087+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Diana Davis"}', false, '2025-07-03 09:08:57.268783+00', '2025-08-02 05:12:46.454163+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'fcc9099b-5297-418b-b164-adf93af0e0fa', 'authenticated', 'authenticated', 'xander.xavier@authorsinfo.com', '$2a$06$0GW0.fEV4E7nAYHb0wmHyuKPqOH3YtNG99JD8kkBoIAdyJNLLDS0y', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Xander Xavier"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'eb6c0fb9-6baf-4a90-870d-06d87849efa5', 'authenticated', 'authenticated', 'yara.young@authorsinfo.com', '$2a$06$IsUEfU28u4JNb2xtqCrqyOZK6AntodYpLJdVjxxv7PfWRwCCLtDRC', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Yara Young"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'a213628a-3e5a-4471-8b72-001ae4683c31', 'authenticated', 'authenticated', 'zoe.zimmerman@authorsinfo.com', '$2a$06$bgiBL9SVVLb1r5qb6JyQD.eRZobUeQ1sPNJvCltHcZd9mrXzJWf0C', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Zoe Zimmerman"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '719afc5a-0063-4fa4-9d8d-f91e8bfacb47', 'authenticated', 'authenticated', 'alex.adams@authorsinfo.com', '$2a$06$nLGrDGLwi6CebjY6sjMxWupp3d16bY0ZUjjmEtOn61mAlLkNH/e/S', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Alex Adams"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'dedfeba8-312b-4c56-91a9-9bf0ffe7d0c6', 'authenticated', 'authenticated', 'blake.baker@authorsinfo.com', '$2a$06$hixbzEJvJMn8gvK2vau6Q.r8ODiGAa9YjTi51gSbKFAPCpevt/ovW', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Blake Baker"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'b529a24a-4840-4771-919c-baf2142f91a2', 'authenticated', 'authenticated', 'casey.cooper@authorsinfo.com', '$2a$06$//w6xZRsoSQZtRwU2H.M9eeZ8Rg..t.T8caLmQylK2ggjmCwtrqk.', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Casey Cooper"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'b474d5f5-cbf2-49af-8d03-2ca4aea11081', 'authenticated', 'authenticated', 'drew.dixon@authorsinfo.com', '$2a$06$n8GOTnrvfOU8OFz2e.MaG.1ZRZ2r0XS4VH4Ueq4XkE3TFebdYbuJW', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-03 09:08:57.268783+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Drew Dixon"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '1cd12917-899d-4676-a2bc-cad281a68c36', 'authenticated', 'authenticated', 'testuser@authorsinfo.com', '$2a$10$1aW9JIsS7ZOFfyn6nNJz1OR75Qf/OiXdggDK2oTDSgv6.JLTTFtjm', '2025-07-03 09:15:12.899846+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"name": "Test User", "full_name": "Test User", "email_verified": true}', NULL, '2025-07-03 09:15:12.866403+00', '2025-07-03 09:15:12.905046+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '2474659f-003e-4faa-8c53-9969c33f20b2', 'authenticated', 'authenticated', 'bob.brown@authorsinfo.com', '$2a$06$5RCq5dmZPcl3OZhYMaoqdOhv2Ex54DFm7leXR4SNrRIqhLNw1oLaq', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-31 02:41:22.400025+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Bob Brown"}', false, '2025-07-03 09:08:57.268783+00', '2025-07-31 08:04:28.689822+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'authenticated', 'authenticated', 'alice.anderson@authorsinfo.com', '$2a$06$9bmNBfzOACK1RchAsGSIzenD2nID6n/aIfd.W62t0.R.Hb8GWO.Um', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '', '2025-07-03 09:08:57.268783+00', '', NULL, '', '', NULL, '2025-07-13 04:17:31.293211+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Alice Anderson"}', true, '2025-07-03 09:08:57.268783+00', '2025-07-31 15:09:04.064555+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('1cd12917-899d-4676-a2bc-cad281a68c36', '1cd12917-899d-4676-a2bc-cad281a68c36', '{"sub": "1cd12917-899d-4676-a2bc-cad281a68c36", "email": "testuser@authorsinfo.com", "email_verified": false, "phone_verified": false}', 'email', '2025-07-03 09:15:12.881005+00', '2025-07-03 09:15:12.881083+00', '2025-07-03 09:15:12.881083+00', 'b0fafbe9-4f3b-4bde-b217-11b4f7618da3');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('6ec08223-0e0b-4c33-8444-0ad71e053edf', '2474659f-003e-4faa-8c53-9969c33f20b2', '2025-07-31 02:41:22.400142+00', '2025-07-31 08:04:28.694582+00', NULL, 'aal1', NULL, '2025-07-31 08:04:28.694505', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '45.136.154.251', NULL),
	('ef73344d-2fab-42ce-892f-d1707d4e1bdf', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', '2025-08-01 04:11:51.769179+00', '2025-08-02 05:12:46.465879+00', NULL, 'aal1', NULL, '2025-08-02 05:12:46.465781', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '45.144.115.41', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('6ec08223-0e0b-4c33-8444-0ad71e053edf', '2025-07-31 02:41:22.492642+00', '2025-07-31 02:41:22.492642+00', 'password', 'eff3dfe1-afdb-4524-829b-4c588010e470'),
	('ef73344d-2fab-42ce-892f-d1707d4e1bdf', '2025-08-01 04:11:51.795265+00', '2025-08-01 04:11:51.795265+00', 'password', '01a82653-6743-402f-8cc5-7421ea4bf9e2');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 463, 'imogchuyj2fp', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', true, '2025-08-01 04:11:51.777896+00', '2025-08-02 00:41:54.997047+00', NULL, 'ef73344d-2fab-42ce-892f-d1707d4e1bdf'),
	('00000000-0000-0000-0000-000000000000', 465, 'auzdlbxoempl', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', true, '2025-08-02 01:40:14.76188+00', '2025-08-02 02:45:35.157073+00', 'gge3u2ynspxs', 'ef73344d-2fab-42ce-892f-d1707d4e1bdf'),
	('00000000-0000-0000-0000-000000000000', 467, 'bvd6bsqpygbr', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', true, '2025-08-02 04:05:34.651958+00', '2025-08-02 05:12:46.425161+00', 'czdnmy367yjo', 'ef73344d-2fab-42ce-892f-d1707d4e1bdf'),
	('00000000-0000-0000-0000-000000000000', 464, 'gge3u2ynspxs', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', true, '2025-08-02 00:41:55.022461+00', '2025-08-02 01:40:14.742241+00', 'imogchuyj2fp', 'ef73344d-2fab-42ce-892f-d1707d4e1bdf'),
	('00000000-0000-0000-0000-000000000000', 466, 'czdnmy367yjo', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', true, '2025-08-02 02:45:35.183097+00', '2025-08-02 04:05:34.639446+00', 'auzdlbxoempl', 'ef73344d-2fab-42ce-892f-d1707d4e1bdf'),
	('00000000-0000-0000-0000-000000000000', 468, 'vpa2hcxpljqs', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', false, '2025-08-02 05:12:46.441417+00', '2025-08-02 05:12:46.441417+00', 'bvd6bsqpygbr', 'ef73344d-2fab-42ce-892f-d1707d4e1bdf'),
	('00000000-0000-0000-0000-000000000000', 449, 'ewgvn5mztaux', '2474659f-003e-4faa-8c53-9969c33f20b2', true, '2025-07-31 02:41:22.424701+00', '2025-07-31 05:09:51.051505+00', NULL, '6ec08223-0e0b-4c33-8444-0ad71e053edf'),
	('00000000-0000-0000-0000-000000000000', 451, '7awx4oey5dba', '2474659f-003e-4faa-8c53-9969c33f20b2', true, '2025-07-31 05:09:51.052505+00', '2025-07-31 06:21:56.008795+00', 'ewgvn5mztaux', '6ec08223-0e0b-4c33-8444-0ad71e053edf'),
	('00000000-0000-0000-0000-000000000000', 452, '4yofdymrmt4c', '2474659f-003e-4faa-8c53-9969c33f20b2', true, '2025-07-31 06:21:56.029044+00', '2025-07-31 08:04:28.675167+00', '7awx4oey5dba', '6ec08223-0e0b-4c33-8444-0ad71e053edf'),
	('00000000-0000-0000-0000-000000000000', 454, 'ls7i4iu3ulwu', '2474659f-003e-4faa-8c53-9969c33f20b2', false, '2025-07-31 08:04:28.684339+00', '2025-07-31 08:04:28.684339+00', '4yofdymrmt4c', '6ec08223-0e0b-4c33-8444-0ad71e053edf');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: entity_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."entity_types" ("id", "name", "description", "created_at", "updated_at", "entity_category") VALUES
	('f21817f5-d069-404d-bda8-fef9e3485de1', 'User Profile', 'User profile photos and avatars', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'user'),
	('2486ee24-09a1-47f8-a66e-17c136e1d87f', 'User Album', 'User photo albums and galleries', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'user'),
	('4712c048-7cad-4993-b164-298571775c42', 'User Avatar', 'User avatar and profile pictures', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'user'),
	('bf873cdb-3753-478c-8a08-0e25c2ed100b', 'User Cover', 'User profile cover images', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'user'),
	('b622526d-1c37-47e3-ab48-ffd5d9a715bc', 'Publisher Logo', 'Publisher company logos and branding', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'publisher'),
	('cc7fa641-0a36-4e0f-b0c4-e6374bad28f1', 'Publisher Gallery', 'Publisher photo galleries and content', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'publisher'),
	('e6ae3c7b-373a-463e-a945-a8d9af9a22d8', 'Publisher Cover', 'Publisher cover images and banners', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'publisher'),
	('2861adeb-3b2a-4544-85ed-4fa691ea4e4d', 'Author Portrait', 'Author profile photos and portraits', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'author'),
	('0228ffac-6109-4067-8d63-7899c335cb08', 'Author Gallery', 'Author photo galleries and content', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'author'),
	('50d9dcae-44b7-4a42-89d0-130797161763', 'Author Cover', 'Author cover images and banners', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'author'),
	('777b8367-16c1-476f-bf47-86e11d55fe5f', 'Group Cover', 'Group cover images and banners', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'group'),
	('ddc819c1-2b0d-4c75-ab36-86772ec57ae6', 'Group Gallery', 'Group photo galleries and content', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'group'),
	('f09a7a34-bcbb-4bcc-a37e-4e5546564e6b', 'Group Logo', 'Group logos and branding', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'group'),
	('9d91008f-4f24-4501-b18a-922e2cfd6d34', 'Book Cover', 'Book cover images and artwork', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'book'),
	('19ffdb06-fc80-4e91-bf26-ca6837bbe28e', 'Book Gallery', 'Book photo galleries and content', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'book'),
	('0512d524-0f40-463d-ab13-0727facd260f', 'Book Preview', 'Book preview images and samples', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'book'),
	('8252e265-a1ec-4455-930a-c8cdc39cd095', 'Event Banner', 'Event promotional banners and images', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'event'),
	('1010c723-036b-4680-a62f-cea21c4b6c34', 'Event Gallery', 'Event photo galleries and content', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'event'),
	('c26b7dad-a31f-43bf-b2fd-aa759e4087fe', 'Event Logo', 'Event logos and branding', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'event'),
	('1f279528-5266-41ba-a6cf-c961ce2373e1', 'Event Cover', 'Event cover images and banners', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'event'),
	('d883d093-c891-42ae-8b65-d9e15f3e8fd0', 'Review Image', 'Review-related images and content', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'review'),
	('f4c33944-d22b-4256-b70a-d90472622682', 'Review Gallery', 'Review photo galleries', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'review'),
	('c1acc492-a93c-4d32-bf61-c624f180b9be', 'Video Thumbnail', 'Video thumbnail images', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'video'),
	('f4745028-1dc6-40ef-99f8-879ca75f1b32', 'Video Cover', 'Video cover images', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'video'),
	('cbf821e8-cd86-42b0-a296-b8333d49740d', 'Video Gallery', 'Video-related galleries', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'video'),
	('35783e61-f79b-4ce8-8686-db0a0fc2dc5c', 'Tag Icon', 'Tag icons and symbols', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'tag'),
	('b85351c4-66a0-4194-a526-0a07ae19c102', 'Tag Image', 'Tag-related images', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'tag'),
	('cd49e490-8b08-4376-9e4d-07a9d54320d6', 'Content Image', 'General content images and media', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'content'),
	('1c61913a-e4fb-47d3-a507-10416b8b1677', 'Content Cover', 'Content cover images', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'content'),
	('3a8ed4b9-1a94-445d-b276-6d4eb90a3fc5', 'Content Gallery', 'Content photo galleries', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'content'),
	('70ded568-d7fa-4978-a6f6-9a8f5862555a', 'Entity Header Cover', 'Entity header cover images', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'entity_header_cover'),
	('d7cb8ca8-73da-433a-9403-a17dcb107fd6', 'System Image', 'System and administrative images', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'system'),
	('f70c7330-e42d-441e-804a-4212472ff830', 'Temporary Image', 'Temporary and processing images', '2025-07-07 02:49:07.871282+00', '2025-07-07 02:49:07.871282+00', 'temporary'),
	('8ad193fd-c476-46c6-8159-bcf42d27a24c', 'Photo Gallery', 'General photo galleries and collections', '2025-07-29 00:34:49.681688+00', '2025-07-29 00:34:49.681688+00', 'content'),
	('843bc528-95da-404a-8d8d-aa693bd7bae4', 'Premium Content', 'Premium and monetized photo content', '2025-07-29 00:34:49.681688+00', '2025-07-29 00:34:49.681688+00', 'content'),
	('4a20e97a-8d35-45f8-bbbc-51ea4b64f6bb', 'Community Album', 'Community-driven photo albums', '2025-07-29 00:34:49.681688+00', '2025-07-29 00:34:49.681688+00', 'community');


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."roles" ("id", "name", "created_at", "updated_at") VALUES
	('61ae42f3-cb06-4661-bf02-7f6160be7357', 'super-admin', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00'),
	('df8b11d2-214b-4e42-a2c6-bb0acce95cf7', 'admin', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00'),
	('9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', 'user', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "email", "name", "created_at", "updated_at", "role_id", "permalink") VALUES
	('e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'alice.anderson@authorsinfo.com', 'Alice Anderson', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '61ae42f3-cb06-4661-bf02-7f6160be7357', NULL),
	('2474659f-003e-4faa-8c53-9969c33f20b2', 'bob.brown@authorsinfo.com', 'Bob Brown', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'df8b11d2-214b-4e42-a2c6-bb0acce95cf7', NULL),
	('45f98998-ba1d-4439-b2ee-1d403fee0e7c', 'charlie.clark@authorsinfo.com', 'Charlie Clark', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('c5b68ab4-e8bc-4291-a646-7f8ab4b99528', 'diana.davis@authorsinfo.com', 'Diana Davis', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('355dd8d6-7ef5-46cf-9bad-67fd863cbc88', 'eve.evans@authorsinfo.com', 'Eve Evans', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('62be2226-e3d4-4b10-951d-13c3972145b1', 'frank.fisher@authorsinfo.com', 'Frank Fisher', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('8dd18808-4777-4877-bde1-b54b1d3ffa81', 'grace.garcia@authorsinfo.com', 'Grace Garcia', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('0d1f32d3-18b4-4aa8-b858-141b139aacd8', 'henry.harris@authorsinfo.com', 'Henry Harris', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('e8f2a30e-de7f-40a4-9772-06fca7419908', 'ivy.ivanov@authorsinfo.com', 'Ivy Ivanov', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('b3bd5d6b-e22a-4d61-a4a7-eee77a7063ce', 'jack.johnson@authorsinfo.com', 'Jack Johnson', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('04d0c415-9de4-43dc-99fd-bcc8f980cefc', 'kate.king@authorsinfo.com', 'Kate King', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('da99da90-51c9-46b6-9b1a-5b28603a2aa7', 'liam.lee@authorsinfo.com', 'Liam Lee', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('fdcbe6e9-108d-4939-b10f-77b422731a18', 'maya.miller@authorsinfo.com', 'Maya Miller', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('deca955d-e8c5-4c28-b190-f3ab7b382748', 'noah.nelson@authorsinfo.com', 'Noah Nelson', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('97f1407e-dcab-4143-a59e-873634654503', 'olivia.o''connor@authorsinfo.com', 'Olivia O''Connor', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('05b4dc59-ae8e-47a1-8409-936b159c2c22', 'paul.parker@authorsinfo.com', 'Paul Parker', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('6bea7109-b400-4124-839e-3fe6466f3ae8', 'quinn.quinn@authorsinfo.com', 'Quinn Quinn', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('5969c24a-1dd6-47ec-9e19-e22a0d5ebf40', 'ruby.roberts@authorsinfo.com', 'Ruby Roberts', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('4ca9b634-8557-427f-9b7f-1d8679b7f332', 'sam.smith@authorsinfo.com', 'Sam Smith', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('2f4e5e3b-9aa3-45cf-9edf-86815d76f735', 'tara.taylor@authorsinfo.com', 'Tara Taylor', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('78b8de0c-9469-4b38-96bb-c97bbf3d8607', 'uma.upton@authorsinfo.com', 'Uma Upton', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('e81a2715-e3dd-4133-ad2a-e400a74e24ad', 'victor.vargas@authorsinfo.com', 'Victor Vargas', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('c954586e-f506-48b3-ba5d-c6b0d3d561c8', 'wendy.wilson@authorsinfo.com', 'Wendy Wilson', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('fcc9099b-5297-418b-b164-adf93af0e0fa', 'xander.xavier@authorsinfo.com', 'Xander Xavier', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('eb6c0fb9-6baf-4a90-870d-06d87849efa5', 'yara.young@authorsinfo.com', 'Yara Young', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('a213628a-3e5a-4471-8b72-001ae4683c31', 'zoe.zimmerman@authorsinfo.com', 'Zoe Zimmerman', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('719afc5a-0063-4fa4-9d8d-f91e8bfacb47', 'alex.adams@authorsinfo.com', 'Alex Adams', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('dedfeba8-312b-4c56-91a9-9bf0ffe7d0c6', 'blake.baker@authorsinfo.com', 'Blake Baker', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('b529a24a-4840-4771-919c-baf2142f91a2', 'casey.cooper@authorsinfo.com', 'Casey Cooper', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL),
	('b474d5f5-cbf2-49af-8d03-2ca4aea11081', 'drew.dixon@authorsinfo.com', 'Drew Dixon', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', '9f2d9d7b-1851-41e1-bab3-cb5aded6a9a5', NULL);


--
-- Data for Name: images; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."images" ("id", "url", "alt_text", "created_at", "updated_at", "thumbnail_url", "medium_url", "large_url", "original_filename", "file_size", "width", "height", "format", "mime_type", "caption", "metadata", "storage_path", "storage_provider", "is_processed", "processing_status", "deleted_at", "entity_type_id", "description", "tags", "location", "camera_info", "edit_history", "quality_score", "content_rating", "upload_source", "ip_address", "user_agent", "download_count", "view_count", "like_count", "comment_count", "share_count", "revenue_generated", "is_monetized", "is_featured", "is_nsfw", "is_ai_generated", "copyright_status", "license_type", "watermark_applied", "uploader_id", "uploader_type") VALUES
	('8c786f71-8092-412b-9657-99693532b4f0', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753939143/user_album_album_d677f90e-2d80-433e-90a0-1717fef7bc8d/dek97zfjfe88rnlrvgfu.webp', 'album image 3 for user album d677f90e-2d80-433e-90a0-1717fef7bc8d', '2025-07-31 05:19:04.006651+00', '2025-07-31 05:19:04.006651+00', NULL, NULL, NULL, NULL, 49836, 777, 1200, 'webp', 'image/webp', NULL, '{"cloudinary_public_id": "user_album_album_d677f90e-2d80-433e-90a0-1717fef7bc8d/dek97zfjfe88rnlrvgfu"}', 'user_album_album_d677f90e-2d80-433e-90a0-1717fef7bc8d', 'cloudinary', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 1, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, '2474659f-003e-4faa-8c53-9969c33f20b2', 'user'),
	('57fbc74f-1371-4481-bd60-a647b84793e8', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1752390795/authorsinfo/bookcovers/amosackeg6n5rnftp7ab.webp', 'High Rollers', '2025-07-13 07:13:15.648404+00', '2025-07-13 07:13:15.648404+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"entity_id": null, "entity_type": "book"}', NULL, 'supabase', false, NULL, NULL, '9d91008f-4f24-4501-b18a-922e2cfd6d34', NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, NULL, NULL),
	('22e97769-c2df-4220-bed8-e9261ace71a6', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1751934325/authorsinfo/book_entity_header_cover/cpa9jjsshxwm7xzz8h3m.webp', 'Entity header cover for book Start with Amen: How I Learned to Surrender by Keeping the End in Mind', '2025-07-08 00:25:26.626261+00', '2025-07-08 00:25:26.626261+00', NULL, NULL, NULL, 'cropped-cover.jpg', 66229, NULL, NULL, NULL, 'image/jpeg', NULL, NULL, 'authorsinfo/book_entity_header_cover', 'cloudinary', true, 'completed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, NULL, NULL),
	('107a9e86-6578-4bb7-98f5-9c1a8d944b3c', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1752390799/authorsinfo/bookcovers/j70n2byiegc3kqmpcvbk.webp', 'Jaded', '2025-07-13 07:13:20.252136+00', '2025-07-13 07:13:20.252136+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"entity_id": null, "entity_type": "book"}', NULL, 'supabase', false, NULL, NULL, '9d91008f-4f24-4501-b18a-922e2cfd6d34', NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, NULL, NULL),
	('a981cacd-a652-4c6f-96cd-37b0571f3b04', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1752390979/authorsinfo/book_entity_header_cover/sagxz6dhi1meutxr4wiu.webp', 'Entity header cover for book Touch', '2025-07-13 07:16:20.900151+00', '2025-07-13 07:16:20.900151+00', NULL, NULL, NULL, 'cropped-cover.jpg', 127253, NULL, NULL, NULL, 'image/jpeg', NULL, NULL, 'authorsinfo/book_entity_header_cover', 'cloudinary', true, 'completed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, NULL, NULL),
	('7b164d86-ae0d-41f3-b6ab-c5d6a3f7e9ed', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753751024/authorsinfo/user_photos/vpby2faybre9o38lqvsm.webp', 'zofoggs4jsgant1nasrk.avif', '2025-07-29 01:03:45.206076+00', '2025-07-29 01:03:45.206076+00', NULL, NULL, NULL, 'zofoggs4jsgant1nasrk.avif', 33106, NULL, NULL, NULL, 'image/avif', NULL, NULL, 'authorsinfo/user_photos', 'cloudinary', true, 'completed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, NULL, NULL),
	('74e6b36a-c202-4241-a985-d67388bd88d9', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753854511/user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/q2opwdpwwa3ptxvhxmre.webp', 'album image 1 for user album a3231fc2-9374-47bb-9787-5cfa7a0c9890', '2025-07-30 05:48:32.826936+00', '2025-07-30 05:48:32.826936+00', NULL, NULL, NULL, NULL, 31276, 777, 1200, 'webp', 'image/webp', NULL, '{"cloudinary_public_id": "user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/q2opwdpwwa3ptxvhxmre"}', 'user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890', 'cloudinary', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, NULL, NULL),
	('03332e08-3745-48e9-b133-76949e1dc7bc', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753854513/user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/szj8ygceooef62wiwuas.webp', 'album image 2 for user album a3231fc2-9374-47bb-9787-5cfa7a0c9890', '2025-07-30 05:48:34.528328+00', '2025-07-30 05:48:34.528328+00', NULL, NULL, NULL, NULL, 54614, 777, 1200, 'webp', 'image/webp', NULL, '{"cloudinary_public_id": "user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/szj8ygceooef62wiwuas"}', 'user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890', 'cloudinary', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, NULL, NULL),
	('a6930ebe-aedc-43a3-a95a-63d388eb28d8', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1751836928/authorsinfo/user_photos/ourfrn2hhavfwt8smdev.webp', 'man-4333898_640.jpg', '2025-07-06 21:22:09.66121+00', '2025-07-06 21:22:09.66121+00', NULL, NULL, NULL, 'man-4333898_640.jpg', 96067, NULL, NULL, NULL, 'image/jpeg', NULL, NULL, 'authorsinfo/user_photos', 'cloudinary', true, 'completed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, NULL, NULL),
	('935af901-1d25-44d5-95bb-c924941f16c2', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1751934362/authorsinfo/book_entity_header_avatar/ygwwcdcotylmwk7nr6px.webp', 'Entity header avatar for book Start with Amen: How I Learned to Surrender by Keeping the End in Mind', '2025-07-08 00:26:03.62454+00', '2025-07-08 00:26:03.62454+00', NULL, NULL, NULL, 'cropped-avatar.jpg', 37575, NULL, NULL, NULL, 'image/jpeg', NULL, NULL, 'authorsinfo/book_entity_header_avatar', 'cloudinary', true, 'completed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, NULL, NULL),
	('bfe506c2-2b40-42e7-9abf-c640ea336464', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1751939823/authorsinfo/book_entity_header_avatar/s0mmiknzs6khsixa96pw.webp', 'Entity header avatar for book Start with Amen: How I Learned to Surrender by Keeping the End in Mind', '2025-07-08 01:57:06.751372+00', '2025-07-08 01:57:06.751372+00', NULL, NULL, NULL, 'cropped-avatar.jpg', 37267, NULL, NULL, NULL, 'image/jpeg', NULL, NULL, 'authorsinfo/book_entity_header_avatar', 'cloudinary', true, 'completed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, NULL, NULL),
	('642cfd82-6a4c-459d-a2d9-8cf8501e57f7', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1751968183/authorsinfo/bookcovers/vjxifjdlzrc1h5p28h5q.webp', 'Super Simple Mission Kit Featuring Tales of the Not Forgotten: A Fully-resources Missions Curriculum (Kids Serving Kids)', '2025-07-08 09:49:44.56571+00', '2025-07-08 09:49:44.56571+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"entity_id": null, "entity_type": "book"}', NULL, 'supabase', false, NULL, NULL, '9d91008f-4f24-4501-b18a-922e2cfd6d34', NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, NULL, NULL),
	('03e2ac67-8c1a-4923-ac8d-702e775a3886', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1752390797/authorsinfo/bookcovers/zofoggs4jsgant1nasrk.webp', 'Touch', '2025-07-13 07:13:18.300464+00', '2025-07-13 07:13:18.300464+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"entity_id": null, "entity_type": "book"}', NULL, 'supabase', false, NULL, NULL, '9d91008f-4f24-4501-b18a-922e2cfd6d34', NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, NULL, NULL),
	('55a9e8a0-c5a4-41aa-9e02-dce5afb7eeb7', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753854515/user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/notkek6momlqhflrtryy.webp', 'album image 3 for user album a3231fc2-9374-47bb-9787-5cfa7a0c9890', '2025-07-30 05:48:36.437697+00', '2025-07-30 05:48:36.437697+00', NULL, NULL, NULL, NULL, 49836, 777, 1200, 'webp', 'image/webp', NULL, '{"cloudinary_public_id": "user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/notkek6momlqhflrtryy"}', 'user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890', 'cloudinary', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, NULL, NULL),
	('85de2205-2033-435f-9d2f-e8ab265cf702', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753975124/authorsinfo/book_entity_header_cover/jknrcvzcitkpe2tthgh7.webp', 'Entity header cover for book Touch', '2025-07-31 15:18:46.35346+00', '2025-07-31 15:18:46.35346+00', NULL, NULL, NULL, 'cropped-cover.jpg', 127239, NULL, NULL, NULL, 'image/jpeg', NULL, NULL, 'authorsinfo/book_entity_header_cover', 'cloudinary', true, 'completed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, NULL, NULL),
	('34d8a83d-6f49-46e5-8691-42a75429539d', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1751922073/authorsinfo/book_entity_header_cover/nhkuwm8fucu37zx4uh3l.webp', 'Entity header cover for book AMANTE TENTADORA (Spanish Edition)', '2025-07-07 21:01:15.065606+00', '2025-07-07 21:01:15.065606+00', NULL, NULL, NULL, 'cropped-cover.jpg', 127453, NULL, NULL, NULL, 'image/jpeg', NULL, NULL, 'authorsinfo/book_entity_header_cover', 'cloudinary', true, 'completed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, NULL, NULL),
	('c84a720b-b30d-4647-9219-a976419ea255', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1751943341/authorsinfo/book_entity_header_avatar/d9ktzmugoymyeimumofd.webp', 'Entity header avatar for book Start with Amen: How I Learned to Surrender by Keeping the End in Mind', '2025-07-08 02:55:42.923991+00', '2025-07-08 02:55:42.923991+00', NULL, NULL, NULL, 'cropped-avatar.jpg', 42537, NULL, NULL, NULL, 'image/jpeg', NULL, NULL, 'authorsinfo/book_entity_header_avatar', 'cloudinary', true, 'completed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, NULL, NULL),
	('8be1b05d-c209-49aa-a0ff-202743164ddc', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1751949606/authorsinfo/book_entity_header_avatar/radfyakfkfwf3qxzayat.webp', 'Entity header avatar for book Start with Amen: How I Learned to Surrender by Keeping the End in Mind', '2025-07-08 04:40:08.316719+00', '2025-07-08 04:40:08.316719+00', NULL, NULL, NULL, 'cropped-avatar.jpg', 43078, NULL, NULL, NULL, 'image/jpeg', NULL, NULL, 'authorsinfo/book_entity_header_avatar', 'cloudinary', true, 'completed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, NULL, NULL),
	('80864649-8394-455f-8e65-cf4b80e29af5', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1751836839/authorsinfo/user_photos/bcnyhziv8cyqbi9jxe7r.webp', 'man-1845259_640.jpg', '2025-07-06 21:20:40.226968+00', '2025-07-06 21:20:40.226968+00', NULL, NULL, NULL, 'man-1845259_640.jpg', 64985, NULL, NULL, NULL, 'image/jpeg', NULL, NULL, 'authorsinfo/user_photos', 'cloudinary', true, 'completed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, NULL, NULL),
	('44c520f7-43af-4abb-acf6-e00f50b74f3b', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753939140/user_album_album_d677f90e-2d80-433e-90a0-1717fef7bc8d/earrlduh2mbukgpcc3ns.webp', 'album image 1 for user album d677f90e-2d80-433e-90a0-1717fef7bc8d', '2025-07-31 05:19:01.108004+00', '2025-07-31 05:19:01.108004+00', NULL, NULL, NULL, NULL, 31276, 777, 1200, 'webp', 'image/webp', NULL, '{"cloudinary_public_id": "user_album_album_d677f90e-2d80-433e-90a0-1717fef7bc8d/earrlduh2mbukgpcc3ns"}', 'user_album_album_d677f90e-2d80-433e-90a0-1717fef7bc8d', 'cloudinary', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 1, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, '2474659f-003e-4faa-8c53-9969c33f20b2', 'user'),
	('2751be33-e1d0-42c3-841a-fc81e10271d7', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753938885/user_album_album_dfe0fb85-9fa0-479f-9e21-ea95ceef695b/n5pxwvvuezimifxswemu.webp', 'album image 2 for user album dfe0fb85-9fa0-479f-9e21-ea95ceef695b', '2025-07-31 05:14:46.74481+00', '2025-07-31 05:14:46.74481+00', NULL, NULL, NULL, NULL, 54614, 777, 1200, 'webp', 'image/webp', NULL, '{"cloudinary_public_id": "user_album_album_dfe0fb85-9fa0-479f-9e21-ea95ceef695b/n5pxwvvuezimifxswemu"}', 'user_album_album_dfe0fb85-9fa0-479f-9e21-ea95ceef695b', 'cloudinary', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 1, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, '2474659f-003e-4faa-8c53-9969c33f20b2', 'user'),
	('1890a0a7-c11e-4230-b968-905c8f394a77', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753931436/user_album_album_dfe0fb85-9fa0-479f-9e21-ea95ceef695b/m8cgld90l3k3w7wlemtz.webp', 'album image 1 for user album dfe0fb85-9fa0-479f-9e21-ea95ceef695b', '2025-07-31 03:10:37.14272+00', '2025-07-31 03:10:37.14272+00', NULL, NULL, NULL, NULL, 31276, 777, 1200, 'webp', 'image/webp', NULL, '{"cloudinary_public_id": "user_album_album_dfe0fb85-9fa0-479f-9e21-ea95ceef695b/m8cgld90l3k3w7wlemtz"}', 'user_album_album_dfe0fb85-9fa0-479f-9e21-ea95ceef695b', 'cloudinary', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, '2474659f-003e-4faa-8c53-9969c33f20b2', 'user'),
	('e117e984-86cb-45c0-b108-05f99b43a0d6', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753931437/user_album_album_dfe0fb85-9fa0-479f-9e21-ea95ceef695b/fsbfssp0nbfkaif94gma.webp', 'album image 2 for user album dfe0fb85-9fa0-479f-9e21-ea95ceef695b', '2025-07-31 03:10:38.404274+00', '2025-07-31 03:10:38.404274+00', NULL, NULL, NULL, NULL, 54614, 777, 1200, 'webp', 'image/webp', NULL, '{"cloudinary_public_id": "user_album_album_dfe0fb85-9fa0-479f-9e21-ea95ceef695b/fsbfssp0nbfkaif94gma"}', 'user_album_album_dfe0fb85-9fa0-479f-9e21-ea95ceef695b', 'cloudinary', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, '2474659f-003e-4faa-8c53-9969c33f20b2', 'user'),
	('bbc751cf-e7d8-43d9-81d4-bb5c4718b756', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753938884/user_album_album_dfe0fb85-9fa0-479f-9e21-ea95ceef695b/ek6a593ahndzilelmund.webp', 'album image 1 for user album dfe0fb85-9fa0-479f-9e21-ea95ceef695b', '2025-07-31 05:14:45.618499+00', '2025-07-31 05:14:45.618499+00', NULL, NULL, NULL, NULL, 31276, 777, 1200, 'webp', 'image/webp', NULL, '{"cloudinary_public_id": "user_album_album_dfe0fb85-9fa0-479f-9e21-ea95ceef695b/ek6a593ahndzilelmund"}', 'user_album_album_dfe0fb85-9fa0-479f-9e21-ea95ceef695b', 'cloudinary', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 1, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, '2474659f-003e-4faa-8c53-9969c33f20b2', 'user'),
	('223a1209-b949-4188-8796-5372ecd50cfe', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753889967/user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/oux6yuvxqxpbysawfv57.webp', 'album image 3 for user album a3231fc2-9374-47bb-9787-5cfa7a0c9890', '2025-07-30 15:39:28.845491+00', '2025-07-30 15:39:28.845491+00', NULL, NULL, NULL, NULL, 49836, 777, 1200, 'webp', 'image/webp', NULL, '{"cloudinary_public_id": "user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/oux6yuvxqxpbysawfv57"}', 'user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890', 'cloudinary', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 5, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'user'),
	('a481569f-37e1-4ee8-a43b-86fee447365b', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753889966/user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/bm6hjku9tv7clajqmxs1.webp', 'album image 2 for user album a3231fc2-9374-47bb-9787-5cfa7a0c9890', '2025-07-30 15:39:27.273908+00', '2025-07-30 15:39:27.273908+00', NULL, NULL, NULL, NULL, 54614, 777, 1200, 'webp', 'image/webp', NULL, '{"cloudinary_public_id": "user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/bm6hjku9tv7clajqmxs1"}', 'user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890', 'cloudinary', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 5, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'user'),
	('fd234ec4-d10d-42dc-ae3d-a729c55340c6', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753931438/user_album_album_dfe0fb85-9fa0-479f-9e21-ea95ceef695b/momb3coqt3nqcu0gzimg.webp', 'album image 3 for user album dfe0fb85-9fa0-479f-9e21-ea95ceef695b', '2025-07-31 03:10:39.593524+00', '2025-07-31 03:10:39.593524+00', NULL, NULL, NULL, NULL, 49836, 777, 1200, 'webp', 'image/webp', NULL, '{"cloudinary_public_id": "user_album_album_dfe0fb85-9fa0-479f-9e21-ea95ceef695b/momb3coqt3nqcu0gzimg"}', 'user_album_album_dfe0fb85-9fa0-479f-9e21-ea95ceef695b', 'cloudinary', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 1, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, '2474659f-003e-4faa-8c53-9969c33f20b2', 'user'),
	('b1c17c88-90b0-4eb3-9aa5-ee747bd357a7', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753938886/user_album_album_dfe0fb85-9fa0-479f-9e21-ea95ceef695b/erenvgo0lbx7gv0tsfxa.webp', 'album image 3 for user album dfe0fb85-9fa0-479f-9e21-ea95ceef695b', '2025-07-31 05:14:47.813404+00', '2025-07-31 05:14:47.813404+00', NULL, NULL, NULL, NULL, 49836, 777, 1200, 'webp', 'image/webp', NULL, '{"cloudinary_public_id": "user_album_album_dfe0fb85-9fa0-479f-9e21-ea95ceef695b/erenvgo0lbx7gv0tsfxa"}', 'user_album_album_dfe0fb85-9fa0-479f-9e21-ea95ceef695b', 'cloudinary', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 3, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, '2474659f-003e-4faa-8c53-9969c33f20b2', 'user'),
	('388ad4fd-5f0e-47bf-a317-a05e6d10eb0d', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753751058/authorsinfo/user_photos/civngv3dardsfcmepd59.webp', 'zofoggs4jsgant1nasrk.avif', '2025-07-29 01:04:18.85776+00', '2025-07-29 01:04:18.85776+00', NULL, NULL, NULL, 'zofoggs4jsgant1nasrk.avif', 33106, NULL, NULL, NULL, 'image/avif', NULL, NULL, 'authorsinfo/user_photos', 'cloudinary', true, 'completed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'user'),
	('4a4dd6e1-07ca-4314-9238-67dcbbdd7fe1', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753758661/authorsinfo/user_photos/rl4zs1wfzzzgrqvivyp4.webp', 'amosackeg6n5rnftp7ab.avif', '2025-07-29 03:11:01.90075+00', '2025-07-29 03:11:01.90075+00', NULL, NULL, NULL, 'amosackeg6n5rnftp7ab.avif', 17688, NULL, NULL, NULL, 'image/avif', NULL, NULL, 'authorsinfo/user_photos', 'cloudinary', true, 'completed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'user'),
	('c7e8be64-5869-4ab2-9782-16145a869d4d', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753758662/authorsinfo/user_photos/pfxgtgjjrvrime03r27g.webp', 'j70n2byiegc3kqmpcvbk.avif', '2025-07-29 03:11:03.140994+00', '2025-07-29 03:11:03.140994+00', NULL, NULL, NULL, 'j70n2byiegc3kqmpcvbk.avif', 29215, NULL, NULL, NULL, 'image/avif', NULL, NULL, 'authorsinfo/user_photos', 'cloudinary', true, 'completed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'user'),
	('93e97afc-45bc-482b-b58a-e8e0804d6d20', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753759290/authorsinfo/user_photos/wuckmc2rhxvl7l0qypfj.webp', 'amosackeg6n5rnftp7ab.avif', '2025-07-29 03:21:31.734944+00', '2025-07-29 03:21:31.734944+00', NULL, NULL, NULL, 'amosackeg6n5rnftp7ab.avif', 17688, NULL, NULL, NULL, 'image/avif', NULL, NULL, 'authorsinfo/user_photos', 'cloudinary', true, 'completed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'user'),
	('8c75cc2c-dd1a-4485-928f-f239e455759a', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753759292/authorsinfo/user_photos/rnfajfd8tpniemdayzen.webp', 'j70n2byiegc3kqmpcvbk.avif', '2025-07-29 03:21:32.769431+00', '2025-07-29 03:21:32.769431+00', NULL, NULL, NULL, 'j70n2byiegc3kqmpcvbk.avif', 29215, NULL, NULL, NULL, 'image/avif', NULL, NULL, 'authorsinfo/user_photos', 'cloudinary', true, 'completed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'user'),
	('62fea14d-f0ae-43a1-aa02-656231c28e80', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753759293/authorsinfo/user_photos/tsyp6ahmfl5m0eq1p25y.webp', 'zofoggs4jsgant1nasrk.avif', '2025-07-29 03:21:33.703081+00', '2025-07-29 03:21:33.703081+00', NULL, NULL, NULL, 'zofoggs4jsgant1nasrk.avif', 33106, NULL, NULL, NULL, 'image/avif', NULL, NULL, 'authorsinfo/user_photos', 'cloudinary', true, 'completed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'user'),
	('923215ff-9523-4d4c-835a-bf423049e40b', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753886567/user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/ryuomkwp4q8h6y1jfxjt.webp', 'album image 1 for user album a3231fc2-9374-47bb-9787-5cfa7a0c9890', '2025-07-30 14:42:48.341264+00', '2025-07-30 14:42:48.341264+00', NULL, NULL, NULL, NULL, 31276, 777, 1200, 'webp', 'image/webp', NULL, '{"cloudinary_public_id": "user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/ryuomkwp4q8h6y1jfxjt"}', 'user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890', 'cloudinary', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'user'),
	('21afd774-f6db-4ea9-a32a-fc1e08706b2a', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753886568/user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/shm0djsqbnduzj429nlb.webp', 'album image 2 for user album a3231fc2-9374-47bb-9787-5cfa7a0c9890', '2025-07-30 14:42:49.791728+00', '2025-07-30 14:42:49.791728+00', NULL, NULL, NULL, NULL, 54614, 777, 1200, 'webp', 'image/webp', NULL, '{"cloudinary_public_id": "user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/shm0djsqbnduzj429nlb"}', 'user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890', 'cloudinary', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'user'),
	('345bf8d4-c852-4f0e-9a15-df8c8bfba1d4', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753886570/user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/aw3d5aoo1nccec9vdzw8.webp', 'album image 3 for user album a3231fc2-9374-47bb-9787-5cfa7a0c9890', '2025-07-30 14:42:51.229406+00', '2025-07-30 14:42:51.229406+00', NULL, NULL, NULL, NULL, 49836, 777, 1200, 'webp', 'image/webp', NULL, '{"cloudinary_public_id": "user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/aw3d5aoo1nccec9vdzw8"}', 'user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890', 'cloudinary', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'user'),
	('92faa507-90f9-46ba-8bf8-515d16bbae64', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753886592/user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/zhfbb338w2bosoj0jfha.webp', 'album image 1 for user album a3231fc2-9374-47bb-9787-5cfa7a0c9890', '2025-07-30 14:43:13.693097+00', '2025-07-30 14:43:13.693097+00', NULL, NULL, NULL, NULL, 31276, 777, 1200, 'webp', 'image/webp', NULL, '{"cloudinary_public_id": "user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/zhfbb338w2bosoj0jfha"}', 'user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890', 'cloudinary', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'user'),
	('4906f4f0-45e4-4e12-83de-2f1eb877d3fa', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753886594/user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/ls0b7sg27ewipr6rdz12.webp', 'album image 2 for user album a3231fc2-9374-47bb-9787-5cfa7a0c9890', '2025-07-30 14:43:15.245167+00', '2025-07-30 14:43:15.245167+00', NULL, NULL, NULL, NULL, 54614, 777, 1200, 'webp', 'image/webp', NULL, '{"cloudinary_public_id": "user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/ls0b7sg27ewipr6rdz12"}', 'user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890', 'cloudinary', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'user'),
	('cc4caa5f-9ce4-4815-83b0-9be4d3ed0be7', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753939141/user_album_album_d677f90e-2d80-433e-90a0-1717fef7bc8d/iedtv59h0m1qkn3ik0cc.webp', 'album image 2 for user album d677f90e-2d80-433e-90a0-1717fef7bc8d', '2025-07-31 05:19:02.729217+00', '2025-07-31 05:19:02.729217+00', NULL, NULL, NULL, NULL, 54614, 777, 1200, 'webp', 'image/webp', NULL, '{"cloudinary_public_id": "user_album_album_d677f90e-2d80-433e-90a0-1717fef7bc8d/iedtv59h0m1qkn3ik0cc"}', 'user_album_album_d677f90e-2d80-433e-90a0-1717fef7bc8d', 'cloudinary', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 1, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, '2474659f-003e-4faa-8c53-9969c33f20b2', 'user'),
	('f4dcc420-99b2-46ee-b87c-456c75cead59', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753889919/user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/imk4oq1rxiv3h8pbzka0.webp', 'album image 1 for user album a3231fc2-9374-47bb-9787-5cfa7a0c9890', '2025-07-30 15:38:40.619545+00', '2025-07-30 15:38:40.619545+00', NULL, NULL, NULL, NULL, 31276, 777, 1200, 'webp', 'image/webp', NULL, '{"cloudinary_public_id": "user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/imk4oq1rxiv3h8pbzka0"}', 'user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890', 'cloudinary', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 2, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'user'),
	('bd81bfe6-7876-4279-867d-d1bc04b8c321', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753886595/user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/a1ienuufzhqcen0ne7mc.webp', 'album image 3 for user album a3231fc2-9374-47bb-9787-5cfa7a0c9890', '2025-07-30 14:43:16.407642+00', '2025-07-30 14:43:16.407642+00', NULL, NULL, NULL, NULL, 49836, 777, 1200, 'webp', 'image/webp', NULL, '{"cloudinary_public_id": "user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/a1ienuufzhqcen0ne7mc"}', 'user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890', 'cloudinary', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 1, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'user'),
	('e36bc2af-0897-470e-90e6-8e7b03a29bea', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753889940/user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/c76fkruhqdox3tp7fikl.webp', 'album image 3 for user album a3231fc2-9374-47bb-9787-5cfa7a0c9890', '2025-07-30 15:39:01.923939+00', '2025-07-30 15:39:01.923939+00', NULL, NULL, NULL, NULL, 49836, 777, 1200, 'webp', 'image/webp', NULL, '{"cloudinary_public_id": "user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/c76fkruhqdox3tp7fikl"}', 'user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890', 'cloudinary', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 4, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'user'),
	('2aea0cff-1b4f-4a55-8727-4a7ecf0ab150', 'https://res.cloudinary.com/dj8yugwyp/image/upload/v1753889964/user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/wbqzsfzkwhefooshr2rx.webp', 'album image 1 for user album a3231fc2-9374-47bb-9787-5cfa7a0c9890', '2025-07-30 15:39:26.034879+00', '2025-07-30 15:39:26.034879+00', NULL, NULL, NULL, NULL, 31276, 777, 1200, 'webp', 'image/webp', NULL, '{"cloudinary_public_id": "user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890/wbqzsfzkwhefooshr2rx"}', 'user_album_album_a3231fc2-9374-47bb-9787-5cfa7a0c9890', 'cloudinary', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'safe', NULL, NULL, NULL, 0, 3, 0, 0, 0, 0.00, false, false, false, false, 'original', NULL, false, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'user');


--
-- Data for Name: authors; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."authors" ("id", "name", "bio", "featured", "birth_date", "nationality", "website", "author_image_id", "twitter_handle", "facebook_handle", "instagram_handle", "goodreads_url", "cover_image_id", "created_at", "updated_at", "author_gallery_id", "permalink") VALUES
	('9953a3e0-4982-4ae5-8093-829c4320ef8d', 'Katherine Garbera', 'This is a test bio that will be updated soon', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-06 07:13:55.071969+00', '2025-07-06 07:13:55.071969+00', NULL, NULL),
	('8e75e51f-701f-4f3a-83da-70f625876ca8', 'Beth Guckenberger', NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-08 00:11:48.482659+00', '2025-07-08 00:11:48.482659+00', NULL, NULL),
	('e31e061d-a4a8-4cc8-af18-754786ad5ee3', 'Envy Red', NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-13 07:13:14.630895+00', '2025-07-13 07:13:14.630895+00', NULL, NULL);


--
-- Data for Name: binding_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."binding_types" ("id", "name", "description", "created_at", "updated_at") VALUES
	('bd110077-f85e-46fe-8411-894c4a61f132', 'Hardcover', NULL, NULL, NULL),
	('50d370e1-c0b9-4bb5-b278-0aa247da36fd', 'Paperback', NULL, NULL, NULL);


--
-- Data for Name: countries; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: format_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."format_types" ("id", "name") VALUES
	('d32977ce-788d-4c75-af76-ea033978f402', 'Print');


--
-- Data for Name: publishers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."publishers" ("id", "name", "featured", "website", "email", "phone", "address_line1", "address_line2", "city", "state", "postal_code", "country", "about", "cover_image_id", "publisher_image_id", "publisher_gallery_id", "founded_year", "country_id", "created_at", "updated_at", "permalink") VALUES
	('ad76092d-b5b1-4045-af9f-5fae7b4aef6b', 'Katherine Garbera', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-05 10:06:45.834571+00', '2025-07-05 10:06:45.834571+00', NULL),
	('f1a5d323-99aa-4329-9536-5dee26fc1c0c', 'Thomas Nelson', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-08 00:11:48.828479+00', '2025-07-08 00:11:48.828479+00', NULL),
	('b1ae09e3-7dae-491f-8ad6-e513fd9d1977', 'David C Cook', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-08 04:43:58.67216+00', '2025-07-08 04:43:58.67216+00', NULL),
	('5eaef69c-5ddd-4a58-8412-47df975a472a', 'Zondervan', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-08 04:54:16.466469+00', '2025-07-08 04:54:16.466469+00', NULL),
	('18c99335-dfb8-42da-8ff3-c45ceb1f04fd', 'Standard Publishing', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-08 09:36:28.731401+00', '2025-07-08 09:36:28.731401+00', NULL),
	('729c198c-4e2f-4e67-8591-ee4f6bd74385', 'Red Door Books', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-13 07:13:14.232476+00', '2025-07-13 07:13:14.232476+00', NULL);


--
-- Data for Name: statuses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: books; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."books" ("id", "isbn10", "isbn13", "title", "title_long", "publisher_id", "publication_date", "binding", "pages", "list_price", "language", "edition", "synopsis", "overview", "dimensions", "weight", "cover_image_id", "original_image_url", "author", "featured", "book_gallery_img", "average_rating", "review_count", "created_at", "author_id", "binding_type_id", "format_type_id", "status_id", "updated_at", "permalink") VALUES
	('8366132b-50b4-452a-88b3-cd7368ecfd71', NULL, '9780784774793', 'Super Simple Mission Kit Featuring Tales of the Not Forgotten: A Fully-resources Missions Curriculum (Kids Serving Kids)', 'Super Simple Mission Kit Featuring Tales of the Not Forgotten: A Fully-resources Missions Curriculum (Kids Serving Kids)', 'b1ae09e3-7dae-491f-8ad6-e513fd9d1977', '2019-01-01', 'Paperback', NULL, NULL, 'en', 'Leaders Guide, Teachers Guide', 'Filled with fun activities, compelling stories, biblical teaching, kid-friendly service projects, and family outreach ideas, the Super Simple Mission Kit will:?Open kids? eyes to the needs in their community and around the world.?Shape kids? hearts to mirror God?s heart of compassion.?Inspire kids to courageously follow God?s call.In partnering with Back2Back Ministries, this kit will: 1. Provide children?s ministers and pastors with resources that guide children to look beyond themselves and think of others--especially of kids around the world living in difficult situations. This complete kit includes stories, curriculum, video clips, visuals, and detailed instructions on how to partner with Back2Back Ministries.2. There are 163 million orphans around the world. With each purchase, a portion of the proceeds will go to Back2Back Ministries to directly serve orphans The Super Simple Mission Kit helps kids discover the basic needs of children living in poverty in developing countries. Al', NULL, 'Height: 10.5 inches, Length: 7 inches, Weight: 2.55 Pounds, Width: 2.25 inches', 2.55, '642cfd82-6a4c-459d-a2d9-8cf8501e57f7', NULL, 'Beth Guckenberger', false, NULL, 0, 0, '2025-07-08 09:49:44.668053+00', '8e75e51f-701f-4f3a-83da-70f625876ca8', '50d370e1-c0b9-4bb5-b278-0aa247da36fd', 'd32977ce-788d-4c75-af76-ea033978f402', NULL, '2025-07-08 09:49:44.668053+00', NULL),
	('235ce1e2-e5a5-4db9-9d2b-22093d960566', '0983716412', '9780983716419', 'High Rollers', 'High Rollers', '729c198c-4e2f-4e67-8591-ee4f6bd74385', '2012-01-01', 'Paperback', 230, 0.00, 'en', NULL, 'Product Description<br/><br/><br/>Welcome to High Rollers, a skater''s paradise, where everything is not as it seems. Situated in the heart of West Baltimore, this rink is headquarters to a sinister human trafficking operation. With a reach that travels far beyond the South American border, the stakes are high when gambling within the inner realms of this skate haven. Meet troubled Iraq War veteran Jimmie "Snake" Watson, the charismatic yet loose cannon mastermind, whose skillful art of persuasion creates a seemingly untouchable empire. Witness what happens when greed, dishonor, love, and the revealing of shocking truths stand to send his perfect world crashing down. Session 1.... So it begins!<br/><br/><br/>About the Author<br/><br/><br/>Envy Red is a Washington, DC area native by way of Birmingham, AL. A two time graduate of the University of Maryland, she resides in Atlanta, GA with her two boys. She is a cancer survivor whose battle with a rare form of the disease has strengthened her dedication to philanthropy. She is a board member of Homebound Citizens Non-Profit as well as the founder of the Free Young Minds Project, a youth initiative committed to developing our nation’s youth to their fullest potential. Literary Accomplishments: Most Talked About Author 2011 - DJ Gatsby Book Club Debut Author of The Year 2011 - Prodigy Publishing''s Urban Literary Awards Best Dressed Female Author 2011- Prodigy Publishing''s Urban Literary Awards Author of The Year Female 2011 - Word on Da Street Urban Literary Awards  Nomination Female Author of The Year - AAMBC', NULL, 'Height: 8.5 inches, Length: 5.5 inches, Weight: 0.79 pounds, Width: 0.58 inches', 0.79, '57fbc74f-1371-4481-bd60-a647b84793e8', NULL, 'Envy Red', false, NULL, 0, 0, '2025-07-13 07:13:15.753895+00', 'e31e061d-a4a8-4cc8-af18-754786ad5ee3', '50d370e1-c0b9-4bb5-b278-0aa247da36fd', 'd32977ce-788d-4c75-af76-ea033978f402', NULL, '2025-07-13 07:13:15.753895+00', NULL),
	('9a5909bb-e759-44ab-b8d0-7143482f66e8', '0578072696', '9780578072692', 'Touch', 'Touch', '729c198c-4e2f-4e67-8591-ee4f6bd74385', '2011-01-01', 'Paperback', 226, 0.00, 'en', NULL, 'Buckle your seatbelts and prepare for an exhilarating journey set in our nation’s capital where professionals indulge in more than their six figure careers. Through an erotic world of fantasy that almost crumbles at the hands of a sexual predator and serial killer, the shocking pasts of five individuals cross, and the page turning mystery that is Touch is told. Sidney, Nina, and Jade are three best friends from very different backgrounds who are active participants in the lifestyle, an exclusive underground swinger’s network, where professionals secretly gather to satisfy their carnal desires. When well known local celebrity and event planner Marcel Bennett is found brutally murdered after a lavish event, the connection to a series of serial killings is made and threatens to shake their foundation. Kenny aka “King”, is the troubled yet artistically talented younger brother of Sidney who is determined to shake his country roots and the demons he left behind. Will a gripping fear of success and mental baggage be his ultimate downfall or just the push he needs to move forward? Enter Devine, a local upscale health club owner, who just may be ready to settle down but not before being faced with demons from his own past including secrets held by his overbearing father, a high profiled city councilman. Watch as their pasts cross and their futures are forever altered when the mind blowing conclusion to this thrilling mystery unfolds, leaving you clinging to the edge of your seat.', NULL, 'height: 216 mm, length: 140 mm, width: 14 mm, weight: 295 g', 295, '03e2ac67-8c1a-4923-ac8d-702e775a3886', NULL, 'Envy Red', false, NULL, 0, 0, '2025-07-13 07:13:18.397727+00', 'e31e061d-a4a8-4cc8-af18-754786ad5ee3', '50d370e1-c0b9-4bb5-b278-0aa247da36fd', 'd32977ce-788d-4c75-af76-ea033978f402', NULL, '2025-07-13 07:13:18.397727+00', NULL),
	('492d0538-5ab2-43bc-bc7b-e538da900639', '0983716404', '9780983716402', 'Jaded', 'Jaded', '729c198c-4e2f-4e67-8591-ee4f6bd74385', '2011-11-16', 'Paperback', 256, 10, 'en', NULL, 'Imagine having your life consumed with nightmares of a wildly drug addicted mother whose career in prostitution leaves no one including yourself exempt from its consequences. Visualize having an unknown father whose only mark left on your life are unexplained exotic features. Envision learning that you were marked and written off as criminally insane at the tender age of 12. Now picture the same mental illness having you torn between two extremely opposite worlds of fantasy and reality. Journey behind the walls of St Agnes, a maximum security asylum in rural Virginia, and experience the suspenseful tale that is Jaded through the complex mind of a beautifully torn woman. Can love conquer all? This is the question posed as a love interest battles to show support through his own personal dilemma and tragedy. Will a seasoned therapist be able to provide the help needed, or will the unveiling of shocking truths cause damage beyond repair? Come along for the ups and downs of this jaw droppin', NULL, 'height: 216 mm, length: 140 mm, width: 16 mm, weight: 327 g', 327, '107a9e86-6578-4bb7-98f5-9c1a8d944b3c', NULL, 'Envy Red', false, NULL, 0, 0, '2025-07-13 07:13:20.319565+00', 'e31e061d-a4a8-4cc8-af18-754786ad5ee3', '50d370e1-c0b9-4bb5-b278-0aa247da36fd', 'd32977ce-788d-4c75-af76-ea033978f402', NULL, '2025-07-13 07:13:20.319565+00', NULL);


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."groups" ("id", "name", "description", "is_private", "created_by", "created_at", "cover_image_url", "member_count", "permalink") VALUES
	('992d1918-3e5e-464c-99af-ad026a7bad17', 'Book Lovers Community', 'A community for book enthusiasts', false, '2474659f-003e-4faa-8c53-9969c33f20b2', '2025-07-08 13:00:49.481243+00', NULL, 1, NULL);


--
-- Data for Name: book_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: reading_lists; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."activities" ("id", "user_id", "activity_type", "review_id", "list_id", "data", "created_at", "user_profile_id", "group_id", "event_id", "book_id", "author_id", "entity_type", "entity_id") VALUES
	('21bf62bf-0c96-48d0-9f38-8e5b7d44793d', 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'author_profile_updated', NULL, NULL, '{"author_id": "9953a3e0-4982-4ae5-8093-829c4320ef8d", "author_name": "Katherine Garbera", "updated_fields": ["bio"]}', '2025-07-07 09:17:27.916+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('3aa8acbf-6aaa-4ac8-999c-7914bfabaccf', '2474659f-003e-4faa-8c53-9969c33f20b2', 'album_created', NULL, NULL, '{"is_public": true, "album_name": "Books", "privacy_level": "public", "album_description": ""}', '2025-07-31 03:10:08.504282+00', NULL, NULL, NULL, NULL, NULL, 'photo_album', 'dfe0fb85-9fa0-479f-9e21-ea95ceef695b'),
	('cf25b009-c1bf-4c8f-8ef4-d2a21cc41de6', '2474659f-003e-4faa-8c53-9969c33f20b2', 'album_created', NULL, NULL, '{"is_public": true, "album_name": "Old Books", "privacy_level": "public", "album_description": "These are some of my old favorites"}', '2025-07-31 05:18:39.964567+00', NULL, NULL, NULL, NULL, NULL, 'photo_album', 'd677f90e-2d80-433e-90a0-1717fef7bc8d');


--
-- Data for Name: activity_log; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ai_image_analysis; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: album_analytics; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: photo_albums; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."photo_albums" ("id", "name", "description", "cover_image_id", "owner_id", "is_public", "view_count", "like_count", "share_count", "entity_id", "entity_type", "metadata", "created_at", "updated_at", "deleted_at", "monetization_enabled", "premium_content", "community_features", "ai_enhanced", "analytics_enabled", "revenue_generated", "total_subscribers", "community_score", "entity_metadata") VALUES
	('6ede8636-bc84-4f49-a8a8-ae073c586484', 'Great Books', '', NULL, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', true, 0, 0, 0, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'user', '{"updated_at": "2025-07-06T05:05:35.789Z", "show_in_feed": true, "privacy_level": "public", "allowed_viewers": []}', '2025-07-06 04:46:13.96564+00', '2025-07-06 04:46:13.96564+00', NULL, false, false, false, false, false, 0.00, 0, 0.00, '{}'),
	('94ee882d-6be4-4ebf-afaa-cd338254af2c', 'First book', '', NULL, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', true, 0, 0, 0, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'user', '{"created_at": "2025-07-06T05:06:04.910Z", "show_in_feed": true, "privacy_level": "public", "allowed_viewers": []}', '2025-07-06 05:06:05.716497+00', '2025-07-06 05:06:05.716497+00', NULL, false, false, false, false, false, 0.00, 0, 0.00, '{}'),
	('a3231fc2-9374-47bb-9787-5cfa7a0c9890', 'Test books', 'These are the books I like', NULL, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', true, 0, 0, 0, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'user', '{"updated_at": "2025-07-29T01:05:41.536Z", "show_in_feed": true, "privacy_level": "public", "allowed_viewers": []}', '2025-07-06 06:48:07.26649+00', '2025-07-29 01:05:41.286869+00', NULL, false, false, false, false, false, 0.00, 0, 0.00, '{}'),
	('dfe0fb85-9fa0-479f-9e21-ea95ceef695b', 'Books', '', NULL, '2474659f-003e-4faa-8c53-9969c33f20b2', true, 0, 0, 0, '2474659f-003e-4faa-8c53-9969c33f20b2', 'user', '{"created_from": "photo_album_creator", "show_in_feed": true, "privacy_level": "public"}', '2025-07-31 03:10:08.236136+00', '2025-07-31 03:10:08.236136+00', NULL, false, false, false, false, false, 0.00, 0, 0.00, '{}'),
	('d677f90e-2d80-433e-90a0-1717fef7bc8d', 'Old Books', 'These are some of my old favorites', NULL, '2474659f-003e-4faa-8c53-9969c33f20b2', true, 0, 0, 0, '2474659f-003e-4faa-8c53-9969c33f20b2', 'user', '{"created_from": "photo_album_creator", "show_in_feed": true, "privacy_level": "public"}', '2025-07-31 05:18:39.708246+00', '2025-07-31 05:18:39.708246+00', NULL, false, false, false, false, false, 0.00, 0, 0.00, '{}');


--
-- Data for Name: album_images; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."album_images" ("id", "album_id", "image_id", "display_order", "is_cover", "is_featured", "metadata", "created_at", "updated_at", "entity_type_id", "entity_id", "view_count", "like_count", "share_count", "revenue_generated", "ai_tags", "community_engagement", "caption", "comment_count", "last_viewed_at", "performance_score") VALUES
	('73e6ed01-545e-4d15-a648-2eff6c8bf7b8', 'a3231fc2-9374-47bb-9787-5cfa7a0c9890', '388ad4fd-5f0e-47bf-a317-a05e6d10eb0d', 0, false, false, '{"file_size": 33106, "mime_type": "image/avif", "uploaded_at": "2025-07-29T01:04:19.482Z", "upload_method": "cloudinary", "original_filename": "zofoggs4jsgant1nasrk.avif"}', '2025-07-29 01:04:19.025611+00', '2025-07-29 01:04:19.025611+00', NULL, NULL, 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('713c2d54-26d8-49db-8276-67febc559379', 'a3231fc2-9374-47bb-9787-5cfa7a0c9890', '4a4dd6e1-07ca-4314-9238-67dcbbdd7fe1', 0, false, false, '{"file_size": 17688, "mime_type": "image/avif", "uploaded_at": "2025-07-29T03:11:02.512Z", "upload_method": "cloudinary", "original_filename": "amosackeg6n5rnftp7ab.avif"}', '2025-07-29 03:11:02.087144+00', '2025-07-29 03:11:02.087144+00', NULL, NULL, 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('90053f1c-b1d0-45af-97e8-e7f687825a4b', 'a3231fc2-9374-47bb-9787-5cfa7a0c9890', 'c7e8be64-5869-4ab2-9782-16145a869d4d', 0, false, false, '{"file_size": 29215, "mime_type": "image/avif", "uploaded_at": "2025-07-29T03:11:03.707Z", "upload_method": "cloudinary", "original_filename": "j70n2byiegc3kqmpcvbk.avif"}', '2025-07-29 03:11:03.284696+00', '2025-07-29 03:11:03.284696+00', NULL, NULL, 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('7c0e6c5b-85fb-4d22-8bcb-96d115dcac39', 'a3231fc2-9374-47bb-9787-5cfa7a0c9890', '93e97afc-45bc-482b-b58a-e8e0804d6d20', 0, false, false, '{"file_size": 17688, "mime_type": "image/avif", "uploaded_at": "2025-07-29T03:21:32.384Z", "upload_method": "cloudinary", "original_filename": "amosackeg6n5rnftp7ab.avif"}', '2025-07-29 03:21:31.984835+00', '2025-07-29 03:21:31.984835+00', NULL, NULL, 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('e61cad1b-6d58-4c33-96ef-918220ba7013', 'a3231fc2-9374-47bb-9787-5cfa7a0c9890', '8c75cc2c-dd1a-4485-928f-f239e455759a', 0, false, false, '{"file_size": 29215, "mime_type": "image/avif", "uploaded_at": "2025-07-29T03:21:33.337Z", "upload_method": "cloudinary", "original_filename": "j70n2byiegc3kqmpcvbk.avif"}', '2025-07-29 03:21:32.938234+00', '2025-07-29 03:21:32.938234+00', NULL, NULL, 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('854e5cd5-07a3-4bf3-a0a8-ba3b251210f0', 'a3231fc2-9374-47bb-9787-5cfa7a0c9890', '62fea14d-f0ae-43a1-aa02-656231c28e80', 0, false, false, '{"file_size": 33106, "mime_type": "image/avif", "uploaded_at": "2025-07-29T03:21:34.256Z", "upload_method": "cloudinary", "original_filename": "zofoggs4jsgant1nasrk.avif"}', '2025-07-29 03:21:33.83636+00', '2025-07-29 03:21:33.83636+00', NULL, NULL, 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('c884693e-fce7-4490-aa1e-f78491bacbdf', 'a3231fc2-9374-47bb-9787-5cfa7a0c9890', '923215ff-9523-4d4c-835a-bf423049e40b', 1, false, false, '{"uploaded_at": "2025-07-30T14:42:51.640Z", "upload_context": "user_album"}', '2025-07-30 14:42:51.672581+00', '2025-07-30 14:42:51.672581+00', NULL, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('cea52a41-6f7d-43a7-8389-04efea032776', 'a3231fc2-9374-47bb-9787-5cfa7a0c9890', '21afd774-f6db-4ea9-a32a-fc1e08706b2a', 2, false, false, '{"uploaded_at": "2025-07-30T14:42:51.640Z", "upload_context": "user_album"}', '2025-07-30 14:42:51.672581+00', '2025-07-30 14:42:51.672581+00', NULL, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('4ce8c9ad-8c43-42d2-9244-4648cd9e457a', 'a3231fc2-9374-47bb-9787-5cfa7a0c9890', '345bf8d4-c852-4f0e-9a15-df8c8bfba1d4', 3, false, false, '{"uploaded_at": "2025-07-30T14:42:51.640Z", "upload_context": "user_album"}', '2025-07-30 14:42:51.672581+00', '2025-07-30 14:42:51.672581+00', NULL, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('001389fa-b62b-4ffe-8b40-86a017e4ffdb', 'a3231fc2-9374-47bb-9787-5cfa7a0c9890', '92faa507-90f9-46ba-8bf8-515d16bbae64', 4, false, false, '{"uploaded_at": "2025-07-30T14:43:16.700Z", "upload_context": "user_album"}', '2025-07-30 14:43:16.712198+00', '2025-07-30 14:43:16.712198+00', NULL, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('4aeea51c-d6d7-431d-8b01-709e03eb09aa', 'a3231fc2-9374-47bb-9787-5cfa7a0c9890', '4906f4f0-45e4-4e12-83de-2f1eb877d3fa', 5, false, false, '{"uploaded_at": "2025-07-30T14:43:16.700Z", "upload_context": "user_album"}', '2025-07-30 14:43:16.712198+00', '2025-07-30 14:43:16.712198+00', NULL, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('478cdff5-19b9-4f20-9602-bc0ce7d8c420', 'a3231fc2-9374-47bb-9787-5cfa7a0c9890', 'bd81bfe6-7876-4279-867d-d1bc04b8c321', 6, false, false, '{"uploaded_at": "2025-07-30T14:43:16.700Z", "upload_context": "user_album"}', '2025-07-30 14:43:16.712198+00', '2025-07-30 14:43:16.712198+00', NULL, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('036b95df-ed32-4f5e-9a61-f2f1b2e393c8', 'a3231fc2-9374-47bb-9787-5cfa7a0c9890', 'f4dcc420-99b2-46ee-b87c-456c75cead59', 7, false, false, '{"uploaded_at": "2025-07-30T15:39:02.227Z", "upload_context": "user_album"}', '2025-07-30 15:39:02.285323+00', '2025-07-30 15:39:02.285323+00', NULL, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('c6c04ca3-4148-4677-924e-9fce4874d8d5', 'a3231fc2-9374-47bb-9787-5cfa7a0c9890', 'e36bc2af-0897-470e-90e6-8e7b03a29bea', 8, false, false, '{"uploaded_at": "2025-07-30T15:39:02.227Z", "upload_context": "user_album"}', '2025-07-30 15:39:02.285323+00', '2025-07-30 15:39:02.285323+00', NULL, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('a537c99e-1da8-4740-887e-66a83b35751a', 'a3231fc2-9374-47bb-9787-5cfa7a0c9890', '2aea0cff-1b4f-4a55-8727-4a7ecf0ab150', 9, false, false, '{"uploaded_at": "2025-07-30T15:39:29.134Z", "upload_context": "user_album"}', '2025-07-30 15:39:29.166461+00', '2025-07-30 15:39:29.166461+00', NULL, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('b60069b9-3922-46e7-8823-35a2f111bdf1', 'a3231fc2-9374-47bb-9787-5cfa7a0c9890', 'a481569f-37e1-4ee8-a43b-86fee447365b', 10, false, false, '{"uploaded_at": "2025-07-30T15:39:29.134Z", "upload_context": "user_album"}', '2025-07-30 15:39:29.166461+00', '2025-07-30 15:39:29.166461+00', NULL, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('25c3a092-8d90-4692-9870-b10c1ab8011a', 'a3231fc2-9374-47bb-9787-5cfa7a0c9890', '223a1209-b949-4188-8796-5372ecd50cfe', 11, false, false, '{"uploaded_at": "2025-07-30T15:39:29.134Z", "upload_context": "user_album"}', '2025-07-30 15:39:29.166461+00', '2025-07-30 15:39:29.166461+00', NULL, 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('68cd95fc-97fd-43a9-8ccd-824e50c993e6', 'dfe0fb85-9fa0-479f-9e21-ea95ceef695b', '1890a0a7-c11e-4230-b968-905c8f394a77', 1, false, false, '{"uploaded_at": "2025-07-31T03:10:39.662Z", "upload_context": "user_album"}', '2025-07-31 03:10:39.887762+00', '2025-07-31 03:10:39.887762+00', NULL, '2474659f-003e-4faa-8c53-9969c33f20b2', 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('fd882d70-9e59-43ce-bcfa-3abd0eabece0', 'dfe0fb85-9fa0-479f-9e21-ea95ceef695b', 'e117e984-86cb-45c0-b108-05f99b43a0d6', 2, false, false, '{"uploaded_at": "2025-07-31T03:10:39.662Z", "upload_context": "user_album"}', '2025-07-31 03:10:39.887762+00', '2025-07-31 03:10:39.887762+00', NULL, '2474659f-003e-4faa-8c53-9969c33f20b2', 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('ec5f62a5-3ab5-4fee-bb19-872e6484a854', 'dfe0fb85-9fa0-479f-9e21-ea95ceef695b', 'fd234ec4-d10d-42dc-ae3d-a729c55340c6', 3, false, false, '{"uploaded_at": "2025-07-31T03:10:39.662Z", "upload_context": "user_album"}', '2025-07-31 03:10:39.887762+00', '2025-07-31 03:10:39.887762+00', NULL, '2474659f-003e-4faa-8c53-9969c33f20b2', 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('cfcb605a-d011-4759-af2b-6814daf730a5', 'dfe0fb85-9fa0-479f-9e21-ea95ceef695b', '2751be33-e1d0-42c3-841a-fc81e10271d7', 5, false, false, '{"uploaded_at": "2025-07-31T05:14:47.849Z", "upload_context": "user_album"}', '2025-07-31 05:14:48.100522+00', '2025-07-31 05:14:48.100522+00', NULL, '2474659f-003e-4faa-8c53-9969c33f20b2', 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('d708861e-5da7-4cbf-9742-1f1e4fe9ccd6', 'dfe0fb85-9fa0-479f-9e21-ea95ceef695b', 'b1c17c88-90b0-4eb3-9aa5-ee747bd357a7', 6, false, false, '{"uploaded_at": "2025-07-31T05:14:47.849Z", "upload_context": "user_album"}', '2025-07-31 05:14:48.100522+00', '2025-07-31 05:14:48.100522+00', NULL, '2474659f-003e-4faa-8c53-9969c33f20b2', 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('6c72e6ec-2f6f-450e-be6b-a239888a36d4', 'd677f90e-2d80-433e-90a0-1717fef7bc8d', '44c520f7-43af-4abb-acf6-e00f50b74f3b', 1, false, false, '{"uploaded_at": "2025-07-31T05:19:04.044Z", "upload_context": "user_album"}', '2025-07-31 05:19:04.295237+00', '2025-07-31 05:19:04.295237+00', NULL, '2474659f-003e-4faa-8c53-9969c33f20b2', 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('bdb6620f-8a45-4bfd-acae-420913aef138', 'd677f90e-2d80-433e-90a0-1717fef7bc8d', 'cc4caa5f-9ce4-4815-83b0-9be4d3ed0be7', 2, false, false, '{"uploaded_at": "2025-07-31T05:19:04.044Z", "upload_context": "user_album"}', '2025-07-31 05:19:04.295237+00', '2025-07-31 05:19:04.295237+00', NULL, '2474659f-003e-4faa-8c53-9969c33f20b2', 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00),
	('7498977f-4864-4537-b148-c9b70e14af24', 'd677f90e-2d80-433e-90a0-1717fef7bc8d', '8c786f71-8092-412b-9657-99693532b4f0', 3, false, false, '{"uploaded_at": "2025-07-31T05:19:04.044Z", "upload_context": "user_album"}', '2025-07-31 05:19:04.295237+00', '2025-07-31 05:19:04.295237+00', NULL, '2474659f-003e-4faa-8c53-9969c33f20b2', 0, 0, 0, 0.00, '{}', 0.00, NULL, 0, NULL, 0.00);


--
-- Data for Name: album_shares; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: automation_workflows; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: automation_executions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: blocks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: book_authors; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."book_authors" ("id", "book_id", "author_id", "created_at", "updated_at") VALUES
	('876a9a61-25fe-4ab6-a722-4020d40ec90a', '8366132b-50b4-452a-88b3-cd7368ecfd71', '8e75e51f-701f-4f3a-83da-70f625876ca8', NULL, NULL),
	('ec709d1d-35cb-4db8-8609-55c8d9b7602e', '235ce1e2-e5a5-4db9-9d2b-22093d960566', 'e31e061d-a4a8-4cc8-af18-754786ad5ee3', NULL, NULL),
	('dd54f153-b099-4bab-8c89-98794db91ced', '9a5909bb-e759-44ab-b8d0-7143482f66e8', 'e31e061d-a4a8-4cc8-af18-754786ad5ee3', NULL, NULL),
	('a8b861a7-4ea3-43a6-b983-8e4a71a91d5e', '492d0538-5ab2-43bc-bc7b-e538da900639', 'e31e061d-a4a8-4cc8-af18-754786ad5ee3', NULL, NULL);


--
-- Data for Name: book_clubs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: book_club_books; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: book_club_discussions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: book_club_discussion_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: book_club_members; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: book_genres; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: book_genre_mappings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: book_id_mapping; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: book_popularity_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."book_popularity_metrics" ("id", "book_id", "views_count", "reviews_count", "avg_rating", "reading_progress_count", "reading_list_count", "last_updated") VALUES
	('296792bf-593f-48f2-82d4-42fee0b544f5', '9a5909bb-e759-44ab-b8d0-7143482f66e8', 0, 0, 0.00, 2, 0, '2025-07-31 08:11:08.74281+00');


--
-- Data for Name: book_publishers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: book_recommendations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: book_similarity_scores; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."subjects" ("id", "name", "parent_id", "created_at", "updated_at") VALUES
	('3ce9e594-9f2d-4297-b07c-fe8af0ca7747', 'Children''s Books', NULL, '2025-07-08 04:44:00.737417+00', '2025-07-08 04:44:00.737417+00'),
	('dabefbfc-0ee8-4f3a-803e-3da1558e360b', 'Literature & Fiction', NULL, '2025-07-08 04:44:01.175237+00', '2025-07-08 04:44:01.175237+00'),
	('5770345d-3cc1-4a46-b09a-c8e0e14371e5', 'Religious Fiction', NULL, '2025-07-08 04:44:01.593483+00', '2025-07-08 04:44:01.593483+00'),
	('3e37a0be-465b-47aa-b17b-acf0fd070932', 'Religions', NULL, '2025-07-08 04:44:01.984175+00', '2025-07-08 04:44:01.984175+00'),
	('9ed90b84-501d-4c78-95f6-72a93ebaa4f8', 'Inspirational', NULL, '2025-07-08 04:44:02.251811+00', '2025-07-08 04:44:02.251811+00'),
	('85de92e5-4e82-4e87-81ce-3d876350c16a', 'Christian Books & Bibles', NULL, '2025-07-08 04:54:18.430939+00', '2025-07-08 04:54:18.430939+00'),
	('a8da9bfa-df8a-4413-a253-dab23e352673', 'Christian Living', NULL, '2025-07-08 04:54:18.792341+00', '2025-07-08 04:54:18.792341+00'),
	('3f0feae5-2be3-47c0-ba91-f65761d0167c', 'Ministry & Evangelism', NULL, '2025-07-08 04:54:19.252121+00', '2025-07-08 04:54:19.252121+00'),
	('1e43d24c-d36f-43eb-afe1-572ac49e39c2', 'Missions & Missionary Work', NULL, '2025-07-08 04:54:19.45025+00', '2025-07-08 04:54:19.45025+00'),
	('514c307d-c096-4510-b7da-db5f2bcb9c8f', 'Biographies & Memoirs', NULL, '2025-07-08 04:54:19.689406+00', '2025-07-08 04:54:19.689406+00'),
	('1c5878cc-b3b3-45ff-995f-b980cfb26a73', 'Leaders & Notable People', NULL, '2025-07-08 04:54:19.934212+00', '2025-07-08 04:54:19.934212+00'),
	('b49750a3-8003-47a9-8ce1-ea28bdecd589', 'Religious', NULL, '2025-07-08 04:54:20.202634+00', '2025-07-08 04:54:20.202634+00'),
	('40e3ab9f-756b-412b-bcb4-b48755f7ef2f', 'Religion & Spirituality', NULL, '2025-07-08 04:54:20.447716+00', '2025-07-08 04:54:20.447716+00'),
	('af4b1295-3c74-42e2-8cc4-d7b217742527', 'Education', NULL, '2025-07-08 09:49:45.252542+00', '2025-07-08 09:49:45.252542+00'),
	('0af0956f-1d2e-49b0-b126-9a96aaa874bf', 'Children & Teens', NULL, '2025-07-08 09:49:45.539435+00', '2025-07-08 09:49:45.539435+00'),
	('4b739e0f-88b2-460a-b9ef-44e6c97ae53e', 'Children''s Ministry', NULL, '2025-07-08 09:49:46.311665+00', '2025-07-08 09:49:46.311665+00'),
	('5bb02c6d-46bf-4662-b740-dc9f002bd78d', 'Mystery, Thriller & Suspense', NULL, '2025-07-13 07:13:16.223522+00', '2025-07-13 07:13:16.223522+00'),
	('b44733ca-14b9-4fc7-9824-ca822f7dc138', 'Thrillers & Suspense', NULL, '2025-07-13 07:13:16.491983+00', '2025-07-13 07:13:16.491983+00'),
	('b9d606fa-7b70-46cf-9617-9c832721233b', 'Crime', NULL, '2025-07-13 07:13:16.697228+00', '2025-07-13 07:13:16.697228+00'),
	('63345b27-6b29-46c7-8755-2c05e208f20b', 'Erotica', NULL, '2025-07-13 07:13:18.77127+00', '2025-07-13 07:13:18.77127+00'),
	('e14e0bfe-7aae-4f24-8f1f-565902818aac', 'Mystery', NULL, '2025-07-13 07:13:18.98506+00', '2025-07-13 07:13:18.98506+00'),
	('a98f4991-9f7d-462a-a0fa-c87ca319583b', 'Genre Fiction', NULL, '2025-07-13 07:13:20.691805+00', '2025-07-13 07:13:20.691805+00'),
	('ba7252f2-c0c1-4ca4-81ad-83d23685ad47', 'Psychological', NULL, '2025-07-13 07:13:20.969297+00', '2025-07-13 07:13:20.969297+00');


--
-- Data for Name: book_subjects; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."book_subjects" ("id", "book_id", "subject_id", "created_at", "updated_at") VALUES
	('9e4c7469-d5b5-44c9-9afb-8563d9b52964', '8366132b-50b4-452a-88b3-cd7368ecfd71', '85de92e5-4e82-4e87-81ce-3d876350c16a', NULL, NULL),
	('b3982cdb-ca17-4f12-b4ab-f634fa902ad7', '8366132b-50b4-452a-88b3-cd7368ecfd71', 'af4b1295-3c74-42e2-8cc4-d7b217742527', NULL, NULL),
	('c8204e2a-7209-4408-9df8-6e1c020eb9e4', '8366132b-50b4-452a-88b3-cd7368ecfd71', '0af0956f-1d2e-49b0-b126-9a96aaa874bf', NULL, NULL),
	('bbb41313-6ee3-4e1e-9337-d76a73a849db', '8366132b-50b4-452a-88b3-cd7368ecfd71', '3f0feae5-2be3-47c0-ba91-f65761d0167c', NULL, NULL),
	('5cca8782-8179-48c6-8957-1b7af34624ca', '8366132b-50b4-452a-88b3-cd7368ecfd71', '4b739e0f-88b2-460a-b9ef-44e6c97ae53e', NULL, NULL),
	('8650c52e-0185-47cb-a77a-a54a591e782f', '8366132b-50b4-452a-88b3-cd7368ecfd71', '40e3ab9f-756b-412b-bcb4-b48755f7ef2f', NULL, NULL),
	('de999e72-0523-4f31-932b-34194ebf2b17', '235ce1e2-e5a5-4db9-9d2b-22093d960566', 'dabefbfc-0ee8-4f3a-803e-3da1558e360b', NULL, NULL),
	('ecaa7078-d7ce-4193-a51e-06a8fd5ececd', '235ce1e2-e5a5-4db9-9d2b-22093d960566', '5bb02c6d-46bf-4662-b740-dc9f002bd78d', NULL, NULL),
	('d02b6f87-4c92-4946-beaa-c24632d4e8f8', '235ce1e2-e5a5-4db9-9d2b-22093d960566', 'b44733ca-14b9-4fc7-9824-ca822f7dc138', NULL, NULL),
	('d302f677-1e17-41cc-854a-6a5e8c7b685d', '235ce1e2-e5a5-4db9-9d2b-22093d960566', 'b9d606fa-7b70-46cf-9617-9c832721233b', NULL, NULL),
	('676d48ca-453d-4259-aa47-5597b183e775', '9a5909bb-e759-44ab-b8d0-7143482f66e8', 'dabefbfc-0ee8-4f3a-803e-3da1558e360b', NULL, NULL),
	('e6eb30a7-09bf-441f-8d17-1591209161b5', '9a5909bb-e759-44ab-b8d0-7143482f66e8', '63345b27-6b29-46c7-8755-2c05e208f20b', NULL, NULL),
	('f032ff41-f540-4b04-b05a-108cb01cd462', '9a5909bb-e759-44ab-b8d0-7143482f66e8', 'e14e0bfe-7aae-4f24-8f1f-565902818aac', NULL, NULL),
	('7930a519-bccc-4693-9b52-88b92f02cbb7', '492d0538-5ab2-43bc-bc7b-e538da900639', 'dabefbfc-0ee8-4f3a-803e-3da1558e360b', NULL, NULL),
	('f594da26-993a-4d42-9daf-4b6216ba5611', '492d0538-5ab2-43bc-bc7b-e538da900639', 'a98f4991-9f7d-462a-a0fa-c87ca319583b', NULL, NULL),
	('3146ff05-2161-428b-9de9-2f9992d756da', '492d0538-5ab2-43bc-bc7b-e538da900639', 'ba7252f2-c0c1-4ca4-81ad-83d23685ad47', NULL, NULL);


--
-- Data for Name: book_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: book_tag_mappings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: book_views; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: bookmarks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: carousel_images; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: collaborative_filtering_data; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: photo_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: comment_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: feed_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."comments" ("id", "user_id", "feed_entry_id", "content", "created_at", "updated_at", "is_hidden", "is_deleted", "entity_type", "entity_id", "parent_id") VALUES
	('2a8e1652-2843-4f5c-86e2-dfc545f5c939', '2474659f-003e-4faa-8c53-9969c33f20b2', NULL, 'Thisisatest', '2025-07-31 05:31:25.660668+00', '2025-07-31 05:31:25.660668+00', false, false, 'photo', '44c520f7-43af-4abb-acf6-e00f50b74f3b', NULL);


--
-- Data for Name: comment_reactions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: contact_info; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: content_features; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: content_flags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: content_generation_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: custom_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: data_enrichment_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: dewey_decimal_classifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."dewey_decimal_classifications" ("id", "code", "description", "parent_code", "level", "created_at", "updated_at") VALUES
	('506b36cf-bd90-4772-9b17-c4f9b7170e95', '000', 'Computer science, information & general works', NULL, 1, '2025-07-02 20:01:40.007519+00', '2025-07-02 20:01:40.007519+00'),
	('b73c16b2-5b6c-48c0-9dec-aadb5aa338bf', '100', 'Philosophy & psychology', NULL, 1, '2025-07-02 20:01:40.007519+00', '2025-07-02 20:01:40.007519+00'),
	('7b83d7b4-e662-4217-a997-fa1cff246428', '200', 'Religion', NULL, 1, '2025-07-02 20:01:40.007519+00', '2025-07-02 20:01:40.007519+00'),
	('330da12a-a15a-48e1-bcc6-25d109dbd323', '300', 'Social sciences', NULL, 1, '2025-07-02 20:01:40.007519+00', '2025-07-02 20:01:40.007519+00'),
	('9901e642-8ba5-4a0f-994a-94176c7ab1b1', '400', 'Language', NULL, 1, '2025-07-02 20:01:40.007519+00', '2025-07-02 20:01:40.007519+00'),
	('a4a9e788-7d53-45a8-9bfc-f2f763a7cec9', '500', 'Pure Science', NULL, 1, '2025-07-02 20:01:40.007519+00', '2025-07-02 20:01:40.007519+00'),
	('22b921a4-a945-48ff-b962-b77be8390ce2', '600', 'Technology', NULL, 1, '2025-07-02 20:01:40.007519+00', '2025-07-02 20:01:40.007519+00'),
	('215b9d12-8af1-4357-a6ff-0c477dac9ee8', '700', 'Arts & recreation', NULL, 1, '2025-07-02 20:01:40.007519+00', '2025-07-02 20:01:40.007519+00'),
	('3bff5b8e-af7e-4e11-ad6a-879813138a09', '800', 'Literature', NULL, 1, '2025-07-02 20:01:40.007519+00', '2025-07-02 20:01:40.007519+00'),
	('a6323690-e568-4db2-a356-943644bfeda2', '900', 'History & geography', NULL, 1, '2025-07-02 20:01:40.007519+00', '2025-07-02 20:01:40.007519+00');


--
-- Data for Name: discussions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: discussion_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: enterprise_audit_trail; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."enterprise_audit_trail" ("id", "table_name", "record_id", "operation", "old_values", "new_values", "changed_by", "changed_at", "ip_address", "user_agent", "session_id", "transaction_id", "application_version", "environment") VALUES
	('72a3e9ff-c2e1-46b0-8df9-be292aeb946e', 'authors', '9953a3e0-4982-4ae5-8093-829c4320ef8d', 'INSERT', NULL, '{"id": "9953a3e0-4982-4ae5-8093-829c4320ef8d", "bio": null, "name": "Katherine Garbera", "website": null, "featured": false, "birth_date": null, "created_at": "2025-07-06T07:13:55.071969+00:00", "updated_at": "2025-07-06T07:13:55.071969+00:00", "nationality": null, "goodreads_url": null, "cover_image_id": null, "twitter_handle": null, "author_image_id": null, "facebook_handle": null, "instagram_handle": null, "author_gallery_id": null}', '00000000-0000-0000-0000-000000000000', '2025-07-06 07:13:55.071969+00', '2600:1f18:2a66:6e00:125b:f6a2:ab17:1b80', 'postgres-meta 0.0.0-automated', NULL, '21889', NULL, 'production'),
	('e5efe832-8c7f-422f-b2a5-c958570d95e4', 'books', '30751fff-3388-4cd2-b96c-38d467bb4785', 'UPDATE', '{"id": "30751fff-3388-4cd2-b96c-38d467bb4785", "pages": null, "title": "AMANTE TENTADORA (Spanish Edition)", "author": "Katherine Garbera", "isbn10": "0373357389", "isbn13": "9780373357383", "weight": null, "binding": null, "edition": null, "featured": false, "language": null, "overview": null, "synopsis": "<p>Convertir en su amante a la hija de su peor enemigo era un sue??echo realidad? pero no imaginaba el precio que tendr?que pagar</p>\n<p>Despu?de que su padre le negara un ascenso, la rica heredera Tempest Lambert ofreci??s servicios al peor enemigo de su padre. Pero, ¿qu?ra exactamente lo que deseaba, aquel trabajo o a su nuevo jefe, el guap?mo Gavin Renard?</p>\n<p>Gavin se hab?hecho millonario absorbiendo empresas, pero hacerse con el imperio de Lambert no era una cuesti??e negocios? era una venganza. Podr?utilizar a Tempest para conseguirlo? y quiz?ambi?convertirla en su amante.</p>", "author_id": null, "status_id": null, "created_at": "2025-07-03T06:54:12.886845+00:00", "dimensions": null, "list_price": null, "title_long": null, "updated_at": "2025-07-03T06:54:12.886845+00:00", "publisher_id": "ad76092d-b5b1-4045-af9f-5fae7b4aef6b", "review_count": 0, "average_rating": 0, "cover_image_id": null, "format_type_id": null, "binding_type_id": null, "book_gallery_img": null, "publication_date": null, "original_image_url": "https://images.isbndb.com/covers/25341033482320.jpg"}', '{"id": "30751fff-3388-4cd2-b96c-38d467bb4785", "pages": null, "title": "AMANTE TENTADORA (Spanish Edition)", "author": "Katherine Garbera", "isbn10": "0373357389", "isbn13": "9780373357383", "weight": null, "binding": null, "edition": null, "featured": false, "language": null, "overview": null, "synopsis": "<p>Convertir en su amante a la hija de su peor enemigo era un sue??echo realidad? pero no imaginaba el precio que tendr?que pagar</p>\n<p>Despu?de que su padre le negara un ascenso, la rica heredera Tempest Lambert ofreci??s servicios al peor enemigo de su padre. Pero, ¿qu?ra exactamente lo que deseaba, aquel trabajo o a su nuevo jefe, el guap?mo Gavin Renard?</p>\n<p>Gavin se hab?hecho millonario absorbiendo empresas, pero hacerse con el imperio de Lambert no era una cuesti??e negocios? era una venganza. Podr?utilizar a Tempest para conseguirlo? y quiz?ambi?convertirla en su amante.</p>", "author_id": "9953a3e0-4982-4ae5-8093-829c4320ef8d", "status_id": null, "created_at": "2025-07-03T06:54:12.886845+00:00", "dimensions": null, "list_price": null, "title_long": null, "updated_at": "2025-07-03T06:54:12.886845+00:00", "publisher_id": "ad76092d-b5b1-4045-af9f-5fae7b4aef6b", "review_count": 0, "average_rating": 0, "cover_image_id": null, "format_type_id": null, "binding_type_id": null, "book_gallery_img": null, "publication_date": null, "original_image_url": "https://images.isbndb.com/covers/25341033482320.jpg"}', '00000000-0000-0000-0000-000000000000', '2025-07-06 07:14:41.294962+00', '2600:1f18:2a66:6e00:125b:f6a2:ab17:1b80', 'postgres-meta 0.0.0-automated', NULL, '21890', NULL, 'production'),
	('ac4fb185-a56a-4f3c-8655-cf8ac52f9323', 'reading_progress', '2808ff26-24d9-429d-bf40-c2d8c82809a0', 'UPDATE', '{"id": "2808ff26-24d9-429d-bf40-c2d8c82809a0", "status": "not_started", "book_id": "30751fff-3388-4cd2-b96c-38d467bb4785", "user_id": "e06cdf85-b449-4dcb-b943-068aaad8cfa3", "created_at": "2025-07-05T05:39:05.555+00:00", "start_date": null, "updated_at": "2025-07-05T05:39:05.555+00:00", "finish_date": null, "allow_friends": false, "privacy_level": "private", "allow_followers": false, "privacy_audit_log": [], "custom_permissions": [], "progress_percentage": 0}', '{"id": "2808ff26-24d9-429d-bf40-c2d8c82809a0", "status": "in_progress", "book_id": "30751fff-3388-4cd2-b96c-38d467bb4785", "user_id": "e06cdf85-b449-4dcb-b943-068aaad8cfa3", "created_at": "2025-07-05T05:39:05.555+00:00", "start_date": "2025-07-06T18:52:04.298+00:00", "updated_at": "2025-07-06T18:52:04.298+00:00", "finish_date": null, "allow_friends": false, "privacy_level": "private", "allow_followers": false, "privacy_audit_log": [], "custom_permissions": [], "progress_percentage": 0}', 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', '2025-07-06 18:52:05.297749+00', '::1', 'postgrest', NULL, '21894', NULL, 'production'),
	('0052c331-f5a7-4cc4-bbbc-bc30a314a6bb', 'authors', '9953a3e0-4982-4ae5-8093-829c4320ef8d', 'UPDATE', '{"id": "9953a3e0-4982-4ae5-8093-829c4320ef8d", "bio": null, "name": "Katherine Garbera", "website": null, "featured": false, "birth_date": null, "created_at": "2025-07-06T07:13:55.071969+00:00", "updated_at": "2025-07-06T07:13:55.071969+00:00", "nationality": null, "goodreads_url": null, "cover_image_id": null, "twitter_handle": null, "author_image_id": null, "facebook_handle": null, "instagram_handle": null, "author_gallery_id": null}', '{"id": "9953a3e0-4982-4ae5-8093-829c4320ef8d", "bio": "This is a test bio that will be updated soon", "name": "Katherine Garbera", "website": null, "featured": false, "birth_date": null, "created_at": "2025-07-06T07:13:55.071969+00:00", "updated_at": "2025-07-06T07:13:55.071969+00:00", "nationality": null, "goodreads_url": null, "cover_image_id": null, "twitter_handle": null, "author_image_id": null, "facebook_handle": null, "instagram_handle": null, "author_gallery_id": null}', '00000000-0000-0000-0000-000000000000', '2025-07-07 09:17:27.877917+00', '::1', 'postgrest', NULL, '22056', NULL, 'production'),
	('bbaca749-0838-4098-a9ec-f24d089ab907', 'authors', '8e75e51f-701f-4f3a-83da-70f625876ca8', 'INSERT', NULL, '{"id": "8e75e51f-701f-4f3a-83da-70f625876ca8", "bio": null, "name": "Beth Guckenberger", "website": null, "featured": false, "birth_date": null, "created_at": "2025-07-08T00:11:48.482659+00:00", "updated_at": "2025-07-08T00:11:48.482659+00:00", "nationality": null, "goodreads_url": null, "cover_image_id": null, "twitter_handle": null, "author_image_id": null, "facebook_handle": null, "instagram_handle": null, "author_gallery_id": null}', '00000000-0000-0000-0000-000000000000', '2025-07-08 00:11:48.482659+00', '::1', 'postgrest', NULL, '22065', NULL, 'production'),
	('297cb204-157a-4361-a763-c32d5b0827e1', 'publishers', 'f1a5d323-99aa-4329-9536-5dee26fc1c0c', 'INSERT', NULL, '{"id": "f1a5d323-99aa-4329-9536-5dee26fc1c0c", "city": null, "name": "Thomas Nelson", "about": null, "email": null, "phone": null, "state": null, "country": null, "website": null, "featured": false, "country_id": null, "created_at": "2025-07-08T00:11:48.828479+00:00", "updated_at": "2025-07-08T00:11:48.828479+00:00", "postal_code": null, "founded_year": null, "address_line1": null, "address_line2": null, "cover_image_id": null, "publisher_image_id": null, "publisher_gallery_id": null}', '00000000-0000-0000-0000-000000000000', '2025-07-08 00:11:48.828479+00', '::1', 'postgrest', NULL, '22066', NULL, 'production'),
	('099bb5c7-f605-407e-b4d5-b717adbd8a72', 'books', '51647138-7959-4461-981e-664c816b3b1e', 'INSERT', NULL, '{"id": "51647138-7959-4461-981e-664c816b3b1e", "pages": 240, "title": "Start with Amen: How I Learned to Surrender by Keeping the End in Mind", "author": null, "isbn10": null, "isbn13": "0718079019", "weight": null, "binding": null, "edition": null, "featured": false, "language": "en", "overview": null, "synopsis": null, "author_id": "8e75e51f-701f-4f3a-83da-70f625876ca8", "status_id": null, "created_at": "2025-07-08T00:11:49.032605+00:00", "dimensions": null, "list_price": null, "title_long": null, "updated_at": "2025-07-08T00:11:49.032605+00:00", "publisher_id": "f1a5d323-99aa-4329-9536-5dee26fc1c0c", "review_count": 0, "average_rating": 0, "cover_image_id": null, "format_type_id": null, "binding_type_id": null, "book_gallery_img": null, "publication_date": "2017-05-09", "original_image_url": "https://images.isbndb.com/covers/18005203482443.jpg"}', '00000000-0000-0000-0000-000000000000', '2025-07-08 00:11:49.032605+00', '::1', 'postgrest', NULL, '22067', NULL, 'production'),
	('b8dbde52-6bbd-4435-b519-e74605a3ddf2', 'publishers', 'b1ae09e3-7dae-491f-8ad6-e513fd9d1977', 'INSERT', NULL, '{"id": "b1ae09e3-7dae-491f-8ad6-e513fd9d1977", "city": null, "name": "David C Cook", "about": null, "email": null, "phone": null, "state": null, "country": null, "website": null, "featured": false, "country_id": null, "created_at": "2025-07-08T04:43:58.67216+00:00", "updated_at": "2025-07-08T04:43:58.67216+00:00", "postal_code": null, "founded_year": null, "address_line1": null, "address_line2": null, "cover_image_id": null, "publisher_image_id": null, "publisher_gallery_id": null}', '00000000-0000-0000-0000-000000000000', '2025-07-08 04:43:58.67216+00', '::1', 'postgrest', NULL, '22081', NULL, 'production'),
	('ee341ec5-f70d-4c00-b2a2-59d8bd518dfc', 'books', '4cc8c3f7-b8a1-4348-96b7-b8b5671ff223', 'INSERT', NULL, '{"id": "4cc8c3f7-b8a1-4348-96b7-b8b5671ff223", "pages": 40, "title": "The Heart Who Wanted to Find a Way (Volume 3) (StrongHeart Stories)", "author": "Beth Guckenberger", "isbn10": null, "isbn13": "9780830785988", "weight": null, "binding": "Hardcover", "edition": null, "featured": false, "language": "en", "overview": null, "synopsis": null, "author_id": "8e75e51f-701f-4f3a-83da-70f625876ca8", "status_id": null, "created_at": "2025-07-08T04:44:00.248611+00:00", "dimensions": null, "list_price": null, "title_long": "The Heart Who Wanted to Find a Way (Volume 3) (StrongHeart Stories)", "updated_at": "2025-07-08T04:44:00.248611+00:00", "publisher_id": "b1ae09e3-7dae-491f-8ad6-e513fd9d1977", "review_count": 0, "average_rating": 0, "cover_image_id": null, "format_type_id": "d32977ce-788d-4c75-af76-ea033978f402", "binding_type_id": "bd110077-f85e-46fe-8411-894c4a61f132", "book_gallery_img": null, "publication_date": "2025-03-04", "original_image_url": null}', '00000000-0000-0000-0000-000000000000', '2025-07-08 04:44:00.248611+00', '::1', 'postgrest', NULL, '22084', NULL, 'production'),
	('2aaf2475-b7eb-4f49-84a3-56188e222481', 'publishers', '5eaef69c-5ddd-4a58-8412-47df975a472a', 'INSERT', NULL, '{"id": "5eaef69c-5ddd-4a58-8412-47df975a472a", "city": null, "name": "Zondervan", "about": null, "email": null, "phone": null, "state": null, "country": null, "website": null, "featured": false, "country_id": null, "created_at": "2025-07-08T04:54:16.466469+00:00", "updated_at": "2025-07-08T04:54:16.466469+00:00", "postal_code": null, "founded_year": null, "address_line1": null, "address_line2": null, "cover_image_id": null, "publisher_image_id": null, "publisher_gallery_id": null}', '00000000-0000-0000-0000-000000000000', '2025-07-08 04:54:16.466469+00', '::1', 'postgrest', NULL, '22096', NULL, 'production'),
	('e0071005-ca5f-40b1-9dc8-312ef7cb244a', 'books', 'fc5a28b3-f057-4b9c-a8bd-4d97baf31dd6', 'INSERT', NULL, '{"id": "fc5a28b3-f057-4b9c-a8bd-4d97baf31dd6", "pages": 224, "title": "Reckless Faith: Let Go and Be Led", "author": "Beth Guckenberger", "isbn10": null, "isbn13": "9780310616108", "weight": null, "binding": "Paperback", "edition": null, "featured": false, "language": "en", "overview": null, "synopsis": "Thirteen years ago, a mission trip inspired a young couple to move to Mexico to care for orphans and other children. True stories drawn from their ministry experiences challenge readers to trust God to show up exactly when and where He’s needed<br/>most.", "author_id": "8e75e51f-701f-4f3a-83da-70f625876ca8", "status_id": null, "created_at": "2025-07-08T04:54:18.164368+00:00", "dimensions": "Height: 7.0866 Inches, Length: 4.88188 Inches, Width: 0.59055 Inches", "list_price": null, "title_long": "Reckless Faith: Let Go and Be Led", "updated_at": "2025-07-08T04:54:18.164368+00:00", "publisher_id": "5eaef69c-5ddd-4a58-8412-47df975a472a", "review_count": 0, "average_rating": 0, "cover_image_id": null, "format_type_id": "d32977ce-788d-4c75-af76-ea033978f402", "binding_type_id": "50d370e1-c0b9-4bb5-b278-0aa247da36fd", "book_gallery_img": null, "publication_date": "2008-08-01", "original_image_url": null}', '00000000-0000-0000-0000-000000000000', '2025-07-08 04:54:18.164368+00', '::1', 'postgrest', NULL, '22098', NULL, 'production'),
	('fe473ff3-ca2b-4707-98c4-91b809fc327d', 'books', '51647138-7959-4461-981e-664c816b3b1e', 'UPDATE', '{"id": "51647138-7959-4461-981e-664c816b3b1e", "pages": 240, "title": "Start with Amen: How I Learned to Surrender by Keeping the End in Mind", "author": null, "isbn10": null, "isbn13": "0718079019", "weight": null, "binding": null, "edition": null, "featured": false, "language": "en", "overview": null, "synopsis": null, "author_id": "8e75e51f-701f-4f3a-83da-70f625876ca8", "status_id": null, "created_at": "2025-07-08T00:11:49.032605+00:00", "dimensions": null, "list_price": null, "title_long": null, "updated_at": "2025-07-08T00:11:49.032605+00:00", "publisher_id": "f1a5d323-99aa-4329-9536-5dee26fc1c0c", "review_count": 0, "average_rating": 0, "cover_image_id": null, "format_type_id": null, "binding_type_id": null, "book_gallery_img": null, "publication_date": "2017-05-09", "original_image_url": "https://images.isbndb.com/covers/18005203482443.jpg"}', '{"id": "51647138-7959-4461-981e-664c816b3b1e", "pages": 240, "title": "Start with Amen: How I Learned to Surrender by Keeping the End in Mind", "author": null, "isbn10": null, "isbn13": "0718079019", "weight": null, "binding": null, "edition": null, "featured": false, "language": "en", "overview": null, "synopsis": null, "author_id": "8e75e51f-701f-4f3a-83da-70f625876ca8", "status_id": null, "created_at": "2025-07-08T00:11:49.032605+00:00", "dimensions": null, "list_price": null, "title_long": null, "updated_at": "2025-07-08T00:11:49.032605+00:00", "publisher_id": "f1a5d323-99aa-4329-9536-5dee26fc1c0c", "review_count": 0, "average_rating": 0, "cover_image_id": "22e97769-c2df-4220-bed8-e9261ace71a6", "format_type_id": null, "binding_type_id": null, "book_gallery_img": null, "publication_date": "2017-05-09", "original_image_url": "https://images.isbndb.com/covers/18005203482443.jpg"}', '00000000-0000-0000-0000-000000000000', '2025-07-08 09:25:30.76088+00', '::1', 'postgrest', NULL, '22118', NULL, 'production'),
	('19799e10-9a44-4c2f-beab-e101139b8fa3', 'publishers', '18c99335-dfb8-42da-8ff3-c45ceb1f04fd', 'INSERT', NULL, '{"id": "18c99335-dfb8-42da-8ff3-c45ceb1f04fd", "city": null, "name": "Standard Publishing", "about": null, "email": null, "phone": null, "state": null, "country": null, "website": null, "featured": false, "country_id": null, "created_at": "2025-07-08T09:36:28.731401+00:00", "updated_at": "2025-07-08T09:36:28.731401+00:00", "postal_code": null, "founded_year": null, "address_line1": null, "address_line2": null, "cover_image_id": null, "publisher_image_id": null, "publisher_gallery_id": null}', '00000000-0000-0000-0000-000000000000', '2025-07-08 09:36:28.731401+00', '::1', 'postgrest', NULL, '22119', NULL, 'production'),
	('8806a902-6cf9-4851-87ab-f1ffa873c881', 'books', '93ffd20c-a67f-4539-97b9-f151ba30abb6', 'INSERT', NULL, '{"id": "93ffd20c-a67f-4539-97b9-f151ba30abb6", "pages": 208, "title": "Tales of the Ones He Won''t Let Go (Storyweaver)", "author": "Beth Guckenberger", "isbn10": null, "isbn13": "9780784776346", "weight": 0.75, "binding": "Paperback", "edition": null, "featured": false, "language": "en", "overview": null, "synopsis": "By Beth Guckenberger: Moses escapes a curse. Sally is delivered out of slavery. Ronaldo''s silent dreams are heard. Lola, Lily, and Pamela take steps toward hope. Sam and Ellie begin to live without fear. Learn the five real-life stories behind these names and walk in the well-worn shoes of children from nations far away and neighborhoods not so unlike your own. Watch as our God the Rescuer lifts their feet up out of destruction and sets them on paths of healing, redemption, and grace. Like the other titles in the Storyweaver series, this book highlights some of the difficult and complex physical, emotional, and spiritual struggles of children who have been neglected and abandoned, but makes these struggles understandable and relatable to any reader.", "author_id": "8e75e51f-701f-4f3a-83da-70f625876ca8", "status_id": null, "created_at": "2025-07-08T09:36:30.249417+00:00", "dimensions": "Height: 8.8976 Inches, Length: 5.9843 Inches, Weight: 0.75 Pounds, Width: 0.5512 Inches", "list_price": null, "title_long": "Tales of the Ones He Won''t Let Go (Storyweaver)", "updated_at": "2025-07-08T09:36:30.249417+00:00", "publisher_id": "18c99335-dfb8-42da-8ff3-c45ceb1f04fd", "review_count": 0, "average_rating": 0, "cover_image_id": null, "format_type_id": "d32977ce-788d-4c75-af76-ea033978f402", "binding_type_id": "50d370e1-c0b9-4bb5-b278-0aa247da36fd", "book_gallery_img": null, "publication_date": "2014-12-28", "original_image_url": null}', '00000000-0000-0000-0000-000000000000', '2025-07-08 09:36:30.249417+00', '::1', 'postgrest', NULL, '22120', NULL, 'production'),
	('78f152ec-feab-4fc2-8244-ad90e95f1e68', 'books', '8366132b-50b4-452a-88b3-cd7368ecfd71', 'INSERT', NULL, '{"id": "8366132b-50b4-452a-88b3-cd7368ecfd71", "pages": null, "title": "Super Simple Mission Kit Featuring Tales of the Not Forgotten: A Fully-resources Missions Curriculum (Kids Serving Kids)", "author": "Beth Guckenberger", "isbn10": null, "isbn13": "9780784774793", "weight": 2.55, "binding": "Paperback", "edition": "Leaders Guide, Teachers Guide", "featured": false, "language": "en", "overview": null, "synopsis": "Filled with fun activities, compelling stories, biblical teaching, kid-friendly service projects, and family outreach ideas, the Super Simple Mission Kit will:?Open kids? eyes to the needs in their community and around the world.?Shape kids? hearts to mirror God?s heart of compassion.?Inspire kids to courageously follow God?s call.In partnering with Back2Back Ministries, this kit will: 1. Provide children?s ministers and pastors with resources that guide children to look beyond themselves and think of others--especially of kids around the world living in difficult situations. This complete kit includes stories, curriculum, video clips, visuals, and detailed instructions on how to partner with Back2Back Ministries.2. There are 163 million orphans around the world. With each purchase, a portion of the proceeds will go to Back2Back Ministries to directly serve orphans The Super Simple Mission Kit helps kids discover the basic needs of children living in poverty in developing countries. Al", "author_id": "8e75e51f-701f-4f3a-83da-70f625876ca8", "status_id": null, "created_at": "2025-07-08T09:49:44.668053+00:00", "dimensions": "Height: 10.5 inches, Length: 7 inches, Weight: 2.55 Pounds, Width: 2.25 inches", "list_price": null, "title_long": "Super Simple Mission Kit Featuring Tales of the Not Forgotten: A Fully-resources Missions Curriculum (Kids Serving Kids)", "updated_at": "2025-07-08T09:49:44.668053+00:00", "publisher_id": "b1ae09e3-7dae-491f-8ad6-e513fd9d1977", "review_count": 0, "average_rating": 0, "cover_image_id": "642cfd82-6a4c-459d-a2d9-8cf8501e57f7", "format_type_id": "d32977ce-788d-4c75-af76-ea033978f402", "binding_type_id": "50d370e1-c0b9-4bb5-b278-0aa247da36fd", "book_gallery_img": null, "publication_date": "2019-01-01", "original_image_url": null}', '00000000-0000-0000-0000-000000000000', '2025-07-08 09:49:44.668053+00', '::1', 'postgrest', NULL, '22131', NULL, 'production'),
	('ae073692-a93b-4e93-9372-499f1f33592a', 'books', '93ffd20c-a67f-4539-97b9-f151ba30abb6', 'DELETE', '{"id": "93ffd20c-a67f-4539-97b9-f151ba30abb6", "pages": 208, "title": "Tales of the Ones He Won''t Let Go (Storyweaver)", "author": "Beth Guckenberger", "isbn10": null, "isbn13": "9780784776346", "weight": 0.75, "binding": "Paperback", "edition": null, "featured": false, "language": "en", "overview": null, "synopsis": "By Beth Guckenberger: Moses escapes a curse. Sally is delivered out of slavery. Ronaldo''s silent dreams are heard. Lola, Lily, and Pamela take steps toward hope. Sam and Ellie begin to live without fear. Learn the five real-life stories behind these names and walk in the well-worn shoes of children from nations far away and neighborhoods not so unlike your own. Watch as our God the Rescuer lifts their feet up out of destruction and sets them on paths of healing, redemption, and grace. Like the other titles in the Storyweaver series, this book highlights some of the difficult and complex physical, emotional, and spiritual struggles of children who have been neglected and abandoned, but makes these struggles understandable and relatable to any reader.", "author_id": "8e75e51f-701f-4f3a-83da-70f625876ca8", "status_id": null, "created_at": "2025-07-08T09:36:30.249417+00:00", "dimensions": "Height: 8.8976 Inches, Length: 5.9843 Inches, Weight: 0.75 Pounds, Width: 0.5512 Inches", "list_price": null, "title_long": "Tales of the Ones He Won''t Let Go (Storyweaver)", "updated_at": "2025-07-08T09:36:30.249417+00:00", "publisher_id": "18c99335-dfb8-42da-8ff3-c45ceb1f04fd", "review_count": 0, "average_rating": 0, "cover_image_id": null, "format_type_id": "d32977ce-788d-4c75-af76-ea033978f402", "binding_type_id": "50d370e1-c0b9-4bb5-b278-0aa247da36fd", "book_gallery_img": null, "publication_date": "2014-12-28", "original_image_url": null}', NULL, '00000000-0000-0000-0000-000000000000', '2025-07-13 04:18:08.136903+00', '::1', 'postgrest', NULL, '22216', NULL, 'production'),
	('f13f6014-e8be-48d7-82e1-4c655fddefac', 'books', 'fc5a28b3-f057-4b9c-a8bd-4d97baf31dd6', 'DELETE', '{"id": "fc5a28b3-f057-4b9c-a8bd-4d97baf31dd6", "pages": 224, "title": "Reckless Faith: Let Go and Be Led", "author": "Beth Guckenberger", "isbn10": null, "isbn13": "9780310616108", "weight": null, "binding": "Paperback", "edition": null, "featured": false, "language": "en", "overview": null, "synopsis": "Thirteen years ago, a mission trip inspired a young couple to move to Mexico to care for orphans and other children. True stories drawn from their ministry experiences challenge readers to trust God to show up exactly when and where He’s needed<br/>most.", "author_id": "8e75e51f-701f-4f3a-83da-70f625876ca8", "status_id": null, "created_at": "2025-07-08T04:54:18.164368+00:00", "dimensions": "Height: 7.0866 Inches, Length: 4.88188 Inches, Width: 0.59055 Inches", "list_price": null, "title_long": "Reckless Faith: Let Go and Be Led", "updated_at": "2025-07-08T04:54:18.164368+00:00", "publisher_id": "5eaef69c-5ddd-4a58-8412-47df975a472a", "review_count": 0, "average_rating": 0, "cover_image_id": null, "format_type_id": "d32977ce-788d-4c75-af76-ea033978f402", "binding_type_id": "50d370e1-c0b9-4bb5-b278-0aa247da36fd", "book_gallery_img": null, "publication_date": "2008-08-01", "original_image_url": null}', NULL, '00000000-0000-0000-0000-000000000000', '2025-07-13 04:18:38.811357+00', '::1', 'postgrest', NULL, '22217', NULL, 'production'),
	('2bccb88e-0030-49f0-b157-05219da4e21f', 'books', '4cc8c3f7-b8a1-4348-96b7-b8b5671ff223', 'DELETE', '{"id": "4cc8c3f7-b8a1-4348-96b7-b8b5671ff223", "pages": 40, "title": "The Heart Who Wanted to Find a Way (Volume 3) (StrongHeart Stories)", "author": "Beth Guckenberger", "isbn10": null, "isbn13": "9780830785988", "weight": null, "binding": "Hardcover", "edition": null, "featured": false, "language": "en", "overview": null, "synopsis": null, "author_id": "8e75e51f-701f-4f3a-83da-70f625876ca8", "status_id": null, "created_at": "2025-07-08T04:44:00.248611+00:00", "dimensions": null, "list_price": null, "title_long": "The Heart Who Wanted to Find a Way (Volume 3) (StrongHeart Stories)", "updated_at": "2025-07-08T04:44:00.248611+00:00", "publisher_id": "b1ae09e3-7dae-491f-8ad6-e513fd9d1977", "review_count": 0, "average_rating": 0, "cover_image_id": null, "format_type_id": "d32977ce-788d-4c75-af76-ea033978f402", "binding_type_id": "bd110077-f85e-46fe-8411-894c4a61f132", "book_gallery_img": null, "publication_date": "2025-03-04", "original_image_url": null}', NULL, '00000000-0000-0000-0000-000000000000', '2025-07-13 04:20:01.010037+00', '::1', 'postgrest', NULL, '22218', NULL, 'production'),
	('877e0e78-9194-4161-a279-f201735fb49f', 'books', '51647138-7959-4461-981e-664c816b3b1e', 'DELETE', '{"id": "51647138-7959-4461-981e-664c816b3b1e", "pages": 240, "title": "Start with Amen: How I Learned to Surrender by Keeping the End in Mind", "author": null, "isbn10": null, "isbn13": "0718079019", "weight": null, "binding": null, "edition": null, "featured": false, "language": "en", "overview": null, "synopsis": null, "author_id": "8e75e51f-701f-4f3a-83da-70f625876ca8", "status_id": null, "created_at": "2025-07-08T00:11:49.032605+00:00", "dimensions": null, "list_price": null, "title_long": null, "updated_at": "2025-07-08T00:11:49.032605+00:00", "publisher_id": "f1a5d323-99aa-4329-9536-5dee26fc1c0c", "review_count": 0, "average_rating": 0, "cover_image_id": "22e97769-c2df-4220-bed8-e9261ace71a6", "format_type_id": null, "binding_type_id": null, "book_gallery_img": null, "publication_date": "2017-05-09", "original_image_url": "https://images.isbndb.com/covers/18005203482443.jpg"}', NULL, '00000000-0000-0000-0000-000000000000', '2025-07-13 04:20:11.829157+00', '::1', 'postgrest', NULL, '22219', NULL, 'production'),
	('256f17ea-f785-422a-818a-07b54a3d08a7', 'books', '30751fff-3388-4cd2-b96c-38d467bb4785', 'DELETE', '{"id": "30751fff-3388-4cd2-b96c-38d467bb4785", "pages": null, "title": "AMANTE TENTADORA (Spanish Edition)", "author": "Katherine Garbera", "isbn10": "0373357389", "isbn13": "9780373357383", "weight": null, "binding": null, "edition": null, "featured": false, "language": null, "overview": null, "synopsis": "<p>Convertir en su amante a la hija de su peor enemigo era un sue??echo realidad? pero no imaginaba el precio que tendr?que pagar</p>\n<p>Despu?de que su padre le negara un ascenso, la rica heredera Tempest Lambert ofreci??s servicios al peor enemigo de su padre. Pero, ¿qu?ra exactamente lo que deseaba, aquel trabajo o a su nuevo jefe, el guap?mo Gavin Renard?</p>\n<p>Gavin se hab?hecho millonario absorbiendo empresas, pero hacerse con el imperio de Lambert no era una cuesti??e negocios? era una venganza. Podr?utilizar a Tempest para conseguirlo? y quiz?ambi?convertirla en su amante.</p>", "author_id": "9953a3e0-4982-4ae5-8093-829c4320ef8d", "status_id": null, "created_at": "2025-07-03T06:54:12.886845+00:00", "dimensions": null, "list_price": null, "title_long": null, "updated_at": "2025-07-03T06:54:12.886845+00:00", "publisher_id": "ad76092d-b5b1-4045-af9f-5fae7b4aef6b", "review_count": 0, "average_rating": 0, "cover_image_id": null, "format_type_id": null, "binding_type_id": null, "book_gallery_img": null, "publication_date": null, "original_image_url": "https://images.isbndb.com/covers/25341033482320.jpg"}', NULL, '00000000-0000-0000-0000-000000000000', '2025-07-13 04:20:21.05612+00', '::1', 'postgrest', NULL, '22220', NULL, 'production'),
	('a2c29427-c045-4f74-99cb-8b3d1cb7c2df', 'reading_progress', '2808ff26-24d9-429d-bf40-c2d8c82809a0', 'DELETE', '{"id": "2808ff26-24d9-429d-bf40-c2d8c82809a0", "status": "in_progress", "book_id": "30751fff-3388-4cd2-b96c-38d467bb4785", "user_id": "e06cdf85-b449-4dcb-b943-068aaad8cfa3", "created_at": "2025-07-05T05:39:05.555+00:00", "start_date": "2025-07-06T18:52:04.298+00:00", "updated_at": "2025-07-06T18:52:04.298+00:00", "finish_date": null, "allow_friends": false, "privacy_level": "private", "allow_followers": false, "privacy_audit_log": [], "custom_permissions": [], "progress_percentage": 0}', NULL, '00000000-0000-0000-0000-000000000000', '2025-07-13 04:20:21.05612+00', '::1', 'postgrest', NULL, '22220', NULL, 'production'),
	('4d374ade-9c12-44d8-960d-909b96dec729', 'publishers', '729c198c-4e2f-4e67-8591-ee4f6bd74385', 'INSERT', NULL, '{"id": "729c198c-4e2f-4e67-8591-ee4f6bd74385", "city": null, "name": "Red Door Books", "about": null, "email": null, "phone": null, "state": null, "country": null, "website": null, "featured": false, "country_id": null, "created_at": "2025-07-13T07:13:14.232476+00:00", "updated_at": "2025-07-13T07:13:14.232476+00:00", "postal_code": null, "founded_year": null, "address_line1": null, "address_line2": null, "cover_image_id": null, "publisher_image_id": null, "publisher_gallery_id": null}', '00000000-0000-0000-0000-000000000000', '2025-07-13 07:13:14.232476+00', '::1', 'postgrest', NULL, '22226', NULL, 'production'),
	('21168203-3900-41cb-9b6b-4ca13b39a052', 'authors', 'e31e061d-a4a8-4cc8-af18-754786ad5ee3', 'INSERT', NULL, '{"id": "e31e061d-a4a8-4cc8-af18-754786ad5ee3", "bio": null, "name": "Envy Red", "website": null, "featured": false, "birth_date": null, "created_at": "2025-07-13T07:13:14.630895+00:00", "updated_at": "2025-07-13T07:13:14.630895+00:00", "nationality": null, "goodreads_url": null, "cover_image_id": null, "twitter_handle": null, "author_image_id": null, "facebook_handle": null, "instagram_handle": null, "author_gallery_id": null}', '00000000-0000-0000-0000-000000000000', '2025-07-13 07:13:14.630895+00', '::1', 'postgrest', NULL, '22227', NULL, 'production'),
	('f729b53f-d01a-4efe-900c-fdac2681af84', 'books', '235ce1e2-e5a5-4db9-9d2b-22093d960566', 'INSERT', NULL, '{"id": "235ce1e2-e5a5-4db9-9d2b-22093d960566", "pages": 230, "title": "High Rollers", "author": "Envy Red", "isbn10": "0983716412", "isbn13": "9780983716419", "weight": 0.79, "binding": "Paperback", "edition": null, "featured": false, "language": "en", "overview": null, "synopsis": "Product Description<br/><br/><br/>Welcome to High Rollers, a skater''s paradise, where everything is not as it seems. Situated in the heart of West Baltimore, this rink is headquarters to a sinister human trafficking operation. With a reach that travels far beyond the South American border, the stakes are high when gambling within the inner realms of this skate haven. Meet troubled Iraq War veteran Jimmie \"Snake\" Watson, the charismatic yet loose cannon mastermind, whose skillful art of persuasion creates a seemingly untouchable empire. Witness what happens when greed, dishonor, love, and the revealing of shocking truths stand to send his perfect world crashing down. Session 1.... So it begins!<br/><br/><br/>About the Author<br/><br/><br/>Envy Red is a Washington, DC area native by way of Birmingham, AL. A two time graduate of the University of Maryland, she resides in Atlanta, GA with her two boys. She is a cancer survivor whose battle with a rare form of the disease has strengthened her dedication to philanthropy. She is a board member of Homebound Citizens Non-Profit as well as the founder of the Free Young Minds Project, a youth initiative committed to developing our nation’s youth to their fullest potential. Literary Accomplishments: Most Talked About Author 2011 - DJ Gatsby Book Club Debut Author of The Year 2011 - Prodigy Publishing''s Urban Literary Awards Best Dressed Female Author 2011- Prodigy Publishing''s Urban Literary Awards Author of The Year Female 2011 - Word on Da Street Urban Literary Awards  Nomination Female Author of The Year - AAMBC", "author_id": "e31e061d-a4a8-4cc8-af18-754786ad5ee3", "status_id": null, "created_at": "2025-07-13T07:13:15.753895+00:00", "dimensions": "Height: 8.5 inches, Length: 5.5 inches, Weight: 0.79 pounds, Width: 0.58 inches", "list_price": 0.00, "title_long": "High Rollers", "updated_at": "2025-07-13T07:13:15.753895+00:00", "publisher_id": "729c198c-4e2f-4e67-8591-ee4f6bd74385", "review_count": 0, "average_rating": 0, "cover_image_id": "57fbc74f-1371-4481-bd60-a647b84793e8", "format_type_id": "d32977ce-788d-4c75-af76-ea033978f402", "binding_type_id": "50d370e1-c0b9-4bb5-b278-0aa247da36fd", "book_gallery_img": null, "publication_date": "2012-01-01", "original_image_url": null}', '00000000-0000-0000-0000-000000000000', '2025-07-13 07:13:15.753895+00', '::1', 'postgrest', NULL, '22229', NULL, 'production'),
	('a8f2014b-ef82-435c-bb56-1297561e607f', 'books', '9a5909bb-e759-44ab-b8d0-7143482f66e8', 'INSERT', NULL, '{"id": "9a5909bb-e759-44ab-b8d0-7143482f66e8", "pages": 226, "title": "Touch", "author": "Envy Red", "isbn10": "0578072696", "isbn13": "9780578072692", "weight": 295, "binding": "Paperback", "edition": null, "featured": false, "language": "en", "overview": null, "synopsis": "Buckle your seatbelts and prepare for an exhilarating journey set in our nation’s capital where professionals indulge in more than their six figure careers. Through an erotic world of fantasy that almost crumbles at the hands of a sexual predator and serial killer, the shocking pasts of five individuals cross, and the page turning mystery that is Touch is told. Sidney, Nina, and Jade are three best friends from very different backgrounds who are active participants in the lifestyle, an exclusive underground swinger’s network, where professionals secretly gather to satisfy their carnal desires. When well known local celebrity and event planner Marcel Bennett is found brutally murdered after a lavish event, the connection to a series of serial killings is made and threatens to shake their foundation. Kenny aka “King”, is the troubled yet artistically talented younger brother of Sidney who is determined to shake his country roots and the demons he left behind. Will a gripping fear of success and mental baggage be his ultimate downfall or just the push he needs to move forward? Enter Devine, a local upscale health club owner, who just may be ready to settle down but not before being faced with demons from his own past including secrets held by his overbearing father, a high profiled city councilman. Watch as their pasts cross and their futures are forever altered when the mind blowing conclusion to this thrilling mystery unfolds, leaving you clinging to the edge of your seat.", "author_id": "e31e061d-a4a8-4cc8-af18-754786ad5ee3", "status_id": null, "created_at": "2025-07-13T07:13:18.397727+00:00", "dimensions": "height: 216 mm, length: 140 mm, width: 14 mm, weight: 295 g", "list_price": 0.00, "title_long": "Touch", "updated_at": "2025-07-13T07:13:18.397727+00:00", "publisher_id": "729c198c-4e2f-4e67-8591-ee4f6bd74385", "review_count": 0, "average_rating": 0, "cover_image_id": "03e2ac67-8c1a-4923-ac8d-702e775a3886", "format_type_id": "d32977ce-788d-4c75-af76-ea033978f402", "binding_type_id": "50d370e1-c0b9-4bb5-b278-0aa247da36fd", "book_gallery_img": null, "publication_date": "2011-01-01", "original_image_url": null}', '00000000-0000-0000-0000-000000000000', '2025-07-13 07:13:18.397727+00', '::1', 'postgrest', NULL, '22239', NULL, 'production'),
	('8c967114-7056-4bb8-9469-451bfdf2cf0c', 'books', '492d0538-5ab2-43bc-bc7b-e538da900639', 'INSERT', NULL, '{"id": "492d0538-5ab2-43bc-bc7b-e538da900639", "pages": 256, "title": "Jaded", "author": "Envy Red", "isbn10": "0983716404", "isbn13": "9780983716402", "weight": 327, "binding": "Paperback", "edition": null, "featured": false, "language": "en", "overview": null, "synopsis": "Imagine having your life consumed with nightmares of a wildly drug addicted mother whose career in prostitution leaves no one including yourself exempt from its consequences. Visualize having an unknown father whose only mark left on your life are unexplained exotic features. Envision learning that you were marked and written off as criminally insane at the tender age of 12. Now picture the same mental illness having you torn between two extremely opposite worlds of fantasy and reality. Journey behind the walls of St Agnes, a maximum security asylum in rural Virginia, and experience the suspenseful tale that is Jaded through the complex mind of a beautifully torn woman. Can love conquer all? This is the question posed as a love interest battles to show support through his own personal dilemma and tragedy. Will a seasoned therapist be able to provide the help needed, or will the unveiling of shocking truths cause damage beyond repair? Come along for the ups and downs of this jaw droppin", "author_id": "e31e061d-a4a8-4cc8-af18-754786ad5ee3", "status_id": null, "created_at": "2025-07-13T07:13:20.319565+00:00", "dimensions": "height: 216 mm, length: 140 mm, width: 16 mm, weight: 327 g", "list_price": 10, "title_long": "Jaded", "updated_at": "2025-07-13T07:13:20.319565+00:00", "publisher_id": "729c198c-4e2f-4e67-8591-ee4f6bd74385", "review_count": 0, "average_rating": 0, "cover_image_id": "107a9e86-6578-4bb7-98f5-9c1a8d944b3c", "format_type_id": "d32977ce-788d-4c75-af76-ea033978f402", "binding_type_id": "50d370e1-c0b9-4bb5-b278-0aa247da36fd", "book_gallery_img": null, "publication_date": "2011-11-16", "original_image_url": null}', '00000000-0000-0000-0000-000000000000', '2025-07-13 07:13:20.319565+00', '::1', 'postgrest', NULL, '22247', NULL, 'production'),
	('89e4e3a5-8406-4fad-915c-4a9d2bca147d', 'reading_progress', '27abd201-3f8e-4bc4-a76a-253eec68ab9d', 'INSERT', NULL, '{"id": "27abd201-3f8e-4bc4-a76a-253eec68ab9d", "status": "not_started", "book_id": "9a5909bb-e759-44ab-b8d0-7143482f66e8", "user_id": "e06cdf85-b449-4dcb-b943-068aaad8cfa3", "created_at": "2025-07-14T00:00:00.636+00:00", "start_date": null, "updated_at": "2025-07-14T00:00:00.636+00:00", "finish_date": null, "allow_friends": false, "privacy_level": "private", "allow_followers": false, "privacy_audit_log": [], "custom_permissions": [], "progress_percentage": 0}', 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', '2025-07-13 23:59:59.62574+00', '::1', 'postgrest', NULL, '22258', NULL, 'production'),
	('69a183bc-2be7-48fd-a76f-2e4fa117a76b', 'reading_progress', '27abd201-3f8e-4bc4-a76a-253eec68ab9d', 'UPDATE', '{"id": "27abd201-3f8e-4bc4-a76a-253eec68ab9d", "status": "not_started", "book_id": "9a5909bb-e759-44ab-b8d0-7143482f66e8", "user_id": "e06cdf85-b449-4dcb-b943-068aaad8cfa3", "created_at": "2025-07-14T00:00:00.636+00:00", "start_date": null, "updated_at": "2025-07-14T00:00:00.636+00:00", "finish_date": null, "allow_friends": false, "privacy_level": "private", "allow_followers": false, "privacy_audit_log": [], "custom_permissions": [], "progress_percentage": 0}', '{"id": "27abd201-3f8e-4bc4-a76a-253eec68ab9d", "status": "in_progress", "book_id": "9a5909bb-e759-44ab-b8d0-7143482f66e8", "user_id": "e06cdf85-b449-4dcb-b943-068aaad8cfa3", "created_at": "2025-07-14T00:00:00.636+00:00", "start_date": "2025-07-29T00:59:38.297+00:00", "updated_at": "2025-07-29T00:59:38.297+00:00", "finish_date": null, "allow_friends": false, "privacy_level": "private", "allow_followers": false, "privacy_audit_log": [], "custom_permissions": [], "progress_percentage": 0}', 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', '2025-07-29 00:59:37.88525+00', '::1', 'postgrest', NULL, '4375', NULL, 'production'),
	('15af0ac1-660c-4eba-885a-f599b34b6a7c', 'reading_progress', '27abd201-3f8e-4bc4-a76a-253eec68ab9d', 'UPDATE', '{"id": "27abd201-3f8e-4bc4-a76a-253eec68ab9d", "status": "in_progress", "book_id": "9a5909bb-e759-44ab-b8d0-7143482f66e8", "user_id": "e06cdf85-b449-4dcb-b943-068aaad8cfa3", "created_at": "2025-07-14T00:00:00.636+00:00", "start_date": "2025-07-29T00:59:38.297+00:00", "updated_at": "2025-07-29T00:59:38.297+00:00", "finish_date": null, "allow_friends": false, "privacy_level": "private", "allow_followers": false, "privacy_audit_log": [], "custom_permissions": [], "progress_percentage": 0}', '{"id": "27abd201-3f8e-4bc4-a76a-253eec68ab9d", "status": "completed", "book_id": "9a5909bb-e759-44ab-b8d0-7143482f66e8", "user_id": "e06cdf85-b449-4dcb-b943-068aaad8cfa3", "created_at": "2025-07-14T00:00:00.636+00:00", "start_date": "2025-07-29T00:59:38.297+00:00", "updated_at": "2025-07-31T08:10:13.425+00:00", "finish_date": "2025-07-31T08:10:13.425+00:00", "allow_friends": false, "privacy_level": "private", "allow_followers": false, "privacy_audit_log": [], "custom_permissions": [], "progress_percentage": 0}', 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', '2025-07-31 08:10:13.740658+00', '::1', 'postgrest', NULL, '4586', NULL, 'production'),
	('d00b46be-ed51-4048-b499-3a18b8452ec9', 'reading_progress', '902c1610-39ac-4468-873c-347c0596bf04', 'INSERT', NULL, '{"id": "902c1610-39ac-4468-873c-347c0596bf04", "status": "not_started", "book_id": "9a5909bb-e759-44ab-b8d0-7143482f66e8", "user_id": "2474659f-003e-4faa-8c53-9969c33f20b2", "created_at": "2025-07-31T08:10:54.519+00:00", "start_date": null, "updated_at": "2025-07-31T08:10:54.519+00:00", "finish_date": null, "allow_friends": false, "privacy_level": "private", "allow_followers": false, "privacy_audit_log": [], "custom_permissions": [], "progress_percentage": 0}', '2474659f-003e-4faa-8c53-9969c33f20b2', '2025-07-31 08:10:54.810167+00', '::1', 'postgrest', NULL, '4589', NULL, 'production'),
	('2d41e035-e806-405f-89b1-de8825b90541', 'reading_progress', '902c1610-39ac-4468-873c-347c0596bf04', 'UPDATE', '{"id": "902c1610-39ac-4468-873c-347c0596bf04", "status": "not_started", "book_id": "9a5909bb-e759-44ab-b8d0-7143482f66e8", "user_id": "2474659f-003e-4faa-8c53-9969c33f20b2", "created_at": "2025-07-31T08:10:54.519+00:00", "start_date": null, "updated_at": "2025-07-31T08:10:54.519+00:00", "finish_date": null, "allow_friends": false, "privacy_level": "private", "allow_followers": false, "privacy_audit_log": [], "custom_permissions": [], "progress_percentage": 0}', '{"id": "902c1610-39ac-4468-873c-347c0596bf04", "status": "in_progress", "book_id": "9a5909bb-e759-44ab-b8d0-7143482f66e8", "user_id": "2474659f-003e-4faa-8c53-9969c33f20b2", "created_at": "2025-07-31T08:10:54.519+00:00", "start_date": "2025-07-31T08:11:08.452+00:00", "updated_at": "2025-07-31T08:11:08.452+00:00", "finish_date": null, "allow_friends": false, "privacy_level": "private", "allow_followers": false, "privacy_audit_log": [], "custom_permissions": [], "progress_percentage": 0}', '2474659f-003e-4faa-8c53-9969c33f20b2', '2025-07-31 08:11:08.74281+00', '::1', 'postgrest', NULL, '4590', NULL, 'production');


--
-- Data for Name: enterprise_data_lineage; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."enterprise_data_lineage" ("id", "source_table", "source_column", "target_table", "target_column", "transformation_type", "transformation_logic", "data_flow_description", "created_at") VALUES
	('f4df0b66-1444-447e-9a7d-5a78e8ed1cea', 'books', 'id', 'book_popularity_metrics', 'book_id', 'AGGREGATED', 'COUNT of views, reviews, reading progress', 'Book popularity calculated from user interactions', '2025-07-05 13:01:18.555196+00'),
	('8e73f3b2-3ecb-46c8-b3db-85583852f30f', 'user_activity_log', 'user_id', 'user_engagement_analytics', 'user_id', 'AGGREGATED', 'COUNT of activities, AVG response time', 'User engagement metrics from activity logs', '2025-07-05 13:01:18.555196+00'),
	('df8a6298-1494-4685-a6de-66c97d9606aa', 'reading_progress', 'book_id', 'book_popularity_metrics', 'reading_progress_count', 'AGGREGATED', 'COUNT of reading progress records', 'Reading progress count for popularity calculation', '2025-07-05 13:01:18.555196+00');


--
-- Data for Name: enterprise_data_quality_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."enterprise_data_quality_rules" ("id", "rule_name", "table_name", "column_name", "rule_type", "rule_definition", "severity", "is_active", "created_at", "updated_at") VALUES
	('c5122465-f28c-4cf2-9a0e-07f23e949609', 'books_title_not_null', 'books', 'title', 'NOT_NULL', '', 'CRITICAL', true, '2025-07-05 13:01:18.555196+00', '2025-07-05 13:01:18.555196+00'),
	('c4fae008-9b6a-4097-853c-cf978a0556dd', 'books_author_not_null', 'books', 'author', 'NOT_NULL', '', 'HIGH', true, '2025-07-05 13:01:18.555196+00', '2025-07-05 13:01:18.555196+00'),
	('e4f39406-2463-4498-b0fb-d3f536e5f011', 'books_isbn_unique', 'books', 'isbn13', 'UNIQUE', '', 'HIGH', true, '2025-07-05 13:01:18.555196+00', '2025-07-05 13:01:18.555196+00'),
	('b5898e57-e0e3-48f8-a89c-cf9bc109ccc2', 'books_publication_date_valid', 'books', 'publication_date', 'CHECK', 'publication_date <= CURRENT_DATE', 'MEDIUM', true, '2025-07-05 13:01:18.555196+00', '2025-07-05 13:01:18.555196+00'),
	('8977b9f4-5adf-45e2-97a1-9904e2ffd3e1', 'users_email_not_null', 'users', 'email', 'NOT_NULL', '', 'CRITICAL', true, '2025-07-05 13:01:18.555196+00', '2025-07-05 13:01:18.555196+00'),
	('1e765bf0-b4da-4fae-8564-0e231eaea9c6', 'users_email_unique', 'users', 'email', 'UNIQUE', '', 'CRITICAL', true, '2025-07-05 13:01:18.555196+00', '2025-07-05 13:01:18.555196+00'),
	('9f68c366-7231-430a-9009-9d71891561e0', 'reading_progress_user_exists', 'reading_progress', 'user_id', 'FOREIGN_KEY', 'auth.users:id', 'HIGH', true, '2025-07-05 13:01:18.555196+00', '2025-07-05 13:01:18.555196+00'),
	('b4e1e87c-ea73-4037-89c4-503e3a940cef', 'reading_progress_book_exists', 'reading_progress', 'book_id', 'FOREIGN_KEY', 'books:id', 'HIGH', true, '2025-07-05 13:01:18.555196+00', '2025-07-05 13:01:18.555196+00'),
	('d96f5bf6-9da2-465d-967c-dd7ce4d592ed', 'reading_progress_percentage_valid', 'reading_progress', 'percentage_read', 'CHECK', 'percentage_read >= 0 AND percentage_read <= 100', 'MEDIUM', true, '2025-07-05 13:01:18.555196+00', '2025-07-05 13:01:18.555196+00'),
	('f9c6958b-00e7-47ad-849b-62344be78c76', 'authors_name_not_null', 'authors', 'name', 'NOT_NULL', '', 'CRITICAL', true, '2025-07-05 13:01:18.555196+00', '2025-07-05 13:01:18.555196+00'),
	('26a5cdbf-7f73-42b0-9c23-ca3b2feac6b7', 'authors_name_unique', 'authors', 'name', 'UNIQUE', '', 'MEDIUM', true, '2025-07-05 13:01:18.555196+00', '2025-07-05 13:01:18.555196+00'),
	('30fd0fb0-1c20-44d1-82f1-316b088f9643', 'publishers_name_not_null', 'publishers', 'name', 'NOT_NULL', '', 'CRITICAL', true, '2025-07-05 13:01:18.555196+00', '2025-07-05 13:01:18.555196+00'),
	('82f03d08-8557-4368-a70f-d6f8021d3cfa', 'publishers_name_unique', 'publishers', 'name', 'UNIQUE', '', 'MEDIUM', true, '2025-07-05 13:01:18.555196+00', '2025-07-05 13:01:18.555196+00');


--
-- Data for Name: enterprise_data_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: entity_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_analytics; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_approvals; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_books; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_calendar_exports; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_chat_rooms; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_creator_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_financials; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_interests; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_livestreams; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_locations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_media; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_permission_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_registrations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_reminders; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_shares; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_speakers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_sponsors; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_staff; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_surveys; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_types; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_views; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_waitlists; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: feed_entry_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: follow_target_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."follow_target_types" ("id", "name", "description", "created_at", "updated_at") VALUES
	('389d8704-9327-478c-9912-8c5c336c24dd', 'user', 'Follow other users', '2025-07-04 05:04:50.962248+00', '2025-07-04 05:04:50.962248+00'),
	('0aaba682-9714-44cc-b0b3-5d9a345ea4a1', 'book', 'Follow books', '2025-07-04 05:04:50.962248+00', '2025-07-04 05:04:50.962248+00'),
	('eeae2daf-f0f4-43ea-8de4-a188a7d0d125', 'author', 'Follow authors', '2025-07-04 05:04:50.962248+00', '2025-07-04 05:04:50.962248+00'),
	('8f111c23-7506-48e4-94fa-8351dc386148', 'publisher', 'Follow publishers', '2025-07-04 05:04:50.962248+00', '2025-07-04 05:04:50.962248+00'),
	('20f6e51a-d697-48d2-a5b1-817b7cfb6230', 'group', 'Follow groups', '2025-07-04 05:04:50.962248+00', '2025-07-04 05:04:50.962248+00');


--
-- Data for Name: follows; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."follows" ("id", "follower_id", "following_id", "created_at", "updated_at", "target_type_id_uuid_temp", "target_type_id") VALUES
	('ed28531e-969a-45cf-9e87-536897ea40ef', 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'ad76092d-b5b1-4045-af9f-5fae7b4aef6b', '2025-07-07 06:21:48.088536+00', '2025-07-07 06:21:48.088536+00', NULL, '8f111c23-7506-48e4-94fa-8351dc386148'),
	('ab949719-9572-418d-bc9c-881aae3402f2', 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', '30751fff-3388-4cd2-b96c-38d467bb4785', '2025-07-07 07:27:59.989469+00', '2025-07-07 07:27:59.989469+00', NULL, '0aaba682-9714-44cc-b0b3-5d9a345ea4a1'),
	('cc958391-df00-42f4-8105-99875c732f1a', 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', '719afc5a-0063-4fa4-9d8d-f91e8bfacb47', '2025-07-07 07:35:40.908012+00', '2025-07-07 07:35:40.908012+00', NULL, '389d8704-9327-478c-9912-8c5c336c24dd'),
	('f700421a-257c-4413-a81b-39a8b42df5d8', 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'dedfeba8-312b-4c56-91a9-9bf0ffe7d0c6', '2025-07-07 07:36:10.818431+00', '2025-07-07 07:36:10.818431+00', NULL, '389d8704-9327-478c-9912-8c5c336c24dd'),
	('683200ae-9a90-4cee-94b3-956a9625077c', 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', '9953a3e0-4982-4ae5-8093-829c4320ef8d', '2025-07-07 08:54:35.546577+00', '2025-07-07 08:54:35.546577+00', NULL, 'eeae2daf-f0f4-43ea-8de4-a188a7d0d125'),
	('5ab3b533-8ecb-4298-951f-626d8c81378a', 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', '8e75e51f-701f-4f3a-83da-70f625876ca8', '2025-07-08 10:01:35.801776+00', '2025-07-08 10:01:35.801776+00', NULL, 'eeae2daf-f0f4-43ea-8de4-a188a7d0d125'),
	('863de0dc-93fc-401f-bb4b-74355811574d', 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', '9a5909bb-e759-44ab-b8d0-7143482f66e8', '2025-07-30 04:00:10.351772+00', '2025-07-30 04:00:10.351772+00', NULL, '0aaba682-9714-44cc-b0b3-5d9a345ea4a1'),
	('18a8d602-4b39-4d89-a086-4293578c3575', 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', '2474659f-003e-4faa-8c53-9969c33f20b2', '2025-07-30 19:10:34.591459+00', '2025-07-30 19:10:34.591459+00', NULL, '389d8704-9327-478c-9912-8c5c336c24dd'),
	('b483a43d-719b-478e-96ff-d80626f2526f', '2474659f-003e-4faa-8c53-9969c33f20b2', '9a5909bb-e759-44ab-b8d0-7143482f66e8', '2025-07-31 08:10:45.102149+00', '2025-07-31 08:10:45.102149+00', NULL, '0aaba682-9714-44cc-b0b3-5d9a345ea4a1'),
	('f3afa8a1-3011-4d25-b11c-b0f18ec14ab8', 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', '992d1918-3e5e-464c-99af-ad026a7bad17', '2025-07-31 08:23:56.763691+00', '2025-07-31 08:23:56.763691+00', NULL, '20f6e51a-d697-48d2-a5b1-817b7cfb6230'),
	('7792c9de-c35d-459a-8a83-ccdfea8ebead', 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'e31e061d-a4a8-4cc8-af18-754786ad5ee3', '2025-07-31 15:10:15.196618+00', '2025-07-31 15:10:15.196618+00', NULL, 'eeae2daf-f0f4-43ea-8de4-a188a7d0d125'),
	('ac9ec8e9-2ca0-4d9b-bdef-e7bef0957c67', '45f98998-ba1d-4439-b2ee-1d403fee0e7c', 'e31e061d-a4a8-4cc8-af18-754786ad5ee3', '2025-07-31 15:27:49.663065+00', '2025-07-31 15:27:49.663065+00', NULL, 'eeae2daf-f0f4-43ea-8de4-a188a7d0d125'),
	('77fe4be8-5dfd-4213-b14f-de6d610f1a62', '45f98998-ba1d-4439-b2ee-1d403fee0e7c', '235ce1e2-e5a5-4db9-9d2b-22093d960566', '2025-07-31 15:46:35.265276+00', '2025-07-31 15:46:35.265276+00', NULL, '0aaba682-9714-44cc-b0b3-5d9a345ea4a1'),
	('33cafd65-f2e9-4c46-a55d-726a399f64e4', '45f98998-ba1d-4439-b2ee-1d403fee0e7c', '492d0538-5ab2-43bc-bc7b-e538da900639', '2025-07-31 16:00:33.415627+00', '2025-07-31 16:00:33.415627+00', NULL, '0aaba682-9714-44cc-b0b3-5d9a345ea4a1'),
	('80407135-e469-4e23-a894-730e5d8e7d33', '8dd18808-4777-4877-bde1-b54b1d3ffa81', '9a5909bb-e759-44ab-b8d0-7143482f66e8', '2025-07-31 19:41:30.771242+00', '2025-07-31 19:41:30.771242+00', NULL, '0aaba682-9714-44cc-b0b3-5d9a345ea4a1'),
	('98c80e0a-fe27-45dd-91dc-baabc73ba9aa', '8dd18808-4777-4877-bde1-b54b1d3ffa81', 'e31e061d-a4a8-4cc8-af18-754786ad5ee3', '2025-08-01 04:06:11.36202+00', '2025-08-01 04:06:11.36202+00', NULL, 'eeae2daf-f0f4-43ea-8de4-a188a7d0d125'),
	('0520db6f-cf10-49df-93be-670ad43547da', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', '9a5909bb-e759-44ab-b8d0-7143482f66e8', '2025-08-01 04:12:03.002827+00', '2025-08-01 04:12:03.002827+00', NULL, '0aaba682-9714-44cc-b0b3-5d9a345ea4a1'),
	('827d0f7a-c590-4080-af56-9d57cb360162', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', 'e31e061d-a4a8-4cc8-af18-754786ad5ee3', '2025-08-01 04:12:13.985213+00', '2025-08-01 04:12:13.985213+00', NULL, 'eeae2daf-f0f4-43ea-8de4-a188a7d0d125'),
	('cab8c439-5654-46d6-89ad-f9928c44a74d', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', '729c198c-4e2f-4e67-8591-ee4f6bd74385', '2025-08-01 04:35:32.611063+00', '2025-08-01 04:35:32.611063+00', NULL, '8f111c23-7506-48e4-94fa-8351dc386148'),
	('7db1d40f-fc30-4558-a210-1e0283a68c29', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', '492d0538-5ab2-43bc-bc7b-e538da900639', '2025-08-01 04:35:52.901777+00', '2025-08-01 04:35:52.901777+00', NULL, '0aaba682-9714-44cc-b0b3-5d9a345ea4a1'),
	('00633fdd-6038-43b2-802f-396c7e6c99e1', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', '235ce1e2-e5a5-4db9-9d2b-22093d960566', '2025-08-01 04:38:31.148582+00', '2025-08-01 04:38:31.148582+00', NULL, '0aaba682-9714-44cc-b0b3-5d9a345ea4a1'),
	('7e3adab9-781f-4553-91d4-18f60efa88b6', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', '992d1918-3e5e-464c-99af-ad026a7bad17', '2025-08-01 04:40:31.159759+00', '2025-08-01 04:40:31.159759+00', NULL, '20f6e51a-d697-48d2-a5b1-817b7cfb6230'),
	('f3093bae-757e-40e6-875f-f796c2efe697', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', '2025-08-02 00:43:21.558672+00', '2025-08-02 00:43:21.558672+00', NULL, '389d8704-9327-478c-9912-8c5c336c24dd'),
	('62177068-781e-4e1c-be91-e7fc4ec99ffa', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', 'dedfeba8-312b-4c56-91a9-9bf0ffe7d0c6', '2025-08-02 04:06:14.003349+00', '2025-08-02 04:06:14.003349+00', NULL, '389d8704-9327-478c-9912-8c5c336c24dd'),
	('cb991d41-7558-4f79-ad52-94061bbc3a60', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', '2474659f-003e-4faa-8c53-9969c33f20b2', '2025-08-02 04:06:29.643123+00', '2025-08-02 04:06:29.643123+00', NULL, '389d8704-9327-478c-9912-8c5c336c24dd'),
	('359923de-bae3-4eff-8476-2ea5185bbb24', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', 'b529a24a-4840-4771-919c-baf2142f91a2', '2025-08-02 04:06:49.33617+00', '2025-08-02 04:06:49.33617+00', NULL, '389d8704-9327-478c-9912-8c5c336c24dd'),
	('62a4c605-cdf6-4103-a304-b3ae98c9ecf4', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', '45f98998-ba1d-4439-b2ee-1d403fee0e7c', '2025-08-02 04:07:17.933513+00', '2025-08-02 04:07:17.933513+00', NULL, '389d8704-9327-478c-9912-8c5c336c24dd');


--
-- Data for Name: friends; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."friends" ("id", "user_id", "friend_id", "status", "requested_at", "responded_at", "requested_by", "created_at", "updated_at") VALUES
	('0c51e5fe-d630-4fee-88fb-aaf9276ea8e0', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'pending', '2025-08-02 03:31:37.906+00', NULL, 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', '2025-08-02 03:31:37.479042+00', '2025-08-02 03:31:37.479042+00'),
	('0dbbb2cd-7113-4c40-9f79-1f10df1bc0d0', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', '719afc5a-0063-4fa4-9d8d-f91e8bfacb47', 'pending', '2025-08-02 03:32:44.51+00', NULL, 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', '2025-08-02 03:32:44.14876+00', '2025-08-02 03:32:44.14876+00'),
	('d1468910-ed56-43dc-ae7a-a56a8ad33629', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', 'dedfeba8-312b-4c56-91a9-9bf0ffe7d0c6', 'pending', '2025-08-02 04:06:17.39+00', NULL, 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', '2025-08-02 04:06:17.060898+00', '2025-08-02 04:06:17.060898+00'),
	('4e3e9bff-7046-4873-af72-566e70df97e8', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', '2474659f-003e-4faa-8c53-9969c33f20b2', 'pending', '2025-08-02 04:06:37.109+00', NULL, 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', '2025-08-02 04:06:36.756687+00', '2025-08-02 04:06:36.756687+00'),
	('50846d79-b482-4b1a-9f88-10e76d378b68', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', 'b529a24a-4840-4771-919c-baf2142f91a2', 'pending', '2025-08-02 04:06:52.298+00', NULL, 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', '2025-08-02 04:06:51.931897+00', '2025-08-02 04:06:51.931897+00'),
	('30deba15-ca34-4d2d-adff-ecbc466c9ca8', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', '45f98998-ba1d-4439-b2ee-1d403fee0e7c', 'pending', '2025-08-02 04:07:15.153+00', NULL, 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', '2025-08-02 04:07:14.794095+00', '2025-08-02 04:07:14.794095+00');


--
-- Data for Name: group_achievements; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_analytics; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_author_events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_book_list_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_book_lists; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_book_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_book_swaps; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_book_wishlist_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_book_wishlists; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_books; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_bots; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_chat_channels; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_chat_message_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_chat_message_reactions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_content_moderation_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_custom_fields; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_discussion_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_event_feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_integrations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_invites; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_leaderboards; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_member_achievements; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_member_devices; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_member_streaks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_members; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_membership_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_moderation_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_onboarding_checklists; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_onboarding_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_onboarding_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_poll_votes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_polls; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_reading_challenge_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_reading_challenges; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_reading_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_reading_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_shared_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_types; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_webhook_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_webhooks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_welcome_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: id_mappings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: image_processing_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: image_tag_mappings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: image_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: likes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: list_followers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: media_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: mentions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ml_models; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ml_predictions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ml_training_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: moderation_queue; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: nlp_analysis; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: payment_methods; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: payment_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: performance_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: personalized_recommendations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: photo_album; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: photo_analytics; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: photo_bookmarks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: photo_community; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: photo_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: photo_monetization; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: photo_shares; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: photo_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: prices; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: privacy_audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "user_id", "bio", "created_at", "updated_at", "role") VALUES
	('e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'Test user bio for Alice Anderson', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'super-admin'),
	('2474659f-003e-4faa-8c53-9969c33f20b2', '2474659f-003e-4faa-8c53-9969c33f20b2', 'Test user bio for Bob Brown', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'admin'),
	('45f98998-ba1d-4439-b2ee-1d403fee0e7c', '45f98998-ba1d-4439-b2ee-1d403fee0e7c', 'Test user bio for Charlie Clark', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('c5b68ab4-e8bc-4291-a646-7f8ab4b99528', 'c5b68ab4-e8bc-4291-a646-7f8ab4b99528', 'Test user bio for Diana Davis', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('355dd8d6-7ef5-46cf-9bad-67fd863cbc88', '355dd8d6-7ef5-46cf-9bad-67fd863cbc88', 'Test user bio for Eve Evans', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('62be2226-e3d4-4b10-951d-13c3972145b1', '62be2226-e3d4-4b10-951d-13c3972145b1', 'Test user bio for Frank Fisher', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('8dd18808-4777-4877-bde1-b54b1d3ffa81', '8dd18808-4777-4877-bde1-b54b1d3ffa81', 'Test user bio for Grace Garcia', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('0d1f32d3-18b4-4aa8-b858-141b139aacd8', '0d1f32d3-18b4-4aa8-b858-141b139aacd8', 'Test user bio for Henry Harris', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('e8f2a30e-de7f-40a4-9772-06fca7419908', 'e8f2a30e-de7f-40a4-9772-06fca7419908', 'Test user bio for Ivy Ivanov', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('b3bd5d6b-e22a-4d61-a4a7-eee77a7063ce', 'b3bd5d6b-e22a-4d61-a4a7-eee77a7063ce', 'Test user bio for Jack Johnson', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('04d0c415-9de4-43dc-99fd-bcc8f980cefc', '04d0c415-9de4-43dc-99fd-bcc8f980cefc', 'Test user bio for Kate King', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('da99da90-51c9-46b6-9b1a-5b28603a2aa7', 'da99da90-51c9-46b6-9b1a-5b28603a2aa7', 'Test user bio for Liam Lee', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('fdcbe6e9-108d-4939-b10f-77b422731a18', 'fdcbe6e9-108d-4939-b10f-77b422731a18', 'Test user bio for Maya Miller', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('deca955d-e8c5-4c28-b190-f3ab7b382748', 'deca955d-e8c5-4c28-b190-f3ab7b382748', 'Test user bio for Noah Nelson', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('97f1407e-dcab-4143-a59e-873634654503', '97f1407e-dcab-4143-a59e-873634654503', 'Test user bio for Olivia O''Connor', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('05b4dc59-ae8e-47a1-8409-936b159c2c22', '05b4dc59-ae8e-47a1-8409-936b159c2c22', 'Test user bio for Paul Parker', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('6bea7109-b400-4124-839e-3fe6466f3ae8', '6bea7109-b400-4124-839e-3fe6466f3ae8', 'Test user bio for Quinn Quinn', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('5969c24a-1dd6-47ec-9e19-e22a0d5ebf40', '5969c24a-1dd6-47ec-9e19-e22a0d5ebf40', 'Test user bio for Ruby Roberts', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('4ca9b634-8557-427f-9b7f-1d8679b7f332', '4ca9b634-8557-427f-9b7f-1d8679b7f332', 'Test user bio for Sam Smith', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('2f4e5e3b-9aa3-45cf-9edf-86815d76f735', '2f4e5e3b-9aa3-45cf-9edf-86815d76f735', 'Test user bio for Tara Taylor', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('78b8de0c-9469-4b38-96bb-c97bbf3d8607', '78b8de0c-9469-4b38-96bb-c97bbf3d8607', 'Test user bio for Uma Upton', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('e81a2715-e3dd-4133-ad2a-e400a74e24ad', 'e81a2715-e3dd-4133-ad2a-e400a74e24ad', 'Test user bio for Victor Vargas', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('c954586e-f506-48b3-ba5d-c6b0d3d561c8', 'c954586e-f506-48b3-ba5d-c6b0d3d561c8', 'Test user bio for Wendy Wilson', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('fcc9099b-5297-418b-b164-adf93af0e0fa', 'fcc9099b-5297-418b-b164-adf93af0e0fa', 'Test user bio for Xander Xavier', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('eb6c0fb9-6baf-4a90-870d-06d87849efa5', 'eb6c0fb9-6baf-4a90-870d-06d87849efa5', 'Test user bio for Yara Young', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('a213628a-3e5a-4471-8b72-001ae4683c31', 'a213628a-3e5a-4471-8b72-001ae4683c31', 'Test user bio for Zoe Zimmerman', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('719afc5a-0063-4fa4-9d8d-f91e8bfacb47', '719afc5a-0063-4fa4-9d8d-f91e8bfacb47', 'Test user bio for Alex Adams', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('dedfeba8-312b-4c56-91a9-9bf0ffe7d0c6', 'dedfeba8-312b-4c56-91a9-9bf0ffe7d0c6', 'Test user bio for Blake Baker', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('b529a24a-4840-4771-919c-baf2142f91a2', 'b529a24a-4840-4771-919c-baf2142f91a2', 'Test user bio for Casey Cooper', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user'),
	('b474d5f5-cbf2-49af-8d03-2ca4aea11081', 'b474d5f5-cbf2-49af-8d03-2ca4aea11081', 'Test user bio for Drew Dixon', '2025-07-03 09:08:57.268783+00', '2025-07-03 09:08:57.268783+00', 'user');


--
-- Data for Name: promo_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: reactions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: reading_challenges; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: reading_goals; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: reading_list_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: reading_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."reading_progress" ("id", "user_id", "status", "progress_percentage", "start_date", "finish_date", "created_at", "updated_at", "book_id", "privacy_level", "allow_friends", "allow_followers", "custom_permissions", "privacy_audit_log") VALUES
	('27abd201-3f8e-4bc4-a76a-253eec68ab9d', 'e06cdf85-b449-4dcb-b943-068aaad8cfa3', 'completed', 0, '2025-07-29 00:59:38.297+00', '2025-07-31 08:10:13.425+00', '2025-07-14 00:00:00.636+00', '2025-07-31 08:10:13.425+00', '9a5909bb-e759-44ab-b8d0-7143482f66e8', 'private', false, false, '[]', '[]'),
	('902c1610-39ac-4468-873c-347c0596bf04', '2474659f-003e-4faa-8c53-9969c33f20b2', 'in_progress', 0, '2025-07-31 08:11:08.452+00', NULL, '2025-07-31 08:10:54.519+00', '2025-07-31 08:11:08.452+00', '9a5909bb-e759-44ab-b8d0-7143482f66e8', 'private', false, false, '[]', '[]');


--
-- Data for Name: reading_series; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: reading_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: reading_stats_daily; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: reading_streaks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: review_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: series_events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: session_registrations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: shares; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: similar_books; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: smart_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: social_audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."social_audit_log" ("id", "user_id", "action_type", "entity_type", "entity_id", "target_id", "action_details", "ip_address", "user_agent", "session_id", "created_at") VALUES
	('ab80f06f-d1f4-4329-a59d-acaa7580f994', '2474659f-003e-4faa-8c53-9969c33f20b2', 'comment_added', 'photo', '44c520f7-43af-4abb-acf6-e00f50b74f3b', '2a8e1652-2843-4f5c-86e2-dfc545f5c939', '{"content": "Thisisatest"}', NULL, NULL, NULL, '2025-07-31 05:31:25.660668+00');


--
-- Data for Name: survey_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: survey_responses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sync_state; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: system_health_checks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ticket_benefits; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ticket_types; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_activity_log; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_book_interactions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_friends; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_privacy_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_reading_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id") VALUES
	('bookcovers', 'bookcovers', NULL, '2025-03-21 06:56:50.477159+00', '2025-03-21 06:56:50.477159+00', false, false, NULL, NULL, NULL),
	('groups', 'groups', NULL, '2025-05-18 19:00:26.425441+00', '2025-05-18 19:00:26.425441+00', true, false, NULL, NULL, NULL);


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata") VALUES
	('22ed795d-e6d5-41b7-93f4-9935fd201e8b', 'bookcovers', 'authorsinfo/bookcovers/.emptyFolderPlaceholder', NULL, '2025-03-21 07:10:50.709839+00', '2025-03-21 07:10:50.709839+00', '2025-03-21 07:10:50.709839+00', '{"eTag": "\"d41d8cd98f00b204e9800998ecf8427e\"", "size": 0, "mimetype": "application/octet-stream", "cacheControl": "max-age=3600", "lastModified": "2025-03-21T07:10:51.000Z", "contentLength": 0, "httpStatusCode": 200}', 'caa858ad-794a-4e5e-b780-b81aaa0b26af', NULL, '{}');


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 468, true);


--
-- PostgreSQL database dump complete
--

RESET ALL;
