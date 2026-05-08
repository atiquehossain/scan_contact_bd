# ScanContact BD

Bangladesh-first QR private contact platform MVP.

ScanContact BD lets someone contact an owner by scanning a QR code without publicly exposing the owner's phone number by default. The web app is admin-only. QR owners use the Flutter owner app. Scanners use public browser pages only.

The core promise:

> Let people contact you when needed, without publicly exposing your phone number.

## Current MVP Status

This repository contains a working MVP with:

- Admin-only static web panel built with Next.js and served by Caddy
- Public QR scan page
- Public scanner conversation page with token access
- Express TypeScript REST API
- PostgreSQL schema through Prisma
- Custom OTP login for owners
- QR tag creation and QR image generation
- Private contact request and two-way chat flow
- In-app owner notifications
- Owner Flutter app for Android and iOS-ready development
- Optional in-app QR scanner for owners acting as scanners
- COD QR sticker order flow foundation
- Docker Compose local/self-hosted stack
- Backup and restore scripts
- Security, privacy, deployment, and integration docs

No Firebase is used for the core backend, auth, database, or storage.

## Product Roles

### Admin

Admins use the web app only.

Admin can:

- Log in at `/admin`
- View operational metrics
- Create QR tags for owners by phone number and owner name
- See QR preview and public URL
- Inspect owners, tags, scanner messages, orders, reports, and audit logs
- Delete normal users
- Manage operational records

Admin cannot:

- Reply as the owner
- See hidden scanner or owner data beyond admin support views
- Use a public owner dashboard

### Owner

Owners use the Flutter app only.

Owner can:

- Log in or sign up with Bangladesh phone OTP
- See assigned QR tags
- See whether anyone scanned or messaged
- Reply privately in the app
- Scan another ScanContact QR and send a scanner message
- View alerts
- Place COD QR sticker orders when no QR is assigned

### Scanner

Scanners do not need an account or app install.

Scanner can:

- Scan a QR code with a phone camera
- Open `/t/{publicSlug}` in a mobile browser
- Send a private message/request
- Continue the conversation at `/c/{conversationId}?token=...`
- Report abuse

Scanner must not see owner phone number, owner address, owner ID, user ID, emergency contacts, documents, or private profile data by default.

## Privacy Rules

- QR codes contain only a public URL: `https://your-domain/t/{publicSlug}`.
- QR codes never contain phone numbers, names, user IDs, addresses, documents, or private owner data.
- Owner phone numbers are hidden from scanners by default.
- Public scanner pages expose only safe tag context.
- Scanner conversations require a valid conversation token.
- Admin can inspect submitted messages for support and safety, but cannot reply as the owner.
- Call masking is intentionally not implemented in the MVP.
- No BRTA/government scraping, vehicle lookup, or mass identity lookup exists.

## Repository Structure

```text
scancontact-bd/
  apps/
    api/          Express TypeScript REST API, Prisma schema, seed, tests
    web/          Next.js admin panel plus public QR scan/chat pages
    mobile/       Current Flutter owner app used for local testing
    owner_app/    Older separate Flutter owner app scaffold kept for reference
    worker/       Optional background worker scaffold for future jobs
  packages/
    shared/       Shared constants and validation helpers
    config/       Shared app configuration helpers
  infra/
    caddy/        Caddy reverse proxy config
    scripts/      Backup and restore scripts
  docs/           Architecture, API, deployment, security, privacy, guides
```

Important: the current owner app that has the latest chat refresh, request inbox, OTP, and dashboard work is `apps/mobile`.

## Architecture

### Product Flow

```mermaid
flowchart LR
  Admin["Admin web panel"] -->|"Create owner QR"| API["REST API"]
  API --> DB[("PostgreSQL")]
  API --> QR["QR public URL"]
  QR --> Scanner["Scanner phone browser"]
  Scanner --> ScanPage["/t/{publicSlug}"]
  ScanPage -->|"Submit private message"| API
  API --> Request["Contact request + chat thread"]
  API --> Notify["In-app owner notification"]
  Owner["Flutter owner app"] -->|"Fetch requests/messages"| API
  Owner -->|"Reply privately"| API
  Scanner --> Conversation["/c/{conversationId}?token=..."]
  Conversation --> API
```

### System Architecture

