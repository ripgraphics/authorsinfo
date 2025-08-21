

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


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


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
    "entity_id" "uuid",
    "view_count" integer DEFAULT 0,
    "like_count" integer DEFAULT 0,
    "share_count" integer DEFAULT 0,
    "revenue_generated" numeric(10,2) DEFAULT 0,
    "ai_tags" "text"[] DEFAULT '{}'::"text"[],
    "community_engagement" numeric(3,2) DEFAULT 0,
    "caption" "text",
    "comment_count" integer DEFAULT 0,
    "last_viewed_at" timestamp with time zone,
    "performance_score" numeric(5,2) DEFAULT 0.0
);


ALTER TABLE "public"."album_images" OWNER TO "postgres";


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
    "entity_type_id" "uuid",
    "description" "text",
    "tags" "text"[],
    "location" "jsonb",
    "camera_info" "jsonb",
    "edit_history" "jsonb"[],
    "quality_score" numeric(3,2) DEFAULT 0.0,
    "content_rating" character varying(20) DEFAULT 'safe'::character varying,
    "upload_source" character varying(100),
    "ip_address" "inet",
    "user_agent" "text",
    "download_count" integer DEFAULT 0,
    "view_count" integer DEFAULT 0,
    "like_count" integer DEFAULT 0,
    "comment_count" integer DEFAULT 0,
    "share_count" integer DEFAULT 0,
    "revenue_generated" numeric(10,2) DEFAULT 0.00,
    "is_monetized" boolean DEFAULT false,
    "is_featured" boolean DEFAULT false,
    "is_nsfw" boolean DEFAULT false,
    "is_ai_generated" boolean DEFAULT false,
    "copyright_status" character varying(50) DEFAULT 'original'::character varying,
    "license_type" character varying(100),
    "watermark_applied" boolean DEFAULT false,
    "uploader_id" "uuid",
    "uploader_type" "text" DEFAULT 'user'::"text"
);


ALTER TABLE "public"."images" OWNER TO "postgres";


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
    "monetization_enabled" boolean DEFAULT false,
    "premium_content" boolean DEFAULT false,
    "community_features" boolean DEFAULT false,
    "ai_enhanced" boolean DEFAULT false,
    "analytics_enabled" boolean DEFAULT false,
    "revenue_generated" numeric(10,2) DEFAULT 0,
    "total_subscribers" integer DEFAULT 0,
    "community_score" numeric(3,2) DEFAULT 0,
    "entity_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "entity_consistency" CHECK (((("entity_type" IS NULL) AND ("entity_id" IS NULL)) OR (("entity_type" IS NOT NULL) AND ("entity_id" IS NOT NULL)))),
    CONSTRAINT "valid_counts" CHECK ((("view_count" >= 0) AND ("like_count" >= 0) AND ("share_count" >= 0))),
    CONSTRAINT "valid_entity_type" CHECK ((("entity_type" IS NULL) OR (("entity_type")::"text" = ANY (ARRAY['user'::"text", 'publisher'::"text", 'author'::"text", 'group'::"text", 'book'::"text", 'event'::"text", 'content'::"text", 'album'::"text", 'series'::"text", 'collection'::"text", 'user_posts'::"text", 'group_posts'::"text", 'publisher_posts'::"text", 'event_posts'::"text", 'book_posts'::"text", 'author_posts'::"text"])))),
    CONSTRAINT "valid_timestamps" CHECK (("updated_at" >= "created_at"))
);


ALTER TABLE "public"."photo_albums" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "media_files" "jsonb" DEFAULT '[]'::"jsonb",
    "visibility" "text" DEFAULT 'public'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


ALTER TABLE ONLY "public"."album_images"
    ADD CONSTRAINT "album_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photo_albums"
    ADD CONSTRAINT "photo_albums_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_album_images_album_id" ON "public"."album_images" USING "btree" ("album_id");



CREATE INDEX "idx_album_images_image_id" ON "public"."album_images" USING "btree" ("image_id");



CREATE INDEX "idx_images_uploader_id" ON "public"."images" USING "btree" ("uploader_id");



CREATE INDEX "idx_photo_albums_entity_type_entity_id" ON "public"."photo_albums" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_photo_albums_owner_id" ON "public"."photo_albums" USING "btree" ("owner_id");



ALTER TABLE ONLY "public"."album_images"
    ADD CONSTRAINT "album_images_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."photo_albums"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."album_images"
    ADD CONSTRAINT "album_images_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;



CREATE POLICY "Users can manage album images" ON "public"."album_images" USING (("album_id" IN ( SELECT "photo_albums"."id"
   FROM "public"."photo_albums"
  WHERE ("photo_albums"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage their own images" ON "public"."images" USING (("uploader_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own photo albums" ON "public"."photo_albums" USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own posts" ON "public"."posts" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view album images" ON "public"."album_images" FOR SELECT USING (true);



CREATE POLICY "Users can view public images" ON "public"."images" FOR SELECT USING (true);



CREATE POLICY "Users can view public photo albums" ON "public"."photo_albums" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Users can view public posts" ON "public"."posts" FOR SELECT USING (("visibility" = 'public'::"text"));



ALTER TABLE "public"."album_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photo_albums" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON TABLE "public"."album_images" TO "anon";
GRANT ALL ON TABLE "public"."album_images" TO "authenticated";
GRANT ALL ON TABLE "public"."album_images" TO "service_role";



GRANT ALL ON TABLE "public"."images" TO "anon";
GRANT ALL ON TABLE "public"."images" TO "authenticated";
GRANT ALL ON TABLE "public"."images" TO "service_role";



GRANT ALL ON TABLE "public"."photo_albums" TO "anon";
GRANT ALL ON TABLE "public"."photo_albums" TO "authenticated";
GRANT ALL ON TABLE "public"."photo_albums" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
