import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  await requireAdmin();
  const body = await request.json();
  const name = String(body.name || "").trim();
  const icon = String(body.icon || "Package").trim();
  const color = String(body.color || "#0f766e").trim();

  if (!name) {
    return NextResponse.json({ error: "Category name is required" }, { status: 400 });
  }

  try {
    const category = await prisma.category.create({
      data: { name, icon, color }
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Category name already exists" }, { status: 409 });
    }
    throw error;
  }
}
