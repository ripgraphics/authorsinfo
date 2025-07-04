#!/usr/bin/env python3
"""
Quick Database Analysis Script
Provides a focused analysis of the database structure.
"""

import re
import os

def quick_analysis():
    """Perform a quick but comprehensive analysis of the database."""
    
    schema_file = "schemas/current_schema.sql"
    
    with open(schema_file, 'r', encoding='utf-8') as file:
        content = file.read()
    
    print("🔍 COMPREHENSIVE DATABASE ANALYSIS")
    print("=" * 50)
    
    # Count schemas
    schemas = re.findall(r'CREATE SCHEMA IF NOT EXISTS "([^"]+)"', content)
    print(f"\n📁 SCHEMAS ({len(schemas)}):")
    for schema in schemas:
        print(f"  - {schema}")
    
    # Count tables by schema
    table_pattern = r'CREATE TABLE IF NOT EXISTS "([^"]+)"\."([^"]+)"'
    tables = re.findall(table_pattern, content)
    
    schema_tables = {}
    for schema, table in tables:
        if schema not in schema_tables:
            schema_tables[schema] = []
        schema_tables[schema].append(table)
    
    print(f"\n📋 TABLES BY SCHEMA ({len(tables)} total):")
    for schema, table_list in schema_tables.items():
        print(f"  {schema} ({len(table_list)} tables):")
        for table in sorted(table_list):
            print(f"    - {table}")
    
    # Count functions by schema
    func_pattern = r'CREATE OR REPLACE FUNCTION "([^"]+)"\."([^"]+)"\('
    functions = re.findall(func_pattern, content)
    
    schema_functions = {}
    for schema, func in functions:
        if schema not in schema_functions:
            schema_functions[schema] = []
        schema_functions[schema].append(func)
    
    print(f"\n⚡ FUNCTIONS BY SCHEMA ({len(functions)} total):")
    for schema, func_list in schema_functions.items():
        print(f"  {schema} ({len(func_list)} functions):")
        for func in sorted(func_list):
            print(f"    - {func}")
    
    # Count types
    types = re.findall(r'CREATE TYPE "([^"]+)"\."([^"]+)" AS', content)
    print(f"\n🎯 CUSTOM TYPES ({len(types)}):")
    for schema, type_name in types:
        print(f"  - {schema}.{type_name}")
    
    # Count triggers
    triggers = re.findall(r'CREATE OR REPLACE TRIGGER "([^"]+)"', content)
    print(f"\n🔧 TRIGGERS ({len(triggers)}):")
    for trigger in triggers:
        print(f"  - {trigger}")
    
    # Count indexes
    indexes = re.findall(r'CREATE INDEX "([^"]+)"', content)
    print(f"\n🚀 INDEXES ({len(indexes)}):")
    for index in indexes:
        print(f"  - {index}")
    
    # Count policies
    policies = re.findall(r'CREATE POLICY "([^"]+)"', content)
    print(f"\n🔒 RLS POLICIES ({len(policies)}):")
    for policy in policies:
        print(f"  - {policy}")
    
    # Count foreign key relationships
    fk_pattern = r'FOREIGN KEY \("([^"]+)"\) REFERENCES "([^"]+)"\."([^"]+)"\("([^"]+)"\)'
    fk_relationships = re.findall(fk_pattern, content)
    print(f"\n🔗 FOREIGN KEY RELATIONSHIPS ({len(fk_relationships)}):")
    for fk_col, ref_schema, ref_table, ref_col in fk_relationships:
        print(f"  - {fk_col} → {ref_schema}.{ref_table}.{ref_col}")
    
    # Identify key systems
    print(f"\n🎯 KEY SYSTEMS IDENTIFIED:")
    
    # Check for core systems
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
        found_tables = []
        for expected_table in expected_tables:
            if expected_table in [f"{schema}.{table}" for schema, table in tables]:
                found_tables.append(expected_table)
        
        if found_tables:
            print(f"  ✅ {system_name}: {len(found_tables)}/{len(expected_tables)} tables present")
            for table in found_tables:
                print(f"      - {table}")
        else:
            print(f"  ❌ {system_name}: No tables found")
    
    # Summary statistics
    print(f"\n📊 SUMMARY STATISTICS:")
    print(f"  - Total Schemas: {len(schemas)}")
    print(f"  - Total Tables: {len(tables)}")
    print(f"  - Total Functions: {len(functions)}")
    print(f"  - Total Types: {len(types)}")
    print(f"  - Total Triggers: {len(triggers)}")
    print(f"  - Total Indexes: {len(indexes)}")
    print(f"  - Total Policies: {len(policies)}")
    print(f"  - Total Relationships: {len(fk_relationships)}")
    
    # Database size estimate
    total_objects = len(tables) + len(functions) + len(types) + len(triggers) + len(indexes) + len(policies)
    print(f"  - Total Database Objects: {total_objects}")
    
    if total_objects > 500:
        complexity = "Very Complex"
    elif total_objects > 200:
        complexity = "Complex"
    elif total_objects > 100:
        complexity = "Moderate"
    else:
        complexity = "Simple"
    
    print(f"  - Database Complexity: {complexity}")

if __name__ == "__main__":
    quick_analysis() 