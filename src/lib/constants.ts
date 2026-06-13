export const assetStatuses = ["in_use", "in_storage", "in_repair", "disposed"] as const;
export const userRoles = ["ADMIN", "STAFF"] as const;
export const fileOwnerTypes = ["ASSET_PHOTO", "ASSET_DOCUMENT", "FLOOR_MAP", "QR_EXPORT"] as const;

export type AssetStatusValue = (typeof assetStatuses)[number];
export type UserRoleValue = (typeof userRoles)[number];
export type FileOwnerTypeValue = (typeof fileOwnerTypes)[number];

export const statusLabels: Record<AssetStatusValue, string> = {
  in_use: "In use",
  in_storage: "In storage",
  in_repair: "In repair",
  disposed: "Disposed"
};
