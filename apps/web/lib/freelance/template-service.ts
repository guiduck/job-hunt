import { freelanceRepositories, type OwnerScope } from "./repositories";

export async function listCommercialTemplates(scope: OwnerScope) {
  return freelanceRepositories.templates.findMany({
    where: {
      OR: [{ userId: scope.userId }, { userId: null }],
      isActive: true
    },
    orderBy: [{ isDefault: "desc" }, { stage: "asc" }, { name: "asc" }]
  });
}
