#!/usr/bin/env python3
"""
Script to extract all dependencies from a PostgreSQL schema dump file.
This script analyzes the schema and creates a comprehensive list of all database objects.
"""

import re
import os
from datetime import datetime

def extract_dependencies(schema_file_path):
    """Extract all dependencies from the schema file."""
    
    with open(schema_file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    dependencies = {
        'schemas': [],
        'types': [],
        'functions': [],
        'triggers': [],
        'tables': [],
        'views': [],
        'sequences': [],
        'indexes': [],
        'constraints': [],
        'policies': [],
        'extensions': [],
        'comments': [],
        'grants': []
    }
    
    # Extract schemas
    schema_pattern = r'CREATE SCHEMA IF NOT EXISTS "([^"]+)"'
    dependencies['schemas'] = re.findall(schema_pattern, content)
    
    # Extract types (ENUMs and composite types)
    type_pattern = r'CREATE TYPE "([^"]+)"\."([^"]+)" AS'
    type_matches = re.findall(type_pattern, content)
    dependencies['types'] = [f"{schema}.{type_name}" for schema, type_name in type_matches]
    
    # Extract functions
    function_pattern = r'CREATE OR REPLACE FUNCTION "([^"]+)"\."([^"]+)"\('
    function_matches = re.findall(function_pattern, content)
    dependencies['functions'] = [f"{schema}.{func_name}" for schema, func_name in function_matches]
    
    # Extract tables
    table_pattern = r'CREATE TABLE IF NOT EXISTS "([^"]+)"\."([^"]+)"'
    table_matches = re.findall(table_pattern, content)
    dependencies['tables'] = [f"{schema}.{table_name}" for schema, table_name in table_matches]
    
    # Extract triggers
    trigger_pattern = r'CREATE TRIGGER "([^"]+)"'
    dependencies['triggers'] = re.findall(trigger_pattern, content)
    
    # Extract views
    view_pattern = r'CREATE VIEW "([^"]+)"\."([^"]+)"'
    view_matches = re.findall(view_pattern, content)
    dependencies['views'] = [f"{schema}.{view_name}" for schema, view_name in view_matches]
    
    # Extract sequences
    sequence_pattern = r'CREATE SEQUENCE "([^"]+)"\."([^"]+)"'
    sequence_matches = re.findall(sequence_pattern, content)
    dependencies['sequences'] = [f"{schema}.{seq_name}" for schema, seq_name in sequence_matches]
    
    # Extract indexes
    index_pattern = r'CREATE INDEX "([^"]+)"'
    dependencies['indexes'] = re.findall(index_pattern, content)
    
    # Extract constraints
    constraint_pattern = r'ALTER TABLE "([^"]+)"\."([^"]+)" ADD CONSTRAINT "([^"]+)"'
    constraint_matches = re.findall(constraint_pattern, content)
    dependencies['constraints'] = [f"{schema}.{table}.{constraint}" for schema, table, constraint in constraint_matches]
    
    # Extract policies
    policy_pattern = r'CREATE POLICY "([^"]+)" ON "([^"]+)"\."([^"]+)"'
    policy_matches = re.findall(policy_pattern, content)
    dependencies['policies'] = [f"{schema}.{table}.{policy}" for policy, schema, table in policy_matches]
    
    # Extract extensions (from other schema files)
    extension_pattern = r'CREATE EXTENSION IF NOT EXISTS "([^"]+)"'
    dependencies['extensions'] = re.findall(extension_pattern, content)
    
    # Extract comments
    comment_pattern = r'COMMENT ON (TABLE|FUNCTION|COLUMN) "([^"]+)"\."([^"]+)"'
    comment_matches = re.findall(comment_pattern, content)
    dependencies['comments'] = [f"{obj_type} {schema}.{obj_name}" for obj_type, schema, obj_name in comment_matches]
    
    # Extract grants
    grant_pattern = r'GRANT ([^"]+) ON ([^"]+) TO ([^"]+)'
    grant_matches = re.findall(grant_pattern, content)
    dependencies['grants'] = [f"{privilege} ON {object} TO {role}" for privilege, object, role in grant_matches]
    
    return dependencies

def generate_dependencies_file(dependencies, output_file):
    """Generate a comprehensive dependencies file."""
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    with open(output_file, 'w', encoding='utf-8') as file:
        file.write(f"""# Database Dependencies Report
# Generated on: {timestamp}
# This file contains all database objects and dependencies found in the schema

## SUMMARY
Total Schemas: {len(dependencies['schemas'])}
Total Types: {len(dependencies['types'])}
Total Functions: {len(dependencies['functions'])}
Total Tables: {len(dependencies['tables'])}
Total Triggers: {len(dependencies['triggers'])}
Total Views: {len(dependencies['views'])}
Total Sequences: {len(dependencies['sequences'])}
Total Indexes: {len(dependencies['indexes'])}
Total Constraints: {len(dependencies['constraints'])}
Total Policies: {len(dependencies['policies'])}
Total Extensions: {len(dependencies['extensions'])}
Total Comments: {len(dependencies['comments'])}
Total Grants: {len(dependencies['grants'])}

## DETAILED BREAKDOWN

### 1. SCHEMAS ({len(dependencies['schemas'])})
""")
        
        for schema in sorted(dependencies['schemas']):
            file.write(f"- {schema}\n")
        
        file.write(f"""
### 2. TYPES ({len(dependencies['types'])})
""")
        
        for type_obj in sorted(dependencies['types']):
            file.write(f"- {type_obj}\n")
        
        file.write(f"""
### 3. FUNCTIONS ({len(dependencies['functions'])})
""")
        
        for func in sorted(dependencies['functions']):
            file.write(f"- {func}\n")
        
        file.write(f"""
### 4. TABLES ({len(dependencies['tables'])})
""")
        
        for table in sorted(dependencies['tables']):
            file.write(f"- {table}\n")
        
        file.write(f"""
### 5. TRIGGERS ({len(dependencies['triggers'])})
""")
        
        for trigger in sorted(dependencies['triggers']):
            file.write(f"- {trigger}\n")
        
        file.write(f"""
### 6. VIEWS ({len(dependencies['views'])})
""")
        
        for view in sorted(dependencies['views']):
            file.write(f"- {view}\n")
        
        file.write(f"""
### 7. SEQUENCES ({len(dependencies['sequences'])})
""")
        
        for seq in sorted(dependencies['sequences']):
            file.write(f"- {seq}\n")
        
        file.write(f"""
### 8. INDEXES ({len(dependencies['indexes'])})
""")
        
        for idx in sorted(dependencies['indexes']):
            file.write(f"- {idx}\n")
        
        file.write(f"""
### 9. CONSTRAINTS ({len(dependencies['constraints'])})
""")
        
        for constraint in sorted(dependencies['constraints']):
            file.write(f"- {constraint}\n")
        
        file.write(f"""
### 10. POLICIES ({len(dependencies['policies'])})
""")
        
        for policy in sorted(dependencies['policies']):
            file.write(f"- {policy}\n")
        
        file.write(f"""
### 11. EXTENSIONS ({len(dependencies['extensions'])})
""")
        
        for ext in sorted(dependencies['extensions']):
            file.write(f"- {ext}\n")
        
        file.write(f"""
### 12. COMMENTS ({len(dependencies['comments'])})
""")
        
        for comment in sorted(dependencies['comments']):
            file.write(f"- {comment}\n")
        
        file.write(f"""
### 13. GRANTS ({len(dependencies['grants'])})
""")
        
        for grant in sorted(dependencies['grants']):
            file.write(f"- {grant}\n")
        
        file.write(f"""
## DEPENDENCY ORDER RECOMMENDATION

### Phase 1: Core Infrastructure
1. Extensions (if any)
2. Schemas
3. Types (ENUMs and composite types)

### Phase 2: Base Objects
4. Sequences
5. Tables
6. Views

### Phase 3: Relationships and Constraints
7. Indexes
8. Constraints (Primary Keys, Foreign Keys, etc.)
9. Policies (RLS)

### Phase 4: Logic and Automation
10. Functions
11. Triggers

### Phase 5: Documentation and Permissions
12. Comments
13. Grants

## NOTES
- This analysis is based on the schema dump file
- Some dependencies may have interdependencies not captured here
- Always test the restoration order in a development environment first
- Consider using pg_dump with --schema-only for a cleaner extraction
""")

def main():
    """Main function to extract dependencies and generate report."""
    
    schema_file = "schemas/schema_20250629_161751.sql"
    output_file = "database_dependencies_report.md"
    
    if not os.path.exists(schema_file):
        print(f"Error: Schema file '{schema_file}' not found!")
        return
    
    print(f"Analyzing schema file: {schema_file}")
    dependencies = extract_dependencies(schema_file)
    
    print(f"Generating dependencies report: {output_file}")
    generate_dependencies_file(dependencies, output_file)
    
    print("\n✅ Dependencies extraction complete!")
    print(f"📄 Report saved to: {output_file}")
    
    # Print summary
    total_objects = sum(len(deps) for deps in dependencies.values())
    print(f"\n📊 Summary: Found {total_objects} total database objects")
    
    for category, objects in dependencies.items():
        if objects:
            print(f"   - {category.capitalize()}: {len(objects)}")

if __name__ == "__main__":
    main() 