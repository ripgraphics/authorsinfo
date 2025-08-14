# SETUP AUTOMATIC SAFETY COMMANDS
# This script sets up automatic backup triggers for dangerous database operations

try { [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new() } catch {}
Write-Host "🛡️  Setting up AUTOMATIC DATABASE SAFETY COMMANDS..." -ForegroundColor Green
Write-Host ""

# Create the PowerShell profile directory if it doesn't exist
$profileDir = Split-Path $PROFILE -Parent
if (!(Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}

# Create or append to PowerShell profile
$profileContent = @"

# ========================================
# AUTOMATIC DATABASE SAFETY COMMANDS
# ========================================
# Added by Enhanced Enterprise Backup System
# Automatically backs up database before destructive operations

function supabase {
    param([Parameter(ValueFromRemainingArguments=`$true)][string[]]`$Arguments)
    
    # Check if this is a database reset command
    if (`$Arguments.Length -ge 2 -and `$Arguments[0] -eq "db" -and `$Arguments[1] -eq "reset") {
        Write-Host "🚨 INTERCEPTED DATABASE RESET COMMAND!" -ForegroundColor Red
        Write-Host "🛡️  Triggering automatic backup safety protocol..." -ForegroundColor Yellow
        
        # Remove 'db reset' from arguments and pass the rest to safe script
        `$safeArgs = `$Arguments[2..(`$Arguments.Length-1)]
        
        # Run the safe reset script
        python safe_db_reset.py @safeArgs
    }
    else {
        # For all other supabase commands, run normally
        & npx supabase @Arguments
    }
}

# Create alias for common dangerous operations
function Reset-Database {
    param([Parameter(ValueFromRemainingArguments=`$true)][string[]]`$Arguments)
    
    Write-Host "🚨 INTERCEPTED RESET-DATABASE COMMAND!" -ForegroundColor Red
    Write-Host "🛡️  Triggering automatic backup safety protocol..." -ForegroundColor Yellow
    
    python safe_db_reset.py @Arguments
}

# Alias for convenience
Set-Alias -Name "db-reset" -Value "Reset-Database"

Write-Host "✅ Automatic database safety commands loaded!" -ForegroundColor Green
Write-Host "🛡️  Your database is now protected from accidental resets" -ForegroundColor Green

"@

# Add to PowerShell profile
Add-Content -Path $PROFILE -Value $profileContent

Write-Host "✅ AUTOMATIC SAFETY COMMANDS INSTALLED!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 What was installed:" -ForegroundColor Cyan
Write-Host "   • Automatic backup before 'npx supabase db reset'" -ForegroundColor White
Write-Host "   • Safety confirmation prompts" -ForegroundColor White
Write-Host "   • Emergency recovery instructions" -ForegroundColor White
Write-Host "   • Complete audit trail of all reset operations" -ForegroundColor White
Write-Host ""
Write-Host "🔧 How to use:" -ForegroundColor Cyan
Write-Host "   • Just run: supabase db reset --linked" -ForegroundColor White
Write-Host "   • Or use: safe_reset.bat --linked" -ForegroundColor White
Write-Host "   • Or use: .\safe_reset.ps1 --linked" -ForegroundColor White
Write-Host ""
Write-Host "⚡ To activate now, run:" -ForegroundColor Yellow
Write-Host "   . `$PROFILE" -ForegroundColor White
Write-Host ""
Write-Host "🚨 IMPORTANT: The system will now automatically backup before EVERY database reset!" -ForegroundColor Red