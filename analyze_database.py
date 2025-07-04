#!/usr/bin/env python3
"""
Comprehensive Database Analysis Script
Analyzes the complete database schema and provides detailed insights.
"""

import re
import os
from datetime import datetime
from collections import defaultdict, Counter

def analyze_database_schema(schema_file):
    """Comprehensive analysis of the database schema."""
    
    with open(schema_file, 'r', encoding='utf-8') as file:
        content = file.read()
    
    analysis = {
        'schemas': [],
        'types': [],
        'functions': [],
        'tables': [],
        'triggers': [],
        'indexes': [],
        'policies': [],
        'relationships': [],
        'constraints': [],
        'comments': [],
        'grants': []
    }
    
    # Extract schemas
    schema_pattern = r'CREATE SCHEMA IF NOT EXISTS "([^"]+)"'
    analysis['schemas'] = re.findall(schema_pattern, content)
    
    # Extract types
    type_pattern = r'CREATE TYPE "([^"]+)"\."([^"]+)" AS ENUM'
    type_matches = re.findall(type_pattern, content)
    analysis['types'] = [f"{schema}.{type_name}" for schema, type_name in type_matches]
    
    # Extract composite types
    composite_pattern = r'CREATE TYPE "([^"]+)"\."([^"]+)" AS \('
    composite_matches = re.findall(composite_pattern, content)
    analysis['types'].extend([f"{schema}.{type_name}" for schema, type_name in composite_matches])
    
    # Extract functions
    func_pattern = r'CREATE OR REPLACE FUNCTION "([^"]+)"\."([^"]+)"\('
    func_matches = re.findall(func_pattern, content)
    analysis['functions'] = [f"{schema}.{func_name}" for schema, func_name in func_matches]
    
    # Extract tables
    table_pattern = r'CREATE TABLE IF NOT EXISTS "([^"]+)"\."([^"]+)"'
    table_matches = re.findall(table_pattern, content)
    analysis['tables'] = [f"{schema}.{table_name}" for schema, table_name in table_matches]
    
    # Extract triggers
    trigger_pattern = r'CREATE OR REPLACE TRIGGER "([^"]+)"'
    analysis['triggers'] = re.findall(trigger_pattern, content)
    
    # Extract indexes
    index_pattern = r'CREATE INDEX "([^"]+)"'
    analysis['indexes'] = re.findall(index_pattern, content)
    
    # Extract policies
    policy_pattern = r'CREATE POLICY "([^"]+)"'
    analysis['policies'] = re.findall(policy_pattern, content)
    
    # Extract foreign key relationships
    fk_pattern = r'FOREIGN KEY \("([^"]+)"\) REFERENCES "([^"]+)"\."([^"]+)"\("([^"]+)"\)'
    fk_matches = re.findall(fk_pattern, content)
    analysis['relationships'] = fk_matches
    
    # Extract constraints
    constraint_pattern = r'CONSTRAINT "([^"]+)"'
    analysis['constraints'] = re.findall(constraint_pattern, content)
    
    # Extract comments
    comment_pattern = r'COMMENT ON (TABLE|COLUMN|SCHEMA) "([^"]+)"'
    analysis['comments'] = re.findall(comment_pattern, content)
    
    # Extract grants
    grant_pattern = r'GRANT [^;]+;'
    analysis['grants'] = re.findall(grant_pattern, content)
    
    return analysis

