import { type Prisma } from "@prisma/client";
import {
  nicheCreateSchema,
  nicheUpdateSchema,
  type NicheCreateInput,
  type NicheUpdateInput
} from "@/lib/validation/niche-catalog";
import {
  normalizeAlias,
  normalizeDisplayName,
  slugifyNiche,
  uniqueNormalizedTerms
} from "./niche-normalization";
import { freelanceRepositories } from "./repositories";

type ExistingNicheForConflict = {
  id: string;
  slug: string;
  displayName: string | null;
  aliases: Prisma.JsonValue;
  enabled: boolean;
  lifecycleStatus: string;
};

export class NicheServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "NicheServiceError";
  }
}

function jsonStringArray(value: Prisma.JsonValue | string[] | undefined | null): string[] {
  return Array.isArray(value)
    ? (value as unknown[]).filter((item): item is string => typeof item === "string")
    : [];
}

function activeConflictKeys(niche: ExistingNicheForConflict) {
  if (!niche.enabled || niche.lifecycleStatus !== "approved") {
    return new Set<string>();
  }

  return new Set(
    [
      niche.slug,
      niche.displayName ? slugifyNiche(niche.displayName) : "",
      ...jsonStringArray(niche.aliases).map(slugifyNiche)
    ]
      .filter(Boolean)
      .map((value) => normalizeAlias(value))
  );
}

function proposedConflictKeys(input: {
  displayName: string;
  slug?: string;
  aliases?: string[];
}) {
  return new Set(
    [input.slug ?? slugifyNiche(input.displayName), slugifyNiche(input.displayName), ...(input.aliases ?? []).map(slugifyNiche)]
      .filter(Boolean)
      .map((value) => normalizeAlias(value))
  );
}

export function findNicheConflicts(
  input: { displayName: string; slug?: string; aliases?: string[] },
  existing: ExistingNicheForConflict[],
  options: { ignoreId?: string } = {}
) {
  const proposed = proposedConflictKeys(input);

  return existing.filter((niche) => {
    if (options.ignoreId && niche.id === options.ignoreId) {
      return false;
    }
    for (const key of activeConflictKeys(niche)) {
      if (proposed.has(key)) {
        return true;
      }
    }
    return false;
  });
}

export function assertSourceEvidence(input: {
  enabled?: boolean;
  lifecycleStatus?: string;
  queryTerms?: string[];
  sourcePath?: string | null;
  sourceNote?: string | null;
  conversionHint?: number | null;
  conversionHintSource?: string | null;
}) {
  const active = input.enabled !== false && (input.lifecycleStatus ?? "approved") === "approved";
  if (!active) {
    return;
  }

  if (!input.sourcePath?.trim() || !input.sourceNote?.trim()) {
    throw new NicheServiceError("Approved niches require source evidence.", 422);
  }
  if (!input.queryTerms?.length) {
    throw new NicheServiceError("Approved niches require at least one query term.", 422);
  }
  if (input.conversionHint != null && !input.conversionHintSource) {
    throw new NicheServiceError("Conversion hints require a source.", 422);
  }
}

export function assertLifecycleUpdate(input: {
  id: string;
  lifecycleStatus?: string;
  mergedIntoNicheId?: string | null;
}) {
  if (input.lifecycleStatus === "merged" && input.mergedIntoNicheId === input.id) {
    throw new NicheServiceError("A niche cannot be merged into itself.", 422);
  }
}

function writeDataFromInput(input: NicheCreateInput | NicheUpdateInput) {
  const aliases = uniqueNormalizedTerms(input.aliases ?? []);
  const queryTerms = uniqueNormalizedTerms(input.queryTerms ?? []);
  const displayName = input.displayName ? normalizeDisplayName(input.displayName) : undefined;

  return {
    ...(displayName !== undefined
      ? {
          name: displayName,
          displayName,
          slug: slugifyNiche(displayName)
        }
      : {}),
    ...(input.marketApplicability !== undefined
      ? {
          market: input.marketApplicability,
          marketApplicability: input.marketApplicability
        }
      : {}),
    ...(input.conversionHint !== undefined ? { conversionHint: input.conversionHint } : {}),
    ...(input.conversionHintSource !== undefined
      ? { conversionHintSource: input.conversionHintSource }
      : {}),
    ...(input.aliases !== undefined ? { aliases } : {}),
    ...(input.queryTerms !== undefined ? { queryTerms, defaultTerms: queryTerms } : {}),
    ...(input.sourcePath !== undefined ? { sourcePath: input.sourcePath } : {}),
    ...(input.sourceNote !== undefined ? { sourceNote: input.sourceNote } : {}),
    ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
    ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {})
  };
}

