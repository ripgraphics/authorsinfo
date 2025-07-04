-- Migration: Create Core Tables
-- This migration creates the fundamental tables for the application
-- Must run before any enhancement migrations

-- Create books table
CREATE TABLE IF NOT EXISTS "public"."books" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "title_long" TEXT,
    "isbn" TEXT UNIQUE,
    "isbn13" TEXT UNIQUE,
    "publisher" TEXT,
    "language" TEXT,
    "date_published" DATE,
    "edition" TEXT,
    "pages" INTEGER,
    "dimensions" TEXT,
    "overview" TEXT,
    "image" TEXT,
    "image_original" TEXT,
    "msrp" DECIMAL(10,2),
    "excerpt" TEXT,
    "synopsis" TEXT,
    "binding" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create authors table
CREATE TABLE IF NOT EXISTS "public"."authors" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "biography" TEXT,
    "birth_date" DATE,
    "death_date" DATE,
    "nationality" TEXT,
    "image" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create publishers table
CREATE TABLE IF NOT EXISTS "public"."publishers" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "website" TEXT,
    "founded_year" INTEGER,
    "location" TEXT,
    "image" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create book_author_connections table
CREATE TABLE IF NOT EXISTS "public"."book_author_connections" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "book_id" UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    "author_id" UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    "role" TEXT DEFAULT 'author', -- 'author', 'editor', 'translator', etc.
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(book_id, author_id, role)
);

-- Create book_publisher_connections table
CREATE TABLE IF NOT EXISTS "public"."book_publisher_connections" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "book_id" UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    "publisher_id" UUID NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(book_id, publisher_id)
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS "public"."subjects" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create book_subjects junction table
CREATE TABLE IF NOT EXISTS "public"."book_subjects" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "book_id" UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    "subject_id" UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(book_id, subject_id)
);

-- Indexes for subjects
CREATE INDEX IF NOT EXISTS idx_subjects_name ON subjects(name);
CREATE INDEX IF NOT EXISTS idx_book_subjects_book_id ON book_subjects(book_id);
CREATE INDEX IF NOT EXISTS idx_book_subjects_subject_id ON book_subjects(subject_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_isbn13 ON books(isbn13);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_authors_name ON authors(name);
CREATE INDEX IF NOT EXISTS idx_publishers_name ON publishers(name);
CREATE INDEX IF NOT EXISTS idx_book_author_connections_book_id ON book_author_connections(book_id);
CREATE INDEX IF NOT EXISTS idx_book_author_connections_author_id ON book_author_connections(author_id);
CREATE INDEX IF NOT EXISTS idx_book_publisher_connections_book_id ON book_publisher_connections(book_id);
CREATE INDEX IF NOT EXISTS idx_book_publisher_connections_publisher_id ON book_publisher_connections(publisher_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_books_updated_at 
    BEFORE UPDATE ON books 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_authors_updated_at 
    BEFORE UPDATE ON authors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_publishers_updated_at 
    BEFORE UPDATE ON publishers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at 
    BEFORE UPDATE ON subjects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_author_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_publisher_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_subjects ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Allow public read access to books" ON books FOR SELECT USING (true);
CREATE POLICY "Allow public read access to authors" ON authors FOR SELECT USING (true);
CREATE POLICY "Allow public read access to publishers" ON publishers FOR SELECT USING (true);
CREATE POLICY "Allow public read access to book_author_connections" ON book_author_connections FOR SELECT USING (true);
CREATE POLICY "Allow public read access to book_publisher_connections" ON book_publisher_connections FOR SELECT USING (true);
CREATE POLICY "Allow public read access to subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "Allow public read access to book_subjects" ON book_subjects FOR SELECT USING (true);

-- Allow authenticated users to insert/update
CREATE POLICY "Allow authenticated users to manage books" ON books FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage authors" ON authors FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage publishers" ON publishers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage book_author_connections" ON book_author_connections FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage book_publisher_connections" ON book_publisher_connections FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage subjects" ON subjects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage book_subjects" ON book_subjects FOR ALL USING (auth.role() = 'authenticated');

-- Create photo_albums table
CREATE TABLE IF NOT EXISTS "public"."photo_albums" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "privacy" TEXT DEFAULT 'public',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create photos table
CREATE TABLE IF NOT EXISTS "public"."photos" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "album_id" UUID REFERENCES photo_albums(id) ON DELETE SET NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "privacy" TEXT DEFAULT 'public',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create album_photos junction table
CREATE TABLE IF NOT EXISTS "public"."album_photos" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "album_id" UUID NOT NULL REFERENCES photo_albums(id) ON DELETE CASCADE,
    "photo_id" UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(album_id, photo_id)
);

-- Indexes for photo albums
CREATE INDEX IF NOT EXISTS idx_photo_albums_user_id ON photo_albums(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_album_id ON photos(album_id);
CREATE INDEX IF NOT EXISTS idx_album_photos_album_id ON album_photos(album_id);
CREATE INDEX IF NOT EXISTS idx_album_photos_photo_id ON album_photos(photo_id);

-- Triggers for updated_at
CREATE TRIGGER update_photo_albums_updated_at 
    BEFORE UPDATE ON photo_albums 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_photos_updated_at 
    BEFORE UPDATE ON photos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE photo_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allow public read access to photo_albums" ON photo_albums FOR SELECT USING (true);
CREATE POLICY "Allow public read access to photos" ON photos FOR SELECT USING (true);
CREATE POLICY "Allow public read access to album_photos" ON album_photos FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to manage photo_albums" ON photo_albums FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage photos" ON photos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage album_photos" ON album_photos FOR ALL USING (auth.role() = 'authenticated'); 