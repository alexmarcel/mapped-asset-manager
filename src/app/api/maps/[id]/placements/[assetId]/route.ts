import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  const user = await requireUser();
  const { id, assetId } = await params;
  const body = await request.json();
  const x = Number(body.x);
  const y = Number(body.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return NextResponse.json({ error: "Valid x and y are required" }, { status: 400 });
  }

  const before = await prisma.assetMapPlacement.findUnique({
    where: { assetId_mapId: { assetId, mapId: id } },
    select: { x: true, y: true }
  });

  const placement = await prisma.assetMapPlacement.upsert({
    where: { assetId_mapId: { assetId, mapId: id } },
    create: { assetId, mapId: id, x, y },
    update: { x, y }
  });

  await prisma.assetHistory.create({
    data: {
      assetId,
      userId: user.id,
      changeType: "map_position_updated",
      before: before ? JSON.stringify({ mapId: id, x: before.x, y: before.y }) : null,
      after: JSON.stringify({ mapId: id, x, y })
    }
  });

  return NextResponse.json({ placement });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  const user = await requireUser();
  const { id, assetId } = await params;

  const placement = await prisma.assetMapPlacement.findUnique({
    where: { assetId_mapId: { assetId, mapId: id } },
    select: { x: true, y: true }
  });
  if (!placement) return NextResponse.json({ error: "Placement not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.assetMapPlacement.delete({
      where: { assetId_mapId: { assetId, mapId: id } }
    });
    await tx.assetHistory.create({
      data: {
        assetId,
        userId: user.id,
        changeType: "map_position_removed",
        before: JSON.stringify({ mapId: id, x: placement.x, y: placement.y })
      }
    });
  });

  return NextResponse.json({ ok: true });
}
