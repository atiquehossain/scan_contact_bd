import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/owner_models.dart';
import '../../core/network/api_client.dart';
import '../../core/services/owner_services.dart';
import '../../core/theme/app_theme.dart';
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
      loading: () => const AppSkeletonList(),
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
              data: (profile) => _DashboardHero(
                ownerName: profile.name,
                activeQrCount: data.activeQrCount,
                unreadRequestCount: data.unreadRequestCount,
                onScan: () => context.push('/scan'),
              ),
              orElse: () => _DashboardHero(
                ownerName: 'Owner',
                activeQrCount: data.activeQrCount,
                unreadRequestCount: data.unreadRequestCount,
                onScan: () => context.push('/scan'),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            const PrivacyNoticeCard(
              title: 'Privacy status',
              message: 'Your phone number is hidden by default.',
            ),
            const SizedBox(height: AppSpacing.md),
            const AppInfoBanner(
              title: 'Owner tip',
              message:
                  'Reply privately. Scanners do not see your phone number.',
              icon: Icons.lock_outline,
              tone: AppBannerTone.info,
            ),
            const SizedBox(height: AppSpacing.lg),
            const AppSectionHeader(title: 'Today at a glance'),
            const SizedBox(height: AppSpacing.sm),
            GridView.count(
              crossAxisCount: 2,
              mainAxisSpacing: AppSpacing.md,
              crossAxisSpacing: AppSpacing.md,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 1.08,
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
                  accent: AppColors.info,
                ),
                StatCard(
                  label: 'Unread alerts',
                  value: '${data.unreadNotificationCount}',
                  icon: Icons.notifications_outlined,
                  accent: AppColors.amber,
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            _PriorityCard(
              data: data,
              onOpenRequests: () => onOpenTab(2),
              onBuyQr: () => context.push('/shop'),
              onOpenOrders: () => context.push('/orders'),
            ),
            const SizedBox(height: AppSpacing.lg),
            const AppSectionHeader(title: 'Quick actions'),
            const SizedBox(height: AppSpacing.sm),
            GridView.count(
              crossAxisCount: 2,
              mainAxisSpacing: AppSpacing.md,
              crossAxisSpacing: AppSpacing.md,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 1.72,
              children: [
                QuickActionTile(
                  icon: Icons.qr_code_2_outlined,
                  label: 'My QR Tags',
                  subtitle: 'Preview links',
                  onTap: () => onOpenTab(1),
                ),
                QuickActionTile(
                  icon: Icons.forum_outlined,
                  label: 'Private Requests',
                  subtitle: 'Reply privately',
                  onTap: () => onOpenTab(2),
                ),
                QuickActionTile(
                  icon: Icons.shopping_bag_outlined,
                  label: 'Buy QR Tag',
                  subtitle: 'COD available',
                  onTap: () => context.push('/shop'),
                ),
                QuickActionTile(
                  icon: Icons.qr_code_scanner,
                  label: 'Scan a NoNumQR',
                  subtitle: 'Open contact page',
                  onTap: () => context.push('/scan'),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            AppSectionHeader(
              title: 'Recent private requests',
              actionLabel: 'View all',
              onAction: () => onOpenTab(2),
            ),
            const SizedBox(height: AppSpacing.sm),
            if (data.recentRequests.isEmpty)
              const AppEmptyState(
                icon: Icons.forum_outlined,
                title: 'No private requests yet',
                body:
                    'When someone scans your QR tag and contacts you, the request will appear here.',
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
              const SizedBox(height: AppSpacing.sm),
              AppSectionHeader(
                title: 'Latest order',
                actionLabel: 'Orders',
                onAction: () => context.push('/orders'),
              ),
              const SizedBox(height: AppSpacing.sm),
              OrderStatusCard(
                order: data.latestOrder!,
                onTap: () => context.push('/orders'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _DashboardHero extends StatelessWidget {
  const _DashboardHero({
    required this.ownerName,
    required this.activeQrCount,
    required this.unreadRequestCount,
    required this.onScan,
  });

  final String ownerName;
  final int activeQrCount;
  final int unreadRequestCount;
  final VoidCallback onScan;

  @override
  Widget build(BuildContext context) {
    final safeName = ownerName.trim().isEmpty ? 'Owner' : ownerName.trim();
    return AppSurface(
      color: AppColors.charcoal,
      borderColor: AppColors.emeraldDark,
      boxShadow: AppShadows.card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.emeraldSoft,
                  borderRadius: BorderRadius.circular(AppRadii.md),
                ),
                child: const Icon(
                  Icons.qr_code_2,
                  color: AppColors.emeraldDark,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hello, $safeName',
                      style: Theme.of(context).textTheme.headlineSmall
                          ?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                          ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      'Manage private QR contact from your phone.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.78),
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              IconButton.filledTonal(
                tooltip: 'Scan a NoNumQR',
                onPressed: onScan,
                icon: const Icon(Icons.qr_code_scanner),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: [
              _HeroPill(
                icon: Icons.visibility_off_outlined,
                label: 'Phone hidden',
              ),
              _HeroPill(
                icon: Icons.qr_code_2_outlined,
                label: '$activeQrCount active tags',
              ),
              _HeroPill(
                icon: Icons.markunread_outlined,
                label: '$unreadRequestCount unread',
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeroPill extends StatelessWidget {
  const _HeroPill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppRadii.pill),
        border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: AppColors.tealSoft),
          const SizedBox(width: AppSpacing.xs),
          Text(
            label,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
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

  final OwnerDashboard data;
  final VoidCallback onOpenRequests;
  final VoidCallback onBuyQr;
  final VoidCallback onOpenOrders;

  @override
  Widget build(BuildContext context) {
    if (data.unreadRequestCount > 0) {
      return AppSurface(
        color: AppColors.emeraldSoft,
        borderColor: AppColors.tealSoft,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            StatusChip(
              label: '${data.unreadRequestCount} unread',
              icon: Icons.markunread_outlined,
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'New private requests need attention',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: AppSpacing.sm),
            const Text('Reply privately. Your phone number stays hidden.'),
            const SizedBox(height: AppSpacing.lg),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: onOpenRequests,
                icon: const Icon(Icons.forum),
                label: const Text('Open private chats'),
              ),
            ),
          ],
        ),
      );
    }
    if (!data.hasAssignedQr && data.latestOrder == null) {
      return _NoQrCard(onBuyQr: onBuyQr);
    }
    if (!data.hasAssignedQr && data.latestOrder != null) {
      return OrderStatusCard(order: data.latestOrder!, onTap: onOpenOrders);
    }
    return const AppInfoBanner(
      title: 'No new private requests',
      message:
          'You are all caught up. Scan and contact updates will appear here.',
      icon: Icons.check_circle_outline,
      tone: AppBannerTone.success,
    );
  }
}

class _NoQrCard extends StatelessWidget {
  const _NoQrCard({required this.onBuyQr});

  final VoidCallback onBuyQr;

  @override
  Widget build(BuildContext context) {
    return AppSurface(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const StatusChip(
            label: 'Setup needed',
            icon: Icons.qr_code_2_outlined,
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'No QR tag yet',
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: AppSpacing.sm),
          const Text(
            'Order a QR tag so people can contact you privately. Your QR tag will be assigned after order processing.',
          ),
          const SizedBox(height: AppSpacing.lg),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: onBuyQr,
              icon: const Icon(Icons.shopping_bag_outlined),
              label: const Text('Buy QR Tag'),
            ),
          ),
        ],
      ),
    );
  }
}
