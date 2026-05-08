import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/owner_models.dart';
import '../../core/network/api_client.dart';
import '../../core/services/owner_services.dart';
import '../../core/widgets/app_widgets.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key, required this.requestId});

  final String requestId;

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen>
    with WidgetsBindingObserver {
  final controller = TextEditingController();
  final scrollController = ScrollController();
  ContactRequestSummary? request;
  List<ChatMessage> messages = [];
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
          .read(ownerServiceProvider)
          .messages(widget.requestId);
      await ref.read(ownerServiceProvider).markRead(widget.requestId);
      setState(() {
        request = data.request;
        messages = data.messages;
      });
      scrollToBottom();
      ref.invalidate(dashboardProvider);
      ref.invalidate(requestsProvider('all'));
    } catch (err) {
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
          .read(ownerServiceProvider)
          .messages(widget.requestId);
      await ref.read(ownerServiceProvider).markRead(widget.requestId);
      if (!mounted) return;
      final failedLocalMessages = messages
          .where(
            (item) => item.status == 'failed' && item.id.startsWith('local-'),
          )
          .toList();
      final previousLastId = messages.isEmpty ? null : messages.last.id;
      setState(() {
        request = data.request;
        messages = [...data.messages, ...failedLocalMessages];
        error = null;
      });
      final nextLastId = messages.isEmpty ? null : messages.last.id;
      if (nextLastId != null && nextLastId != previousLastId) {
        scrollToBottom();
      }
      ref.invalidate(dashboardProvider);
      ref.invalidate(requestsProvider('all'));
      ref.invalidate(requestsProvider('unread'));
    } catch (_) {
      // Keep the current chat visible. The next timer tick or manual retry can recover.
    } finally {
      refreshing = false;
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

  Future<void> send({ChatMessage? retry}) async {
    final text = retry?.message ?? controller.text.trim();
    if (text.isEmpty || sending || request?.canReply == false) return;
    final localId =
        retry?.id ?? 'local-${DateTime.now().microsecondsSinceEpoch}';
    if (retry == null) {
      controller.clear();
      setState(() {
        messages = [
          ...messages,
          ChatMessage(
            id: localId,
            senderType: 'owner',
            message: text,
            createdAt: DateTime.now(),
            status: 'sending',
          ),
        ];
      });
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
          .read(ownerServiceProvider)
          .reply(requestId: widget.requestId, message: text);
      setState(
        () => messages = messages
            .map((item) => item.id == localId ? sent : item)
            .toList(),
      );
      scrollToBottom();
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Reply sent')));
      }
    } catch (err) {
      final message = apiErrorMessage(err);
      setState(
        () => messages = messages
            .map(
              (item) =>
                  item.id == localId ? item.copyWith(status: 'failed') : item,
            )
            .toList(),
      );
      if (message.toLowerCase().contains('expired')) {
        unawaited(load());
      }
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(message)));
      }
    } finally {
      if (mounted) setState(() => sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isReadOnly = request != null && !request!.canReply;
    final expiredCopy = request?.isDeleted == true
        ? 'This conversation was deleted according to the 10-day privacy policy.'
        : 'This conversation has expired. The scanner must scan the QR again to start a new chat. Your phone number was not shared.';
    return Scaffold(
      appBar: AppBar(title: Text(request?.tagLabel ?? 'Private chat')),
      body: loading
          ? const AppLoadingView(label: 'Loading chat...')
          : error != null
          ? AppErrorView(message: error!, onRetry: load)
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                  child: Column(
                    children: [
                      if (request != null)
                        Card(
                          child: ListTile(
                            leading: const Icon(Icons.forum_outlined),
                            title: Text(request!.reason),
                            subtitle: Text(request!.tagLabel),
                          ),
                        ),
                      const SizedBox(height: 8),
                      const PrivacyNoticeCard(
                        message:
                            'Private chat. Your phone number is hidden from the scanner.',
                      ),
                      if (isReadOnly) ...[
                        const SizedBox(height: 8),
                        Card(
                          color: Theme.of(context).colorScheme.errorContainer,
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(
                                  Icons.timer_off_outlined,
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onErrorContainer,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    expiredCopy,
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(
                                          color: Theme.of(
                                            context,
                                          ).colorScheme.onErrorContainer,
                                          fontWeight: FontWeight.w700,
                                        ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    controller: scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: messages.length,
                    itemBuilder: (context, index) {
                      final message = messages[index];
                      return ChatBubble(
                        message: message,
                        onRetry: message.status == 'failed'
                            ? () => send(retry: message)
                            : null,
                      );
                    },
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
                            enabled: !isReadOnly,
                            decoration: InputDecoration(
                              labelText: isReadOnly
                                  ? 'Conversation expired'
                                  : 'Write a private reply...',
                            ),
                            onChanged: (_) => setState(() {}),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Semantics(
                          label: 'Send private reply',
                          child: FilledButton(
                            onPressed:
                                isReadOnly ||
                                    controller.text.trim().isEmpty ||
                                    sending
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
