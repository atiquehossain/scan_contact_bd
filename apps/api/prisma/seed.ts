import bcrypt from "bcryptjs";
import { Language, RoleName } from "@prisma/client";
import { prisma } from "../src/lib/prisma.js";
import { env } from "../src/lib/env.js";

async function ensureRole(name: RoleName) {
  return prisma.role.upsert({
    where: { name },
    update: {},
    create: { name, description: `${name} role` }
  });
}

async function giveRole(userId: string, name: RoleName) {
  const role = await ensureRole(name);
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    update: {},
    create: { userId, roleId: role.id }
  });
}

async function main() {
  for (const role of Object.values(RoleName)) {
    await ensureRole(role);
  }

  const adminPasswordHash = await bcrypt.hash(env.adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: env.adminEmail },
    update: {
      phone: env.adminPhone,
      email: env.adminEmail,
      passwordHash: adminPasswordHash,
      fullName: "Super Admin"
    },
    create: {
      phone: env.adminPhone,
      email: env.adminEmail,
      passwordHash: adminPasswordHash,
      fullName: "Super Admin",
      language: Language.EN,
      phoneVerifiedAt: new Date(),
      profile: { create: {} }
    }
  });
  await giveRole(admin.id, RoleName.SUPER_ADMIN);
  console.info("Seed completed with roles and one admin only. No demo/static business data was created.");
  console.info(`Admin email: ${env.adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
