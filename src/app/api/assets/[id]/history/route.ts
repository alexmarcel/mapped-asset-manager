import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const historyPageSize = 10;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const skip = Math.max(0, Number(searchParams.get("skip")) || 0);

  const [history, total] = await Promise.all([
    prisma.assetHistory.findMany({
      where: { assetId: id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: historyPageSize
    }),
    prisma.assetHistory.count({ where: { assetId: id } })
  ]);

  return NextResponse.json({ history, total });
}
