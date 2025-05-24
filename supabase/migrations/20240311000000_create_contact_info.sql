-- Create contact_info table
CREATE TABLE IF NOT EXISTS contact_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    email TEXT,
    phone TEXT,
    website TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(entity_type, entity_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contact_info_entity ON contact_info(entity_type, entity_id);

-- Migrate data from publishers table
INSERT INTO contact_info (
    entity_type,
    entity_id,
    email,
    phone,
    website,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    country
)
SELECT 
    'publisher',
    uuid_generate_v4(),
    p.email,
    p.phone,
    p.website,
    p.address_line1,
    p.address_line2,
    p.city,
    p.state,
    p.postal_code,
    p.country
FROM publishers p
WHERE p.email IS NOT NULL 
   OR p.phone IS NOT NULL 
   OR p.website IS NOT NULL 
   OR p.address_line1 IS NOT NULL;

-- Migrate data from authors table
INSERT INTO contact_info (
    entity_type,
    entity_id,
    website
)
SELECT 
    'author',
    uuid_generate_v4(),
    a.website
FROM authors a
WHERE a.website IS NOT NULL;

-- Add RLS policies
ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;

-- Policy for viewing contact info
CREATE POLICY "Contact info is viewable by authenticated users" 
ON contact_info FOR SELECT 
TO authenticated 
USING (true);

-- Policy for inserting contact info
CREATE POLICY "Contact info can be inserted by authenticated users" 
ON contact_info FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy for updating contact info
CREATE POLICY "Contact info can be updated by authenticated users" 
ON contact_info FOR UPDATE 
TO authenticated 
USING (true);

-- Policy for deleting contact info
CREATE POLICY "Contact info can be deleted by authenticated users" 
ON contact_info FOR DELETE 
TO authenticated 
USING (true); 