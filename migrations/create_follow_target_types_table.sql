-- Drop existing tables if they exist (in correct order)
DROP TABLE IF EXISTS public.follows;
DROP TABLE IF EXISTS public.follow_target_types;

-- Create follow_target_types table with integer ID
CREATE TABLE public.follow_target_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger to update updated_at column
CREATE TRIGGER update_follow_target_types_updated_at
    BEFORE UPDATE ON public.follow_target_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default target types (without specifying IDs)
INSERT INTO public.follow_target_types (name, description) VALUES
    ('user', 'Follow another user'),
    ('book', 'Follow a book'),
    ('author', 'Follow an author'),
    ('publisher', 'Follow a publisher'); 