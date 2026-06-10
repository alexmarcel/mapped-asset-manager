import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { requireUser, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const currentUser = await requireUser();
  const body = await request.json();
  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");
  const confirmPassword = String(body.confirmPassword || "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json({ error: "All password fields are required" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "New passwords do not match" }, { status: 400 });
  }

  if (currentPassword === newPassword) {
    return NextResponse.json({ error: "New password must be different from current password" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { id: true, passwordHash: true, active: true }
  });

  if (!user?.active || !(await verifyPassword(currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) }
  });

  return NextResponse.json({ ok: true });
}
