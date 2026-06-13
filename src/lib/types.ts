import type { AssetStatusValue } from "@/lib/constants";

export type CurrentUser = {
  id: string;
  name: string;
  contact?: string | null;
  email: string;
  role: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  _count?: { assets: number };
};

export type LocationOption = {
  id: string;
  name: string;
  _count?: { assets: number };
};

export type UserOption = {
  id: string;
  name: string;
  contact?: string | null;
  email: string;
  role: string;
  _count?: { assigned: number };
};

export type FloorMapOption = {
  id: string;
  name: string;
  site: { name: string };
  imageFile?: { publicUrl: string | null } | null;
  width: number;
  height: number;
};

export type BootstrapData = {
  categories: Category[];
  locations: LocationOption[];
  users: UserOption[];
  maps: FloorMapOption[];
};

export type AssetRecord = {
  id: string;
  internalNumber: string;
  customNumber: string | null;
  vendorAssetNumber: string | null;
  model: string;
  serialNumber: string | null;
  purchaseDate: string | null;
  status: AssetStatusValue;
  location: string | null;
  locationId: string | null;
  locationRef?: { id: string; name: string } | null;
  categoryId: string;
  category: Category;
  currentUserId: string | null;
  currentUser: { name: string; email?: string } | null;
  photoFile?: { publicUrl: string | null } | null;
  photos?: Array<{
    id: string;
    file: { publicUrl: string | null; originalFilename: string };
  }>;
  documents?: Array<{
    id: string;
    file: {
      publicUrl: string | null;
      originalFilename: string;
      mimeType: string;
      size: number;
    };
  }>;
  _count?: { history: number };
  history?: Array<{
    id: string;
    changeType: string;
    before: string | null;
    after: string | null;
    createdAt: string;
    user?: { name: string; email: string } | null;
  }>;
};
