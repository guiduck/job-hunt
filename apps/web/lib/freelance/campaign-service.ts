import { type CampaignStatus, type Prisma } from "@prisma/client";
import { campaignCreateSchema, campaignUpdateSchema } from "@/lib/validation/freelance";
import { normalizeDisplayName } from "./niche-normalization";
import { freelanceRepositories, requireOwnerScope, type OwnerScope } from "./repositories";

export type NicheDto = {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  market: string;
  marketApplicability: string;
  conversionHint: number | null;
  conversionHintSource: string | null;
  aliases: string[];
  queryTerms: string[];
  sourcePath: string | null;
  sourceNote: string | null;
  lifecycleStatus: string;
  lastAuditedAt: string | null;
  enabled: boolean;
  sortOrder: number;
};

export type CampaignDto = {
  id: string;
  name: string;
  marketScope: "BR" | "INTERNATIONAL";
  country: string;
  region: string | null;
  state: string | null;
  city: string;
  nicheId: string;
  nicheNameSnapshot: string;
  conversionHintSnapshot: number | null;
  status: CampaignStatus;
  leadCount: number;
  hotLeadCount: number;
  contactedCount: number;
  notes: string | null;
  searchSettings: Record<string, unknown>;
  latestProspectingJob: ProspectingJobDto | null;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProspectingJobDto = {
  id: string;
  status: string;
  currentStep: string;
  providerName: string;
  providerStatus: string;
  providerErrorMessage: string | null;
  requestedMaxResults: number;
  inspectedCount: number;
  acceptedCount: number;
  duplicateCount: number;
  rejectedCount: number;
  failedCount: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function decimalToNumber(value: Prisma.Decimal | null | undefined) {
  return value == null ? null : Number(value);
}

function jsonObject(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function serializeProspectingJob(job: {
  id: string;
  status: string;
  currentStep: string;
  providerName: string;
  providerStatus: string;
  providerErrorMessage: string | null;
  requestedMaxResults: number;
  inspectedCount: number;
  acceptedCount: number;
  duplicateCount: number;
  rejectedCount: number;
  failedCount: number;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ProspectingJobDto {
  return {
    ...job,
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString()
  };
}

export function serializeNiche(niche: {
  id: string;
  name: string;
  displayName: string | null;
  slug: string;
  market: string;
  marketApplicability: string;
  conversionHint: Prisma.Decimal | null;
  conversionHintSource: string | null;
  aliases: Prisma.JsonValue;
  queryTerms: Prisma.JsonValue;
  sourcePath: string | null;
  sourceNote: string | null;
  lifecycleStatus: string;
  lastAuditedAt: Date | null;
  enabled: boolean;
  sortOrder: number;
}): NicheDto {
  const arrayValue = (value: Prisma.JsonValue) =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

  return {
    ...niche,
    displayName: niche.displayName ?? normalizeDisplayName(niche.name),
    conversionHint: decimalToNumber(niche.conversionHint),
    aliases: arrayValue(niche.aliases),
    queryTerms: arrayValue(niche.queryTerms),
    lastAuditedAt: niche.lastAuditedAt?.toISOString() ?? null
  };
}

export function isCampaignSelectableNiche(niche: {
  enabled: boolean;
  lifecycleStatus: string;
}) {
  return niche.enabled && niche.lifecycleStatus === "approved";
}

export function serializeCampaign(campaign: {
  id: string;
  name: string;
  marketScope: "BR" | "INTERNATIONAL";
  country: string;
  region: string | null;
  state: string | null;
  city: string;
  nicheId: string;
  nicheNameSnapshot: string;
  conversionHintSnapshot: Prisma.Decimal | null;
  status: CampaignStatus;
  leadCount: number;
  hotLeadCount: number;
  contactedCount: number;
  notes: string | null;
  searchSettings?: Prisma.JsonValue;
  jobs?: Array<{
    id: string;
    status: string;
    currentStep: string;
    providerName: string;
    providerStatus: string;
    providerErrorMessage: string | null;
    requestedMaxResults: number;
    inspectedCount: number;
    acceptedCount: number;
    duplicateCount: number;
    rejectedCount: number;
    failedCount: number;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  lastRunAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): CampaignDto {
  return {
    ...campaign,
    conversionHintSnapshot: decimalToNumber(campaign.conversionHintSnapshot),
    searchSettings: jsonObject(campaign.searchSettings ?? {}),
    latestProspectingJob: campaign.jobs?.[0] ? serializeProspectingJob(campaign.jobs[0]) : null,
    lastRunAt: campaign.lastRunAt?.toISOString() ?? null,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString()
  };
}

export function buildCampaignName(input: { city: string; nicheName: string; marketScope: string }) {
  const marketLabel = input.marketScope === "BR" ? "BR" : "International";
  return `${input.nicheName} - ${input.city} (${marketLabel})`;
}

export async function listNiches(options: { includeDisabled?: boolean; includeAuditFields?: boolean } = {}) {
  const niches = await freelanceRepositories.niches.findMany({
    where: options.includeDisabled ? undefined : { enabled: true, lifecycleStatus: "approved" },
    orderBy: [{ enabled: "desc" }, { sortOrder: "asc" }, { name: "asc" }]
  });
  return niches.map(serializeNiche);
}

export async function listCampaigns(scope: OwnerScope) {
  const { userId } = requireOwnerScope(scope);
  const campaigns = await freelanceRepositories.campaigns.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      niche: true,
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });
  return campaigns.map(serializeCampaign);
}

export async function createCampaign(scope: OwnerScope, payload: unknown) {
  const { userId } = requireOwnerScope(scope);
  const input = campaignCreateSchema.parse(payload);
  const niche = await freelanceRepositories.niches.findFirst({
    where: { id: input.nicheId, enabled: true, lifecycleStatus: "approved" }
  });

  if (!niche) {
    throw new Error("Selected niche is unavailable.");
  }

  const campaign = await freelanceRepositories.campaigns.create({
    data: {
      userId,
      name:
        input.name?.trim() ||
        buildCampaignName({
          city: input.city,
          nicheName: niche.displayName ?? normalizeDisplayName(niche.name),
          marketScope: input.marketScope
        }),
      marketScope: input.marketScope,
      country: input.country,
      region: input.region || null,
      state: input.state || null,
      city: input.city,
      nicheId: niche.id,
      nicheNameSnapshot: niche.displayName ?? normalizeDisplayName(niche.name),
      conversionHintSnapshot: niche.conversionHint,
      status: "ready",
      searchSettings: input.searchSettings as Prisma.InputJsonObject
    }
  });

  return serializeCampaign(campaign);
}

export async function updateCampaign(scope: OwnerScope, campaignId: string, payload: unknown) {
  const { userId } = requireOwnerScope(scope);
  const input = campaignUpdateSchema.parse(payload);
  const existing = await freelanceRepositories.campaigns.findFirst({
    where: { id: campaignId, userId }
  });

  if (!existing) {
    return null;
  }

  const campaign = await freelanceRepositories.campaigns.update({
    where: { id: campaignId },
    data: {
      ...(input.name !== undefined ? { name: input.name || existing.name } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
      ...(input.searchSettings !== undefined
        ? { searchSettings: input.searchSettings as Prisma.InputJsonObject }
        : {})
    }
  });

  return serializeCampaign(campaign);
}

export async function refreshCampaignCounters(_scope: OwnerScope, _campaignId: string) {
  const { userId } = requireOwnerScope(_scope);
  const [leadCount, hotLeadCount, contactedCount] = await Promise.all([
    freelanceRepositories.leads.count({ where: { userId, campaignId: _campaignId } }),
    freelanceRepositories.leads.count({
      where: { userId, campaignId: _campaignId, temperature: "hot" }
    }),
    freelanceRepositories.leads.count({
      where: { userId, campaignId: _campaignId, commercialStatus: "contacted" }
    })
  ]);

  await freelanceRepositories.campaigns.update({
    where: { id: _campaignId },
    data: { leadCount, hotLeadCount, contactedCount }
  });

  return { leadCount, hotLeadCount, contactedCount };
}
