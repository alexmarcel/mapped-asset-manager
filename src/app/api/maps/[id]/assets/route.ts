import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const placements = await prisma.assetMapPlacement.findMany({
    where: { mapId: id },
    include: {
      asset: {
        include: {
          category: true,
          locationRef: true,
          currentUser: { select: { name: true } }
        }
      }
    }
  });
  return NextResponse.json({ placements });
}
