# Run Migration Now - Quick Instructions

## The CLI has a config parsing bug. Run this migration via Supabase Dashboard:

### Steps:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/nmrohtlcfqujtfgcyqhw

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy and paste this SQL:**

```sql
-- Create RPC functions for schema introspection
-- These functions allow querying information_schema via Supabase RPC

-- Function to get table columns
CREATE OR REPLACE FUNCTION get_table_columns(p_table_name text)
RETURNS TABLE(
  column_name text,
  data_type text,
  is_nullable text,
  column_default text,
  udt_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    COALESCE(c.column_default::text, NULL) as column_default,
    c.udt_name::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = p_table_name
  ORDER BY c.ordinal_position;
END;
$$;

-- Function to get RLS policies for a table
CREATE OR REPLACE FUNCTION get_table_rls_policies(p_table_name text)
RETURNS TABLE(
  schemaname text,
  tablename text,
  policy_name text,
  permissive text,
  roles text[],
  cmd text,
  qual text,
  with_check text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.schemaname::text,
    p.tablename::text,
    p.policyname::text as policy_name,
    p.permissive::text,
    p.roles::text[],
    p.cmd::text,
    pg_get_expr(p.qual, p.polrelid)::text as qual,
    pg_get_expr(p.with_check, p.polrelid)::text as with_check
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename = p_table_name;
END;
$$;

-- Function to check if RLS is enabled for a table
CREATE OR REPLACE FUNCTION check_table_rls_enabled(p_table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rls_enabled boolean;
BEGIN
  SELECT relforcerowsecurity INTO v_rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = p_table_name;
  
  RETURN COALESCE(v_rls_enabled, false);
END;
$$;

-- Function to get all tables in public schema
CREATE OR REPLACE FUNCTION get_all_tables()
RETURNS TABLE(table_name text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_table_columns(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_rls_policies(text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_table_rls_enabled(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_tables() TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION get_table_columns(text) IS 'Returns column information for a given table from information_schema';
COMMENT ON FUNCTION get_table_rls_policies(text) IS 'Returns RLS policies for a given table';
COMMENT ON FUNCTION check_table_rls_enabled(text) IS 'Checks if RLS is enabled for a given table';
COMMENT ON FUNCTION get_all_tables() IS 'Returns all table names in the public schema';
```

4. **Click "Run" or press Ctrl+Enter**

5. **Verify it worked:**
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
     AND routine_name IN (
       'get_table_columns',
       'get_table_rls_policies', 
       'check_table_rls_enabled',
       'get_all_tables'
     );
   ```

You should see 4 functions listed.

