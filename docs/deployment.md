# Cloud deployment (internal test MVP)

Deploy a single Linux binary with embedded frontend, SQLite on disk, and HTTPS via Caddy. For local zip distribution see [distribution.md](./distribution.md).

## Prerequisites

- A VPS (Ubuntu 22.04+ recommended) with SSH access
- A domain name with an **A record** pointing to the VPS public IP
- Firewall: allow **22** (SSH), **80**, **443**
- On your build machine: Node.js, Go 1.22+, npm

## Build Linux release binary

From the repo root on Linux or WSL:

```bash
bash scripts/build-dist.sh
```

Cross-compile from Windows (PowerShell) using existing script:

```powershell
$env:GOOS="linux"; $env:GOARCH="amd64"; npm run build:dist
```

Output: `dist/text-idle` (Linux amd64, frontend embedded).

## One-click deploy (Tencent Cloud, no domain)

### Current internal test server

| Item | Value |
|------|--------|
| Public IP | `119.45.224.68` |
| SSH user | `root` (TencentOS on this instance; Ubuntu images often use `ubuntu` — pass `-SshUser`) |
| SSH key (local, do **not** commit) | `D:\docs\tencent cloud key\reason515.pem` |
| Game port | `8080` |
| Register URL | http://119.45.224.68:8080/register |
| Security group (inbound) | **22**, **8080** |

Domain and HTTPS are **not** used for now; access via public IP + port.

### Deploy (copy-paste)

From the **project root** on Windows, run PowerShell **directly** (recommended):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-tencent.ps1 -KeyPath "D:\docs\tencent cloud key\reason515.pem" -SshUser root
```

> **Do not use** `npm run deploy:tencent -- -KeyPath "..."` — npm does not forward `-KeyPath` to the script. The key path (especially with spaces) is split into wrong arguments and `scp`/`ssh` fail with `Permission denied (publickey)`.

Re-run the same command after code changes to upload a new binary (existing DB is backed up on the server first).

### Verify and operate

```powershell
# Public health check
Invoke-WebRequest -Uri "http://119.45.224.68:8080/health" -UseBasicParsing

# SSH shell
ssh -i "D:\docs\tencent cloud key\reason515.pem" root@119.45.224.68

# Follow service logs
ssh -i "D:\docs\tencent cloud key\reason515.pem" root@119.45.224.68 "journalctl -u text-idle -f"

# Manual DB backup on server
ssh -i "D:\docs\tencent cloud key\reason515.pem" root@119.45.224.68 "bash /opt/text-idle/backup-db.sh /var/lib/text-idle/text-idle.db /var/backups/text-idle"
```

### Script flags

| Flag | Default | Meaning |
|------|---------|---------|
| `-KeyPath` | (required) | Local SSH private key (`.pem`) |
| `-ServerHost` | `119.45.224.68` | VPS public IP |
| `-SshUser` | `ubuntu` (script default) | SSH login user; use **`root`** for the current Tencent test VPS |
| `-Port` | `8080` | Game HTTP port |

The script builds the Linux binary, uploads via `scp`, installs the `systemd` service, and runs a `/health` check.

### Reset production data (wipe all players)

Use when you need a **fresh internal test** on the live VPS. This removes the SQLite file at `/var/lib/text-idle/text-idle.db` (accounts, saves, leaderboard, message board, team-name claims). The game binary and systemd service are **not** removed.

**Safety:** a backup is written to `/var/backups/text-idle` **before** deletion. You must pass **`-Confirm`** on the Windows wrapper (or `TEXT_IDLE_RESET_CONFIRM=yes` on the server script).

From the **project root** on Windows:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/reset-prod-data-tencent.ps1 -KeyPath "D:\docs\tencent cloud key\reason515.pem" -SshUser root -Confirm
```

Or on the VPS directly (after copying `scripts/reset-prod-data.sh` or pasting it to `/tmp`):

```bash
sudo TEXT_IDLE_RESET_CONFIRM=yes bash /tmp/reset-prod-data.sh
```

After reset, open http://119.45.224.68:8080/register — GORM recreates empty tables on the next service start.

| Reset script flag | Default | Meaning |
|-------------------|---------|---------|
| `-KeyPath` | (required) | Local SSH private key (`.pem`) |
| `-ServerHost` | `119.45.224.68` | VPS public IP |
| `-SshUser` | `ubuntu` (script default) | Use **`root`** for the current Tencent test VPS |
| `-Port` | `8080` | Game HTTP port (health check after restart) |
| `-Confirm` | off | **Required** to run; omitting it aborts without changes |

Manual steps below remain valid if you prefer step-by-step install or HTTPS with a domain later.

## Install on VPS

```bash
sudo mkdir -p /opt/text-idle /var/lib/text-idle
sudo cp dist/text-idle /opt/text-idle/
sudo chmod +x /opt/text-idle/text-idle
```

Upload the binary with `scp` if you built locally:

```bash
scp dist/text-idle user@your-vps:/tmp/
ssh user@your-vps 'sudo mv /tmp/text-idle /opt/text-idle/ && sudo chmod +x /opt/text-idle/text-idle'
```

