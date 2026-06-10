import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_PASSWORD = "password12345";

export async function POST(request: Request) {
  await requireAdmin();
  const body = await request.json();
  const name = String(body.name || "").trim();
  const contact = String(body.contact || "").trim();
  const email = String(body.email || "").trim().toLowerCase();

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.create({
      data: {
        name,
        contact: contact || null,
        email,
        role: "STAFF",
        passwordHash: await bcrypt.hash(DEFAULT_PASSWORD, 10)
      },
      select: { id: true, name: true, contact: true, email: true, role: true }
    });

    return NextResponse.json({ user, defaultPassword: DEFAULT_PASSWORD }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    throw error;
  }
}
