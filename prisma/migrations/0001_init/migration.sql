-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CertificateType" AS ENUM ('HAKEMLIK', 'REKTORLUK', 'YAZARLIK');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('DRAFT', 'GENERATED', 'DRAFTED_EMAIL', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "EmailActionType" AS ENUM ('DRAFT', 'SEND');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateTemplate" (
    "id" TEXT NOT NULL,
    "type" "CertificateType" NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "backgroundPath" TEXT NOT NULL,
    "subjectTemplate" TEXT NOT NULL,
    "bodyTemplate" TEXT NOT NULL,
    "certificateTextTemplate" TEXT NOT NULL,
    "layoutConfigJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificateTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateRecord" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "type" "CertificateType" NOT NULL,
    "status" "CertificateStatus" NOT NULL DEFAULT 'DRAFT',
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3),
    "organizer" TEXT NOT NULL,
    "customFieldsJson" JSONB NOT NULL,
    "pdfPath" TEXT,
    "pdfFileSize" INTEGER,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificateRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateEmailLog" (
    "id" TEXT NOT NULL,
    "certificateRecordId" TEXT NOT NULL,
    "actionType" "EmailActionType" NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificateEmailLog_pkey" PRIMARY KEY ("id")
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

-- AddForeignKey
ALTER TABLE "CertificateRecord" ADD CONSTRAINT "CertificateRecord_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CertificateTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateEmailLog" ADD CONSTRAINT "CertificateEmailLog_certificateRecordId_fkey" FOREIGN KEY ("certificateRecordId") REFERENCES "CertificateRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

