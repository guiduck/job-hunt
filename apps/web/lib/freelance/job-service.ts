import { freelanceRepositories, requireOwnerScope, type OwnerScope } from "./repositories";
import {
  assertProspectingProviderConfigured,
  isProspectingProviderName,
  type ProspectingProviderName
} from "@/lib/providers/provider-factory";
import type { Prisma, ProspectingJobStatus } from "@prisma/client";

function maxResultsFromSearchSettings(searchSettings: Prisma.JsonValue) {
  if (!searchSettings || typeof searchSettings !== "object" || Array.isArray(searchSettings)) {
    return undefined;
  }
  const value = (searchSettings as Record<string, unknown>).maxResults;
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function clampMaxResults(value: number | undefined) {
  return Math.min(Math.max(value ?? 50, 1), 100);
}

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

export async function createProspectingJob(
  scope: OwnerScope,
  campaignId: string,
  payload: { maxResults?: number; providerName?: string } = {}
) {
  const { userId } = requireOwnerScope(scope);
  const campaign = await freelanceRepositories.campaigns.findFirst({
    where: { id: campaignId, userId },
    include: { niche: true }
  });

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  const activeJob = await freelanceRepositories.jobs.findFirst({
    where: {
      campaignId,
      userId,
      status: { in: ["pending", "running"] satisfies ProspectingJobStatus[] }
    }
  });

  if (activeJob) {
    throw new Error("Campaign already has an active prospecting job.");
  }

  const sourceQuery = [
    campaign.nicheNameSnapshot,
    campaign.city,
    campaign.state,
    campaign.region,
    campaign.country
  ]
    .filter(Boolean)
    .join(" ");

  const requestedProvider = payload.providerName ?? "";
  const providerName: ProspectingProviderName = isProspectingProviderName(requestedProvider)
    ? requestedProvider
    : "serpapi_google_maps";
  assertProspectingProviderConfigured(providerName);

  await freelanceRepositories.campaigns.update({
    where: { id: campaignId },
    data: { status: "collecting", lastRunAt: new Date() }
  });

  return freelanceRepositories.jobs.create({
    data: {
      userId,
      campaignId,
      providerName,
      sourceQuery,
      requestedMaxResults: clampMaxResults(
        payload.maxResults ?? maxResultsFromSearchSettings(campaign.searchSettings)
      )
    }
  });
}
