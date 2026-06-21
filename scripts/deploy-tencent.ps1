# One-click deploy to Tencent Cloud VPS (HTTP via public IP, no domain).
# Run from project root:
#   powershell -ExecutionPolicy Bypass -File scripts/deploy-tencent.ps1 -KeyPath "D:\docs\tencent cloud key\reason515.pem"
#
# Current server: 119.45.224.68:8080  ->  http://119.45.224.68:8080/register
#
# Prerequisites on the server:
#   - Ubuntu 22.04+ (or similar) with SSH access
#   - Security group: inbound TCP 22 (SSH) and 8080 (game HTTP)

param(
  [Parameter(Mandatory = $true)]
  [string]$KeyPath,

  [string]$ServerHost = "119.45.224.68",

  [string]$SshUser = "ubuntu",

  [int]$Port = 8080
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not (Test-Path -LiteralPath $KeyPath)) {
  Write-Error "SSH key not found: $KeyPath"
}

$KeyPath = (Resolve-Path -LiteralPath $KeyPath).Path
$SshTarget = "${SshUser}@${ServerHost}"
$SshArgs = @("-i", $KeyPath, "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=15")
$GameUrl = "http://${ServerHost}:${Port}/register"

Write-Host "=== Text Idle deploy ===" -ForegroundColor Cyan
Write-Host "Target: $SshTarget"
Write-Host "Game URL (after deploy): $GameUrl"
Write-Host ""

Write-Host "[1/4] Building Linux release binary..." -ForegroundColor Cyan
$env:GOOS = "linux"
$env:GOARCH = "amd64"
& "$PSScriptRoot\build-dist.ps1"
if ($LASTEXITCODE -ne 0) { exit 1 }

$Binary = Join-Path $Root "dist\text-idle"
if (-not (Test-Path -LiteralPath $Binary)) {
  Write-Error "Build output missing: $Binary"
}

Write-Host "[2/4] Uploading files..." -ForegroundColor Cyan
$ScpArgs = @("-i", $KeyPath, "-o", "StrictHostKeyChecking=accept-new")
& scp @ScpArgs $Binary "${SshTarget}:/tmp/text-idle"
if ($LASTEXITCODE -ne 0) { exit 1 }
& scp @ScpArgs "$PSScriptRoot\backup-db.sh" "${SshTarget}:/tmp/backup-db.sh"
if ($LASTEXITCODE -ne 0) { exit 1 }
& scp @ScpArgs "$PSScriptRoot\deploy-remote-setup.sh" "${SshTarget}:/tmp/deploy-remote-setup.sh"
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "[3/4] Installing on server (systemd)..." -ForegroundColor Cyan
$RemoteCmd = "sudo TEXT_IDLE_PORT=$Port bash /tmp/deploy-remote-setup.sh"
& ssh @SshArgs $SshTarget $RemoteCmd
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "[4/4] Verifying public health endpoint..." -ForegroundColor Cyan
try {
  $HealthUrl = "http://${ServerHost}:${Port}/health"
  $resp = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 20
  if ($resp.StatusCode -ne 200) {
    Write-Warning "Public health returned $($resp.StatusCode). Check Tencent Cloud security group (TCP $Port)."
  }
} catch {
  Write-Warning "Could not reach $HealthUrl from this machine."
  Write-Warning "If SSH install succeeded, open security group inbound TCP $Port and try: $GameUrl"
}

Write-Host ""
Write-Host "Deploy complete." -ForegroundColor Green
Write-Host "Register: $GameUrl" -ForegroundColor Yellow
Write-Host "Logs:     ssh -i `"$KeyPath`" $SshTarget `"sudo journalctl -u text-idle -f`"" -ForegroundColor Yellow
Write-Host "Backup:   ssh -i `"$KeyPath`" $SshTarget `"sudo bash /opt/text-idle/backup-db.sh /var/lib/text-idle/text-idle.db /var/backups/text-idle`"" -ForegroundColor Yellow
