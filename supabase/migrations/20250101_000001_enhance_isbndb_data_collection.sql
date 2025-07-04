-- Migration: Enhance ISBNdb Data Collection
-- This migration adds comprehensive support for collecting all available ISBNdb data
-- Following best practices for scalability and future growth

-- 1. Add missing fields to books table
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS dewey_decimal TEXT[],
ADD COLUMN IF NOT EXISTS excerpt TEXT,
ADD COLUMN IF NOT EXISTS related_data JSONB,
ADD COLUMN IF NOT EXISTS other_isbns JSONB,
ADD COLUMN IF NOT EXISTS isbndb_last_updated TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS isbndb_data_version TEXT,
ADD COLUMN IF NOT EXISTS raw_isbndb_data JSONB;

-- 2. Create table for book reviews (from ISBNdb)
CREATE TABLE IF NOT EXISTS book_reviews_isbndb (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    review_text TEXT NOT NULL,
    review_source TEXT,
    review_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create table for book excerpts
CREATE TABLE IF NOT EXISTS book_excerpts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    excerpt_text TEXT NOT NULL,
    excerpt_type TEXT DEFAULT 'isbndb', -- 'isbndb', 'user_generated', etc.
    excerpt_source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create table for related books
CREATE TABLE IF NOT EXISTS book_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    related_book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL, -- 'similar', 'sequel', 'prequel', 'same_series', etc.
    relation_source TEXT DEFAULT 'isbndb',
    relation_score DECIMAL(3,2), -- 0.00 to 1.00
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(book_id, related_book_id, relation_type)
);

-- 5. Create table for other ISBNs (different editions/formats)
CREATE TABLE IF NOT EXISTS book_isbn_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    isbn TEXT NOT NULL,
    isbn_type TEXT NOT NULL, -- 'isbn10', 'isbn13'
    binding_type TEXT,
    format_type TEXT,
    edition_info TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(book_id, isbn)
);

-- 6. Create table for Dewey Decimal classifications
CREATE TABLE IF NOT EXISTS dewey_decimal_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    parent_code TEXT REFERENCES dewey_decimal_classifications(code),
    level INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create junction table for book-dewey decimal relationships
CREATE TABLE IF NOT EXISTS book_dewey_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    dewey_id UUID NOT NULL REFERENCES dewey_decimal_classifications(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(book_id, dewey_id)
);

-- 8. Create table for structured dimensions data
CREATE TABLE IF NOT EXISTS book_dimensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    length_value DECIMAL(10,2),
    length_unit TEXT,
    width_value DECIMAL(10,2),
    width_unit TEXT,
    height_value DECIMAL(10,2),
    height_unit TEXT,
    weight_value DECIMAL(10,2),
    weight_unit TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(book_id)
);

-- 9. Create table for ISBNdb data sync tracking
CREATE TABLE IF NOT EXISTS isbndb_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL, -- 'initial', 'update', 'refresh'
    sync_status TEXT NOT NULL, -- 'success', 'error', 'partial'
    records_processed INTEGER DEFAULT 0,
    records_added INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_skipped INTEGER DEFAULT 0,
    error_message TEXT,
    sync_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_books_isbndb_last_updated ON books(isbndb_last_updated);
CREATE INDEX IF NOT EXISTS idx_books_raw_isbndb_data ON books USING GIN(raw_isbndb_data);
CREATE INDEX IF NOT EXISTS idx_book_reviews_isbndb_book_id ON book_reviews_isbndb(book_id);
CREATE INDEX IF NOT EXISTS idx_book_excerpts_book_id ON book_excerpts(book_id);
CREATE INDEX IF NOT EXISTS idx_book_relations_book_id ON book_relations(book_id);
CREATE INDEX IF NOT EXISTS idx_book_relations_related_book_id ON book_relations(related_book_id);
CREATE INDEX IF NOT EXISTS idx_book_isbn_variants_book_id ON book_isbn_variants(book_id);
CREATE INDEX IF NOT EXISTS idx_book_isbn_variants_isbn ON book_isbn_variants(isbn);
CREATE INDEX IF NOT EXISTS idx_book_dewey_classifications_book_id ON book_dewey_classifications(book_id);
CREATE INDEX IF NOT EXISTS idx_book_dewey_classifications_dewey_id ON book_dewey_classifications(dewey_id);
CREATE INDEX IF NOT EXISTS idx_dewey_decimal_classifications_code ON dewey_decimal_classifications(code);
CREATE INDEX IF NOT EXISTS idx_dewey_decimal_classifications_parent_code ON dewey_decimal_classifications(parent_code);
CREATE INDEX IF NOT EXISTS idx_book_dimensions_book_id ON book_dimensions(book_id);
CREATE INDEX IF NOT EXISTS idx_isbndb_sync_log_book_id ON isbndb_sync_log(book_id);
CREATE INDEX IF NOT EXISTS idx_isbndb_sync_log_sync_status ON isbndb_sync_log(sync_status);
CREATE INDEX IF NOT EXISTS idx_isbndb_sync_log_sync_started_at ON isbndb_sync_log(sync_started_at);

