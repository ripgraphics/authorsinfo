@echo off
REM DATABASE RESTORE SCRIPT FOR WINDOWS
REM Created: 2025-07-06 19:21:20
REM 
REM WARNING: This will completely replace your current database!
REM Make sure you have a backup before running this script.
REM
REM To restore your database:
REM 1. Make sure you have Supabase CLI installed
REM 2. Set your database password as environment variable: set PGPASSWORD=your_password
REM 3. Run: RESTORE_DATABASE.bat

echo 🚨 WARNING: This will completely replace your current database!
echo Press any key to continue, or Ctrl+C to cancel...
pause >nul

echo 🔄 Starting database restoration...

echo 📋 Restoring schema...
npx supabase db reset --linked

echo 🔧 Restoring functions and triggers...
if exist "03_functions_triggers.sql" (
    npx supabase db push --file "03_functions_triggers.sql"
)

echo 🔒 Restoring RLS policies...
if exist "04_rls_policies.sql" (
    npx supabase db push --file "04_rls_policies.sql"
)

echo 📊 Restoring data...
if exist "02_data.sql" (
    npx supabase db push --file "02_data.sql"
)

echo ✅ Database restoration complete!
echo Your database has been restored from backup.
pause
