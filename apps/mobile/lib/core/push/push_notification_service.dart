import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import '../config/app_config.dart';
import '../services/owner_services.dart';

@pragma('vm:entry-point')
Future<void> scanContactFirebaseMessagingBackgroundHandler(
  RemoteMessage message,
) async {
  try {
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp();
    }
    _debugPush('background message received id=${message.messageId ?? 'none'}');
  } catch (error) {
    _debugPush('background init failed type=${error.runtimeType}');
  }
}

class PushNotificationService {
  PushNotificationService._();

  static bool _initialized = false;
  static StreamSubscription<String>? _tokenRefreshSubscription;

  static Future<void> initializeCore() async {
    if (!AppConfig.enablePush) {
      _debugPush('disabled by ENABLE_PUSH=false');
      return;
    }
    if (_initialized) return;
    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp();
      }
      FirebaseMessaging.onBackgroundMessage(
        scanContactFirebaseMessagingBackgroundHandler,
      );
      _initialized = true;
      _debugPush('Firebase initialized');
    } catch (error) {
      _debugPush('Firebase init skipped type=${error.runtimeType}');
    }
  }

  static Future<void> registerForCurrentUser(OwnerService ownerService) async {
    if (!AppConfig.enablePush) return;
    await initializeCore();
    if (!_initialized) return;

    try {
      final messaging = FirebaseMessaging.instance;
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      _debugPush('permission=${settings.authorizationStatus.name}');
      if (settings.authorizationStatus == AuthorizationStatus.denied) return;

      final token = await messaging.getToken();
      if (token == null || token.isEmpty) {
        _debugPush('no device token returned');
        return;
      }

      await ownerService.registerDeviceToken(
        token: token,
        platform: _platformName,
        provider: 'fcm',
      );
      _debugPush('device token registered token=${_shortToken(token)}');

      await _tokenRefreshSubscription?.cancel();
      _tokenRefreshSubscription = messaging.onTokenRefresh.listen((newToken) {
        unawaited(
          ownerService
              .registerDeviceToken(
                token: newToken,
                platform: _platformName,
                provider: 'fcm',
              )
              .then(
                (_) => _debugPush(
                  'refreshed token registered token=${_shortToken(newToken)}',
                ),
              )
              .catchError(
                (Object error) => _debugPush(
                  'token refresh registration failed type=${error.runtimeType}',
                ),
              ),
        );
      });
    } catch (error) {
      _debugPush('registration failed type=${error.runtimeType}');
    }
  }

  static StreamSubscription<RemoteMessage>? listenToForegroundMessages({
    required void Function(RemoteMessage message) onMessage,
  }) {
    if (!AppConfig.enablePush || !_initialized) return null;
    return FirebaseMessaging.onMessage.listen((message) {
      _debugPush(
        'foreground message received id=${message.messageId ?? 'none'}',
      );
      onMessage(message);
    });
  }

  static Future<RemoteMessage?> initialMessage() async {
    if (!AppConfig.enablePush) return null;
    await initializeCore();
    if (!_initialized) return null;
    return FirebaseMessaging.instance.getInitialMessage();
  }

  static StreamSubscription<RemoteMessage>? listenToOpenedMessages({
    required void Function(RemoteMessage message) onMessage,
  }) {
    if (!AppConfig.enablePush || !_initialized) return null;
    return FirebaseMessaging.onMessageOpenedApp.listen((message) {
      _debugPush('notification opened id=${message.messageId ?? 'none'}');
      onMessage(message);
    });
  }

  static Future<void> unregisterCurrentToken(OwnerService ownerService) async {
    if (!AppConfig.enablePush) return;
    await initializeCore();
    if (!_initialized) return;

    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null || token.isEmpty) return;
      await ownerService.unregisterDeviceToken(token);
      await FirebaseMessaging.instance.deleteToken();
      _debugPush('device token unregistered token=${_shortToken(token)}');
    } catch (error) {
      _debugPush('unregister failed type=${error.runtimeType}');
    } finally {
      await _tokenRefreshSubscription?.cancel();
      _tokenRefreshSubscription = null;
    }
  }

  static Future<void> shutdown() async {
    await _tokenRefreshSubscription?.cancel();
    _tokenRefreshSubscription = null;
  }

  static String get _platformName {
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'android';
      case TargetPlatform.iOS:
        return 'ios';
      case TargetPlatform.macOS:
        return 'macos';
      case TargetPlatform.windows:
        return 'windows';
      case TargetPlatform.linux:
        return 'linux';
      case TargetPlatform.fuchsia:
        return 'fuchsia';
    }
  }
}

void _debugPush(String message) {
  if (!kDebugMode) return;
  debugPrint('[ScanContact Push] $message');
}

String _shortToken(String token) {
  if (token.length <= 14) return 'short-token';
  return '${token.substring(0, 7)}...${token.substring(token.length - 5)}';
}
