-- Add website, contact information, address fields, and image references to publishers table
ALTER TABLE "public"."publishers" 
ADD COLUMN IF NOT EXISTS "website" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "email" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "phone" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "address_line1" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "address_line2" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "city" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "state" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "postal_code" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "country" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "about" TEXT,
ADD COLUMN IF NOT EXISTS "cover_image_id" INTEGER REFERENCES "public"."images"("id"),
ADD COLUMN IF NOT EXISTS "publisher_image_id" INTEGER REFERENCES "public"."images"("id"),
ADD COLUMN IF NOT EXISTS "publisher_gallery_id" INTEGER REFERENCES "public"."images"("id"),
ADD COLUMN IF NOT EXISTS "founded_year" INTEGER;

-- Add comments to explain the fields
COMMENT ON COLUMN "public"."publishers"."website" IS 'Publisher''s official website URL';
COMMENT ON COLUMN "public"."publishers"."email" IS 'Publisher''s contact email address';
COMMENT ON COLUMN "public"."publishers"."phone" IS 'Publisher''s contact phone number';
COMMENT ON COLUMN "public"."publishers"."address_line1" IS 'First line of publisher''s physical address';
COMMENT ON COLUMN "public"."publishers"."address_line2" IS 'Second line of publisher''s physical address (optional)';
COMMENT ON COLUMN "public"."publishers"."city" IS 'City of publisher''s address';
COMMENT ON COLUMN "public"."publishers"."state" IS 'State/province of publisher''s address';
COMMENT ON COLUMN "public"."publishers"."postal_code" IS 'Postal/ZIP code of publisher''s address';
COMMENT ON COLUMN "public"."publishers"."country" IS 'Country of publisher''s address';
COMMENT ON COLUMN "public"."publishers"."about" IS 'Description or information about the publisher';
COMMENT ON COLUMN "public"."publishers"."cover_image_id" IS 'Reference to cover image in images table (type 25)';
COMMENT ON COLUMN "public"."publishers"."publisher_image_id" IS 'Reference to publisher logo/avatar in images table (type 27)';
COMMENT ON COLUMN "public"."publishers"."publisher_gallery_id" IS 'Reference to publisher gallery in images table (type 28)';
COMMENT ON COLUMN "public"."publishers"."founded_year" IS 'Year the publisher was founded';