```mermaid
flowchart TB
  Internet["Internet"] --> Caddy["Caddy reverse proxy / HTTPS"]
  Caddy --> Web["Static admin/public QR files"]
  Caddy --> API["Express REST API"]
  API --> Prisma["Prisma ORM"]
  Prisma --> Postgres[("PostgreSQL")]
  API -. "optional later" .-> Redis[("Redis")]
  API --> Storage["Local storage / future MinIO"]
  API --> OTP["OTP provider abstraction"]
  API --> Payment["Payment provider abstraction"]
  API --> Notify["Notification provider abstraction"]
  Worker["Optional worker process"] --> Postgres
  Backup["Backup scripts / cron"] --> Postgres
  Backup --> Storage
```

### Runtime Services

| Service | Purpose | Local Port |
| --- | --- | --- |
| `caddy` | Static admin/public QR pages, HTTPS, `/api` reverse proxy | `3000` locally, `80/443` in production |
| `api` | REST API, auth, QR, messages, orders | `4000` |
| `postgres` | Primary database | `5432` or configured |
| `redis` | Optional cache/queue-ready service | `6379` or configured |
| `worker` | Optional background jobs scaffold | none |
| `mailpit` | Optional local email test UI | `8025` |
| `caddy` | Production HTTPS reverse proxy | `80`, `443` |

## Technology Stack

### Web

- Next.js
- React
- TypeScript
- Tailwind CSS
- Admin-only routing
- Public `/t/{publicSlug}` and `/c/{conversationId}` pages

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT access tokens
- Refresh token rotation
- OTP provider abstraction
- Payment provider abstraction
- Helmet, CORS, rate limiting, Zod validation

### Mobile

- Flutter
- Dart
- Material 3
- Riverpod
- Dio
- GoRouter
- Flutter Secure Storage
- Pull-to-refresh and lightweight chat polling

### Infrastructure

- Docker Compose
- PostgreSQL container
- Optional Redis container
- API container
- Static web files served from the Caddy container
- Optional worker container
- Optional Caddy HTTPS proxy
- Backup scripts

## Main User Flow

### Admin Creates QR

1. Admin logs in at `/admin/login`.
2. Admin opens **Create New Tag**.
3. Admin enters owner name and owner phone number.
4. Admin enters tag type, label, and optional vehicle number.
5. API creates or updates the owner account by normalized Bangladesh phone number.
6. API creates a unique random public QR slug.
7. QR preview shows the public URL and QR image.
8. Admin prints or shares the QR.

### Scanner Sends Message

1. Scanner scans QR from another phone.
2. Browser opens `/t/{publicSlug}`, or the owner app scanner opens the same safe QR flow inside the app.
3. Scanner sees only safe tag context and privacy copy.
4. Scanner chooses a reason and writes a message.
5. API creates a contact request and initial scanner message.
6. API creates an in-app notification for the owner.
7. Scanner receives a continue-conversation link.

### Owner Replies

1. Owner opens the Flutter owner app.
2. Owner logs in with the same phone number used by admin.
3. Owner sees assigned QR tags and private requests.
4. Owner opens a chat.
5. Owner replies privately.
6. Scanner can read the reply through the token-protected conversation page.

### Owner App Scanner Mode

The owner app also has a **Scan QR** action. This does not create owner-to-owner direct chat. It means the logged-in owner is temporarily acting as a scanner:

1. Owner A opens **Scan QR** in the Flutter app.
2. Owner A scans Owner B's QR.
3. The app extracts only `/t/{publicSlug}` from the QR.
4. Owner A sends a scanner message through the public contact API.
5. Owner B receives the request in the owner app.
6. Owner A can continue the conversation in the scanner-side app thread using the returned conversation token.

The browser scan page still remains required and supported, so scanners never need to install the app.

## API Summary

Important REST groups:

