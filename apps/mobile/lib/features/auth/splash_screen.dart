import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/network/api_client.dart';
import '../../core/services/owner_services.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  String? error;
  bool validating = true;

  @override
  void initState() {
    super.initState();
    validateSession();
  }

  Future<void> validateSession() async {
    setState(() {
      validating = true;
      error = null;
    });
    final token = await ref.read(tokenStoreProvider).readAccessToken();
    if (!mounted) return;
    if (token == null || token.isEmpty) {
      context.go('/auth');
      return;
    }
    try {
      await ref.read(ownerServiceProvider).me();
      if (mounted) context.go('/main');
    } catch (err) {
      final message = apiErrorMessage(err);
      if (message.startsWith('Connection problem')) {
        setState(() {
          error = message;
          validating = false;
        });
      } else {
        await ref.read(tokenStoreProvider).clear();
        if (mounted) context.go('/auth');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircleAvatar(
                  radius: 36,
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  child: const Icon(
                    Icons.qr_code_2,
                    color: Colors.white,
                    size: 40,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  AppConfig.appName,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 20),
                if (validating) const CircularProgressIndicator(),
                if (error != null) ...[
                  Text(error!, textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    onPressed: validateSession,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Retry'),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
