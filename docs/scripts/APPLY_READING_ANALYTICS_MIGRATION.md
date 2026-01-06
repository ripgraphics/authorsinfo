# Apply Reading Analytics Migration

## Problem
The `reading_challenges` and `reading_sessions` tables are missing required columns (`challenge_year`, `start_date`, `end_date`, `session_date`, `duration_minutes`), causing API errors.

## Solution
Apply the migration directly via Supabase Dashboard SQL Editor.

## Steps to Fix

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/nmrohtlcfqujtfgcyqhw
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run Verification Script (Optional)
First, check what currently exists:
1. Open `scripts/verify-reading-tables.sql`
2. Copy the entire contents
3. Paste into SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. Review the results to see what's missing

### Step 3: Apply the Migration
1. Open `scripts/apply-reading-analytics-migration.sql`
2. Copy the **entire contents** of the file
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. Wait for completion - you should see a green checkmark ✅

### Step 4: Verify Success
Run this query to verify the tables and columns exist:

```sql
-- Verify reading_challenges table and columns
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'reading_challenges' 
  AND column_name IN ('challenge_year', 'start_date', 'end_date', 'session_date', 'duration_minutes')
ORDER BY column_name;

-- Verify reading_sessions table and columns
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'reading_sessions' 
  AND column_name IN ('session_date', 'duration_minutes')
ORDER BY column_name;
```

### Step 5: Regenerate TypeScript Types
After applying the migration, regenerate types:

```bash
npm run types:generate
```

### Step 6: Test the API
After applying the migration, test the reading-challenge page:
- Navigate to: http://localhost:3000/reading-challenge
- The page should load without errors
- API endpoints should return 200 status codes

## What This Migration Creates

### Tables Created:
- `reading_challenges` - User reading challenges
- `reading_sessions` - Individual reading sessions
- `challenge_tracking` - Progress tracking for challenges
- `reading_streaks` - Reading streak data
- `reading_calendar_days` - Daily reading summaries
- `custom_shelves` - Custom book shelves
- `shelf_books` - Books in shelves

### Key Columns:
- `reading_challenges.challenge_year` - Year of the challenge
- `reading_challenges.start_date` - Challenge start date
- `reading_challenges.end_date` - Challenge end date
- `reading_sessions.session_date` - Date of reading session
- `reading_sessions.duration_minutes` - Duration of session

### Security:
- Row Level Security (RLS) enabled on all tables
- Policies created for user access control

## Troubleshooting

### If you get "relation already exists" errors:
- This is normal - the migration uses `CREATE TABLE IF NOT EXISTS`
- The migration will skip existing tables and only add missing columns

### If you get permission errors:
- Make sure you're logged into the Supabase Dashboard
- Ensure you have admin access to the project

### If columns still don't exist after running:
- Check the error messages in the SQL Editor
- The migration includes `ALTER TABLE` statements to add missing columns
- Re-run the verification script to confirm

## Alternative: Use CLI (if it works)

If the CLI is working, you can try:

```bash
npx supabase db push --include-all
```

But based on the error, the Dashboard method is more reliable.

