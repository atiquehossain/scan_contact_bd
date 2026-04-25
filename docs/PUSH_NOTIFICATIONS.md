# Push Notification Integration Guide

In-app notifications work first and are stored in PostgreSQL. Push is optional.

Future providers:

- FCM for Android.
- APNs for iOS.
- NoOp provider for development.

Rules:

- App must work when push is disabled.
- Backend must not crash without push credentials.
- Ask for notification permission only after user intent.
- Deep link notifications to tag, request, or order screens.
