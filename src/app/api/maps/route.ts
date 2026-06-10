import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireUser();
  const maps = await prisma.floorMap.findMany({
    include: { site: true, imageFile: true },
    orderBy: [{ site: { name: "asc" } }, { name: "asc" }]
  });
  return NextResponse.json({ maps });
}

export async function POST(request: Request) {
  await requireAdmin();
  const body = await request.json();
  const siteName = String(body.siteName || "").trim();
  const name = String(body.name || "").trim();
  if (!siteName || !name) {
    return NextResponse.json({ error: "Site and map name are required" }, { status: 400 });
  }

  try {
    const map = await prisma.floorMap.create({
      data: {
        name,
        site: {
          connectOrCreate: {
            where: { name: siteName },
            create: { name: siteName }
          }
        }
      },
      include: { site: true, imageFile: true }
    });

    return NextResponse.json({ map }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A map with this site and name already exists." }, { status: 409 });
    }
    throw error;
  }
}
