import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/models/owner_models.dart';
import '../../core/network/api_client.dart';
import '../../core/services/owner_services.dart';
import '../../core/theme/app_theme.dart';
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
            AppScreenHeader(
              title: 'My QR Tags',
              subtitle:
                  'Preview your public QR links and keep scanner contact private.',
              icon: Icons.qr_code_2_outlined,
              trailing: IconButton.filledTonal(
                tooltip: 'Buy QR Tag',
                onPressed: onOpenShop,
                icon: const Icon(Icons.shopping_bag_outlined),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            const PrivacyNoticeCard(
              title: 'QR privacy',
              message:
                  'This QR contains only a public URL. It does not contain your phone number.',
            ),
            const SizedBox(height: AppSpacing.lg),
            if (items.isEmpty)
              AppEmptyState(
                icon: Icons.qr_code_2_outlined,
                title: 'No QR tags yet',
                body: dashboard?.latestOrder == null
                    ? 'Order a QR tag first. After admin prints and assigns it to your phone number, it will appear here.'
                    : 'Order created. Admin will process and assign your QR tag.',
                action: dashboard?.latestOrder == null
                    ? FilledButton.icon(
                        onPressed: onOpenShop,
                        icon: const Icon(Icons.shopping_bag_outlined),
                        label: const Text('Buy QR Tag'),
                      )
                    : OrderStatusCard(order: dashboard!.latestOrder!),
              )
            else ...[
              AppSectionHeader(
                title: '${items.length} active records',
                actionLabel: 'Buy QR Tag',
                onAction: onOpenShop,
              ),
              const SizedBox(height: AppSpacing.sm),
              for (final tag in items)
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.md),
                  child: QRTagCard(tag: tag),
                ),
            ],
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
    return AppSurface(
      onTap: () => _showQrPreviewSheet(context, tag),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _QrPreviewBox(tag: tag, size: 112),
              const SizedBox(width: AppSpacing.md),
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
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      humanizeCode(tag.type),
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.slate,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Wrap(
                      spacing: AppSpacing.sm,
                      runSpacing: AppSpacing.xs,
                      children: [
                        StatusChip(label: tag.status),
                        StatusChip(
                          label: '${tag.scanCount} scans',
                          icon: Icons.document_scanner_outlined,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          _TagActivityLine(tag: tag),
          const SizedBox(height: AppSpacing.md),
          CopyableUrlRow(url: tag.publicUrl),
          const SizedBox(height: AppSpacing.md),
          const _QrPrivacyLine(),
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: [
              FilledButton.icon(
                onPressed: () => _showQrPreviewSheet(context, tag),
                icon: const Icon(Icons.qr_code_2),
                label: const Text('Preview QR'),
              ),
              OutlinedButton.icon(
                onPressed: () => _openPublicPage(context, tag.publicUrl),
                icon: const Icon(Icons.open_in_new),
                label: const Text('Open public page'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _QrPreviewBox extends StatelessWidget {
  const _QrPreviewBox({required this.tag, required this.size});

  final QrTag tag;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'QR code preview for ${tag.label}',
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppRadii.lg),
          border: Border.all(color: AppColors.border),
          boxShadow: AppShadows.card,
        ),
        child: QrImageView(
          data: tag.publicUrl,
          size: size,
          backgroundColor: Colors.white,
        ),
      ),
    );
  }
}

class _TagActivityLine extends StatelessWidget {
  const _TagActivityLine({required this.tag});

  final QrTag tag;

  @override
  Widget build(BuildContext context) {
    final lastScannedAt = tag.lastScannedAt;
    final createdAt = tag.createdAt;
    final label = lastScannedAt != null
        ? 'Last scanned ${formatActivity(lastScannedAt)}'
        : createdAt != null
        ? 'Created ${formatActivity(createdAt)}'
        : 'No scan activity yet';

    return Row(
      children: [
        const Icon(Icons.history_outlined, size: 18, color: AppColors.emerald),
        const SizedBox(width: AppSpacing.xs),
        Expanded(
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppColors.slate,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}

class _QrPrivacyLine extends StatelessWidget {
  const _QrPrivacyLine();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.emeraldSoft,
        borderRadius: BorderRadius.circular(AppRadii.md),
        border: Border.all(color: AppColors.tealSoft),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.visibility_off_outlined,
            color: AppColors.emeraldDark,
            size: 20,
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              'This QR contains only a public URL. It does not contain your phone number.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.charcoal,
                height: 1.35,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _QrPreviewSheet extends StatelessWidget {
  const _QrPreviewSheet({required this.tag});

  final QrTag tag;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SingleChildScrollView(
        child: Container(
          margin: const EdgeInsets.all(AppSpacing.sm),
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadii.xl),
            border: Border.all(color: AppColors.border),
            boxShadow: AppShadows.nav,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'QR Preview',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  IconButton(
                    tooltip: 'Close QR preview',
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              Center(child: _QrPreviewBox(tag: tag, size: 228)),
              const SizedBox(height: AppSpacing.lg),
              Text(
                tag.label,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: AppSpacing.xs),
              Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.xs,
                children: [
                  StatusChip(label: tag.status),
                  StatusChip(label: humanizeCode(tag.type)),
                  StatusChip(label: '${tag.scanCount} scans'),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              CopyableUrlRow(url: tag.publicUrl),
              const SizedBox(height: AppSpacing.md),
              const _QrPrivacyLine(),
              const SizedBox(height: AppSpacing.md),
              Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: [
                  FilledButton.icon(
                    onPressed: () => _openPublicPage(context, tag.publicUrl),
                    icon: const Icon(Icons.open_in_new),
                    label: const Text('Open public page'),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.check),
                    label: const Text('Done'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

void _showQrPreviewSheet(BuildContext context, QrTag tag) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _QrPreviewSheet(tag: tag),
  );
}

Future<void> _openPublicPage(BuildContext context, String publicUrl) async {
  final uri = Uri.tryParse(publicUrl.trim());
  if (publicUrl.trim().isEmpty || uri == null || !uri.hasScheme) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Public link is not available.')),
    );
    return;
  }
  final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
  if (!launched && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Could not open public page.')),
    );
  }
}
