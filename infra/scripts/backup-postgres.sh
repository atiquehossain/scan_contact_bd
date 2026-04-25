#!/usr/bin/env sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-./backups/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

OUT="$BACKUP_DIR/scancontact-$TIMESTAMP.sql.gz"
pg_dump "$DATABASE_URL" | gzip > "$OUT"

if [ -n "${BACKUP_ENCRYPTION_PASSWORD:-}" ]; then
  openssl enc -aes-256-cbc -salt -pbkdf2 -in "$OUT" -out "$OUT.enc" -pass "pass:$BACKUP_ENCRYPTION_PASSWORD"
  rm "$OUT"
  OUT="$OUT.enc"
fi

find "$BACKUP_DIR" -type f -mtime +"$RETENTION_DAYS" -delete
echo "Backup written: $OUT"
