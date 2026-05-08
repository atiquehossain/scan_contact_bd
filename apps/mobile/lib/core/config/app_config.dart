class AppConfig {
  static const appName = String.fromEnvironment(
    'APP_NAME',
    defaultValue: 'ScanContact BD',
  );
  static const _apiBaseUrl = String.fromEnvironment('API_BASE_URL');
  static const _webBaseUrl = String.fromEnvironment('WEB_BASE_URL');
  static const _debugApiBaseUrl = 'http://10.0.2.2:4000';
  static const _debugWebBaseUrl = 'http://10.0.2.2:3000';
  static const _isReleaseBuild = bool.fromEnvironment('dart.vm.product');

  static const environment = String.fromEnvironment(
    'ENVIRONMENT',
    defaultValue: 'development',
  );
  static const enablePush = bool.fromEnvironment(
    'ENABLE_PUSH',
    defaultValue: true,
  );
  static const enableAnalytics = bool.fromEnvironment(
    'ENABLE_ANALYTICS',
    defaultValue: false,
  );
  static const defaultLanguage = String.fromEnvironment(
    'DEFAULT_LANGUAGE',
    defaultValue: 'en',
  );

  static String get apiBaseUrl => _resolveUrl(
    dartDefineName: 'API_BASE_URL',
    configuredValue: _apiBaseUrl,
    debugDefaultValue: _debugApiBaseUrl,
  );

  static String get webBaseUrl => _resolveUrl(
    dartDefineName: 'WEB_BASE_URL',
    configuredValue: _webBaseUrl,
    debugDefaultValue: _debugWebBaseUrl,
  );

  static bool get isProduction => environment.toLowerCase() == 'production';

  static bool get _requiresProductionUrls => _isReleaseBuild || isProduction;

  static String _resolveUrl({
    required String dartDefineName,
    required String configuredValue,
    required String debugDefaultValue,
  }) {
    final value = configuredValue.trim();
    if (value.isEmpty) {
      if (_requiresProductionUrls) {
        throw StateError(
          '$dartDefineName must be provided with --dart-define for '
          'release/production builds.',
        );
      }

      return debugDefaultValue;
    }

    final uri = Uri.tryParse(value);
    if (uri == null || !uri.hasScheme || uri.host.isEmpty) {
      throw FormatException(
        '$dartDefineName must be an absolute HTTP(S) URL.',
        value,
      );
    }

    if (_requiresProductionUrls && uri.scheme != 'https') {
      throw StateError(
        '$dartDefineName must use https:// for release/production builds.',
      );
    }

    return value;
  }
}
