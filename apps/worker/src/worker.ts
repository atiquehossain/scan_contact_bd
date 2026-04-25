import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

async function tick() {
  const unreadNotifications = await prisma.notification.count({ where: { readAt: null, deletedAt: null } });
  await prisma.setting.upsert({
    where: { key: "worker_heartbeat" },
    update: { value: { at: new Date().toISOString(), unreadNotifications } },
    create: { key: "worker_heartbeat", value: { at: new Date().toISOString(), unreadNotifications } }
  });
  console.info(`[worker] heartbeat unreadNotifications=${unreadNotifications}`);
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
