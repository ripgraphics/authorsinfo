import csv

def clean_column_type(col_type):
    """Clean up the column type by removing extra quotes and formatting"""
    # Remove extra quotes
    col_type = col_type.replace('""', '"')
    # Remove the outer quotes if they exist
    if col_type.startswith('"') and col_type.endswith('"'):
        col_type = col_type[1:-1]
    return col_type

def main():
    # Read the CSV file
    tables_data = {}
    
    with open('tables_and_columns.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            table_name = row['table_name']
            column_name = row['column_name']
            column_type = row['column_type']
            
            if table_name not in tables_data:
                tables_data[table_name] = []
            
            tables_data[table_name].append((column_name, column_type))
    
    # Generate the complete SQL script
    sql_lines = []
    sql_lines.append('-- Complete Database Restoration Script')
    sql_lines.append('-- Generated from tables_and_columns.csv')
    sql_lines.append('-- This script will recreate all 166 tables from your original schema')
    sql_lines.append('')
    sql_lines.append('-- Drop existing tables (if they exist)')
    sql_lines.append('')
    
    # Add DROP statements for all tables
    for table_name in tables_data.keys():
        sql_lines.append(f'DROP TABLE IF EXISTS "public"."{table_name}" CASCADE;')
    
    sql_lines.append('')
    sql_lines.append('-- Create all tables')
    sql_lines.append('')
    
    # Add CREATE TABLE statements for all tables
    for table_name, columns in tables_data.items():
        sql_lines.append(f'CREATE TABLE IF NOT EXISTS "public"."{table_name}" (')
        
        column_definitions = []
        for col_name, col_type in columns:
            clean_type = clean_column_type(col_type)
            column_definitions.append(f'    "{col_name}" {clean_type}')
        
        sql_lines.append(',\n'.join(column_definitions))
        sql_lines.append(');')
        sql_lines.append('')
    
    # Write the complete SQL file
    with open('complete_restore.sql', 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))
    
    print(f"Generated complete_restore.sql with all {len(tables_data)} tables")
    print("This file contains the complete SQL script to restore your database")

if __name__ == "__main__":
    main() 