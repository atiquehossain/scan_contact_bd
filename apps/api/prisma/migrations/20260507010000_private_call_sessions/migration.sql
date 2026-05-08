-- CreateEnum
CREATE TYPE "CallSessionStatus" AS ENUM ('RINGING', 'ACCEPTED', 'DECLINED', 'ENDED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "CallSignalSender" AS ENUM ('SCANNER', 'OWNER');

-- CreateTable
CREATE TABLE "CallSession" (
    "id" TEXT NOT NULL,
    "qrTagId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "scannerTokenHash" TEXT NOT NULL,
    "scannerName" TEXT,
    "status" "CallSessionStatus" NOT NULL DEFAULT 'RINGING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CallSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallSignal" (
    "id" TEXT NOT NULL,
    "callSessionId" TEXT NOT NULL,
    "sender" "CallSignalSender" NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CallSession_scannerTokenHash_key" ON "CallSession"("scannerTokenHash");

-- CreateIndex
CREATE INDEX "CallSession_ownerId_status_createdAt_idx" ON "CallSession"("ownerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "CallSession_qrTagId_createdAt_idx" ON "CallSession"("qrTagId", "createdAt");

-- CreateIndex
CREATE INDEX "CallSession_expiresAt_idx" ON "CallSession"("expiresAt");

-- CreateIndex
CREATE INDEX "CallSignal_callSessionId_createdAt_idx" ON "CallSignal"("callSessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "CallSession" ADD CONSTRAINT "CallSession_qrTagId_fkey" FOREIGN KEY ("qrTagId") REFERENCES "QrTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallSession" ADD CONSTRAINT "CallSession_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallSignal" ADD CONSTRAINT "CallSignal_callSessionId_fkey" FOREIGN KEY ("callSessionId") REFERENCES "CallSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
