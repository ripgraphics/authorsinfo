@echo off
REM SAFE DATABASE RESET BATCH FILE
REM Automatically runs backup before any database reset
REM Usage: safe_reset.bat [arguments for supabase db reset]

echo.
echo ========================================
echo  SAFE DATABASE RESET WITH AUTO-BACKUP
echo ========================================
echo.

python safe_db_reset.py %*