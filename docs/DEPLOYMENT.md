# VPS Deployment Guide

## Single VPS Layout

- Caddy terminates HTTPS.
- Next.js web container serves the admin panel plus public scan/chat pages.
- API container serves REST endpoints.
- Worker container runs background jobs.
- PostgreSQL and Redis use persistent Docker volumes.

## Steps

1. Point DNS to the VPS.
2. Install Docker and Docker Compose.
3. Copy the repository to the server.
4. Create production env files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

5. Set strong secrets and domains.
6. Run migrations:

```bash
docker compose run --rm api npx prisma migrate deploy
docker compose run --rm api npm run seed
```

7. Start services:

```bash
APP_DOMAIN=yourdomain.com docker compose --profile production-proxy up -d --build
```

8. Configure firewall:

- Allow `22`, `80`, `443`.
- Do not expose database or Redis ports publicly in production.

## Hardening

- Rotate the seeded admin password immediately after first deploy.
- Disable development OTP provider before real users.
- Configure external encrypted backups.
- Add uptime checks for `/health`.
- Review logs and Caddy TLS status.
