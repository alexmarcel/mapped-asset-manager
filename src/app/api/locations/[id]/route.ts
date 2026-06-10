import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const body = await request.json();
  const name = String(body.name || "").trim();

  if (!name) {
    return NextResponse.json({ error: "Location name is required" }, { status: 400 });
  }

  try {
    const location = await prisma.location.update({
      where: { id },
      data: { name }
    });
    return NextResponse.json({ location });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Location name already exists" }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }
    throw error;
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const usage = await prisma.asset.count({ where: { locationId: id } });

  if (usage > 0) {
    return NextResponse.json({ error: "Location is used by assets" }, { status: 409 });
  }

  try {
    await prisma.location.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }
    throw error;
  }
}
