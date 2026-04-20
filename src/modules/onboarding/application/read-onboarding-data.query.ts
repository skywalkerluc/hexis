import { prismaClient } from "@/shared/db/prisma-client";

export type OnboardingTemplateView = {
  key: string;
  label: string;
  description: string;
  attributes: string[];
  isDefault: boolean;
};

export async function readOnboardingTemplates(): Promise<OnboardingTemplateView[]> {
  const templates = await prismaClient.onboardingTemplate.findMany({
    include: {
      attributes: {
        include: {
          attributeDefinition: {
            select: { name: true },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: [{ isDefault: "desc" }, { key: "asc" }],
  });

  return templates.map((template) => ({
    key: template.key,
    label: template.label,
    description: template.description,
    isDefault: template.isDefault,
    attributes: template.attributes.map((item) => item.attributeDefinition.name),
  }));
}
