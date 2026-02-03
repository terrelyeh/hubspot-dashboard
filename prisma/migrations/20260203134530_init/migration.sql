-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hubspotId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "amountUsd" REAL NOT NULL,
    "exchangeRate" REAL NOT NULL,
    "stage" TEXT NOT NULL,
    "stageProbability" REAL NOT NULL,
    "probabilitySource" TEXT NOT NULL,
    "forecastCategory" TEXT,
    "closeDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "lastModifiedAt" DATETIME NOT NULL,
    "ownerName" TEXT,
    "ownerEmail" TEXT,
    "hubspotUrl" TEXT,
    "rawData" JSONB,
    CONSTRAINT "Deal_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Target" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "regionId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT,
    "notes" TEXT,
    CONSTRAINT "Target_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "regionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "duration" INTEGER,
    "dealsProcessed" INTEGER NOT NULL DEFAULT 0,
    "dealsCreated" INTEGER NOT NULL DEFAULT 0,
    "dealsUpdated" INTEGER NOT NULL DEFAULT 0,
    "dealsFailed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "errorDetails" JSONB,
    "triggerType" TEXT NOT NULL,
    "triggeredBy" TEXT,
    CONSTRAINT "SyncLog_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StageProbability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stage" TEXT NOT NULL,
    "probability" REAL NOT NULL,
    "source" TEXT NOT NULL,
    "totalDeals" INTEGER NOT NULL DEFAULT 0,
    "wonDeals" INTEGER NOT NULL DEFAULT 0,
    "lastCalculated" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL DEFAULT 'USD',
    "rate" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'exchangerate-api',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "regionAccess" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Region_code_key" ON "Region"("code");

-- CreateIndex
CREATE INDEX "Region_code_idx" ON "Region"("code");

-- CreateIndex
CREATE INDEX "Deal_regionId_idx" ON "Deal"("regionId");

-- CreateIndex
CREATE INDEX "Deal_stage_idx" ON "Deal"("stage");

-- CreateIndex
CREATE INDEX "Deal_closeDate_idx" ON "Deal"("closeDate");

-- CreateIndex
CREATE INDEX "Deal_lastModifiedAt_idx" ON "Deal"("lastModifiedAt");

-- CreateIndex
CREATE INDEX "Deal_regionId_closeDate_idx" ON "Deal"("regionId", "closeDate");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_hubspotId_regionId_key" ON "Deal"("hubspotId", "regionId");

-- CreateIndex
CREATE INDEX "Target_year_quarter_idx" ON "Target"("year", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "Target_regionId_year_quarter_key" ON "Target"("regionId", "year", "quarter");

-- CreateIndex
CREATE INDEX "SyncLog_regionId_idx" ON "SyncLog"("regionId");

-- CreateIndex
CREATE INDEX "SyncLog_startedAt_idx" ON "SyncLog"("startedAt");

-- CreateIndex
CREATE INDEX "SyncLog_status_idx" ON "SyncLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StageProbability_stage_key" ON "StageProbability"("stage");

-- CreateIndex
CREATE INDEX "StageProbability_stage_idx" ON "StageProbability"("stage");

-- CreateIndex
CREATE INDEX "ExchangeRate_date_idx" ON "ExchangeRate"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_fromCurrency_toCurrency_date_key" ON "ExchangeRate"("fromCurrency", "toCurrency", "date");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
