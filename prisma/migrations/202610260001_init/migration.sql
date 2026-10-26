-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "mode" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "providerId" TEXT,
    CONSTRAINT "SocialAccount_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccountInsightSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "measuredOn" TEXT NOT NULL,
    "periodStart" TEXT,
    "periodEnd" TEXT,
    "views" INTEGER,
    "reach" INTEGER,
    "viewers" INTEGER,
    "interactions" INTEGER,
    "engagedAccounts" INTEGER,
    "followers" INTEGER,
    "profileVisits" INTEGER,
    "linkClicks" INTEGER,
    "addressClicks" INTEGER,
    "notes" TEXT,
    "importedDatasetId" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccountInsightSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AccountInsightSnapshot_importedDatasetId_fkey" FOREIGN KEY ("importedDatasetId") REFERENCES "ImportedDataset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SnapshotRevision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "snapshotId" TEXT NOT NULL,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previous" TEXT NOT NULL,
    CONSTRAINT "SnapshotRevision_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "AccountInsightSnapshot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT,
    "localKey" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "publishedOn" TEXT,
    "traffic" TEXT NOT NULL,
    "permalink" TEXT,
    CONSTRAINT "Media_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MediaInsightSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mediaId" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "measuredOn" TEXT NOT NULL,
    "periodStart" TEXT,
    "periodEnd" TEXT,
    "views" INTEGER,
    "reach" INTEGER,
    "viewers" INTEGER,
    "interactions" INTEGER,
    "engagedAccounts" INTEGER,
    "likes" INTEGER,
    "comments" INTEGER,
    "shares" INTEGER,
    "saves" INTEGER,
    "replies" INTEGER,
    "profileVisits" INTEGER,
    "linkClicks" INTEGER,
    "stickerClicks" INTEGER,
    "followersGained" INTEGER,
    "forward" INTEGER,
    "nextStory" INTEGER,
    "exits" INTEGER,
    "notes" TEXT,
    CONSTRAINT "MediaInsightSnapshot_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "encryptedToken" TEXT,
    "expiresAt" DATETIME,
    "lastVerifiedAt" DATETIME,
    "lastSyncedAt" DATETIME,
    CONSTRAINT "IntegrationConnection_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "status" TEXT NOT NULL,
    "inserted" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    CONSTRAINT "SyncJob_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "audience" TEXT,
    "dailyBudgetCents" INTEGER,
    "plannedDays" INTEGER,
    "spendCents" INTEGER,
    "conversations" INTEGER,
    "source" TEXT NOT NULL,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Campaign_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeadSummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "contacts" INTEGER,
    "attributedContacts" INTEGER,
    "scheduled" INTEGER,
    "attended" INTEGER,
    "closed" INTEGER,
    "source" TEXT NOT NULL,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadSummary_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportedDataset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inserted" INTEGER NOT NULL,
    "skipped" INTEGER NOT NULL,
    CONSTRAINT "ImportedDataset_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_workspaceId_username_key" ON "SocialAccount"("workspaceId", "username");

-- CreateIndex
CREATE UNIQUE INDEX "AccountInsightSnapshot_dedupeKey_key" ON "AccountInsightSnapshot"("dedupeKey");

-- CreateIndex
CREATE INDEX "AccountInsightSnapshot_accountId_periodStart_periodEnd_idx" ON "AccountInsightSnapshot"("accountId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "AccountInsightSnapshot_accountId_measuredOn_idx" ON "AccountInsightSnapshot"("accountId", "measuredOn");

-- CreateIndex
CREATE INDEX "Media_accountId_publishedOn_idx" ON "Media"("accountId", "publishedOn");

-- CreateIndex
CREATE UNIQUE INDEX "Media_accountId_localKey_key" ON "Media"("accountId", "localKey");

-- CreateIndex
CREATE UNIQUE INDEX "MediaInsightSnapshot_dedupeKey_key" ON "MediaInsightSnapshot"("dedupeKey");

-- CreateIndex
CREATE INDEX "MediaInsightSnapshot_mediaId_measuredOn_idx" ON "MediaInsightSnapshot"("mediaId", "measuredOn");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConnection_accountId_key" ON "IntegrationConnection"("accountId");

-- CreateIndex
CREATE INDEX "SyncJob_accountId_startedAt_idx" ON "SyncJob"("accountId", "startedAt");

-- CreateIndex
CREATE INDEX "LeadSummary_workspaceId_date_idx" ON "LeadSummary"("workspaceId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "LeadSummary_workspaceId_date_channel_key" ON "LeadSummary"("workspaceId", "date", "channel");

-- CreateIndex
CREATE INDEX "ImportedDataset_workspaceId_sha256_idx" ON "ImportedDataset"("workspaceId", "sha256");
