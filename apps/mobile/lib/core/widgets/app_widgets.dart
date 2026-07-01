import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

import '../models/owner_models.dart';
import '../theme/app_theme.dart';

const appPadding = EdgeInsets.all(AppSpacing.lg);

String formatDateTime(DateTime value) =>
    DateFormat('MMM d, h:mm a').format(value);

String formatBdt(int value) => NumberFormat.currency(
  locale: 'en_BD',
  symbol: 'BDT ',
  decimalDigits: 0,
).format(value);

String humanizeCode(String value) {
  final text = value.trim();
  if (text.isEmpty) return 'Not available';
  return text
      .replaceAll('_', ' ')
      .replaceAll('-', ' ')
      .toLowerCase()
      .split(RegExp(r'\s+'))
      .where((part) => part.isNotEmpty)
      .map((part) => part[0].toUpperCase() + part.substring(1))
      .join(' ');
}

String formatActivity(DateTime? value, {String empty = 'No activity yet'}) {
  if (value == null) return empty;
  return formatDateTime(value);
}

class NoNumQRBrandMark extends StatelessWidget {
  const NoNumQRBrandMark({super.key, this.size = 72});

  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox.square(
      dimension: size,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(size * 0.24),
                color: AppColors.emeraldSoft,
                border: Border.all(color: AppColors.border),
                boxShadow: AppShadows.card,
              ),
              child: Icon(
                Icons.qr_code_2,
                color: AppColors.emeraldDark,
                size: size * 0.52,
              ),
            ),
          ),
          Positioned(
            right: -size * 0.08,
            top: -size * 0.08,
            child: _BrandBadge(
              size: size * 0.34,
              icon: Icons.visibility_off_outlined,
              background: AppColors.emerald,
              foreground: Colors.white,
            ),
          ),
          Positioned(
            left: -size * 0.08,
            bottom: -size * 0.08,
            child: _BrandBadge(
              size: size * 0.34,
              icon: Icons.shield_outlined,
              background: AppColors.surface,
              foreground: AppColors.emeraldDark,
            ),
          ),
        ],
      ),
    );
  }
}

class _BrandBadge extends StatelessWidget {
  const _BrandBadge({
    required this.size,
    required this.icon,
    required this.background,
    required this.foreground,
  });

  final double size;
  final IconData icon;
  final Color background;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: background,
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.surface, width: 2),
      ),
      child: Icon(icon, color: foreground, size: size * 0.55),
    );
  }
}

class AppSurface extends StatelessWidget {
  const AppSurface({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(AppSpacing.lg),
    this.color = AppColors.surface,
    this.borderColor = AppColors.border,
    this.radius = AppRadii.lg,
    this.boxShadow = AppShadows.card,
    this.onTap,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color color;
  final Color borderColor;
  final double radius;
  final List<BoxShadow> boxShadow;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final borderRadius = BorderRadius.circular(radius);
    final content = Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: color,
        borderRadius: borderRadius,
        border: Border.all(color: borderColor),
        boxShadow: boxShadow,
      ),
      child: child,
    );
    if (onTap == null) return content;
    return Material(
      color: Colors.transparent,
      child: InkWell(borderRadius: borderRadius, onTap: onTap, child: content),
    );
  }
}

class AppScreenHeader extends StatelessWidget {
  const AppScreenHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.trailing,
    this.icon,
  });

  final String title;
  final String? subtitle;
  final Widget? trailing;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (icon != null) ...[
          _IconBadge(icon: icon!, color: AppColors.emerald),
          const SizedBox(width: AppSpacing.md),
        ],
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
              ),
              if (subtitle != null) ...[
                const SizedBox(height: AppSpacing.xs),
                Text(
                  subtitle!,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.slate,
                    height: 1.35,
                  ),
                ),
              ],
            ],
          ),
        ),
        if (trailing != null) ...[
          const SizedBox(width: AppSpacing.sm),
          trailing!,
        ],
      ],
    );
  }
}

class AppSectionHeader extends StatelessWidget {
  const AppSectionHeader({
    super.key,
    required this.title,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900),
          ),
        ),
        if (actionLabel != null && onAction != null)
          TextButton(onPressed: onAction, child: Text(actionLabel!)),
      ],
    );
  }
}

