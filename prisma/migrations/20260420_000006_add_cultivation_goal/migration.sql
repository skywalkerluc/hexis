-- CreateEnum
CREATE TYPE "CultivationGoal" AS ENUM (
  'FOCUS',
  'DISCIPLINE',
  'ENERGY',
  'ORGANIZATION',
  'CONSISTENCY'
);

-- AlterTable
ALTER TABLE "UserOnboarding"
ADD COLUMN "cultivationGoal" "CultivationGoal";
