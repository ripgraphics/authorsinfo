# Simple Database Protection Installer
Write-Host "Installing Database Protection System..." -ForegroundColor Green

# Get PowerShell profile path
$profilePath = $PROFILE.CurrentUserAllHosts
$profileDir = Split-Path $profilePath -Parent

# Create profile directory if needed
if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
    Write-Host "Created profile directory" -ForegroundColor Cyan
}

# Get protection script path
$currentDir = Get-Location
$protectionScript = Join-Path $currentDir "security\database-protection.ps1"

# Create profile content
$content = @"
# Database Protection System
if (Test-Path "$protectionScript") {
    try {
        . "$protectionScript"
    } catch {
        Write-Warning "Protection system load failed"
    }
}
"@

# Backup existing profile
if (Test-Path $profilePath) {
    $backupName = $profilePath + ".backup"
    Copy-Item $profilePath $backupName -Force
    Write-Host "Backed up existing profile" -ForegroundColor Cyan
}

# Install protection
Set-Content -Path $profilePath -Value $content -Encoding UTF8

Write-Host "SUCCESS: Database Protection Installed!" -ForegroundColor Green
Write-Host "Restart PowerShell for protection to activate" -ForegroundColor Yellow
Write-Host "Secret passcode: ENTERPRISE_SECURE_2025_DB_RESET" -ForegroundColor Red