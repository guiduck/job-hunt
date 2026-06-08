import { freelanceRepositories, requireOwnerScope, type OwnerScope } from "./repositories";

export async function listLeads(scope: OwnerScope) {
  const { userId } = requireOwnerScope(scope);
  return freelanceRepositories.leads.findMany({
    where: { userId },
    orderBy: { capturedAt: "desc" }
  });
}

export async function getLead(scope: OwnerScope, leadId: string) {
  const { userId } = requireOwnerScope(scope);
  return freelanceRepositories.leads.findFirst({
    where: { id: leadId, userId },
    include: { websiteAnalyses: true, latestGenerated: true }
  });
}