- `POST /auth/admin-login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `POST /owner/auth/request-otp`
- `POST /owner/auth/verify-otp`
- `GET /owner/me`
- `GET /owner/dashboard`
- `GET /owner/tags`
- `GET /owner/contact-requests`
- `GET /owner/contact-requests/:id/messages`
- `POST /owner/contact-requests/:id/reply`
- `POST /owner/contact-requests/:id/mark-read`
- `GET /owner/notifications`
- `GET /owner/products`
- `POST /owner/orders/cod`
- `GET /t/:publicSlug`
- `POST /t/:publicSlug/scan`
- `POST /t/:publicSlug/contact`
- `POST /t/:publicSlug/report-abuse`
- `GET /public/contact-requests/:id/messages`
- `POST /public/contact-requests/:id/messages`
- `GET /admin/dashboard`
- `POST /admin/tags`
- `GET /admin/owners`
- `GET /admin/owners/:ownerId`
- `GET /admin/users`
- `DELETE /admin/users/:id`
- `GET /admin/orders`
- `PATCH /admin/orders/:id`
- `GET /admin/audit-logs`

Detailed API docs: [docs/API.md](docs/API.md)

## Database

PostgreSQL is managed through Prisma.

Important model groups:

- Users, profiles, roles, permissions, sessions
- OTP records and device tokens
- QR tags and contact settings
- Scan events, contact requests, contact messages
- Notifications
- Products, orders, payments, shipments
- Resellers, inventory batches, commissions, payouts
- Societies, units, vehicles, parking slots, visitor logs
- Abuse reports, audit logs, CMS pages, settings
- Consent logs, deletion requests, file uploads, backup logs
- Bangladesh city/district records

Database docs: [docs/DATABASE.md](docs/DATABASE.md)

## Environment Files

Copy examples before running:

```powershell
Copy-Item .env.example .env
Copy-Item apps\api\.env.example apps\api\.env
Copy-Item apps\web\.env.example apps\web\.env
Copy-Item apps\mobile\.env.example apps\mobile\.env
```

On Linux/macOS:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Set these carefully:

- `DATABASE_URL`
- `REDIS_URL` for direct API runs, or `API_REDIS_URL` for optional Docker Redis usage
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `OTP_SECRET`
- `APP_URL`
- `API_URL`
- `CORS_ORIGINS`
- `WEBRTC_STUN_URLS`
- `WEBRTC_TURN_URLS` and `WEBRTC_TURN_SHARED_SECRET` for reliable private calls
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `OTP_PROVIDER`
- Future SMS/payment provider values

Do not commit real `.env` files. They are ignored by Git.

Production reminders:

- Root `.env` controls Docker/Caddy ports plus static web build-time values.
- `apps/api/.env` controls API runtime, database access, OTP, and the admin seed.
- Production must use `NODE_ENV=production`, strong unique secrets, real domain URLs, strict `CORS_ORIGINS`, and a real SMS OTP provider.
- Private browser/app calls require HTTPS and should use a TURN server such as coturn for mobile-network reliability. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#reliable-private-calling).
- Do not seed production with example `ADMIN_EMAIL` or `ADMIN_PASSWORD`; rotate the seeded admin password immediately after first login.

## Local Setup

### Requirements

- Node.js 20.11+
- npm 10+
- Docker Desktop
- Flutter SDK
- Android Studio or Android SDK for device testing

### 1. Install Dependencies

```powershell
npm install
```

### 2. Start Local Services

```powershell
docker compose up -d postgres
```

Optional local email UI:

```powershell
docker compose --profile dev-tools up -d mailpit
```

Optional Redis/worker expansion:

```powershell
docker compose --profile extras up -d redis worker
```

If `5432` is already busy:

```powershell
$env:POSTGRES_PORT="55432"
docker compose up -d postgres
```

Then update `apps/api/.env`:

```text
DATABASE_URL=postgresql://scancontact:scancontact_local_password@localhost:55432/scancontact?schema=public
```

### 3. Prisma Generate, Migrate, Seed

```powershell
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed
```

Seed behavior:

- Creates roles
- Creates one super admin from `apps/api/.env`
- Uses `ADMIN_EMAIL` and `ADMIN_PASSWORD` as production-sensitive seed inputs
- Does not create demo users, demo QR tags, demo orders, demo chats, demo products, or fake business data

Production warning: replace the example admin credentials before running `npm run seed` or `docker compose run --rm api npm run seed`.

### 4. Run API

```powershell
npm run dev:api
```

API health:

```text
http://localhost:4000/health
```

### 5. Run Web

```powershell
npm run dev:web
```

Open:

```text
http://localhost:3000/admin
```

Admin credentials come from:

```text
apps/api/.env -> ADMIN_EMAIL / ADMIN_PASSWORD
```

## Owner App Local Run

The current owner app is:

```text
apps/mobile
```

### Android Emulator

Use `10.0.2.2` for emulator-to-PC access:

```powershell
cd apps\mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000 --dart-define=WEB_BASE_URL=http://10.0.2.2:3000
```

### Real Android Phone

Use your PC LAN IP. For Docker-based local testing, expose the local services on your LAN first:

```powershell
$env:HOST_BIND_IP="0.0.0.0"
docker compose up -d
```

Then run the app with your PC LAN IP. Example:

```powershell
cd apps\mobile
flutter run --dart-define=API_BASE_URL=http://192.168.0.131:4000 --dart-define=WEB_BASE_URL=http://192.168.0.131:3000
```

If the phone cannot connect:

1. Make sure phone and PC are on the same Wi-Fi.
2. Open `http://YOUR_PC_IP:4000/health` in the phone browser.
3. If it fails, allow Windows Firewall ports:

