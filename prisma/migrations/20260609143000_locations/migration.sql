-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "internalNumber" TEXT NOT NULL,
    "customNumber" TEXT,
    "vendorAssetNumber" TEXT,
    "model" TEXT NOT NULL,
    "serialNumber" TEXT,
    "purchaseDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'in_use',
    "location" TEXT,
    "locationId" TEXT,
    "categoryId" TEXT NOT NULL,
    "currentUserId" TEXT,
    "photoFileId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Asset_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Asset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Asset_currentUserId_fkey" FOREIGN KEY ("currentUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Asset_photoFileId_fkey" FOREIGN KEY ("photoFileId") REFERENCES "FileObject" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Asset" ("categoryId", "createdAt", "currentUserId", "customNumber", "id", "internalNumber", "location", "model", "photoFileId", "purchaseDate", "serialNumber", "status", "updatedAt", "vendorAssetNumber") SELECT "categoryId", "createdAt", "currentUserId", "customNumber", "id", "internalNumber", "location", "model", "photoFileId", "purchaseDate", "serialNumber", "status", "updatedAt", "vendorAssetNumber" FROM "Asset";
DROP TABLE "Asset";
ALTER TABLE "new_Asset" RENAME TO "Asset";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_internalNumber_key" ON "Asset"("internalNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_customNumber_key" ON "Asset"("customNumber");

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "Asset"("status");

-- CreateIndex
CREATE INDEX "Asset_categoryId_idx" ON "Asset"("categoryId");

-- CreateIndex
CREATE INDEX "Asset_currentUserId_idx" ON "Asset"("currentUserId");

-- CreateIndex
CREATE INDEX "Asset_locationId_idx" ON "Asset"("locationId");