-- 11. Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_books_title_fts ON books USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_books_title_long_fts ON books USING GIN(to_tsvector('english', title_long));
CREATE INDEX IF NOT EXISTS idx_books_overview_fts ON books USING GIN(to_tsvector('english', overview));
CREATE INDEX IF NOT EXISTS idx_books_synopsis_fts ON books USING GIN(to_tsvector('english', synopsis));
CREATE INDEX IF NOT EXISTS idx_book_excerpts_excerpt_text_fts ON book_excerpts USING GIN(to_tsvector('english', excerpt_text));

-- 12. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist, then recreate them
DROP TRIGGER IF EXISTS update_book_reviews_isbndb_updated_at ON book_reviews_isbndb;
CREATE TRIGGER update_book_reviews_isbndb_updated_at 
    BEFORE UPDATE ON book_reviews_isbndb 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_book_excerpts_updated_at ON book_excerpts;
CREATE TRIGGER update_book_excerpts_updated_at 
    BEFORE UPDATE ON book_excerpts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_book_relations_updated_at ON book_relations;
CREATE TRIGGER update_book_relations_updated_at 
    BEFORE UPDATE ON book_relations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_book_isbn_variants_updated_at ON book_isbn_variants;
CREATE TRIGGER update_book_isbn_variants_updated_at 
    BEFORE UPDATE ON book_isbn_variants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dewey_decimal_classifications_updated_at ON dewey_decimal_classifications;
CREATE TRIGGER update_dewey_decimal_classifications_updated_at 
    BEFORE UPDATE ON dewey_decimal_classifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_book_dimensions_updated_at ON book_dimensions;
CREATE TRIGGER update_book_dimensions_updated_at 
    BEFORE UPDATE ON book_dimensions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Create function to populate Dewey Decimal classifications
CREATE OR REPLACE FUNCTION populate_dewey_decimal_classifications()
RETURNS VOID AS $$
BEGIN
    -- Insert major Dewey Decimal categories (simplified version)
    INSERT INTO dewey_decimal_classifications (code, description, level) VALUES
    ('000', 'Computer science, information & general works', 1),
    ('100', 'Philosophy & psychology', 1),
    ('200', 'Religion', 1),
    ('300', 'Social sciences', 1),
    ('400', 'Language', 1),
    ('500', 'Pure Science', 1),
    ('600', 'Technology', 1),
    ('700', 'Arts & recreation', 1),
    ('800', 'Literature', 1),
    ('900', 'History & geography', 1)
    ON CONFLICT (code) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 14. Create function to extract and store structured dimensions
CREATE OR REPLACE FUNCTION extract_book_dimensions(book_uuid UUID, dimensions_json JSONB)
RETURNS VOID AS $$
DECLARE
    length_val DECIMAL;
    length_unit_val TEXT;
    width_val DECIMAL;
    width_unit_val TEXT;
    height_val DECIMAL;
    height_unit_val TEXT;
    weight_val DECIMAL;
    weight_unit_val TEXT;
