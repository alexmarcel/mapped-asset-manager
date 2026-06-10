import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { uploadRoot } from "@/lib/upload-paths";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const root = uploadRoot();
  const target = path.resolve(root, ...segments);

  if (!target.startsWith(`${root}${path.sep}`)) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  try {
    const info = await stat(target);
    if (!info.isFile()) return NextResponse.json({ error: "File not found" }, { status: 404 });

    const file = await readFile(target);
    const contentType = contentTypeFor(target);
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

function contentTypeFor(filePath: string) {
  switch (path.extname(filePath).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    case ".pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}
