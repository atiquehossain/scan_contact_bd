import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';

const appName = String.fromEnvironment('APP_NAME', defaultValue: 'NoNumQR Owner');
const apiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:4000');

void main() {
  runApp(const OwnerApp());
}

class TokenStore {
  TokenStore(this._storage);

  final FlutterSecureStorage _storage;

  Future<String?> get accessToken => _storage.read(key: 'accessToken');
  Future<String?> get refreshToken => _storage.read(key: 'refreshToken');

  Future<void> save(Map<String, dynamic> tokens) async {
    await _storage.write(key: 'accessToken', value: tokens['accessToken'] as String?);
    await _storage.write(key: 'refreshToken', value: tokens['refreshToken'] as String?);
  }

  Future<void> clear() => _storage.deleteAll();
}

class ApiClient {
  ApiClient(this._tokenStore)
      : _dio = Dio(
          BaseOptions(
            baseUrl: apiBaseUrl,
            connectTimeout: const Duration(seconds: 12),
            receiveTimeout: const Duration(seconds: 20),
            headers: {'Content-Type': 'application/json'},
          ),
        );

  final Dio _dio;
  final TokenStore _tokenStore;

  Future<Map<String, dynamic>> get(String path, {bool auth = true}) async {
    final response = await _dio.get(path, options: await _options(auth));
    return _asMap(response.data);
  }

  Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body, {bool auth = true}) async {
    final response = await _dio.post(path, data: body, options: await _options(auth));
    return _asMap(response.data);
  }

  Future<Map<String, dynamic>> patch(String path, Map<String, dynamic> body, {bool auth = true}) async {
    final response = await _dio.patch(path, data: body, options: await _options(auth));
    return _asMap(response.data);
  }

  Future<Options> _options(bool auth) async {
    if (!auth) return Options();
    final token = await _tokenStore.accessToken;
    return Options(headers: token == null ? null : {'Authorization': 'Bearer $token'});
  }

  Map<String, dynamic> _asMap(dynamic data) {
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {};
  }
}

class OwnerApp extends StatefulWidget {
  const OwnerApp({super.key});

  @override
  State<OwnerApp> createState() => _OwnerAppState();
}

class _OwnerAppState extends State<OwnerApp> {
  final tokenStore = TokenStore(const FlutterSecureStorage());
  late final api = ApiClient(tokenStore);
  bool loading = true;
  bool loggedIn = false;

  @override
  void initState() {
    super.initState();
    _boot();
  }

  Future<void> _boot() async {
    final token = await tokenStore.accessToken;
    setState(() {
      loggedIn = token != null && token.isNotEmpty;
      loading = false;
    });
  }

