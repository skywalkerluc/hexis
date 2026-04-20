import { beforeEach, describe, expect, test, vi } from "vitest";

type UserAttributeRecord = {
  id: string;
  userId: string;
  attributeDefinitionId: string;
  currentValue: { toNumber(): number };
  baseValue: { toNumber(): number };
  potentialValue: { toNumber(): number };
  minValue: { toNumber(): number };
  maxValue: { toNumber(): number };
  consistencyScore: number;
  status: string;
  attributeDefinition: {
    defaultCurrentValue: { toNumber(): number };
    defaultBaseValue: { toNumber(): number };
    defaultPotentialValue: { toNumber(): number };
  };
};

const memory = vi.hoisted(() => ({
  userOnboarding: [] as { userId: string; templateId: string }[],
  profile: { userId: "user-1", onboardingDone: false },
  logs: [] as { userAttributeId: string; explanation: string }[],
  attributes: [] as UserAttributeRecord[],
  template: {
    id: "template-deep-work",
    key: "deep-work",
    label: "Deep Work",
    attributes: [{ attributeDefinitionId: "focus-id", emphasisWeight: { toNumber: () => 1.4 } }],
  },
}));

function decimal(value: number): { toNumber(): number } {
  return {
    toNumber: () => value,
  };
}

vi.mock("@/shared/db/prisma-client", () => {
  return {
    prismaClient: {
      onboardingTemplate: {
        findUnique: async () => memory.template,
      },
      $transaction: async <T>(callback: (tx: unknown) => Promise<T>) => {
        const tx = {
          userOnboarding: {
            upsert: async ({ create }: { create: { userId: string; templateId: string } }) => {
              memory.userOnboarding = [{ userId: create.userId, templateId: create.templateId }];
              return create;
            },
          },
          profile: {
            update: async ({ data }: { data: { onboardingDone: boolean } }) => {
              memory.profile.onboardingDone = data.onboardingDone;
              return memory.profile;
            },
          },
          userAttribute: {
            findMany: async () => memory.attributes,
            update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
              const target = memory.attributes.find((attribute) => attribute.id === where.id);
              if (!target) {
                throw new Error("attribute not found");
              }
              target.currentValue = decimal(Number(data.currentValue));
              target.baseValue = decimal(Number(data.baseValue));
              target.potentialValue = decimal(Number(data.potentialValue));
              target.status = String(data.status);
              target.consistencyScore = Number(data.consistencyScore);
              return target;
            },
          },
          attributeHistoryLog: {
            create: async ({ data }: { data: { userAttributeId: string; explanation: string } }) => {
              memory.logs.push(data);
              return data;
            },
          },
        };

        return callback(tx);
      },
    },
  };
});

describe("integration: onboarding template effect", () => {
  beforeEach(() => {
    memory.userOnboarding.length = 0;
    memory.profile.onboardingDone = false;
    memory.logs.length = 0;
    memory.attributes = [
      {
        id: "ua-focus",
        userId: "user-1",
        attributeDefinitionId: "focus-id",
        currentValue: decimal(10),
        baseValue: decimal(10),
        potentialValue: decimal(15),
        minValue: decimal(0),
        maxValue: decimal(20),
        consistencyScore: 0,
        status: "STABLE",
        attributeDefinition: {
            defaultCurrentValue: decimal(10),
            defaultBaseValue: decimal(10),
            defaultPotentialValue: decimal(15),
        },
      },
      {
        id: "ua-energy",
        userId: "user-1",
        attributeDefinitionId: "energy-id",
        currentValue: decimal(10),
        baseValue: decimal(10),
        potentialValue: decimal(15),
        minValue: decimal(0),
        maxValue: decimal(20),
        consistencyScore: 0,
        status: "STABLE",
        attributeDefinition: {
            defaultCurrentValue: decimal(10),
            defaultBaseValue: decimal(10),
            defaultPotentialValue: decimal(15),
        },
      },
    ];
  });

  test("changes starting state based on selected template", async () => {
    const { completeOnboardingUseCase } = await import(
      "@/modules/onboarding/application/complete-onboarding.use-case"
    );

    await completeOnboardingUseCase({ userId: "user-1", templateKey: "deep-work" });

    const focus = memory.attributes.find((attribute) => attribute.id === "ua-focus");
    const energy = memory.attributes.find((attribute) => attribute.id === "ua-energy");

    expect(memory.profile.onboardingDone).toBe(true);
    expect(focus?.currentValue.toNumber()).toBeGreaterThan(10);
    expect(energy?.currentValue.toNumber()).toBeLessThan(10);
    expect(memory.logs).toHaveLength(2);
  });
});
