#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

SOURCE_DIR="${SOURCE_DIR:-${LOCAL_STORAGE_PATH:-./uploads}}"
BACKUP_DIR="${BACKUP_DIR:-./backups/files}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

die() {
  echo "error: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "$1 is required"
}

if [ ! -d "$SOURCE_DIR" ]; then
  die "source directory not found: $SOURCE_DIR"
fi

if ! [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
  die "RETENTION_DAYS must be a non-negative integer"
fi

require_command date
require_command basename
require_command dirname
require_command find
require_command mktemp
require_command tar

mkdir -p "$BACKUP_DIR"

TMP_TAR="$(mktemp "$BACKUP_DIR/.files-$TIMESTAMP.XXXXXX.tar.gz")"
OUT="$BACKUP_DIR/files-$TIMESTAMP.tar.gz"

cleanup() {
  if [ -n "${TMP_TAR:-}" ]; then
    rm -f "$TMP_TAR"
  fi
}
trap cleanup EXIT

SOURCE_PARENT="$(dirname "$SOURCE_DIR")"
SOURCE_NAME="$(basename "$SOURCE_DIR")"

tar -czf "$TMP_TAR" -C "$SOURCE_PARENT" "$SOURCE_NAME"
mv -f "$TMP_TAR" "$OUT"
TMP_TAR=""

find "$BACKUP_DIR" -type f \
  -name 'files-*.tar.gz' \
  -mtime +"$RETENTION_DAYS" \
  -delete

echo "File backup written: $OUT"