  Future<void> _logout() async {
    await tokenStore.clear();
    setState(() => loggedIn = false);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: appName,
      debugShowCheckedModeBanner: false,
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [Locale('en'), Locale('bn')],
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0F766E),
          primary: const Color(0xFF0F766E),
          secondary: const Color(0xFF16A34A),
          tertiary: const Color(0xFFD97706),
        ),
        scaffoldBackgroundColor: const Color(0xFFF6F9F7),
        cardTheme: const CardThemeData(
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
        ),
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
        ),
      ),
      home: loading
          ? const SplashScreen()
          : loggedIn
              ? OwnerShell(api: api, tokenStore: tokenStore, onLogout: _logout)
              : LoginScreen(api: api, tokenStore: tokenStore, onLogin: () => setState(() => loggedIn = true)),
    );
  }
}

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.api, required this.tokenStore, required this.onLogin});

  final ApiClient api;
  final TokenStore tokenStore;
  final VoidCallback onLogin;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final phoneController = TextEditingController(text: '01700000003');
  final nameController = TextEditingController();
  final otpController = TextEditingController();
  String message = '';
  String devOtp = '';
  bool busy = false;
  bool signupMode = false;

  Future<void> requestOtp() async {
    await _guard(() async {
      final data = await widget.api.post('/auth/request-otp', {
        'phone': phoneController.text.trim(),
        'purpose': signupMode ? 'REGISTER' : 'LOGIN',
      }, auth: false);
      setState(() {
        devOtp = data['devOtp']?.toString() ?? '';
        message = devOtp.isEmpty ? 'OTP sent.' : 'Dev OTP: $devOtp';
      });
    });
  }

  Future<void> verifyOtp() async {
    await _guard(() async {
      if (signupMode && nameController.text.trim().length < 2) {
        throw Exception('Name is required for signup.');
      }
      final data = await widget.api.post('/auth/verify-otp', {
        'phone': phoneController.text.trim(),
        'otp': otpController.text.trim(),
        if (nameController.text.trim().isNotEmpty) 'fullName': nameController.text.trim(),
        'language': 'EN',
      }, auth: false);
      await widget.tokenStore.save(data);
      widget.onLogin();
    });
  }

  Future<void> _guard(Future<void> Function() action) async {
    setState(() {
      busy = true;
      message = '';
    });
    try {
      await action();
    } on DioException catch (error) {
      setState(() => message = apiError(error));
    } catch (error) {
      setState(() => message = error.toString());
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const SizedBox(height: 24),
            const BrandHeader(subtitle: 'Owner app'),
            const SizedBox(height: 24),
            Text(signupMode ? 'Create owner account' : 'Login with owner phone', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            Text(signupMode ? 'Sign up with your own phone number. If admin already assigned QR tags to this number, they will appear after login.' : 'Use the same phone number admin assigned to the QR tag. Phone number stays hidden from scanners.'),
            const SizedBox(height: 16),
            SegmentedButton<bool>(
              segments: const [
                ButtonSegment(value: false, label: Text('Login'), icon: Icon(Icons.login)),
                ButtonSegment(value: true, label: Text('Signup'), icon: Icon(Icons.person_add_alt_1)),
              ],
              selected: {signupMode},
              onSelectionChanged: busy
                  ? null
                  : (selection) {
                      setState(() {
                        signupMode = selection.first;
                        message = '';
                        devOtp = '';
                      });
                    },
            ),
            const SizedBox(height: 20),
            TextField(
              controller: phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Bangladesh mobile number'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: nameController,
              decoration: InputDecoration(labelText: signupMode ? 'Owner name required' : 'Name optional'),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: busy ? null : requestOtp,
              icon: const Icon(Icons.password),
              label: const Text('Request OTP'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: otpController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'OTP'),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: busy ? null : verifyOtp,
              icon: const Icon(Icons.login),
              label: const Text('Verify and continue'),
            ),
            if (message.isNotEmpty) StatusBanner(message: message),
            const SizedBox(height: 16),
            Text('API: $apiBaseUrl', style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}

class OwnerShell extends StatefulWidget {
  const OwnerShell({super.key, required this.api, required this.tokenStore, required this.onLogout});

  final ApiClient api;
  final TokenStore tokenStore;
  final VoidCallback onLogout;

  @override
  State<OwnerShell> createState() => _OwnerShellState();
}

class _OwnerShellState extends State<OwnerShell> {
  int index = 0;

  void openShop() {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => ShopScreen(api: widget.api)));
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      DashboardScreen(api: widget.api, onOpenRequests: () => setState(() => index = 2), onOpenShop: openShop),
      TagsScreen(api: widget.api, onOpenShop: openShop),
      RequestsScreen(api: widget.api),
      NotificationsScreen(api: widget.api),
      AccountScreen(api: widget.api, onLogout: widget.onLogout),
    ];
    return Scaffold(
      appBar: AppBar(
        title: const Text(appName),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh),
            onPressed: () => setState(() {}),
          ),
        ],
      ),
      body: pages[index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => setState(() => index = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.qr_code_2_outlined), selectedIcon: Icon(Icons.qr_code_2), label: 'Tags'),
          NavigationDestination(icon: Icon(Icons.message_outlined), selectedIcon: Icon(Icons.message), label: 'Requests'),
          NavigationDestination(icon: Icon(Icons.notifications_outlined), selectedIcon: Icon(Icons.notifications), label: 'Alerts'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Account'),
        ],
      ),
    );
  }
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key, required this.api, required this.onOpenRequests, required this.onOpenShop});

  final ApiClient api;
  final VoidCallback onOpenRequests;
  final VoidCallback onOpenShop;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<dynamic> tags = [];
  List<dynamic> requests = [];
  List<dynamic> notifications = [];
  String message = '';

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      final results = await Future.wait([
        widget.api.get('/tags'),
        widget.api.get('/contact-requests'),
        widget.api.get('/me/notifications'),
      ]);
      setState(() {
        tags = asList(results[0]['tags']);
        requests = asList(results[1]['requests']);
        notifications = asList(results[2]['notifications']);
        message = '';
      });
    } on DioException catch (error) {
      setState(() => message = apiError(error));
    }
  }

  @override
  Widget build(BuildContext context) {
    final unread = requests.where((item) => item['status'] == 'UNREAD').length;
    final scans = tags.fold<int>(0, (sum, item) => sum + ((item['scanCount'] as num?)?.toInt() ?? 0));
    return RefreshIndicator(
      onRefresh: load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const BrandHeader(subtitle: 'Private QR contact dashboard'),
          if (message.isNotEmpty) StatusBanner(message: message),
          const SizedBox(height: 16),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            childAspectRatio: 1.45,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            children: [
              MetricCard(label: 'Active tags', value: '${tags.length}', icon: Icons.qr_code_2),
              MetricCard(label: 'Total scans', value: '$scans', icon: Icons.visibility),
              MetricCard(label: 'Unread requests', value: '$unread', icon: Icons.markunread),
              MetricCard(label: 'Alerts', value: '${notifications.length}', icon: Icons.notifications),
            ],
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: widget.onOpenRequests,
            icon: const Icon(Icons.chat_bubble_outline),
            label: const Text('Open private chats'),
          ),
          if (tags.isEmpty) ...[
            const SizedBox(height: 12),
            BuyQrPrompt(onBuy: widget.onOpenShop),
          ],
          const SizedBox(height: 16),
          Text('Recent requests', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 8),
          if (requests.isEmpty) const EmptyState(text: 'No contact requests yet.'),
          for (final request in requests.take(4)) RequestCard(api: widget.api, request: request, compact: true),
        ],
      ),
    );
  }
}

