-- Add location field to InventoryItem
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "location" TEXT;

-- Create FabricCategory table
CREATE TABLE IF NOT EXISTS "FabricCategory" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FabricCategory_pkey" PRIMARY KEY ("id")
);

-- Add categoryId and photoUrl to Fabric
ALTER TABLE "Fabric" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
ALTER TABLE "Fabric" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;

-- Add foreign key for Fabric.categoryId
ALTER TABLE "Fabric" ADD CONSTRAINT IF NOT EXISTS "Fabric_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "FabricCategory"("id") ON DELETE SET NULL;
