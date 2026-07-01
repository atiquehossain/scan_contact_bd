# NoNumQR Cost Guide

Local development has zero paid service dependencies:

- PostgreSQL container
- Optional Redis container
- Optional Mailpit container
- Development OTP provider
- Cash on Delivery payments
- Local file storage

## Lean MVP Recommendation

Start with one small VPS and only the required services:

```text
Caddy static web + API + PostgreSQL
```

Do not run a separate Next.js web runtime, Redis, worker, MinIO, analytics, or paid email/SMS until the product needs them. The default Docker Compose setup follows this lean path.

Approximate capacity for the lean setup:

| VPS size | Practical use |
| --- | --- |
| 1 GB RAM | Testing only |
| 2 GB RAM | Early MVP, roughly 1,000-5,000 owners with light to moderate scans |
| 4 GB RAM | Safer public launch, roughly 5,000-20,000 owners |

Capacity depends more on daily QR scans, concurrent app users, and chat traffic than total stored users.

Likely production costs:

- Domain name
- Low-cost VPS
- SMS OTP gateway
- QR sticker printing
- Courier/delivery
- Payment gateway transaction fees
- App Store and Play Store developer accounts
- External backup storage
- Email provider at scale
