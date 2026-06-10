import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const body = await request.json();
  const name = String(body.name || "").trim();
  const contact = String(body.contact || "").trim();
  const email = String(body.email || "").trim().toLowerCase();

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { name, contact: contact || null, email },
      select: { id: true, name: true, contact: true, email: true, role: true }
    });
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    throw error;
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;

  if (admin.id === id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 409 });
  }

  const usage = await prisma.asset.count({ where: { currentUserId: id } });
  if (usage > 0) {
    return NextResponse.json({ error: "User is assigned to assets" }, { status: 409 });
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    throw error;
  }
}
