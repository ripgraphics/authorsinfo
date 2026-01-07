# How to Run Database Migrations

This guide explains how to run SQL migration scripts against your Supabase database.

## Prerequisites

1. **Environment Variables**: Ensure your `.env.local` file contains the required Supabase database credentials:
   - `SUPABASE_DB_PASSWORD` - Database password
   - `SUPABASE_DB_HOST` - Database host
   - `SUPABASE_DB_USER` - Database user
   - `SUPABASE_DB_NAME` - Database name
   - `SUPABASE_DB_PORT` - Database port (defaults to 5432)
   - `SUPABASE_TRANSACTION_POOLER` - (Optional) Transaction pooler URL for better connection handling

2. **Node.js Dependencies**: Ensure all npm packages are installed:
   ```bash
   npm install
   ```

## Migration Script Location

Migration files are stored in the `supabase/migrations/` directory. They should follow a naming convention like:
- `YYYYMMDD_description.sql` (e.g., `20260108_add_reading_progress_columns.sql`)

## Running a Migration

### Method 1: Using npm script (Recommended)

The easiest way to run a migration is using the npm script:

```bash
npm run db:migrate supabase/migrations/your_migration_file.sql
```

**Example:**
```bash
npm run db:migrate supabase/migrations/20260108_add_reading_progress_columns.sql
```

### Method 2: Using npx directly

You can also run the migration script directly:

```bash
npx ts-node scripts/run-migration-pg.ts supabase/migrations/your_migration_file.sql
```

**Example:**
```bash
npx ts-node scripts/run-migration-pg.ts supabase/migrations/20260108_add_reading_progress_columns.sql
```

## How It Works

1. **Connection**: The script connects to your Supabase database using credentials from `.env.local`
2. **File Reading**: It reads the SQL migration file you specified
3. **Execution**: It executes the SQL statements in the migration file
4. **Completion**: It reports success or failure

### Connection Priority

The script uses the following connection priority:
1. **Transaction Pooler** (if `SUPABASE_TRANSACTION_POOLER` is set) - Recommended for better connection handling
2. **Direct Connection** (using individual environment variables)

## Migration File Format

Your migration files should be standard SQL files. Example:

```sql
-- Add current_page column to reading_progress
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reading_progress' 
                   AND column_name = 'current_page') THEN
        ALTER TABLE public.reading_progress 
        ADD COLUMN current_page INTEGER;
        COMMENT ON COLUMN public.reading_progress.current_page 
        IS 'Current page the user is on for the book.';
    END IF;
END $$;
```

## Best Practices

1. **Idempotent Migrations**: Write migrations that can be run multiple times safely (use `IF NOT EXISTS` checks)
2. **Backup First**: Always backup your database before running migrations in production
3. **Test Locally**: Test migrations on a local or staging database first
4. **Naming Convention**: Use descriptive names with timestamps (e.g., `20260108_add_reading_progress_columns.sql`)
5. **Transaction Safety**: Wrap migrations in transactions where appropriate
6. **Error Handling**: Include error handling in your SQL (e.g., `DO $$ BEGIN ... EXCEPTION ... END $$;`)

## Troubleshooting

### Error: "Missing database configuration in .env.local"

**Solution**: Ensure your `.env.local` file contains all required environment variables:
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_DB_HOST`
- `SUPABASE_DB_USER`
- `SUPABASE_DB_NAME`
- `SUPABASE_DB_PORT` (optional, defaults to 5432)

### Error: "Migration file not found"

**Solution**: 
- Check that the file path is correct
- Use relative paths from the project root (e.g., `supabase/migrations/file.sql`)
- Or use absolute paths

### Error: "Connection failed"

**Solution**:
- Verify your database credentials are correct
- Check that your IP is whitelisted in Supabase (if required)
- Try using the transaction pooler URL instead of direct connection
- Check your network connection

### Error: "Migration failed" with SQL errors

**Solution**:
- Review the SQL error message in the console output
- Check that your SQL syntax is correct
- Ensure the migration is idempotent (can be run multiple times)
- Verify that any tables/columns referenced in the migration exist

## Example: Complete Migration Workflow

```bash
# 1. Navigate to project root
cd /path/to/your/project

# 2. Verify your .env.local file has the required variables
cat .env.local | grep SUPABASE_DB

# 3. Create your migration file
# (Create supabase/migrations/20260108_add_reading_progress_columns.sql)

# 4. Run the migration
npm run db:migrate supabase/migrations/20260108_add_reading_progress_columns.sql

# 5. Verify the migration succeeded
# (Check the console output for "Migration completed successfully!")
```

## Output Example

When a migration runs successfully, you'll see output like:

```
Connecting to Supabase database your_db_name on db.xxxxx.supabase.co...
Connected successfully.
Reading migration file: supabase/migrations/20260108_add_reading_progress_columns.sql
Executing migration...
Migration completed successfully!
```

If there's an error, you'll see:

```
Migration failed: [error details]
```

## Related Documentation

- Migration files location: `supabase/migrations/`
- Migration script: `scripts/run-migration-pg.ts`
- Environment setup: `docs/ENVIRONMENT_SETUP.md`

## Notes

- The migration script uses SSL connections with `rejectUnauthorized: false` for Supabase compatibility
- Migrations are executed in a single transaction (if the SQL file uses transactions)
- The script automatically handles connection cleanup
- Always review migration files before running them in production

