import dotenv from "dotenv";
import { prisma } from "../lib/prisma.js";
import { runConversationRetention } from "../lib/conversationRetention.js";

dotenv.config();

async function main() {
  const result = await runConversationRetention(prisma);
  console.info(
    `[conversation-retention] expired=${result.expiredCount} anonymized=${result.anonymizedCount}`
  );
}

main()
  .catch((error) => {
    console.error("[conversation-retention] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
