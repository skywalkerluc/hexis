-- Drop the old column and enum, then recreate with new values
ALTER TABLE "UserOnboarding" DROP COLUMN IF EXISTS "cultivationGoal";

DROP TYPE IF EXISTS "CultivationGoal";

CREATE TYPE "CultivationGoal" AS ENUM (
  'CONCENTRACAO',
  'ENERGIA',
  'DISCIPLINA',
  'FORCA',
  'CRIATIVIDADE',
  'EQUILIBRIO',
  'APRENDIZADO',
  'COMUNICACAO',
  'FINANCAS',
  'CORAGEM'
);

ALTER TABLE "UserOnboarding" ADD COLUMN "cultivationGoal" "CultivationGoal";
