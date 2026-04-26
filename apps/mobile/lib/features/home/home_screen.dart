import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../../core/services/owner_services.dart';
import '../../core/widgets/app_widgets.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key, required this.onOpenTab});

  final ValueChanged<int> onOpenTab;

  Future<void> _refresh(WidgetRef ref) async {
    ref.invalidate(ownerMeProvider);
    ref.invalidate(dashboardProvider);
    ref.invalidate(requestsProvider('all'));
    ref.invalidate(notificationsProvider);
    await ref.read(dashboardProvider.future);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final owner = ref.watch(ownerMeProvider);
    final dashboard = ref.watch(dashboardProvider);

    return dashboard.when(
      loading: () => const AppLoadingView(label: 'Loading dashboard...'),
      error: (error, _) => AppErrorView(
        message: apiErrorMessage(error),
        onRetry: () => ref.invalidate(dashboardProvider),
      ),
      data: (data) => RefreshIndicator(
        onRefresh: () => _refresh(ref),
        child: ListView(
          padding: appPadding,
          children: [
            owner.maybeWhen(
              data: (profile) => Text(
                'Hello, ${profile.name}',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
              ),
              orElse: () => Text(
                'Hello, Owner',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            const SizedBox(height: 4),
            const Text('Your phone stays hidden from scanners.'),
            const SizedBox(height: 16),
            _PriorityCard(
              data: data,
              onOpenRequests: () => onOpenTab(2),
              onBuyQr: () => context.push('/shop'),
              onOpenOrders: () => context.push('/orders'),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: () => context.push('/scan'),
                    icon: const Icon(Icons.qr_code_scanner),
                    label: const Text('Scan QR'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => context.push('/shop'),
                    icon: const Icon(Icons.shopping_bag_outlined),
                    label: const Text('Buy QR'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            GridView.count(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 1.2,
              children: [
                StatCard(
                  label: 'Active QR tags',
                  value: '${data.activeQrCount}',
                  icon: Icons.qr_code_2,
                ),
                StatCard(
                  label: 'Total scans',
                  value: '${data.totalScanCount}',
                  icon: Icons.document_scanner_outlined,
                ),
                StatCard(
                  label: 'Unread requests',
                  value: '${data.unreadRequestCount}',
                  icon: Icons.markunread_outlined,
                ),
                StatCard(
                  label: 'Alerts',
                  value: '${data.unreadNotificationCount}',
                  icon: Icons.notifications_outlined,
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Recent contact requests',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                TextButton(
                  onPressed: () => onOpenTab(2),
                  child: const Text('View all'),
                ),
              ],
            ),
            if (data.recentRequests.isEmpty)
              const AppEmptyState(
                icon: Icons.forum_outlined,
                title: 'No contact requests yet',
                body:
                    'When someone scans your QR and sends a message, it will appear here.',
              )
            else
              for (final request in data.recentRequests)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: RequestCard(
                    request: request,
                    onTap: () => context.push('/chat/${request.id}'),
                  ),
                ),
            if (data.latestOrder != null) ...[
              const SizedBox(height: 8),
              Text(
                'Latest order',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 8),
              OrderStatusCard(
                order: data.latestOrder!,
                onTap: () => context.push('/orders'),
              ),
            ],
            const SizedBox(height: 16),
            const PrivacyNoticeCard(),
          ],
        ),
      ),
    );
  }
}

class _PriorityCard extends StatelessWidget {
  const _PriorityCard({
    required this.data,
    required this.onOpenRequests,
    required this.onBuyQr,
    required this.onOpenOrders,
  });

  final dynamic data;
  final VoidCallback onOpenRequests;
  final VoidCallback onBuyQr;
  final VoidCallback onOpenOrders;

  @override
  Widget build(BuildContext context) {
    if (data.unreadRequestCount > 0) {
      return Card(
        color: Theme.of(context).colorScheme.primaryContainer,
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'You have ${data.unreadRequestCount} new message(s)',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 8),
              const Text('Reply privately without showing your phone number.'),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: onOpenRequests,
                icon: const Icon(Icons.forum),
                label: const Text('Open private chats'),
              ),
            ],
          ),
        ),
      );
    }
    if (!data.hasAssignedQr && data.latestOrder == null) {
      return _NoQrCard(onBuyQr: onBuyQr);
    }
    if (!data.hasAssignedQr && data.latestOrder != null) {
      return OrderStatusCard(order: data.latestOrder!, onTap: onOpenOrders);
    }
    return const Card(
      child: ListTile(
        leading: Icon(Icons.check_circle_outline),
        title: Text('No new messages'),
        subtitle: Text('We’ll show scan/contact updates here.'),
      ),
    );
  }
}

class _NoQrCard extends StatelessWidget {
  const _NoQrCard({required this.onBuyQr});

  final VoidCallback onBuyQr;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'No QR code yet',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 8),
            const Text(
              'Buy a QR sticker first. After admin prints and assigns it to your phone number, it will appear here.',
            ),
            const SizedBox(height: 12),
            const Text(
              '1. Order QR sticker\n2. Admin prints and assigns it\n3. You receive scan messages privately',
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onBuyQr,
              icon: const Icon(Icons.shopping_bag_outlined),
              label: const Text('Buy QR Code'),
            ),
          ],
        ),
      ),
    );
  }
}
