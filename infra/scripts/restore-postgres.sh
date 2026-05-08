#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

usage() {
  cat >&2 <<'USAGE'
Usage:
  RESTORE_CONFIRM=scancontact-restore DATABASE_URL=... ./infra/scripts/restore-postgres.sh <backup.sql.gz|backup.sql.gz.enc>
USAGE
}

die() {
  echo "error: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "$1 is required"
}

BACKUP_FILE="${1:-}"
if [ -z "$BACKUP_FILE" ]; then
  usage
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  die "DATABASE_URL is required"
fi

PG_DATABASE_URL="$(printf '%s' "$DATABASE_URL" | sed -E 's/([?&])schema=[^&]*&?/\1/; s/\?&/?/; s/[?&]$//')"

if [ "${RESTORE_CONFIRM:-}" != "scancontact-restore" ]; then
  die "refusing restore without RESTORE_CONFIRM=scancontact-restore"
fi

if [ ! -f "$BACKUP_FILE" ]; then
  die "backup file not found: $BACKUP_FILE"
fi

case "$BACKUP_FILE" in
  *.sql.gz|*.sql.gz.enc) ;;
  *) die "backup file must end with .sql.gz or .sql.gz.enc" ;;
esac

require_command gunzip
require_command gzip
require_command mktemp
require_command psql
require_command sed

TMP_GZ=""
cleanup() {
  if [ -n "${TMP_GZ:-}" ]; then
    rm -f "$TMP_GZ"
  fi
}
trap cleanup EXIT

INPUT="$BACKUP_FILE"
if [[ "$BACKUP_FILE" == *.enc ]]; then
  if [ -z "${BACKUP_ENCRYPTION_PASSWORD:-}" ]; then
    die "BACKUP_ENCRYPTION_PASSWORD is required for encrypted backups"
  fi
  require_command openssl

  TMP_DIR="${TMPDIR:-/tmp}"
  if [ ! -d "$TMP_DIR" ]; then
    die "TMPDIR does not exist: $TMP_DIR"
  fi

  TMP_GZ_BASE="$(mktemp "$TMP_DIR/scancontact-restore.XXXXXX")"
  TMP_GZ="$TMP_GZ_BASE.sql.gz"
  mv "$TMP_GZ_BASE" "$TMP_GZ"
  openssl enc -d -aes-256-cbc -pbkdf2 \
    -in "$BACKUP_FILE" \
    -out "$TMP_GZ" \
    -pass env:BACKUP_ENCRYPTION_PASSWORD
  INPUT="$TMP_GZ"
fi

gzip -t "$INPUT"
gunzip -c "$INPUT" | psql --set=ON_ERROR_STOP=1 --single-transaction "$PG_DATABASE_URL"

echo "Restore completed from: $BACKUP_FILE"
