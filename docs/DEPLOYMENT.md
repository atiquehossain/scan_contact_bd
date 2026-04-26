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

## Steps

1. Point DNS to the VPS.
2. Install Docker and Docker Compose.
3. Copy the repository to the server.
4. Create production env files:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

5. Set strong secrets and domains.
6. Run migrations:

```bash
docker compose run --rm api npx prisma migrate deploy
docker compose run --rm api npm run seed
```

7. Start services:

```bash
CADDY_SITE_ADDRESS=yourdomain.com WEB_HTTP_PORT=80 WEB_HTTPS_PORT=443 docker compose up -d --build
```

This starts `postgres`, `api`, and `caddy`. Caddy contains the static web build. It does not start a separate Next.js server, Redis, worker, or Mailpit.

For one-domain production, set:

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

Important: `NEXT_PUBLIC_*` values are compiled into the static web files inside the Caddy image. Rebuild the Caddy image after changing them:

```bash
docker compose build caddy
docker compose up -d caddy
```

8. Configure firewall:

- Allow `22`, `80`, `443`.
- Do not expose database or Redis ports publicly in production.

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
- Configure external encrypted backups.
- Add uptime checks for `/api/health` when using the one-domain Caddy proxy.
- Review logs and Caddy TLS status.
