import { PrismaClient } from "@prisma/client";
import { ATTRIBUTE_DEFINITION_SEEDS } from "../src/modules/attributes/domain/attribute-definition.seed";
import { DECAY_PROFILE_SEEDS } from "../src/modules/decay/domain/decay-profile.seed";
import { AVATAR_OPTION_SEEDS } from "../src/modules/avatars/domain/avatar-option.seed";
import { ONBOARDING_TEMPLATE_SEEDS } from "../src/modules/onboarding/domain/onboarding-template.seed";
import { hashPassword } from "../src/modules/auth/infrastructure/password.service";
import { bootstrapUser } from "../src/modules/users/application/bootstrap-user.use-case";
import { PASSWORD_MIN_LENGTH } from "../src/modules/auth/domain/auth.constants";

const prismaClient = new PrismaClient();
const DEFAULT_TEST_ACCOUNT_EMAIL = "test@hexis.local";
const DEFAULT_TEST_ACCOUNT_PASSWORD = "Test12345678";
const DEFAULT_TEST_ACCOUNT_DISPLAY_NAME = "Hexis Test User";
const TEST_ACCOUNT_OPT_OUT_FLAG = "HEXIS_SEED_TEST_ACCOUNT";

export async function seedAvatarOptions(): Promise<void> {
  for (const avatar of AVATAR_OPTION_SEEDS) {
    await prismaClient.avatarOption.upsert({
      where: { code: avatar.code },
      update: avatar,
      create: avatar,
    });
  }
}

export async function seedAttributeDefinitions(): Promise<void> {
  for (const definition of ATTRIBUTE_DEFINITION_SEEDS) {
    await prismaClient.attributeDefinition.upsert({
      where: { slug: definition.slug },
      update: {
        name: definition.name,
        shortCode: definition.shortCode,
        description: definition.description,
        category: definition.category,
        defaultCurrentValue: definition.defaultCurrentValue,
        defaultBaseValue: definition.defaultBaseValue,
        defaultPotentialValue: definition.defaultPotentialValue,
        scaleMin: definition.scaleMin,
        scaleMax: definition.scaleMax,
      },
      create: {
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
      },
    });
  }
}

export async function seedDecayProfiles(): Promise<void> {
  for (const profile of DECAY_PROFILE_SEEDS) {
    const definition = await prismaClient.attributeDefinition.findUnique({
      where: { slug: profile.attributeSlug },
      select: { id: true },
    });
    if (!definition) {
      throw new Error(`Attribute definition missing for ${profile.attributeSlug}`);
    }

    await prismaClient.decayProfile.upsert({
      where: { key: profile.key },
      update: {
        attributeDefinitionId: definition.id,
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
      },
      create: {
        key: profile.key,
        attributeDefinitionId: definition.id,
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
      },
    });
  }
}

export async function seedOnboardingTemplates(): Promise<void> {
  for (const template of ONBOARDING_TEMPLATE_SEEDS) {
    const persistedTemplate = await prismaClient.onboardingTemplate.upsert({
      where: { key: template.key },
      update: {
        label: template.label,
        description: template.description,
        isDefault: template.isDefault,
      },
      create: {
        key: template.key,
        label: template.label,
        description: template.description,
        isDefault: template.isDefault,
      },
      select: { id: true },
    });

    await prismaClient.onboardingTemplateAttribute.deleteMany({
      where: { templateId: persistedTemplate.id },
    });

    for (const [index, attribute] of template.attributes.entries()) {
      const definition = await prismaClient.attributeDefinition.findUnique({
        where: { slug: attribute.slug },
        select: { id: true },
      });
      if (!definition) {
        throw new Error(`Template attribute slug missing: ${attribute.slug}`);
      }

      await prismaClient.onboardingTemplateAttribute.create({
        data: {
          templateId: persistedTemplate.id,
          attributeDefinitionId: definition.id,
          sortOrder: index,
          emphasisWeight: attribute.emphasisWeight,
        },
      });
    }
  }
}

export async function seedLocalTestAccount(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    return;
  }
  if (process.env[TEST_ACCOUNT_OPT_OUT_FLAG] === "false") {
    return;
  }

  const email = process.env.HEXIS_TEST_ACCOUNT_EMAIL ?? DEFAULT_TEST_ACCOUNT_EMAIL;
  const password = process.env.HEXIS_TEST_ACCOUNT_PASSWORD ?? DEFAULT_TEST_ACCOUNT_PASSWORD;
  const displayName = process.env.HEXIS_TEST_ACCOUNT_DISPLAY_NAME ?? DEFAULT_TEST_ACCOUNT_DISPLAY_NAME;

  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new Error(
      `HEXIS_TEST_ACCOUNT_PASSWORD must be at least ${PASSWORD_MIN_LENGTH} characters.`,
    );
  }

  const passwordHash = await hashPassword(password);

  await prismaClient.$transaction(async (transactionClient) => {
    const user = await transactionClient.user.upsert({
      where: { email },
      update: { passwordHash },
      create: {
        email,
        passwordHash,
      },
      select: { id: true },
    });

    const profile = await transactionClient.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    const attributesCount = await transactionClient.userAttribute.count({
      where: { userId: user.id },
    });

    if (!profile && attributesCount === 0) {
      await bootstrapUser(transactionClient, {
        userId: user.id,
        displayName,
      });
      return;
    }

    if (profile && attributesCount > 0) {
      await transactionClient.profile.update({
        where: { userId: user.id },
        data: { displayName },
      });
      return;
    }

    throw new Error(
      `Test account ${email} is in a partial bootstrap state (profile/attributes mismatch). Reset DB or fix the user state.`,
    );
  });

  console.info(`[seed] Test account ready: ${email} (password: ${password})`);
}

export async function runSeed(): Promise<void> {
  await seedAvatarOptions();
  await seedAttributeDefinitions();
  await seedDecayProfiles();
  await seedOnboardingTemplates();
  await seedLocalTestAccount();
}

runSeed()
  .then(async () => {
    await prismaClient.$disconnect();
  })
  .catch(async (error: unknown) => {
    await prismaClient.$disconnect();
    throw error;
  });
