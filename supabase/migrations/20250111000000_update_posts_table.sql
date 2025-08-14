-- Create entities table for tracking entity engagement
CREATE TABLE IF NOT EXISTS "public"."entities" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "type" text NOT NULL,
    "name" text,
    "description" text,
    "engagement_count" integer DEFAULT 0,
    "post_count" integer DEFAULT 0,
    "last_engagement" timestamp with time zone,
    "last_post" timestamp with time zone,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Add primary key to entities table
ALTER TABLE "public"."entities" 
ADD CONSTRAINT "entities_pkey" PRIMARY KEY ("id");

-- Create index on entities table
CREATE INDEX IF NOT EXISTS "entities_type_id_idx" ON "public"."entities" ("type", "id");

-- Create engagement_analytics table for tracking user engagement
CREATE TABLE IF NOT EXISTS "public"."engagement_analytics" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "action" text NOT NULL,
    "entity_id" uuid NOT NULL,
    "entity_type" text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now(),
    "metadata" jsonb DEFAULT '{}'::jsonb
);

-- Add primary key to engagement_analytics table
ALTER TABLE "public"."engagement_analytics" 
ADD CONSTRAINT "engagement_analytics_pkey" PRIMARY KEY ("id");

-- Create index on engagement_analytics table
CREATE INDEX IF NOT EXISTS "engagement_analytics_user_action_idx" ON "public"."engagement_analytics" ("user_id", "action");
CREATE INDEX IF NOT EXISTS "engagement_analytics_entity_idx" ON "public"."engagement_analytics" ("entity_type", "entity_id");

-- Add RLS policies for entities table
ALTER TABLE "public"."entities" ENABLE ROW LEVEL SECURITY;

-- Policy for users to read all entities
CREATE POLICY "Users can read entities" ON "public"."entities"
    FOR SELECT USING (true);

-- Policy for users to insert entities
CREATE POLICY "Users can insert entities" ON "public"."entities"
    FOR INSERT WITH CHECK (true);

-- Policy for users to update entities
CREATE POLICY "Users can update entities" ON "public"."entities"
    FOR UPDATE USING (true);

-- Add RLS policies for engagement_analytics table
ALTER TABLE "public"."engagement_analytics" ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own engagement analytics
CREATE POLICY "Users can read their own engagement analytics" ON "public"."engagement_analytics"
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own engagement analytics
CREATE POLICY "Users can insert their own engagement analytics" ON "public"."engagement_analytics"
    FOR INSERT WITH CHECK (auth.uid() = user_id); 