# Run full E2E stack (backend + frontend + Playwright).
#
# Usage:
#   npm run e2e
#   npm run e2e:fast
#   npm run e2e:fast -- --grep "monsters panel"
#   $env:E2E_PLAYWRIGHT_GREP = "monsters panel|server-combat-tick"; npm run e2e:fast

param(
    [switch]$Fast,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$PlaywrightArgs
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

& "$PSScriptRoot/release-e2e-ports.ps1"

$grepFile = Join-Path $PWD ".e2e-grep.txt"
if (Test-Path $grepFile) { Remove-Item -Force $grepFile }

if ($PlaywrightArgs -match '^--workers=(\d+)$' -or ($PlaywrightArgs -contains '--workers')) {
    $idx = [array]::IndexOf($PlaywrightArgs, '--workers')
    if ($idx -ge 0 -and $PlaywrightArgs.Count -gt ($idx + 1)) {
        $env:E2E_WORKERS = $PlaywrightArgs[$idx + 1]
    } elseif ($PlaywrightArgs -match '^--workers=(\d+)$') {
        $env:E2E_WORKERS = $Matches[1]
    }
}
if (-not $env:E2E_WORKERS) {
    $workers = if ($Fast) { 4 } else { 2 }
    $env:E2E_WORKERS = [string]$workers
} else {
    $workers = $env:E2E_WORKERS
}

$grepPattern = $env:E2E_PLAYWRIGHT_GREP
if (-not $grepPattern -and $PlaywrightArgs.Count -gt 0) {
    if ($PlaywrightArgs[0] -eq '--grep' -and $PlaywrightArgs.Count -ge 2) {
        $grepPattern = $PlaywrightArgs[1]
    } elseif ($PlaywrightArgs[0] -match '^--grep=(.+)$') {
        $grepPattern = $Matches[1]
    } elseif ($PlaywrightArgs[0] -notmatch '^--') {
        $grepPattern = ($PlaywrightArgs -join ' ')
    }
}
if ($grepPattern) {
    Set-Content -Path $grepFile -Value $grepPattern -Encoding ascii -NoNewline
    Write-Host "E2E: workers=$workers grep=$grepPattern"
} else {
    Write-Host "E2E: workers=$workers grep=(all tests)"
}

$playwrightJob = 'wait-on http-get://localhost:5173 http-get://localhost:8080/health && node scripts/run-e2e-playwright.js'

npx concurrently -k -s first -n backend,frontend,playwright `
    "go run ./cmd/server -db text-idle.e2e.db" `
    "cd frontend && npm run dev" `
    $playwrightJob

$code = $LASTEXITCODE
if (Test-Path $grepFile) { Remove-Item -Force $grepFile }
exit $code
