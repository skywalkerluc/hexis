import { prismaClient } from "@/shared/db/prisma-client";
import {
  defaultLoopTemplateForGoal,
  LOOP_TEMPLATES,
  readDefaultLoopTemplate,
  readLoopTemplateByKey,
  type LoopTemplate,
  type LoopTemplateKey,
} from "@/modules/loops/domain/loop-template";
import {
  type CultivationGoal,
} from "@/modules/onboarding/domain/cultivation-goal";

export type UserLoopView = {
  template: LoopTemplate;
  weeklyFocus: {
    attributeDefinitionId: string;
    slug: string;
    name: string;
    weekStartAt: Date;
  } | null;
  templateOptions: readonly LoopTemplate[];
  weeklyFocusOptions: {
    attributeDefinitionId: string;
    slug: string;
    name: string;
  }[];
};

export type LoopRecommendationContext = {
  template: LoopTemplate;
  weeklyFocusAttributeSlug: string | null;
};

export async function readLoopRecommendationContext(
  userId: string,
): Promise<LoopRecommendationContext> {
  const [loop, onboarding] = await Promise.all([
    prismaClient.userProductLoop.findUnique({
      where: { userId },
      select: {
        templateKey: true,
        weeklyFocusAttributeDefinition: {
          select: { slug: true },
        },
      },
    }),
    prismaClient.userOnboarding.findUnique({
      where: { userId },
      select: { cultivationGoal: true },
    }),
  ]);

  const fallbackTemplate = onboarding?.cultivationGoal
    ? defaultLoopTemplateForGoal(onboarding.cultivationGoal as CultivationGoal)
    : readDefaultLoopTemplate();

  const template = loop
    ? readLoopTemplateByKey(loop.templateKey)
    : fallbackTemplate;

  return {
    template,
    weeklyFocusAttributeSlug: loop?.weeklyFocusAttributeDefinition?.slug ?? null,
  };
}

export async function readUserLoopView(userId: string): Promise<UserLoopView> {
  const [loop, onboarding, attributes] = await Promise.all([
    prismaClient.userProductLoop.findUnique({
      where: { userId },
      include: {
        weeklyFocusAttributeDefinition: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
    }),
    prismaClient.userOnboarding.findUnique({
      where: { userId },
      select: { cultivationGoal: true },
    }),
    prismaClient.attributeDefinition.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
      },
    }),
  ]);

  const fallbackTemplate = onboarding?.cultivationGoal
    ? defaultLoopTemplateForGoal(onboarding.cultivationGoal as CultivationGoal)
    : readDefaultLoopTemplate();
  const template = loop
    ? readLoopTemplateByKey(loop.templateKey)
    : fallbackTemplate;

  const allowedWeeklyFocusSlugs = new Set(template.focusAttributeSlugs);
  const allowedAttributeIds = new Set(
    attributes
      .filter((attribute) => allowedWeeklyFocusSlugs.has(attribute.slug))
      .map((attribute) => attribute.id),
  );

  const weeklyFocus =
    loop?.weeklyFocusAttributeDefinition &&
    loop.weeklyFocusWeekStartAt &&
    allowedAttributeIds.has(loop.weeklyFocusAttributeDefinition.id)
      ? {
          attributeDefinitionId: loop.weeklyFocusAttributeDefinition.id,
          slug: loop.weeklyFocusAttributeDefinition.slug,
          name: loop.weeklyFocusAttributeDefinition.name,
          weekStartAt: loop.weeklyFocusWeekStartAt,
        }
      : null;
  const weeklyFocusOptions = attributes
    .filter((attribute) => allowedWeeklyFocusSlugs.has(attribute.slug))
    .map((attribute) => ({
      attributeDefinitionId: attribute.id,
      slug: attribute.slug,
      name: attribute.name,
    }));

  return {
    template,
    weeklyFocus,
    templateOptions: LOOP_TEMPLATES,
    weeklyFocusOptions,
  };
}

export type UpdateUserLoopInput = {
  userId: string;
  templateKey: LoopTemplateKey;
  weeklyFocusAttributeDefinitionId: string;
  now: Date;
};

export type UpdateUserLoopResult = {
  previousTemplateKey: LoopTemplateKey | null;
  nextTemplateKey: LoopTemplateKey;
  previousWeeklyFocusAttributeDefinitionId: string | null;
  nextWeeklyFocusAttributeDefinitionId: string;
  weeklyFocusChanged: boolean;
  templateChanged: boolean;
};

function startOfIsoWeek(date: Date): Date {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = result.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  result.setUTCDate(result.getUTCDate() - diffToMonday);
  return result;
}

export async function updateUserLoop(input: UpdateUserLoopInput): Promise<UpdateUserLoopResult> {
  const template = readLoopTemplateByKey(input.templateKey);
  const focusAttribute = await prismaClient.attributeDefinition.findUnique({
    where: { id: input.weeklyFocusAttributeDefinitionId },
    select: { id: true, slug: true },
  });
  if (!focusAttribute) {
    throw new Error("Weekly focus attribute not found.");
  }
  if (!template.focusAttributeSlugs.includes(focusAttribute.slug)) {
    throw new Error("Weekly focus must belong to the selected template focus set.");
  }

  const existing = await prismaClient.userProductLoop.findUnique({
    where: { userId: input.userId },
    select: {
      templateKey: true,
      weeklyFocusAttributeDefinitionId: true,
    },
  });

  const weekStartAt = startOfIsoWeek(input.now);
  await prismaClient.userProductLoop.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      templateKey: input.templateKey,
      weeklyFocusAttributeDefinitionId: focusAttribute.id,
      weeklyFocusWeekStartAt: weekStartAt,
    },
    update: {
      templateKey: input.templateKey,
      weeklyFocusAttributeDefinitionId: focusAttribute.id,
      weeklyFocusWeekStartAt: weekStartAt,
    },
  });

  return {
    previousTemplateKey: existing?.templateKey as LoopTemplateKey | null,
    nextTemplateKey: input.templateKey,
    previousWeeklyFocusAttributeDefinitionId: existing?.weeklyFocusAttributeDefinitionId ?? null,
    nextWeeklyFocusAttributeDefinitionId: focusAttribute.id,
    weeklyFocusChanged:
      existing?.weeklyFocusAttributeDefinitionId !== focusAttribute.id,
    templateChanged: existing?.templateKey !== input.templateKey,
  };
}

export async function initializeUserLoopForOnboarding(input: {
  userId: string;
  cultivationGoal: CultivationGoal;
}): Promise<void> {
  const template = defaultLoopTemplateForGoal(input.cultivationGoal);
  const firstFocusSlug = template.focusAttributeSlugs[0];
  if (!firstFocusSlug) {
    throw new Error(`Loop template ${template.key} has no focus attributes.`);
  }
  const weeklyFocusAttribute = await prismaClient.attributeDefinition.findFirst({
    where: { slug: firstFocusSlug },
    select: { id: true },
  });

  await prismaClient.userProductLoop.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      templateKey: template.key,
      weeklyFocusAttributeDefinitionId: weeklyFocusAttribute?.id ?? null,
      weeklyFocusWeekStartAt: new Date(),
    },
    update: {
      templateKey: template.key,
      weeklyFocusAttributeDefinitionId: weeklyFocusAttribute?.id ?? null,
      weeklyFocusWeekStartAt: new Date(),
    },
  });
}
