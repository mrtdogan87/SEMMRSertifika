-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CertificateTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "backgroundPath" TEXT NOT NULL,
    "subjectTemplate" TEXT NOT NULL,
    "bodyTemplate" TEXT NOT NULL,
    "certificateTextTemplate" TEXT NOT NULL,
    "layoutConfigJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CertificateRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventDate" DATETIME,
    "organizer" TEXT NOT NULL,
    "customFieldsJson" TEXT NOT NULL,
    "pdfPath" TEXT,
    "pdfFileSize" INTEGER,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CertificateRecord_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CertificateTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CertificateEmailLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "certificateRecordId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CertificateEmailLog_certificateRecordId_fkey" FOREIGN KEY ("certificateRecordId") REFERENCES "CertificateRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CertificateTemplate_type_key" ON "CertificateTemplate"("type");

-- CreateIndex
CREATE INDEX "CertificateRecord_type_status_idx" ON "CertificateRecord"("type", "status");

-- CreateIndex
CREATE INDEX "CertificateRecord_email_idx" ON "CertificateRecord"("email");

-- CreateIndex
CREATE INDEX "CertificateRecord_createdAt_idx" ON "CertificateRecord"("createdAt");

-- CreateIndex
CREATE INDEX "CertificateEmailLog_certificateRecordId_createdAt_idx" ON "CertificateEmailLog"("certificateRecordId", "createdAt");
