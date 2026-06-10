-- CreateTable
CREATE TABLE "AssetPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssetPhoto_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AssetPhoto_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileObject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AssetPhoto_assetId_idx" ON "AssetPhoto"("assetId");

-- CreateIndex
CREATE INDEX "AssetPhoto_fileId_idx" ON "AssetPhoto"("fileId");
