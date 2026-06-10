import { prisma } from "@/lib/prisma";

export async function getBootstrapData() {
  const [categories, locations, users, maps] = await Promise.all([
    prisma.category.findMany({
      include: { _count: { select: { assets: true } } },
      orderBy: { name: "asc" }
    }),
    prisma.location.findMany({
      include: { _count: { select: { assets: true } } },
      orderBy: { name: "asc" }
    }),
    prisma.user.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        contact: true,
        email: true,
        role: true,
        _count: { select: { assigned: true } }
      },
      orderBy: { name: "asc" }
    }),
    prisma.floorMap.findMany({
      include: { site: true, imageFile: true },
      orderBy: [{ site: { name: "asc" } }, { name: "asc" }]
    })
  ]);

  return { categories, locations, users, maps };
}
