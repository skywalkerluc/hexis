-- AlterTable
ALTER TABLE "SystemJobRun"
ADD COLUMN "lockedBy" TEXT,
ADD COLUMN "lockedAt" TIMESTAMP(3),
ADD COLUMN "leaseExpiresAt" TIMESTAMP(3);
