-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop only the new tables that don't have dependencies
DROP TABLE IF EXISTS album_analytics;
DROP TABLE IF EXISTS album_shares;
DROP TABLE IF EXISTS image_tag_mappings;
DROP TABLE IF EXISTS image_tags;
DROP TABLE IF EXISTS album_images;
DROP TABLE IF EXISTS photo_albums;

-- Create photo_albums table
CREATE TABLE IF NOT EXISTS photo_albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_id UUID,
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    is_public BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    album_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    entity_type VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT valid_album_type CHECK (album_type IN ('personal', 'event', 'book', 'author', 'publisher'))
);

-- Alter existing images table to add new columns if they don't exist
DO $$ 
BEGIN
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'thumbnail_url') THEN
        ALTER TABLE images ADD COLUMN thumbnail_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'medium_url') THEN
        ALTER TABLE images ADD COLUMN medium_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'large_url') THEN
        ALTER TABLE images ADD COLUMN large_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'original_filename') THEN
        ALTER TABLE images ADD COLUMN original_filename VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'file_size') THEN
        ALTER TABLE images ADD COLUMN file_size INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'width') THEN
        ALTER TABLE images ADD COLUMN width INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'height') THEN
        ALTER TABLE images ADD COLUMN height INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'format') THEN
        ALTER TABLE images ADD COLUMN format VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'mime_type') THEN
        ALTER TABLE images ADD COLUMN mime_type VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'alt_text') THEN
        ALTER TABLE images ADD COLUMN alt_text TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'caption') THEN
        ALTER TABLE images ADD COLUMN caption TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'metadata') THEN
        ALTER TABLE images ADD COLUMN metadata JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'storage_path') THEN
        ALTER TABLE images ADD COLUMN storage_path TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'storage_provider') THEN
        ALTER TABLE images ADD COLUMN storage_provider VARCHAR(50) DEFAULT 'supabase';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'is_processed') THEN
        ALTER TABLE images ADD COLUMN is_processed BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'processing_status') THEN
        ALTER TABLE images ADD COLUMN processing_status VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'deleted_at') THEN
        ALTER TABLE images ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create album_images table
CREATE TABLE IF NOT EXISTS album_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    album_id UUID NOT NULL REFERENCES photo_albums(id) ON DELETE CASCADE,
    image_id INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL,
    is_cover BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(album_id, image_id)
);

-- Create image_tags table
CREATE TABLE IF NOT EXISTS image_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create image_tag_mappings table
CREATE TABLE IF NOT EXISTS image_tag_mappings (
    image_id INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES image_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (image_id, tag_id)
);

-- Create album_shares table
CREATE TABLE IF NOT EXISTS album_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    album_id UUID NOT NULL REFERENCES photo_albums(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES auth.users(id),
    shared_with UUID REFERENCES auth.users(id),
    share_type VARCHAR(50) NOT NULL,
    access_token UUID,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_share_type CHECK (share_type IN ('public', 'private', 'link'))
);

-- Create album_analytics table
CREATE TABLE IF NOT EXISTS album_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    album_id UUID NOT NULL REFERENCES photo_albums(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(album_id, date)
);

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_photo_albums_owner;
DROP INDEX IF EXISTS idx_photo_albums_entity;
DROP INDEX IF EXISTS idx_photo_albums_type;
DROP INDEX IF EXISTS idx_photo_albums_public;
DROP INDEX IF EXISTS idx_photo_albums_deleted;
DROP INDEX IF EXISTS idx_images_storage;
DROP INDEX IF EXISTS idx_images_processed;
DROP INDEX IF EXISTS idx_images_deleted;
DROP INDEX IF EXISTS idx_album_images_order;
DROP INDEX IF EXISTS idx_album_images_cover;
DROP INDEX IF EXISTS idx_album_images_featured;
DROP INDEX IF EXISTS idx_image_tags_slug;
DROP INDEX IF EXISTS idx_album_shares_token;
DROP INDEX IF EXISTS idx_album_shares_expires;
DROP INDEX IF EXISTS idx_album_analytics_date;

