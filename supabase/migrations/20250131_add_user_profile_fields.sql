-- Add location and website columns to users table
ALTER TABLE "public"."users" 
ADD COLUMN IF NOT EXISTS "location" character varying(255),
ADD COLUMN IF NOT EXISTS "website" character varying(255),
ADD COLUMN IF NOT EXISTS "permalink" character varying(255);

-- Add comments for the new columns
COMMENT ON COLUMN "public"."users"."location" IS 'User location/city';
COMMENT ON COLUMN "public"."users"."website" IS 'User website URL';
COMMENT ON COLUMN "public"."users"."permalink" IS 'User permalink for profile URLs';

-- Create index on permalink for faster lookups
CREATE INDEX IF NOT EXISTS "users_permalink_idx" ON "public"."users" ("permalink"); 