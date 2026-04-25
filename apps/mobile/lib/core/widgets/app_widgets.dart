import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

import '../models/owner_models.dart';

const appPadding = EdgeInsets.all(16);

String formatDateTime(DateTime value) =>
    DateFormat('MMM d, h:mm a').format(value);
String formatBdt(int value) => NumberFormat.currency(
  locale: 'en_BD',
  symbol: '৳',
  decimalDigits: 0,
).format(value);

class AppLoadingView extends StatelessWidget {
  const AppLoadingView({super.key, this.label = 'Loading...'});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: appPadding,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(label, textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class AppErrorView extends StatelessWidget {
  const AppErrorView({super.key, required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: appPadding,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline,
              color: Theme.of(context).colorScheme.error,
              size: 40,
            ),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}

class AppEmptyState extends StatelessWidget {
  const AppEmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.body,
    this.action,
  });

  final IconData icon;
  final String title;
  final String body;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 42, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              body,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            if (action != null) ...[const SizedBox(height: 16), action!],
          ],
        ),
      ),
    );
  }
}

class StatCard extends StatelessWidget {
  const StatCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: Theme.of(context).colorScheme.primary),
            const Spacer(),
            Text(
              value,
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 4),
            Text(label, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}

class PrivacyNoticeCard extends StatelessWidget {
  const PrivacyNoticeCard({
    super.key,
    this.message =
        'Your phone number is hidden from scanners. Chat stays inside ScanContact unless you choose another channel.',
  });

  final String message;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Theme.of(context).colorScheme.primaryContainer,
      child: ListTile(
        leading: const Icon(Icons.visibility_off_outlined),
        title: const Text('Privacy protected'),
        subtitle: Text(message),
      ),
    );
  }
}

class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.label, this.icon});

  final String label;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Chip(
      avatar: icon == null ? null : Icon(icon, size: 16),
      label: Text(label),
      visualDensity: VisualDensity.compact,
    );
  }
}

class CopyableUrlRow extends StatelessWidget {
  const CopyableUrlRow({super.key, required this.url});

  final String url;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Public QR URL',
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(url, maxLines: 2, overflow: TextOverflow.ellipsis),
            ),
            Tooltip(
              message: 'Copy public QR URL',
              child: IconButton(
                onPressed: () async {
                  await Clipboard.setData(ClipboardData(text: url));
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Public QR URL copied')),
                    );
                  }
                },
                icon: const Icon(Icons.copy),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class RequestCard extends StatelessWidget {
  const RequestCard({super.key, required this.request, required this.onTap});

  final ContactRequestSummary request;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      request.reason,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  StatusChip(
                    label: request.isUnread ? 'Unread' : 'Read',
                    icon: request.isUnread ? Icons.markunread : Icons.done,
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                request.tagLabel,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 8),
              Text(
                request.scannerMessage,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 10),
              Text(
                formatDateTime(request.createdAt),
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ChatBubble extends StatelessWidget {
  const ChatBubble({super.key, required this.message, this.onRetry});

  final ChatMessage message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final isOwner = message.isOwner;
    final color = isOwner
        ? Theme.of(context).colorScheme.primaryContainer
        : Theme.of(context).colorScheme.surface;
    return Align(
      alignment: isOwner ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        constraints: const BoxConstraints(maxWidth: 320),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: Theme.of(context).colorScheme.outlineVariant,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isOwner ? 'You' : 'Scanner',
              style: Theme.of(
                context,
              ).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 4),
            Text(message.message),
            const SizedBox(height: 6),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${formatDateTime(message.createdAt)} · ${message.status}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                if (message.status == 'failed' && onRetry != null)
                  TextButton(onPressed: onRetry, child: const Text('Retry')),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class ProductCard extends StatelessWidget {
  const ProductCard({super.key, required this.product, required this.onOrder});

  final Product product;
  final VoidCallback onOrder;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              product.name,
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(product.description),
            if (product.estimatedDeliveryNote != null) ...[
              const SizedBox(height: 8),
              Text(
                product.estimatedDeliveryNote!,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Text(
                    formatBdt(product.priceBdt),
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                FilledButton(
                  onPressed: onOrder,
                  child: const Text('Order COD'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class OrderStatusCard extends StatelessWidget {
  const OrderStatusCard({super.key, required this.order, this.onTap});

  final OwnerOrder order;
  final VoidCallback? onTap;

  String get statusCopy {
    switch (order.status) {
      case 'created':
      case 'pending':
        return 'Order created. Admin will review it.';
      case 'processing':
        return 'Admin is processing your QR sticker.';
      case 'printed':
        return 'Your QR sticker has been printed.';
      case 'assigned':
        return 'QR assigned. Check your Tags tab.';
      case 'delivered':
        return 'Order delivered.';
      case 'cancelled':
        return 'Order cancelled.';
      default:
        return 'Admin will process your order and assign your QR after printing.';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        onTap: onTap,
        leading: const Icon(Icons.local_shipping_outlined),
        title: Text(order.productName),
        subtitle: Text(
          '$statusCopy\n${order.orderNumber} · ${formatBdt(order.priceBdt)}',
        ),
        isThreeLine: true,
        trailing: StatusChip(label: order.status),
      ),
    );
  }
}

class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.loading = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final child = loading
        ? const SizedBox.square(
            dimension: 20,
            child: CircularProgressIndicator(strokeWidth: 2),
          )
        : Text(label);
    return FilledButton.icon(
      onPressed: loading ? null : onPressed,
      icon: icon == null ? const SizedBox.shrink() : Icon(icon),
      label: child,
    );
  }
}

class SecondaryButton extends StatelessWidget {
  const SecondaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onPressed,
      icon: icon == null ? const SizedBox.shrink() : Icon(icon),
      label: Text(label),
    );
  }
}
