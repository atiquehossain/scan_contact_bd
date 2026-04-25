# API Documentation

Base URL for local development: `http://localhost:4000`.

Authentication uses `Authorization: Bearer <accessToken>`. OTP endpoints are public. Refresh token rotation is handled by `/auth/refresh`.

## Core Endpoints

- `POST /auth/request-otp`
- `POST /auth/verify-otp`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `POST /auth/refresh`
- `POST /auth/set-pin`
- `POST /auth/login-pin`
- `GET /me`
- `PATCH /me`
- `POST /me/delete-request`
- `GET /me/data-export`
- `GET /tags`
- `POST /tags`
- `GET /tags/:id`
- `PATCH /tags/:id`
- `POST /tags/:id/activate`
- `POST /tags/:id/disable`
- `DELETE /tags/:id`
- `GET /tags/:id/download-qr?format=png|svg`
- `GET /t/:publicSlug`
- `POST /t/:publicSlug/scan`
- `POST /t/:publicSlug/contact`
- `POST /t/:publicSlug/report-abuse`
- `GET /products`
- `POST /orders`
- `GET /admin/dashboard`
- `POST /reseller/apply`
- `POST /societies`

The code includes the remaining MVP route families for cart, payments, devices, emergency contacts, reseller, society, CMS, and admin CRUD operations.

## Development OTP

When `NODE_ENV` is not `production` and `OTP_PROVIDER=dev-log`, `/auth/request-otp` returns a `devOtp` field for local testing. Production mode never returns or logs OTP values.
