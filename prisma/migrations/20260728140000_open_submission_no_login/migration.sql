-- AlterTable: submission no longer requires an account
ALTER TABLE "Report" ALTER COLUMN "submittedById" DROP NOT NULL;

-- Backfill before enforcing NOT NULL on the now-mandatory typed name
UPDATE "Report" SET "reportedBy" = 'Unknown' WHERE "reportedBy" IS NULL;
ALTER TABLE "Report" ALTER COLUMN "reportedBy" SET NOT NULL;

-- AlterTable: audit entries from anonymous submitters have no User row
ALTER TABLE "AuditLog" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "AuditLog" ADD COLUMN "actorName" TEXT;