class AppLoadingView extends StatelessWidget {
  const AppLoadingView({super.key, this.label = 'Loading...'});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: appPadding,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 320),
          child: AppSurface(
            padding: const EdgeInsets.all(AppSpacing.xxl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox.square(
                  dimension: 40,
                  child: CircularProgressIndicator(strokeWidth: 3),
                ),
                const SizedBox(height: AppSpacing.lg),
                Text(
                  label,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.slate,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class AppSkeletonList extends StatelessWidget {
  const AppSkeletonList({super.key, this.count = 4});

  final int count;

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: appPadding,
      itemCount: count,
      separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.md),
      itemBuilder: (context, index) => const AppSurface(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _SkeletonBar(widthFactor: 0.55),
            SizedBox(height: AppSpacing.md),
            _SkeletonBar(widthFactor: 0.9),
            SizedBox(height: AppSpacing.sm),
            _SkeletonBar(widthFactor: 0.72),
          ],
        ),
      ),
    );
  }
}

class _SkeletonBar extends StatelessWidget {
  const _SkeletonBar({required this.widthFactor});

  final double widthFactor;

  @override
  Widget build(BuildContext context) {
    return FractionallySizedBox(
      widthFactor: widthFactor,
      alignment: Alignment.centerLeft,
      child: Container(
        height: 12,
        decoration: BoxDecoration(
          color: AppColors.border,
          borderRadius: BorderRadius.circular(AppRadii.sm),
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
    final isOffline =
        message.toLowerCase().contains('connection') ||
        message.toLowerCase().contains('offline');
    final copy = isOffline
        ? "You're offline. Check your connection and try again."
        : message;
    return Center(
      child: Padding(
        padding: appPadding,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 380),
          child: AppSurface(
            color: AppColors.surface,
            borderColor: isOffline ? AppColors.amber : AppColors.border,
            padding: const EdgeInsets.all(AppSpacing.xxl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _IconBadge(
                  icon: isOffline
                      ? Icons.wifi_off_outlined
                      : Icons.error_outline,
                  color: isOffline ? AppColors.amber : AppColors.red,
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  isOffline ? 'No connection' : 'Something went wrong',
                  textAlign: TextAlign.center,
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  copy,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.slate,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                FilledButton.icon(
                  onPressed: onRetry,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Try again'),
                ),
              ],
            ),
          ),
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
    return AppSurface(
      padding: const EdgeInsets.all(AppSpacing.xxl),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _IconBadge(icon: icon, color: AppColors.emerald),
          const SizedBox(height: AppSpacing.md),
          Text(
            title,
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            body,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.slate,
              height: 1.35,
            ),
          ),
          if (action != null) ...[
            const SizedBox(height: AppSpacing.lg),
            action!,
          ],
        ],
      ),
    );
  }
}

class AppInfoBanner extends StatelessWidget {
  const AppInfoBanner({
    super.key,
    required this.title,
    required this.message,
    this.icon = Icons.info_outline,
    this.tone = AppBannerTone.info,
  });

  final String title;
  final String message;
  final IconData icon;
  final AppBannerTone tone;

