# Build Text Idle for distribution (single executable with embedded frontend).
# Output: dist/text-idle.exe (Windows) or dist/text-idle (Linux/macOS)
# Run from project root.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "Building frontend..." -ForegroundColor Cyan
Set-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }
Set-Location ..

Write-Host "Copying frontend build to internal/static/web..." -ForegroundColor Cyan
$webDir = "internal\static\web"
if (-not (Test-Path $webDir)) { New-Item -ItemType Directory -Path $webDir -Force | Out-Null }
Remove-Item "$webDir\*" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item "frontend\dist\*" -Destination $webDir -Recurse -Force

Write-Host "Building Go binary (release)..." -ForegroundColor Cyan
$outDir = "dist"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }

$exe = if ($env:GOOS -eq "linux" -or $env:GOOS -eq "darwin") { "text-idle" } else { "text-idle.exe" }
go build -tags release -o "$outDir\$exe" ./cmd/server

if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "Done. Output: $outDir\$exe" -ForegroundColor Green
Write-Host "Run: .\$outDir\$exe" -ForegroundColor Yellow
Write-Host "Then open: http://localhost:8080" -ForegroundColor Yellow
