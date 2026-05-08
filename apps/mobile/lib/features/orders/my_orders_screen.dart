import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/services/owner_services.dart';
import '../../core/widgets/app_widgets.dart';

class MyOrdersScreen extends ConsumerWidget {
  const MyOrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orders = ref.watch(ordersProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('My orders')),
      body: orders.when(
        loading: () => const AppLoadingView(label: 'Loading orders...'),
        error: (error, _) => AppErrorView(
          message: apiErrorMessage(error),
          onRetry: () => ref.invalidate(ordersProvider),
        ),
        data: (items) => RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(ordersProvider);
            ref.invalidate(dashboardProvider);
            await ref.read(ordersProvider.future);
          },
          child: ListView(
            padding: appPadding,
            children: [
              Text(
                'My orders',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 8),
              const Text('Track QR tag printing, assignment, and delivery.'),
              const SizedBox(height: 16),
              if (items.isEmpty)
                const AppEmptyState(
                  icon: Icons.local_shipping_outlined,
                  title: 'No orders yet',
                  body:
                      'Buy a QR tag first. Your order status will appear here.',
                )
              else
                for (final order in items)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: OrderStatusCard(order: order),
                  ),
            ],
          ),
        ),
      ),
    );
  }
}
