-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUBMITTER', 'MANAGER');

-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('SUBMITTED', 'REVIEWED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "DefectType" AS ENUM ('CHIPPED_CRACKED', 'WRONG_COLOR_SHADE', 'WRONG_PRODUCT_SHIPPED', 'SHORT_OVER_SHIPMENT', 'DAMAGED_IN_TRANSIT', 'EFFLORESCENCE_STAINING', 'DIMENSIONAL_SIZE_ISSUE', 'OTHER');

-- CreateTable
CREATE TABLE "Counter" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SUBMITTER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "stage" "Stage" NOT NULL DEFAULT 'SUBMITTED',
    "priority" "Priority" NOT NULL,
    "jobStopped" BOOLEAN NOT NULL DEFAULT false,
    "customer" TEXT NOT NULL,
    "jobsite" TEXT,
    "po" TEXT,
    "vendor" TEXT,
    "product" TEXT,
    "colorLot" TEXT,
    "qty" INTEGER,
    "defectType" "DefectType" NOT NULL,
    "description" TEXT NOT NULL,
    "reportedBy" TEXT,
    "dateReported" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "bolNumber" TEXT,
    "rootCause" TEXT,
    "investigatedBy" TEXT,
    "resolution" TEXT,
    "vendorClaimFiled" BOOLEAN NOT NULL DEFAULT false,
    "claimRmaNumber" TEXT,
    "creditAmount" DECIMAL(10,2),
    "closedBy" TEXT,
    "dateClosed" TIMESTAMP(3),
    "notesSubmitted" TEXT,
    "notesReviewed" TEXT,
    "notesResolved" TEXT,
    "submittedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Report_reportNumber_key" ON "Report"("reportNumber");

-- CreateIndex
CREATE INDEX "Report_stage_idx" ON "Report"("stage");

-- CreateIndex
CREATE INDEX "Report_vendor_idx" ON "Report"("vendor");

-- CreateIndex
CREATE INDEX "Report_defectType_idx" ON "Report"("defectType");

-- CreateIndex
CREATE INDEX "Report_priority_idx" ON "Report"("priority");

-- CreateIndex
CREATE INDEX "Report_submittedById_idx" ON "Report"("submittedById");

-- CreateIndex
CREATE INDEX "Photo_reportId_idx" ON "Photo"("reportId");

-- CreateIndex
CREATE INDEX "AuditLog_reportId_idx" ON "AuditLog"("reportId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

