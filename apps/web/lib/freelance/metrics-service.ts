import { freelanceRepositories, requireOwnerScope, type OwnerScope } from "./repositories";

export async function getDashboardMetrics(scope: OwnerScope) {
  const { userId } = requireOwnerScope(scope);
  const [totalLeads, hotLeads, contactedLeads] = await Promise.all([
    freelanceRepositories.leads.count({ where: { userId } }),
    freelanceRepositories.leads.count({ where: { userId, temperature: "hot" } }),
    freelanceRepositories.leads.count({ where: { userId, commercialStatus: "contacted" } })
  ]);

  return { totalLeads, hotLeads, contactedLeads };
}

export async function listRecentLeads(scope: OwnerScope, limit = 5) {
  const { userId } = requireOwnerScope(scope);
  return freelanceRepositories.leads.findMany({
    where: { userId },
    orderBy: { capturedAt: "desc" },
    take: limit
  });
}
