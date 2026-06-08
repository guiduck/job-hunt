import { freelanceRepositories, requireOwnerScope, type OwnerScope } from "./repositories";

export async function getLatestGeneratedText(scope: OwnerScope, leadId: string) {
  const { userId } = requireOwnerScope(scope);
  return freelanceRepositories.generatedTexts.findMany({
    where: { userId, leadId },
    orderBy: { updatedAt: "desc" }
  });
}
