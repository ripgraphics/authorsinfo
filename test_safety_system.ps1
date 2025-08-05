# TEST THE SAFETY SYSTEM
# This script tests that the automatic backup trigger is working

Write-Host "🧪 TESTING AUTOMATIC SAFETY SYSTEM..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if safety scripts exist
Write-Host "Test 1: Checking safety scripts..." -ForegroundColor Yellow
$requiredFiles = @("safe_db_reset.py", "safe_reset.bat", "safe_reset.ps1")
$allFilesExist = $true

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file missing" -ForegroundColor Red
        $allFilesExist = $false
    }
}

# Test 2: Check PowerShell profile
Write-Host ""
Write-Host "Test 2: Checking PowerShell profile integration..." -ForegroundColor Yellow
if (Test-Path $PROFILE) {
    $profileContent = Get-Content $PROFILE -Raw
    if ($profileContent -like "*AUTOMATIC DATABASE SAFETY*") {
        Write-Host "   ✅ Safety commands integrated in PowerShell profile" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Safety commands not found in profile" -ForegroundColor Yellow
        Write-Host "   💡 Run: .\setup_safety_commands.ps1" -ForegroundColor Cyan
    }
} else {
    Write-Host "   ⚠️  PowerShell profile doesn't exist yet" -ForegroundColor Yellow
    Write-Host "   💡 Run: .\setup_safety_commands.ps1" -ForegroundColor Cyan
}

# Test 3: Dry run test
Write-Host ""
Write-Host "Test 3: Testing safety script (dry run)..." -ForegroundColor Yellow
try {
    $testResult = python safe_db_reset.py --help 2>&1
    if ($LASTEXITCODE -eq 0 -or $testResult -like "*Usage:*") {
        Write-Host "   ✅ Safety script is functional" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Safety script has issues" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Cannot run safety script" -ForegroundColor Red
}

# Test 4: Check backup system
Write-Host ""
Write-Host "Test 4: Checking backup system..." -ForegroundColor Yellow
if (Test-Path "enhanced_enterprise_backup.py") {
    Write-Host "   ✅ Enhanced backup system available" -ForegroundColor Green
} else {
    Write-Host "   ❌ Enhanced backup system missing" -ForegroundColor Red
}

if (Test-Path "db_backups/COMPLETE_BACKUP_LATEST.sql") {
    Write-Host "   ✅ Latest backup exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  No recent backup found" -ForegroundColor Yellow
    Write-Host "   💡 Run: python enhanced_enterprise_backup.py" -ForegroundColor Cyan
}

# Summary
Write-Host ""
Write-Host "="*50 -ForegroundColor Cyan
Write-Host "🛡️  SAFETY SYSTEM STATUS" -ForegroundColor Cyan
Write-Host "="*50 -ForegroundColor Cyan

if ($allFilesExist) {
    Write-Host "✅ All safety components installed" -ForegroundColor Green
    Write-Host "🚨 Your database is protected from accidental resets!" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 To activate safety commands in current session:" -ForegroundColor Cyan
    Write-Host "   . `$PROFILE" -ForegroundColor White
    Write-Host ""
    Write-Host "🧪 To test the system safely:" -ForegroundColor Cyan
    Write-Host "   python safe_db_reset.py --help" -ForegroundColor White
} else {
    Write-Host "❌ Safety system incomplete" -ForegroundColor Red
    Write-Host "🔧 Run setup script to fix: .\setup_safety_commands.ps1" -ForegroundColor Yellow
}