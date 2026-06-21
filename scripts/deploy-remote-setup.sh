#!/usr/bin/env bash
# Server-side install/update for text-idle (run via deploy-tencent.ps1).
# Requires files in /tmp: text-idle, backup-db.sh

set -euo pipefail

INSTALL_DIR="/opt/text-idle"
DATA_DIR="/var/lib/text-idle"
BACKUP_DIR="/var/backups/text-idle"
SERVICE_USER="www-data"
PORT="${TEXT_IDLE_PORT:-8080}"
DB_PATH="${DATA_DIR}/text-idle.db"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root (use sudo)." >&2
  exit 1
fi

for f in /tmp/text-idle /tmp/backup-db.sh; do
  if [[ ! -f "$f" ]]; then
    echo "Missing upload: $f" >&2
    exit 1
  fi
done

mkdir -p "$INSTALL_DIR" "$DATA_DIR" "$BACKUP_DIR"

if id "$SERVICE_USER" &>/dev/null; then
  :
elif command -v useradd &>/dev/null; then
  useradd --system --no-create-home --shell /usr/sbin/nologin "$SERVICE_USER"
else
  echo "User $SERVICE_USER not found and useradd unavailable." >&2
  exit 1
fi

if [[ -f "$DB_PATH" ]] && [[ -x "${INSTALL_DIR}/backup-db.sh" ]]; then
  echo "Backing up existing database..."
  bash "${INSTALL_DIR}/backup-db.sh" "$DB_PATH" "$BACKUP_DIR" || true
fi

install -m 755 /tmp/text-idle "${INSTALL_DIR}/text-idle"
install -m 755 /tmp/backup-db.sh "${INSTALL_DIR}/backup-db.sh"
chown -R "${SERVICE_USER}:${SERVICE_USER}" "$DATA_DIR"

cat > /etc/systemd/system/text-idle.service <<EOF
[Unit]
Description=Text Idle game server
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
Group=${SERVICE_USER}
WorkingDirectory=${DATA_DIR}
Environment=PORT=${PORT}
ExecStart=${INSTALL_DIR}/text-idle -db ${DB_PATH}
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable text-idle
systemctl restart text-idle

sleep 2
if ! systemctl is-active --quiet text-idle; then
  echo "text-idle service failed to start:" >&2
  journalctl -u text-idle -n 30 --no-pager >&2 || true
  exit 1
fi

HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/health" || echo 000)"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Health check failed (HTTP ${HTTP_CODE})." >&2
  journalctl -u text-idle -n 30 --no-pager >&2 || true
  exit 1
fi

echo "text-idle installed and healthy on port ${PORT}."
echo "Database: ${DB_PATH}"