class TagsScreen extends StatefulWidget {
  const TagsScreen({super.key, required this.api, required this.onOpenShop});

  final ApiClient api;
  final VoidCallback onOpenShop;

  @override
  State<TagsScreen> createState() => _TagsScreenState();
}

class _TagsScreenState extends State<TagsScreen> {
  List<dynamic> tags = [];
  String message = '';

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      final data = await widget.api.get('/tags');
      setState(() {
        tags = asList(data['tags']);
        message = '';
      });
    } on DioException catch (error) {
      setState(() => message = apiError(error));
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('My QR tags', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 6),
          const Text('These are QR tags assigned to your phone number by admin or created from your dashboard.'),
          if (message.isNotEmpty) StatusBanner(message: message),
          const SizedBox(height: 12),
          if (tags.isEmpty) BuyQrPrompt(onBuy: widget.onOpenShop),
          for (final tag in tags) TagCard(tag: tag),
        ],
      ),
    );
  }
}

class RequestsScreen extends StatefulWidget {
  const RequestsScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<RequestsScreen> createState() => _RequestsScreenState();
}

class _RequestsScreenState extends State<RequestsScreen> {
  List<dynamic> requests = [];
  String message = '';
  Timer? timer;

  @override
  void initState() {
    super.initState();
    load();
    timer = Timer.periodic(const Duration(seconds: 5), (_) => load(silent: true));
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  Future<void> load({bool silent = false}) async {
    try {
      final data = await widget.api.get('/contact-requests');
      if (!mounted) return;
      setState(() {
        requests = asList(data['requests']);
        message = '';
      });
    } on DioException catch (error) {
      if (!silent && mounted) setState(() => message = apiError(error));
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Private chats', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 6),
          const Text('Reply without exposing your phone number. Pull down to refresh; this page also refreshes automatically.'),
          if (message.isNotEmpty) StatusBanner(message: message),
          const SizedBox(height: 12),
          if (requests.isEmpty) const EmptyState(text: 'No contact requests yet.'),
          for (final request in requests) RequestCard(api: widget.api, request: request),
        ],
      ),
    );
  }
}

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> notifications = [];
  String message = '';

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      final data = await widget.api.get('/me/notifications');
      setState(() {
        notifications = asList(data['notifications']);
        message = '';
      });
    } on DioException catch (error) {
      setState(() => message = apiError(error));
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Notifications', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w900)),
          if (message.isNotEmpty) StatusBanner(message: message),
          const SizedBox(height: 12),
          if (notifications.isEmpty) const EmptyState(text: 'No notifications yet.'),
          for (final item in notifications)
            Card(
              child: ListTile(
                leading: const Icon(Icons.notifications_active_outlined),
                title: Text(item['title']?.toString() ?? 'Notification'),
                subtitle: Text(item['body']?.toString() ?? ''),
              ),
            ),
        ],
      ),
    );
  }
}

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key, required this.api, required this.onLogout});

  final ApiClient api;
  final VoidCallback onLogout;

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  Map<String, dynamic>? user;
  String message = '';

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      final data = await widget.api.get('/me');
      setState(() {
        user = data['user'] as Map<String, dynamic>?;
        message = '';
      });
    } on DioException catch (error) {
      setState(() => message = apiError(error));
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Account', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w900)),
          if (message.isNotEmpty) StatusBanner(message: message),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              leading: const Icon(Icons.person_outline),
              title: Text(user?['fullName']?.toString() ?? 'Owner'),
              subtitle: Text(user?['phone']?.toString() ?? 'Loading...'),
            ),
          ),
          const SizedBox(height: 12),
          const Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Text('Privacy default: your phone number is hidden from scanners. Chat stays inside NoNumQR unless you choose another channel.'),
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: widget.onLogout,
            icon: const Icon(Icons.logout),
            label: const Text('Logout'),
          ),
        ],
      ),
    );
  }
}