```powershell
New-NetFirewallRule -DisplayName "ScanContact API 4000" -Direction Inbound -Protocol TCP -LocalPort 4000 -Action Allow
New-NetFirewallRule -DisplayName "ScanContact Web 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

## Development OTP

The local MVP uses a development OTP provider.

In `apps/api/.env`:

```text
NODE_ENV=development
OTP_PROVIDER=dev-log
```

Development OTP is returned by owner OTP request responses and logged in API logs. Production must use a real SMS provider and must not log OTP values.

## Testing the End-to-End Flow

1. Start database services.
2. Start API.
3. Start web.
4. Open `/admin`.
5. Log in as the seeded admin.
6. Create a QR tag for an owner phone number.
7. Open the displayed public QR URL from another phone.
8. Submit a scanner message.
9. Run the owner app on the owner's phone.
10. Log in with the same owner phone number.
11. Open **Requests**.
12. Open the chat and reply.
13. Scanner opens the continue-conversation URL and sees the owner reply.

## Useful Commands

```powershell
# API
npm run dev:api
npm run build --workspace @scancontact/api
npm run test --workspace @scancontact/api

# Web
npm run dev:web
npm run build --workspace @scancontact/web
npm run lint --workspace @scancontact/web

# Worker
npm run dev:worker

# All workspaces
npm run build
npm run lint
npm run test

# Prisma
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed

# Flutter owner app
cd apps\mobile
flutter pub get
flutter analyze
flutter test
flutter build apk --debug
```

## Docker

After env files are created:

```powershell
npm run docker:lean
```

Services:

- Web/Admin/Public QR through Caddy: `http://localhost:3000`
- API: `http://localhost:4000`
- PostgreSQL: `localhost:5432`

The default Docker stack is now cost-minimized. It starts only:

- `postgres`
- `api`
- `caddy` serving static web files

Optional local email tools:

```powershell
npm run docker:dev-tools
```

Optional Redis/worker expansion:

```powershell
npm run docker:extras
```

Production command for one low-cost VPS:

```powershell
$env:CADDY_SITE_ADDRESS="yourdomain.com"
$env:WEB_HTTP_PORT="80"
$env:WEB_HTTPS_PORT="443"
npm run docker:prod
```

## Deployment Notes

Single low-cost VPS shape:

- Caddy terminates HTTPS.
- Caddy serves the exported static admin and public QR pages.
- API serves REST endpoints.
- PostgreSQL uses a persistent volume.
- Redis, worker, Mailpit, and MinIO are optional instead of always-on.
- Backups run through cron or scheduled scripts.

Recommended one-domain production values:

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

Note: `NEXT_PUBLIC_*` values are compiled into the static web files inside the Caddy image. Rebuild `caddy` after changing production app/API URLs.

Full production env checklist: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

Before launch:

- Replace all secrets.
- Set `NODE_ENV=production`.
- Configure production `APP_URL`, `API_URL`, and CORS origins.
- Configure a real SMS OTP provider.
- Run the admin seed only after setting a real `ADMIN_EMAIL` and temporary strong `ADMIN_PASSWORD`.
- Rotate the seeded admin password immediately after first deploy.
- Configure external encrypted backups.
- Configure log rotation.
- Keep database private. Keep Redis private if you enable it later.
- Review Bangladesh telecom, payment, privacy, e-commerce, tax, and consumer-protection requirements from official sources.
- Do not enable call masking unless a legal telecom/VoIP provider integration is approved.

Deployment guide: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Backup and Restore

Scripts:

- [infra/scripts/backup-postgres.sh](infra/scripts/backup-postgres.sh)
- [infra/scripts/restore-postgres.sh](infra/scripts/restore-postgres.sh)
- [infra/scripts/backup-files.sh](infra/scripts/backup-files.sh)

Minimum recommended backup policy:

- Daily database backup
- Daily file backup if local uploads are enabled
- Keep last 7 daily backups
- Keep last 4 weekly backups
- Store a copy outside the server
- Test restore before production launch

Restore is intentionally strict and requires `RESTORE_CONFIRM=scancontact-restore`. If file uploads are stored in a Docker named volume, back up the volume directly instead of assuming host `./uploads` contains the data.

Backup guide: [docs/BACKUP_RESTORE.md](docs/BACKUP_RESTORE.md)

## Security Features

- Admin-only web dashboard
- Protected admin routes
- JWT access tokens
- Refresh token rotation
- Hashed refresh tokens
- Hashed OTPs
- OTP expiry and rate limiting
- Public contact request rate limiting
- Zod input validation
- Prisma query layer
- Helmet security headers
- Strict CORS allowlist
- Password hashing with bcrypt
- Secure random QR public slugs
- Abuse reporting
- Admin audit log model and UI
- No secrets committed
- Flutter token storage through secure storage

