import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "mam_session";

function secret() {
  return process.env.SESSION_SECRET || "development-secret-change-me";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export async function createSession(userId: string) {
  const value = `${userId}.${Date.now()}`;
  const token = `${value}.${sign(value)}`;
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14,
    path: "/"
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const value = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(sign(value));
  const actual = Buffer.from(parts[2]);

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  return prisma.user.findFirst({
    where: { id: parts[0], active: true },
    select: { id: true, name: true, contact: true, email: true, role: true }
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Response("Forbidden", { status: 403 });
  }
  return user;
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}
