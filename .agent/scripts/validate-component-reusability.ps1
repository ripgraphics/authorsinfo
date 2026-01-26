# Component Reusability Validation Script (PowerShell)
# Validates that components follow reusability requirements

param(
    [Parameter(Mandatory=$true)]
    [string]$ComponentFile
)

if (-not (Test-Path $ComponentFile)) {
    Write-Host "❌ Error: File not found: $ComponentFile" -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Validating component reusability: $ComponentFile" -ForegroundColor Cyan
Write-Host ""

$Errors = 0
$Warnings = 0
$Content = Get-Content $ComponentFile -Raw

# Check 1: No hardcoded fetch calls in presentational components
Write-Host "✓ Checking for hardcoded API calls..." -ForegroundColor Yellow
if ($Content -match '(?<!Container|container|//.*|/\*.*)fetch|\.get|\.post|\.put|\.delete') {
    Write-Host "  ❌ FAIL: Hardcoded API calls found. Extract to container component." -ForegroundColor Red
    $Content -split "`n" | Select-String -Pattern 'fetch|\.get|\.post|\.put|\.delete' | 
        Where-Object { $_ -notmatch 'Container|container|//.*fetch|/\*.*fetch' } | 
        ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    $Errors++
} else {
    Write-Host "  ✅ PASS: No hardcoded API calls" -ForegroundColor Green
}

# Check 2: No direct data hooks in presentational components
Write-Host ""
Write-Host "✓ Checking for direct data hooks..." -ForegroundColor Yellow
if ($Content -match '(?<!Container|container|//.*|/\*.*)useAuth|useQuery|useSWR|useContext.*User|useContext.*Auth') {
    Write-Host "  ❌ FAIL: Direct data hooks found. Pass data via props instead." -ForegroundColor Red
    $Content -split "`n" | Select-String -Pattern 'useAuth|useQuery|useSWR|useContext.*User|useContext.*Auth' | 
        Where-Object { $_ -notmatch 'Container|container|//.*useAuth|/\*.*useAuth' } | 
        ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    $Errors++
} else {
    Write-Host "  ✅ PASS: No direct data hooks" -ForegroundColor Green
}

# Check 3: Has proper TypeScript interface
Write-Host ""
Write-Host "✓ Checking for props interface..." -ForegroundColor Yellow
if ($Content -notmatch 'interface.*Props|type.*Props') {
    Write-Host "  ❌ FAIL: Missing props interface. Add TypeScript interface." -ForegroundColor Red
    $Errors++
} else {
    Write-Host "  ✅ PASS: Props interface found" -ForegroundColor Green
    Write-Host "  Interface:" -ForegroundColor Gray
    $Content -split "`n" | Select-String -Pattern 'interface.*Props|type.*Props' -Context 0,10 | 
        Select-Object -First 5 | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
}

# Check 4: No 'any' types in props
Write-Host ""
Write-Host "✓ Checking for type safety..." -ForegroundColor Yellow
if ($Content -match '(?<!//.*|/\*.*):\s*any|any\s*>') {
    Write-Host "  ⚠️  WARNING: 'any' types found. Use proper types for reusability." -ForegroundColor Yellow
    $Content -split "`n" | Select-String -Pattern ':\s*any|any\s*>' | 
        Where-Object { $_ -notmatch '//.*any|/\*.*any' } | 
        Select-Object -First 3 | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    $Warnings++
} else {
    Write-Host "  ✅ PASS: No 'any' types in props" -ForegroundColor Green
}

# Check 5: Component is exported
Write-Host ""
Write-Host "✓ Checking component export..." -ForegroundColor Yellow
if ($Content -notmatch 'export.*function|export.*const.*=') {
    Write-Host "  ❌ FAIL: Component not exported. Add export statement." -ForegroundColor Red
    $Errors++
} else {
    Write-Host "  ✅ PASS: Component is exported" -ForegroundColor Green
}

# Check 6: Uses established UI patterns
Write-Host ""
Write-Host "✓ Checking for UI pattern usage..." -ForegroundColor Yellow
if ($Content -match "from '@/components/ui/|from `"@/components/ui/") {
    Write-Host "  ✅ PASS: Uses established UI components" -ForegroundColor Green
    Write-Host "  UI components used:" -ForegroundColor Gray
    $Content | Select-String -Pattern "from '@/components/ui/[^']*|from `"@/components/ui/[^`"]*" -AllMatches | 
        ForEach-Object { $_.Matches } | ForEach-Object { $_.Value } | 
        Sort-Object -Unique | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
} else {
    Write-Host "  ⚠️  WARNING: Consider using established UI components from @/components/ui/" -ForegroundColor Yellow
    $Warnings++
}

# Check 7: No hardcoded endpoints
Write-Host ""
Write-Host "✓ Checking for hardcoded API endpoints..." -ForegroundColor Yellow
if ($Content -match "(?<!Container|container|//.*|/\*.*)'/api/|`"/api/") {
    Write-Host "  ❌ FAIL: Hardcoded API endpoints found. Extract to container component." -ForegroundColor Red
    $Content -split "`n" | Select-String -Pattern "'/api/|`"/api/" | 
        Where-Object { $_ -notmatch 'Container|container|//.*api|/\*.*api' } | 
        Select-Object -First 3 | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    $Errors++
} else {
    Write-Host "  ✅ PASS: No hardcoded API endpoints" -ForegroundColor Green
}

# Check 8: Component name matches file name
Write-Host ""
Write-Host "✓ Checking component naming..." -ForegroundColor Yellow
$FileName = [System.IO.Path]::GetFileNameWithoutExtension($ComponentFile)
if ($Content -match "export.*function $FileName|export.*const $FileName") {
    Write-Host "  ✅ PASS: Component name matches file name" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  WARNING: Component name should match file name for better discoverability" -ForegroundColor Yellow
    $Warnings++
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Validation Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Errors:   $Errors" -ForegroundColor $(if ($Errors -gt 0) { "Red" } else { "Green" })
Write-Host "  Warnings: $Warnings" -ForegroundColor $(if ($Warnings -gt 0) { "Yellow" } else { "Green" })

if ($Errors -eq 0 -and $Warnings -eq 0) {
    Write-Host ""
    Write-Host "✅ VALIDATION PASSED" -ForegroundColor Green
    Write-Host "Component is fully reusable and ready for use!" -ForegroundColor Green
    exit 0
} elseif ($Errors -eq 0) {
    Write-Host ""
    Write-Host "⚠️  VALIDATION PASSED WITH WARNINGS" -ForegroundColor Yellow
    Write-Host "Component is reusable but could be improved." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host ""
    Write-Host "❌ VALIDATION FAILED" -ForegroundColor Red
    Write-Host "Component is NOT reusable. Please fix the errors above." -ForegroundColor Red
    exit 1
}