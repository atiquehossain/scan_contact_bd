-- Track reseller inventory allocations as first-class batches instead of relying on loose text batch codes.

CREATE TYPE "ResellerBatchStatus" AS ENUM ('ACTIVE', 'CLOSED', 'CANCELLED');

CREATE TABLE "ResellerBatch" (
  "id" TEXT NOT NULL,
  "batchCode" TEXT NOT NULL,
  "resellerId" TEXT NOT NULL,
  "createdById" TEXT,
  "status" "ResellerBatchStatus" NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "ResellerBatch_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "QrTag" ADD COLUMN "resellerBatchId" TEXT;

CREATE UNIQUE INDEX "ResellerBatch_batchCode_key" ON "ResellerBatch"("batchCode");
CREATE INDEX "ResellerBatch_resellerId_status_idx" ON "ResellerBatch"("resellerId", "status");
CREATE INDEX "ResellerBatch_createdAt_idx" ON "ResellerBatch"("createdAt");
CREATE INDEX "QrTag_resellerBatchId_idx" ON "QrTag"("resellerBatchId");

ALTER TABLE "ResellerBatch"
  ADD CONSTRAINT "ResellerBatch_resellerId_fkey"
  FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ResellerBatch"
  ADD CONSTRAINT "ResellerBatch_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QrTag"
  ADD CONSTRAINT "QrTag_resellerBatchId_fkey"
  FOREIGN KEY ("resellerBatchId") REFERENCES "ResellerBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "ResellerBatch" ("id", "batchCode", "resellerId", "status", "assignedAt", "createdAt", "updatedAt")
SELECT
  'rb_' || substr(md5("resellerId" || ':' || "batchCode"), 1, 22),
  "batchCode",
  "resellerId",
  'ACTIVE'::"ResellerBatchStatus",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "QrTag"
WHERE "resellerId" IS NOT NULL
  AND "batchCode" IS NOT NULL
  AND "deletedAt" IS NULL
GROUP BY "resellerId", "batchCode"
ON CONFLICT ("batchCode") DO NOTHING;

UPDATE "QrTag" AS tag
SET "resellerBatchId" = batch."id"
FROM "ResellerBatch" AS batch
WHERE tag."resellerId" = batch."resellerId"
  AND tag."batchCode" = batch."batchCode"
  AND tag."resellerBatchId" IS NULL;
