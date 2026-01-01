#!/usr/bin/env python3
import os
import re
from pathlib import Path

def fix_promise_types(file_path):
    """Fix Promise<{}> to Promise<{ id: string }> in route files"""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Pattern to match Promise<{}>
    # Replace with proper types based on file path
    if '[id]' in file_path:
        # Check if it's a nested route with multiple params
        if '[' in file_path.split('[id]')[1] if '[id]' in file_path else '':
            # Has nested params like [id]/[bookId]/
            parts = re.findall(r'\[(\w+)\]', file_path)
            param_types = ', '.join(f"{p}: string" for p in parts)
            replacement = f"{{{{ {param_types} }}}}"
        else:
            replacement = "{ id: string }"
            
        # Replace Promise<{}> with proper type
        content = content.replace('{ params }: { params: Promise<{}> }', 
                                f'{{ params }}: {{ params: Promise<{replacement}> }}')
        
        # Also add const { id } = await params; after try {
        # Pattern: try {\n    const supabase = ... or try {\n    const authHeader = ...
        # Add the await line right after try {
        content = re.sub(
            r'(try \{)\n(\s+)(const\s+(?:supabase|auth|{))',
            r'\1\n\2const { id } = await params;\n\2\3',
            content
        )
    
    # Handle special cases for nested params
    if '[questionId]' in file_path:
        content = content.replace('params: Promise<{}>', 'params: Promise<{ id: string; questionId: string }>')
        # Remove old duplicate param extractions
        content = re.sub(r'\n\s+const { id } = params;', '', content)
        content = re.sub(r'\n\s+const { questionId } = params;', '', content)
    elif '[bookId]' in file_path:
        content = content.replace('params: Promise<{}>', 'params: Promise<{ id: string; bookId: string }>')
        content = re.sub(r'\n\s+const { id } = params;', '', content)
        content = re.sub(r'\n\s+const { bookId } = params;', '', content)
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Find all route.ts files with Promise<{}>
api_dir = Path('app/api')
fixed_count = 0

for route_file in api_dir.rglob('route.ts'):
    with open(route_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'Promise<{}>' in content:
        print(f"Fixing: {route_file}")
        if fix_promise_types(str(route_file)):
            fixed_count += 1

print(f"\nFixed {fixed_count} files")
