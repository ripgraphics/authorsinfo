-- Function to get column information for a specific table
CREATE OR REPLACE FUNCTION public.get_table_columns(table_name_param TEXT)
RETURNS TABLE(
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.is_nullable::TEXT
  FROM 
    information_schema.columns c
  WHERE 
    c.table_schema = 'public' 
    AND c.table_name = table_name_param
  ORDER BY 
    c.ordinal_position;
END;
$$ LANGUAGE plpgsql; 