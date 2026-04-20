import { PrismaClient } from "@prisma/client";
import { AVATAR_OPTION_SEEDS } from "@/modules/avatars/domain/avatar-option.seed";
import { ATTRIBUTE_DEFINITION_SEEDS } from "@/modules/attributes/domain/attribute-definition.seed";
import { DECAY_PROFILE_SEEDS } from "@/modules/decay/domain/decay-profile.seed";
import { ONBOARDING_TEMPLATE_SEEDS } from "@/modules/onboarding/domain/onboarding-template.seed";

const TEST_DB_URL_ENV = "TEST_DATABASE_URL";
const PRIMARY_DB_URL_ENV = "DATABASE_URL";
const DEFAULT_TEST_DB_URL = "postgresql://lucasferreira@localhost:5432/hexis_test?schema=public";

const TRUNCATE_TABLES: readonly string[] = [
  '"ProductAnalyticsEvent"',
  '"ProductFeedback"',
  '"AuthSession"',
  '"EvidenceEventImpact"',
  '"AttributeHistoryLog"',
  '"EvidenceEvent"',
  '"Recommendation"',
  '"UserAttribute"',
  '"UserProductLoop"',
  '"UserOnboarding"',
  '"Profile"',
  '"SystemJobRun"',
  '"DecayProfile"',
  '"OnboardingTemplateAttribute"',
  '"OnboardingTemplate"',
  '"AttributeDefinition"',
  '"AvatarOption"',
  '"User"',
];

let environmentReady = false;

export function setupIntegrationTestEnvironment(): string {
  if (environmentReady) {
    return process.env[PRIMARY_DB_URL_ENV] ?? DEFAULT_TEST_DB_URL;
  }

  const configuredUrl = process.env[TEST_DB_URL_ENV] ?? process.env[PRIMARY_DB_URL_ENV] ?? DEFAULT_TEST_DB_URL;
  process.env[PRIMARY_DB_URL_ENV] = configuredUrl;
  environmentReady = true;
  return configuredUrl;
}

export function createTestPrismaClient(): PrismaClient {
  const databaseUrl = setupIntegrationTestEnvironment();

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
}

export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${TRUNCATE_TABLES.join(", ")} RESTART IDENTITY CASCADE;`);
}

export async function seedCatalog(prisma: PrismaClient): Promise<void> {
  await prisma.avatarOption.createMany({
    data: AVATAR_OPTION_SEEDS.map((avatar) => ({
      code: avatar.code,
      label: avatar.label,
      background: avatar.background,
      ring: avatar.ring,
      mark: avatar.mark,
      sortOrder: avatar.sortOrder,
    })),
  });

  await prisma.attributeDefinition.createMany({
    data: ATTRIBUTE_DEFINITION_SEEDS.map((definition) => ({
      slug: definition.slug,
      name: definition.name,
      shortCode: definition.shortCode,
      description: definition.description,
      category: definition.category,
      defaultCurrentValue: definition.defaultCurrentValue,
      defaultBaseValue: definition.defaultBaseValue,
      defaultPotentialValue: definition.defaultPotentialValue,
      scaleMin: definition.scaleMin,
      scaleMax: definition.scaleMax,
    })),
  });

  const definitions = await prisma.attributeDefinition.findMany({
    select: { id: true, slug: true },
  });

  const definitionIdBySlug = new Map<string, string>(
    definitions.map((definition) => [definition.slug, definition.id]),
  );

  await prisma.decayProfile.createMany({
    data: DECAY_PROFILE_SEEDS.map((profile) => {
      const attributeDefinitionId = definitionIdBySlug.get(profile.attributeSlug);
      if (!attributeDefinitionId) {
        throw new Error(`Missing definition for decay profile ${profile.key}`);
      }

      return {
        key: profile.key,
        attributeDefinitionId,
        graceDays: profile.graceDays,
        decayPerDay: profile.decayPerDay,
        baseDecayPerDayAfterDays: profile.baseDecayPerDayAfterDays,
        baseDecayPerDay: profile.baseDecayPerDay,
        floorRatio: profile.floorRatio,
        maintenanceBoostCurrent: profile.maintenanceBoostCurrent,
        maintenanceBoostBase: profile.maintenanceBoostBase,
        maintenanceBoostPotential: profile.maintenanceBoostPotential,
        recoveryBoostCurrent: profile.recoveryBoostCurrent,
        recoveryBoostBase: profile.recoveryBoostBase,
        recoveryBoostPotential: profile.recoveryBoostPotential,
      };
    }),
  });

  for (const template of ONBOARDING_TEMPLATE_SEEDS) {
    const createdTemplate = await prisma.onboardingTemplate.create({
      data: {
        key: template.key,
        label: template.label,
        description: template.description,
        isDefault: template.isDefault,
      },
      select: { id: true },
    });

    await prisma.onboardingTemplateAttribute.createMany({
      data: template.attributes.map((attribute, index) => {
        const attributeDefinitionId = definitionIdBySlug.get(attribute.slug);
        if (!attributeDefinitionId) {
          throw new Error(`Missing definition for template attribute ${attribute.slug}`);
        }

        return {
          templateId: createdTemplate.id,
          attributeDefinitionId,
          sortOrder: index,
          emphasisWeight: attribute.emphasisWeight,
        };
      }),
    });
  }
}

export async function prepareIntegrationDatabase(prisma: PrismaClient): Promise<void> {
  await resetDatabase(prisma);
  await seedCatalog(prisma);
}
