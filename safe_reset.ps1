# SAFE DATABASE RESET POWERSHELL SCRIPT
# Automatically runs backup before any database reset
# Usage: .\safe_reset.ps1 [arguments for supabase db reset]

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " SAFE DATABASE RESET WITH AUTO-BACKUP" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

python safe_db_reset.py @args