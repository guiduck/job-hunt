import { freelanceRepositories, requireOwnerScope, type OwnerScope } from "./repositories";

export async function listProspectingJobs(scope: OwnerScope, campaignId?: string) {
  const { userId } = requireOwnerScope(scope);
  return freelanceRepositories.jobs.findMany({
    where: { userId, ...(campaignId ? { campaignId } : {}) },
    orderBy: { createdAt: "desc" }
  });
}

export async function getProspectingJob(scope: OwnerScope, jobId: string) {
  const { userId } = requireOwnerScope(scope);
  return freelanceRepositories.jobs.findFirst({
    where: { id: jobId, userId }
  });
}
