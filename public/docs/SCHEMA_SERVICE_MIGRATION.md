# Schema Service Migration Guide

## Migration File Created

**File:** `supabase/migrations/20250118000000_create_schema_rpc_functions.sql`

This migration creates RPC functions that allow the schema service to query Supabase database metadata directly.

## Functions Created

1. `get_table_columns(p_table_name text)` - Returns column information for a table
2. `get_table_rls_policies(p_table_name text)` - Returns RLS policies for a table
3. `check_table_rls_enabled(p_table_name text)` - Checks if RLS is enabled
4. `get_all_tables()` - Returns all table names in public schema

## How to Run the Migration

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy the entire contents of `supabase/migrations/20250118000000_create_schema_rpc_functions.sql`
6. Paste into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)

### Option 2: Via Supabase CLI

If your CLI is working:

```bash
npx supabase db push --include-all
```

### Option 3: Direct SQL Connection

If you have direct database access:

```bash
psql -h [your-db-host] -U postgres -d postgres -f supabase/migrations/20250118000000_create_schema_rpc_functions.sql
```

## Verification

After running the migration, verify the functions exist:

```sql
-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'get_table_columns',
    'get_table_rls_policies', 
    'check_table_rls_enabled',
    'get_all_tables'
  );

-- Test a function
SELECT * FROM get_table_columns('activities');
```

## What This Enables

Once the migration is applied, the schema service will be able to:

- ✅ Query actual database schema instead of making assumptions
- ✅ Validate insert payloads against real columns
- ✅ Filter out non-existent columns automatically
- ✅ Check RLS policies programmatically
- ✅ Audit migrations against actual database state

## Troubleshooting

### If functions already exist

The migration uses `CREATE OR REPLACE FUNCTION`, so it's safe to run multiple times. It will update existing functions if they're already present.

### If you get permission errors

Make sure you're running as a user with `CREATE FUNCTION` permissions. The functions are created with `SECURITY DEFINER` so they run with elevated privileges.

### If RPC calls fail

Check that:
1. Functions were created successfully
2. You have `EXECUTE` permission on the functions (granted to `authenticated` role by default)
3. The function names match exactly (case-sensitive)

## Next Steps

After the migration:

1. The schema service will automatically use these functions
2. Post creation will work without 400 errors
3. You can run schema audits via `/api/admin/schema-audit`

