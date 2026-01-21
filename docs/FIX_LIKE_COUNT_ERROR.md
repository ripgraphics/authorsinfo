# Fix: "record new has no field like_count" Error

## Problem

When creating a post, the error occurs:
```
record "new" has no field "like_count"
```

This is a PostgreSQL trigger error that happens when a database trigger tries to access `NEW.like_count` on the `activities` table, but that column doesn't exist.

## Root Cause

The `activities` table does NOT have a `like_count` column (engagement counts are calculated dynamically from engagement tables). However, there's likely a database trigger or function that still references `like_count` from an older schema.

## Solution Approach

### Step 1: Diagnose (Run First)

Run `scripts/diagnose-like-count-error.sql` in Supabase SQL Editor to see:
- What columns actually exist in `activities` table
- What triggers exist on `activities` table
- What functions reference `like_count`
- Which triggers call which functions

### Step 2: Fix (Run After Diagnosis)

Run `supabase/migrations/20260120220000_fix_like_count_trigger_error.sql` which will:

1. **Drop ALL triggers** on `activities` table (to be safe)
2. **Drop ALL functions** that reference `like_count` in their definition
3. **Recreate `validate_activity_data` function** without any `like_count` references
4. **Reattach `validate_activity_data` trigger** (the only safe trigger we need)
5. **Verify** no functions still reference `like_count`

## Migration Details

The migration is **idempotent** (safe to run multiple times) and includes:
- Comprehensive trigger cleanup
- Function cleanup with error handling
- Verification steps
- Detailed logging

## Expected Outcome

After running the migration:
- ✅ No triggers will reference `like_count`
- ✅ No functions will reference `like_count`
- ✅ Post creation will work without errors
- ✅ `validate_activity_data` trigger will still work (for entity validation)

## Verification

After running the migration, verify:

```sql
-- Check no functions reference like_count
SELECT p.proname, pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) LIKE '%like_count%';
-- Should return 0 rows

-- Check triggers on activities
SELECT tgname, pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'public.activities'::regclass
  AND tgisinternal = false;
-- Should only show validate_activity_data_trigger
```

## Notes

- The migration uses `CASCADE` to ensure dependent objects are cleaned up
- The `validate_activity_data` function is recreated to only validate:
  - Entity references (using `entity_exists` function)
  - Visibility values
  - No engagement count validation (counts are dynamic)
