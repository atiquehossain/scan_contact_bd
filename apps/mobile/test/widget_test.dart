import 'package:flutter_test/flutter_test.dart';
import 'package:scancontact_bd/core/config/app_config.dart';
import 'package:scancontact_bd/features/auth/auth_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  testWidgets('renders owner OTP login entry screen', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(child: MaterialApp(home: AuthScreen())),
    );
    await tester.pumpAndSettle();

    expect(find.text(AppConfig.appName), findsOneWidget);
    expect(find.text('Request OTP'), findsOneWidget);
  });
}
