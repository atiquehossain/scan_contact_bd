import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/services/owner_services.dart';
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

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _refreshCurrentData();
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
      body: SafeArea(
        child: IndexedStack(index: index, children: pages),
      ),
      bottomNavigationBar: NavigationBar(
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
    );
  }
}
