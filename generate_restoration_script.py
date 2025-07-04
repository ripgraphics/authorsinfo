#!/usr/bin/env python3
"""
Script to generate a proper database restoration script based on dependencies.
This script reads the dependencies report and creates a restoration script in the correct order.
"""

import re
import os
from datetime import datetime

def parse_dependencies_report(report_file):
    """Parse the dependencies report to extract all objects."""
    
    with open(report_file, 'r', encoding='utf-8') as file:
        content = file.read()
    
    dependencies = {
        'schemas': [],
        'types': [],
        'functions': [],
        'tables': [],
        'indexes': [],
        'policies': [],
        'comments': [],
        'grants': []
    }
    
    # Extract schemas
    schema_section = re.search(r'### 1\. SCHEMAS.*?\n(.*?)(?=\n###)', content, re.DOTALL)
    if schema_section:
        schema_lines = schema_section.group(1).strip().split('\n')
        dependencies['schemas'] = [line.strip('- ').strip() for line in schema_lines if line.strip().startswith('-')]
    
    # Extract types
    type_section = re.search(r'### 2\. TYPES.*?\n(.*?)(?=\n###)', content, re.DOTALL)
    if type_section:
        type_lines = type_section.group(1).strip().split('\n')
        dependencies['types'] = [line.strip('- ').strip() for line in type_lines if line.strip().startswith('-')]
    
    # Extract functions
    func_section = re.search(r'### 3\. FUNCTIONS.*?\n(.*?)(?=\n###)', content, re.DOTALL)
    if func_section:
        func_lines = func_section.group(1).strip().split('\n')
        dependencies['functions'] = [line.strip('- ').strip() for line in func_lines if line.strip().startswith('-')]
    
    # Extract tables
    table_section = re.search(r'### 4\. TABLES.*?\n(.*?)(?=\n###)', content, re.DOTALL)
    if table_section:
        table_lines = table_section.group(1).strip().split('\n')
        dependencies['tables'] = [line.strip('- ').strip() for line in table_lines if line.strip().startswith('-')]
    
    # Extract indexes
    index_section = re.search(r'### 8\. INDEXES.*?\n(.*?)(?=\n###)', content, re.DOTALL)
    if index_section:
        index_lines = index_section.group(1).strip().split('\n')
        dependencies['indexes'] = [line.strip('- ').strip() for line in index_lines if line.strip().startswith('-')]
    
    # Extract policies
    policy_section = re.search(r'### 10\. POLICIES.*?\n(.*?)(?=\n###)', content, re.DOTALL)
    if policy_section:
        policy_lines = policy_section.group(1).strip().split('\n')
        dependencies['policies'] = [line.strip('- ').strip() for line in policy_lines if line.strip().startswith('-')]
    
    # Extract comments
    comment_section = re.search(r'### 12\. COMMENTS.*?\n(.*?)(?=\n###)', content, re.DOTALL)
    if comment_section:
        comment_lines = comment_section.group(1).strip().split('\n')
        dependencies['comments'] = [line.strip('- ').strip() for line in comment_lines if line.strip().startswith('-')]
    
    # Extract grants
    grant_section = re.search(r'### 13\. GRANTS.*?\n(.*?)(?=\n###)', content, re.DOTALL)
    if grant_section:
        grant_lines = grant_section.group(1).strip().split('\n')
        dependencies['grants'] = [line.strip('- ').strip() for line in grant_lines if line.strip().startswith('-')]
    
    return dependencies

def extract_sql_objects(schema_file, dependencies):
    """Extract SQL definitions for objects from the schema file."""
    
    with open(schema_file, 'r', encoding='utf-8') as file:
        content = file.read()
    
    sql_objects = {
        'schemas': {},
        'types': {},
        'functions': {},
        'tables': {},
        'indexes': {},
        'policies': {},
        'comments': {},
        'grants': {}
    }
    
    # Extract schema definitions
    for schema in dependencies['schemas']:
        pattern = rf'CREATE SCHEMA IF NOT EXISTS "{schema}"[^;]*;'
        match = re.search(pattern, content, re.DOTALL)
        if match:
            sql_objects['schemas'][schema] = match.group(0)
    
    # Extract type definitions
    for type_obj in dependencies['types']:
        schema, type_name = type_obj.split('.')
        pattern = rf'CREATE TYPE "{schema}"\."{type_name}" AS[^;]*;'
        match = re.search(pattern, content, re.DOTALL)
        if match:
            sql_objects['types'][type_obj] = match.group(0)
    
    # Extract function definitions
    for func in dependencies['functions']:
        schema, func_name = func.split('.')
        # Look for complete function definition from CREATE to the final semicolon
        pattern = rf'CREATE OR REPLACE FUNCTION "{schema}"\."{func_name}"\([\s\S]*?\)[\s\S]*?;'
        match = re.search(pattern, content, re.DOTALL)
        if match:
            sql_objects['functions'][func] = match.group(0)
    
    # Extract table definitions
    for table in dependencies['tables']:
        schema, table_name = table.split('.')
        pattern = rf'CREATE TABLE IF NOT EXISTS "{schema}"\."{table_name}"[^;]*?;'
        match = re.search(pattern, content, re.DOTALL)
        if match:
            sql_objects['tables'][table] = match.group(0)
    
    # Extract index definitions
    for index in dependencies['indexes']:
        pattern = rf'CREATE INDEX "{index}"[^;]*?;'
        match = re.search(pattern, content, re.DOTALL)
        if match:
            sql_objects['indexes'][index] = match.group(0)
    
    # Extract policy definitions
    for policy in dependencies['policies']:
        parts = policy.split('.')
        if len(parts) >= 3:
            policy_name, schema, table = parts[0], parts[1], parts[2]
            pattern = rf'CREATE POLICY "{policy_name}" ON "{schema}"\."{table}"[^;]*?;'
            match = re.search(pattern, content, re.DOTALL)
            if match:
                sql_objects['policies'][policy] = match.group(0)
    
    return sql_objects

