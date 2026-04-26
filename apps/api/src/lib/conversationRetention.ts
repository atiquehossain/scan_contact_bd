import { ContactReason, ContactRequestStatus, PrismaClient } from "@prisma/client";

export type ConversationRetentionResult = {
  expiredCount: number;
  anonymizedCount: number;
};

export async function runConversationRetention(
  prisma: PrismaClient
): Promise<ConversationRetentionResult> {
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

  const rowsToAnonymize = await prisma.contactRequest.findMany({
    where: {
      status: { in: [ContactRequestStatus.EXPIRED, ContactRequestStatus.CLOSED] },
      deleteAt: { lte: new Date() },
      deletedAt: null
    },
    select: { id: true }
  });
  const ids = rowsToAnonymize.map((row) => row.id);
  if (ids.length) {
    await prisma.$transaction([
      prisma.contactMessage.updateMany({
        where: { contactRequestId: { in: ids } },
        data: {
          body: "",
          senderName: null,
          senderIpHash: null,
          deletedAt: new Date()
        }
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

  return {
    expiredCount: expiredRows.length,
    anonymizedCount: ids.length
  };
}