def analyze_table_structure(schema_file):
    """Analyze the structure of each table."""
    
    with open(schema_file, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Split content into table definitions
    table_sections = re.split(r'CREATE TABLE IF NOT EXISTS', content)
    
    tables = {}
    for section in table_sections[1:]:  # Skip first empty section
        # Extract table name
        table_match = re.match(r'"([^"]+)"\."([^"]+)"', section)
        if table_match:
            schema, table_name = table_match.groups()
            full_table_name = f"{schema}.{table_name}"
            
            # Extract columns
            columns = []
            column_pattern = r'"([^"]+)"\s+([^,\n]+?)(?:,|$)'
            column_matches = re.findall(column_pattern, section)
            
            for col_name, col_def in column_matches:
                # Clean up column definition
                col_def = col_def.strip()
                if col_def and not col_def.startswith('CONSTRAINT') and not col_def.startswith('PRIMARY KEY'):
                    columns.append({
                        'name': col_name,
                        'definition': col_def
                    })
            
            tables[full_table_name] = {
                'schema': schema,
                'name': table_name,
                'columns': columns,
                'column_count': len(columns)
            }
    
    return tables

def generate_comprehensive_report(analysis, tables, output_file):
    """Generate a comprehensive analysis report."""
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    with open(output_file, 'w', encoding='utf-8') as file:
        file.write(f"""# Comprehensive Database Analysis Report
Generated on: {timestamp}

## 📊 Executive Summary

### Database Overview
- **Total Schemas**: {len(analysis['schemas'])}
- **Total Types**: {len(analysis['types'])}
- **Total Functions**: {len(analysis['functions'])}
- **Total Tables**: {len(analysis['tables'])}
- **Total Triggers**: {len(analysis['triggers'])}
- **Total Indexes**: {len(analysis['indexes'])}
- **Total Policies**: {len(analysis['policies'])}
- **Total Relationships**: {len(analysis['relationships'])}
- **Total Constraints**: {len(analysis['constraints'])}

## 🏗️ Schema Architecture

### Schemas ({len(analysis['schemas'])})
""")
        
        for schema in analysis['schemas']:
            file.write(f"- `{schema}`\n")
        
        file.write(f"""
### Custom Types ({len(analysis['types'])})
""")
        
        for type_name in analysis['types']:
            file.write(f"- `{type_name}`\n")
        
        file.write(f"""
## 📋 Table Analysis

### Table Statistics
- **Total Tables**: {len(tables)}
- **Average Columns per Table**: {sum(t['column_count'] for t in tables.values()) / len(tables) if tables else 0:.1f}
- **Largest Table**: {max(tables.values(), key=lambda x: x['column_count'])['name'] if tables else 'N/A'} ({max(tables.values(), key=lambda x: x['column_count'])['column_count'] if tables else 0} columns)

### Tables by Schema
""")
        
        # Group tables by schema
        schema_tables = defaultdict(list)
        for table_name, table_info in tables.items():
            schema_tables[table_info['schema']].append(table_info)
        
        for schema, schema_table_list in schema_tables.items():
            file.write(f"\n#### {schema} Schema ({len(schema_table_list)} tables)\n")
            for table in schema_table_list:
                file.write(f"- `{table['name']}` ({table['column_count']} columns)\n")
        
        file.write(f"""
## 🔗 Relationships Analysis

### Foreign Key Relationships ({len(analysis['relationships'])})
""")
        
        for fk_col, ref_schema, ref_table, ref_col in analysis['relationships']:
            file.write(f"- `{fk_col}` → `{ref_schema}.{ref_table}.{ref_col}`\n")
        
        file.write(f"""
## ⚡ Functions Analysis

### Functions by Schema
""")
        
        # Group functions by schema
        schema_functions = defaultdict(list)
        for func_name in analysis['functions']:
            schema, func = func_name.split('.')
            schema_functions[schema].append(func)
        
        for schema, func_list in schema_functions.items():
            file.write(f"\n#### {schema} Schema ({len(func_list)} functions)\n")
            for func in func_list:
                file.write(f"- `{func}`\n")
        
        file.write(f"""
## 🔒 Security Analysis

### Row Level Security Policies ({len(analysis['policies'])})
""")
        
        for policy in analysis['policies']:
            file.write(f"- `{policy}`\n")
        
        file.write(f"""
## 🚀 Performance Analysis

### Indexes ({len(analysis['indexes'])})
""")
        
        for index in analysis['indexes']:
            file.write(f"- `{index}`\n")
        
        file.write(f"""
## 🎯 Key Features Identified

### Core Systems
""")
        
        # Identify key systems
        systems = {
            'Authentication': ['auth.users', 'auth.sessions', 'auth.identities'],
            'User Management': ['public.profiles', 'public.users', 'public.user_friends'],
            'Book Management': ['public.books', 'public.authors', 'public.publishers'],
            'Photo Albums': ['public.photo_albums', 'public.album_images', 'public.album_shares'],
            'Events': ['public.events', 'public.event_registrations', 'public.event_sessions'],
            'Groups': ['public.groups', 'public.group_members', 'public.group_roles'],
            'Feed System': ['public.feed_entries', 'public.activities', 'public.posts'],
            'Reading System': ['public.reading_progress', 'public.reading_lists', 'public.reading_challenges'],
            'Storage': ['storage.objects', 'storage.buckets', 'storage.migrations']
        }
        
        for system_name, expected_tables in systems.items():
            found_tables = [table for table in expected_tables if table in tables]
            if found_tables:
                file.write(f"- **{system_name}**: {len(found_tables)}/{len(expected_tables)} tables present\n")
        
        file.write(f"""
## 📈 Recommendations

### Performance
- Consider adding indexes on frequently queried columns
- Review query patterns for optimization opportunities

### Security
- Ensure all tables have appropriate RLS policies
- Review function permissions and access controls

### Maintenance
- Regular backup and monitoring of large tables
- Consider partitioning for high-volume tables

## 🔍 Detailed Table Information

""")
        
        for table_name, table_info in sorted(tables.items()):
            file.write(f"### {table_name}\n")
            file.write(f"- **Columns**: {table_info['column_count']}\n")
            file.write(f"- **Schema**: {table_info['schema']}\n")
            file.write("#### Columns:\n")
            for col in table_info['columns']:
                file.write(f"- `{col['name']}`: {col['definition']}\n")
            file.write("\n")

def main():
    print("🔍 Starting comprehensive database analysis...")
    
    schema_file = "schemas/current_schema.sql"
    output_file = "database_analysis_report.md"
    
    if not os.path.exists(schema_file):
        print(f"❌ Schema file not found: {schema_file}")
        return
    
    # Analyze database
    print("📊 Analyzing database structure...")
    analysis = analyze_database_schema(schema_file)
    
    print("📋 Analyzing table structures...")
    tables = analyze_table_structure(schema_file)
    
    print("📝 Generating comprehensive report...")
    generate_comprehensive_report(analysis, tables, output_file)
    
    print(f"✅ Analysis complete! Report saved to: {output_file}")
    
    # Print summary
    print(f"\n📊 Analysis Summary:")
    print(f"- Schemas: {len(analysis['schemas'])}")
    print(f"- Types: {len(analysis['types'])}")
    print(f"- Functions: {len(analysis['functions'])}")
    print(f"- Tables: {len(analysis['tables'])}")
    print(f"- Triggers: {len(analysis['triggers'])}")
    print(f"- Indexes: {len(analysis['indexes'])}")
    print(f"- Policies: {len(analysis['policies'])}")
    print(f"- Relationships: {len(analysis['relationships'])}")

if __name__ == "__main__":
    main() 