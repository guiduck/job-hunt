import { type Prisma } from "@prisma/client";
import { nicheCandidateDecisionInputSchema } from "@/lib/validation/niche-catalog";
import { serializeNiche } from "./campaign-service";
import { createNiche, NicheServiceError } from "./niche-service";
import { normalizeAlias, normalizeDisplayName, slugifyNiche, uniqueNormalizedTerms } from "./niche-normalization";
import { VISUAL_CANDIDATE_NICHES, type VisualCandidateReference } from "./niche-reference-data";
import { freelanceRepositories } from "./repositories";

export type NicheCandidateDto = {
  id: string;
  proposedName: string;
  normalizedName: string;
  proposedSlug: string;
  marketApplicability: string;
  proposedConversionHint: number | null;
  proposedQueryTerms: string[];
  sourcePath: string;
  sourceExcerpt: string | null;
  sourceNote: string | null;
  status: string;
  matchedNicheId: string | null;
  matchedNicheName?: string | null;
  decisionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type CandidateLike = {
  proposedName: string;
  proposedSlug: string;
  proposedQueryTerms?: string[];
};

type ApprovedNicheLike = {
  id: string;
  slug: string;
  name?: string | null;
  displayName?: string | null;
  aliases?: unknown;
  queryTerms?: unknown;
  enabled?: boolean;
  lifecycleStatus?: string;
};

type CandidateRow = {
  id: string;
  proposedName: string;
  normalizedName: string;
  proposedSlug: string;
  marketApplicability: string;
  proposedConversionHint: Prisma.Decimal | number | null;
  proposedQueryTerms: Prisma.JsonValue;
  sourcePath: string;
  sourceExcerpt: string | null;
  sourceNote: string | null;
  status: string;
  matchedNicheId: string | null;
  decisionReason: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  matchedNiche?: { displayName: string | null; name: string } | null;
};

export class NicheCandidateServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "NicheCandidateServiceError";
  }
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function decimalToNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) {
    return null;
  }
  return typeof value === "number" ? value : Number(value.toString());
}

function nicheKeys(niche: ApprovedNicheLike) {
  if (niche.enabled === false || niche.lifecycleStatus === "disabled" || niche.lifecycleStatus === "merged") {
    return new Set<string>();
  }

  return new Set(
    [
      niche.slug,
      niche.displayName,
      niche.name,
      ...asStringArray(niche.aliases),
      ...asStringArray(niche.queryTerms)
    ]
      .filter((value): value is string => Boolean(value))
      .flatMap((value) => [slugifyNiche(value), normalizeAlias(value)])
      .filter(Boolean)
  );
}

function candidateKeys(candidate: CandidateLike) {
  return new Set(
    [candidate.proposedSlug, candidate.proposedName, ...(candidate.proposedQueryTerms ?? [])]
      .filter(Boolean)
      .flatMap((value) => [slugifyNiche(value), normalizeAlias(value)])
      .filter(Boolean)
  );
}

export function findApprovedNicheMatch<T extends ApprovedNicheLike>(
  candidate: CandidateLike,
  approvedNiches: T[]
): T | null {
  const proposed = candidateKeys(candidate);
  return (
    approvedNiches.find((niche) => {
      for (const key of nicheKeys(niche)) {
        if (proposed.has(key)) {
          return true;
        }
      }
      return false;
    }) ?? null
  );
}

export function buildReferenceCandidateProposals(approvedNiches: ApprovedNicheLike[]) {
  return VISUAL_CANDIDATE_NICHES.map((candidate) => {
    const normalizedName = normalizeDisplayName(candidate.proposedName);
    const match = findApprovedNicheMatch(candidate, approvedNiches);

    return {
      proposedName: normalizedName,
      normalizedName,
      proposedSlug: candidate.proposedSlug || slugifyNiche(normalizedName),
      marketApplicability: candidate.marketApplicability,
      proposedConversionHint: candidate.proposedConversionHint,
      proposedQueryTerms: uniqueNormalizedTerms(candidate.proposedQueryTerms),
      sourcePath: candidate.sourcePath,
      sourceExcerpt: candidate.sourceNote,
      sourceNote: candidate.sourceNote,
      status: "proposed" as const,
      matchedNicheId: match?.id ?? null
    };
  });
}

