# NoNumQR Flutter Owner App Setup Guide

The current owner app lives in `apps/mobile`. It is the owner-facing app for login/signup, assigned QR tags, notifications, private chat, and COD QR sticker orders.

- OTP login/signup with the owner phone number
- Secure token storage with Flutter Secure Storage
- Dashboard with assigned QR tags, scans, requests, and notifications
- QR preview and public URL copy
- Private chat replies to scanners
- Buy QR Code flow with COD order creation

## Android

```bash
cd apps/mobile
flutter run --dart-define=APP_NAME="NoNumQR Owner" --dart-define=API_BASE_URL=http://10.0.2.2:4000
flutter build apk --release --obfuscate --split-debug-info=build/debug-info
```

## iOS

```bash
cd apps/mobile
flutter run -d ios --dart-define=APP_NAME="NoNumQR Owner" --dart-define=API_BASE_URL=http://localhost:4000
flutter build ios --release --obfuscate --split-debug-info=build/debug-info
```

## Release Checklist

- Configure Android package name and iOS bundle ID.
- Add production app icon and splash.
- Set production API URL.
- Confirm camera permission copy.
- Do not enable push unless FCM/APNs is configured.
- Confirm no secrets are embedded in source.
- Review Play Store/App Store privacy labels.
