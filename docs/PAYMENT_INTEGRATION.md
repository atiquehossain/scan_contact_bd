# Payment Integration Guide

The MVP includes:

- `ManualCodProvider`: fully working Cash on Delivery provider.
- `PlaceholderPaymentProvider`: bKash, Nagad, Rocket, and SSLCommerz sandbox-ready placeholders.

Before enabling live online payment:

1. Create provider credentials with the licensed gateway.
2. Implement `createPayment`, `verifyPayment`, `handleWebhook`, and `refundPayment`.
3. Verify webhook signatures on the backend.
4. Never trust client-only success.
5. Add sandbox and live test cases.
