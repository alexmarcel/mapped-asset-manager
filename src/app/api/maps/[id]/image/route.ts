import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { storeUpload } from "@/lib/files";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Map image is required" }, { status: 400 });
  }
  const width = Number(form.get("width"));
  const height = Number(form.get("height"));

  const stored = await storeUpload(file, "FLOOR_MAP");
  const map = await prisma.floorMap.update({
    where: { id },
    data: {
      imageFileId: stored.id,
      ...(Number.isFinite(width) && width > 0 ? { width: Math.round(width) } : {}),
      ...(Number.isFinite(height) && height > 0 ? { height: Math.round(height) } : {})
    },
    include: { site: true, imageFile: true }
  });
  return NextResponse.json({ map });
}
