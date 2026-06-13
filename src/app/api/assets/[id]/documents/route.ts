import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { storeUpload } from "@/lib/files";
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

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const form = await request.formData();
  const file = form.get("document");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "PDF document is required" }, { status: 400 });
  }

  if (!isPdf(file)) {
    return NextResponse.json({ error: "Only PDF files can be attached" }, { status: 400 });
  }

  const stored = await storeUpload(file, "ASSET_DOCUMENT");
  const asset = await prisma.asset.update({
    where: { id },
    data: {
      documents: {
        create: {
          fileId: stored.id
        }
      },
      history: {
        create: {
          userId: user.id,
          changeType: "document_uploaded",
          after: JSON.stringify({ fileId: stored.id, filename: stored.originalFilename })
        }
      }
    },
    include: assetInclude
  });

  return NextResponse.json({ asset }, { status: 201 });
}
