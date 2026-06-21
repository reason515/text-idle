# One-click wipe production SQLite on Tencent Cloud VPS (keeps binary + systemd).
# Run from project root (PowerShell directly — do not pass -KeyPath via npm):
#   powershell -ExecutionPolicy Bypass -File scripts/reset-prod-data-tencent.ps1 `
#     -KeyPath "D:\docs\tencent cloud key\reason515.pem" -SshUser root -Confirm
#
# Deletes all accounts, saves, leaderboard rows, message board posts, and team-name claims.
# A backup is written under /var/backups/text-idle before deletion.

param(
  [Parameter(Mandatory = $true)]
  [string]$KeyPath,

  [string]$ServerHost = "119.45.224.68",

  [string]$SshUser = "root",

  [int]$Port = 8080,

  [switch]$Confirm
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not $Confirm) {
  Write-Error @"
Refusing to run without -Confirm.

This permanently wipes player data on ${ServerHost}:
  /var/lib/text-idle/text-idle.db

A backup is taken first under /var/backups/text-idle.

Re-run with -Confirm when you are sure.
"@
}

if (-not (Test-Path -LiteralPath $KeyPath)) {
  Write-Error "SSH key not found: $KeyPath"
}

$KeyPath = (Resolve-Path -LiteralPath $KeyPath).Path
$SshTarget = "${SshUser}@${ServerHost}"
$SshArgs = @("-i", $KeyPath, "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=15")
$GameUrl = "http://${ServerHost}:${Port}/register"

Write-Host "=== Text Idle production data reset ===" -ForegroundColor Red
Write-Host "Target: $SshTarget"
Write-Host "This will DELETE all player data after backing up the current DB."
Write-Host ""

Write-Host "[1/2] Uploading reset script..." -ForegroundColor Cyan
$ScpArgs = @("-i", $KeyPath, "-o", "StrictHostKeyChecking=accept-new")
& scp @ScpArgs "$PSScriptRoot\reset-prod-data.sh" "${SshTarget}:/tmp/reset-prod-data.sh"
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "[2/2] Running reset on server..." -ForegroundColor Cyan
$RemoteCmd = "TEXT_IDLE_PORT=$Port TEXT_IDLE_RESET_CONFIRM=yes bash /tmp/reset-prod-data.sh"
& ssh @SshArgs $SshTarget $RemoteCmd
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "Reset complete." -ForegroundColor Green
Write-Host "Register (fresh): $GameUrl" -ForegroundColor Yellow
Write-Host "Backups on server: ssh -i `"$KeyPath`" $SshTarget `"ls -lt /var/backups/text-idle | head`"" -ForegroundColor Yellow
