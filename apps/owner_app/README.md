# ScanContact Owner App

Separate Flutter app for QR owners.

## Features

- OTP login with the owner phone number assigned by admin
- Signup option for new owners
- Owner dashboard with active QR tags, scans, requests, and alerts
- QR tag list with QR preview and public URL copy
- Private contact request inbox
- Two-way private chat with scanners
- In-app notification list
- Buy QR Code prompt and COD ordering when no QR is assigned
- Secure token storage with `flutter_secure_storage`

## Local Run

For Android emulator:

```powershell
flutter run --dart-define=APP_NAME="ScanContact Owner" --dart-define=API_BASE_URL=http://10.0.2.2:4000
```

For a physical phone on the same Wi-Fi:

```powershell
flutter run --dart-define=APP_NAME="ScanContact Owner" --dart-define=API_BASE_URL=http://192.168.0.131:4000
```

## Build Debug APK

```powershell
flutter build apk --debug --dart-define=APP_NAME="ScanContact Owner" --dart-define=API_BASE_URL=http://192.168.0.131:4000
```

Output:

```text
build/app/outputs/flutter-apk/app-debug.apk
```

## Owner Flow

1. Admin creates a QR tag for an owner phone number in the web admin panel.
2. Owner opens this app and logs in or signs up with the same phone number.
3. Owner sees assigned QR tags and any private chats.
4. If the owner has no QR tag, the app shows Buy QR Code and creates a COD order.
5. Scanner scans QR and sends a message.
6. Owner receives the request in the app and replies privately.
