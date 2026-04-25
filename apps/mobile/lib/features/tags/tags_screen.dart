import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/models/owner_models.dart';
import '../../core/network/api_client.dart';
import '../../core/services/owner_services.dart';
import '../../core/widgets/app_widgets.dart';

class TagsScreen extends ConsumerWidget {
  const TagsScreen({super.key, required this.onOpenShop});

  final VoidCallback onOpenShop;

  Future<void> _refresh(WidgetRef ref) async {
    ref.invalidate(tagsProvider);
    ref.invalidate(dashboardProvider);
    await ref.read(tagsProvider.future);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tags = ref.watch(tagsProvider);
    final dashboard = ref.watch(dashboardProvider).valueOrNull;
    return tags.when(
      loading: () => const AppLoadingView(label: 'Loading QR tags...'),
      error: (error, _) => AppErrorView(
        message: apiErrorMessage(error),
        onRetry: () => ref.invalidate(tagsProvider),
      ),
      data: (items) => RefreshIndicator(
        onRefresh: () => _refresh(ref),
        child: ListView(
          padding: appPadding,
          children: [
            Text(
              'My QR Tags',
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 4),
            const Text('QR tags assigned to your owner phone number.'),
            const SizedBox(height: 16),
            if (items.isEmpty)
              AppEmptyState(
                icon: Icons.qr_code_2_outlined,
                title: 'No QR code yet',
                body: dashboard?.latestOrder == null
                    ? 'Buy a QR sticker first. After admin prints and assigns it to your phone number, it will appear here.'
                    : 'Order created. Admin will process and assign your QR.',
                action: dashboard?.latestOrder == null
                    ? FilledButton.icon(
                        onPressed: onOpenShop,
                        icon: const Icon(Icons.shopping_bag_outlined),
                        label: const Text('Buy QR Code'),
                      )
                    : OrderStatusCard(order: dashboard!.latestOrder!),
              )
            else
              for (final tag in items)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: QRTagCard(tag: tag),
                ),
          ],
        ),
      ),
    );
  }
}

class QRTagCard extends StatelessWidget {
  const QRTagCard({super.key, required this.tag});

  final QrTag tag;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Semantics(
                  label: 'QR code for ${tag.label}',
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: Theme.of(context).colorScheme.outlineVariant,
                      ),
                    ),
                    child: QrImageView(
                      data: tag.publicUrl,
                      size: 112,
                      backgroundColor: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tag.label,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          StatusChip(label: tag.status),
                          StatusChip(label: tag.type),
                          StatusChip(label: '${tag.scanCount} scans'),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            CopyableUrlRow(url: tag.publicUrl),
            const SizedBox(height: 12),
            const PrivacyNoticeCard(
              message:
                  'This QR contains only a public URL. Your phone and identity stay hidden.',
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                OutlinedButton.icon(
                  onPressed: () async {
                    final uri = Uri.tryParse(tag.publicUrl);
                    if (uri != null) {
                      await launchUrl(
                        uri,
                        mode: LaunchMode.externalApplication,
                      );
                    }
                  },
                  icon: const Icon(Icons.open_in_new),
                  label: const Text('Open public URL'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
