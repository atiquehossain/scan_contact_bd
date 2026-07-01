import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/owner_models.dart';
import '../../core/network/api_client.dart';
import '../../core/services/owner_services.dart';
import '../../core/theme/app_theme.dart';
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
    return Scaffold(
      appBar: AppBar(title: const Text('Private Chat')),
      body: loading
          ? const AppSkeletonList(count: 5)
          : error != null
          ? AppErrorView(message: error!, onRetry: load)
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.lg,
                    AppSpacing.sm,
                    AppSpacing.lg,
                    0,
                  ),
                  child: Column(
                    children: [
                      if (request != null) _ChatContextCard(request: request!),
                      const SizedBox(height: AppSpacing.sm),
                      const PrivacyNoticeCard(
                        title: 'Private conversation',
                        message:
                            'Reply privately. Your phone number stays hidden.',
                      ),
                      if (isReadOnly) ...[
                        const SizedBox(height: AppSpacing.sm),
                        _ReadOnlyNotice(request: request!),
                      ],
                    ],
                  ),
                ),
                Expanded(
                  child: messages.isEmpty
                      ? ListView(
                          controller: scrollController,
                          padding: appPadding,
                          children: const [
                            AppEmptyState(
                              icon: Icons.forum_outlined,
                              title: 'No messages yet',
                              body:
                                  'When the scanner sends a message, it will appear in this private conversation.',
                            ),
                          ],
                        )
                      : ListView.builder(
                          controller: scrollController,
                          padding: const EdgeInsets.fromLTRB(
                            AppSpacing.lg,
                            AppSpacing.lg,
                            AppSpacing.lg,
                            AppSpacing.sm,
                          ),
                          itemCount: messages.length,
                          itemBuilder: (context, index) {
                            final message = messages[index];
                            return _PrivateChatBubble(
                              message: message,
                              onRetry: message.status == 'failed'
                                  ? () => send(retry: message)
                                  : null,
                            );
                          },
                        ),
                ),
                _ChatComposer(
                  controller: controller,
                  enabled: !isReadOnly,
                  sending: sending,
                  onChanged: () => setState(() {}),
                  onSend:
                      isReadOnly || controller.text.trim().isEmpty || sending
                      ? null
                      : send,
                ),
              ],
            ),
    );
  }
}

class _ChatContextCard extends StatelessWidget {
  const _ChatContextCard({required this.request});

  final ContactRequestSummary request;

  @override
  Widget build(BuildContext context) {
    final details = [
      request.tagLabel,
      if (request.tagType?.isNotEmpty == true) humanizeCode(request.tagType!),
      if (request.scannerName?.isNotEmpty == true) request.scannerName!,
    ];
    return AppSurface(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.emeraldSoft,
              borderRadius: BorderRadius.circular(AppRadii.md),
            ),
            child: const Icon(
              Icons.forum_outlined,
              color: AppColors.emeraldDark,
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: AppSpacing.sm,
                  runSpacing: AppSpacing.xs,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Text(
                      humanizeCode(request.reason),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    StatusChip(label: _chatStatusLabel(request)),
                  ],
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  details.join(' - '),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.slate,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'The scanner contacted you through a NoNumQR tag.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.muted,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ReadOnlyNotice extends StatelessWidget {
  const _ReadOnlyNotice({required this.request});

  final ContactRequestSummary request;

  @override
  Widget build(BuildContext context) {
    return AppInfoBanner(
      title: _readOnlyTitle(request),
      message: '${_readOnlyMessage(request)} Your phone number remains hidden.',
      icon: request.isDeleted ? Icons.delete_outline : Icons.lock_clock,
      tone: AppBannerTone.warning,
    );
  }
}

class _PrivateChatBubble extends StatelessWidget {
  const _PrivateChatBubble({required this.message, this.onRetry});

  final ChatMessage message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final isOwner = message.isOwner;
    final bubbleColor = isOwner ? AppColors.emerald : AppColors.surface;
    final textColor = isOwner ? Colors.white : AppColors.ink;
    final metaColor = isOwner
        ? Colors.white.withValues(alpha: 0.76)
        : AppColors.muted;
    return Align(
      alignment: isOwner ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.sizeOf(context).width * 0.78,
        ),
        margin: const EdgeInsets.only(bottom: AppSpacing.sm),
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: bubbleColor,
          borderRadius: BorderRadius.circular(AppRadii.lg),
          border: Border.all(
            color: isOwner ? AppColors.emerald : AppColors.border,
          ),
          boxShadow: AppShadows.card,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isOwner ? 'You' : 'Scanner',
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: isOwner ? Colors.white : AppColors.slate,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              message.message,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: textColor, height: 1.38),
            ),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.xs,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Text(
                  '${formatDateTime(message.createdAt)} - ${humanizeCode(message.status)}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: metaColor,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (message.status == 'failed' && onRetry != null)
                  TextButton.icon(
                    onPressed: onRetry,
                    icon: const Icon(Icons.refresh, size: 16),
                    label: const Text('Retry'),
                    style: TextButton.styleFrom(
                      foregroundColor: isOwner ? Colors.white : AppColors.red,
                      minimumSize: const Size(44, 36),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ChatComposer extends StatelessWidget {
  const _ChatComposer({
    required this.controller,
    required this.enabled,
    required this.sending,
    required this.onChanged,
    required this.onSend,
  });

  final TextEditingController controller;
  final bool enabled;
  final bool sending;
  final VoidCallback onChanged;
  final VoidCallback? onSend;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.lg,
          AppSpacing.sm,
          AppSpacing.lg,
          AppSpacing.lg,
        ),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.border)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: TextField(
                controller: controller,
                minLines: 1,
                maxLines: 4,
                enabled: enabled,
                textInputAction: TextInputAction.newline,
                decoration: InputDecoration(
                  labelText: enabled
                      ? 'Write a private reply...'
                      : 'Conversation closed',
                  helperText: enabled
                      ? 'Your phone number stays hidden.'
                      : 'New replies are no longer available.',
                ),
                onChanged: (_) => onChanged(),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Semantics(
              button: true,
              label: 'Send private reply',
              child: SizedBox(
                width: 56,
                height: 56,
                child: FilledButton(
                  onPressed: onSend,
                  style: FilledButton.styleFrom(
                    padding: EdgeInsets.zero,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadii.md),
                    ),
                  ),
                  child: sending
                      ? const SizedBox.square(
                          dimension: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.send),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String _chatStatusLabel(ContactRequestSummary request) {
  if (request.isDeleted) return 'Deleted';
  if (request.isExpired) return 'Expired';
  if (!request.canReply) return 'Closed';
  if (request.isUnread) return 'Unread';
  return 'Open';
}

String _readOnlyTitle(ContactRequestSummary request) {
  if (request.isDeleted) return 'Conversation unavailable';
  if (request.isExpired) return 'Conversation expired';
  return 'Request closed';
}

String _readOnlyMessage(ContactRequestSummary request) {
  if (request.isDeleted) return 'This conversation is no longer available.';
  if (request.isExpired) return 'This conversation has expired.';
  return 'This request is closed.';
}
