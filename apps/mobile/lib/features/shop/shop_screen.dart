import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../../core/services/owner_services.dart';
import '../../core/widgets/app_widgets.dart';

class ShopScreen extends ConsumerWidget {
  const ShopScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final products = ref.watch(productsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Buy QR Tag')),
      body: products.when(
        loading: () => const AppLoadingView(label: 'Loading products...'),
        error: (error, _) => AppErrorView(
          message: apiErrorMessage(error),
          onRetry: () => ref.invalidate(productsProvider),
        ),
        data: (items) => RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(productsProvider);
            await ref.read(productsProvider.future);
          },
          child: ListView(
            padding: appPadding,
            children: [
              Text(
                'Buy QR Tag',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Order a NoNumQR QR tag. After it is printed and assigned to your phone number, it will appear in your app.',
              ),
              const SizedBox(height: 12),
              const PrivacyNoticeCard(
                message:
                    'Your phone number is used for order and assignment only. It will not be printed on the QR tag.',
              ),
              const SizedBox(height: 16),
              if (items.isEmpty)
                AppEmptyState(
                  icon: Icons.inventory_2_outlined,
                  title: 'No QR tags available yet',
                  body:
                      'QR tag products will appear here after admin adds them.',
                  action: FilledButton.icon(
                    onPressed: () => ref.invalidate(productsProvider),
                    icon: const Icon(Icons.refresh),
                    label: const Text('Retry'),
                  ),
                )
              else
                for (final product in items)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: ProductCard(
                      product: product,
                      onOrder: () => context.push('/checkout', extra: product),
                    ),
                  ),
            ],
          ),
        ),
      ),
    );
  }
}
