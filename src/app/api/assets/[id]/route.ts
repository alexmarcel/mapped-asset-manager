import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { assetFormSchema, historyValue, toAssetData } from "@/lib/assets";
import { requireAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const include = {
  category: true,
  locationRef: true,
  currentUser: { select: { id: true, name: true, email: true } },
  photoFile: true,
  photos: {
    include: { file: true },
    orderBy: { createdAt: "desc" as const }
  },
  history: {
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" as const },
    take: 10
  },
  _count: {
    select: { history: true }
  }
};

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const asset = await prisma.asset.findUnique({ where: { id }, include });
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  return NextResponse.json({ asset });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const parsed = assetFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const before = await prisma.asset.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  try {
    const asset = await prisma.asset.update({
      where: { id },
      data: {
        ...toAssetData(parsed.data),
        history: {
          create: {
            userId: user.id,
            changeType: "updated",
            before: historyValue(before),
            after: historyValue(parsed.data)
          }
        }
      },
      include
    });
    return NextResponse.json({ asset });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Custom asset number must be unique" }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const asset = await prisma.asset.findUnique({ where: { id }, select: { id: true } });
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.assetHistory.deleteMany({ where: { assetId: id } });
    await tx.assetMapPlacement.deleteMany({ where: { assetId: id } });
    await tx.assetPhoto.deleteMany({ where: { assetId: id } });
    await tx.asset.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true });
}
