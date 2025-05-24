-- Enable RLS on images table
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Create policies for images table
CREATE POLICY "Allow authenticated users to insert images"
ON images FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to select images"
ON images FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update their images"
ON images FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true); 