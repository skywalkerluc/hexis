-- CreateTable
CREATE TABLE "ProductAnalyticsEvent" (
  "id" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  "userId" TEXT,
  "properties" JSONB NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductAnalyticsEvent_eventName_occurredAt_idx" ON "ProductAnalyticsEvent"("eventName", "occurredAt");

-- CreateIndex
CREATE INDEX "ProductAnalyticsEvent_userId_occurredAt_idx" ON "ProductAnalyticsEvent"("userId", "occurredAt");

-- AddForeignKey
ALTER TABLE "ProductAnalyticsEvent"
ADD CONSTRAINT "ProductAnalyticsEvent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
