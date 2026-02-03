# QMD collection setup for this project
# Prerequisites: Bun and QMD installed globally (bun install -g github:tobi/qmd)
# Uses bun.exe + qmd.ts directly to avoid the qmd bash launcher (fixes execvpe(/bin/bash) on Windows).

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$bun = "$env:USERPROFILE\.bun\bin\bun.exe"
$qmdTs = "$env:USERPROFILE\.bun\install\global\node_modules\qmd\src\qmd.ts"
if (-not (Test-Path $bun)) { throw "Bun not found at $bun" }
if (-not (Test-Path $qmdTs)) { throw "QMD package not found at $qmdTs" }

# Ensure QMD cache dir exists and set INDEX_PATH so SQLite can open the DB (avoids path/homedir issues)
$cacheDir = if ($env:XDG_CACHE_HOME) { $env:XDG_CACHE_HOME } else { Join-Path $env:USERPROFILE ".cache" }
$qmdCacheDir = Join-Path $cacheDir "qmd"
if (-not (Test-Path $qmdCacheDir)) {
  New-Item -ItemType Directory -Path $qmdCacheDir -Force | Out-Null
  Write-Host "Created QMD cache dir: $qmdCacheDir"
}
$env:INDEX_PATH = Join-Path $qmdCacheDir "index.sqlite"

function Run-Qmd {
  param([string[]]$CmdArgs)
  & $bun $qmdTs @CmdArgs
  if ($LASTEXITCODE -ne 0) { throw "qmd failed: $CmdArgs" }
}

$docsPath = (Resolve-Path -LiteralPath (Join-Path $ProjectRoot "docs")).Path
$plansPath = (Resolve-Path -LiteralPath (Join-Path (Join-Path $ProjectRoot ".cursor") "plans")).Path

Write-Host "Adding QMD collections from project root: $ProjectRoot"
Write-Host "  docs:  $docsPath"
Write-Host "  plans: $plansPath"

# Idempotent: remove if present so add always uses current paths (ignore "not found")
foreach ($name in @("docs", "plans")) {
  try { Run-Qmd "collection", "remove", $name } catch { }
}
Run-Qmd "collection", "add", $docsPath, "--name", "docs"
Run-Qmd "collection", "add", $plansPath, "--name", "plans"

Write-Host "Adding context..."
Run-Qmd "context", "add", "qmd://docs", "Project documentation"
Run-Qmd "context", "add", "qmd://plans", "Cursor plans"

Write-Host "Indexing (BM25)..."
Run-Qmd "update"

Write-Host "Generating embeddings (first run may download models)..."
Run-Qmd "embed"

Write-Host "Done. Run 'qmd status' (or bun run qmd status) to verify."
