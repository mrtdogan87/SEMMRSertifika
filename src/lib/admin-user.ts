import { createHash, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getBootstrapAdmin } from "@/lib/config";

export function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export async function ensureBootstrapAdmin() {
  const config = getBootstrapAdmin();
  if (!config.email || !config.password) {
    return null;
  }

  const existing = await prisma.adminUser.findUnique({
    where: { email: config.email },
  });

  if (existing) {
    return existing;
  }

  return prisma.adminUser.create({
    data: {
      email: config.email,
      passwordHash: hashPassword(config.password),
      isActive: true,
    },
  });
}

export async function authenticateAdminUser(email: string, password: string) {
  await ensureBootstrapAdmin();

  const user = await prisma.adminUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const incomingHash = hashPassword(password);
  if (incomingHash.length !== user.passwordHash.length) {
    return null;
  }

  return timingSafeEqual(Buffer.from(incomingHash), Buffer.from(user.passwordHash)) ? user : null;
}
