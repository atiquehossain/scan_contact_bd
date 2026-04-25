class OwnerProfile {
  const OwnerProfile({
    required this.id,
    required this.name,
    required this.phone,
    this.email,
  });

  final String id;
  final String name;
  final String phone;
  final String? email;

  factory OwnerProfile.fromJson(Map<String, dynamic> json) {
    return OwnerProfile(
      id: json['id']?.toString() ?? '',
      name: (json['name'] ?? json['fullName'] ?? 'Owner').toString(),
      phone: json['phone']?.toString() ?? '',
      email: json['email']?.toString(),
    );
  }
}

class OwnerDashboard {
  const OwnerDashboard({
    required this.activeQrCount,
    required this.totalScanCount,
    required this.unreadRequestCount,
    required this.unreadNotificationCount,
    required this.hasAssignedQr,
    required this.recentRequests,
    this.latestOrder,
  });

  final int activeQrCount;
  final int totalScanCount;
  final int unreadRequestCount;
  final int unreadNotificationCount;
  final bool hasAssignedQr;
  final List<ContactRequestSummary> recentRequests;
  final OwnerOrder? latestOrder;

  factory OwnerDashboard.fromJson(Map<String, dynamic> json) {
    return OwnerDashboard(
      activeQrCount: (json['activeQrCount'] as num?)?.toInt() ?? 0,
      totalScanCount: (json['totalScanCount'] as num?)?.toInt() ?? 0,
      unreadRequestCount: (json['unreadRequestCount'] as num?)?.toInt() ?? 0,
      unreadNotificationCount:
          (json['unreadNotificationCount'] as num?)?.toInt() ?? 0,
      hasAssignedQr: json['hasAssignedQr'] == true,
      recentRequests: (json['recentRequests'] as List? ?? [])
          .whereType<Map>()
          .map(
            (item) =>
                ContactRequestSummary.fromJson(Map<String, dynamic>.from(item)),
          )
          .toList(),
      latestOrder: json['latestOrder'] is Map
          ? OwnerOrder.fromJson(
              Map<String, dynamic>.from(json['latestOrder'] as Map),
            )
          : null,
    );
  }
}

class QrTag {
  const QrTag({
    required this.id,
    required this.label,
    required this.type,
    required this.status,
    required this.scanCount,
    required this.publicUrl,
    required this.qrImageUrl,
  });

  final String id;
  final String label;
  final String type;
  final String status;
  final int scanCount;
  final String publicUrl;
  final String qrImageUrl;

  factory QrTag.fromJson(Map<String, dynamic> json) {
    return QrTag(
      id: json['id']?.toString() ?? '',
      label: json['label']?.toString() ?? 'QR tag',
      type: json['type']?.toString() ?? 'OTHER',
      status: json['status']?.toString() ?? 'ACTIVE',
      scanCount: (json['scanCount'] as num?)?.toInt() ?? 0,
      publicUrl: json['publicUrl']?.toString() ?? '',
      qrImageUrl: json['qrImageUrl']?.toString() ?? '',
    );
  }
}

class ContactRequestSummary {
  const ContactRequestSummary({
    required this.id,
    required this.reason,
    required this.tagLabel,
    required this.scannerMessage,
    required this.createdAt,
    required this.updatedAt,
    required this.isUnread,
    required this.status,
    this.scannerName,
  });

  final String id;
  final String reason;
  final String tagLabel;
  final String scannerMessage;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isUnread;
  final String status;
  final String? scannerName;

  factory ContactRequestSummary.fromJson(Map<String, dynamic> json) {
    return ContactRequestSummary(
      id: json['id']?.toString() ?? '',
      reason: json['reason']?.toString() ?? 'OTHER',
      tagLabel: json['tagLabel']?.toString() ?? 'QR tag',
      scannerMessage: json['scannerMessage']?.toString() ?? '',
      createdAt:
          DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
      updatedAt:
          DateTime.tryParse(json['updatedAt']?.toString() ?? '') ??
          DateTime.now(),
      isUnread: json['isUnread'] == true,
      status: json['status']?.toString() ?? 'open',
      scannerName: json['scannerName']?.toString(),
    );
  }
}

class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.senderType,
    required this.message,
    required this.createdAt,
    required this.status,
  });

  final String id;
  final String senderType;
  final String message;
  final DateTime createdAt;
  final String status;

  bool get isOwner => senderType == 'owner';

  ChatMessage copyWith({
    String? id,
    String? senderType,
    String? message,
    DateTime? createdAt,
    String? status,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      senderType: senderType ?? this.senderType,
      message: message ?? this.message,
      createdAt: createdAt ?? this.createdAt,
      status: status ?? this.status,
    );
  }

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id']?.toString() ?? '',
      senderType: json['senderType']?.toString() ?? 'scanner',
      message: json['message']?.toString() ?? '',
      createdAt:
          DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
      status: json['status']?.toString() ?? 'sent',
    );
  }
}

class OwnerNotification {
  const OwnerNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.createdAt,
    required this.isRead,
    this.actionType,
    this.actionId,
  });

  final String id;
  final String type;
  final String title;
  final String body;
  final DateTime createdAt;
  final bool isRead;
  final String? actionType;
  final String? actionId;

  factory OwnerNotification.fromJson(Map<String, dynamic> json) {
    return OwnerNotification(
      id: json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? 'security',
      title: json['title']?.toString() ?? 'Alert',
      body: json['body']?.toString() ?? '',
      createdAt:
          DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
      isRead: json['isRead'] == true,
      actionType: json['actionType']?.toString(),
      actionId: json['actionId']?.toString(),
    );
  }
}

class Product {
  const Product({
    required this.id,
    required this.name,
    required this.description,
    required this.priceBdt,
    this.estimatedDeliveryNote,
  });

  final String id;
  final String name;
  final String description;
  final int priceBdt;
  final String? estimatedDeliveryNote;

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'QR product',
      description: json['description']?.toString() ?? '',
      priceBdt: (json['priceBdt'] as num?)?.toInt() ?? 0,
      estimatedDeliveryNote: json['estimatedDeliveryNote']?.toString(),
    );
  }
}

class OwnerOrder {
  const OwnerOrder({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.codStatus,
    required this.productName,
    required this.priceBdt,
    required this.createdAt,
  });

  final String id;
  final String orderNumber;
  final String status;
  final String codStatus;
  final String productName;
  final int priceBdt;
  final DateTime createdAt;

  factory OwnerOrder.fromJson(Map<String, dynamic> json) {
    return OwnerOrder(
      id: json['id']?.toString() ?? '',
      orderNumber: json['orderNumber']?.toString() ?? '',
      status: json['status']?.toString() ?? 'created',
      codStatus: json['codStatus']?.toString() ?? 'cod_pending',
      productName: json['productName']?.toString() ?? 'QR product',
      priceBdt: (json['priceBdt'] as num?)?.toInt() ?? 0,
      createdAt:
          DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}
