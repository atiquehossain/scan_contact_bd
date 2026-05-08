import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/network/api_client.dart';
import '../../core/push/push_notification_service.dart';
import '../../core/services/owner_services.dart';
import '../../core/utils/bd_phone.dart';
import '../../core/widgets/app_widgets.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  final phoneController = TextEditingController();
  final nameController = TextEditingController();
  final otpController = TextEditingController();
  bool signup = false;
  bool otpRequested = false;
  bool requesting = false;
  bool verifying = false;
  int resendSeconds = 0;
  String? devOtp;
  String? error;
  String? requestedOtpPhone;
  Timer? timer;

  @override
  void initState() {
    super.initState();
    phoneController.addListener(_handlePhoneChanged);
    otpController.addListener(_handleFieldChanged);
    nameController.addListener(_handleFieldChanged);
  }

  @override
  void dispose() {
    timer?.cancel();
    phoneController.dispose();
    nameController.dispose();
    otpController.dispose();
    super.dispose();
  }

  bool get phoneValid => isValidBangladeshPhone(phoneController.text);
  bool get canRequest =>
      phoneValid &&
      !requesting &&
      resendSeconds == 0 &&
      (!signup || nameController.text.trim().length >= 2);
  bool get canVerify =>
      phoneValid &&
      requestedOtpPhone == normalizeBangladeshPhone(phoneController.text) &&
      otpController.text.trim().length == 6 &&
      !verifying;

  void _handleFieldChanged() {
    if (mounted) setState(() {});
  }

  void _handlePhoneChanged() {
    if (!mounted) return;
    if (otpRequested && requestedOtpPhone != null) {
      final currentPhone = phoneValid
          ? normalizeBangladeshPhone(phoneController.text)
          : null;
      if (currentPhone != requestedOtpPhone) {
        timer?.cancel();
        if (otpController.text.isNotEmpty) otpController.clear();
        setState(() {
          otpRequested = false;
          requestedOtpPhone = null;
          resendSeconds = 0;
          devOtp = null;
          error = 'Phone changed. Request a new OTP.';
        });
        return;
      }
    }
    setState(() {});
  }

  void startCountdown() {
    timer?.cancel();
    setState(() => resendSeconds = 60);
    timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (resendSeconds <= 1) {
        timer.cancel();
        setState(() => resendSeconds = 0);
      } else {
        setState(() => resendSeconds--);
      }
    });
  }

  Future<void> requestOtp() async {
    if (!canRequest) return;
    final phone = normalizeBangladeshPhone(phoneController.text);
    final requestSignup = signup;
    setState(() {
      requesting = true;
      error = null;
      devOtp = null;
      requestedOtpPhone = null;
    });
    try {
      final data = await ref
          .read(ownerServiceProvider)
          .requestOtp(phone: phone, signup: signup);
      if (!mounted) return;
      final currentPhone = phoneValid
          ? normalizeBangladeshPhone(phoneController.text)
          : null;
      if (currentPhone != phone || signup != requestSignup) {
        setState(() {
          otpRequested = false;
          requestedOtpPhone = null;
          resendSeconds = 0;
          devOtp = null;
          error = 'Request changed. Request a new OTP.';
        });
        return;
      }
      final returnedPhone = data['phone']?.toString();
      final otpPhone =
          returnedPhone != null && isValidBangladeshPhone(returnedPhone)
          ? normalizeBangladeshPhone(returnedPhone)
          : phone;
      setState(() {
        otpRequested = true;
        requestedOtpPhone = otpPhone;
        devOtp = kDebugMode ? data['devOtp']?.toString() : null;
      });
      startCountdown();
    } catch (err) {
      if (!mounted) return;
      setState(
        () => error = apiErrorMessage(err) == 'Something went wrong. Try again.'
            ? 'Could not send OTP. Try again.'
            : apiErrorMessage(err),
      );
    } finally {
      if (mounted) setState(() => requesting = false);
    }
  }

  Future<void> verifyOtp() async {
    if (!canVerify) return;
    final phone = requestedOtpPhone;
    if (phone == null) return;
    setState(() {
      verifying = true;
      error = null;
    });
    try {
      final result = await ref
          .read(ownerServiceProvider)
          .verifyOtp(
            phone: phone,
            otp: otpController.text.trim(),
            fullName: signup ? nameController.text.trim() : null,
          );
      await ref
          .read(tokenStoreProvider)
          .save(
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          );
      invalidateOwnerScopedProviders(ref);
      await PushNotificationService.registerForCurrentUser(
        ref.read(ownerServiceProvider),
      );
      if (mounted) context.go('/main');
    } catch (err) {
      if (!mounted) return;
      final message = apiErrorMessage(err);
      setState(
        () => error = message.contains('Invalid OTP')
            ? 'OTP is incorrect or expired.'
            : message,
      );
    } finally {
      if (mounted) setState(() => verifying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = signup ? 'Create owner account' : 'Login with owner phone';
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: appPadding,
          children: [
            const SizedBox(height: 20),
            const Center(child: ScanContactBrandMark(size: 68)),
            const SizedBox(height: 16),
            Text(
              AppConfig.appName,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              signup
                  ? 'Your phone number is used for account verification and QR assignment only.'
                  : 'Use the phone number linked to your QR tag or order. Your number is not shown to scanners.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            SegmentedButton<bool>(
              segments: const [
                ButtonSegment(value: false, label: Text('Login')),
                ButtonSegment(value: true, label: Text('Signup')),
              ],
              selected: {signup},
              onSelectionChanged: (value) {
                timer?.cancel();
                if (otpController.text.isNotEmpty) otpController.clear();
                setState(() {
                  signup = value.first;
                  otpRequested = false;
                  requestedOtpPhone = null;
                  resendSeconds = 0;
                  devOtp = null;
                  error = null;
                });
              },
            ),
            const SizedBox(height: 16),
            TextField(
              controller: phoneController,
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.telephoneNumber],
              decoration: InputDecoration(
                labelText: 'Bangladesh mobile number',
                helperText: '01XXXXXXXXX, 8801XXXXXXXXX, or +8801XXXXXXXXX',
                errorText: phoneController.text.isEmpty || phoneValid
                    ? null
                    : 'Enter a valid Bangladesh mobile number.',
              ),
            ),
            if (signup) ...[
              const SizedBox(height: 12),
              TextField(
                controller: nameController,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.name],
                decoration: InputDecoration(
                  labelText: 'Owner name',
                  helperText: 'Required for signup',
                  errorText:
                      nameController.text.isEmpty ||
                          nameController.text.trim().length >= 2
                      ? null
                      : 'Owner name is required.',
                ),
              ),
            ],
            const SizedBox(height: 16),
            PrimaryButton(
              label: resendSeconds > 0
                  ? 'Resend in ${resendSeconds}s'
                  : 'Request OTP',
              icon: Icons.key_outlined,
              loading: requesting,
              onPressed: canRequest ? requestOtp : null,
            ),
            if (otpRequested) ...[
              const SizedBox(height: 16),
              TextField(
                controller: otpController,
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(6),
                ],
                autofillHints: const [AutofillHints.oneTimeCode],
                decoration: const InputDecoration(labelText: '6 digit OTP'),
              ),
              const SizedBox(height: 12),
              PrimaryButton(
                label: 'Verify and continue',
                icon: Icons.login,
                loading: verifying,
                onPressed: canVerify ? verifyOtp : null,
              ),
            ],
            if (devOtp != null) ...[
              const SizedBox(height: 12),
              Card(
                color: Theme.of(context).colorScheme.secondaryContainer,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text(
                    'Development OTP: $devOtp',
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
              ),
            ],
            if (error != null) ...[
              const SizedBox(height: 12),
              Text(
                error!,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.error,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
            if (kDebugMode) ...[
              const SizedBox(height: 24),
              Text(
                'API: ${AppConfig.apiBaseUrl}',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
