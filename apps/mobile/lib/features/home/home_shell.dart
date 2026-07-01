import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/push/push_notification_service.dart';
import '../../core/services/owner_services.dart';
import '../../core/theme/app_theme.dart';
import '../account/account_screen.dart';
import '../alerts/alerts_screen.dart';
import '../requests/requests_screen.dart';
import '../tags/tags_screen.dart';
import 'home_screen.dart';

class HomeShell extends ConsumerStatefulWidget {
  const HomeShell({super.key});

  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell>
    with WidgetsBindingObserver {
  int index = 0;
  StreamSubscription<RemoteMessage>? pushMessageSubscription;
  StreamSubscription<RemoteMessage>? pushOpenedSubscription;
  Timer? callPollTimer;
  String? activeCallNavigationId;
  bool callPollInFlight = false;
  AppLifecycleState lifecycleState = AppLifecycleState.resumed;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    unawaited(_startPush());
    callPollTimer = Timer.periodic(
      const Duration(seconds: 3),
      (_) => unawaited(_pollIncomingCalls()),
    );
    unawaited(_pollIncomingCalls());
  }

  @override
  void dispose() {
    pushMessageSubscription?.cancel();
    pushOpenedSubscription?.cancel();
    callPollTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  Future<void> _startPush() async {
    await PushNotificationService.registerForCurrentUser(
      ref.read(ownerServiceProvider),
    );
    if (!mounted) return;
    pushMessageSubscription ??=
        PushNotificationService.listenToForegroundMessages(
          onMessage: (_) {
            if (mounted) _refreshCurrentData();
          },
        );
    pushOpenedSubscription ??= PushNotificationService.listenToOpenedMessages(
      onMessage: _handlePushNavigation,
    );
    final initialMessage = await PushNotificationService.initialMessage();
    if (mounted && initialMessage != null) {
      _handlePushNavigation(initialMessage);
    }
  }

  void _handlePushNavigation(RemoteMessage message) {
    if (!mounted) return;
    _refreshCurrentData();
    final route = message.data['route'];
    if (route is String && route.startsWith('/chat/')) {
      context.push(route);
      return;
    }
    if (route is String && route.startsWith('/call/')) {
      activeCallNavigationId = route.split('/').last;
      context.push(route);
      return;
    }
    final actionType = message.data['actionType'];
    final actionId = message.data['actionId'];
    if (actionType == 'request' && actionId is String && actionId.isNotEmpty) {
      context.push('/chat/$actionId');
    } else if (actionType == 'call' &&
        actionId is String &&
        actionId.isNotEmpty) {
      activeCallNavigationId = actionId;
      context.push('/call/$actionId');
    } else if (actionType == 'order') {
      context.push('/orders');
    } else if (actionType == 'tag') {
      openTab(1);
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    lifecycleState = state;
    if (state == AppLifecycleState.resumed) {
      _refreshCurrentData();
      unawaited(_pollIncomingCalls());
    }
  }

  void _refreshCurrentData() {
    ref.invalidate(dashboardProvider);
    if (index == 0) {
      ref.invalidate(ownerMeProvider);
      ref.invalidate(requestsProvider('all'));
      ref.invalidate(notificationsProvider);
    }
    if (index == 1) {
      ref.invalidate(tagsProvider);
    }
    if (index == 2) {
      ref.invalidate(requestsProvider('all'));
      ref.invalidate(requestsProvider('unread'));
      ref.invalidate(requestsProvider('open'));
      ref.invalidate(requestsProvider('closed'));
    }
    if (index == 3) {
      ref.invalidate(notificationsProvider);
    }
  }

  Future<void> _pollIncomingCalls() async {
    if (!mounted ||
        callPollInFlight ||
        lifecycleState != AppLifecycleState.resumed) {
      return;
    }
    callPollInFlight = true;
    try {
      final calls = await ref.read(ownerServiceProvider).incomingCalls();
      if (!mounted || calls.isEmpty) return;
      final call = calls.firstWhere(
        (item) => item.isRinging || item.isAccepted,
        orElse: () => calls.first,
      );
      if (call.isFinished || activeCallNavigationId == call.id) return;
      activeCallNavigationId = call.id;
      await context.push('/call/${call.id}');
      if (mounted) {
        activeCallNavigationId = null;
        _refreshCurrentData();
      }
    } catch (_) {
      // Incoming call polling is best effort. Push notifications and manual refresh still work.
    } finally {
      callPollInFlight = false;
    }
  }

  void openTab(int value) {
    setState(() => index = value);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _refreshCurrentData();
    });
  }

  @override
  Widget build(BuildContext context) {
    final dashboard = ref.watch(dashboardProvider).valueOrNull;
    final pages = [
      HomeScreen(onOpenTab: openTab),
      TagsScreen(onOpenShop: () => context.push('/shop')),
      const RequestsScreen(),
      const AlertsScreen(),
      const AccountScreen(),
    ];

    return Scaffold(
      backgroundColor: AppColors.page,
      body: SafeArea(
        child: ColoredBox(
          color: AppColors.page,
          child: IndexedStack(index: index, children: pages),
        ),
      ),
      bottomNavigationBar: DecoratedBox(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.border)),
          boxShadow: AppShadows.nav,
        ),
        child: SafeArea(
          top: false,
          child: NavigationBar(
            selectedIndex: index,
            onDestinationSelected: openTab,
            destinations: [
              const NavigationDestination(
                icon: Icon(Icons.home_outlined),
                selectedIcon: Icon(Icons.home),
                label: 'Home',
              ),
              const NavigationDestination(
                icon: Icon(Icons.qr_code_2_outlined),
                selectedIcon: Icon(Icons.qr_code_2),
                label: 'Tags',
              ),
              NavigationDestination(
                icon: Badge(
                  isLabelVisible: (dashboard?.unreadRequestCount ?? 0) > 0,
                  label: Text('${dashboard?.unreadRequestCount ?? 0}'),
                  child: const Icon(Icons.forum_outlined),
                ),
                selectedIcon: Badge(
                  isLabelVisible: (dashboard?.unreadRequestCount ?? 0) > 0,
                  label: Text('${dashboard?.unreadRequestCount ?? 0}'),
                  child: const Icon(Icons.forum),
                ),
                label: 'Requests',
              ),
              NavigationDestination(
                icon: Badge(
                  isLabelVisible: (dashboard?.unreadNotificationCount ?? 0) > 0,
                  label: Text('${dashboard?.unreadNotificationCount ?? 0}'),
                  child: const Icon(Icons.notifications_outlined),
                ),
                selectedIcon: Badge(
                  isLabelVisible: (dashboard?.unreadNotificationCount ?? 0) > 0,
                  label: Text('${dashboard?.unreadNotificationCount ?? 0}'),
                  child: const Icon(Icons.notifications),
                ),
                label: 'Alerts',
              ),
              const NavigationDestination(
                icon: Icon(Icons.person_outline),
                selectedIcon: Icon(Icons.person),
                label: 'Account',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
