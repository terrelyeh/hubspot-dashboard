-- AlterTable
ALTER TABLE "Deal" ADD COLUMN "description" TEXT;
ALTER TABLE "Deal" ADD COLUMN "numContacts" INTEGER DEFAULT 0;
ALTER TABLE "Deal" ADD COLUMN "priority" TEXT;

-- CreateTable
CREATE TABLE "LineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "hubspotLineItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" REAL NOT NULL,
    "price" REAL NOT NULL,
    "amount" REAL NOT NULL,
    "productId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LineItem_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DealContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "hubspotContactId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "jobTitle" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DealContact_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LineItem_dealId_idx" ON "LineItem"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "LineItem_dealId_hubspotLineItemId_key" ON "LineItem"("dealId", "hubspotLineItemId");

-- CreateIndex
CREATE INDEX "DealContact_dealId_idx" ON "DealContact"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "DealContact_dealId_hubspotContactId_key" ON "DealContact"("dealId", "hubspotContactId");
