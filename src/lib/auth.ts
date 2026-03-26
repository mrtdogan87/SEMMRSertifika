import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionSecret } from "@/lib/config";
import { authenticateAdminUser } from "@/lib/admin-user";

const SESSION_COOKIE = "seltifika_session";

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function parseCookie(value: string | null) {
  if (!value) {
    return null;
  }

  const [userId, signature] = value.split(".");
  if (!userId || !signature) {
    return null;
  }

  const expected = sign(userId);
  if (expected.length !== signature.length) {
    return null;
  }

  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature)) ? userId : null;
}

export async function authenticateAdmin(email: string, password: string) {
  return authenticateAdminUser(email, password);
}

export async function setAdminSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, `${userId}.${sign(userId)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const userId = parseCookie(cookieStore.get(SESSION_COOKIE)?.value ?? null);
  if (!userId) {
    return null;
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
  });

  return user?.isActive ? user : null;
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/login");
  }

  return admin;
}

export async function assertAdminApiAccess() {
  return Boolean(await getCurrentAdmin());
}
