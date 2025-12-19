#!/usr/bin/env python3
import re
import sys

# Read the config file
with open('supabase/config.toml', 'rb') as f:
    content_bytes = f.read()

# Decode with UTF-8, removing BOM if present
content = content_bytes.decode('utf-8-sig')

# Find the [db] section and fix port values
lines = content.split('\n')
fixed_lines = []
in_db_section = False

for i, line in enumerate(lines):
    if line.strip().startswith('[db]'):
        in_db_section = True
        fixed_lines.append(line)
    elif line.strip().startswith('[') and in_db_section:
        in_db_section = False
        fixed_lines.append(line)
    elif in_db_section and re.match(r'^\s*port\s*=', line):
        # Extract indentation and set port to 54322
        indent = re.match(r'^(\s*)', line).group(1)
        fixed_lines.append(f"{indent}port = 54322")
    elif in_db_section and re.match(r'^\s*shadow_port\s*=', line):
        indent = re.match(r'^(\s*)', line).group(1)
        fixed_lines.append(f"{indent}shadow_port = 54320")
    else:
        fixed_lines.append(line)

# Write back with UTF-8 without BOM
fixed_content = '\n'.join(fixed_lines)
with open('supabase/config.toml', 'wb') as f:
    f.write(fixed_content.encode('utf-8'))

print("Config file fixed")

