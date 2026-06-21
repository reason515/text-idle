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

- SQLite file: `/var/lib/text-idle/text-idle.db` (accounts + saves + leaderboard)
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
| 502 from Caddy | `systemctl status text-idle`, port 8080 listening |
| Empty leaderboard | Players need >= 100 exploration steps in current stats period |
| Saves lost after restart | DB path must be on persistent volume, not inside ephemeral `/tmp` |
| Permission denied on DB | `chown www-data:www-data /var/lib/text-idle` |
