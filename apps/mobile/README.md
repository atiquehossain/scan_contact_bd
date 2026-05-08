# ScanContact BD Owner App

Flutter owner app for ScanContact BD. Owners use this app to sign in with OTP,
view assigned QR tags, receive private scanner requests, and reply without
showing their phone number.

## Development URLs

Debug builds can use local HTTP endpoints. If `API_BASE_URL` and `WEB_BASE_URL`
are omitted, the app falls back to the Android emulator host aliases:

```text
API: http://10.0.2.2:4000
Web: http://10.0.2.2:3000
```

Run from the mobile app directory:

```powershell
cd C:\Users\atique.hossain\StudioProjects\ScanContact\apps\mobile
flutter run
```

For a physical Android device, pass a URL that the phone can reach on the same
network:

```powershell
flutter run `
  --dart-define=API_BASE_URL=http://YOUR_PC_IP:4000 `
  --dart-define=WEB_BASE_URL=http://YOUR_PC_IP:3000
```

Check the API from the phone browser first:

```text
http://YOUR_PC_IP:4000/health
```

## Production Release

Release builds, and any build with `ENVIRONMENT=production`, require explicit
HTTPS URLs. The app does not fall back to LAN or emulator HTTP endpoints in
release. The Android release build also validates these dart-defines during
the Gradle build and fails if either URL is missing or not HTTPS.

```powershell
$env:SCANCONTACT_APPLICATION_ID = "com.yourcompany.scancontact.owner"

flutter build appbundle --release `
  --dart-define=ENVIRONMENT=production `
  --dart-define=API_BASE_URL=https://api.your-domain.example `
  --dart-define=WEB_BASE_URL=https://app.your-domain.example `
  --dart-define=ENABLE_PUSH=true `
  --dart-define=ENABLE_ANALYTICS=true
```

Android cleartext traffic is enabled only for the debug build type. Production
URLs must use `https://`.

## Android Application ID

The Gradle build reads the permanent Play Store application ID from
`SCANCONTACT_APPLICATION_ID`. Set it either as an environment variable, as shown
above, or as a Gradle property in `android/gradle.properties`:

```properties
SCANCONTACT_APPLICATION_ID=com.yourcompany.scancontact.owner
```

Choose this before the first Play release. The package name cannot be changed
after publishing without creating a new app listing. The repository default stays
aligned with the checked-in local Firebase config, so production builds also need
a `google-services.json` client that matches the production application ID.

## iOS Permissions

The iOS runner declares camera usage for QR scanning and microphone usage for
calls. Keep the permission text aligned with the actual QR scanner and call
flows when those features change.
