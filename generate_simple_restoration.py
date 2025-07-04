#!/usr/bin/env python3
"""
Simple database restoration script generator.
This focuses on core objects first to avoid dependency issues.
"""

import re
import os
from datetime import datetime

def extract_core_objects(schema_file):
    """Extract only core database objects (schemas, types, tables)."""
    
    with open(schema_file, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Extract schemas
    schema_pattern = r'CREATE SCHEMA IF NOT EXISTS "([^"]+)"[^;]*;'
    schemas = re.findall(schema_pattern, content)
    
    # Extract schema creation statements
    schema_statements = re.findall(r'CREATE SCHEMA IF NOT EXISTS "[^"]+"[^;]*;', content)
    
    # Extract types
    type_pattern = r'CREATE TYPE "([^"]+)"\."([^"]+)" AS[^;]*;'
    type_matches = re.findall(type_pattern, content)
    type_statements = re.findall(r'CREATE TYPE "[^"]+"\."([^"]+)" AS[^;]*;', content)
    
    # Extract complete type definitions
    type_definitions = re.findall(r'CREATE TYPE "[^"]+"\."([^"]+)" AS[^;]*;', content, re.DOTALL)
    
    # Extract tables
    table_pattern = r'CREATE TABLE IF NOT EXISTS "([^"]+)"\."([^"]+)"[^;]*?;'
    table_matches = re.findall(table_pattern, content, re.DOTALL)
    
    # Extract complete table definitions
    table_definitions = re.findall(r'CREATE TABLE IF NOT EXISTS "[^"]+"\."([^"]+)"[^;]*?;', content, re.DOTALL)
    
    return {
        'schemas': schemas,
        'schema_statements': schema_statements,
        'types': type_matches,
        'tables': table_matches,
        'table_definitions': table_definitions
    }

def generate_simple_restoration(schema_file, output_file):
    """Generate a simple restoration script with core objects only."""
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    with open(schema_file, 'r', encoding='utf-8') as file:
        content = file.read()
    
    with open(output_file, 'w', encoding='utf-8') as file:
        file.write(f"""-- Simple Database Restoration Script
-- Generated on: {timestamp}
-- This script creates core database objects (schemas, types, tables)
-- Run this first, then add functions and other objects as needed

-- =====================================================
-- PHASE 1: SCHEMAS
-- =====================================================

""")
        
        # Extract and write schemas
        schema_statements = re.findall(r'CREATE SCHEMA IF NOT EXISTS "[^"]+"[^;]*;', content)
        for schema_stmt in schema_statements:
            file.write(f"{schema_stmt}\n")
        
        file.write("\n-- =====================================================\n")
        file.write("-- PHASE 2: TYPES\n")
        file.write("-- =====================================================\n\n")
        
        # Extract and write types
        type_blocks = re.findall(r'CREATE TYPE "[^"]+"\."([^"]+)" AS[^;]*?;', content, re.DOTALL)
        for type_block in type_blocks:
            # Find the complete type definition
            pattern = rf'CREATE TYPE "[^"]+"\."{type_block}" AS[^;]*?;'
            match = re.search(pattern, content, re.DOTALL)
            if match:
                file.write(f"-- Creating type: {type_block}\n")
                file.write(f"{match.group(0)}\n\n")
        
        file.write("-- =====================================================\n")
        file.write("-- PHASE 3: TABLES\n")
        file.write("-- =====================================================\n\n")
        
        # Extract and write tables
        table_blocks = re.findall(r'CREATE TABLE IF NOT EXISTS "[^"]+"\."([^"]+)"[^;]*?;', content, re.DOTALL)
        for table_block in table_blocks:
            # Find the complete table definition
            pattern = rf'CREATE TABLE IF NOT EXISTS "[^"]+"\."{table_block}"[^;]*?;'
            match = re.search(pattern, content, re.DOTALL)
            if match:
                file.write(f"-- Creating table: {table_block}\n")
                file.write(f"{match.group(0)}\n\n")
        
        file.write("-- =====================================================\n")
        file.write("-- CORE RESTORATION COMPLETE\n")
        file.write("-- =====================================================\n\n")
        file.write("-- Core database objects have been created.\n")
        file.write("-- Next steps:\n")
        file.write("-- 1. Add indexes\n")
        file.write("-- 2. Add functions (one by one to check for dependencies)\n")
        file.write("-- 3. Add triggers\n")
        file.write("-- 4. Add policies\n")
        file.write("-- 5. Add data\n")

def main():
    """Main function."""
    
    schema_file = "schemas/schema_20250629_161751.sql"
    output_file = "simple_restoration_script.sql"
    
    if not os.path.exists(schema_file):
        print(f"Error: Schema file '{schema_file}' not found!")
        return
    
    print(f"Generating simple restoration script: {output_file}")
    generate_simple_restoration(schema_file, output_file)
    
    print("\n✅ Simple restoration script generated!")
    print(f"📄 Script saved to: {output_file}")
    print("\n🚀 This script contains only core objects (schemas, types, tables)")
    print("   Run this first, then add other objects as needed.")

if __name__ == "__main__":
    main() 