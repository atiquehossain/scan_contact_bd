import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/owner_models.dart';
import '../../core/network/api_client.dart';
import '../../core/services/owner_services.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_widgets.dart';

class RequestsScreen extends ConsumerStatefulWidget {
  const RequestsScreen({super.key});

  @override
  ConsumerState<RequestsScreen> createState() => _RequestsScreenState();
}

class _RequestsScreenState extends ConsumerState<RequestsScreen>
    with WidgetsBindingObserver {
  final filters = const {
    'all': 'All',
    'unread': 'Unread',
    'open': 'Open',
    'closed': 'Closed',
  };

  String filter = 'all';
  List<ContactRequestSummary> items = [];
  bool loading = true;
  bool refreshing = false;
  String? error;
  Timer? refreshTimer;
  AppLifecycleState lifecycleState = AppLifecycleState.resumed;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    load(initial: true);
    refreshTimer = Timer.periodic(
      const Duration(seconds: 10),
      (_) => unawaited(load(silent: true)),
    );
  }

  @override
  void dispose() {
    refreshTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    lifecycleState = state;
    if (state == AppLifecycleState.resumed) {
      unawaited(load(silent: true));
    }
  }

  Future<void> load({bool initial = false, bool silent = false}) async {
    if (refreshing || lifecycleState != AppLifecycleState.resumed) return;
    if (!silent) {
      setState(() {
        loading = initial || items.isEmpty;
        error = null;
      });
    }
    refreshing = true;
    try {
      final requests = await ref
          .read(ownerServiceProvider)
          .requests(filter: filter);
      if (!mounted) return;
      setState(() {
        items = requests;
        error = null;
      });
      ref.invalidate(dashboardProvider);
    } catch (err) {
      if (!mounted) return;
      if (!silent || items.isEmpty) {
        setState(() => error = apiErrorMessage(err));
      }
    } finally {
      refreshing = false;
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> _refresh() => load();

  void _changeFilter(String nextFilter) {
    if (filter == nextFilter) return;
    setState(() {
      filter = nextFilter;
      items = [];
      loading = true;
      error = null;
    });
    unawaited(load(initial: true));
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const AppSkeletonList(count: 5);
    }
    if (error != null && items.isEmpty) {
      return AppErrorView(message: error!, onRetry: () => load(initial: true));
    }
    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView(
        padding: appPadding,
        children: [
          AppScreenHeader(
            title: 'Private Requests',
            subtitle:
                'Review scanner messages and continue private conversations.',
            icon: Icons.mark_chat_unread_outlined,
            trailing: refreshing
                ? const SizedBox.square(
                    dimension: 22,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : IconButton.filledTonal(
                    tooltip: 'Refresh private requests',
                    onPressed: () => load(),
                    icon: const Icon(Icons.refresh),
                  ),
          ),
          const SizedBox(height: AppSpacing.lg),
          const PrivacyNoticeCard(
            title: 'Private replies',
            message: 'Reply privately. Your phone number stays hidden.',
          ),
          const SizedBox(height: AppSpacing.lg),
          _RequestFilterBar(
            filters: filters,
            selectedFilter: filter,
            onChanged: _changeFilter,
          ),
          const SizedBox(height: AppSpacing.md),
          if (error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.md),
              child: AppInfoBanner(
                title: 'Could not refresh',
                message: error!,
                icon: Icons.wifi_off_outlined,
                tone: AppBannerTone.warning,
              ),
            ),
          if (items.isEmpty)
            AppEmptyState(
              icon: Icons.markunread_mailbox_outlined,
              title: filter == 'all'
                  ? 'No private requests yet'
                  : 'No ${filters[filter]!.toLowerCase()} requests',
              body: filter == 'all'
                  ? 'When someone scans your QR tag and contacts you, the request will appear here.'
                  : 'Try another filter or pull down to refresh this request queue.',
            )
          else
            for (final request in items)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.md),
                child: _InboxRequestCard(
                  request: request,
                  onTap: () async {
                    await context.push('/chat/${request.id}');
                    if (mounted) unawaited(load(silent: true));
                  },
                ),
              ),
        ],
      ),
    );
  }
}

