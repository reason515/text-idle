#!/usr/bin/env bash
# Build text-idle release binary for Linux (embedded frontend).
# Run from project root: bash scripts/build-dist.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Building frontend..."
cd frontend
npm run build
cd "$ROOT"

echo "Copying frontend build to internal/static/web..."
WEB_DIR="internal/static/web"
mkdir -p "$WEB_DIR"
rm -rf "${WEB_DIR:?}/"*
cp -r frontend/dist/* "$WEB_DIR/"

echo "Building Go binary (release)..."
mkdir -p dist
OUT="dist/text-idle"
if [ "${GOOS:-linux}" = "windows" ]; then
  OUT="dist/text-idle.exe"
fi
GOOS="${GOOS:-linux}" GOARCH="${GOARCH:-amd64}" go build -tags release -o "$OUT" ./cmd/server

echo "Done. Output: $OUT"
echo "Run: $OUT -db /var/lib/text-idle/text-idle.db"
echo "Listen: PORT=8080 or -addr :8080"
