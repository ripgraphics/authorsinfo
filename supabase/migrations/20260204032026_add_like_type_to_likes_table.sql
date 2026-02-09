-- Add like_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'likes' AND column_name = 'like_type') THEN
        ALTER TABLE public.likes
        ADD COLUMN like_type VARCHAR(20) DEFAULT 'like';
    END IF;
END
$$;

-- Update existing rows to 'like' where like_type is NULL (if column was just added)
UPDATE public.likes
SET like_type = 'like'
WHERE like_type IS NULL;

-- Ensure like_type column is NOT NULL
ALTER TABLE public.likes
ALTER COLUMN like_type SET NOT NULL;

-- Drop the old UNIQUE constraint
ALTER TABLE public.likes
DROP CONSTRAINT IF EXISTS likes_user_id_entity_type_entity_id_key;

-- Add the new UNIQUE constraint including like_type
ALTER TABLE public.likes
ADD CONSTRAINT likes_user_id_entity_type_entity_id_like_type_key UNIQUE (user_id, entity_type, entity_id, like_type);

-- Add CHECK constraint for valid reaction types (optional but good practice)
ALTER TABLE public.likes
ADD CONSTRAINT likes_like_type_check CHECK (like_type IN ('like', 'love', 'care', 'haha', 'wow', 'sad', 'angry'));