async function activeNichesForConflict() {
  return freelanceRepositories.niches.findMany({
    select: {
      id: true,
      slug: true,
      displayName: true,
      aliases: true,
      enabled: true,
      lifecycleStatus: true
    }
  });
}

export async function createNiche(payload: unknown) {
  const input = nicheCreateSchema.parse(payload);
  assertSourceEvidence(input);

  const conflicts = findNicheConflicts(input, await activeNichesForConflict());
  if (conflicts.length) {
    throw new NicheServiceError("An approved niche already uses this slug or alias.", 409);
  }

  const displayName = normalizeDisplayName(input.displayName);
  return freelanceRepositories.niches.create({
    data: {
      ...writeDataFromInput(input),
      name: displayName,
      displayName,
      slug: slugifyNiche(displayName)
    }
  });
}

export async function updateNiche(nicheId: string, payload: unknown) {
  const input = nicheUpdateSchema.parse(payload);
  assertLifecycleUpdate({ id: nicheId, ...input });

  const existing = await freelanceRepositories.niches.findUnique({ where: { id: nicheId } });
  if (!existing) {
    throw new NicheServiceError("Niche not found.", 404);
  }

  if (input.lifecycleStatus === "merged") {
    const target = await freelanceRepositories.niches.findFirst({
      where: { id: input.mergedIntoNicheId ?? undefined, enabled: true, lifecycleStatus: "approved" }
    });
    if (!target) {
      throw new NicheServiceError("Merge target must be an enabled approved niche.", 422);
    }
  }

  const mergedForValidation = {
    enabled: input.lifecycleStatus === "merged" || input.lifecycleStatus === "disabled" ? false : (input.enabled ?? existing.enabled),
    lifecycleStatus: input.lifecycleStatus ?? existing.lifecycleStatus,
    queryTerms: input.queryTerms ?? jsonStringArray(existing.queryTerms),
    sourcePath: input.sourcePath ?? existing.sourcePath,
    sourceNote: input.sourceNote ?? existing.sourceNote,
    conversionHint: input.conversionHint ?? (existing.conversionHint == null ? null : Number(existing.conversionHint)),
    conversionHintSource: input.conversionHintSource ?? existing.conversionHintSource
  };
  assertSourceEvidence(mergedForValidation);

  if (mergedForValidation.enabled && mergedForValidation.lifecycleStatus === "approved") {
    const conflictInput = {
      displayName: input.displayName ?? existing.displayName ?? existing.name,
      aliases: input.aliases ?? jsonStringArray(existing.aliases)
    };
    const conflicts = findNicheConflicts(conflictInput, await activeNichesForConflict(), {
      ignoreId: nicheId
    });
    if (conflicts.length) {
      throw new NicheServiceError("An approved niche already uses this slug or alias.", 409);
    }
  }

  const lifecycleData =
    input.lifecycleStatus === "merged"
      ? { lifecycleStatus: "merged" as const, enabled: false, mergedIntoNicheId: input.mergedIntoNicheId }
      : input.lifecycleStatus === "disabled"
        ? { lifecycleStatus: "disabled" as const, enabled: false, mergedIntoNicheId: null }
        : input.lifecycleStatus === "approved"
          ? { lifecycleStatus: "approved" as const, enabled: input.enabled ?? true, mergedIntoNicheId: null }
          : {};

  return freelanceRepositories.niches.update({
    where: { id: nicheId },
    data: {
      ...writeDataFromInput(input),
      ...lifecycleData
    } satisfies Prisma.FreelanceNicheUpdateInput
  });
}
