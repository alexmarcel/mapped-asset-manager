import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  await requireAdmin();
  const body = await request.json();
  const name = String(body.name || "").trim();

  if (!name) {
    return NextResponse.json({ error: "Location name is required" }, { status: 400 });
  }

  try {
    const location = await prisma.location.create({ data: { name } });
    return NextResponse.json({ location }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Location name already exists" }, { status: 409 });
    }
    throw error;
  }
}
