-- CreateTable
CREATE TABLE "UserProductLoop" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "templateKey" TEXT NOT NULL,
  "weeklyFocusAttributeDefinitionId" TEXT,
  "weeklyFocusWeekStartAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserProductLoop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProductLoop_userId_key" ON "UserProductLoop"("userId");

-- CreateIndex
CREATE INDEX "UserProductLoop_templateKey_idx" ON "UserProductLoop"("templateKey");

-- AddForeignKey
ALTER TABLE "UserProductLoop"
ADD CONSTRAINT "UserProductLoop_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProductLoop"
ADD CONSTRAINT "UserProductLoop_weeklyFocusAttributeDefinitionId_fkey"
FOREIGN KEY ("weeklyFocusAttributeDefinitionId") REFERENCES "AttributeDefinition"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
