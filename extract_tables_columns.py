import re
import csv

schema_file = "schemas/schema_20250629_161751.sql"
csv_file = "tables_and_columns.csv"

table_re = re.compile(r'CREATE TABLE IF NOT EXISTS "public"\."([^"]+)" \((.*?)\);', re.DOTALL)
column_re = re.compile(r'^\s*"([^"]+)" ([^,]+)', re.MULTILINE)

rows = []

with open(schema_file, encoding="utf-8") as f:
    content = f.read()

for table_match in table_re.finditer(content):
    table_name = table_match.group(1)
    columns_block = table_match.group(2)
    for col_match in column_re.finditer(columns_block):
        col_name = col_match.group(1)
        col_type = col_match.group(2).strip()
        rows.append([table_name, col_name, col_type])

with open(csv_file, mode="w", newline='', encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["table_name", "column_name", "column_type"])
    writer.writerows(rows)

print(f"Output written to {csv_file}") 