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

# Get protection script path (absolute)
$protectionScript = (Resolve-Path "security/database-protection.ps1").Path

# Create profile content using single-quoted here-string to avoid premature interpolation
$contentTemplate = @'
# Database Protection System Loader (enterprise-grade)
try {
    # Ensure UTF-8 console output so Unicode/emoji render correctly
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
    $OutputEncoding = [Console]::OutputEncoding
} catch {}

$scriptPath = '__PROTECTION_SCRIPT__'
if (Test-Path $scriptPath) {
    try {
        Unblock-File -Path $scriptPath -ErrorAction SilentlyContinue
        . $scriptPath
    } catch {
        Write-Host ("Database protection loader error: " + $_.Exception.Message) -ForegroundColor Yellow
        Write-Host "Run security\\install-protection.ps1 from the project root to repair." -ForegroundColor Yellow
    }
} else {
    # Silent if script is missing to avoid noise on every shell start
}
'@
# Safely inject absolute script path (escape single quotes)
$escapedPath = $protectionScript -replace "'", "''"
$content = $contentTemplate -replace '__PROTECTION_SCRIPT__', $escapedPath

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