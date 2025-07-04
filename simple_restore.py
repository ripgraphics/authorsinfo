import csv

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
    
    # Write the complete SQL file
    with open('FINAL_RESTORE.sql', 'w', encoding='utf-8') as f:
        f.write("-- Complete Database Restoration Script\n")
        f.write("-- Generated from tables_and_columns.csv\n")
        f.write("-- This script will recreate all 166 tables from your original schema\n\n")
        
        # Drop statements
        f.write("-- Drop existing tables (if they exist)\n\n")
        for table_name in tables_data.keys():
            f.write(f'DROP TABLE IF EXISTS "public"."{table_name}" CASCADE;\n')
        
        f.write("\n-- Create all tables\n\n")
        
        # Create statements
        for table_name, columns in tables_data.items():
            f.write(f'CREATE TABLE IF NOT EXISTS "public"."{table_name}" (\n')
            
            column_definitions = []
            for col_name, col_type in columns:
                # Clean up the column type
                clean_type = col_type.replace('""', '"')
                if clean_type.startswith('"') and clean_type.endswith('"'):
                    clean_type = clean_type[1:-1]
                column_definitions.append(f'    "{col_name}" {clean_type}')
            
            f.write(',\n'.join(column_definitions))
            f.write('\n);\n\n')
    
    print(f"✅ Generated FINAL_RESTORE.sql with {len(tables_data)} tables")

if __name__ == "__main__":
    main() 