Security checklist: [docs/SECURITY_CHECKLIST.md](docs/SECURITY_CHECKLIST.md)

## Privacy Features

- Phone hidden by default
- Name hidden from scanners by default
- QR contains only public URL
- Public scan page avoids private owner data
- Conversation requires token access
- Scanner data is not exposed unless voluntarily submitted
- Consent log model exists
- Account deletion request model exists
- File uploads are private by design
- Admin can inspect messages only for support/safety
- Owner replies only through the owner app

Privacy checklist: [docs/PRIVACY_CHECKLIST.md](docs/PRIVACY_CHECKLIST.md)

## Cost-Aware Strategy

Local development works with free/self-hosted services:

- Docker Compose
- PostgreSQL
- Optional Redis
- Dev OTP provider
- COD payments
- In-app notifications
- No Firebase dependency
- No paid SMS required locally
- No paid analytics required

The cheapest production path keeps the same app flow but runs fewer always-on services:

```text
Caddy -> static admin/public QR files
Caddy -> /api/* -> Express API
Express API -> PostgreSQL
Cron -> database/file backups
```

For early MVP, start on a 2 GB RAM VPS. That is a practical starting point for roughly 1,000-5,000 owners with light/moderate scan and chat traffic. Upgrade to 4 GB RAM when scans, owner app usage, or admin operations become noticeably slow.

Likely paid production items:

- Domain
- VPS
- SMS OTP
- App store accounts
- Payment gateway fees
- Sticker printing
- Courier/delivery
- Email at scale
- External backup storage

Cost guide: [docs/COST_GUIDE.md](docs/COST_GUIDE.md)

## Troubleshooting

### Port 3000 already in use

Stop the existing Next process or run another port manually from `apps/web`.

### Prisma cannot find DATABASE_URL

Make sure `apps/api/.env` exists and contains `DATABASE_URL`.

### Prisma EPERM rename error on Windows

Stop running API/dev servers and retry:

```powershell
npm run prisma:generate
```

Antivirus or an active Node process may be holding Prisma engine files.

### Owner app says connection problem

If using a real phone, do not use `10.0.2.2`. Use the PC LAN IP:

```powershell
flutter run --dart-define=API_BASE_URL=http://YOUR_PC_IP:4000 --dart-define=WEB_BASE_URL=http://YOUR_PC_IP:3000
```

### Scanner message appears in web but not owner app

Check:

- Owner app logged in with the same phone used when admin created the QR.
- API is running.
- Owner app is using the right LAN API URL.
- Requests tab is refreshed.
- Flutter logs show `[ScanContact Owner] requests filter=all count=...`.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API](docs/API.md)
- [Database](docs/DATABASE.md)
- [Local Setup](docs/LOCAL_SETUP.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Flutter Guide](docs/FLUTTER_GUIDE.md)
- [Admin Guide](docs/ADMIN_GUIDE.md)
- [User Guide](docs/USER_GUIDE.md)
- [Reseller Guide](docs/RESELLER_GUIDE.md)
- [Society Guide](docs/SOCIETY_GUIDE.md)
- [Backup and Restore](docs/BACKUP_RESTORE.md)
- [Security Checklist](docs/SECURITY_CHECKLIST.md)
- [Privacy Checklist](docs/PRIVACY_CHECKLIST.md)
- [SMS Provider Integration](docs/SMS_PROVIDER.md)
- [Payment Integration](docs/PAYMENT_INTEGRATION.md)
- [Push Notifications](docs/PUSH_NOTIFICATIONS.md)
- [Cost Guide](docs/COST_GUIDE.md)
- [Roadmap](docs/ROADMAP.md)

## Current Limitations

- Production SMS provider is not configured yet.
- Online payment providers are placeholders; COD is the working MVP path.
- Push notifications are optional/future. The owner app works without push.
- Call masking is not implemented and should not be added without legal provider approval.
- `apps/owner_app` is an older scaffold; use `apps/mobile` for the current owner app unless you intentionally merge or remove the older folder.

## Roadmap

Next recommended steps:

1. Remove or merge the older `apps/owner_app` scaffold to avoid confusion.
2. Add production SMS gateway integration.
3. Add bKash/Nagad/SSLCommerz sandbox verification.
4. Add external encrypted backup target.
5. Add push notification provider behind feature flags.
6. Add app icon and release signing configuration.
7. Add CI for API tests, web build/lint, and Flutter analyze/test.
8. Run a formal privacy and security review before public launch.
