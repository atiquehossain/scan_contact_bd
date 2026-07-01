import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../core/widgets/app_widgets.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final controller = MobileScannerController();
  final manualController = TextEditingController();
  bool handledScan = false;
  String? error;

  @override
  void dispose() {
    controller.dispose();
    manualController.dispose();
    super.dispose();
  }

  void handleRawCode(String? rawCode) {
    if (handledScan) return;
    final slug = extractPublicSlug(rawCode ?? '');
    if (slug == null) {
      setState(() => error = 'This is not a NoNumQR QR code.');
      return;
    }
    handledScan = true;
    controller.stop();
    context.pushReplacement('/scanner/contact/$slug');
  }

  void handleManual() {
    final slug = extractPublicSlug(manualController.text);
    if (slug == null) {
      setState(() => error = 'Enter a valid NoNumQR QR URL or code.');
      return;
    }
    context.push('/scanner/contact/$slug');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scan QR')),
      body: ListView(
        padding: appPadding,
        children: [
          Text(
            'Scan a NoNumQR QR',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 4),
          const Text(
            'You can send a private message without seeing the owner phone number.',
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: AspectRatio(
              aspectRatio: 1,
              child: MobileScanner(
                controller: controller,
                onDetect: (capture) {
                  for (final barcode in capture.barcodes) {
                    if (barcode.rawValue != null) {
                      handleRawCode(barcode.rawValue);
                      return;
                    }
                  }
                },
              ),
            ),
          ),
          const SizedBox(height: 12),
          const PrivacyNoticeCard(
            message:
                'Scanning a QR only opens the public contact page. Owner private data stays hidden.',
          ),
          if (error != null) ...[
            const SizedBox(height: 12),
            Card(
              color: Theme.of(context).colorScheme.errorContainer,
              child: ListTile(
                leading: const Icon(Icons.error_outline),
                title: Text(error!),
                trailing: TextButton(
                  onPressed: () {
                    setState(() {
                      handledScan = false;
                      error = null;
                    });
                    controller.start();
                  },
                  child: const Text('Try again'),
                ),
              ),
            ),
          ],
          const SizedBox(height: 20),
          Text(
            'Manual entry',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: manualController,
            decoration: const InputDecoration(
              labelText: 'QR URL or code',
              helperText: 'Example: https://nonumqr.com/t/publicSlug',
            ),
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => handleManual(),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: handleManual,
            icon: const Icon(Icons.arrow_forward),
            label: const Text('Open QR contact page'),
          ),
        ],
      ),
    );
  }
}

String? extractPublicSlug(String rawValue) {
  final value = rawValue.trim();
  if (value.isEmpty) return null;

  final uri = Uri.tryParse(value);
  if (uri != null) {
    final segments = uri.pathSegments;
    final tagIndex = segments.indexOf('t');
    if (tagIndex >= 0 && tagIndex + 1 < segments.length) {
      return _cleanSlug(segments[tagIndex + 1]);
    }
  }

  final match = RegExp(r'\/t\/([A-Za-z0-9_-]+)').firstMatch(value);
  if (match != null) return _cleanSlug(match.group(1) ?? '');

  if (RegExp(r'^[A-Za-z0-9_-]{12,}$').hasMatch(value)) {
    return _cleanSlug(value);
  }
  return null;
}

String? _cleanSlug(String value) {
  final slug = value.trim();
  if (!RegExp(r'^[A-Za-z0-9_-]{12,}$').hasMatch(slug)) return null;
  return slug;
}
