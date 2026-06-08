import { type CampaignStatus, type Prisma } from "@prisma/client";
import { campaignCreateSchema, campaignUpdateSchema } from "@/lib/validation/freelance";
import { freelanceRepositories, requireOwnerScope, type OwnerScope } from "./repositories";

export type NicheDto = {
  id: string;
  name: string;
  slug: string;
  market: string;
  conversionHint: number | null;
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
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function decimalToNumber(value: Prisma.Decimal | null | undefined) {
  return value == null ? null : Number(value);
}

function serializeNiche(niche: {
  id: string;
  name: string;
  slug: string;
  market: string;
  conversionHint: Prisma.Decimal | null;
  enabled: boolean;
  sortOrder: number;
}): NicheDto {
  return {
    ...niche,
    conversionHint: decimalToNumber(niche.conversionHint)
  };
}

function serializeCampaign(campaign: {
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
  lastRunAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): CampaignDto {
  return {
    ...campaign,
    conversionHintSnapshot: decimalToNumber(campaign.conversionHintSnapshot),
    lastRunAt: campaign.lastRunAt?.toISOString() ?? null,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString()
  };
}

export function buildCampaignName(input: { city: string; nicheName: string; marketScope: string }) {
  const marketLabel = input.marketScope === "BR" ? "BR" : "International";
  return `${input.nicheName} - ${input.city} (${marketLabel})`;
}

export async function listNiches() {
  const niches = await freelanceRepositories.niches.findMany({
    orderBy: [{ enabled: "desc" }, { sortOrder: "asc" }, { name: "asc" }]
  });
  return niches.map(serializeNiche);
}

export async function listCampaigns(scope: OwnerScope) {
  const { userId } = requireOwnerScope(scope);
  const campaigns = await freelanceRepositories.campaigns.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { niche: true }
  });
  return campaigns.map(serializeCampaign);
}

export async function createCampaign(scope: OwnerScope, payload: unknown) {
  const { userId } = requireOwnerScope(scope);
  const input = campaignCreateSchema.parse(payload);
  const niche = await freelanceRepositories.niches.findFirst({
    where: { id: input.nicheId, enabled: true }
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
          nicheName: niche.name,
          marketScope: input.marketScope
        }),
      marketScope: input.marketScope,
      country: input.country,
      region: input.region || null,
      state: input.state || null,
      city: input.city,
      nicheId: niche.id,
      nicheNameSnapshot: niche.name,
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
  return { leadCount: 0, hotLeadCount: 0, contactedCount: 0 };
}
