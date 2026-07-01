import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/network/api_client.dart';
import '../../core/push/push_notification_service.dart';
import '../../core/services/owner_services.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_widgets.dart';

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
    if (!mounted) return;
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
      await PushNotificationService.registerForCurrentUser(
        ref.read(ownerServiceProvider),
      );
      if (mounted) context.go('/main');
    } catch (err) {
      if (!mounted) return;
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
        child: Container(
          width: double.infinity,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0xFFF0FDFA), AppColors.page],
            ),
          ),
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppSpacing.xxl),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 360),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const NoNumQRBrandMark(size: 88),
                    const SizedBox(height: AppSpacing.xxl),
                    Text(
                      AppConfig.appName,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w900,
                        color: AppColors.charcoal,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      'Private QR contact, made simple.',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.slate,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.section),
                    AppSurface(
                      padding: const EdgeInsets.all(AppSpacing.xl),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (validating) ...[
                            const SizedBox.square(
                              dimension: 34,
                              child: CircularProgressIndicator(strokeWidth: 3),
                            ),
                            const SizedBox(height: AppSpacing.md),
                            Text(
                              'Checking secure session',
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.bodyMedium
                                  ?.copyWith(
                                    color: AppColors.slate,
                                    fontWeight: FontWeight.w700,
                                  ),
                            ),
                          ],
                          if (error != null) ...[
                            AppInfoBanner(
                              title: 'No connection',
                              message: error!,
                              icon: Icons.wifi_off_outlined,
                              tone: AppBannerTone.warning,
                            ),
                            const SizedBox(height: AppSpacing.lg),
                            PrimaryButton(
                              label: 'Retry',
                              icon: Icons.refresh,
                              onPressed: validateSession,
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xxl),
                    Text(
                      'Secure owner access',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        color: AppColors.muted,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
