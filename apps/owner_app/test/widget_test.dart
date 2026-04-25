import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:scancontact_owner/main.dart';

void main() {
  testWidgets('renders owner login screen', (tester) async {
    final tokenStore = TokenStore(const FlutterSecureStorage());
    await tester.pumpWidget(
      MaterialApp(
        home: LoginScreen(api: ApiClient(tokenStore), tokenStore: tokenStore, onLogin: () {}),
      ),
    );
    await tester.pump();

    expect(find.text('Login with owner phone'), findsOneWidget);
    expect(find.text('Request OTP'), findsOneWidget);
  });
}
