import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const body = await request.json();
  const name = String(body.name || "").trim();
  const icon = String(body.icon || "Package").trim();
  const color = String(body.color || "#0f766e").trim();

  if (!name) {
    return NextResponse.json({ error: "Category name is required" }, { status: 400 });
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: { name, icon, color }
    });
    return NextResponse.json({ category });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Category name already exists" }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    throw error;
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const usage = await prisma.asset.count({ where: { categoryId: id } });

  if (usage > 0) {
    return NextResponse.json({ error: "Category is used by assets" }, { status: 409 });
  }

  try {
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    throw error;
  }
}
