const fs = require('fs');
const content = `project_id = "v0-4-11-2025-authors-info-2"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
`;
fs.writeFileSync('supabase/config.toml', content, { encoding: 'utf8' });
console.log('Config file created successfully');