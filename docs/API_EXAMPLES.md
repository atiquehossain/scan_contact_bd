# API Examples

Request OTP:

```bash
curl -X POST http://localhost:4000/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"01700000003","purpose":"LOGIN"}'
```

Create tag:

```bash
curl -X POST http://localhost:4000/tags \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"CAR","label":"Family Car","privacyMode":"PRIVATE_CONTACT_ONLY"}'
```

Public contact request after admin creates a real QR tag:

```bash
curl -X POST http://localhost:4000/t/REAL_PUBLIC_SLUG/contact \
  -H "Content-Type: application/json" \
  -d '{"reason":"VEHICLE_BLOCKING","message":"Your vehicle is blocking the exit."}'
```
