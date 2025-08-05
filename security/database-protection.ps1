# DATABASE PROTECTION SYSTEM
# This script prevents accidental database resets and requires a secret passcode

$PROTECTED_COMMANDS = @(
    "supabase db reset",
    "supabase db push --reset",
    "npx supabase db reset",
    "npm run db:reset"
)

$SECRET_PASSCODE = "ENTERPRISE_SECURE_2025_DB_RESET"

function Invoke-ProtectedCommand {
    param(
        [string]$Command,
        [string[]]$Arguments
    )
    
    $fullCommand = "$Command $($Arguments -join ' ')"
    
    # Check if this is a protected command
    $isProtected = $false
    foreach ($protectedCmd in $PROTECTED_COMMANDS) {
        if ($fullCommand -like "*$protectedCmd*") {
            $isProtected = $true
            break
        }
    }
    
    if (-not $isProtected) {
        # Not a protected command, execute normally
        & $Command @Arguments
        return
    }
    
    # Protected command detected
    Write-Host "🚨 PROTECTED DATABASE OPERATION DETECTED!" -ForegroundColor Red
    Write-Host "🔒 This command requires security authorization." -ForegroundColor Yellow
    Write-Host "Command: $fullCommand" -ForegroundColor Cyan
    Write-Host ""
    
    # Require passcode
    $userPasscode = Read-Host "Enter security passcode to proceed"
    
    if ($userPasscode -eq $SECRET_PASSCODE) {
        Write-Host "✅ Passcode verified. Executing protected operation..." -ForegroundColor Green
        
        # Log the authorized operation
        $logEntry = @{
            timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            user = $env:USERNAME
            command = $fullCommand
            status = "AUTHORIZED"
            workingDirectory = Get-Location
        }
        
        $logFile = "security/authorized_operations.log"
        New-Item -Path $logFile -Force | Out-Null
        $logEntry | ConvertTo-Json -Compress | Add-Content $logFile
        
        # Execute the command
        & $Command @Arguments
    }
    else {
        Write-Host "❌ INVALID PASSCODE - Operation BLOCKED!" -ForegroundColor Red
        Write-Host "🔒 Database reset operation has been prevented." -ForegroundColor Yellow
        
        # Log the blocked attempt
        $logEntry = @{
            timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            user = $env:USERNAME
            command = $fullCommand
            status = "BLOCKED"
            reason = "Invalid passcode"
            workingDirectory = Get-Location
        }
        
        $logFile = "security/blocked_operations.log"
        New-Item -Path $logFile -Force | Out-Null
        $logEntry | ConvertTo-Json -Compress | Add-Content $logFile
        
        throw "Security: Unauthorized database operation blocked"
    }
}

# Override the supabase command
function supabase {
    Invoke-ProtectedCommand -Command "supabase" -Arguments $args
}

# Override npx for supabase commands
$originalNpx = Get-Command npx -ErrorAction SilentlyContinue
function npx {
    if ($args[0] -eq "supabase" -and ($args -contains "reset" -or ($args -contains "db" -and $args -contains "reset"))) {
        Invoke-ProtectedCommand -Command "npx" -Arguments $args
    }
    else {
        & $originalNpx @args
    }
}

Write-Host "🛡️ Database Protection System Active" -ForegroundColor Green
Write-Host "🔒 All destructive database operations are now protected" -ForegroundColor Yellow