class _RequestFilterBar extends StatelessWidget {
  const _RequestFilterBar({
    required this.filters,
    required this.selectedFilter,
    required this.onChanged,
  });

  final Map<String, String> filters;
  final String selectedFilter;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final entry in filters.entries)
            Padding(
              padding: const EdgeInsets.only(right: AppSpacing.sm),
              child: FilterChip(
                label: Text(entry.value),
                selected: selectedFilter == entry.key,
                avatar: Icon(_filterIcon(entry.key), size: 18),
                showCheckmark: false,
                onSelected: (_) => onChanged(entry.key),
              ),
            ),
        ],
      ),
    );
  }

  IconData _filterIcon(String value) {
    switch (value) {
      case 'unread':
        return Icons.markunread_outlined;
      case 'open':
        return Icons.forum_outlined;
      case 'closed':
        return Icons.lock_outline;
      default:
        return Icons.inbox_outlined;
    }
  }
}

class _InboxRequestCard extends StatelessWidget {
  const _InboxRequestCard({required this.request, required this.onTap});

  final ContactRequestSummary request;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final activity = request.lastActivityAt ?? request.updatedAt;
    final statusLabel = _requestStatusLabel(request);
    final details = [
      request.tagLabel,
      if (request.tagType?.isNotEmpty == true) humanizeCode(request.tagType!),
      if (request.scannerName?.isNotEmpty == true) request.scannerName!,
    ];
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
              _RequestIconBadge(isUnread: request.isUnread),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      humanizeCode(request.reason),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      details.join(' - '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.slate,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              StatusChip(label: statusLabel, icon: _requestStatusIcon(request)),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            request.scannerMessage.isEmpty
                ? 'No message preview available.'
                : request.scannerMessage,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.charcoal,
              height: 1.38,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.xs,
            children: [
              _RequestMetaChip(
                icon: Icons.schedule,
                label: 'Updated ${formatDateTime(activity)}',
              ),
              if (request.expiresAt != null && request.canReply)
                _RequestMetaChip(
                  icon: Icons.hourglass_bottom_outlined,
                  label: 'Expires ${formatDateTime(request.expiresAt!)}',
                ),
              _RequestMetaChip(
                icon: Icons.visibility_off_outlined,
                label: 'Phone hidden',
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: Text(
                  request.canReply
                      ? 'Tap to reply privately'
                      : 'Tap to view conversation',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: AppColors.emeraldDark,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.emeraldDark),
            ],
          ),
        ],
      ),
    );
  }
}

class _RequestIconBadge extends StatelessWidget {
  const _RequestIconBadge({required this.isUnread});

  final bool isUnread;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: isUnread ? AppColors.emerald : AppColors.infoSoft,
        borderRadius: BorderRadius.circular(AppRadii.md),
      ),
      child: Icon(
        isUnread ? Icons.mark_chat_unread_outlined : Icons.forum_outlined,
        color: isUnread ? Colors.white : AppColors.info,
      ),
    );
  }
}

class _RequestMetaChip extends StatelessWidget {
  const _RequestMetaChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: 7,
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
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: AppColors.slate,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

String _requestStatusLabel(ContactRequestSummary request) {
  if (request.isDeleted) return 'Deleted';
  if (request.isExpired) return 'Expired';
  if (request.isUnread) return 'Unread';
  if (!request.canReply) return 'Closed';
  return 'Open';
}

IconData _requestStatusIcon(ContactRequestSummary request) {
  if (request.isDeleted) return Icons.delete_outline;
  if (request.isExpired) return Icons.timer_off_outlined;
  if (request.isUnread) return Icons.markunread_outlined;
  if (!request.canReply) return Icons.lock_outline;
  return Icons.chat_bubble_outline;
}
