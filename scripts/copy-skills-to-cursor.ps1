$src = Join-Path $PSScriptRoot '..\.agent\skills'
$dst = Join-Path $PSScriptRoot '..\.cursor\skills'

New-Item -ItemType Directory -Path $dst -Force | Out-Null

$dirs = Get-ChildItem $src -Directory
foreach ($d in $dirs) {
    $destDir = Join-Path $dst $d.Name
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    $skillFile = Join-Path $d.FullName 'SKILL.md'
    if (Test-Path $skillFile) {
        Copy-Item $skillFile -Destination $destDir -Force
    }
    if (Test-Path (Join-Path $d.FullName 'scripts')) {
        Copy-Item (Join-Path $d.FullName 'scripts') -Destination $destDir -Recurse -Force
    }
    if (Test-Path (Join-Path $d.FullName 'references')) {
        Copy-Item (Join-Path $d.FullName 'references') -Destination $destDir -Recurse -Force
    }
    if (Test-Path (Join-Path $d.FullName 'assets')) {
        Copy-Item (Join-Path $d.FullName 'assets') -Destination $destDir -Recurse -Force
    }
}

$count = (Get-ChildItem $dst -Directory).Count
Write-Host "Copied $count skills to .cursor/skills"
