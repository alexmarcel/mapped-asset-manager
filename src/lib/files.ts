import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { FileOwnerTypeValue } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "minioadmin"
  }
});

export async function storeUpload(file: File, ownerType: FileOwnerTypeValue) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `${ownerType.toLowerCase()}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const bucket = process.env.S3_BUCKET || "asset-files";

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type || "application/octet-stream"
    })
  );

  const publicUrl = process.env.S3_PUBLIC_BASE_URL
    ? `${process.env.S3_PUBLIC_BASE_URL}/${key}`
    : null;

  return prisma.fileObject.create({
    data: {
      key,
      originalFilename: file.name,
      mimeType: file.type || "application/octet-stream",
      size: buffer.length,
      ownerType,
      publicUrl
    }
  });
}
