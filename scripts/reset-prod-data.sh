#!/usr/bin/env bash
# Wipe text-idle SQLite on the server (users, saves, leaderboard, message board, team names).
# Run on the VPS as root, or via scripts/reset-prod-data-tencent.ps1 from Windows.
#
# Usage:
#   sudo TEXT_IDLE_RESET_CONFIRM=yes bash scripts/reset-prod-data.sh
#
# Always writes a backup to /var/backups/text-idle before deleting the DB file.
# GORM AutoMigrate recreates empty tables on next service start.

set -euo pipefail

INSTALL_DIR="/opt/text-idle"
DATA_DIR="/var/lib/text-idle"
BACKUP_DIR="/var/backups/text-idle"
DB_PATH="${DATA_DIR}/text-idle.db"
SERVICE_USER="www-data"
PORT="${TEXT_IDLE_PORT:-8080}"
CONFIRM="${TEXT_IDLE_RESET_CONFIRM:-}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root (use sudo)." >&2
  exit 1
fi

if [[ "$CONFIRM" != "yes" ]]; then
  echo "Refusing to wipe production data without confirmation." >&2
  echo "This deletes: ${DB_PATH} (and SQLite -wal / -shm sidecars if present)." >&2
  echo "Re-run with: TEXT_IDLE_RESET_CONFIRM=yes" >&2
  exit 1
fi

mkdir -p "$DATA_DIR" "$BACKUP_DIR"

echo "Stopping text-idle service..."
systemctl stop text-idle

if [[ -f "$DB_PATH" ]]; then
  STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
  if [[ -x "${INSTALL_DIR}/backup-db.sh" ]]; then
    echo "Backing up database before reset..."
    bash "${INSTALL_DIR}/backup-db.sh" "$DB_PATH" "$BACKUP_DIR"
  else
    DEST="${BACKUP_DIR}/text-idle-pre-reset-${STAMP}.db"
    echo "Backing up database before reset (cp fallback)..."
    cp "$DB_PATH" "$DEST"
    echo "Backup written: $DEST"
  fi
  echo "Removing database files..."
  rm -f "$DB_PATH" "${DB_PATH}-wal" "${DB_PATH}-shm" "${DB_PATH}-journal"
else
  echo "No database at ${DB_PATH}; nothing to delete."
fi

if id "$SERVICE_USER" &>/dev/null; then
  chown -R "${SERVICE_USER}:${SERVICE_USER}" "$DATA_DIR"
fi

echo "Starting text-idle service..."
systemctl start text-idle

sleep 2
if ! systemctl is-active --quiet text-idle; then
  echo "text-idle failed to start after reset:" >&2
  journalctl -u text-idle -n 30 --no-pager >&2 || true
  exit 1
fi

HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/health" || echo 000)"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Health check failed (HTTP ${HTTP_CODE})." >&2
  journalctl -u text-idle -n 30 --no-pager >&2 || true
  exit 1
fi

echo "Production data reset complete."
echo "Fresh database will be created on first request: ${DB_PATH}"
echo "Pre-reset backups: ${BACKUP_DIR}"
