import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

import '../../core/models/owner_models.dart';
import '../../core/network/api_client.dart';
import '../../core/services/owner_services.dart';
import '../../core/widgets/app_widgets.dart';

class OwnerCallScreen extends ConsumerStatefulWidget {
  const OwnerCallScreen({super.key, required this.callId});

  final String callId;

  @override
  ConsumerState<OwnerCallScreen> createState() => _OwnerCallScreenState();
}

class _OwnerCallScreenState extends ConsumerState<OwnerCallScreen>
    with WidgetsBindingObserver {
  final remoteRenderer = RTCVideoRenderer();
  final processedSignalIds = <String>{};
  OwnerCallSession? callSession;
  RTCPeerConnection? peerConnection;
  MediaStream? localStream;
  Timer? pollTimer;
  bool loading = true;
  bool accepting = false;
  bool polling = false;
  bool settling = false;
  bool allowPop = false;
  bool connected = false;
  String? error;
  AppLifecycleState lifecycleState = AppLifecycleState.resumed;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    unawaited(remoteRenderer.initialize());
    unawaited(load());
    pollTimer = Timer.periodic(
      const Duration(seconds: 1),
      (_) => unawaited(poll()),
    );
  }

  @override
  void dispose() {
    pollTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    cleanupCall();
    remoteRenderer.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    lifecycleState = state;
    if (state == AppLifecycleState.resumed) {
      unawaited(load(silent: true));
    }
  }

  Future<void> load({bool silent = false}) async {
    if (!silent) {
      setState(() {
        loading = true;
        error = null;
      });
    }
    try {
      final nextCall = await ref.read(ownerServiceProvider).call(widget.callId);
      if (!mounted) return;
      setState(() {
        callSession = nextCall;
        error = null;
      });
    } catch (err) {
      if (!mounted) return;
      setState(() => error = apiErrorMessage(err));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> accept() async {
    if (accepting || settling || callSession?.isFinished == true) return;
    setState(() {
      accepting = true;
      error = null;
    });
    var acceptedOnServer = false;
    try {
      final accepted = await ref
          .read(ownerServiceProvider)
          .acceptCall(widget.callId);
      acceptedOnServer = true;
      if (!mounted) return;
      setState(() => callSession = accepted);
      await setupPeer();
      if (!mounted) return;
      setState(() => accepting = false);
      await poll();
    } catch (err) {
      cleanupCall();
      final settled = acceptedOnServer
          ? await _settleCallForExit(showError: false)
          : true;
      if (!mounted) return;
      setState(() {
        accepting = false;
        error = settled
            ? apiErrorMessage(err)
            : '${apiErrorMessage(err)} Could not close the call on the server.';
      });
    }
  }

  Future<void> setupPeer() async {
    localStream ??= await navigator.mediaDevices.getUserMedia({
      'audio': true,
      'video': false,
    });
    final iceServers = callSession?.iceServers ?? defaultIceServers;
    final peer = await createPeerConnection({
      'iceServers': iceServers.map((server) => server.toPeerConfig()).toList(),
    });
    peerConnection = peer;
    for (final track in localStream!.getTracks()) {
      await peer.addTrack(track, localStream!);
    }
    peer.onIceCandidate = (candidate) {
      unawaited(
        ref
            .read(ownerServiceProvider)
            .sendCallSignal(
              callId: widget.callId,
              type: 'candidate',
              payload: candidate.toMap(),
            ),
      );
    };
    peer.onTrack = (event) {
      if (event.streams.isNotEmpty) {
        remoteRenderer.srcObject = event.streams.first;
      }
    };
    peer.onConnectionState = (state) {
      if (!mounted) return;
      setState(
        () => connected =
            state == RTCPeerConnectionState.RTCPeerConnectionStateConnected,
      );
    };
  }

  Future<void> poll() async {
    if (!mounted ||
        polling ||
        settling ||
        lifecycleState != AppLifecycleState.resumed) {
      return;
    }
    polling = true;
    try {
      final nextCall = await ref.read(ownerServiceProvider).call(widget.callId);
      if (!mounted) return;
      setState(() => callSession = nextCall);
      if (nextCall.isFinished) {
        cleanupCall();
        return;
      }
      if (!nextCall.isAccepted || peerConnection == null) return;
      final signals = await ref
          .read(ownerServiceProvider)
          .callSignals(widget.callId);
      for (final signal in signals) {
        await handleSignal(signal);
      }
    } catch (_) {
      // Keep the ringing/call UI visible. Manual retry/end remains available.
    } finally {
      polling = false;
    }
  }

  Future<void> handleSignal(CallSignal signal) async {
    if (processedSignalIds.contains(signal.id)) return;
    final peer = peerConnection;
    if (peer == null) return;
    if (signal.type == 'offer') {
      final sdp = signal.payload['sdp']?.toString();
      final type = signal.payload['type']?.toString() ?? 'offer';
      if (sdp == null || sdp.isEmpty) return;
      await peer.setRemoteDescription(RTCSessionDescription(sdp, type));
      final answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      await ref
          .read(ownerServiceProvider)
          .sendCallSignal(
            callId: widget.callId,
            type: 'answer',
            payload: answer.toMap(),
          );
      processedSignalIds.add(signal.id);
      return;
    }
    if (signal.type == 'candidate') {
      final candidate = signal.payload['candidate']?.toString();
      if (candidate == null || candidate.isEmpty) return;
      await peer.addCandidate(
        RTCIceCandidate(
          candidate,
          signal.payload['sdpMid']?.toString(),
          (signal.payload['sdpMLineIndex'] as num?)?.toInt(),
        ),
      );
      processedSignalIds.add(signal.id);
    }
  }

  Future<void> decline() async {
    final settled = await _settleCallForExit();
    if (settled) _popAfterSettlement();
  }

  Future<void> end() async {
    final settled = await _settleCallForExit();
    if (settled) _popAfterSettlement();
  }

  Future<bool> _settleCallForExit({bool showError = true}) async {
    if (settling) return false;
    final call = callSession;
    cleanupCall();
    if (call?.isFinished == true) return true;
    if (mounted) {
      setState(() {
        settling = true;
        if (showError) error = null;
      });
    } else {
      settling = true;
    }
    try {
      final service = ref.read(ownerServiceProvider);
      if (call?.isRinging == true) {
        await service.declineCall(widget.callId);
      } else {
        await service.endCall(widget.callId);
      }
      return true;
    } catch (err) {
      if (call == null && _isNotFound(err)) return true;
      if (mounted && showError) {
        setState(() => error = apiErrorMessage(err));
      }
      return false;
    } finally {
      settling = false;
      if (mounted) setState(() {});
    }
  }

  Future<void> _handleBack() async {
    final settled = await _settleCallForExit();
    if (settled) _popAfterSettlement();
  }

  void _popAfterSettlement() {
    if (!mounted) return;
    setState(() => allowPop = true);
    Navigator.of(context).pop();
  }

  void cleanupCall() {
    localStream?.getTracks().forEach((track) => track.stop());
    localStream = null;
    remoteRenderer.srcObject = null;
    peerConnection?.close();
    peerConnection = null;
  }

  @override
  Widget build(BuildContext context) {
    final call = callSession;
    return PopScope<Object?>(
      canPop: allowPop,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        unawaited(_handleBack());
      },
      child: Scaffold(
        appBar: AppBar(title: const Text('Private call')),
        body: loading
            ? const AppLoadingView(label: 'Loading private call...')
            : error != null && call == null
            ? AppErrorView(message: error!, onRetry: load)
            : ListView(
                padding: appPadding,
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          CircleAvatar(
                            radius: 38,
                            backgroundColor: Theme.of(
                              context,
                            ).colorScheme.primaryContainer,
                            child: Icon(
                              Icons.phone_in_talk,
                              color: Theme.of(context).colorScheme.primary,
                              size: 38,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            call?.scannerName?.isNotEmpty == true
                                ? '${call!.scannerName} is calling'
                                : 'Scanner is calling',
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.headlineSmall
                                ?.copyWith(fontWeight: FontWeight.w900),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            call?.tagLabel ?? 'QR tag',
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 12),
                          StatusChip(
                            label: connected
                                ? 'Connected'
                                : _statusLabel(call?.status ?? 'RINGING'),
                            icon: connected
                                ? Icons.lock_outline
                                : Icons.phone_callback_outlined,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const PrivacyNoticeCard(
                    message:
                        'Private QR call. Phone numbers stay hidden while you speak through NoNumQR.',
                  ),
                  if (error != null) ...[
                    const SizedBox(height: 12),
                    Card(
                      color: Theme.of(context).colorScheme.errorContainer,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Text(error!),
                      ),
                    ),
                  ],
                  SizedBox(
                    height: 1,
                    width: 1,
                    child: RTCVideoView(remoteRenderer),
                  ),
                  const SizedBox(height: 20),
                  if (call?.isRinging == true)
                    Row(
                      children: [
                        Expanded(
                          child: FilledButton.icon(
                            onPressed: accepting || settling ? null : accept,
                            icon: accepting
                                ? const SizedBox.square(
                                    dimension: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Icon(Icons.call),
                            label: const Text('Accept'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: settling ? null : decline,
                            icon: const Icon(Icons.call_end),
                            label: const Text('Decline'),
                          ),
                        ),
                      ],
                    )
                  else
                    FilledButton.icon(
                      style: FilledButton.styleFrom(
                        backgroundColor: Theme.of(context).colorScheme.error,
                      ),
                      onPressed: settling ? null : end,
                      icon: const Icon(Icons.call_end),
                      label: Text(settling ? 'Ending...' : 'End call'),
                    ),
                  const SizedBox(height: 12),
                  Text(
                    'If audio does not connect, ask the scanner to send a private text message.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
      ),
    );
  }
}

bool _isNotFound(Object error) {
  return error is DioException && error.response?.statusCode == 404;
}

String _statusLabel(String status) {
  switch (status.toUpperCase()) {
    case 'ACCEPTED':
      return 'Connecting';
    case 'DECLINED':
      return 'Declined';
    case 'ENDED':
      return 'Ended';
    case 'EXPIRED':
      return 'Expired';
    case 'FAILED':
      return 'Failed';
    default:
      return 'Ringing';
  }
}
