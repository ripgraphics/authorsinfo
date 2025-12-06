# Script to update all npm packages to latest versions
# Run this script when npm registry is accessible: .\update-packages.ps1

Write-Host "Reading package.json..."
$packageJson = Get-Content "package.json" | ConvertFrom-Json

Write-Host "Updating dependencies..."
$dependencies = $packageJson.dependencies.PSObject.Properties
foreach ($dep in $dependencies) {
    Write-Host "Updating $($dep.Name) to latest..."
    npm install "$($dep.Name)@latest" --save --no-audit
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Failed to update $($dep.Name)"
    }
}

Write-Host "`nUpdating devDependencies..."
$devDependencies = $packageJson.devDependencies.PSObject.Properties
foreach ($dep in $devDependencies) {
    Write-Host "Updating $($dep.Name) to latest..."
    npm install "$($dep.Name)@latest" --save-dev --no-audit
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Failed to update $($dep.Name)"
    }
}

Write-Host "`nAll packages updated! Run 'npm install' to ensure everything is installed correctly."

