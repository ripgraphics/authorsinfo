#!/usr/bin/env python3
config_content = """project_id = "v0-4-11-2025-authors-info-2"

[api]
enabled = true
port = 54321

[db]
port = 54322
shadow_port = 54320
major_version = 15

[db.migrations]
schema_paths = []
"""

with open('supabase/config.toml', 'wb') as f:
    f.write(config_content.encode('utf-8'))

print('Created clean config file')

