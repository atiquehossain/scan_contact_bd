# Backup and Restore Guide

These scripts are meant for a Linux VPS or a container image that has Bash plus the PostgreSQL client tools installed. They fail fast, write temporary files first, and only publish a final backup file after the command succeeds.

## Database Backup

```bash
DATABASE_URL='postgresql://user:pass@host:5432/db?schema=public' \
BACKUP_DIR=/srv/scancontact/backups/postgres \
RETENTION_DAYS=14 \
./infra/scripts/backup-postgres.sh
```

Encrypted backup:

```bash
BACKUP_ENCRYPTION_PASSWORD='strong-password' \
DATABASE_URL='postgresql://user:pass@host:5432/db?schema=public' \
./infra/scripts/backup-postgres.sh
```

The backup script:

- Uses `set -Eeuo pipefail`, so a failed `pg_dump`, `gzip`, or encryption command fails the whole run.
- Writes to hidden temporary files in `BACKUP_DIR` and renames the final `.sql.gz` or `.sql.gz.enc` only after success.
- Uses `BACKUP_ENCRYPTION_PASSWORD` through OpenSSL's environment password source instead of putting the password directly in the command arguments.
- Deletes only matching `scancontact-*.sql.gz` and `scancontact-*.sql.gz.enc` files older than `RETENTION_DAYS`.

## Database Restore

Restore is intentionally strict. It refuses to run unless `RESTORE_CONFIRM=scancontact-restore` is set.

```bash
RESTORE_CONFIRM=scancontact-restore \
DATABASE_URL='postgresql://user:pass@host:5432/db?schema=public' \
./infra/scripts/restore-postgres.sh ./backups/postgres/scancontact-20260507-020000.sql.gz
```

Encrypted restore:

```bash
RESTORE_CONFIRM=scancontact-restore \
BACKUP_ENCRYPTION_PASSWORD='strong-password' \
DATABASE_URL='postgresql://user:pass@host:5432/db?schema=public' \
./infra/scripts/restore-postgres.sh ./backups/postgres/scancontact-20260507-020000.sql.gz.enc
```

Before restoring production data:

- Take a fresh backup of the current database.
- Pause API and worker processes so no writes happen during restore.
- Restore into an empty or disposable database first when testing.
- Verify the target `DATABASE_URL`; the script cannot tell whether a URL is production or staging.

The restore script validates the gzip archive before restoring, decrypts encrypted backups into a unique temporary file, and runs `psql` with `ON_ERROR_STOP=1` plus `--single-transaction`.

## File Backup

For host-visible local storage:

```bash
LOCAL_STORAGE_PATH=/srv/scancontact/uploads \
BACKUP_DIR=/srv/scancontact/backups/files \
RETENTION_DAYS=14 \
./infra/scripts/backup-files.sh
```

You may also set `SOURCE_DIR` directly:

```bash
SOURCE_DIR=/srv/scancontact/uploads ./infra/scripts/backup-files.sh
```

The script archives the source directory by basename, so restoring `/srv/scancontact/uploads` should extract into `/srv/scancontact`:

```bash
tar -xzf ./backups/files/files-20260507-020000.tar.gz -C /srv/scancontact
```

## Docker Volume File Backups

Do not assume `./uploads` on the host contains production files. If the API stores uploads in a Docker named volume, back up that volume directly.

First identify the volume:

```bash
docker volume ls
docker volume inspect <volume-name>
```

Back up a named upload volume with a temporary container:

```bash
mkdir -p ./backups/files

docker run --rm \
  -v <upload-volume-name>:/source:ro \
  -v "$PWD/backups/files:/backup" \
  alpine sh -lc 'cd /source && tar -czf "/backup/files-$(date +%Y%m%d-%H%M%S).tar.gz" .'
```

Restore that Docker volume archive into an empty replacement volume:

```bash
docker run --rm \
  -v <upload-volume-name>:/target \
  -v "$PWD/backups/files:/backup:ro" \
  alpine sh -lc 'cd /target && tar -xzf /backup/files-20260507-020000.tar.gz'
```

If uploads are a bind mount instead of a named volume, use the host path with `backup-files.sh`.

## Minimum Policy

- Back up PostgreSQL daily.
- Back up file storage daily if local uploads are enabled.
- Keep at least 7 daily backups and 4 weekly backups.
- Store an encrypted copy outside the VPS.
- Test restore before production launch and after any backup script change.
- Monitor cron or scheduler failures; a silent failed backup is the same as no backup.
