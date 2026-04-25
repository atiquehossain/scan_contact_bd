-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'BN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'LOCKED', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('LOGIN', 'REGISTER', 'PIN_RESET');

-- CreateEnum
CREATE TYPE "OtpStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'LOCKED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('SUPER_ADMIN', 'SUPPORT_ADMIN', 'ORDER_MANAGER', 'RESELLER_MANAGER', 'SOCIETY_MANAGER', 'FINANCE_MANAGER', 'CONTENT_MANAGER', 'USER', 'RESELLER', 'SOCIETY_ADMIN', 'GUARD', 'RESIDENT');

-- CreateEnum
CREATE TYPE "QrTagType" AS ENUM ('CAR', 'MOTORBIKE', 'DELIVERY_BIKE', 'LOST_ITEM', 'BUSINESS_CARD', 'APARTMENT_PARKING', 'SHOP', 'OTHER');

-- CreateEnum
CREATE TYPE "QrTagStatus" AS ENUM ('DRAFT', 'PENDING_ACTIVATION', 'ACTIVE', 'DISABLED', 'LOST', 'TRANSFERRED', 'DELETED');

-- CreateEnum
CREATE TYPE "PrivacyMode" AS ENUM ('PRIVATE_CONTACT_ONLY', 'SHOW_NAME_ONLY', 'SHOW_BUSINESS_INFO', 'PHONE_VISIBLE_BY_OWNER_CHOICE');

-- CreateEnum
CREATE TYPE "ContactReason" AS ENUM ('VEHICLE_BLOCKING', 'LIGHT_ON', 'VEHICLE_DAMAGED', 'FOUND_ITEM', 'DELIVERY_CONTACT', 'BUSINESS_INQUIRY', 'OTHER');

-- CreateEnum
CREATE TYPE "ContactRequestStatus" AS ENUM ('UNREAD', 'READ', 'DELETED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('QR_SCANNED', 'CONTACT_REQUEST', 'ABUSE_REPORT', 'ORDER_CREATED', 'ORDER_UPDATED', 'PAYMENT_STATUS_CHANGED', 'RESELLER_COMMISSION', 'SOCIETY_VISITOR_ENTRY', 'SOCIETY_VISITOR_EXIT', 'ACCOUNT_SECURITY');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('CAR_STICKER', 'BIKE_STICKER', 'DELIVERY_RIDER_STICKER', 'LOST_AND_FOUND_STICKER', 'APARTMENT_PARKING_QR', 'BUSINESS_QR_CARD', 'NFC_CARD');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PAID', 'PROCESSING', 'PRINTED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'COD_PENDING', 'COD_COLLECTED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'BKASH', 'NAGAD', 'ROCKET', 'SSLCOMMERZ', 'MANUAL');

