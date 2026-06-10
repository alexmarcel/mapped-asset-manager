import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { defaultCategories, defaultLocations, defaultSite } from "@/lib/defaults";
import { prisma } from "@/lib/prisma";

export async function POST() {
  await requireAdmin();

  await prisma.$transaction(async (tx) => {
    await tx.assetHistory.deleteMany();
    await tx.assetMapPlacement.deleteMany();
    await tx.assetPhoto.deleteMany();
    await tx.asset.deleteMany();
    await tx.floorMap.deleteMany();
    await tx.site.deleteMany();
    await tx.category.deleteMany();
    await tx.location.deleteMany();
    await tx.fileObject.deleteMany();
    await tx.user.deleteMany({ where: { role: { not: "ADMIN" } } });

    for (const category of defaultCategories) {
      await tx.category.create({ data: category });
    }

    for (const location of defaultLocations) {
      await tx.location.create({ data: location });
    }

    await tx.site.create({
      data: {
        name: defaultSite.name,
        maps: {
          create: {
            name: defaultSite.mapName,
            width: defaultSite.width,
            height: defaultSite.height
          }
        }
      }
    });
  });

  return NextResponse.json({ ok: true });
}
