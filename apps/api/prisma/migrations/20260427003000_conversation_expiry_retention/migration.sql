CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "ContactRequest" ADD COLUMN IF NOT EXISTS "replyTokenHash" TEXT;
ALTER TABLE "ContactRequest" ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP(3);
ALTER TABLE "ContactRequest" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "ContactRequest" ADD COLUMN IF NOT EXISTS "expiredAt" TIMESTAMP(3);
ALTER TABLE "ContactRequest" ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3);
ALTER TABLE "ContactRequest" ADD COLUMN IF NOT EXISTS "deleteAt" TIMESTAMP(3);

UPDATE "ContactRequest"
SET "replyTokenHash" = encode(digest("replyToken", 'sha256'), 'hex')
WHERE "replyToken" IS NOT NULL
  AND "replyTokenHash" IS NULL;

UPDATE "ContactRequest"
SET "lastActivityAt" = COALESCE("lastActivityAt", "updatedAt", "createdAt"),
    "expiresAt" = COALESCE("expiresAt", COALESCE("updatedAt", "createdAt") + INTERVAL '30 minutes');

UPDATE "ContactRequest"
SET "expiredAt" = COALESCE("expiredAt", "expiresAt"),
    "deleteAt" = COALESCE("deleteAt", NOW() + INTERVAL '10 days')
WHERE "expiresAt" < NOW()
  AND "status" IN ('UNREAD', 'READ');

UPDATE "ContactRequest"
SET "closedAt" = COALESCE("closedAt", "updatedAt", NOW()),
    "deleteAt" = COALESCE("deleteAt", NOW() + INTERVAL '10 days')
WHERE "status" = 'BLOCKED';

DROP INDEX IF EXISTS "ContactRequest_replyToken_key";

ALTER TABLE "ContactRequest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "ContactRequestStatus" RENAME TO "ContactRequestStatus_old";
CREATE TYPE "ContactRequestStatus" AS ENUM ('OPEN', 'EXPIRED', 'CLOSED', 'DELETED');

ALTER TABLE "ContactRequest"
ALTER COLUMN "status" TYPE "ContactRequestStatus"
USING (
  CASE
    WHEN "status"::text = 'DELETED' THEN 'DELETED'
    WHEN "status"::text = 'BLOCKED' THEN 'CLOSED'
    WHEN "expiresAt" < NOW() THEN 'EXPIRED'
    ELSE 'OPEN'
  END
)::"ContactRequestStatus";

ALTER TABLE "ContactRequest" ALTER COLUMN "status" SET DEFAULT 'OPEN';
DROP TYPE "ContactRequestStatus_old";

ALTER TABLE "ContactRequest" DROP COLUMN IF EXISTS "replyToken";

CREATE UNIQUE INDEX IF NOT EXISTS "ContactRequest_replyTokenHash_key" ON "ContactRequest"("replyTokenHash");
CREATE INDEX IF NOT EXISTS "ContactRequest_expiresAt_idx" ON "ContactRequest"("expiresAt");
CREATE INDEX IF NOT EXISTS "ContactRequest_deleteAt_idx" ON "ContactRequest"("deleteAt");
