# Database Schema Fix Guide

## Issues Found

Based on the errors in `info.txt`, there are several database schema issues that need to be fixed:

1. **Missing `author_id` column in `activities` table**
   - Error: `"Could not find the 'author_id' column of 'activities' in the schema cache"`
   - This column is referenced in triggers but doesn't exist

2. **Missing `created_at` and `updated_at` columns in `publishers` table**
   - Error: `"column publishers.created_at does not exist"`
   - The code expects these timestamp columns but they're missing

3. **Invalid user ID in activity functions**
   - Error: `"Key (user_id)=(00000000-0000-0000-0000-000000000000) is not present in table "users""`
   - Functions are using a placeholder UUID instead of real user IDs

## How to Fix

### Option 1: Run the SQL Migration (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to your project
   - Go to the SQL Editor

2. **Copy and paste the migration**
   - Open `migrations/fix_schema_errors.sql`
   - Copy all the SQL code
   - Paste it into the Supabase SQL Editor

3. **Run the migration**
   - Click "Run" to execute the SQL
   - You should see "All schema fixes have been applied successfully!" at the end

### Option 2: Use the API Endpoint

1. **Make sure your dev server is running**
   ```bash
   npm run dev
   ```

2. **Call the API endpoint**
   ```bash
   curl -X POST http://localhost:3000/api/fix-schema
   ```
   
   Or visit: `http://localhost:3000/api/fix-schema` in your browser

### Option 3: Manual Fixes

If you prefer to fix each issue manually:

#### 1. Add author_id column to activities table
```sql
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS author_id uuid;
```

#### 2. Add timestamp columns to publishers table
```sql
ALTER TABLE public.publishers 
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
```

#### 3. Create trigger for publishers updated_at
```sql
CREATE OR REPLACE FUNCTION public.update_publishers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_publishers_updated_at_trigger ON public.publishers;
CREATE TRIGGER update_publishers_updated_at_trigger
    BEFORE UPDATE ON public.publishers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_publishers_updated_at();
```

#### 4. Fix the activity functions
The migration file contains the corrected versions of:
- `create_book_update_activity()`
- `create_user_profile_activity()`

## Verification

After running the fixes, you can verify they worked by:

1. **Check the `/admin/activities` page** - it should load without errors
2. **Check the browser console** - no more database errors
3. **Check the `info.txt` file** - it should stop accumulating new errors

## What the Fixes Do

1. **Adds missing columns** to match the expected schema
2. **Fixes trigger functions** to use real user IDs instead of placeholder UUIDs
3. **Creates performance indexes** for better query performance
4. **Updates existing data** to have proper timestamps
5. **Adds documentation** to the database schema

## Files Created

- `migrations/fix_schema_errors.sql` - Complete SQL migration
- `app/api/fix-schema/route.ts` - API endpoint to run fixes
- `scripts/fix-database-schema.sql` - Standalone SQL script
- `FIX_SCHEMA_GUIDE.md` - This guide

## Next Steps

After running the fixes:

1. **Test the admin activities page** - `/admin/activities`
2. **Check for any remaining errors** in the browser console
3. **Monitor the `info.txt` file** to ensure no new errors appear
4. **Consider removing the API endpoint** if you no longer need it

The fixes are designed to be safe and idempotent (can be run multiple times without issues). 