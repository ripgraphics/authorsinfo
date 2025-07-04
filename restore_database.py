import csv
import re

def clean_column_type(col_type):
    """Clean up the column type by removing extra quotes and formatting"""
    # Remove extra quotes
    col_type = col_type.replace('""', '"')
    # Remove the outer quotes if they exist
    if col_type.startswith('"') and col_type.endswith('"'):
        col_type = col_type[1:-1]
    return col_type

def generate_create_table_sql(table_name, columns):
    """Generate CREATE TABLE SQL for a given table and its columns"""
    sql_lines = [f'CREATE TABLE IF NOT EXISTS "public"."{table_name}" (']
    
    column_definitions = []
    for col_name, col_type in columns:
        clean_type = clean_column_type(col_type)
        column_definitions.append(f'    "{col_name}" {clean_type}')
    
    sql_lines.append(',\n'.join(column_definitions))
    sql_lines.append(');')
    sql_lines.append('')
    
    return '\n'.join(sql_lines)

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
    
    # Generate the SQL restoration script
    sql_content = []
    sql_content.append('-- Database Restoration Script')
    sql_content.append('-- Generated from tables_and_columns.csv')
    sql_content.append('-- This script will recreate all tables from your original schema')
    sql_content.append('')
    sql_content.append('-- Drop existing tables (if they exist)')
    sql_content.append('')
    
    # Add DROP statements for existing tables
    for table_name in tables_data.keys():
        sql_content.append(f'DROP TABLE IF EXISTS "public"."{table_name}" CASCADE;')
    
    sql_content.append('')
    sql_content.append('-- Create all tables')
    sql_content.append('')
    
    # Add CREATE TABLE statements
    for table_name, columns in tables_data.items():
        sql_content.append(generate_create_table_sql(table_name, columns))
    
    # Write the SQL file
    with open('restore_database.sql', 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_content))
    
    print(f"Generated restore_database.sql with {len(tables_data)} tables")
    print("You can now run this SQL file to restore your complete database")

if __name__ == "__main__":
    main() 