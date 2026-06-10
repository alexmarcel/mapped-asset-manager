import AdmZip from "adm-zip";
import { copyFile, cp, mkdir, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { databasePath, dataRoot, uploadRoot } from "@/lib/upload-paths";

export const runtime = "nodejs";

type PreservedAdmin = {
  id: string;
  name: string;
  contact: string | null;
  email: string;
  passwordHash: string;
  role: string;
  active: boolean;
};

export async function POST(request: Request) {
  const sessionUser = await requireAdmin();
  const currentAdmin = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, name: true, contact: true, email: true, passwordHash: true, role: true, active: true }
  });
  if (!currentAdmin) return NextResponse.json({ error: "Current admin account was not found." }, { status: 403 });

  const form = await request.formData();
  const backup = form.get("backup");
  if (!(backup instanceof File)) {
    return NextResponse.json({ error: "Backup ZIP is required." }, { status: 400 });
  }
  if (!backup.name.toLowerCase().endsWith(".zip")) {
    return NextResponse.json({ error: "Backup file must be a ZIP." }, { status: 400 });
  }

  const tempRoot = path.join(os.tmpdir(), `mapped-asset-manager-restore-${randomUUID()}`);
  const rollbackDb = path.join(os.tmpdir(), `mapped-asset-manager-current-${randomUUID()}.db`);
  const dbPath = databasePath();

  try {
    const zip = new AdmZip(Buffer.from(await backup.arrayBuffer()));
    validateZip(zip);
    await extractZip(zip, tempRoot);

    const manifestPath = path.join(tempRoot, "manifest.json");
    const restoredDbPath = path.join(tempRoot, "app.db");
    await stat(manifestPath);
    await stat(restoredDbPath);

    await mkdir(dataRoot(), { recursive: true });
    await copyFile(dbPath, rollbackDb).catch(() => undefined);
    await prisma.$disconnect();
    await copyFile(restoredDbPath, dbPath);
    await preserveCurrentAdmin(currentAdmin);

    await rm(uploadRoot(), { recursive: true, force: true });
    await mkdir(uploadRoot(), { recursive: true });
    const restoredUploads = path.join(tempRoot, "uploads");
    if (await exists(restoredUploads)) {
      await cp(restoredUploads, uploadRoot(), { recursive: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (await exists(rollbackDb)) {
      await prisma.$disconnect().catch(() => undefined);
      await copyFile(rollbackDb, dbPath).catch(() => undefined);
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Restore failed." }, { status: 400 });
  } finally {
    await rm(tempRoot, { recursive: true, force: true }).catch(() => undefined);
    await rm(rollbackDb, { force: true }).catch(() => undefined);
  }
}

function validateZip(zip: AdmZip) {
  const names = new Set(zip.getEntries().map((entry) => normalizeEntryName(entry.entryName)));
  if (!names.has("manifest.json")) throw new Error("Backup is missing manifest.json.");
  if (!names.has("app.db")) throw new Error("Backup is missing app.db.");

  for (const name of names) {
    if (!isSafeEntryName(name)) {
      throw new Error("Backup contains an unsafe file path.");
    }
  }

  const manifestEntry = zip.getEntry("manifest.json");
  if (!manifestEntry) throw new Error("Backup is missing manifest.json.");
  const manifest = JSON.parse(manifestEntry.getData().toString("utf8")) as { app?: string; version?: number };
  if (manifest.app !== "mapped-asset-manager" || manifest.version !== 1) {
    throw new Error("Backup format is not supported.");
  }
}

async function extractZip(zip: AdmZip, targetRoot: string) {
  await mkdir(targetRoot, { recursive: true });
  for (const entry of zip.getEntries()) {
    const name = normalizeEntryName(entry.entryName);
    if (!isSafeEntryName(name)) throw new Error("Backup contains an unsafe file path.");
    const target = path.resolve(targetRoot, name);
    if (!target.startsWith(`${targetRoot}${path.sep}`) && target !== targetRoot) {
      throw new Error("Backup contains an unsafe file path.");
    }
    if (entry.isDirectory) {
      await mkdir(target, { recursive: true });
    } else {
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, entry.getData());
    }
  }
}

function normalizeEntryName(name: string) {
  return name.replace(/\\/g, "/").replace(/^\/+/, "");
}

function isSafeEntryName(name: string) {
  if (!name || name.startsWith("/") || /^[a-zA-Z]:/.test(name)) return false;
  return !name.split("/").some((part) => part === "..");
}

async function preserveCurrentAdmin(admin: PreservedAdmin) {
  await prisma.user.updateMany({
    where: { email: admin.email, id: { not: admin.id } },
    data: { email: `restored-${Date.now()}-${admin.email}` }
  });
  await prisma.user.upsert({
    where: { id: admin.id },
    create: { ...admin, role: "ADMIN", active: true },
    update: {
      name: admin.name,
      contact: admin.contact,
      email: admin.email,
      passwordHash: admin.passwordHash,
      role: "ADMIN",
      active: true
    }
  });
}

async function exists(target: string) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}
