# INSTALL DATABASE PROTECTION SYSTEM
# This script installs the database protection into your PowerShell profile

Write-Host "🛡️ Installing Database Protection System..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "security/database-protection.ps1")) {
    Write-Host "❌ Error: Run this from the project root directory" -ForegroundColor Red
    exit 1
}

# Get PowerShell profile path
$profilePath = $PROFILE.CurrentUserAllHosts
$profileDir = Split-Path $profilePath -Parent

# Create profile directory if it doesn't exist
if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
    Write-Host "📁 Created PowerShell profile directory: $profileDir" -ForegroundColor Cyan
}

# Get absolute path to our protection script
$protectionScriptPath = Resolve-Path "security/database-protection.ps1"

# Create or update the PowerShell profile
$profileContent = @"
# DATABASE PROTECTION SYSTEM - AUTO-INSTALLED
# This protects against accidental database resets
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

try {
    . "$protectionScriptPath"
} catch {
    Write-Warning "Database protection system failed to load: `$_"
}
"@

# Backup existing profile if it exists
if (Test-Path $profilePath) {
    $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $backupPath = $profilePath + ".backup." + $timestamp
    Copy-Item $profilePath $backupPath
    Write-Host "Backed up existing profile to: $backupPath" -ForegroundColor Cyan
}

# Install the protection
Set-Content -Path $profilePath -Value $profileContent -Encoding UTF8

Write-Host "✅ Database Protection System Installed!" -ForegroundColor Green
Write-Host ""
Write-Host "🔒 SECURITY FEATURES ACTIVE:" -ForegroundColor Yellow
Write-Host "  • All 'supabase db reset' commands are now protected" -ForegroundColor White
Write-Host "  • Requires secret passcode: ENTERPRISE_SECURE_2025_DB_RESET" -ForegroundColor White
Write-Host "  • All attempts are logged in security/ directory" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT:" -ForegroundColor Red
Write-Host "  • Restart your PowerShell session for protection to take effect" -ForegroundColor White
Write-Host "  • Protection only works in PowerShell (not other terminals)" -ForegroundColor White
Write-Host ""
Write-Host "📋 Profile installed at: $profilePath" -ForegroundColor Cyan
Write-Host "🛡️ Protection script: $protectionScriptPath" -ForegroundColor Cyan