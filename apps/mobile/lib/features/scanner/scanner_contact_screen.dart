import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../../core/widgets/app_widgets.dart';
import 'scanner_service.dart';

class ScannerContactScreen extends ConsumerStatefulWidget {
  const ScannerContactScreen({super.key, required this.publicSlug});

  final String publicSlug;

  @override
  ConsumerState<ScannerContactScreen> createState() =>
      _ScannerContactScreenState();
}

class _ScannerContactScreenState extends ConsumerState<ScannerContactScreen> {
  final nameController = TextEditingController();
  final messageController = TextEditingController();
  PublicQrTag? tag;
  String reason = 'VEHICLE_BLOCKING';
  bool loading = true;
  bool submitting = false;
  String? error;
  String? fieldError;

  final reasons = const {
    'VEHICLE_BLOCKING': 'Vehicle is blocking',
    'LIGHT_ON': 'Light is on',
    'VEHICLE_DAMAGED': 'Vehicle may be damaged',
    'FOUND_ITEM': 'I found your item',
    'DELIVERY_CONTACT': 'Delivery/contact needed',
    'BUSINESS_INQUIRY': 'Business inquiry',
    'OTHER': 'Other',
  };

  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  void dispose() {
    nameController.dispose();
    messageController.dispose();
    super.dispose();
  }

  Future<void> load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final service = ref.read(scannerServiceProvider);
      final nextTag = await service.fetchTag(widget.publicSlug);
      await service.recordScan(widget.publicSlug);
      if (!mounted) return;
      setState(() => tag = nextTag);
    } catch (err) {
      if (!mounted) return;
      setState(() => error = apiErrorMessage(err));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> submit() async {
    final message = messageController.text.trim();
    if (message.length < 3) {
      setState(() => fieldError = 'Write at least 3 characters.');
      return;
    }
    setState(() {
      submitting = true;
      fieldError = null;
      error = null;
    });
    try {
      final result = await ref
          .read(scannerServiceProvider)
          .submitContact(
            publicSlug: widget.publicSlug,
            reason: reason,
            message: message,
            scannerName: nameController.text,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Message sent privately')));
      context.go(
        '/scanner/conversation/${result.contactRequestId}?token=${Uri.encodeComponent(result.conversationToken)}',
      );
    } catch (err) {
      if (!mounted) return;
      setState(() => error = apiErrorMessage(err));
    } finally {
      if (mounted) setState(() => submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Scaffold(
        body: SafeArea(child: AppLoadingView(label: 'Opening QR...')),
      );
    }
    if (error != null && tag == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('QR contact')),
        body: AppErrorView(message: error!, onRetry: load),
      );
    }

    final currentTag = tag!;
    final isActive = currentTag.status == 'ACTIVE';
    final canContact = isActive && currentTag.contactFormEnabled;

    return Scaffold(
      appBar: AppBar(title: const Text('Private QR contact')),
      body: ListView(
        padding: appPadding,
        children: [
          Text(
            currentTag.label,
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 4),
          Text(currentTag.type.replaceAll('_', ' ')),
          const SizedBox(height: 12),
          const PrivacyNoticeCard(
            message:
                'Send a private message to the owner. Your phone number is not shown unless you write it yourself.',
          ),
          if (!isActive) ...[
            const SizedBox(height: 12),
            Card(
              color: Theme.of(context).colorScheme.errorContainer,
              child: const ListTile(
                leading: Icon(Icons.block),
                title: Text('This QR tag is not active.'),
              ),
            ),
          ],
          if (isActive && !currentTag.contactFormEnabled) ...[
            const SizedBox(height: 12),
            Card(
              color: Theme.of(context).colorScheme.errorContainer,
              child: const ListTile(
                leading: Icon(Icons.block),
                title: Text('Private contact form is disabled for this QR.'),
              ),
            ),
          ],
          const SizedBox(height: 20),
          Text(
            'Why are you contacting the owner?',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final entry in reasons.entries)
                ChoiceChip(
                  label: Text(entry.value),
                  selected: reason == entry.key,
                  onSelected: canContact
                      ? (_) => setState(() => reason = entry.key)
                      : null,
                ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: nameController,
            enabled: canContact && !submitting,
            decoration: const InputDecoration(labelText: 'Your name, optional'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: messageController,
            enabled: canContact && !submitting,
            minLines: 4,
            maxLines: 6,
            decoration: InputDecoration(
              labelText: 'Message',
              helperText: 'Do not include sensitive information unless needed.',
              errorText: fieldError,
            ),
            onChanged: (_) {
              if (fieldError != null) setState(() => fieldError = null);
            },
          ),
          if (error != null) ...[
            const SizedBox(height: 12),
            Card(
              color: Theme.of(context).colorScheme.errorContainer,
              child: ListTile(
                leading: const Icon(Icons.error_outline),
                title: Text(error!),
              ),
            ),
          ],
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: canContact && !submitting ? submit : null,
            icon: submitting
                ? const SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.lock_outline),
            label: const Text('Send request privately'),
          ),
        ],
      ),
    );
  }
}
