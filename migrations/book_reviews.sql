-- Add group_id to book_reviews table
ALTER TABLE book_reviews
ADD COLUMN group_id UUID REFERENCES groups(id);

-- Create index for group_id
CREATE INDEX idx_book_reviews_group_id ON book_reviews(group_id);

-- Add visibility column to make reviews public
ALTER TABLE book_reviews
ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private'));

-- Create index for visibility
CREATE INDEX idx_book_reviews_visibility ON book_reviews(visibility); 