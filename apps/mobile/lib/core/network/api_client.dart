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

class ApiClient {
  ApiClient(this._tokenStore)
    : dio = Dio(
        BaseOptions(
          baseUrl: AppConfig.apiBaseUrl,
          connectTimeout: const Duration(seconds: 12),
          receiveTimeout: const Duration(seconds: 20),
          headers: {'Content-Type': 'application/json'},
        ),
      ) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _tokenStore.readAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
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
          if (error.response?.statusCode == 401) {
            final refreshed = await _tryRefreshToken();
            if (refreshed) {
              final response = await dio.fetch(error.requestOptions);
              return handler.resolve(response);
            }
            await _tokenStore.clear();
          }
          handler.next(error);
        },
      ),
    );
  }

  final TokenStore _tokenStore;
  final Dio dio;

  Future<bool> _tryRefreshToken() async {
    final refreshToken = await _tokenStore.readRefreshToken();
    if (refreshToken == null) return false;
    try {
      final response = await Dio(
        BaseOptions(baseUrl: AppConfig.apiBaseUrl),
      ).post('/auth/refresh', data: {'refreshToken': refreshToken});
      await _tokenStore.save(
        accessToken: response.data['accessToken'],
        refreshToken: response.data['refreshToken'],
      );
      return true;
    } catch (_) {
      await _tokenStore.clear();
      return false;
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
  if (data is Map && data['error'] is String) {
    debugPrint('[ScanContact API] serverError=${data['error']}');
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