class RequestCard extends StatefulWidget {
  const RequestCard({super.key, required this.api, required this.request, this.compact = false});

  final ApiClient api;
  final dynamic request;
  final bool compact;

  @override
  State<RequestCard> createState() => _RequestCardState();
}

class _RequestCardState extends State<RequestCard> {
  List<dynamic> messages = [];
  final replyController = TextEditingController();
  String status = '';
  bool open = false;

  @override
  void initState() {
    super.initState();
    messages = asList(widget.request['messages']);
  }

  Future<void> loadMessages() async {
    final data = await widget.api.get('/contact-requests/${widget.request['id']}/messages');
    setState(() => messages = asList(data['messages']));
  }

  Future<void> sendReply() async {
    final body = replyController.text.trim();
    if (body.isEmpty) return;
    try {
      await widget.api.post('/contact-requests/${widget.request['id']}/messages', {'body': body});
      replyController.clear();
      setState(() => status = 'Reply sent.');
      await loadMessages();
    } on DioException catch (error) {
      setState(() => status = apiError(error));
    }
  }

  @override
  Widget build(BuildContext context) {
    final request = widget.request;
    final tag = request['qrTag'];
    final title = request['reason']?.toString() ?? 'Contact request';
    final subtitle = tag is Map ? tag['label']?.toString() : null;
    final visibleMessages = messages.isEmpty
        ? [
            {'sender': 'SCANNER', 'senderName': request['scannerName'], 'body': request['message'], 'createdAt': request['createdAt']}
          ]
        : messages;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(request['status'] == 'UNREAD' ? Icons.markunread : Icons.drafts_outlined, color: Theme.of(context).colorScheme.primary),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: const TextStyle(fontWeight: FontWeight.w900)),
                      if (subtitle != null) Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
                Text(formatDate(request['createdAt'])),
              ],
            ),
            const SizedBox(height: 10),
            Text(request['message']?.toString() ?? ''),
            if (!widget.compact) ...[
              const SizedBox(height: 8),
              TextButton.icon(
                onPressed: () async {
                  setState(() => open = !open);
                  if (open) await loadMessages();
                },
                icon: Icon(open ? Icons.expand_less : Icons.expand_more),
                label: Text(open ? 'Hide chat' : 'Open chat'),
              ),
              if (open) ...[
                const SizedBox(height: 8),
                Container(
                  decoration: BoxDecoration(color: const Color(0xFFF6F9F7), borderRadius: BorderRadius.circular(8)),
                  padding: const EdgeInsets.all(10),
                  child: Column(
                    children: [
                      for (final message in visibleMessages)
                        Align(
                          alignment: message['sender'] == 'OWNER' ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.symmetric(vertical: 4),
                            padding: const EdgeInsets.all(10),
                            constraints: const BoxConstraints(maxWidth: 300),
                            decoration: BoxDecoration(
                              color: message['sender'] == 'OWNER' ? const Color(0xFFE8F5F2) : Colors.white,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(message['sender'] == 'OWNER' ? 'You' : (message['senderName']?.toString() ?? 'Scanner'), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800)),
                                const SizedBox(height: 3),
                                Text(message['body']?.toString() ?? ''),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: replyController,
                  minLines: 2,
                  maxLines: 4,
                  decoration: const InputDecoration(labelText: 'Reply privately'),
                ),
                const SizedBox(height: 8),
                FilledButton.icon(
                  onPressed: sendReply,
                  icon: const Icon(Icons.send),
                  label: const Text('Send reply'),
                ),
                if (status.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 6), child: Text(status)),
              ],
            ],
          ],
        ),
      ),
    );
  }
}

