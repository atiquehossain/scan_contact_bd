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
import '../../core/theme/app_theme.dart';
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

  void editPhoneNumber() {
    timer?.cancel();
    if (otpController.text.isNotEmpty) otpController.clear();
    setState(() {
      otpRequested = false;
      requestedOtpPhone = null;
      resendSeconds = 0;
      devOtp = null;
      error = null;
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
    final title = signup ? 'Create owner account' : 'Continue with phone';
    final stepTitle = otpRequested ? 'Enter OTP Code' : title;
    final stepBody = otpRequested
        ? 'Use the 6 digit code sent to your owner login number.'
        : signup
        ? 'Create owner access with your Bangladesh mobile number.'
        : 'Secure access to your private QR contact dashboard.';
    return Scaffold(
      body: SafeArea(
        child: Container(
          width: double.infinity,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0xFFF0FDFA), AppColors.page],
            ),
          ),
          child: LayoutBuilder(
            builder: (context, constraints) {
              return SingleChildScrollView(
                padding: EdgeInsets.fromLTRB(
                  AppSpacing.lg,
                  AppSpacing.lg,
                  AppSpacing.lg,
                  AppSpacing.lg + MediaQuery.viewInsetsOf(context).bottom,
                ),
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: constraints.maxHeight),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 430),
                      child: AutofillGroup(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const SizedBox(height: AppSpacing.lg),
                            const Center(child: NoNumQRBrandMark(size: 78)),
                            const SizedBox(height: AppSpacing.xl),
                            Text(
                              AppConfig.appName,
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.titleLarge
                                  ?.copyWith(
                                    color: AppColors.charcoal,
                                    fontWeight: FontWeight.w900,
                                  ),
                            ),
                            const SizedBox(height: AppSpacing.xs),
                            Text(
                              'Contact without revealing your number.',
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.labelLarge
                                  ?.copyWith(
                                    color: AppColors.emeraldDark,
                                    fontWeight: FontWeight.w900,
                                  ),
                            ),
                            const SizedBox(height: AppSpacing.lg),
                            Text(
                              'Manage private QR contact from your phone.',
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.headlineMedium
                                  ?.copyWith(
                                    color: AppColors.charcoal,
                                    fontWeight: FontWeight.w900,
                                  ),
                            ),
                            const SizedBox(height: AppSpacing.sm),
                            Text(
                              'Receive scanner messages, reply privately, and keep your phone number hidden by default.',
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.bodyMedium
                                  ?.copyWith(
                                    color: AppColors.slate,
                                    height: 1.4,
                                  ),
                            ),
                            const SizedBox(height: AppSpacing.lg),
                            const _AuthFeatureGrid(),
                            const SizedBox(height: AppSpacing.lg),
                            AppSurface(
                              padding: const EdgeInsets.all(AppSpacing.xl),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  _AuthStepHeader(
                                    title: stepTitle,
                                    body: stepBody,
                                    icon: otpRequested
                                        ? Icons.password_outlined
                                        : signup
                                        ? Icons.person_add_alt_1_outlined
                                        : Icons.phone_android_outlined,
                                  ),
                                  const SizedBox(height: AppSpacing.lg),
                                  SegmentedButton<bool>(
                                    segments: const [
                                      ButtonSegment(
                                        value: false,
                                        label: Text('Login'),
                                        icon: Icon(Icons.login),
                                      ),
                                      ButtonSegment(
                                        value: true,
                                        label: Text('Signup'),
                                        icon: Icon(
                                          Icons.person_add_alt_1_outlined,
                                        ),
                                      ),
                                    ],
                                    selected: {signup},
                                    onSelectionChanged: (value) {
                                      timer?.cancel();
                                      if (otpController.text.isNotEmpty) {
                                        otpController.clear();
                                      }
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
                                  const SizedBox(height: AppSpacing.lg),
                                  TextField(
                                    controller: phoneController,
                                    keyboardType: TextInputType.phone,
                                    textInputAction: signup
                                        ? TextInputAction.next
                                        : TextInputAction.done,
                                    autofillHints: const [
                                      AutofillHints.telephoneNumber,
                                    ],
                                    onSubmitted: (_) {
                                      if (!signup && canRequest) requestOtp();
                                    },
                                    decoration: InputDecoration(
                                      prefixIcon: const Icon(
                                        Icons.phone_android_outlined,
                                      ),
                                      suffixIcon: phoneValid
                                          ? const Icon(
                                              Icons.check_circle_outline,
                                              color: AppColors.emerald,
                                            )
                                          : null,
                                      labelText: 'Bangladesh mobile number',
                                      helperText:
                                          '01XXXXXXXXX, 8801XXXXXXXXX, or +8801XXXXXXXXX',
                                      errorText:
                                          phoneController.text.isEmpty ||
                                              phoneValid
                                          ? null
                                          : 'Enter a valid Bangladesh mobile number.',
                                    ),
                                  ),
                                  if (signup) ...[
                                    const SizedBox(height: AppSpacing.md),
                                    TextField(
                                      controller: nameController,
                                      textInputAction: TextInputAction.done,
                                      autofillHints: const [AutofillHints.name],
                                      onSubmitted: (_) {
                                        if (canRequest) requestOtp();
                                      },
                                      decoration: InputDecoration(
                                        prefixIcon: const Icon(
                                          Icons.person_outline,
                                        ),
                                        labelText: 'Owner name',
                                        helperText:
                                            'Used only to personalize your owner account',
                                        errorText:
                                            nameController.text.isEmpty ||
                                                nameController.text
                                                        .trim()
                                                        .length >=
                                                    2
                                            ? null
                                            : 'Owner name is required.',
                                      ),
                                    ),
                                  ],
                                  if (!otpRequested) ...[
                                    const SizedBox(height: AppSpacing.lg),
                                    PrimaryButton(
                                      label: 'Request OTP',
                                      icon: Icons.arrow_forward,
                                      loading: requesting,
                                      onPressed: canRequest ? requestOtp : null,
                                    ),
                                  ],
                                  if (otpRequested) ...[
                                    const SizedBox(height: AppSpacing.lg),
                                    AppInfoBanner(
                                      title: 'OTP sent',
                                      message:
                                          'Public scanner pages will not show your phone number.',
                                      icon: Icons.mark_email_read_outlined,
                                      tone: AppBannerTone.success,
                                    ),
                                    const SizedBox(height: AppSpacing.lg),
                                    TextField(
                                      controller: otpController,
                                      keyboardType: TextInputType.number,
                                      textInputAction: TextInputAction.done,
                                      inputFormatters: [
                                        FilteringTextInputFormatter.digitsOnly,
                                        LengthLimitingTextInputFormatter(6),
                                      ],
                                      autofillHints: const [
                                        AutofillHints.oneTimeCode,
                                      ],
                                      onSubmitted: (_) {
                                        if (canVerify) verifyOtp();
                                      },
                                      decoration: const InputDecoration(
                                        prefixIcon: Icon(Icons.pin_outlined),
                                        labelText: '6 digit OTP',
                                        helperText:
                                            'Enter the code before it expires.',
                                      ),
                                    ),
                                    const SizedBox(height: AppSpacing.md),
                                    PrimaryButton(
                                      label: 'Verify and continue',
                                      icon: Icons.verified_user_outlined,
                                      loading: verifying,
                                      onPressed: canVerify ? verifyOtp : null,
                                    ),
                                    const SizedBox(height: AppSpacing.sm),
                                    Wrap(
                                      alignment: WrapAlignment.center,
                                      spacing: AppSpacing.sm,
                                      runSpacing: AppSpacing.xs,
                                      children: [
                                        TextButton.icon(
                                          onPressed: editPhoneNumber,
                                          icon: const Icon(Icons.edit_outlined),
                                          label: const Text('Change phone'),
                                        ),
                                        TextButton.icon(
                                          onPressed: canRequest
                                              ? requestOtp
                                              : null,
                                          icon: const Icon(
                                            Icons.refresh_outlined,
                                          ),
                                          label: Text(
                                            resendSeconds > 0
                                                ? 'Resend in ${resendSeconds}s'
                                                : 'Resend OTP',
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            const SizedBox(height: AppSpacing.md),
                            const PrivacyNoticeCard(
                              message:
                                  'Your number is used for owner login. It is not shown to scanners by default.',
                            ),
                            if (devOtp != null) ...[
                              const SizedBox(height: AppSpacing.md),
                              AppInfoBanner(
                                title: 'Development OTP',
                                message: devOtp!,
                                icon: Icons.developer_mode,
                              ),
                            ],
                            if (error != null) ...[
                              const SizedBox(height: AppSpacing.md),
                              AppInfoBanner(
                                title: 'Could not continue',
                                message: error!,
                                icon: Icons.error_outline,
                                tone: AppBannerTone.danger,
                              ),
                            ],
                            const SizedBox(height: AppSpacing.xl),
                            Text(
                              'Built for cars, bikes, lost items, shops, and parking.',
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(
                                    color: AppColors.slate,
                                    fontWeight: FontWeight.w700,
                                  ),
                            ),
                            if (kDebugMode) ...[
                              const SizedBox(height: AppSpacing.md),
                              Text(
                                'API: ${AppConfig.apiBaseUrl}',
                                textAlign: TextAlign.center,
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _AuthStepHeader extends StatelessWidget {
  const _AuthStepHeader({
    required this.title,
    required this.body,
    required this.icon,
  });

  final String title;
  final String body;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: AppColors.emeraldSoft,
            borderRadius: BorderRadius.circular(AppRadii.lg),
            border: Border.all(color: AppColors.border),
          ),
          child: Icon(icon, color: AppColors.emeraldDark),
        ),
        const SizedBox(height: AppSpacing.md),
        Text(
          title,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            color: AppColors.charcoal,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          body,
          textAlign: TextAlign.center,
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(color: AppColors.slate),
        ),
      ],
    );
  }
}

class _AuthFeatureGrid extends StatelessWidget {
  const _AuthFeatureGrid();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: const [
        Expanded(
          child: _AuthFeatureCard(
            icon: Icons.visibility_off_outlined,
            title: 'Anonymity',
            body: 'Your ID stays hidden',
          ),
        ),
        SizedBox(width: AppSpacing.sm),
        Expanded(
          child: _AuthFeatureCard(
            icon: Icons.chat_bubble_outline,
            title: 'Direct chat',
            body: 'Instant private replies',
          ),
        ),
      ],
    );
  }
}

class _AuthFeatureCard extends StatelessWidget {
  const _AuthFeatureCard({
    required this.icon,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return AppSurface(
      padding: const EdgeInsets.all(AppSpacing.md),
      boxShadow: const [],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.emeraldDark, size: 20),
          const SizedBox(height: AppSpacing.sm),
          Text(
            title,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: AppColors.emeraldDark,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            body,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: AppColors.slate),
          ),
        ],
      ),
    );
  }
}
