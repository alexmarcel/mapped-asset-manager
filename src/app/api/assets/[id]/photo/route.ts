import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { storeUpload } from "@/lib/files";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const form = await request.formData();
  const file = form.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Photo is required" }, { status: 400 });
  }

  const stored = await storeUpload(file, "ASSET_PHOTO");
  const asset = await prisma.asset.update({
    where: { id },
    data: {
      photoFileId: stored.id,
      photos: {
        create: {
          fileId: stored.id
        }
      },
      history: {
        create: {
          userId: user.id,
          changeType: "photo_uploaded",
          after: JSON.stringify({ fileId: stored.id, filename: stored.originalFilename })
        }
      }
    },
    include: {
      category: true,
      locationRef: true,
      currentUser: { select: { id: true, name: true, email: true } },
      photoFile: true,
      photos: {
        include: { file: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  return NextResponse.json({ asset });
}
