# Supabase CLI Config Fix and Migration Execution

## Current Issue

The Supabase CLI is experiencing a config parsing error:
```
'db.port' cannot parse value as 'uint16': strconv.ParseUint: invalid syntax
```

Despite the config file (`supabase/config.toml`) appearing correct, the CLI cannot parse it. This prevents using `npx supabase db push` to run migrations.

## Config File Status

The config file at `supabase/config.toml` has been fixed and contains:
```toml
project_id = "v0-4-11-2025-authors-info-2"

[api]
enabled = true
port = 54321

[db]
port = 54322
shadow_port = 54320
major_version = 15

[db.migrations]
schema_paths = []
```

The file is correctly formatted with clean UTF-8 encoding.

## Workaround: Run Migration via Supabase Dashboard

Since the CLI config parsing issue persists, run the migration manually via the Supabase Dashboard:

### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project (ref: `nmrohtlcfqujtfgcyqhw`)

2. **Open SQL Editor**
   - Click on **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Copy Migration SQL**
   - Open the file: `supabase/migrations/20250118000000_create_schema_rpc_functions.sql`
   - Copy the entire contents

4. **Execute Migration**
   - Paste the SQL into the SQL Editor
   - Click **Run** (or press Ctrl+Enter)

5. **Verify Functions Created**
   - Run this query to verify:
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

## Alternative: Fix CLI Config Issue

If you want to fix the CLI config parsing issue:

1. **Try reinstalling Supabase CLI:**
   ```bash
   npm uninstall -g supabase
   npm install -g supabase@latest
   ```

2. **Check for cached config:**
   - Look for `.supabase` directories in your project or home directory
   - Check for global Supabase config files

3. **Try using a different config location:**
   - The CLI might be reading from a different location
   - Check if there are multiple `config.toml` files

4. **Update CLI version:**
   - Current version: 2.67.1
   - Try updating to the latest version

## Migration File Location

The migration file to run is:
- **Path:** `supabase/migrations/20250118000000_create_schema_rpc_functions.sql`
- **Purpose:** Creates RPC functions for schema introspection
- **Functions Created:**
  - `get_table_columns(p_table_name text)`
  - `get_table_rls_policies(p_table_name text)`
  - `check_table_rls_enabled(p_table_name text)`
  - `get_all_tables()`

## Next Steps After Migration

Once the migration is applied:

1. The schema service will be able to query actual database schema
2. Post creation will use validated payloads
3. All API routes will filter payloads based on actual columns

## Project Connection Info

- **Project Ref:** `nmrohtlcfqujtfgcyqhw`
- **Database Password:** (stored in `config.toml` in project root)
- **Connection String:** `postgresql://postgres.nmrohtlcfqujtfgcyqhw@aws-0-us-west-1.pooler.supabase.com:6543/postgres`