class TagCard extends StatelessWidget {
  const TagCard({super.key, required this.tag});

  final dynamic tag;

  @override
  Widget build(BuildContext context) {
    final publicUrl = tag['publicUrl']?.toString() ?? '';
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  color: Colors.white,
                  padding: const EdgeInsets.all(8),
                  child: QrImageView(data: publicUrl, size: 118),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(tag['label']?.toString() ?? 'QR tag', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
                      const SizedBox(height: 4),
                      Text('${tag['type']} | ${tag['status']} | ${tag['scanCount'] ?? 0} scans'),
                      const SizedBox(height: 8),
                      const Text('Phone hidden by default', style: TextStyle(fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SelectableText(publicUrl),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () async {
                await Clipboard.setData(ClipboardData(text: publicUrl));
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Public URL copied')));
                }
              },
              icon: const Icon(Icons.copy),
              label: const Text('Copy public URL'),
            ),
          ],
        ),
      ),
    );
  }
}

class BuyQrPrompt extends StatelessWidget {
  const BuyQrPrompt({super.key, required this.onBuy});

  final VoidCallback onBuy;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.add_shopping_cart, color: Theme.of(context).colorScheme.primary, size: 32),
            const SizedBox(height: 10),
            Text('No QR code yet', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
            const SizedBox(height: 6),
            const Text('Buy a QR sticker first. After admin prints and assigns it to your phone number, it will appear here with chats and notifications.'),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: onBuy,
              icon: const Icon(Icons.shopping_bag_outlined),
              label: const Text('Buy QR code'),
            ),
          ],
        ),
      ),
    );
  }
}

