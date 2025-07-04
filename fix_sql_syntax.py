import re

def fix_sql_syntax(sql_content):
    """Comprehensive SQL syntax fix for the restoration script."""
    
    # Split into lines for easier processing
    lines = sql_content.split('\n')
    fixed_lines = []
    
    for i, line in enumerate(lines):
        current_line = line
        
        # Fix escaped single quotes in timezone function calls
        current_line = current_line.replace("timezone(\\'utc\\'::text,", "timezone('utc'::text,")
        current_line = current_line.replace("timezone(\\'utc\\'::text)", "timezone('utc'::text, now())")
        
        # Fix other escaped single quotes
        current_line = current_line.replace("\\'", "'")
        
        # Fix type casts with double quotes (e.g., ::"text" -> ::text)
        current_line = re.sub(r'::"([a-zA-Z_]+)"', r'::\1', current_line)
        
        # Fix misplaced commas after column names (e.g., 'updated_at', timestamp ...)
        current_line = re.sub(r'("[^"]+"),\s*(timestamp|uuid|text|integer|date|numeric|boolean|jsonb|character varying|double precision)', r'\1 \2', current_line)
        
        # Fix missing commas between column definitions
        # Look for patterns like: "column_name" type\n    "next_column"
        if i < len(lines) - 1:
            next_line = lines[i + 1]
            # Check if current line ends with a column definition and next line starts with a new column
            if (re.search(r'"[^"]+"\s+(numeric\([^)]+\)|text|uuid|integer|date|boolean|jsonb|character varying\([^)]+\)|double precision)\s*$', current_line.strip()) and
                re.search(r'^\s*"[^"]+"', next_line.strip())):
                # Add comma to current line
                current_line = current_line.rstrip() + ','
        
        # Fix malformed column definitions with extra quotes
        current_line = re.sub(r'"([^"]+)"\s*"([^"]+)"', r'"\1" \2', current_line)
        
        # Remove trailing commas before closing parentheses
        current_line = re.sub(r',\s*\)', ')', current_line)
        
        # Fix incomplete numeric definitions
        current_line = re.sub(r'numeric\(10,\s*$', 'numeric(10,2)', current_line)
        
        # Fix any remaining syntax issues with default values
        current_line = re.sub(r'DEFAULT\s+"([^"]+)"', r'DEFAULT \1', current_line)
        
        fixed_lines.append(current_line)
    
    # Join lines back together
    sql_content = '\n'.join(fixed_lines)
    
    # Final cleanup: remove any double commas
    sql_content = re.sub(r',\s*,', ',', sql_content)
    
    # Fix any remaining issues with array types
    sql_content = re.sub(r'::"([a-zA-Z_]+)\[\]"', r'::\1[]', sql_content)
    
    return sql_content

def main():
    print("Reading SQL file...")
    with open('FINAL_RESTORE_FIXED.sql', 'r', encoding='utf-8') as file:
        sql_content = file.read()
    
    print("Fixing SQL syntax errors...")
    fixed_sql = fix_sql_syntax(sql_content)
    
    print("Writing fixed SQL back to file...")
    with open('FINAL_RESTORE_FIXED.sql', 'w', encoding='utf-8') as file:
        file.write(fixed_sql)
    
    print("✅ SQL syntax errors have been comprehensively fixed!")
    print("The file FINAL_RESTORE_FIXED.sql has been updated and should now be ready to run.")

if __name__ == "__main__":
    main() 