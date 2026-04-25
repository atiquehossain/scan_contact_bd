#!/usr/bin/env sh
set -eu

BACKUP_FILE="${1:-}"
if [ -z "$BACKUP_FILE" ] || [ -z "${DATABASE_URL:-}" ]; then
  echo "Usage: DATABASE_URL=... ./infra/scripts/restore-postgres.sh <backup.sql.gz|backup.sql.gz.enc>"
  exit 1
fi

INPUT="$BACKUP_FILE"
if echo "$BACKUP_FILE" | grep -q ".enc$"; then
  if [ -z "${BACKUP_ENCRYPTION_PASSWORD:-}" ]; then
    echo "BACKUP_ENCRYPTION_PASSWORD is required for encrypted backups"
    exit 1
  fi
  INPUT="/tmp/scancontact-restore.sql.gz"
  openssl enc -d -aes-256-cbc -pbkdf2 -in "$BACKUP_FILE" -out "$INPUT" -pass "pass:$BACKUP_ENCRYPTION_PASSWORD"
fi

gunzip -c "$INPUT" | psql "$DATABASE_URL"
echo "Restore completed"
