import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../config/app_config.dart';
import '../storage/token_store.dart';

final tokenStoreProvider = Provider<TokenStore>((ref) {
  return const TokenStore(FlutterSecureStorage());
});

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(ref.watch(tokenStoreProvider));
});

final publicApiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient.unauthenticated();
});

class ApiClient {
  ApiClient(this._tokenStore)
    : _authenticated = true,
      dio = Dio(_baseOptions()) {
    _installInterceptors();
  }

  ApiClient.unauthenticated()
    : _tokenStore = null,
      _authenticated = false,
      dio = Dio(_baseOptions()) {
    _installInterceptors();
  }

  final TokenStore? _tokenStore;
  final bool _authenticated;
  final Dio dio;
  Future<String?>? _refreshFuture;

  static BaseOptions _baseOptions() {
    return BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 12),
      receiveTimeout: const Duration(seconds: 20),
      headers: {'Content-Type': 'application/json'},
    );
  }

  void _installInterceptors() {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = _authenticated
              ? await _tokenStore?.readAccessToken()
              : null;
          if (_authenticated && token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          } else {
            options.headers.remove('Authorization');
          }
          _debugRequest(options);
          handler.next(options);
        },
        onResponse: (response, handler) {
          _debugResponse(response);
          handler.next(response);
        },
        onError: (error, handler) async {
          _debugError(error);
          if (_authenticated &&
              error.response?.statusCode == 401 &&
              error.requestOptions.extra['retriedAfterRefresh'] != true) {
            final accessToken = await _tryRefreshToken();
            if (accessToken != null && accessToken.isNotEmpty) {
              error.requestOptions.extra['retriedAfterRefresh'] = true;
              error.requestOptions.headers['Authorization'] =
                  'Bearer $accessToken';
              final response = await dio.fetch(error.requestOptions);
              return handler.resolve(response);
            }
            await _tokenStore?.clear();
          }
          handler.next(error);
        },
      ),
    );
  }

  Future<String?> _tryRefreshToken() {
    final currentRefresh = _refreshFuture;
    if (currentRefresh != null) return currentRefresh;
    final nextRefresh = _performRefreshToken();
    _refreshFuture = nextRefresh;
    return nextRefresh.whenComplete(() {
      if (identical(_refreshFuture, nextRefresh)) {
        _refreshFuture = null;
      }
    });
  }

  Future<String?> _performRefreshToken() async {
    final tokenStore = _tokenStore;
    if (tokenStore == null) return null;
    final refreshToken = await tokenStore.readRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) return null;
    try {
      final response = await Dio(
        _baseOptions(),
      ).post('/auth/refresh', data: {'refreshToken': refreshToken});
      final accessToken = response.data['accessToken']?.toString() ?? '';
      final nextRefreshToken = response.data['refreshToken']?.toString() ?? '';
      if (accessToken.isEmpty || nextRefreshToken.isEmpty) return null;
      await tokenStore.save(
        accessToken: accessToken,
        refreshToken: nextRefreshToken,
      );
      return accessToken;
    } catch (_) {
      await tokenStore.clear();
      return null;
    }
  }

  Future<Response<dynamic>> get(String path) => dio.get(path);
  Future<Response<dynamic>> post(String path, {Object? data}) =>
      dio.post(path, data: data);
  Future<Response<dynamic>> patch(String path, {Object? data}) =>
      dio.patch(path, data: data);
  Future<Response<dynamic>> delete(String path) => dio.delete(path);
}

void _debugRequest(RequestOptions options) {
  if (!kDebugMode) return;
  debugPrint(
    '[ScanContact API] --> ${options.method} ${options.uri} '
    'auth=${options.headers.containsKey('Authorization')} '
    'data=${_safeDataShape(options.data)}',
  );
}

void _debugResponse(Response<dynamic> response) {
  if (!kDebugMode) return;
  debugPrint(
    '[ScanContact API] <-- ${response.statusCode} '
    '${response.requestOptions.method} ${response.requestOptions.uri}',
  );
}

void _debugError(DioException error) {
  if (!kDebugMode) return;
  debugPrint(
    '[ScanContact API] xx ${error.type.name} '
    '${error.requestOptions.method} ${error.requestOptions.uri} '
    'status=${error.response?.statusCode ?? 'none'} '
    'message=${error.message}',
  );
  final data = error.response?.data;
  if (data is Map && (data['message'] is String || data['error'] is String)) {
    debugPrint(
      '[ScanContact API] serverError=${data['message'] ?? data['error']}',
    );
  }
}

String _safeDataShape(Object? data) {
  if (data == null) return 'none';
  if (data is Map) {
    final keys = data.keys.map((key) => key.toString()).toList()..sort();
    return 'keys=$keys';
  }
  if (data is List) return 'list(length=${data.length})';
  return data.runtimeType.toString();
}

String apiErrorMessage(Object error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.connectionError) {
      return 'Connection problem. Check internet and try again.';
    }
    if (data is Map && data['message'] is String) {
      return data['message'] as String;
    }
    if (data is Map && data['error'] is String) {
      return data['error'] as String;
    }
    if (error.response?.statusCode == 401) {
      return 'Session expired. Please log in again.';
    }
    if ((error.response?.statusCode ?? 0) >= 500) {
      return 'Something went wrong. Try again.';
    }
  }
  return 'Something went wrong. Try again.';
}
