-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('FRICTION', 'IDEA', 'BUG');

-- CreateTable
CREATE TABLE "ProductFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "routePath" TEXT NOT NULL,
    "category" "FeedbackCategory" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductFeedback_createdAt_idx" ON "ProductFeedback"("createdAt");

-- CreateIndex
CREATE INDEX "ProductFeedback_userId_createdAt_idx" ON "ProductFeedback"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProductFeedback" ADD CONSTRAINT "ProductFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
