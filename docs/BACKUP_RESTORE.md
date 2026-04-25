# Backup and Restore Guide

## Database Backup

```bash
DATABASE_URL=postgresql://user:pass@host:5432/db ./infra/scripts/backup-postgres.sh
```

Encrypted:

```bash
BACKUP_ENCRYPTION_PASSWORD='strong-password' DATABASE_URL=... ./infra/scripts/backup-postgres.sh
```

## Restore

```bash
DATABASE_URL=postgresql://user:pass@host:5432/db ./infra/scripts/restore-postgres.sh ./backups/postgres/file.sql.gz
```

Encrypted restore:

```bash
BACKUP_ENCRYPTION_PASSWORD='strong-password' DATABASE_URL=... ./infra/scripts/restore-postgres.sh ./backups/postgres/file.sql.gz.enc
```

## File Backup

```bash
LOCAL_STORAGE_PATH=./uploads ./infra/scripts/backup-files.sh
```

Minimum policy:

- Daily database backup.
- Keep last 7 daily backups.
- Keep 4 weekly backups outside the server when possible.
- Test restore before launch.
