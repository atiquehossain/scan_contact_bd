import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/owner_models.dart';
import '../../core/network/api_client.dart';
import '../../core/services/owner_services.dart';
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
      return const AppLoadingView(label: 'Loading private requests...');
    }
    if (error != null && items.isEmpty) {
      return AppErrorView(message: error!, onRetry: () => load(initial: true));
    }
    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView(
        padding: appPadding,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Private contact requests',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              if (refreshing)
                const SizedBox.square(
                  dimension: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
            ],
          ),
          const SizedBox(height: 4),
          const Text('Reply without showing your phone number.'),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (final entry in filters.entries)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(entry.value),
                      selected: filter == entry.key,
                      onSelected: (_) => _changeFilter(entry.key),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          if (error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Card(
                color: Theme.of(context).colorScheme.errorContainer,
                child: ListTile(
                  leading: const Icon(Icons.error_outline),
                  title: Text(error!),
                  trailing: TextButton(
                    onPressed: () => load(),
                    child: const Text('Retry'),
                  ),
                ),
              ),
            ),
          if (items.isEmpty)
            const AppEmptyState(
              icon: Icons.markunread_mailbox_outlined,
              title: 'No contact requests yet',
              body:
                  'When someone scans your QR and sends a message, it will appear here.',
            )
          else
            for (final request in items)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: RequestCard(
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