-- CreateEnum
CREATE TYPE "ResellerStatus" AS ENUM ('APPLIED', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('REQUESTED', 'APPROVED', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "SocietyMemberRole" AS ENUM ('SOCIETY_ADMIN', 'GUARD', 'RESIDENT');

-- CreateEnum
CREATE TYPE "VisitorStatus" AS ENUM ('ENTERED', 'EXITED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AbuseReportStatus" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "CmsStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FileVisibility" AS ENUM ('PRIVATE', 'SIGNED_ONLY', 'PUBLIC');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "fullName" TEXT,
    "passwordHash" TEXT,
    "pinHash" TEXT,
    "language" "Language" NOT NULL DEFAULT 'EN',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "phoneVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "city" TEXT,
    "district" TEXT,
    "address" TEXT,
    "photoFileId" TEXT,
    "notificationSettings" JSONB NOT NULL DEFAULT '{}',
    "privacySettings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthOtp" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "phone" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL DEFAULT 'LOGIN',
    "otpHash" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "messageId" TEXT,
    "requestIp" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "OtpStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'noop',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" "RoleName" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QrTag" (
    "id" TEXT NOT NULL,
    "publicSlug" TEXT NOT NULL,
    "ownerId" TEXT,
    "createdById" TEXT,
    "resellerId" TEXT,
    "societyId" TEXT,
    "type" "QrTagType" NOT NULL,
    "label" TEXT NOT NULL,
    "vehicleNumber" TEXT,
    "itemName" TEXT,
    "status" "QrTagStatus" NOT NULL DEFAULT 'ACTIVE',
    "privacyMode" "PrivacyMode" NOT NULL DEFAULT 'PRIVATE_CONTACT_ONLY',
    "activationCode" TEXT,
    "batchCode" TEXT,
    "businessProfile" JSONB NOT NULL DEFAULT '{}',
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    "lastScannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "QrTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagContactSetting" (
    "id" TEXT NOT NULL,
    "qrTagId" TEXT NOT NULL,
    "allowContactForm" BOOLEAN NOT NULL DEFAULT true,
    "allowWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "allowSms" BOOLEAN NOT NULL DEFAULT false,
    "phoneVisible" BOOLEAN NOT NULL DEFAULT false,
    "showName" BOOLEAN NOT NULL DEFAULT false,
    "showEmergency" BOOLEAN NOT NULL DEFAULT false,
    "whatsappPhone" TEXT,
    "smsPhone" TEXT,
    "quietHours" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TagContactSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanEvent" (
    "id" TEXT NOT NULL,
    "qrTagId" TEXT NOT NULL,
    "ipHash" TEXT,
    "userAgentHash" TEXT,
    "referrer" TEXT,
    "country" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactRequest" (
    "id" TEXT NOT NULL,
    "qrTagId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "reason" "ContactReason" NOT NULL,
    "message" TEXT NOT NULL,
    "scannerName" TEXT,
    "scannerContact" TEXT,
    "scannerIpHash" TEXT,
    "status" "ContactRequestStatus" NOT NULL DEFAULT 'UNREAD',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ContactRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relation" TEXT,
    "visibleOnPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "ProductType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceBdt" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "priceBdt" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productVariantId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceBdt" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT,
    "resellerId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'COD_PENDING',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'COD',
    "subtotalBdt" INTEGER NOT NULL,
    "deliveryFeeBdt" INTEGER NOT NULL DEFAULT 80,
    "totalBdt" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "deliveryCity" TEXT,
    "deliveryDistrict" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productVariantId" TEXT,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceBdt" INTEGER NOT NULL,
    "totalBdt" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amountBdt" INTEGER NOT NULL,
    "providerRef" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "courierName" TEXT,
    "trackingNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reseller" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "status" "ResellerStatus" NOT NULL DEFAULT 'APPLIED',
    "territoryCity" TEXT,
    "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 10.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Reseller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResellerCustomer" (
    "id" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ResellerCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResellerCommission" (
    "id" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "orderId" TEXT,
    "amountBdt" INTEGER NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ResellerCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "amountBdt" INTEGER NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'REQUESTED',
    "payoutMethod" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Society" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "district" TEXT,
    "emergencyPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Society_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocietyMember" (
    "id" TEXT NOT NULL,
    "societyId" TEXT NOT NULL,
    "userId" TEXT,
    "unitId" TEXT,
    "role" "SocietyMemberRole" NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SocietyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocietyUnit" (
    "id" TEXT NOT NULL,
    "societyId" TEXT NOT NULL,
    "building" TEXT,
    "floor" TEXT,
    "unitNo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SocietyUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocietyVehicle" (
    "id" TEXT NOT NULL,
    "societyId" TEXT NOT NULL,
    "memberId" TEXT,
    "unitId" TEXT,
    "qrTagId" TEXT,
    "vehicleNumber" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SocietyVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParkingSlot" (
    "id" TEXT NOT NULL,
    "societyId" TEXT NOT NULL,
    "qrTagId" TEXT,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ParkingSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorLog" (
    "id" TEXT NOT NULL,
    "societyId" TEXT NOT NULL,
    "unitId" TEXT,
    "visitorName" TEXT NOT NULL,
    "visitorPhone" TEXT,
    "vehicleNumber" TEXT,
    "purpose" TEXT,
    "status" "VisitorStatus" NOT NULL DEFAULT 'ENTERED',
    "enteredByUserId" TEXT,
    "exitedByUserId" TEXT,
    "entryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "VisitorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbuseReport" (
    "id" TEXT NOT NULL,
    "qrTagId" TEXT,
    "contactRequestId" TEXT,
    "reporterContact" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "AbuseReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AbuseReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "ipAddress" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "locale" "Language" NOT NULL DEFAULT 'EN',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "CmsStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CmsPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataDeletionRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DataDeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileUpload" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "bucket" TEXT,
    "objectKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "visibility" "FileVisibility" NOT NULL DEFAULT 'PRIVATE',
    "malwareStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FileUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "location" TEXT,
    "message" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "division" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "districtId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "AuthOtp_phone_purpose_status_idx" ON "AuthOtp"("phone", "purpose", "status");

-- CreateIndex
CREATE INDEX "AuthOtp_expiresAt_idx" ON "AuthOtp"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshTokenHash_key" ON "Session"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_status_idx" ON "Session"("userId", "status");

-- CreateIndex
CREATE INDEX "Session_familyId_idx" ON "Session"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_token_key" ON "DeviceToken"("token");

-- CreateIndex
CREATE INDEX "DeviceToken_userId_enabled_idx" ON "DeviceToken"("userId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "QrTag_publicSlug_key" ON "QrTag"("publicSlug");

-- CreateIndex
CREATE INDEX "QrTag_ownerId_status_idx" ON "QrTag"("ownerId", "status");

-- CreateIndex
CREATE INDEX "QrTag_publicSlug_idx" ON "QrTag"("publicSlug");

-- CreateIndex
CREATE INDEX "QrTag_batchCode_idx" ON "QrTag"("batchCode");

-- CreateIndex
CREATE UNIQUE INDEX "TagContactSetting_qrTagId_key" ON "TagContactSetting"("qrTagId");

-- CreateIndex
CREATE INDEX "ScanEvent_qrTagId_createdAt_idx" ON "ScanEvent"("qrTagId", "createdAt");

-- CreateIndex
CREATE INDEX "ContactRequest_ownerId_status_idx" ON "ContactRequest"("ownerId", "status");

-- CreateIndex
CREATE INDEX "ContactRequest_qrTagId_createdAt_idx" ON "ContactRequest"("qrTagId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "EmergencyContact_userId_idx" ON "EmergencyContact"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_type_active_idx" ON "Product"("type", "active");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_productVariantId_key" ON "CartItem"("cartId", "productId", "productVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_userId_status_idx" ON "Order"("userId", "status");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_provider_status_idx" ON "Payment"("provider", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Reseller_userId_key" ON "Reseller"("userId");

-- CreateIndex
CREATE INDEX "Reseller_status_territoryCity_idx" ON "Reseller"("status", "territoryCity");

-- CreateIndex
CREATE INDEX "ResellerCustomer_resellerId_idx" ON "ResellerCustomer"("resellerId");

-- CreateIndex
CREATE INDEX "ResellerCommission_resellerId_status_idx" ON "ResellerCommission"("resellerId", "status");

-- CreateIndex
CREATE INDEX "Society_city_district_idx" ON "Society"("city", "district");

-- CreateIndex
CREATE INDEX "SocietyMember_societyId_role_idx" ON "SocietyMember"("societyId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "SocietyUnit_societyId_unitNo_key" ON "SocietyUnit"("societyId", "unitNo");

-- CreateIndex
CREATE INDEX "SocietyVehicle_societyId_vehicleNumber_idx" ON "SocietyVehicle"("societyId", "vehicleNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ParkingSlot_societyId_label_key" ON "ParkingSlot"("societyId", "label");

-- CreateIndex
CREATE INDEX "VisitorLog_societyId_status_entryAt_idx" ON "VisitorLog"("societyId", "status", "entryAt");

-- CreateIndex
CREATE INDEX "AbuseReport_status_createdAt_idx" ON "AbuseReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "CmsPage_status_idx" ON "CmsPage"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CmsPage_slug_locale_key" ON "CmsPage"("slug", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE INDEX "ConsentLog_userId_consentType_idx" ON "ConsentLog"("userId", "consentType");

-- CreateIndex
CREATE INDEX "DataDeletionRequest_userId_status_idx" ON "DataDeletionRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "FileUpload_userId_visibility_idx" ON "FileUpload"("userId", "visibility");

-- CreateIndex
CREATE UNIQUE INDEX "District_name_key" ON "District"("name");

-- CreateIndex
CREATE UNIQUE INDEX "City_name_key" ON "City"("name");

-- CreateIndex
CREATE INDEX "City_districtId_idx" ON "City"("districtId");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthOtp" ADD CONSTRAINT "AuthOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrTag" ADD CONSTRAINT "QrTag_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrTag" ADD CONSTRAINT "QrTag_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrTag" ADD CONSTRAINT "QrTag_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrTag" ADD CONSTRAINT "QrTag_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "Society"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagContactSetting" ADD CONSTRAINT "TagContactSetting_qrTagId_fkey" FOREIGN KEY ("qrTagId") REFERENCES "QrTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_qrTagId_fkey" FOREIGN KEY ("qrTagId") REFERENCES "QrTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_qrTagId_fkey" FOREIGN KEY ("qrTagId") REFERENCES "QrTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reseller" ADD CONSTRAINT "Reseller_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResellerCustomer" ADD CONSTRAINT "ResellerCustomer_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResellerCustomer" ADD CONSTRAINT "ResellerCustomer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResellerCommission" ADD CONSTRAINT "ResellerCommission_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResellerCommission" ADD CONSTRAINT "ResellerCommission_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocietyMember" ADD CONSTRAINT "SocietyMember_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "Society"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocietyMember" ADD CONSTRAINT "SocietyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocietyMember" ADD CONSTRAINT "SocietyMember_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "SocietyUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocietyUnit" ADD CONSTRAINT "SocietyUnit_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "Society"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocietyVehicle" ADD CONSTRAINT "SocietyVehicle_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "Society"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocietyVehicle" ADD CONSTRAINT "SocietyVehicle_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "SocietyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocietyVehicle" ADD CONSTRAINT "SocietyVehicle_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "SocietyUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocietyVehicle" ADD CONSTRAINT "SocietyVehicle_qrTagId_fkey" FOREIGN KEY ("qrTagId") REFERENCES "QrTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParkingSlot" ADD CONSTRAINT "ParkingSlot_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "Society"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParkingSlot" ADD CONSTRAINT "ParkingSlot_qrTagId_fkey" FOREIGN KEY ("qrTagId") REFERENCES "QrTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorLog" ADD CONSTRAINT "VisitorLog_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "Society"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorLog" ADD CONSTRAINT "VisitorLog_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "SocietyUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorLog" ADD CONSTRAINT "VisitorLog_enteredByUserId_fkey" FOREIGN KEY ("enteredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorLog" ADD CONSTRAINT "VisitorLog_exitedByUserId_fkey" FOREIGN KEY ("exitedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbuseReport" ADD CONSTRAINT "AbuseReport_qrTagId_fkey" FOREIGN KEY ("qrTagId") REFERENCES "QrTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentLog" ADD CONSTRAINT "ConsentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataDeletionRequest" ADD CONSTRAINT "DataDeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