BEGIN
    IF dimensions_json IS NULL THEN
        RETURN;
    END IF;
    
    -- Extract values safely
    length_val := (dimensions_json->'length'->>'value')::DECIMAL;
    length_unit_val := dimensions_json->'length'->>'unit';
    width_val := (dimensions_json->'width'->>'value')::DECIMAL;
    width_unit_val := dimensions_json->'width'->>'unit';
    height_val := (dimensions_json->'height'->>'value')::DECIMAL;
    height_unit_val := dimensions_json->'height'->>'unit';
    weight_val := (dimensions_json->'weight'->>'value')::DECIMAL;
    weight_unit_val := dimensions_json->'weight'->>'unit';
    
    -- Insert structured dimensions data
    INSERT INTO book_dimensions (
        book_id,
        length_value, length_unit,
        width_value, width_unit,
        height_value, height_unit,
        weight_value, weight_unit
    ) VALUES (
        book_uuid,
        length_val,
        length_unit_val,
        width_val,
        width_unit_val,
        height_val,
        height_unit_val,
        weight_val,
        weight_unit_val
    ) ON CONFLICT (book_id) DO UPDATE SET
        length_value = EXCLUDED.length_value,
        length_unit = EXCLUDED.length_unit,
        width_value = EXCLUDED.width_value,
        width_unit = EXCLUDED.width_unit,
        height_value = EXCLUDED.height_value,
        height_unit = EXCLUDED.height_unit,
        weight_value = EXCLUDED.weight_value,
        weight_unit = EXCLUDED.weight_unit,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 15. Create function to process and store Dewey Decimal classifications
CREATE OR REPLACE FUNCTION process_dewey_decimal_classifications(book_uuid UUID, dewey_array TEXT[])
RETURNS VOID AS $$
DECLARE
    dewey_code TEXT;
    dewey_id UUID;
