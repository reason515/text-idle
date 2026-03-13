# Build and package Text Idle for distribution.
# Creates dist/text-idle-<platform>.zip with executable and README.
# Run from project root.

$ErrorActionPreference = "Stop"
& "$PSScriptRoot\build-dist.ps1"
if ($LASTEXITCODE -ne 0) { exit 1 }

Set-Location $PSScriptRoot\..

$platform = "windows"
if ($env:GOOS) {
    $platform = $env:GOOS
    if ($env:GOARCH) { $platform = "$platform-$env:GOARCH" }
}

$exe = if ($platform -match "windows") { "text-idle.exe" } else { "text-idle" }
$zipName = "text-idle-$platform.zip"
$zipPath = "dist\$zipName"

# Create temp folder for package contents
$pkgDir = "dist\pkg-temp"
if (Test-Path $pkgDir) { Remove-Item $pkgDir -Recurse -Force }
New-Item -ItemType Directory -Path $pkgDir -Force | Out-Null

Copy-Item "dist\$exe" -Destination $pkgDir -Force
$readmeSrc = "scripts\README-DIST.txt"
$readmePath = "$pkgDir\README.txt"
if (Test-Path $readmeSrc) {
    Copy-Item $readmeSrc -Destination $readmePath -Force
} else {
    @"
Text Idle - How to Run
======================

1. Run $exe (double-click or from terminal)
2. Open browser: http://localhost:8080
3. Register an account and play!

The game saves progress in text-idle.db (created in the same folder).
"@ | Set-Content $readmePath -Encoding UTF8
}

# Create zip
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path "$pkgDir\*" -DestinationPath $zipPath -Force
Remove-Item $pkgDir -Recurse -Force

Write-Host "Package created: $zipPath" -ForegroundColor Green
