-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EvidenceEventType" AS ENUM ('TRAINING', 'PRACTICE', 'ROUTINE', 'ACHIEVEMENT', 'RECOVERY');

-- CreateEnum
CREATE TYPE "EvidenceIntensity" AS ENUM ('LIGHT', 'MODERATE', 'INTENSE');

-- CreateEnum
CREATE TYPE "AttributeStatus" AS ENUM ('IMPROVING', 'STABLE', 'DECAYING', 'AT_RISK');

-- CreateEnum
CREATE TYPE "HistoryCauseType" AS ENUM ('EVENT', 'DECAY', 'SYSTEM', 'MANUAL');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('ACTIVE', 'DISMISSED', 'APPLIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RecommendationKind" AS ENUM ('MAINTENANCE_BLOCK');

-- CreateEnum
CREATE TYPE "JobRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarOptionId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvatarOption" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "background" TEXT NOT NULL,
    "ring" TEXT NOT NULL,
    "mark" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvatarOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeDefinition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "scaleMin" DECIMAL(5,2) NOT NULL,
    "scaleMax" DECIMAL(5,2) NOT NULL,
    "defaultCurrentValue" DECIMAL(5,2) NOT NULL,
    "defaultBaseValue" DECIMAL(5,2) NOT NULL,
    "defaultPotentialValue" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttributeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAttribute" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attributeDefinitionId" TEXT NOT NULL,
    "currentValue" DECIMAL(5,2) NOT NULL,
    "baseValue" DECIMAL(5,2) NOT NULL,
    "potentialValue" DECIMAL(5,2) NOT NULL,
    "minValue" DECIMAL(5,2) NOT NULL,
    "maxValue" DECIMAL(5,2) NOT NULL,
    "status" "AttributeStatus" NOT NULL DEFAULT 'STABLE',
    "consistencyScore" DECIMAL(5,2) NOT NULL,
    "lastEventAt" TIMESTAMP(3),
    "lastDecayCheckAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "eventType" "EvidenceEventType" NOT NULL,
    "intensity" "EvidenceIntensity" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvidenceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceEventImpact" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userAttributeId" TEXT NOT NULL,
    "deltaCurrent" DECIMAL(5,2) NOT NULL,
    "deltaBase" DECIMAL(5,2) NOT NULL,
    "deltaPotential" DECIMAL(5,2) NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceEventImpact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeHistoryLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userAttributeId" TEXT NOT NULL,
    "causeType" "HistoryCauseType" NOT NULL,
    "causeReferenceId" TEXT,
    "explanation" TEXT NOT NULL,
    "previousCurrent" DECIMAL(5,2) NOT NULL,
    "nextCurrent" DECIMAL(5,2) NOT NULL,
    "previousBase" DECIMAL(5,2) NOT NULL,
    "nextBase" DECIMAL(5,2) NOT NULL,
    "previousPotential" DECIMAL(5,2) NOT NULL,
    "nextPotential" DECIMAL(5,2) NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttributeHistoryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecayProfile" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "attributeDefinitionId" TEXT NOT NULL,
    "graceDays" INTEGER NOT NULL,
    "decayPerDay" DECIMAL(5,3) NOT NULL,
    "baseDecayPerDayAfterDays" INTEGER NOT NULL,
    "baseDecayPerDay" DECIMAL(5,3) NOT NULL,
    "floorRatio" DECIMAL(5,3) NOT NULL,
    "maintenanceBoostCurrent" DECIMAL(5,3) NOT NULL,
    "maintenanceBoostBase" DECIMAL(5,3) NOT NULL,
    "maintenanceBoostPotential" DECIMAL(5,3) NOT NULL,
    "recoveryBoostCurrent" DECIMAL(5,3) NOT NULL,
    "recoveryBoostBase" DECIMAL(5,3) NOT NULL,
    "recoveryBoostPotential" DECIMAL(5,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecayProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attributeDefinitionId" TEXT NOT NULL,
    "kind" "RecommendationKind" NOT NULL,
    "title" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "expectedCurrentGain" DECIMAL(5,2) NOT NULL,
    "priorityScore" DECIMAL(6,3) NOT NULL,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'ACTIVE',
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastEvaluatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingTemplateAttribute" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "attributeDefinitionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "emphasisWeight" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "OnboardingTemplateAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserOnboarding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOnboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemJobRun" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "jobDay" TIMESTAMP(3) NOT NULL,
    "status" "JobRunStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "processedUsers" INTEGER NOT NULL DEFAULT 0,
    "impactedAttributes" INTEGER NOT NULL DEFAULT 0,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemJobRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_tokenHash_key" ON "AuthSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthSession_userId_idx" ON "AuthSession"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AvatarOption_code_key" ON "AvatarOption"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeDefinition_slug_key" ON "AttributeDefinition"("slug");

-- CreateIndex
CREATE INDEX "UserAttribute_userId_idx" ON "UserAttribute"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAttribute_userId_attributeDefinitionId_key" ON "UserAttribute"("userId", "attributeDefinitionId");

-- CreateIndex
CREATE INDEX "EvidenceEvent_userId_occurredAt_idx" ON "EvidenceEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "EvidenceEventImpact_eventId_idx" ON "EvidenceEventImpact"("eventId");

-- CreateIndex
CREATE INDEX "EvidenceEventImpact_userAttributeId_idx" ON "EvidenceEventImpact"("userAttributeId");

-- CreateIndex
CREATE INDEX "AttributeHistoryLog_userId_changedAt_idx" ON "AttributeHistoryLog"("userId", "changedAt");

-- CreateIndex
CREATE INDEX "AttributeHistoryLog_userAttributeId_changedAt_idx" ON "AttributeHistoryLog"("userAttributeId", "changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DecayProfile_key_key" ON "DecayProfile"("key");

-- CreateIndex
CREATE INDEX "Recommendation_userId_status_idx" ON "Recommendation"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_userId_attributeDefinitionId_kind_key" ON "Recommendation"("userId", "attributeDefinitionId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingTemplate_key_key" ON "OnboardingTemplate"("key");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingTemplateAttribute_templateId_attributeDefinitionI_key" ON "OnboardingTemplateAttribute"("templateId", "attributeDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserOnboarding_userId_key" ON "UserOnboarding"("userId");

-- CreateIndex
CREATE INDEX "SystemJobRun_jobName_status_idx" ON "SystemJobRun"("jobName", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SystemJobRun_jobName_jobDay_key" ON "SystemJobRun"("jobName", "jobDay");

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_avatarOptionId_fkey" FOREIGN KEY ("avatarOptionId") REFERENCES "AvatarOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAttribute" ADD CONSTRAINT "UserAttribute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAttribute" ADD CONSTRAINT "UserAttribute_attributeDefinitionId_fkey" FOREIGN KEY ("attributeDefinitionId") REFERENCES "AttributeDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceEvent" ADD CONSTRAINT "EvidenceEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceEventImpact" ADD CONSTRAINT "EvidenceEventImpact_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "EvidenceEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceEventImpact" ADD CONSTRAINT "EvidenceEventImpact_userAttributeId_fkey" FOREIGN KEY ("userAttributeId") REFERENCES "UserAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeHistoryLog" ADD CONSTRAINT "AttributeHistoryLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeHistoryLog" ADD CONSTRAINT "AttributeHistoryLog_userAttributeId_fkey" FOREIGN KEY ("userAttributeId") REFERENCES "UserAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecayProfile" ADD CONSTRAINT "DecayProfile_attributeDefinitionId_fkey" FOREIGN KEY ("attributeDefinitionId") REFERENCES "AttributeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_attributeDefinitionId_fkey" FOREIGN KEY ("attributeDefinitionId") REFERENCES "AttributeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingTemplateAttribute" ADD CONSTRAINT "OnboardingTemplateAttribute_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "OnboardingTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingTemplateAttribute" ADD CONSTRAINT "OnboardingTemplateAttribute_attributeDefinitionId_fkey" FOREIGN KEY ("attributeDefinitionId") REFERENCES "AttributeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOnboarding" ADD CONSTRAINT "UserOnboarding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOnboarding" ADD CONSTRAINT "UserOnboarding_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "OnboardingTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

