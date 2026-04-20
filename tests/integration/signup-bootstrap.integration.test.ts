import { beforeEach, describe, expect, test, vi } from "vitest";

type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
};

type ProfileRecord = {
  userId: string;
  displayName: string;
  avatarOptionId: string;
  timezone: string;
  onboardingDone: boolean;
};

type UserAttributeRecord = {
  userId: string;
  attributeDefinitionId: string;
  currentValue: number;
  baseValue: number;
  potentialValue: number;
};

const memory = vi.hoisted(() => ({
  users: [] as UserRecord[],
  profiles: [] as ProfileRecord[],
  userAttributes: [] as UserAttributeRecord[],
  sessions: [] as { userId: string; tokenHash: string }[],
  avatarId: "avatar-1",
  definitions: [
    {
      id: "focus-id",
      defaultCurrentValue: 10.4,
      defaultBaseValue: 10,
      defaultPotentialValue: 15.8,
      scaleMin: 0,
      scaleMax: 20,
    },
    {
      id: "discipline-id",
      defaultCurrentValue: 10.2,
      defaultBaseValue: 9.8,
      defaultPotentialValue: 15.6,
      scaleMin: 0,
      scaleMax: 20,
    },
  ],
}));

vi.mock("@/shared/db/prisma-client", () => {
  return {
    prismaClient: {
      user: {
        findUnique: async ({ where }: { where: { email: string } }) => {
          return memory.users.find((user) => user.email === where.email) ?? null;
        },
        create: async ({ data }: { data: { email: string; passwordHash: string } }) => {
          const created = {
            id: `user-${memory.users.length + 1}`,
            email: data.email,
            passwordHash: data.passwordHash,
          };
          memory.users.push(created);
          return created;
        },
      },
      avatarOption: {
        findFirst: async () => ({ id: memory.avatarId }),
      },
      attributeDefinition: {
        findMany: async () => memory.definitions,
      },
      profile: {
        create: async ({ data }: { data: ProfileRecord }) => {
          memory.profiles.push(data);
          return data;
        },
      },
      userAttribute: {
        create: async ({ data }: { data: UserAttributeRecord & { minValue: number; maxValue: number; consistencyScore: number } }) => {
          memory.userAttributes.push({
            userId: data.userId,
            attributeDefinitionId: data.attributeDefinitionId,
            currentValue: data.currentValue,
            baseValue: data.baseValue,
            potentialValue: data.potentialValue,
          });
          return data;
        },
      },
      authSession: {
        create: async ({ data }: { data: { userId: string; tokenHash: string } }) => {
          memory.sessions.push(data);
          return data;
        },
      },
    },
  };
});

describe("integration: signup + bootstrap", () => {
  beforeEach(() => {
    memory.users.length = 0;
    memory.profiles.length = 0;
    memory.userAttributes.length = 0;
    memory.sessions.length = 0;
  });

  test("creates user, profile, bootstrapped attributes and session", async () => {
    const { signupUseCase } = await import("@/modules/auth/application/signup.use-case");

    const result = await signupUseCase({
      email: "new@hexis.app",
      password: "very-strong-password",
      displayName: "Hexis User",
    });

    expect(result.sessionToken.length).toBeGreaterThan(10);
    expect(memory.users).toHaveLength(1);
    expect(memory.profiles).toHaveLength(1);
    expect(memory.userAttributes).toHaveLength(memory.definitions.length);
    expect(memory.sessions).toHaveLength(1);
    expect(memory.profiles[0]?.displayName).toBe("Hexis User");
  });
});
