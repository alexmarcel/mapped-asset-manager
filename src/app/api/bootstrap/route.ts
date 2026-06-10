import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireUser();
  const [categories, users, sites, maps] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" }
    }),
    prisma.site.findMany({ orderBy: { name: "asc" } }),
    prisma.floorMap.findMany({
      include: { site: true, imageFile: true },
      orderBy: [{ site: { name: "asc" } }, { name: "asc" }]
    })
  ]);

  return NextResponse.json({ categories, users, sites, maps });
}
