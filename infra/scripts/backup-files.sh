#!/usr/bin/env sh
set -eu

SOURCE_DIR="${LOCAL_STORAGE_PATH:-./uploads}"
BACKUP_DIR="${BACKUP_DIR:-./backups/files}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

tar -czf "$BACKUP_DIR/files-$TIMESTAMP.tar.gz" "$SOURCE_DIR"
echo "File backup written: $BACKUP_DIR/files-$TIMESTAMP.tar.gz"
