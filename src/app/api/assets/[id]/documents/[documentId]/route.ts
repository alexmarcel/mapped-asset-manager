import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const assetInclude = {
  category: true,
  locationRef: true,
  currentUser: { select: { id: true, name: true, email: true } },
  photoFile: true,
  photos: {
    include: { file: true },
    orderBy: { createdAt: "desc" as const }
  },
  documents: {
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

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  const user = await requireUser();
  const { id, documentId } = await params;

  const document = await prisma.assetDocument.findFirst({
    where: { id: documentId, assetId: id },
    include: { file: true }
  });
  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.assetDocument.delete({ where: { id: documentId } });
    await tx.assetHistory.create({
      data: {
        assetId: id,
        userId: user.id,
        changeType: "document_removed",
        before: JSON.stringify({ fileId: document.fileId, filename: document.file.originalFilename })
      }
    });
  });

  const asset = await prisma.asset.findUnique({ where: { id }, include: assetInclude });
  return NextResponse.json({ asset });
}
