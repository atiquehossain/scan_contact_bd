# NoNumQR Push Notification Integration Guide

In-app notifications work first and are stored in PostgreSQL. Android push uses optional Firebase Cloud Messaging (FCM). The app still works if push is disabled or not configured.

## Android owner app

Place the Firebase Android client config here:

```text
apps/mobile/android/app/google-services.json
```

This file is ignored by git. The current local file is for package:

```text
com.nonumqr.owner
```

If the Android `applicationId` changes later, create a new Firebase Android app and download a matching `google-services.json`.

## Flutter run

Push is enabled by default in the owner app. To disable it:

```powershell
flutter run --dart-define=ENABLE_PUSH=false
```

When an owner logs in, the app requests notification permission, gets an FCM device token, and registers it with:

```text
POST /devices/register
```

You should see debug logs like:

```text
[NoNumQR Push] Firebase initialized
[NoNumQR Push] permission=authorized
[NoNumQR Push] device token registered token=xxxxxxx...xxxxx
```

## Backend sending

The Android JSON is only for the app. The backend also needs Firebase service-account credentials to send notifications when the app is closed.

Add these to `apps/api/.env`:

```env
FCM_PROJECT_ID=your-firebase-project-id
FCM_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project.iam.gserviceaccount.com
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

The API sends push notifications for:

- new public contact requests
- new scanner replies in an existing conversation

If credentials are missing, the API logs a skip message and still creates normal in-app notifications.

## Safety rules

- Do not commit Firebase client configs or service-account keys.
- Do not log full FCM tokens in production.
- Push notification payloads must not contain owner phone numbers, names, addresses, IDs, or private data.
- Public QR codes still contain only the public URL.
- APNs for iOS can be added later with the same provider pattern.
