import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AssetQrPage({ params }: { params: Promise<{ assetNumber: string }> }) {
  const { assetNumber } = await params;
  const asset = await prisma.asset.findUnique({
    where: { internalNumber: decodeURIComponent(assetNumber) },
    select: { id: true }
  });

  if (!asset) notFound();
  redirect(`/?asset=${asset.id}`);
}
