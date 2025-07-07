-- Basic schema backup
-- This is a fallback schema file
-- Your actual schema will be in the main backup

-- Reading progress table
CREATE TABLE IF NOT EXISTS "public"."reading_progress" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "book_id" uuid NOT NULL,
    "status" text,
    "percentage" integer,
    "start_date" timestamp with time zone,
    "finish_date" timestamp with time zone,
    "privacy_level" text DEFAULT 'private',
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Books table
CREATE TABLE IF NOT EXISTS "public"."books" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "title" text NOT NULL,
    "author" text,
    "isbn10" text,
    "isbn13" text,
    "publisher_id" uuid,
    "created_at" timestamp with time zone DEFAULT now()
);

-- Authors table
CREATE TABLE IF NOT EXISTS "public"."authors" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now()
);

-- Publishers table
CREATE TABLE IF NOT EXISTS "public"."publishers" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now()
);