-- Create indexes for better query performance
CREATE INDEX idx_photo_albums_owner ON photo_albums(owner_id);
CREATE INDEX idx_photo_albums_entity ON photo_albums(entity_id, entity_type);
CREATE INDEX idx_photo_albums_type ON photo_albums(album_type);
CREATE INDEX idx_photo_albums_public ON photo_albums(is_public) WHERE is_public = true;
CREATE INDEX idx_photo_albums_deleted ON photo_albums(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX idx_images_storage ON images(storage_path);
CREATE INDEX idx_images_processed ON images(is_processed);
CREATE INDEX idx_images_deleted ON images(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX idx_album_images_order ON album_images(album_id, display_order);
CREATE INDEX idx_album_images_cover ON album_images(album_id, is_cover) WHERE is_cover = true;
CREATE INDEX idx_album_images_featured ON album_images(album_id, is_featured) WHERE is_featured = true;

CREATE INDEX idx_image_tags_slug ON image_tags(slug);

CREATE INDEX idx_album_shares_token ON album_shares(access_token);
CREATE INDEX idx_album_shares_expires ON album_shares(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_album_analytics_date ON album_analytics(album_id, date);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public albums are viewable by everyone" ON photo_albums;
DROP POLICY IF EXISTS "Users can view their own albums" ON photo_albums;
DROP POLICY IF EXISTS "Users can create their own albums" ON photo_albums;
DROP POLICY IF EXISTS "Users can update their own albums" ON photo_albums;
DROP POLICY IF EXISTS "Users can delete their own albums" ON photo_albums;
DROP POLICY IF EXISTS "Images are viewable by album access" ON images;
DROP POLICY IF EXISTS "Users can upload images" ON images;
DROP POLICY IF EXISTS "Album images are viewable by album access" ON album_images;

-- Enable RLS
ALTER TABLE photo_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_tag_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public albums are viewable by everyone"
    ON photo_albums FOR SELECT
    USING (is_public = true AND deleted_at IS NULL);

CREATE POLICY "Users can view their own albums"
    ON photo_albums FOR SELECT
    USING (owner_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can create their own albums"
    ON photo_albums FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own albums"
    ON photo_albums FOR UPDATE
    USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own albums"
    ON photo_albums FOR DELETE
    USING (owner_id = auth.uid());

CREATE POLICY "Images are viewable by album access"
    ON images FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM album_images ai
            JOIN photo_albums pa ON ai.album_id = pa.id
            WHERE ai.image_id = images.id
            AND (
                pa.is_public = true
                OR pa.owner_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM album_shares
                    WHERE album_id = pa.id
                    AND (shared_with = auth.uid() OR share_type = 'public')
                )
            )
        )
        AND deleted_at IS NULL
    );

CREATE POLICY "Users can upload images"
    ON images FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Album images are viewable by album access"
    ON album_images FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM photo_albums
            WHERE id = album_images.album_id
            AND (
                is_public = true
                OR owner_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM album_shares
                    WHERE album_id = photo_albums.id
                    AND (shared_with = auth.uid() OR share_type = 'public')
                )
            )
        )
    );

-- Drop existing functions and triggers if they exist
DROP TRIGGER IF EXISTS set_album_updated_at ON photo_albums;
DROP TRIGGER IF EXISTS set_image_updated_at ON images;
DROP FUNCTION IF EXISTS update_album_updated_at();
DROP FUNCTION IF EXISTS update_image_updated_at();
DROP FUNCTION IF EXISTS increment_album_view_count(UUID);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION update_album_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_image_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_album_updated_at
    BEFORE UPDATE ON photo_albums
    FOR EACH ROW
    EXECUTE FUNCTION update_album_updated_at();

CREATE TRIGGER set_image_updated_at
    BEFORE UPDATE ON images
    FOR EACH ROW
    EXECUTE FUNCTION update_image_updated_at();

-- Create function to increment album view count
CREATE OR REPLACE FUNCTION increment_album_view_count(album_id UUID)
RETURNS void AS $$
BEGIN
    -- Update the album's view count
    UPDATE photo_albums
    SET view_count = view_count + 1
    WHERE id = album_id;

    -- Update or insert analytics
    INSERT INTO album_analytics (album_id, date, views, unique_views)
    VALUES (album_id, CURRENT_DATE, 1, 1)
    ON CONFLICT (album_id, date)
    DO UPDATE SET
        views = album_analytics.views + 1,
        unique_views = album_analytics.unique_views + 1;
END;
$$ LANGUAGE plpgsql; 