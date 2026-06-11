import { freelanceRepositories, type OwnerScope } from "./repositories";
import { commercialTemplateSchema } from "@/lib/validation/freelance";

export async function listCommercialTemplates(scope: OwnerScope) {
  return freelanceRepositories.templates.findMany({
    where: {
      OR: [{ userId: scope.userId }, { userId: null }],
      isActive: true
    },
    orderBy: [{ isDefault: "desc" }, { stage: "asc" }, { name: "asc" }]
  });
}

export async function createCommercialTemplate(scope: OwnerScope, payload: unknown) {
  const input = commercialTemplateSchema.parse(payload);
  return freelanceRepositories.templates.create({
    data: {
      userId: scope.userId,
      name: input.name,
      stage: input.stage,
      category: input.category,
      channel: input.channel,
      bodyTemplate: input.bodyTemplate,
      isActive: input.isActive
    }
  });
}

export async function updateCommercialTemplate(
  scope: OwnerScope,
  templateId: string,
  payload: unknown
) {
  const input = commercialTemplateSchema.partial().parse(payload);
  const existing = await freelanceRepositories.templates.findFirst({
    where: { id: templateId, userId: scope.userId }
  });
  if (!existing) {
    return null;
  }
  return freelanceRepositories.templates.update({
    where: { id: templateId },
    data: input
  });
}

export async function deleteCommercialTemplate(scope: OwnerScope, templateId: string) {
  const existing = await freelanceRepositories.templates.findFirst({
    where: { id: templateId, userId: scope.userId }
  });
  if (!existing) {
    return null;
  }
  return freelanceRepositories.templates.update({
    where: { id: templateId },
    data: { isActive: false }
  });
}
