#!/usr/bin/env bash
# Backup SQLite database for text-idle.
# Usage: bash scripts/backup-db.sh [path/to/text-idle.db] [backup-dir]
# Default db: ./text-idle.db   Default dir: ./backups

set -euo pipefail

DB_PATH="${1:-text-idle.db}"
BACKUP_DIR="${2:-backups}"

if [ ! -f "$DB_PATH" ]; then
  echo "Database not found: $DB_PATH" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DEST="$BACKUP_DIR/text-idle-${STAMP}.db"

if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB_PATH" ".backup '$DEST'"
else
  cp "$DB_PATH" "$DEST"
fi

echo "Backup written: $DEST"
