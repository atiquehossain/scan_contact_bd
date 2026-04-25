CREATE TYPE "ContactMessageSender" AS ENUM ('SCANNER', 'OWNER', 'SYSTEM');

ALTER TABLE "ContactRequest" ADD COLUMN "replyToken" TEXT;

CREATE UNIQUE INDEX "ContactRequest_replyToken_key" ON "ContactRequest"("replyToken");

CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "contactRequestId" TEXT NOT NULL,
    "sender" "ContactMessageSender" NOT NULL,
    "senderName" TEXT,
    "senderUserId" TEXT,
    "body" TEXT NOT NULL,
    "senderIpHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactMessage_contactRequestId_createdAt_idx" ON "ContactMessage"("contactRequestId", "createdAt");
CREATE INDEX "ContactMessage_senderUserId_idx" ON "ContactMessage"("senderUserId");

ALTER TABLE "ContactMessage"
ADD CONSTRAINT "ContactMessage_contactRequestId_fkey"
FOREIGN KEY ("contactRequestId") REFERENCES "ContactRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
