import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { assetFormSchema, generateInternalAssetNumber, historyValue, isAssetStatus, toAssetData } from "@/lib/assets";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const include = {
  category: true,
  locationRef: true,
  currentUser: { select: { id: true, name: true, email: true } },
  photoFile: true,
  photos: {
    include: { file: true },
    orderBy: { createdAt: "desc" as const }
  }
};

export async function GET(request: Request) {
  await requireUser();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status")?.trim();
  const categoryId = searchParams.get("categoryId")?.trim();
  const userId = searchParams.get("userId")?.trim();
  const where: Prisma.AssetWhereInput = {};

  if (status && isAssetStatus(status)) where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (userId) where.currentUserId = userId;
  if (q) {
    where.OR = [
      { internalNumber: { contains: q } },
      { customNumber: { contains: q } },
      { vendorAssetNumber: { contains: q } },
      { model: { contains: q } },
      { serialNumber: { contains: q } },
      { location: { contains: q } }
    ];
  }

  const assets = await prisma.asset.findMany({
    where,
    include,
    orderBy: { updatedAt: "desc" },
    take: 100
  });

  return NextResponse.json({ assets });
}

export async function POST(request: Request) {
  const user = await requireUser();
  const parsed = assetFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const asset = await prisma.$transaction(async (tx) => {
      const internalNumber = await generateInternalAssetNumber(tx);
      const created = await tx.asset.create({
        data: {
          internalNumber,
          ...toAssetData(parsed.data),
          history: {
            create: {
              userId: user.id,
              changeType: "created",
              after: historyValue(parsed.data)
            }
          }
        },
        include
      });
      return created;
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Custom asset number must be unique" }, { status: 409 });
    }
    throw error;
  }
}
