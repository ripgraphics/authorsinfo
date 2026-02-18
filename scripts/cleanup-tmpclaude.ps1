Write-Host "Removing tmpclaude-* files in repo root..."

try {
  $items = Get-ChildItem -Path . -Filter 'tmpclaude-*' -Force -ErrorAction Stop
} catch {
  $items = @()
}

foreach ($it in $items) {
  try {
    Remove-Item -LiteralPath $it.FullName -Recurse -Force -ErrorAction Stop
    Write-Host "Removed $($it.Name)"
  } catch {
    Write-Warning "Failed to remove $($it.FullName): $($_.Exception.Message)"
  }
}

Write-Host "Done."
