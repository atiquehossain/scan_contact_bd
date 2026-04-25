# SMS Provider Integration Guide

OTP is provider-based:

- `DevLogOtpProvider`: local development only.
- `SmsGatewayOtpProvider`: production integration point.

Production requirements:

- Do not log OTP values.
- Hash OTPs at rest.
- Rate limit by phone and IP.
- Verify delivery status where provider supports it.
- Use approved SMS templates and comply with local telecom rules.
