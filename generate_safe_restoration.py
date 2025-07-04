#!/usr/bin/env python3
"""
Safe database restoration script generator.
This uses IF NOT EXISTS clauses to handle existing objects gracefully.
"""

import re
import os
from datetime import datetime

def generate_safe_restoration(schema_file, output_file):
    """Generate a safe restoration script with IF NOT EXISTS clauses."""
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    with open(schema_file, 'r', encoding='utf-8') as file:
        content = file.read()
    
    with open(output_file, 'w', encoding='utf-8') as file:
        file.write(f"""-- Safe Database Restoration Script
-- Generated on: {timestamp}
-- This script uses IF NOT EXISTS clauses to handle existing objects gracefully

-- =====================================================
-- PHASE 1: SCHEMAS
-- =====================================================

""")
        
        # Extract and write schemas (already have IF NOT EXISTS)
        schema_statements = re.findall(r'CREATE SCHEMA IF NOT EXISTS "[^"]+"[^;]*;', content)
        for schema_stmt in schema_statements:
            file.write(f"{schema_stmt}\n")
        
        file.write("\n-- =====================================================\n")
        file.write("-- PHASE 2: TYPES\n")
        file.write("-- =====================================================\n\n")
        
        # Extract and write types with IF NOT EXISTS
        type_blocks = re.findall(r'CREATE TYPE "[^"]+"\."([^"]+)" AS[^;]*?;', content, re.DOTALL)
        for type_block in type_blocks:
            # Find the complete type definition
            pattern = rf'CREATE TYPE "[^"]+"\."{type_block}" AS[^;]*?;'
            match = re.search(pattern, content, re.DOTALL)
            if match:
                type_stmt = match.group(0)
                # Replace CREATE TYPE with CREATE TYPE IF NOT EXISTS
                safe_type_stmt = type_stmt.replace('CREATE TYPE "', 'CREATE TYPE IF NOT EXISTS "')
                file.write(f"-- Creating type: {type_block}\n")
                file.write(f"{safe_type_stmt}\n\n")
        
        file.write("-- =====================================================\n")
        file.write("-- PHASE 3: TABLES\n")
        file.write("-- =====================================================\n\n")
        
        # Extract and write tables (already have IF NOT EXISTS)
        table_blocks = re.findall(r'CREATE TABLE IF NOT EXISTS "[^"]+"\."([^"]+)"[^;]*?;', content, re.DOTALL)
        for table_block in table_blocks:
            # Find the complete table definition
            pattern = rf'CREATE TABLE IF NOT EXISTS "[^"]+"\."{table_block}"[^;]*?;'
            match = re.search(pattern, content, re.DOTALL)
            if match:
                file.write(f"-- Creating table: {table_block}\n")
                file.write(f"{match.group(0)}\n\n")
        
        file.write("-- =====================================================\n")
        file.write("-- SAFE RESTORATION COMPLETE\n")
        file.write("-- =====================================================\n\n")
        file.write("-- Core database objects have been created safely.\n")
        file.write("-- All objects used IF NOT EXISTS clauses.\n")
        file.write("-- Next steps:\n")
        file.write("-- 1. Add indexes (with IF NOT EXISTS)\n")
        file.write("-- 2. Add functions (with OR REPLACE)\n")
        file.write("-- 3. Add triggers (with OR REPLACE)\n")
        file.write("-- 4. Add policies (with IF NOT EXISTS)\n")
        file.write("-- 5. Add data\n")

def main():
    """Main function."""
    
    schema_file = "schemas/schema_20250629_161751.sql"
    output_file = "safe_restoration_script.sql"
    
    if not os.path.exists(schema_file):
        print(f"Error: Schema file '{schema_file}' not found!")
        return
    
    print(f"Generating safe restoration script: {output_file}")
    generate_safe_restoration(schema_file, output_file)
    
    print("\n✅ Safe restoration script generated!")
    print(f"📄 Script saved to: {output_file}")
    print("\n🚀 This script uses IF NOT EXISTS clauses to handle existing objects")
    print("   It will skip any objects that already exist in your database.")

if __name__ == "__main__":
    main() 