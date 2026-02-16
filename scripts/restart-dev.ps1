# Restart dev servers for manual testing
# Usage: npm run dev:restart
# Or: powershell -ExecutionPolicy Bypass -File scripts/restart-dev.ps1

$ErrorActionPreference = "SilentlyContinue"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
Set-Location $projectRoot

function Stop-ProcessOnPort {
    param([int]$Port)
    $pids = @()
    $output = cmd /c "netstat -ano | findstr `":$Port `" | findstr LISTENING"
    if ($output) {
        $lines = $output -split "`n"
        foreach ($line in $lines) {
            $line = $line.Trim()
            if ($line -match '\s+(\d+)\s*$') {
                $pids += [int]$Matches[1]
            }
        }
    }
    $pids = $pids | Sort-Object -Unique
    foreach ($p in $pids) {
        if ($p -gt 0) {
            Write-Host "Stopping process $p on port $Port..."
            cmd /c "taskkill /PID $p /F /T"
        }
    }
    return $pids.Count -gt 0
}

Write-Host "`n=== Stopping existing dev servers ===" -ForegroundColor Yellow
$stopped8080 = Stop-ProcessOnPort -Port 8080
$stopped5173 = Stop-ProcessOnPort -Port 5173

if ($stopped8080 -or $stopped5173) {
    Write-Host "Waiting for ports to be released..." -ForegroundColor Gray
    for ($i = 1; $i -le 5; $i++) {
        Start-Sleep -Seconds 1
        $check8080 = cmd /c "netstat -ano | findstr :8080 | findstr LISTENING"
        $check5173 = cmd /c "netstat -ano | findstr :5173 | findstr LISTENING"
        if (-not $check8080 -and -not $check5173) { break }
        if ($i -eq 5) {
            Write-Host "Warning: Ports may still be in use. Trying to start anyway..." -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "No processes found on ports 8080 or 5173." -ForegroundColor Gray
}

Write-Host "`n=== Starting backend and frontend ===" -ForegroundColor Green
Write-Host "Backend:  http://localhost:8080" -ForegroundColor Gray
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Gray
Write-Host "Press Ctrl+C to stop both.`n" -ForegroundColor Gray

npx concurrently -k -s first -n "backend,frontend" -c "blue,green" `
    "go run ./cmd/server" `
    "cd frontend && npm run dev"
