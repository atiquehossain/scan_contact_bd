import dotenv from "dotenv";
import { CallSessionStatus, ContactReason, ContactRequestStatus, PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();
let lastConversationCleanupAt = 0;
let lastCallCleanupAt = 0;

async function runConversationCleanup() {
  const expiredRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    UPDATE "ContactRequest"
    SET
      "status" = 'EXPIRED'::"ContactRequestStatus",
      "expiredAt" = COALESCE("expiredAt", "expiresAt", NOW()),
      "deleteAt" = COALESCE("deleteAt", COALESCE("expiredAt", "expiresAt", NOW()) + INTERVAL '10 days')
    WHERE "status" = 'OPEN'::"ContactRequestStatus"
      AND "expiresAt" IS NOT NULL
      AND "expiresAt" < NOW()
      AND "deletedAt" IS NULL
    RETURNING 1
  `;
  const oldRequests = await prisma.contactRequest.findMany({
    where: {
      status: { in: [ContactRequestStatus.EXPIRED, ContactRequestStatus.CLOSED] },
      deleteAt: { lte: new Date() },
      deletedAt: null
    },
    select: { id: true }
  });
  const ids = oldRequests.map((request) => request.id);
  if (ids.length) {
    await prisma.$transaction([
      prisma.contactMessage.updateMany({
        where: { contactRequestId: { in: ids } },
        data: { body: "", senderName: null, senderIpHash: null, deletedAt: new Date() }
      }),
      ...ids.map((id) =>
        prisma.notification.updateMany({
          where: { data: { path: ["contactRequestId"], equals: id } },
          data: { deletedAt: new Date() }
        })
      ),
      prisma.contactRequest.updateMany({
        where: { id: { in: ids } },
        data: {
          status: ContactRequestStatus.DELETED,
          scannerName: null,
          scannerContact: null,
          scannerIpHash: null,
          replyTokenHash: null,
          reason: ContactReason.OTHER,
          message: "",
          deletedAt: new Date()
        }
      })
    ]);
  }
  return { expiredCount: expiredRows.length, anonymizedCount: ids.length };
}

async function runCallCleanup() {
  const now = new Date();
  const expiredCalls = await prisma.callSession.updateMany({
    where: {
      status: { in: [CallSessionStatus.RINGING, CallSessionStatus.ACCEPTED] },
      expiresAt: { lt: now },
      deletedAt: null
    },
    data: {
      status: CallSessionStatus.EXPIRED,
      endedAt: now
    }
  });

  const retentionCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const staleCalls = await prisma.callSession.findMany({
    where: {
      OR: [
        { status: { in: [CallSessionStatus.DECLINED, CallSessionStatus.ENDED, CallSessionStatus.EXPIRED] }, updatedAt: { lt: retentionCutoff } },
        { expiresAt: { lt: retentionCutoff } }
      ]
    },
    select: { id: true }
  });
  const ids = staleCalls.map((call) => call.id);
  if (ids.length) {
    await prisma.callSession.deleteMany({ where: { id: { in: ids } } });
  }

  return { expiredCount: expiredCalls.count, deletedCount: ids.length };
}

async function tick() {
  const unreadNotifications = await prisma.notification.count({ where: { readAt: null, deletedAt: null } });
  const now = Date.now();
  let retention = { expiredCount: 0, anonymizedCount: 0 };
  let callRetention = { expiredCount: 0, deletedCount: 0 };
  if (now - lastConversationCleanupAt > 60 * 60 * 1000) {
    retention = await runConversationCleanup();
    lastConversationCleanupAt = now;
  }
  if (now - lastCallCleanupAt > 60 * 60 * 1000) {
    callRetention = await runCallCleanup();
    lastCallCleanupAt = now;
  }
  await prisma.setting.upsert({
    where: { key: "worker_heartbeat" },
    update: { value: { at: new Date().toISOString(), unreadNotifications, conversationRetention: retention, callRetention } },
    create: { key: "worker_heartbeat", value: { at: new Date().toISOString(), unreadNotifications, conversationRetention: retention, callRetention } }
  });
  console.info(
    `[worker] heartbeat unreadNotifications=${unreadNotifications} expiredConversations=${retention.expiredCount} anonymizedConversations=${retention.anonymizedCount} expiredCalls=${callRetention.expiredCount} deletedCalls=${callRetention.deletedCount}`
  );
}

async function main() {
  await tick();
  setInterval(() => {
    tick().catch((error) => console.error("[worker] tick failed", error));
  }, 60_000);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
