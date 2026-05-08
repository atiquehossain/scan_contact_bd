# VPS Deployment Guide

## Single VPS Layout

- Caddy terminates HTTPS.
- Caddy serves the exported static admin panel plus public scan/chat pages.
- API container serves REST endpoints.
- PostgreSQL uses a persistent Docker volume.
- Redis, worker, Mailpit, and object storage are optional. They are not required for the lean MVP.

Default lean production shape:

```text
Caddy -> static web files
Caddy -> /api/* -> api
api -> PostgreSQL
cron -> backups
```

## Production Environment

Create environment files from the examples, then replace every local/default secret before starting production services:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Root `.env` controls Docker Compose defaults, published ports, Caddy site address, and static web build-time values. For one-domain production, set:

```env
CADDY_SITE_ADDRESS=yourdomain.com
WEB_HTTP_PORT=80
WEB_HTTPS_PORT=443
APP_URL=https://yourdomain.com
API_URL=https://yourdomain.com/api
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=/api
STATIC_NEXT_PUBLIC_API_URL=/api
CORS_ORIGINS=https://yourdomain.com
```

`apps/api/.env` controls API runtime and the admin seed. Production must not use the development defaults:

```env
NODE_ENV=production
DATABASE_URL=postgresql://scancontact:<strong-db-password>@postgres:5432/scancontact?schema=public
JWT_SECRET=<long-random-secret>
JWT_REFRESH_SECRET=<different-long-random-secret>
OTP_SECRET=<different-long-random-secret>
APP_URL=https://yourdomain.com
API_URL=https://yourdomain.com/api
CORS_ORIGINS=https://yourdomain.com
OTP_PROVIDER=<production-sms-otp-provider>
SMS_PROVIDER=<production-sms-provider>
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./uploads
ADMIN_EMAIL=<real-admin-email>
ADMIN_PASSWORD=<temporary-strong-password>
```

Important:

- Do not deploy with `scancontact_local_password`, `replace-with-*`, `admin@example.com`, or `OTP_PROVIDER=dev-log`.
- Keep `NODE_ENV=production` so development OTP values are not returned or logged.
- Treat `ADMIN_EMAIL` and `ADMIN_PASSWORD` as production secrets. The seed command creates the first super admin from these values, so set them before seeding and rotate the admin password immediately after first login.
- `NEXT_PUBLIC_*` and `STATIC_NEXT_PUBLIC_*` values are compiled into the static web files inside the Caddy image. Rebuild Caddy after changing them:

```bash
docker compose build caddy
docker compose up -d caddy
```

## Steps

1. Point DNS to the VPS.
2. Install Docker and Docker Compose.
3. Copy the repository to the server.
4. Create and review production env files as described above.
5. Run migrations:

```bash
docker compose run --rm api npx prisma migrate deploy
```

6. Seed the initial roles and super admin only after the production admin env values are set:

```bash
docker compose run --rm api npm run seed
```

7. Start services:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

This starts `postgres`, the migration job, `api`, `worker`, and `caddy`. Caddy contains the static web build. It does not start a separate Next.js server, Redis, or Mailpit.

8. Configure firewall:

- Allow `22`, `80`, `443`.
- Do not expose database or Redis ports publicly in production.
- If private calling is enabled with TURN, also allow TURN ports described below.

9. Verify production:

- `https://yourdomain.com/api/health` returns healthy.
- `/admin` loads over HTTPS.
- Admin login works with the seeded admin, then the initial password is rotated.
- Owner OTP uses the production provider and does not expose OTP values in responses or logs.
- A database backup and a file-storage backup both complete and are copied off-server.

## Reliable Private Calling

Browser microphone access requires HTTPS in production. WebRTC also needs TURN for reliable calls across mobile networks, carrier NAT, and strict Wi-Fi routers. STUN alone can work on friendly networks, but it will fail for some real users.

Recommended low-cost setup:

1. Run `coturn` on the same VPS or a small separate VPS.
2. Point `turn.yourdomain.com` to that server.
3. Open firewall ports:
   - `3478/tcp`
   - `3478/udp`
   - `49160-49200/udp` for relay media
4. Configure the API with TURN URLs and a shared secret.

Example `coturn` config:

```text
listening-port=3478
fingerprint
use-auth-secret
static-auth-secret=<long-random-turn-secret>
realm=turn.yourdomain.com
no-multicast-peers
no-cli
min-port=49160
max-port=49200
```

Example API environment:

```env
WEBRTC_STUN_URLS=stun:stun.l.google.com:19302
WEBRTC_TURN_URLS=turn:turn.yourdomain.com:3478?transport=udp,turn:turn.yourdomain.com:3478?transport=tcp
WEBRTC_TURN_SHARED_SECRET=<same-long-random-turn-secret>
WEBRTC_TURN_TTL_SECONDS=3600
```

The API returns temporary ICE credentials to the scanner call page and owner app only for active/private call sessions. Prefer `WEBRTC_TURN_SHARED_SECRET` over static `WEBRTC_TURN_USERNAME` and `WEBRTC_TURN_CREDENTIAL` in production.

## Backups

Configure external encrypted backups before accepting real users. At minimum:

```bash
BACKUP_ENCRYPTION_PASSWORD='<strong-backup-password>' \
DATABASE_URL='postgresql://scancontact:<strong-db-password>@postgres:5432/scancontact?schema=public' \
BACKUP_DIR=/srv/scancontact/backups/postgres \
RETENTION_DAYS=14 \
./infra/scripts/backup-postgres.sh
```

For file uploads, confirm whether storage is a host bind mount or a Docker named volume. Named volumes must be backed up with a temporary Docker container that mounts the volume read-only. See `docs/BACKUP_RESTORE.md`.

## Optional Services

Start local email testing:

```bash
docker compose --profile dev-tools up -d mailpit
```

Start Redis and worker only when you add queue/background workloads:

```bash
API_REDIS_URL=redis://redis:6379
docker compose --profile extras up -d redis worker
```

## Hardening

- Rotate the seeded admin password immediately after first deploy.
- Disable development OTP provider before real users.
- Configure external encrypted backups and test restore.
- Add uptime checks for `/api/health` when using the one-domain Caddy proxy.
- Review logs and Caddy TLS status.
- Keep production `.env` files out of Git and server support tickets.