def generate_restoration_script(sql_objects, output_file):
    """Generate the restoration script in proper dependency order."""
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    with open(output_file, 'w', encoding='utf-8') as file:
        file.write(f"""-- Database Restoration Script
-- Generated on: {timestamp}
-- This script creates all database objects in the correct dependency order

-- =====================================================
-- PHASE 1: CORE INFRASTRUCTURE
-- =====================================================

-- Create schemas first
""")
        
        # Phase 1: Schemas
        for schema in sorted(sql_objects['schemas'].keys()):
            file.write(f"-- Creating schema: {schema}\n")
            file.write(f"{sql_objects['schemas'][schema]}\n\n")
        
        file.write("-- =====================================================\n")
        file.write("-- PHASE 2: TYPES\n")
        file.write("-- =====================================================\n\n")
        
        # Phase 2: Types
        for type_obj in sorted(sql_objects['types'].keys()):
            file.write(f"-- Creating type: {type_obj}\n")
            file.write(f"{sql_objects['types'][type_obj]}\n\n")
        
        file.write("-- =====================================================\n")
        file.write("-- PHASE 3: TABLES\n")
        file.write("-- =====================================================\n\n")
        
        # Phase 3: Tables
        for table in sorted(sql_objects['tables'].keys()):
            file.write(f"-- Creating table: {table}\n")
            file.write(f"{sql_objects['tables'][table]}\n\n")
        
        file.write("-- =====================================================\n")
        file.write("-- PHASE 4: INDEXES\n")
        file.write("-- =====================================================\n\n")
        
        # Phase 4: Indexes
        for index in sorted(sql_objects['indexes'].keys()):
            file.write(f"-- Creating index: {index}\n")
            file.write(f"{sql_objects['indexes'][index]}\n\n")
        
        file.write("-- =====================================================\n")
        file.write("-- PHASE 5: FUNCTIONS\n")
        file.write("-- =====================================================\n\n")
        
        # Phase 5: Functions
        for func in sorted(sql_objects['functions'].keys()):
            file.write(f"-- Creating function: {func}\n")
            file.write(f"{sql_objects['functions'][func]}\n\n")
        
        file.write("-- =====================================================\n")
        file.write("-- PHASE 6: POLICIES\n")
        file.write("-- =====================================================\n\n")
        
        # Phase 6: Policies
        for policy in sorted(sql_objects['policies'].keys()):
            file.write(f"-- Creating policy: {policy}\n")
            file.write(f"{sql_objects['policies'][policy]}\n\n")
        
        file.write("-- =====================================================\n")
        file.write("-- RESTORATION COMPLETE\n")
        file.write("-- =====================================================\n\n")
        file.write("-- All database objects have been created in the correct dependency order.\n")
        file.write("-- You may now need to:\n")
        file.write("-- 1. Create any missing triggers\n")
        file.write("-- 2. Insert initial data\n")
        file.write("-- 3. Set up any additional configurations\n")
        file.write("-- 4. Verify all objects were created successfully\n")

def main():
    """Main function to generate the restoration script."""
    
    report_file = "database_dependencies_report.md"
    schema_file = "schemas/schema_20250629_161751.sql"
    output_file = "ordered_restoration_script.sql"
    
    if not os.path.exists(report_file):
        print(f"Error: Dependencies report '{report_file}' not found!")
        print("Please run extract_dependencies.py first.")
        return
    
    if not os.path.exists(schema_file):
        print(f"Error: Schema file '{schema_file}' not found!")
        return
    
    print(f"Reading dependencies from: {report_file}")
    dependencies = parse_dependencies_report(report_file)
    
    print(f"Extracting SQL objects from: {schema_file}")
    sql_objects = extract_sql_objects(schema_file, dependencies)
    
    print(f"Generating restoration script: {output_file}")
    generate_restoration_script(sql_objects, output_file)
    
    print("\n✅ Restoration script generation complete!")
    print(f"📄 Script saved to: {output_file}")
    
    # Print summary
    total_objects = sum(len(objects) for objects in sql_objects.values())
    print(f"\n📊 Summary: Generated {total_objects} SQL objects")
    
    for category, objects in sql_objects.items():
        if objects:
            print(f"   - {category.capitalize()}: {len(objects)}")
    
    print(f"\n🚀 You can now run the restoration script in your database!")
    print(f"   The script is organized in phases to ensure proper dependency order.")

if __name__ == "__main__":
    main() 