## systemd service

Create `/etc/systemd/system/text-idle.service`:

```ini
[Unit]
Description=Text Idle game server
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/lib/text-idle
Environment=PORT=8080
ExecStart=/opt/text-idle/text-idle -db /var/lib/text-idle/text-idle.db
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo chown -R www-data:www-data /var/lib/text-idle
sudo systemctl daemon-reload
sudo systemctl enable --now text-idle
sudo systemctl status text-idle
```

**Listen address**

| Method | Example |
|--------|---------|
| `PORT` env | `Environment=PORT=8080` |
| `LISTEN_ADDR` env | `Environment=LISTEN_ADDR=:8080` |
| CLI flag | `ExecStart=... -addr :8080 -db ...` |

Health check: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/health` should return `200`.

## HTTPS with Caddy

Install [Caddy](https://caddyserver.com/docs/install) on the VPS.

`/etc/caddy/Caddyfile`:

```caddy
your.domain.com {
    reverse_proxy 127.0.0.1:8080
}
```

```bash
sudo systemctl reload caddy
```

Share with friends: `https://your.domain.com/register`

## Data persistence

- SQLite file: `/var/lib/text-idle/text-idle.db` (accounts, saves, leaderboard, message board)
- **Do not** delete this directory when upgrading the binary; only replace `/opt/text-idle/text-idle`
- Back up before upgrades:

```bash
bash scripts/backup-db.sh /var/lib/text-idle/text-idle.db /var/backups/text-idle
```

Optional daily cron (as root):

```cron
0 3 * * * /opt/text-idle/backup-db.sh /var/lib/text-idle/text-idle.db /var/backups/text-idle
```

Copy `scripts/backup-db.sh` to `/opt/text-idle/` on the server.

## Updating

1. Build new binary locally
2. `sudo systemctl stop text-idle`
3. Backup DB (see above)
4. Replace `/opt/text-idle/text-idle`
5. `sudo systemctl start text-idle`

On startup the server runs GORM migrations and backfills leaderboard entries from existing saves.

## Internal test notes

- Registration is email + password only (no email verification in MVP)
- Forgot password: not supported in MVP; use a new account or manual DB fix
- Keep the URL private; invite friends directly
- Monitor: systemd logs (`journalctl -u text-idle -f`), disk space, backup files

## Optional: Docker (not required for MVP)

If you prefer containers later:

1. Multi-stage `Dockerfile`: build frontend + `go build -tags release`
2. Mount volume `/data` for `-db /data/text-idle.db`
3. Put Caddy or another reverse proxy in front for TLS

This is not shipped in the MVP repo; use the systemd path above for the fastest internal test.

## Troubleshooting

| Issue | Check |
|-------|--------|
| Slow page load on every refresh | Release build serves embedded static assets with **gzip** (JS/CSS/HTML) and **Cache-Control** (long cache for hashed `/assets/*`, 7-day for `/fonts/` and `/audio/`). First visit still downloads fonts (~1.5 MB) and JS; SFX preload starts on **first click/key**, not on page load. Remove unused assets before deploy (`npm run build:dist` copies `frontend/dist` only). |
| Blank page after deploy (white screen) | Gin `NoRoute` defaults to HTTP **404**; the SPA static handler must set **200** before writing gzip/HTML/JS. If `/` or `/assets/*.js` return 404 in Network tab, rebuild with a fix that includes `c.Status(http.StatusOK)` in `serveSPA`, redeploy, and hard-refresh (`Ctrl+Shift+R`) to drop a cached 404 `index.html`. |
| `Permission denied (publickey)` right after deploy script starts upload | Use **PowerShell directly** with quoted `-KeyPath` (not `npm run deploy:tencent -- -KeyPath ...`). On this VPS use **`-SshUser root`**. Confirm the `.pem` matches the instance key in Tencent Cloud console |
| `UNPROTECTED PRIVATE KEY FILE` / `bad permissions` (Windows) | Restrict `.pem` ACL to your user only (PowerShell): `icacls "D:\docs\tencent cloud key\reason515.pem" /inheritance:r; icacls "D:\docs\tencent cloud key\reason515.pem" /grant:r "$($env:USERNAME):(R)"; icacls "D:\docs\tencent cloud key\reason515.pem" /remove "Authenticated Users"; icacls "D:\docs\tencent cloud key\reason515.pem" /remove "Users"` |
| SSH hangs / timeout | Security group inbound **22**; instance running; correct public IP |
| 502 from Caddy | `systemctl status text-idle`, port 8080 listening |
| Empty leaderboard | Players need >= 1000 lifetime exploration steps (`leaderboardTrack.lifetimeSteps`) |
| Saves lost after restart | DB path must be on persistent volume, not inside ephemeral `/tmp` |
| Permission denied on DB | `chown www-data:www-data /var/lib/text-idle` |
| Need empty production DB | Use [Reset production data](#reset-production-data-wipe-all-players); confirm backup under `/var/backups/text-idle` first |
