import { beforeEach, describe, expect, test, vi } from "vitest";

type AttributeState = {
  id: string;
  userId: string;
  attributeDefinitionId: string;
  currentValue: { toNumber(): number };
  baseValue: { toNumber(): number };
  potentialValue: { toNumber(): number };
  minValue: { toNumber(): number };
  maxValue: { toNumber(): number };
  status: string;
  consistencyScore: number;
  attributeDefinition: {
    slug: string;
    impactRules: {
      maintenanceBoostCurrent: { toNumber(): number };
      maintenanceBoostBase: { toNumber(): number };
      maintenanceBoostPotential: { toNumber(): number };
      recoveryBoostCurrent: { toNumber(): number };
      recoveryBoostBase: { toNumber(): number };
      recoveryBoostPotential: { toNumber(): number };
    }[];
  };
};

const store = vi.hoisted(() => ({
  events: [] as { id: string; userId: string }[],
  impacts: [] as { eventId: string; userAttributeId: string }[],
  logs: [] as { userAttributeId: string; causeType: string }[],
  attributes: [] as AttributeState[],
}));

function cloneAttributes(attributes: AttributeState[]): AttributeState[] {
  return attributes.map((attribute) => ({
    ...attribute,
    attributeDefinition: {
      ...attribute.attributeDefinition,
      impactRules: [...attribute.attributeDefinition.impactRules],
    },
  }));
}

function decimal(value: number): { toNumber(): number } {
  return {
    toNumber: () => value,
  };
}

vi.mock("@/shared/db/prisma-client", () => {
  return {
    prismaClient: {
      $transaction: async <T>(callback: (tx: unknown) => Promise<T>) => {
        const snapshot = {
          events: [...store.events],
          impacts: [...store.impacts],
          logs: [...store.logs],
          attributes: cloneAttributes(store.attributes),
        };

        const tx = {
          userAttribute: {
            findMany: async ({ where }: { where: { id: { in: string[] }; userId: string } }) =>
              store.attributes.filter(
                (attribute) =>
                  where.id.in.includes(attribute.id) && attribute.userId === where.userId,
              ),
            update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
              const target = store.attributes.find((attribute) => attribute.id === where.id);
              if (!target) {
                throw new Error("Attribute not found");
              }
              target.currentValue = decimal(Number(data.currentValue));
              target.baseValue = decimal(Number(data.baseValue));
              target.potentialValue = decimal(Number(data.potentialValue));
              target.status = String(data.status);
              if (typeof data.lastEventAt === "object") {
                void data.lastEventAt;
              }
              return target;
            },
          },
          evidenceEvent: {
            create: async ({ data }: { data: { userId: string } }) => {
              const created = { id: `event-${store.events.length + 1}`, userId: data.userId };
              store.events.push(created);
              return created;
            },
          },
          evidenceEventImpact: {
            create: async ({ data }: { data: { eventId: string; userAttributeId: string } }) => {
              store.impacts.push(data);
              return data;
            },
          },
          attributeHistoryLog: {
            create: async ({ data }: { data: { userAttributeId: string; causeType: string } }) => {
              store.logs.push(data);
              return data;
            },
          },
        };

        try {
          return await callback(tx);
        } catch (error: unknown) {
          store.events = [...snapshot.events];
          store.impacts = [...snapshot.impacts];
          store.logs = [...snapshot.logs];
          store.attributes = cloneAttributes(snapshot.attributes);
          throw error;
        }
      },
    },
  };
});

describe("integration: evidence event atomicity", () => {
  beforeEach(() => {
    store.events.length = 0;
    store.impacts.length = 0;
    store.logs.length = 0;
    store.attributes = [
      {
        id: "ua-focus",
        userId: "user-1",
        attributeDefinitionId: "focus",
        currentValue: decimal(10),
        baseValue: decimal(9.5),
        potentialValue: decimal(15),
        minValue: decimal(0),
        maxValue: decimal(20),
        status: "STABLE",
        consistencyScore: 0,
        attributeDefinition: {
          slug: "focus",
          impactRules: [
            {
              maintenanceBoostCurrent: decimal(0.2),
              maintenanceBoostBase: decimal(0.03),
              maintenanceBoostPotential: decimal(0.02),
              recoveryBoostCurrent: decimal(0.05),
              recoveryBoostBase: decimal(0),
              recoveryBoostPotential: decimal(0),
            },
          ],
        },
      },
      {
        id: "ua-energy",
        userId: "user-1",
        attributeDefinitionId: "energy",
        currentValue: decimal(9.8),
        baseValue: decimal(9.7),
        potentialValue: decimal(15.2),
        minValue: decimal(0),
        maxValue: decimal(20),
        status: "STABLE",
        consistencyScore: 0,
        attributeDefinition: {
          slug: "energy",
          impactRules: [
            {
              maintenanceBoostCurrent: decimal(0.2),
              maintenanceBoostBase: decimal(0.03),
              maintenanceBoostPotential: decimal(0.02),
              recoveryBoostCurrent: decimal(0.05),
              recoveryBoostBase: decimal(0),
              recoveryBoostPotential: decimal(0),
            },
          ],
        },
      },
    ];
  });

  test("applies event, impacts and history in one atomic operation", async () => {
    const { createEvidenceEventUseCase } = await import(
      "@/modules/evidence/application/create-evidence-event.use-case"
    );

    const result = await createEvidenceEventUseCase({
      userId: "user-1",
      title: "Deep work block",
      eventType: "TRAINING",
      intensity: "INTENSE",
      occurredAt: new Date("2026-04-20T10:00:00.000Z"),
      userAttributeIds: ["ua-focus", "ua-energy"],
    });

    expect(result.eventId).toBe("event-1");
    expect(store.events).toHaveLength(1);
    expect(store.impacts).toHaveLength(2);
    expect(store.logs).toHaveLength(2);
    expect(store.attributes[0]?.currentValue.toNumber()).toBeGreaterThan(10);
    expect(store.attributes[1]?.currentValue.toNumber()).toBeGreaterThan(9.8);
  });
});
