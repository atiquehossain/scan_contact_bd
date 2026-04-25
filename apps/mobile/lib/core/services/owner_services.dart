import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/owner_models.dart';
import '../network/api_client.dart';

final ownerServiceProvider = Provider<OwnerService>(
  (ref) => OwnerService(ref.watch(apiClientProvider)),
);

final ownerMeProvider = FutureProvider<OwnerProfile>(
  (ref) => ref.watch(ownerServiceProvider).me(),
);
final dashboardProvider = FutureProvider<OwnerDashboard>(
  (ref) => ref.watch(ownerServiceProvider).dashboard(),
);
final tagsProvider = FutureProvider<List<QrTag>>(
  (ref) => ref.watch(ownerServiceProvider).tags(),
);
final requestsProvider =
    FutureProvider.family<List<ContactRequestSummary>, String>((ref, filter) {
      return ref.watch(ownerServiceProvider).requests(filter: filter);
    });
final notificationsProvider = FutureProvider<List<OwnerNotification>>(
  (ref) => ref.watch(ownerServiceProvider).notifications(),
);
final productsProvider = FutureProvider<List<Product>>(
  (ref) => ref.watch(ownerServiceProvider).products(),
);
final ordersProvider = FutureProvider<List<OwnerOrder>>(
  (ref) => ref.watch(ownerServiceProvider).orders(),
);

class OwnerService {
  const OwnerService(this._api);

  final ApiClient _api;

  Future<Map<String, dynamic>> requestOtp({
    required String phone,
    required bool signup,
  }) async {
    final mode = signup ? 'signup' : 'login';
    _debugOwnerData('requestOtp start phone=${_maskPhone(phone)} mode=$mode');
    final response = await _api.post(
      '/owner/auth/request-otp',
      data: {'phone': phone, 'purpose': signup ? 'REGISTER' : 'LOGIN'},
    );
    final data = Map<String, dynamic>.from(response.data as Map);
    final returnedPhone = data['phone']?.toString() ?? phone;
    final provider = data['provider']?.toString() ?? 'unknown';
    final devOtpAvailable = data['devOtp'] != null;
    _debugOwnerData(
      'requestOtp success phone=${_maskPhone(returnedPhone)} '
      'provider=$provider devOtpAvailable=$devOtpAvailable',
    );
    return data;
  }

  Future<({OwnerProfile owner, String accessToken, String refreshToken})>
  verifyOtp({
    required String phone,
    required String otp,
    String? fullName,
  }) async {
    _debugOwnerData('verifyOtp start phone=${_maskPhone(phone)}');
    final response = await _api.post(
      '/owner/auth/verify-otp',
      data: {
        'phone': phone,
        'otp': otp,
        if (fullName != null && fullName.trim().isNotEmpty)
          'fullName': fullName.trim(),
        'language': 'EN',
      },
    );
    final data = Map<String, dynamic>.from(response.data as Map);
    final owner = OwnerProfile.fromJson(
      Map<String, dynamic>.from(data['owner'] as Map),
    );
    _debugOwnerData(
      'verifyOtp success owner=${_shortId(owner.id)} phone=${_maskPhone(owner.phone)}',
    );
    return (
      owner: owner,
      accessToken:
          data['accessToken']?.toString() ?? data['token']?.toString() ?? '',
      refreshToken: data['refreshToken']?.toString() ?? '',
    );
  }

  Future<OwnerProfile> me() async {
    final response = await _api.get('/owner/me');
    final data = Map<String, dynamic>.from(response.data as Map);
    final owner = OwnerProfile.fromJson(
      Map<String, dynamic>.from(data['owner'] as Map),
    );
    _debugOwnerData(
      'me owner=${_shortId(owner.id)} phone=${_maskPhone(owner.phone)}',
    );
    return owner;
  }

  Future<OwnerDashboard> dashboard() async {
    final response = await _api.get('/owner/dashboard');
    final dashboard = OwnerDashboard.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
    _debugOwnerData(
      'dashboard activeQr=${dashboard.activeQrCount} '
      'unreadRequests=${dashboard.unreadRequestCount} '
      'recentRequests=${dashboard.recentRequests.length}',
    );
    return dashboard;
  }

  Future<List<QrTag>> tags() async {
    final response = await _api.get('/owner/tags');
    final data = Map<String, dynamic>.from(response.data as Map);
    final tags = (data['tags'] as List? ?? [])
        .whereType<Map>()
        .map((item) => QrTag.fromJson(Map<String, dynamic>.from(item)))
        .toList();
    _debugOwnerData('tags count=${tags.length}');
    return tags;
  }