BEGIN
    IF dewey_array IS NULL OR array_length(dewey_array, 1) IS NULL THEN
        RETURN;
    END IF;
    
    -- Clear existing classifications for this book
    DELETE FROM book_dewey_classifications WHERE book_id = book_uuid;
    
    -- Process each Dewey Decimal code
    FOREACH dewey_code IN ARRAY dewey_array
    LOOP
        -- Try to find existing classification
        SELECT id INTO dewey_id FROM dewey_decimal_classifications WHERE code = dewey_code;
        
        -- If not found, create a basic entry
        IF dewey_id IS NULL THEN
            INSERT INTO dewey_decimal_classifications (code, description, level)
            VALUES (dewey_code, 'Dewey Decimal Classification: ' || dewey_code, 1)
            RETURNING id INTO dewey_id;
        END IF;
        
        -- Link book to classification
        INSERT INTO book_dewey_classifications (book_id, dewey_id)
        VALUES (book_uuid, dewey_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 16. Create function to process and store other ISBNs
CREATE OR REPLACE FUNCTION process_other_isbns(book_uuid UUID, other_isbns_json JSONB)
RETURNS VOID AS $$
DECLARE
    isbn_record JSONB;
    isbn_text TEXT;
    binding_type TEXT;
BEGIN
    IF other_isbns_json IS NULL OR jsonb_array_length(other_isbns_json) = 0 THEN
        RETURN;
    END IF;
    
    -- Clear existing ISBN variants for this book
    DELETE FROM book_isbn_variants WHERE book_id = book_uuid;
    
    -- Process each ISBN record
    FOR isbn_record IN SELECT * FROM jsonb_array_elements(other_isbns_json)
    LOOP
        isbn_text := isbn_record->>'isbn';
        binding_type := isbn_record->>'binding';
        
        -- Determine ISBN type
        INSERT INTO book_isbn_variants (
            book_id, isbn, isbn_type, binding_type, format_type
        ) VALUES (
            book_uuid,
            isbn_text,
            CASE 
                WHEN length(isbn_text) = 10 THEN 'isbn10'
                WHEN length(isbn_text) = 13 THEN 'isbn13'
                ELSE 'unknown'
            END,
            binding_type,
            'variant'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 17. Create function to process and store related books
CREATE OR REPLACE FUNCTION process_related_books(book_uuid UUID, related_json JSONB)
RETURNS VOID AS $$
DECLARE
    relation_type TEXT;
BEGIN
    IF related_json IS NULL THEN
        RETURN;
    END IF;
    
    relation_type := related_json->>'type';
    
    -- Store related book information
    INSERT INTO book_relations (
        book_id, relation_type, relation_source
    ) VALUES (
        book_uuid, 
        COALESCE(relation_type, 'unknown'),
        'isbndb'
    ) ON CONFLICT (book_id, related_book_id, relation_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 18. Create comprehensive function to process complete ISBNdb book data
CREATE OR REPLACE FUNCTION process_complete_isbndb_book_data(
    book_uuid UUID,
    isbndb_data JSONB
)
RETURNS VOID AS $$
DECLARE
    excerpt_text TEXT;
    reviews_array JSONB;
    review_record JSONB;
    dewey_array TEXT[];
    dimensions_json JSONB;
    other_isbns_json JSONB;
    related_json JSONB;
BEGIN
    -- Extract data from ISBNdb response
    excerpt_text := isbndb_data->>'excerpt';
    reviews_array := isbndb_data->'reviews';
    dewey_array := ARRAY(SELECT jsonb_array_elements_text(isbndb_data->'dewey_decimal'));
    dimensions_json := isbndb_data->'dimensions_structured';
    other_isbns_json := isbndb_data->'other_isbns';
    related_json := isbndb_data->'related';
    
    -- Process excerpt
    IF excerpt_text IS NOT NULL AND length(trim(excerpt_text)) > 0 THEN
        INSERT INTO book_excerpts (book_id, excerpt_text, excerpt_type, excerpt_source)
        VALUES (book_uuid, excerpt_text, 'isbndb', 'isbndb')
        ON CONFLICT (book_id, excerpt_type) DO UPDATE SET
            excerpt_text = EXCLUDED.excerpt_text,
            updated_at = NOW();
    END IF;
    
    -- Process reviews
    IF reviews_array IS NOT NULL AND jsonb_array_length(reviews_array) > 0 THEN
        -- Clear existing reviews
        DELETE FROM book_reviews_isbndb WHERE book_id = book_uuid;
        
        -- Insert new reviews
        FOR review_record IN SELECT * FROM jsonb_array_elements(reviews_array)
        LOOP
            INSERT INTO book_reviews_isbndb (book_id, review_text, review_source)
            VALUES (book_uuid, review_record::TEXT, 'isbndb');
        END LOOP;
    END IF;
    
    -- Process Dewey Decimal classifications
    PERFORM process_dewey_decimal_classifications(book_uuid, dewey_array);
    
    -- Process structured dimensions
    PERFORM extract_book_dimensions(book_uuid, dimensions_json);
    
    -- Process other ISBNs
    PERFORM process_other_isbns(book_uuid, other_isbns_json);
    
    -- Process related books
    PERFORM process_related_books(book_uuid, related_json);
    
    -- Update book record with metadata
    UPDATE books SET
        isbndb_last_updated = NOW(),
        isbndb_data_version = '2.6.0',
        raw_isbndb_data = isbndb_data
    WHERE id = book_uuid;
END;
$$ LANGUAGE plpgsql;

-- 19. Initialize Dewey Decimal classifications
SELECT populate_dewey_decimal_classifications();

-- 20. Create view for comprehensive book data
-- Drop the view first to ensure clean recreation with correct security settings
DROP VIEW IF EXISTS books_complete;

CREATE VIEW books_complete AS
SELECT 
    b.*,
    ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as subjects,
    ARRAY_AGG(DISTINCT ddc.code) FILTER (WHERE ddc.code IS NOT NULL) as dewey_codes,
    ARRAY_AGG(DISTINCT ddc.description) FILTER (WHERE ddc.description IS NOT NULL) as dewey_descriptions,
    ARRAY_AGG(DISTINCT be.excerpt_text) FILTER (WHERE be.excerpt_text IS NOT NULL) as excerpts,
    ARRAY_AGG(DISTINCT bri.review_text) FILTER (WHERE bri.review_text IS NOT NULL) as reviews,
    ARRAY_AGG(DISTINCT biv.isbn) FILTER (WHERE biv.isbn IS NOT NULL) as isbn_variants,
    bd.length_value, bd.length_unit,
    bd.width_value, bd.width_unit,
    bd.height_value, bd.height_unit,
    bd.weight_value, bd.weight_unit
FROM books b
LEFT JOIN book_subjects bs ON b.id = bs.book_id
LEFT JOIN subjects s ON bs.subject_id = s.id
LEFT JOIN book_dewey_classifications bdc ON b.id = bdc.book_id
LEFT JOIN dewey_decimal_classifications ddc ON bdc.dewey_id = ddc.id
LEFT JOIN book_excerpts be ON b.id = be.book_id
LEFT JOIN book_reviews_isbndb bri ON b.id = bri.book_id
LEFT JOIN book_isbn_variants biv ON b.id = biv.book_id
LEFT JOIN book_dimensions bd ON b.id = bd.book_id
GROUP BY b.id, bd.length_value, bd.length_unit, bd.width_value, bd.width_unit, 
         bd.height_value, bd.height_unit, bd.weight_value, bd.weight_unit;

-- 21. Additional indexes for enhanced queries
-- Note: The underlying tables already have the necessary indexes for performance

-- 22. Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 23. Create RLS policies for new tables
ALTER TABLE book_reviews_isbndb ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_excerpts ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_isbn_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE dewey_decimal_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_dewey_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE isbndb_sync_log ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for clean state
DROP POLICY IF EXISTS "Allow read access to book_reviews_isbndb" ON book_reviews_isbndb;
DROP POLICY IF EXISTS "Allow read access to book_excerpts" ON book_excerpts;
DROP POLICY IF EXISTS "Allow read access to book_relations" ON book_relations;
DROP POLICY IF EXISTS "Allow read access to book_isbn_variants" ON book_isbn_variants;
DROP POLICY IF EXISTS "Allow read access to dewey_decimal_classifications" ON dewey_decimal_classifications;
DROP POLICY IF EXISTS "Allow read access to book_dewey_classifications" ON book_dewey_classifications;
DROP POLICY IF EXISTS "Allow read access to book_dimensions" ON book_dimensions;
DROP POLICY IF EXISTS "Allow read access to isbndb_sync_log" ON isbndb_sync_log;

DROP POLICY IF EXISTS "Allow admin access to book_reviews_isbndb" ON book_reviews_isbndb;
DROP POLICY IF EXISTS "Allow admin access to book_excerpts" ON book_excerpts;
DROP POLICY IF EXISTS "Allow admin access to book_relations" ON book_relations;
DROP POLICY IF EXISTS "Allow admin access to book_isbn_variants" ON book_isbn_variants;
DROP POLICY IF EXISTS "Allow admin access to dewey_decimal_classifications" ON dewey_decimal_classifications;
DROP POLICY IF EXISTS "Allow admin access to book_dewey_classifications" ON book_dewey_classifications;
DROP POLICY IF EXISTS "Allow admin access to book_dimensions" ON book_dimensions;
DROP POLICY IF EXISTS "Allow admin access to isbndb_sync_log" ON isbndb_sync_log;

-- Create policies
CREATE POLICY "Allow read access to book_reviews_isbndb" ON book_reviews_isbndb FOR SELECT USING (true);
CREATE POLICY "Allow read access to book_excerpts" ON book_excerpts FOR SELECT USING (true);
CREATE POLICY "Allow read access to book_relations" ON book_relations FOR SELECT USING (true);
CREATE POLICY "Allow read access to book_isbn_variants" ON book_isbn_variants FOR SELECT USING (true);
CREATE POLICY "Allow read access to dewey_decimal_classifications" ON dewey_decimal_classifications FOR SELECT USING (true);
CREATE POLICY "Allow read access to book_dewey_classifications" ON book_dewey_classifications FOR SELECT USING (true);
CREATE POLICY "Allow read access to book_dimensions" ON book_dimensions FOR SELECT USING (true);
CREATE POLICY "Allow read access to isbndb_sync_log" ON isbndb_sync_log FOR SELECT USING (true);

CREATE POLICY "Allow admin access to book_reviews_isbndb" ON book_reviews_isbndb FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Allow admin access to book_excerpts" ON book_excerpts FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Allow admin access to book_relations" ON book_relations FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Allow admin access to book_isbn_variants" ON book_isbn_variants FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Allow admin access to dewey_decimal_classifications" ON dewey_decimal_classifications FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Allow admin access to book_dewey_classifications" ON book_dewey_classifications FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Allow admin access to book_dimensions" ON book_dimensions FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Allow admin access to isbndb_sync_log" ON isbndb_sync_log FOR ALL USING (auth.role() = 'admin');

COMMENT ON TABLE book_reviews_isbndb IS 'Professional reviews from ISBNdb';
COMMENT ON TABLE book_excerpts IS 'Book excerpts and previews from various sources';
COMMENT ON TABLE book_relations IS 'Relationships between books (similar, sequel, etc.)';
COMMENT ON TABLE book_isbn_variants IS 'Different ISBNs for the same book (different formats/editions)';
COMMENT ON TABLE dewey_decimal_classifications IS 'Dewey Decimal Classification system';
COMMENT ON TABLE book_dewey_classifications IS 'Junction table linking books to Dewey Decimal classifications';
COMMENT ON TABLE book_dimensions IS 'Structured physical dimensions data for books';
COMMENT ON TABLE isbndb_sync_log IS 'Log of ISBNdb data synchronization activities';
COMMENT ON VIEW books_complete IS 'Comprehensive view of all book data including ISBNdb enrichments'; 