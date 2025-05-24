-- Create group_rules table
CREATE TABLE IF NOT EXISTS group_rules (
    id SERIAL PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_group_rules_group_id ON group_rules(group_id);

-- Enable Row Level Security
ALTER TABLE group_rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Group rules are viewable by everyone" ON group_rules
    FOR SELECT USING (true);

CREATE POLICY "Group owners and admins can manage rules" ON group_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_rules.group_id
            AND (
                g.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM group_members gm
                    JOIN group_roles gr ON gm.role_id = gr.id
                    WHERE gm.group_id = g.id
                    AND gm.user_id = auth.uid()
                    AND gm.status = 'active'
                    AND gr.permissions @> ARRAY['manage_group']::text[]
                )
            )
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_group_rules_updated_at
    BEFORE UPDATE ON group_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 