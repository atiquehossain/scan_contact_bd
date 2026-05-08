import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/config/app_config.dart';
import 'core/models/owner_models.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/auth_screen.dart';
import 'features/auth/splash_screen.dart';
import 'features/calls/owner_call_screen.dart';
import 'features/chat/chat_screen.dart';
import 'features/home/home_shell.dart';
import 'features/orders/my_orders_screen.dart';
import 'features/scanner/scanner_contact_screen.dart';
import 'features/scanner/scanner_conversation_screen.dart';
import 'features/scanner/scanner_screen.dart';
import 'features/shop/checkout_screen.dart';
import 'features/shop/shop_screen.dart';
import 'core/push/push_notification_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await PushNotificationService.initializeCore();
  runApp(const ProviderScope(child: ScanContactApp()));
}

class ScanContactApp extends StatelessWidget {
  const ScanContactApp({super.key});

  @override
  Widget build(BuildContext context) {
    final router = GoRouter(
      initialLocation: '/splash',
      routes: [
        GoRoute(
          path: '/splash',
          builder: (context, state) => const SplashScreen(),
        ),
        GoRoute(path: '/auth', builder: (context, state) => const AuthScreen()),
        GoRoute(path: '/main', builder: (context, state) => const HomeShell()),
        GoRoute(path: '/shop', builder: (context, state) => const ShopScreen()),
        GoRoute(
          path: '/checkout',
          builder: (context, state) => CheckoutScreen(
            product: state.extra is Product ? state.extra! as Product : null,
          ),
        ),
        GoRoute(
          path: '/orders',
          builder: (context, state) => const MyOrdersScreen(),
        ),
        GoRoute(
          path: '/scan',
          builder: (context, state) => const ScannerScreen(),
        ),
        GoRoute(
          path: '/scanner/contact/:publicSlug',
          builder: (context, state) => ScannerContactScreen(
            publicSlug: state.pathParameters['publicSlug']!,
          ),
        ),
        GoRoute(
          path: '/scanner/conversation/:requestId',
          builder: (context, state) => ScannerConversationScreen(
            requestId: state.pathParameters['requestId']!,
            token: state.uri.queryParameters['token'] ?? '',
          ),
        ),
        GoRoute(
          path: '/chat/:requestId',
          builder: (context, state) =>
              ChatScreen(requestId: state.pathParameters['requestId']!),
        ),
        GoRoute(
          path: '/call/:callId',
          builder: (context, state) =>
              OwnerCallScreen(callId: state.pathParameters['callId']!),
        ),
        GoRoute(
          path: '/request/:requestId',
          redirect: (context, state) =>
              '/chat/${state.pathParameters['requestId']}',
        ),
        GoRoute(
          path: '/order/:orderId',
          builder: (context, state) => const MyOrdersScreen(),
        ),
      ],
    );

    return MaterialApp.router(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      routerConfig: router,
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [Locale('en'), Locale('bn')],
      theme: AppTheme.light(),
    );
  }
}
