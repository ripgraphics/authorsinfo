-- ADD REACTION TYPE COLUMN TO ENGAGEMENT_LIKES TABLE
-- This migration adds support for Facebook-style reactions (Like, Love, Care, Haha, Wow, Sad, Angry)

-- Step 1: Add reaction_type column to engagement_likes table
ALTER TABLE "public"."engagement_likes" 
ADD COLUMN IF NOT EXISTS "reaction_type" "text" DEFAULT 'like' NOT NULL;

-- Step 2: Add constraint to ensure only valid reaction types are allowed
ALTER TABLE "public"."engagement_likes" 
ADD CONSTRAINT IF NOT EXISTS "engagement_likes_reaction_type_check" 
CHECK ("reaction_type" IN ('like', 'love', 'care', 'haha', 'wow', 'sad', 'angry'));

-- Step 3: Update existing records to have 'like' as default reaction type
UPDATE "public"."engagement_likes" 
SET "reaction_type" = 'like' 
WHERE "reaction_type" IS NULL;

-- Step 4: Create index on reaction_type for better performance
CREATE INDEX IF NOT EXISTS "idx_engagement_likes_reaction_type" 
ON "public"."engagement_likes" ("reaction_type");

-- Step 5: Add comment explaining the new column
COMMENT ON COLUMN "public"."engagement_likes"."reaction_type" IS 'Type of reaction: like, love, care, haha, wow, sad, angry';

-- Step 6: Update the unique constraint to allow multiple reactions per user per entity
-- (User can have different reaction types for the same entity)
DROP INDEX IF EXISTS "engagement_likes_user_entity_unique";
CREATE UNIQUE INDEX "engagement_likes_user_entity_reaction_unique" 
ON "public"."engagement_likes" ("user_id", "entity_type", "entity_id", "reaction_type");

-- Step 7: Verify the changes
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'engagement_likes' 
AND column_name = 'reaction_type';

-- Step 8: Show sample data structure
SELECT 
    id,
    user_id,
    entity_type,
    entity_id,
    reaction_type,
    created_at
FROM "public"."engagement_likes" 
LIMIT 5;