class ShopScreen extends StatefulWidget {
  const ShopScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  List<dynamic> products = [];
  Map<String, dynamic>? user;
  String message = '';
  bool loading = true;

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      final results = await Future.wait([
        widget.api.get('/products'),
        widget.api.get('/me'),
      ]);
      setState(() {
        products = asList(results[0]['products']);
        user = results[1]['user'] as Map<String, dynamic>?;
        message = '';
        loading = false;
      });
    } on DioException catch (error) {
      setState(() {
        message = apiError(error);
        loading = false;
      });
    }
  }

  void openCheckout(dynamic product) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => OrderQrScreen(api: widget.api, product: product, user: user)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Buy QR code')),
      body: RefreshIndicator(
        onRefresh: load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text('QR sticker shop', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w900)),
            const SizedBox(height: 6),
            const Text('Order by Cash on Delivery. Online payment providers can be added later from the backend.'),
            if (message.isNotEmpty) StatusBanner(message: message),
            const SizedBox(height: 12),
            if (loading) const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator())),
            if (!loading && products.isEmpty) const EmptyState(text: 'No products available yet. Please contact support.'),
            for (final product in products)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(product['name']?.toString() ?? 'QR sticker', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
                      const SizedBox(height: 6),
                      Text(product['description']?.toString() ?? ''),
                      const SizedBox(height: 8),
                      Text('BDT ${product['priceBdt'] ?? 0}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                      const SizedBox(height: 12),
                      FilledButton.icon(
                        onPressed: () => openCheckout(product),
                        icon: const Icon(Icons.local_shipping_outlined),
                        label: const Text('Order COD'),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class OrderQrScreen extends StatefulWidget {
  const OrderQrScreen({super.key, required this.api, required this.product, required this.user});

  final ApiClient api;
  final dynamic product;
  final Map<String, dynamic>? user;

  @override
  State<OrderQrScreen> createState() => _OrderQrScreenState();
}

class _OrderQrScreenState extends State<OrderQrScreen> {
  late final TextEditingController nameController;
  late final TextEditingController phoneController;
  final addressController = TextEditingController();
  final cityController = TextEditingController(text: 'Dhaka');
  final districtController = TextEditingController(text: 'Dhaka');
  String message = '';
  bool busy = false;

  @override
  void initState() {
    super.initState();
    final profile = widget.user?['profile'];
    nameController = TextEditingController(text: widget.user?['fullName']?.toString() ?? '');
    phoneController = TextEditingController(text: widget.user?['phone']?.toString() ?? '');
    if (profile is Map) {
      cityController.text = profile['city']?.toString() ?? 'Dhaka';
      districtController.text = profile['district']?.toString() ?? 'Dhaka';
      addressController.text = profile['address']?.toString() ?? '';
    }
  }

  Future<void> submitOrder() async {
    setState(() {
      busy = true;
      message = '';
    });
    try {
      final variants = asList(widget.product['variants']);
      final variant = variants.isNotEmpty ? variants.first : null;
      final data = await widget.api.post('/orders', {
        'items': [
          {
            'productId': widget.product['id'],
            if (variant is Map) 'productVariantId': variant['id'],
            'quantity': 1,
          }
        ],
        'customerName': nameController.text.trim(),
        'customerPhone': phoneController.text.trim(),
        'deliveryAddress': addressController.text.trim(),
        'deliveryCity': cityController.text.trim(),
        'deliveryDistrict': districtController.text.trim(),
        'paymentMethod': 'COD',
      });
      final order = data['order'] as Map<String, dynamic>?;
      setState(() => message = 'Order created: ${order?['orderNumber'] ?? 'pending'}. Admin will process and assign your QR.');
    } on DioException catch (error) {
      setState(() => message = apiError(error));
    } catch (error) {
      setState(() => message = error.toString());
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final price = widget.product['priceBdt'] ?? 0;
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(widget.product['name']?.toString() ?? 'QR sticker', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 6),
          Text('BDT $price + delivery fee. Payment: Cash on Delivery.'),
          if (message.isNotEmpty) StatusBanner(message: message),
          const SizedBox(height: 16),
          TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Receiver name')),
          const SizedBox(height: 12),
          TextField(controller: phoneController, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Receiver phone')),
          const SizedBox(height: 12),
          TextField(controller: addressController, minLines: 2, maxLines: 4, decoration: const InputDecoration(labelText: 'Delivery address')),
          const SizedBox(height: 12),
          TextField(controller: cityController, decoration: const InputDecoration(labelText: 'City')),
          const SizedBox(height: 12),
          TextField(controller: districtController, decoration: const InputDecoration(labelText: 'District')),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: busy ? null : submitOrder,
            icon: const Icon(Icons.check_circle_outline),
            label: const Text('Place COD order'),
          ),
        ],
      ),
    );
  }
}

class BrandHeader extends StatelessWidget {
  const BrandHeader({super.key, required this.subtitle});

  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          height: 52,
          width: 52,
          decoration: BoxDecoration(color: Theme.of(context).colorScheme.primary, borderRadius: BorderRadius.circular(8)),
          child: const Icon(Icons.shield_outlined, color: Colors.white),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(appName, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
              Text(subtitle, style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ],
    );
  }
}

class MetricCard extends StatelessWidget {
  const MetricCard({super.key, required this.label, required this.value, required this.icon});

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: Theme.of(context).colorScheme.primary),
            const Spacer(),
            Text(value, style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w900)),
            Text(label),
          ],
        ),
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Text(text),
      ),
    );
  }
}

class StatusBanner extends StatelessWidget {
  const StatusBanner({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: const Color(0xFFFFF7ED), borderRadius: BorderRadius.circular(8)),
      child: Text(message, style: const TextStyle(fontWeight: FontWeight.w700)),
    );
  }
}

List<dynamic> asList(dynamic value) {
  if (value is List) return value;
  return const [];
}

String apiError(DioException error) {
  final data = error.response?.data;
  if (data is Map && data['error'] != null) return data['error'].toString();
  return error.message ?? 'Request failed';
}

String formatDate(dynamic value) {
  if (value == null) return '';
  final date = DateTime.tryParse(value.toString());
  if (date == null) return '';
  return DateFormat('MMM d, HH:mm').format(date.toLocal());
}