export function referenceCandidateInput(candidate: VisualCandidateReference) {
  const normalizedName = normalizeDisplayName(candidate.proposedName);

  return {
    proposedName: normalizedName,
    normalizedName,
    proposedSlug: candidate.proposedSlug || slugifyNiche(normalizedName),
    marketApplicability: candidate.marketApplicability,
    proposedConversionHint: candidate.proposedConversionHint,
    proposedQueryTerms: uniqueNormalizedTerms(candidate.proposedQueryTerms),
    sourcePath: candidate.sourcePath,
    sourceExcerpt: candidate.sourceNote,
    sourceNote: candidate.sourceNote
  };
}

export function serializeNicheCandidate(candidate: CandidateRow): NicheCandidateDto {
  return {
    id: candidate.id,
    proposedName: candidate.proposedName,
    normalizedName: candidate.normalizedName,
    proposedSlug: candidate.proposedSlug,
    marketApplicability: candidate.marketApplicability,
    proposedConversionHint: decimalToNumber(candidate.proposedConversionHint),
    proposedQueryTerms: asStringArray(candidate.proposedQueryTerms),
    sourcePath: candidate.sourcePath,
    sourceExcerpt: candidate.sourceExcerpt,
    sourceNote: candidate.sourceNote,
    status: candidate.status,
    matchedNicheId: candidate.matchedNicheId,
    matchedNicheName: candidate.matchedNiche
      ? candidate.matchedNiche.displayName ?? normalizeDisplayName(candidate.matchedNiche.name)
      : null,
    decisionReason: candidate.decisionReason,
    reviewedAt: candidate.reviewedAt?.toISOString() ?? null,
    createdAt: candidate.createdAt.toISOString(),
    updatedAt: candidate.updatedAt.toISOString()
  };
}

export async function listNicheCandidates(filters: { status?: string | null; market?: string | null } = {}) {
  const rows = await freelanceRepositories.nicheCandidates.findMany({
    where: {
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(filters.market ? { marketApplicability: filters.market } : {})
    },
    orderBy: [{ status: "asc" }, { proposedName: "asc" }],
    include: { matchedNiche: { select: { displayName: true, name: true } } }
  });

  return rows.map(serializeNicheCandidate);
}

async function loadCandidate(candidateId: string) {
  const candidate = await freelanceRepositories.nicheCandidates.findUnique({
    where: { id: candidateId },
    include: { matchedNiche: { select: { displayName: true, name: true } } }
  });

  if (!candidate) {
    throw new NicheCandidateServiceError("Candidate not found.", 404);
  }

  return candidate;
}

function approvedPayloadFromCandidate(candidate: CandidateRow, overrides: Record<string, unknown> | undefined) {
  return {
    displayName: candidate.proposedName,
    marketApplicability: candidate.marketApplicability,
    conversionHint: decimalToNumber(candidate.proposedConversionHint) ?? undefined,
    conversionHintSource: "visual_reference",
    aliases: [],
    queryTerms: asStringArray(candidate.proposedQueryTerms),
    sourcePath: candidate.sourcePath,
    sourceNote: candidate.sourceNote ?? candidate.sourceExcerpt ?? "Reference-derived niche candidate.",
    enabled: true,
    sortOrder: 0,
    ...overrides
  };
}

export async function decideNicheCandidate(candidateId: string, payload: unknown) {
  const input = nicheCandidateDecisionInputSchema.parse(payload);
  const candidate = await loadCandidate(candidateId);
  const reviewedAt = new Date();

  if (input.decision === "approve") {
    try {
      const niche = await createNiche(approvedPayloadFromCandidate(candidate, input.approvedOverrides));
      const updated = await freelanceRepositories.nicheCandidates.update({
        where: { id: candidateId },
        data: {
          status: "approved",
          matchedNicheId: niche.id,
          decisionReason: input.decisionReason ?? "Approved into governed catalog.",
          reviewedAt
        },
        include: { matchedNiche: { select: { displayName: true, name: true } } }
      });
      return serializeNicheCandidate(updated);
    } catch (error) {
      if (error instanceof NicheServiceError) {
        throw new NicheCandidateServiceError(error.message, error.statusCode);
      }
      throw error;
    }
  }

  const status =
    input.decision === "reject"
      ? "rejected"
      : input.decision === "defer"
        ? "deferred"
        : "already_covered";

  const updated = await freelanceRepositories.nicheCandidates.update({
    where: { id: candidateId },
    data: {
      status,
      matchedNicheId: input.matchedNicheId ?? candidate.matchedNicheId,
      decisionReason: input.decisionReason ?? null,
      reviewedAt
    },
    include: { matchedNiche: { select: { displayName: true, name: true } } }
  });

  return serializeNicheCandidate(updated);
}