  Future<List<ContactRequestSummary>> requests({String filter = 'all'}) async {
    final response = await _api.get('/owner/contact-requests?filter=$filter');
    final data = Map<String, dynamic>.from(response.data as Map);
    final requests = (data['requests'] as List? ?? [])
        .whereType<Map>()
        .map(
          (item) =>
              ContactRequestSummary.fromJson(Map<String, dynamic>.from(item)),
        )
        .toList();
    _debugOwnerData('requests filter=$filter count=${requests.length}');
    return requests;
  }

  Future<({ContactRequestSummary request, List<ChatMessage> messages})>
  messages(String requestId) async {
    final response = await _api.get(
      '/owner/contact-requests/$requestId/messages',
    );
    final data = Map<String, dynamic>.from(response.data as Map);
    final messages = (data['messages'] as List? ?? [])
        .whereType<Map>()
        .map((item) => ChatMessage.fromJson(Map<String, dynamic>.from(item)))
        .toList();
    _debugOwnerData('messages request=$requestId count=${messages.length}');
    return (
      request: ContactRequestSummary.fromJson(
        Map<String, dynamic>.from(data['request'] as Map),
      ),
      messages: messages,
    );
  }

  Future<ChatMessage> reply({
    required String requestId,
    required String message,
  }) async {
    final response = await _api.post(
      '/owner/contact-requests/$requestId/reply',
      data: {'message': message},
    );
    final data = Map<String, dynamic>.from(response.data as Map);
    return ChatMessage.fromJson(
      Map<String, dynamic>.from(data['message'] as Map),
    );
  }

  Future<void> markRead(String requestId) async {
    await _api.post('/owner/contact-requests/$requestId/mark-read');
  }

  Future<List<OwnerNotification>> notifications() async {
    final response = await _api.get('/owner/notifications');
    final data = Map<String, dynamic>.from(response.data as Map);
    final notifications = (data['notifications'] as List? ?? [])
        .whereType<Map>()
        .map(
          (item) => OwnerNotification.fromJson(Map<String, dynamic>.from(item)),
        )
        .toList();
    _debugOwnerData('notifications count=${notifications.length}');
    return notifications;
  }

  Future<void> markNotificationRead(String id) async {
    await _api.post('/owner/notifications/$id/read');
  }

  Future<void> markAllNotificationsRead() async {
    await _api.post('/owner/notifications/read-all');
  }

  Future<List<Product>> products() async {
    final response = await _api.get('/owner/products');
    final data = Map<String, dynamic>.from(response.data as Map);
    final products = (data['products'] as List? ?? [])
        .whereType<Map>()
        .map((item) => Product.fromJson(Map<String, dynamic>.from(item)))
        .toList();
    _debugOwnerData('products count=${products.length}');
    return products;
  }

  Future<OwnerOrder> createCodOrder({
    required String productId,
    required String receiverName,
    required String receiverPhone,
    required String deliveryAddress,
    required String city,
    required String district,
  }) async {
    final response = await _api.post(
      '/owner/orders/cod',
      data: {
        'productId': productId,
        'receiverName': receiverName,
        'receiverPhone': receiverPhone,
        'deliveryAddress': deliveryAddress,
        'city': city,
        'district': district,
      },
    );
    return OwnerOrder.fromJson(Map<String, dynamic>.from(response.data as Map));
  }

  Future<List<OwnerOrder>> orders() async {
    final response = await _api.get('/owner/orders');
    final data = Map<String, dynamic>.from(response.data as Map);
    final orders = (data['orders'] as List? ?? [])
        .whereType<Map>()
        .map((item) => OwnerOrder.fromJson(Map<String, dynamic>.from(item)))
        .toList();
    _debugOwnerData('orders count=${orders.length}');
    return orders;
  }
}

void _debugOwnerData(String message) {
  if (!kDebugMode) return;
  debugPrint('[ScanContact Owner] $message');
}

String _maskPhone(String phone) {
  if (phone.length <= 7) return '***';
  return '${phone.substring(0, 7)}****${phone.substring(phone.length - 3)}';
}

String _shortId(String value) {
  if (value.length <= 10) return value;
  return '${value.substring(0, 6)}...${value.substring(value.length - 4)}';
}
