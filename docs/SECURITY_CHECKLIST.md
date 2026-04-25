# Security Checklist

- Use HTTPS through Caddy or another reverse proxy.
- Set strong `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `OTP_SECRET`.
- Keep `NODE_ENV=production` in production so OTP codes are never logged.
- Configure strict `CORS_ORIGINS`.
- Keep database and Redis ports private to the VPS network.
- Rotate admin passwords after first deploy.
- Configure external encrypted backups before accepting real users.
- Validate SMS/payment provider webhook signatures before enabling live payments.
- Do not enable call masking without a legal approved provider.
- Review Bangladesh telecom, payment, privacy, e-commerce, tax, and consumer-protection regulations from official sources before launch.
