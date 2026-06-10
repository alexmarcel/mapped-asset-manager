import AdmZip from "adm-zip";
import { existsSync } from "node:fs";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { databasePath, uploadRoot } from "@/lib/upload-paths";

export const runtime = "nodejs";

function backupTimestamp() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    "-",
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0")
  ].join("");
}

export async function GET() {
  await requireAdmin();
  const dbPath = databasePath();
  if (!existsSync(dbPath)) {
    return NextResponse.json({ error: "Database file not found." }, { status: 500 });
  }

  const createdAt = new Date().toISOString();
  const zip = new AdmZip();
  zip.addFile(
    "manifest.json",
    Buffer.from(
      JSON.stringify(
        {
          app: "mapped-asset-manager",
          version: 1,
          createdAt,
          database: "app.db",
          uploads: "uploads"
        },
        null,
        2
      )
    )
  );
  zip.addLocalFile(dbPath, "", "app.db");

  const uploads = uploadRoot();
  if (existsSync(uploads)) {
    zip.addLocalFolder(uploads, "uploads");
  }
  zip.addFile("uploads/.keep", Buffer.alloc(0));

  const filename = `mapped-asset-manager-backup-${backupTimestamp()}.zip`;
  return new NextResponse(new Uint8Array(zip.toBuffer()), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store"
    }
  });
}
