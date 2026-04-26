import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/widgets/app_widgets.dart';
import 'scanner_service.dart';

class ScannerConversationScreen extends ConsumerStatefulWidget {
  const ScannerConversationScreen({
    super.key,
    required this.requestId,
    required this.token,
  });

  final String requestId;
  final String token;

  @override
  ConsumerState<ScannerConversationScreen> createState() =>
      _ScannerConversationScreenState();
}

class _ScannerConversationScreenState
    extends ConsumerState<ScannerConversationScreen>
    with WidgetsBindingObserver {
  final controller = TextEditingController();
  final scrollController = ScrollController();
  ScannerConversation? conversation;
  List<ScannerMessage> messages = [];
  bool loading = true;
  bool sending = false;
  bool refreshing = false;
  String? error;
  Timer? refreshTimer;
  AppLifecycleState lifecycleState = AppLifecycleState.resumed;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    load();
    refreshTimer = Timer.periodic(
      const Duration(milliseconds: 1500),
      (_) => unawaited(refreshSilently()),
    );
  }

  @override
  void dispose() {
    refreshTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    controller.dispose();
    scrollController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    lifecycleState = state;
    if (state == AppLifecycleState.resumed) {
      unawaited(refreshSilently());
    }
  }

  Future<void> load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final data = await ref
          .read(scannerServiceProvider)
          .conversation(requestId: widget.requestId, token: widget.token);
      if (!mounted) return;
      setState(() {
        conversation = data;
        messages = data.messages;
      });
      scrollToBottom();
    } catch (err) {
      if (!mounted) return;
      setState(() => error = apiErrorMessage(err));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> refreshSilently() async {
    if (!mounted ||
        loading ||
        sending ||
        refreshing ||
        lifecycleState != AppLifecycleState.resumed) {
      return;
    }
    refreshing = true;
    try {
      final data = await ref
          .read(scannerServiceProvider)
          .conversation(requestId: widget.requestId, token: widget.token);
      if (!mounted) return;
      final failedLocalMessages = messages
          .where(
            (item) => item.status == 'failed' && item.id.startsWith('local-'),
          )
          .toList();
      final previousLastId = messages.isEmpty ? null : messages.last.id;
      setState(() {
        conversation = data;
        messages = [...data.messages, ...failedLocalMessages];
        error = null;
      });
      final nextLastId = messages.isEmpty ? null : messages.last.id;
      if (nextLastId != null && nextLastId != previousLastId) {
        scrollToBottom();
      }
    } catch (_) {
      // Keep the existing thread visible. The next poll or retry can recover.
    } finally {
      refreshing = false;
    }
  }

  Future<void> send({ScannerMessage? retry}) async {
    final text = retry?.body ?? controller.text.trim();
    if (text.isEmpty || sending) return;
    final localId =
        retry?.id ?? 'local-${DateTime.now().microsecondsSinceEpoch}';
    if (retry == null) {
      controller.clear();
      setState(() {
        messages = [
          ...messages,
          ScannerMessage(
            id: localId,
            sender: 'SCANNER',
            body: text,
            createdAt: DateTime.now(),
            status: 'sending',
          ),
        ];
      });
      scrollToBottom();
    } else {
      setState(
        () => messages = messages
            .map(
              (item) =>
                  item.id == localId ? item.copyWith(status: 'sending') : item,
            )
            .toList(),
      );
    }
    setState(() => sending = true);
    try {
      final sent = await ref
          .read(scannerServiceProvider)
          .reply(requestId: widget.requestId, token: widget.token, body: text);
      setState(
        () => messages = messages
            .map((item) => item.id == localId ? sent : item)
            .toList(),
      );
      scrollToBottom();
    } catch (_) {
      setState(
        () => messages = messages
            .map(
              (item) =>
                  item.id == localId ? item.copyWith(status: 'failed') : item,
            )
            .toList(),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not send message. Try again.')),
        );
      }
    } finally {
      if (mounted) setState(() => sending = false);
    }
  }

  void scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !scrollController.hasClients) return;
      scrollController.animateTo(
        scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOut,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(conversation?.tagLabel ?? 'Private thread')),
      body: loading
          ? const AppLoadingView(label: 'Loading private thread...')
          : error != null && conversation == null
          ? AppErrorView(message: error!, onRetry: load)
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                  child: Column(
                    children: [
                      if (conversation != null)
                        Card(
                          child: ListTile(
                            leading: const Icon(Icons.forum_outlined),
                            title: Text(conversation!.reason),
                            subtitle: Text(conversation!.tagLabel),
                            trailing: refreshing
                                ? const SizedBox.square(
                                    dimension: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  )
                                : null,
                          ),
                        ),
                      const SizedBox(height: 8),
                      const PrivacyNoticeCard(
                        message:
                            'This conversation keeps phone numbers hidden unless someone writes one manually.',
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    controller: scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: messages.length,
                    itemBuilder: (context, index) => ScannerChatBubble(
                      message: messages[index],
                      onRetry: messages[index].status == 'failed'
                          ? () => send(retry: messages[index])
                          : null,
                    ),
                  ),
                ),
                SafeArea(
                  top: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: TextField(
                            controller: controller,
                            minLines: 1,
                            maxLines: 4,
                            decoration: const InputDecoration(
                              labelText: 'Write a private message',
                            ),
                            onChanged: (_) => setState(() {}),
                          ),
                        ),
                        const SizedBox(width: 8),
                        FilledButton(
                          onPressed: controller.text.trim().isEmpty || sending
                              ? null
                              : send,
                          child: sending
                              ? const SizedBox.square(
                                  dimension: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Icon(Icons.send),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}

class ScannerChatBubble extends StatelessWidget {
  const ScannerChatBubble({super.key, required this.message, this.onRetry});

  final ScannerMessage message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final isMine = message.isScanner;
    final color = isMine
        ? Theme.of(context).colorScheme.primaryContainer
        : Theme.of(context).colorScheme.surface;
    return Align(
      alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        constraints: const BoxConstraints(maxWidth: 320),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: Theme.of(context).colorScheme.outlineVariant,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isMine ? 'You' : 'Owner',
              style: Theme.of(
                context,
              ).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 4),
            Text(message.body),
            const SizedBox(height: 6),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${formatDateTime(message.createdAt)} · ${message.status}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                if (message.status == 'failed' && onRetry != null)
                  TextButton(onPressed: onRetry, child: const Text('Retry')),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
