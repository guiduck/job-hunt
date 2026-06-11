import { BASELINE_NICHES } from "@/lib/freelance/niche-reference-data";
import type { AuditableNicheRow } from "@/lib/freelance/niche-audit-types";

export function catalogRowsFromBaseline(overrides: Partial<AuditableNicheRow> = {}): AuditableNicheRow[] {
  return BASELINE_NICHES.map((niche, index) => ({
    id: `niche-${index + 1}`,
    name: niche.sourceName,
    displayName: niche.displayName,
    slug: niche.slug,
    enabled: true,
    conversionHint: niche.conversionHint,
    conversionHintSource: niche.conversionHintSource,
    sourcePath: niche.sourcePath,
    sourceNote: niche.sourceNote,
    aliases: niche.aliases,
    queryTerms: niche.queryTerms,
    lifecycleStatus: "approved",
    ...overrides
  }));
}

export function findFixtureNiche(rows: AuditableNicheRow[], displayName: string) {
  const row = rows.find((item) => item.displayName === displayName);
  if (!row) {
    throw new Error(`Missing fixture niche ${displayName}`);
  }
  return row;
}

