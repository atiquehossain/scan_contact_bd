import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../../core/push/push_notification_service.dart';
import '../../core/services/owner_services.dart';
import '../../core/widgets/app_widgets.dart';

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final owner = ref.watch(ownerMeProvider);
    return owner.when(
      loading: () => const AppLoadingView(label: 'Loading account...'),
      error: (error, _) => AppErrorView(
        message: apiErrorMessage(error),
        onRetry: () => ref.invalidate(ownerMeProvider),
      ),
      data: (profile) => ListView(
        padding: appPadding,
        children: [
          Text(
            'Account',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              leading: const Icon(Icons.person_outline),
              title: Text(profile.name),
              subtitle: Text('${profile.phone}\nVisible only to you'),
              isThreeLine: true,
            ),
          ),
          const SizedBox(height: 12),
          const PrivacyNoticeCard(),
          const SizedBox(height: 12),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.local_shipping_outlined),
                  title: const Text('My orders'),
                  subtitle: const Text('Track QR tag orders'),
                  onTap: () => context.push('/orders'),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.shopping_bag_outlined),
                  title: const Text('Buy QR Tag'),
                  subtitle: const Text('Order a QR tag by Cash on Delivery'),
                  onTap: () => context.push('/shop'),
                ),
                const Divider(height: 1),
                const ListTile(
                  leading: Icon(Icons.health_and_safety_outlined),
                  title: Text('Privacy & safety'),
                  subtitle: Text(
                    'Your phone number is hidden from scanners inside ScanContact BD.',
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: () => _confirmLogout(context, ref),
            icon: const Icon(Icons.logout),
            label: const Text('Logout'),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout?'),
        content: const Text(
          'You can log in again with your owner phone number and OTP.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Stay logged in'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await PushNotificationService.unregisterCurrentToken(
        ref.read(ownerServiceProvider),
      );
    } catch (_) {
      // Local logout must not be blocked by best-effort push cleanup.
    }
    try {
      await PushNotificationService.shutdown();
    } catch (_) {
      // FCM listener shutdown is also best effort during logout.
    }
    await ref.read(tokenStoreProvider).clear();
    invalidateOwnerScopedProviders(ref);
    if (context.mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Logout success')));
      context.go('/auth');
    }
  }
}
