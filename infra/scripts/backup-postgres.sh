#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

BACKUP_DIR="${BACKUP_DIR:-./backups/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

die() {
  echo "error: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "$1 is required"
}

if [ -z "${DATABASE_URL:-}" ]; then
  die "DATABASE_URL is required"
fi

PG_DATABASE_URL="$(printf '%s' "$DATABASE_URL" | sed -E 's/([?&])schema=[^&]*&?/\1/; s/\?&/?/; s/[?&]$//')"

if ! [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
  die "RETENTION_DAYS must be a non-negative integer"
fi

require_command date
require_command find
require_command gzip
require_command mktemp
require_command pg_dump
require_command sed

if [ -n "${BACKUP_ENCRYPTION_PASSWORD:-}" ]; then
  require_command openssl
fi

mkdir -p "$BACKUP_DIR"

TMP_GZ_BASE="$(mktemp "$BACKUP_DIR/.nonumqr-$TIMESTAMP.XXXXXX")"
TMP_GZ="$TMP_GZ_BASE.sql.gz"
mv "$TMP_GZ_BASE" "$TMP_GZ"
TMP_ENC=""
OUT="$BACKUP_DIR/nonumqr-$TIMESTAMP.sql.gz"

cleanup() {
  if [ -n "${TMP_GZ:-}" ]; then
    rm -f "$TMP_GZ"
  fi
  if [ -n "${TMP_ENC:-}" ]; then
    rm -f "$TMP_ENC"
  fi
}
trap cleanup EXIT

pg_dump "$PG_DATABASE_URL" | gzip -c > "$TMP_GZ"

if [ -n "${BACKUP_ENCRYPTION_PASSWORD:-}" ]; then
  TMP_ENC_BASE="$(mktemp "$BACKUP_DIR/.nonumqr-$TIMESTAMP.XXXXXX")"
  TMP_ENC="$TMP_ENC_BASE.sql.gz.enc"
  mv "$TMP_ENC_BASE" "$TMP_ENC"
  openssl enc -aes-256-cbc -salt -pbkdf2 \
    -in "$TMP_GZ" \
    -out "$TMP_ENC" \
    -pass env:BACKUP_ENCRYPTION_PASSWORD
  OUT="$OUT.enc"
  mv -f "$TMP_ENC" "$OUT"
  rm -f "$TMP_GZ"
  TMP_ENC=""
  TMP_GZ=""
else
  mv -f "$TMP_GZ" "$OUT"
  TMP_GZ=""
fi

find "$BACKUP_DIR" -type f \
  \( -name 'nonumqr-*.sql.gz' -o -name 'nonumqr-*.sql.gz.enc' \) \
  -mtime +"$RETENTION_DAYS" \
  -delete

echo "Backup written: $OUT"
