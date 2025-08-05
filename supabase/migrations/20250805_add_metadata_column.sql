-- Add metadata column to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation  
COMMENT ON COLUMN activities.metadata IS 'JSONB field containing engagement data, privacy settings, and monetization info';

-- Create index for metadata queries
CREATE INDEX IF NOT EXISTS idx_activities_metadata ON activities USING GIN (metadata);

-- Update existing activities to have default metadata
UPDATE activities SET metadata = '{}'::jsonb WHERE metadata IS NULL; 