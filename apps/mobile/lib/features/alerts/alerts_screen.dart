import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/owner_models.dart';
import '../../core/network/api_client.dart';
import '../../core/services/owner_services.dart';
import '../../core/widgets/app_widgets.dart';

class AlertsScreen extends ConsumerWidget {
  const AlertsScreen({super.key});

  Future<void> _refresh(WidgetRef ref) async {
    ref.invalidate(notificationsProvider);
    ref.invalidate(dashboardProvider);
    await ref.read(notificationsProvider.future);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationsProvider);
    return notifications.when(
      loading: () => const AppLoadingView(label: 'Loading alerts...'),
      error: (error, _) => AppErrorView(
        message: apiErrorMessage(error),
        onRetry: () => ref.invalidate(notificationsProvider),
      ),
      data: (items) {
        final unread = items.where((item) => !item.isRead).length;
        return RefreshIndicator(
          onRefresh: () => _refresh(ref),
          child: ListView(
            padding: appPadding,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Alerts',
                      style: Theme.of(context).textTheme.headlineSmall
                          ?.copyWith(fontWeight: FontWeight.w900),
                    ),
                  ),
                  if (unread > 0)
                    TextButton(
                      onPressed: () async {
                        await ref
                            .read(ownerServiceProvider)
                            .markAllNotificationsRead();
                        ref.invalidate(notificationsProvider);
                        ref.invalidate(dashboardProvider);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('All alerts marked as read'),
                            ),
                          );
                        }
                      },
                      child: const Text('Mark all as read'),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              if (items.isEmpty)
                const AppEmptyState(
                  icon: Icons.notifications_none,
                  title: 'No notifications yet',
                  body:
                      'Scan events, contact requests, and order updates will appear here.',
                )
              else
                for (final group in _group(items).entries) ...[
                  Padding(
                    padding: const EdgeInsets.only(top: 12, bottom: 8),
                    child: Text(
                      group.key,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  for (final item in group.value)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: NotificationTile(notification: item),
                    ),
                ],
            ],
          ),
        );
      },
    );
  }

  Map<String, List<OwnerNotification>> _group(List<OwnerNotification> items) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final result = <String, List<OwnerNotification>>{
      'Today': [],
      'Yesterday': [],
      'Earlier': [],
    };
    for (final item in items) {
      final date = DateTime(
        item.createdAt.year,
        item.createdAt.month,
        item.createdAt.day,
      );
      if (date == today) {
        result['Today']!.add(item);
      } else if (date == yesterday) {
        result['Yesterday']!.add(item);
      } else {
        result['Earlier']!.add(item);
      }
    }
    result.removeWhere((_, value) => value.isEmpty);
    return result;
  }
}

class NotificationTile extends ConsumerWidget {
  const NotificationTile({super.key, required this.notification});

  final OwnerNotification notification;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      child: ListTile(
        leading: Icon(_icon(notification.type)),
        title: Text(
          notification.title,
          style: TextStyle(
            fontWeight: notification.isRead ? FontWeight.w600 : FontWeight.w900,
          ),
        ),
        subtitle: Text(
          '${notification.body}\n${formatDateTime(notification.createdAt)}',
        ),
        isThreeLine: true,
        trailing: notification.isRead
            ? null
            : const Icon(Icons.circle, size: 12),
        onTap: () async {
          await ref
              .read(ownerServiceProvider)
              .markNotificationRead(notification.id);
          ref.invalidate(notificationsProvider);
          ref.invalidate(dashboardProvider);
          if (!context.mounted) return;
          if (notification.actionType == 'request' &&
              notification.actionId != null) {
            context.push('/chat/${notification.actionId}');
          } else if (notification.actionType == 'order') {
            context.push('/orders');
          }
        },
      ),
    );
  }

  IconData _icon(String type) {
    if (type.contains('contact')) return Icons.forum_outlined;
    if (type.contains('scan')) return Icons.qr_code_scanner;
    if (type.contains('order')) return Icons.local_shipping_outlined;
    if (type.contains('security')) return Icons.security;
    return Icons.notifications_outlined;
  }
}
