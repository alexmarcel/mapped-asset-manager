import { Prisma } from "@prisma/client";
import { z } from "zod";
import { assetStatuses, type AssetStatusValue } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const assetFormSchema = z.object({
  categoryId: z.string().min(1),
  model: z.string().min(1).max(120),
  serialNumber: z.string().max(120).optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  status: z.enum(assetStatuses),
  location: z.string().max(180).optional().nullable(),
  locationId: z.string().optional().nullable(),
  currentUserId: z.string().optional().nullable(),
  customNumber: z.string().max(80).optional().nullable(),
  vendorAssetNumber: z.string().max(120).optional().nullable()
});

export type AssetFormInput = z.infer<typeof assetFormSchema>;

export async function generateInternalAssetNumber(tx: Prisma.TransactionClient = prisma) {
  const prefix = process.env.ASSET_NUMBER_PREFIX || "IT";
  const count = await tx.asset.count();
  let sequence = count + 1;

  while (true) {
    const internalNumber = `${prefix}-${sequence.toString().padStart(6, "0")}`;
    const existing = await tx.asset.findUnique({ where: { internalNumber } });
    if (!existing) return internalNumber;
    sequence += 1;
  }
}

export function normalizeEmpty(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function isAssetStatus(value: string): value is AssetStatusValue {
  return assetStatuses.includes(value as AssetStatusValue);
}

export function historyValue(value: unknown) {
  return value == null ? null : JSON.stringify(value);
}

export function toAssetData(input: AssetFormInput) {
  return {
    categoryId: input.categoryId,
    model: input.model.trim(),
    serialNumber: normalizeEmpty(input.serialNumber),
    purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
    status: input.status,
    location: normalizeEmpty(input.location),
    locationId: normalizeEmpty(input.locationId),
    currentUserId: normalizeEmpty(input.currentUserId),
    customNumber: normalizeEmpty(input.customNumber),
    vendorAssetNumber: normalizeEmpty(input.vendorAssetNumber)
  };
}
