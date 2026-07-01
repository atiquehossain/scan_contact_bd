# NoNumQR Database Notes

The Prisma schema in `apps/api/prisma/schema.prisma` models users, OTPs, sessions, roles, permissions, QR tags, contact settings, scans, contact requests, notifications, products, carts, orders, payments, reseller flows, society/parking flows, CMS pages, audit logs, consent logs, deletion requests, uploads, backup logs, cities, and districts.

NoNumQR QR codes store only public URL slugs; private owner data stays in PostgreSQL behind authenticated API access.

Important rules:

- `QrTag.publicSlug` is unique and generated from secure random bytes.
- `User.phone` is normalized to `+8801XXXXXXXXX`.
- OTP and refresh tokens are stored as HMAC hashes, never plaintext.
- Public scan queries intentionally select only safe fields.
- Soft delete exists for user-facing records where recovery/audit matters.
- Admin-sensitive access should be logged with `AuditLog`.
