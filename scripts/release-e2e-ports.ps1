# Release ports 8080 and 5173 before running E2E tests.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/release-e2e-ports.ps1
# Always exits 0 so npm run e2e continues even if some processes could not be killed.

$ErrorActionPreference = "SilentlyContinue"

function Stop-ProcessOnPort {
    param([int]$Port)
    $stopped = $false
    $netstat = netstat -ano
    $lines = $netstat | Where-Object { $_ -match ":$Port\s" -and $_ -match "LISTENING" }
    $pids = @()
    foreach ($line in $lines) {
        if ($line -match '\s+(\d+)\s*$') {
            $procId = [int]$Matches[1]
            if ($procId -gt 0 -and $pids -notcontains $procId) {
                $pids += $procId
            }
        }
    }
    foreach ($procId in $pids) {
        Write-Host "Stopping process $procId on port $Port..."
        $null = cmd /c "taskkill /PID $procId /F /T"
        $stopped = $true
    }
    return $stopped
}

try {
    $stopped8080 = Stop-ProcessOnPort -Port 8080
    $stopped5173 = Stop-ProcessOnPort -Port 5173

    if ($stopped8080 -or $stopped5173) {
        Write-Host "Waiting for ports to be released..."
        Start-Sleep -Seconds 5
    } else {
        Write-Host "Ports 8080 and 5173 are free."
    }
} finally {
    exit 0
}
