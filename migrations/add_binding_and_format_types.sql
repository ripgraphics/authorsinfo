-- Create binding_types table
CREATE TABLE IF NOT EXISTS binding_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create format_types table
CREATE TABLE IF NOT EXISTS format_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add binding_type_id and format_type_id columns to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS binding_type_id INTEGER REFERENCES binding_types(id);
ALTER TABLE books ADD COLUMN IF NOT EXISTS format_type_id INTEGER REFERENCES format_types(id);

-- Insert binding types
INSERT INTO binding_types (name, description) VALUES
('Paperback', 'A book with a flexible paper cover'),
('Hardcover', 'A book bound with rigid protective covers'),
('eBook', 'Electronic version of a printed book'),
('Audiobook', 'Audio recording of a book or other work'),
('Board Book', 'A sturdy book for young children'),
('Spiral-bound', 'A book bound with spiral wire'),
('Leather Bound', 'A book bound with leather covers'),
('Library Binding', 'Reinforced binding designed for library use'),
('Mass Market Paperback', 'A small, usually inexpensive paperback book'),
('Kindle', 'Amazon''s electronic book format')
ON CONFLICT (id) DO NOTHING;

-- Insert format types
INSERT INTO format_types (name, description) VALUES
('Print', 'Physical printed book'),
('Digital', 'Digital version of a book'),
('Audio', 'Audio version of a book'),
('Large Print', 'Book printed in larger font size for easier reading'),
('Braille', 'Book with raised dots for tactile reading'),
('PDF', 'Portable Document Format'),
('EPUB', 'Electronic Publication format'),
('MOBI', 'Mobipocket e-book format'),
('MP3', 'Audio format for audiobooks'),
('CD', 'Compact Disc format for audiobooks')
ON CONFLICT (id) DO NOTHING;

-- Migrate existing binding data to binding_type_id
UPDATE books
SET binding_type_id = bt.id
FROM binding_types bt
WHERE books.binding = bt.name AND books.binding_type_id IS NULL;

-- Migrate existing format data to format_type_id
UPDATE books
SET format_type_id = ft.id
FROM format_types ft
WHERE books.format = ft.name AND books.format_type_id IS NULL;

-- Create triggers to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to tables
DROP TRIGGER IF EXISTS update_binding_types_modtime ON binding_types;
CREATE TRIGGER update_binding_types_modtime
BEFORE UPDATE ON binding_types
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_format_types_modtime ON format_types;
CREATE TRIGGER update_format_types_modtime
BEFORE UPDATE ON format_types
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
