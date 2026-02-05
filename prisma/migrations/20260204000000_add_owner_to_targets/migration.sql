-- AddOwnerToTargets
-- Add ownerName column to Target table to support owner-level targets

-- Step 1: Drop the old unique constraint
DROP INDEX "Target_regionId_year_quarter_key";

-- Step 2: Add the ownerName column (nullable)
ALTER TABLE "Target" ADD COLUMN "ownerName" TEXT;

-- Step 3: Create new unique constraint including ownerName
CREATE UNIQUE INDEX "Target_regionId_year_quarter_ownerName_key" ON "Target"("regionId", "year", "quarter", "ownerName");

-- Step 4: Create index on ownerName for better query performance
CREATE INDEX "Target_ownerName_idx" ON "Target"("ownerName");
