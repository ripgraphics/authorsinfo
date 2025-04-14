-- Add cover_image_id column to authors table with the correct integer type
ALTER TABLE "public"."authors" 
ADD COLUMN "cover_image_id" INTEGER REFERENCES "public"."images"("id");

-- Add a new image type for author covers if it doesn't exist
INSERT INTO "public"."image_types" ("id", "name", "description")
SELECT '26', 'author_cover', 'Cover image for author pages'
WHERE NOT EXISTS (
    SELECT 1 FROM "public"."image_types" WHERE "id" = '26'
);
