# Local Setup Guide

## Requirements

- Node.js 20+
- npm 10+
- Docker Desktop
- Flutter 3.41+

## Services

Run:

```bash
docker compose up -d postgres redis mailpit
```

PostgreSQL listens on `localhost:5432`, Redis on `localhost:6379`, and Mailpit UI on `localhost:8025`.

If those ports are already used:

```bash
POSTGRES_PORT=55432 REDIS_PORT=56379 docker compose up -d postgres redis
```

Then set `DATABASE_URL=postgresql://scancontact:scancontact_local_password@localhost:55432/scancontact?schema=public` for local API commands.

## API

```bash
cp apps/api/.env.example apps/api/.env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed
npm run dev:api
```

## Web

```bash
cp apps/web/.env.example apps/web/.env
npm run dev:web
```

Open `http://localhost:3000/admin`. The web app is admin-only except for public scanner pages created from real admin-generated QR tags, such as `/t/{publicSlug}` and `/c/{conversationId}`.

## Owner Flutter App

```bash
cd apps/owner_app
flutter pub get
flutter run --dart-define=APP_NAME="ScanContact Owner" --dart-define=API_BASE_URL=http://10.0.2.2:4000
```

For a physical Android phone on the same Wi-Fi, use the PC LAN API URL, for example `--dart-define=API_BASE_URL=http://192.168.0.131:4000`.