  @override
  Widget build(BuildContext context) {
    final colors = _bannerColors(tone);
    return AppSurface(
      color: colors.background,
      borderColor: colors.border,
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _IconBadge(icon: icon, color: colors.foreground),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: colors.foreground,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  message,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.charcoal,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

enum AppBannerTone { privacy, info, warning, danger, success }

({Color background, Color border, Color foreground}) _bannerColors(
  AppBannerTone tone,
) {
  switch (tone) {
    case AppBannerTone.privacy:
      return (
        background: AppColors.emeraldSoft,
        border: AppColors.border,
        foreground: AppColors.emeraldDark,
      );
    case AppBannerTone.warning:
      return (
        background: AppColors.amberSoft,
        border: AppColors.amber,
        foreground: AppColors.amber,
      );
    case AppBannerTone.danger:
      return (
        background: AppColors.redSoft,
        border: AppColors.red,
        foreground: AppColors.red,
      );
    case AppBannerTone.success:
      return (
        background: AppColors.tealSoft,
        border: AppColors.emerald,
        foreground: AppColors.emeraldDark,
      );
    case AppBannerTone.info:
      return (
        background: AppColors.infoSoft,
        border: AppColors.border,
        foreground: AppColors.info,
      );
  }
}

class PrivacyNoticeCard extends StatelessWidget {
  const PrivacyNoticeCard({
    super.key,
    this.title = 'Privacy protected',
    this.message = 'Your phone number is hidden from scanners by default.',
  });

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return AppInfoBanner(
      title: title,
      message: message,
      icon: Icons.visibility_off_outlined,
      tone: AppBannerTone.privacy,
    );
  }
}

class StatCard extends StatelessWidget {
  const StatCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.accent = AppColors.emerald,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return AppSurface(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _IconBadge(icon: icon, color: accent),
          const Spacer(),
          Text(
            value,
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppColors.slate,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class QuickActionTile extends StatelessWidget {
  const QuickActionTile({
    super.key,
    required this.icon,
    required this.label,
    required this.onTap,
    this.subtitle,
  });

  final IconData icon;
  final String label;
  final String? subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppSurface(
      onTap: onTap,
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        children: [
          _IconBadge(icon: icon, color: AppColors.emerald, size: 38),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: Theme.of(
                    context,
                  ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w900),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(color: AppColors.slate),
                  ),
                ],
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: AppColors.slate),
        ],
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
    final style = statusStyle(label);
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: 6,
      ),
      decoration: BoxDecoration(
        color: style.background,
        borderRadius: BorderRadius.circular(AppRadii.pill),
        border: Border.all(color: style.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: style.foreground),
            const SizedBox(width: AppSpacing.xs),
          ],
          Flexible(
            child: Text(
              humanizeCode(label),
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: style.foreground,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

({Color background, Color border, Color foreground}) statusStyle(String label) {
  final normalized = label.toLowerCase();
  if (normalized.contains('active') ||
      normalized.contains('open') ||
      normalized.contains('connected') ||
      normalized.contains('delivered') ||
      normalized.contains('assigned') ||
      normalized.contains('paid') ||
      normalized.contains('success')) {
    return (
      background: AppColors.tealSoft,
      border: AppColors.emerald,
      foreground: AppColors.emeraldDark,
    );
  }
  if (normalized.contains('pending') ||
      normalized.contains('cod') ||
      normalized.contains('created') ||
      normalized.contains('processing') ||
      normalized.contains('printed') ||
      normalized.contains('connecting') ||
      normalized.contains('ringing') ||
      normalized.contains('sending')) {
    return (
      background: AppColors.amberSoft,
      border: AppColors.amber,
      foreground: const Color(0xFF8A5600),
    );
  }
  if (normalized.contains('expired') ||
      normalized.contains('failed') ||
      normalized.contains('error') ||
      normalized.contains('declined') ||
      normalized.contains('cancelled') ||
      normalized.contains('disabled') ||
      normalized.contains('deleted') ||
      normalized.contains('closed')) {
    return (
      background: AppColors.redSoft,
      border: AppColors.red,
      foreground: AppColors.red,
    );
  }
  return (
    background: AppColors.infoSoft,
    border: AppColors.border,
    foreground: AppColors.info,
  );
}

class CopyableUrlRow extends StatelessWidget {
  const CopyableUrlRow({super.key, required this.url});

  final String url;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Public QR link',
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppRadii.md),
          color: AppColors.surfaceSoft,
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            const Icon(Icons.link, color: AppColors.emeraldDark),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Text(
                url,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
            ),
            Tooltip(
              message: 'Copy public link',
              child: IconButton(
                onPressed: () async {
                  await Clipboard.setData(ClipboardData(text: url));
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Public link copied')),
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
    final statusLabel = request.isExpired
        ? 'Expired'
        : request.isUnread
        ? 'Unread'
        : request.canReply
        ? 'Open'
        : 'Closed';
    final statusIcon = request.isExpired
        ? Icons.timer_off_outlined
        : request.isUnread
        ? Icons.markunread
        : request.canReply
        ? Icons.chat_bubble_outline
        : Icons.lock_outline;
    final activity = request.lastActivityAt ?? request.updatedAt;

    return AppSurface(
      onTap: onTap,
      color: request.isUnread ? AppColors.emeraldSoft : AppColors.surface,
      borderColor: request.isUnread ? AppColors.emerald : AppColors.border,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _IconBadge(
                icon: request.isUnread
                    ? Icons.mark_chat_unread_outlined
                    : Icons.forum_outlined,
                color: request.isUnread ? AppColors.emerald : AppColors.info,
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      humanizeCode(request.reason),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      [
                        request.tagLabel,
                        if (request.tagType != null)
                          humanizeCode(request.tagType!),
                        if (request.scannerName?.isNotEmpty == true)
                          request.scannerName!,
                      ].join(' • '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(
                        context,
                      ).textTheme.bodySmall?.copyWith(color: AppColors.slate),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              StatusChip(label: statusLabel, icon: statusIcon),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            request.scannerMessage.isEmpty
                ? 'No message preview available.'
                : request.scannerMessage,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.charcoal,
              height: 1.35,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.xs,
            children: [
              _MetaPill(
                icon: Icons.schedule,
                label: 'Updated ${formatDateTime(activity)}',
              ),
              if (request.expiresAt != null && request.canReply)
                _MetaPill(
                  icon: Icons.hourglass_bottom,
                  label: 'Expires ${formatDateTime(request.expiresAt!)}',
                ),
            ],
          ),
        ],
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
    final color = isOwner ? AppColors.emeraldSoft : AppColors.surface;
    final borderRadius = BorderRadius.only(
      topLeft: const Radius.circular(AppRadii.lg),
      topRight: const Radius.circular(AppRadii.lg),
      bottomLeft: Radius.circular(isOwner ? AppRadii.lg : AppRadii.xs),
      bottomRight: Radius.circular(isOwner ? AppRadii.xs : AppRadii.lg),
    );
    return Align(
      alignment: isOwner ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.sizeOf(context).width * 0.78,
        ),
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: color,
          borderRadius: borderRadius,
          border: Border.all(color: AppColors.border),
          boxShadow: AppShadows.card,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isOwner ? 'You' : 'Scanner',
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: isOwner ? AppColors.emeraldDark : AppColors.slate,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(message.message),
            const SizedBox(height: AppSpacing.sm),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Flexible(
                  child: Text(
                    '${formatDateTime(message.createdAt)} • ${humanizeCode(message.status)}',
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(color: AppColors.muted),
                  ),
                ),
                if (message.status == 'failed' && onRetry != null) ...[
                  const SizedBox(width: AppSpacing.sm),
                  TextButton(onPressed: onRetry, child: const Text('Retry')),
                ],
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
    return AppSurface(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 74,
                height: 74,
                decoration: BoxDecoration(
                  color: AppColors.emeraldSoft,
                  borderRadius: BorderRadius.circular(AppRadii.lg),
                  border: Border.all(color: AppColors.border),
                ),
                child: Icon(
                  _productIcon(product.name),
                  color: AppColors.emeraldDark,
                  size: 34,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _productName(product.name),
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      _productBenefit(product),
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.slate,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.xs,
            children: const [
              StatusChip(label: 'COD available', icon: Icons.payments_outlined),
              StatusChip(
                label: 'No phone number encoded',
                icon: Icons.visibility_off_outlined,
              ),
            ],
          ),
          if (product.estimatedDeliveryNote != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              product.estimatedDeliveryNote!,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: AppColors.slate),
            ),
          ],
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(
                child: Text(
                  formatBdt(product.priceBdt),
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900),
                ),
              ),
              FilledButton.icon(
                onPressed: onOrder,
                icon: const Icon(Icons.shopping_bag_outlined),
                label: const Text('Buy'),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'No phone number printed or encoded.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppColors.emeraldDark,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }

  IconData _productIcon(String name) {
    final normalized = name.toLowerCase();
    if (normalized.contains('car') || normalized.contains('parking')) {
      return Icons.directions_car_outlined;
    }
    if (normalized.contains('bike')) return Icons.two_wheeler_outlined;
    if (normalized.contains('lost') || normalized.contains('item')) {
      return Icons.inventory_2_outlined;
    }
    if (normalized.contains('business') || normalized.contains('card')) {
      return Icons.badge_outlined;
    }
    if (normalized.contains('shop')) return Icons.storefront_outlined;
    return Icons.qr_code_2;
  }

  String _productName(String name) {
    if (name.toLowerCase().contains('nonumqr')) return name;
    return 'NoNumQR $name';
  }

  String _productBenefit(Product product) {
    if (product.description.trim().isNotEmpty) return product.description;
    final name = product.name.toLowerCase();
    if (name.contains('car')) return 'Private contact for parked vehicles.';
    if (name.contains('bike')) return 'Private contact for bikes and riders.';
    if (name.contains('lost')) return 'Help finders reach you privately.';
    if (name.contains('shop')) return 'Let customers contact the shop safely.';
    return 'Private QR contact without exposing your phone number.';
  }
}

class OrderStatusCard extends StatelessWidget {
  const OrderStatusCard({
    super.key,
    required this.order,
    this.onTap,
    this.showTimeline = false,
  });

  final OwnerOrder order;
  final VoidCallback? onTap;
  final bool showTimeline;

  String get statusCopy {
    switch (order.status) {
      case 'created':
      case 'pending':
        return 'Order placed. We will confirm it soon.';
      case 'processing':
        return 'Your QR tag order is being processed.';
      case 'printed':
        return 'Your QR tag has been printed or assigned.';
      case 'assigned':
        return 'QR assigned. Check your Tags tab.';
      case 'delivered':
        return 'Order delivered.';
      case 'cancelled':
        return 'Order cancelled.';
      default:
        return 'We will process your order and assign your QR after printing.';
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppSurface(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _IconBadge(
                icon: Icons.local_shipping_outlined,
                color: AppColors.amber,
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      order.orderNumber.isEmpty
                          ? 'NNQR-2026-4829'
                          : order.orderNumber,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      order.productName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.copyWith(color: AppColors.slate),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              StatusChip(label: order.status),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Text(statusCopy),
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.xs,
            children: [
              _MetaPill(
                icon: Icons.calendar_today_outlined,
                label: formatDateTime(order.createdAt),
              ),
              _MetaPill(
                icon: Icons.payments_outlined,
                label: humanizeCode(order.paymentStatus ?? order.codStatus),
              ),
              _MetaPill(
                icon: Icons.account_balance_wallet_outlined,
                label: formatBdt(order.priceBdt),
              ),
              if (order.deliveryStatus != null)
                _MetaPill(
                  icon: Icons.delivery_dining_outlined,
                  label: humanizeCode(order.deliveryStatus!),
                ),
            ],
          ),
          if (showTimeline) ...[
            const SizedBox(height: AppSpacing.lg),
            OrderTimeline(status: order.status),
          ],
          if (onTap != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Align(
              alignment: Alignment.centerRight,
              child: Text(
                'View detail',
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: AppColors.emeraldDark,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class OrderTimeline extends StatelessWidget {
  const OrderTimeline({super.key, required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final steps = const [
      'Order placed',
      'Confirmed',
      'Printed/assigned',
      'Out for delivery',
      'Delivered',
    ];
    final activeIndex = _activeIndex(status);
    return Column(
      children: [
        for (var i = 0; i < steps.length; i++)
          _TimelineRow(
            label: steps[i],
            active: i <= activeIndex,
            isLast: i == steps.length - 1,
          ),
      ],
    );
  }

  int _activeIndex(String status) {
    switch (status.toLowerCase()) {
      case 'created':
      case 'pending':
        return 0;
      case 'confirmed':
      case 'processing':
        return 1;
      case 'printed':
      case 'assigned':
        return 2;
      case 'out_for_delivery':
      case 'shipped':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 0;
    }
  }
}

class _TimelineRow extends StatelessWidget {
  const _TimelineRow({
    required this.label,
    required this.active,
    required this.isLast,
  });

  final String label;
  final bool active;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final color = active ? AppColors.emerald : AppColors.border;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Icon(
              active ? Icons.check_circle : Icons.radio_button_unchecked,
              size: 18,
              color: color,
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 20,
                color: color.withValues(alpha: .5),
              ),
          ],
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Padding(
            padding: EdgeInsets.only(bottom: isLast ? 0 : AppSpacing.sm),
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: active ? AppColors.ink : AppColors.slate,
                fontWeight: active ? FontWeight.w800 : FontWeight.w600,
              ),
            ),
          ),
        ),
      ],
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
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: Colors.white,
            ),
          )
        : Text(label);
    if (icon == null) {
      return FilledButton(onPressed: loading ? null : onPressed, child: child);
    }
    return FilledButton.icon(
      onPressed: loading ? null : onPressed,
      icon: loading ? const SizedBox.shrink() : Icon(icon),
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
    if (icon == null) {
      return OutlinedButton(onPressed: onPressed, child: Text(label));
    }
    return OutlinedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon),
      label: Text(label),
    );
  }
}

class _IconBadge extends StatelessWidget {
  const _IconBadge({required this.icon, required this.color, this.size = 42});

  final IconData icon;
  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color.withValues(alpha: .12),
        borderRadius: BorderRadius.circular(AppRadii.md),
        border: Border.all(color: color.withValues(alpha: .28)),
      ),
      child: Icon(icon, color: color, size: size * .52),
    );
  }
}

class _MetaPill extends StatelessWidget {
  const _MetaPill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: 6,
      ),
      decoration: BoxDecoration(
        color: AppColors.surfaceSoft,
        borderRadius: BorderRadius.circular(AppRadii.pill),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.slate),
          const SizedBox(width: AppSpacing.xs),
          Flexible(
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.slate,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
