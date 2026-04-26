import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';

final scannerServiceProvider = Provider<ScannerService>(
  (ref) => ScannerService(ref.watch(apiClientProvider)),
);

class ScannerService {
  const ScannerService(this._api);

  final ApiClient _api;

  Future<PublicQrTag> fetchTag(String publicSlug) async {
    final response = await _api.get('/t/${Uri.encodeComponent(publicSlug)}');
    final data = Map<String, dynamic>.from(response.data as Map);
    return PublicQrTag.fromJson(Map<String, dynamic>.from(data['tag'] as Map));
  }

  Future<void> recordScan(String publicSlug) async {
    try {
      await _api.post('/t/${Uri.encodeComponent(publicSlug)}/scan');
    } on DioException {
      // Scan analytics must never block the scanner from sending a request.
    }
  }

  Future<ScannerContactResult> submitContact({
    required String publicSlug,
    required String reason,
    required String message,
    String? scannerName,
  }) async {
    final response = await _api.post(
      '/t/${Uri.encodeComponent(publicSlug)}/contact',
      data: {
        'reason': reason,
        'message': message,
        if (scannerName != null && scannerName.trim().isNotEmpty)
          'scannerName': scannerName.trim(),
      },
    );
    return ScannerContactResult.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<ScannerConversation> conversation({
    required String requestId,
    required String token,
  }) async {
    final response = await _api.get(
      '/public/contact-requests/${Uri.encodeComponent(requestId)}/messages?token=${Uri.encodeComponent(token)}',
    );
    return ScannerConversation.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<ScannerMessage> reply({
    required String requestId,
    required String token,
    required String body,
    String? senderName,
  }) async {
    final response = await _api.post(
      '/public/contact-requests/${Uri.encodeComponent(requestId)}/messages',
      data: {
        'token': token,
        'body': body,
        if (senderName != null && senderName.trim().isNotEmpty)
          'senderName': senderName.trim(),
      },
    );
    final data = Map<String, dynamic>.from(response.data as Map);
    return ScannerMessage.fromJson(
      Map<String, dynamic>.from(data['message'] as Map),
    );
  }
}

class PublicQrTag {
  const PublicQrTag({
    required this.publicSlug,
    required this.publicUrl,
    required this.status,
    required this.type,
    required this.label,
    required this.contactFormEnabled,
    this.vehicleNumberHint,
    this.itemName,
  });

  final String publicSlug;
  final String publicUrl;
  final String status;
  final String type;
  final String label;
  final bool contactFormEnabled;
  final String? vehicleNumberHint;
  final String? itemName;

  factory PublicQrTag.fromJson(Map<String, dynamic> json) {
    final contactOptions = json['contactOptions'] is Map
        ? Map<String, dynamic>.from(json['contactOptions'] as Map)
        : <String, dynamic>{};
    return PublicQrTag(
      publicSlug: json['publicSlug']?.toString() ?? '',
      publicUrl: json['publicUrl']?.toString() ?? '',
      status: json['status']?.toString() ?? 'ACTIVE',
      type: json['type']?.toString() ?? 'OTHER',
      label: json['label']?.toString() ?? 'QR tag',
      contactFormEnabled: contactOptions['contactForm'] != false,
      vehicleNumberHint: json['vehicleNumberHint']?.toString(),
      itemName: json['itemName']?.toString(),
    );
  }
}

class ScannerContactResult {
  const ScannerContactResult({
    required this.contactRequestId,
    required this.conversationToken,
    required this.conversationUrl,
    this.expiresAt,
  });

  final String contactRequestId;
  final String conversationToken;
  final String conversationUrl;
  final DateTime? expiresAt;

  factory ScannerContactResult.fromJson(Map<String, dynamic> json) {
    return ScannerContactResult(
      contactRequestId: json['contactRequestId']?.toString() ?? '',
      conversationToken: json['conversationToken']?.toString() ?? '',
      conversationUrl: json['conversationUrl']?.toString() ?? '',
      expiresAt: DateTime.tryParse(json['expiresAt']?.toString() ?? ''),
    );
  }
}

class ScannerConversation {
  const ScannerConversation({
    required this.requestId,
    required this.reason,
    required this.status,
    required this.tagLabel,
    required this.messages,
    this.expiresAt,
  });

  final String requestId;
  final String reason;
  final String status;
  final String tagLabel;
  final List<ScannerMessage> messages;
  final DateTime? expiresAt;

  bool get canReply => status.toUpperCase() == 'OPEN';

  ScannerConversation copyWith({
    String? status,
    List<ScannerMessage>? messages,
  }) {
    return ScannerConversation(
      requestId: requestId,
      reason: reason,
      status: status ?? this.status,
      tagLabel: tagLabel,
      messages: messages ?? this.messages,
      expiresAt: expiresAt,
    );
  }

  factory ScannerConversation.fromJson(Map<String, dynamic> json) {
    final request = json['contactRequest'] is Map
        ? Map<String, dynamic>.from(json['contactRequest'] as Map)
        : <String, dynamic>{};
    return ScannerConversation(
      requestId: request['id']?.toString() ?? '',
      reason: request['reason']?.toString() ?? 'OTHER',
      status: request['status']?.toString() ?? 'OPEN',
      tagLabel: request['tagLabel']?.toString() ?? 'QR tag',
      expiresAt: DateTime.tryParse(request['expiresAt']?.toString() ?? ''),
      messages: (json['messages'] as List? ?? [])
          .whereType<Map>()
          .map(
            (item) => ScannerMessage.fromJson(Map<String, dynamic>.from(item)),
          )
          .toList(),
    );
  }
}

class ScannerMessage {
  const ScannerMessage({
    required this.id,
    required this.sender,
    required this.body,
    required this.createdAt,
    this.status = 'sent',
  });

  final String id;
  final String sender;
  final String body;
  final DateTime createdAt;
  final String status;

  bool get isScanner => sender == 'SCANNER' || sender == 'scanner';

  ScannerMessage copyWith({String? id, String? status}) {
    return ScannerMessage(
      id: id ?? this.id,
      sender: sender,
      body: body,
      createdAt: createdAt,
      status: status ?? this.status,
    );
  }

  factory ScannerMessage.fromJson(Map<String, dynamic> json) {
    return ScannerMessage(
      id: json['id']?.toString() ?? '',
      sender: json['sender']?.toString() ?? 'SCANNER',
      body: json['body']?.toString() ?? '',
      createdAt:
          DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}
