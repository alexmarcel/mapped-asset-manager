import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { FileOwnerTypeValue } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { uploadRoot } from "@/lib/upload-paths";

function safeFilename(name: string) {
  const parsed = path.parse(name);
  const cleaned = parsed.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^_+/, "");
  return cleaned || "upload";
}

function publicUploadUrl(key: string) {
  return `/uploads/${key.split("/").map(encodeURIComponent).join("/")}`;
}

function timestamp() {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("");
  const time = [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0")
  ].join("");
  return `${date}-${time}`;
}

function ownerFolder(ownerType: FileOwnerTypeValue) {
  return ownerType.toLowerCase();
}

function extensionFor(file: File) {
  const extension = path.extname(file.name).toLowerCase().replace(/[^a-z0-9.]/g, "");
  return extension || ".bin";
}

function canCompress(file: File) {
  return ["image/jpeg", "image/png", "image/webp", "image/tiff", "image/avif"].includes(file.type);
}

export async function storeUpload(file: File, ownerType: FileOwnerTypeValue) {
  const source = Buffer.from(await file.arrayBuffer());
  const folder = ownerFolder(ownerType);
  const suffix = randomUUID().slice(0, 8);
  const compressed = canCompress(file);
  const output = compressed
    ? await sharp(source)
        .rotate()
        .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 72 })
        .toBuffer({ resolveWithObject: true })
    : null;
  const stored = output?.data || source;
  const filename = compressed
    ? `${timestamp()}-${suffix}.webp`
    : `${timestamp()}-${suffix}-${safeFilename(file.name)}${extensionFor(file)}`;
  const key = `${folder}/${filename}`;
  const target = path.join(uploadRoot(), key);

  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, stored);

  const fileObject = await prisma.fileObject.create({
    data: {
      key,
      originalFilename: file.name,
      mimeType: compressed ? "image/webp" : file.type || "application/octet-stream",
      size: stored.length,
      ownerType,
      publicUrl: publicUploadUrl(key)
    }
  });
  return Object.assign(fileObject, {
    imageWidth: output?.info.width,
    imageHeight: output?.info.height
  });
}
