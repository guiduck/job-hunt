import { seedNiches } from "@/prisma/seed-data/niches";
import { normalizeDisplayName, slugifyNiche, uniqueNormalizedTerms } from "./niche-normalization";

export const BASELINE_NICHE_COUNT = 30;
export const IMOBILIARIA_TEXT_CONVERSION_HINT = 11.0;
export const IMOBILIARIA_VISUAL_CONVERSION_HINT = 6.1;

export type ReferenceNiche = {
  displayName: string;
  sourceName: string;
  slug: string;
  marketApplicability: "BR" | "INTERNATIONAL" | "both";
  conversionHint: number;
  conversionHintSource: "text_seed" | "visual_reference" | "operator_override";
  queryTerms: string[];
  aliases: string[];
  sourcePath: string;
  sourceNote: string;
  sortOrder: number;
};

export type VisualCandidateReference = {
  proposedName: string;
  proposedSlug: string;
  marketApplicability: "BR" | "INTERNATIONAL" | "both";
  proposedConversionHint: number;
  proposedQueryTerms: string[];
  sourcePath: string;
  sourceNote: string;
};

export const BASELINE_NICHES: ReferenceNiche[] = seedNiches.map((niche) => {
  const displayName = normalizeDisplayName(niche.displayName ?? niche.name);
  const sourceName = niche.sourceName ?? niche.name;
  const queryTerms = uniqueNormalizedTerms(niche.queryTerms ?? niche.defaultTerms);

  return {
    displayName,
    sourceName,
    slug: niche.slug || slugifyNiche(displayName),
    marketApplicability: niche.marketApplicability ?? niche.market,
    conversionHint: niche.conversionHint,
    conversionHintSource: niche.conversionHintSource ?? "text_seed",
    queryTerms,
    aliases: uniqueNormalizedTerms(niche.aliases ?? []),
    sourcePath: niche.sourcePath ?? "apps/web/prisma/seed-data/niches.ts",
    sourceNote: niche.sourceNote ?? "Initial seed baseline",
    sortOrder: niche.sortOrder
  };
});

export const VISUAL_CANDIDATE_NICHES: VisualCandidateReference[] = [
  {
    proposedName: "Imobiliaria",
    proposedSlug: "imobiliaria",
    marketApplicability: "BR",
    proposedConversionHint: IMOBILIARIA_VISUAL_CONVERSION_HINT,
    proposedQueryTerms: ["Imobiliaria", "Corretor de imoveis"],
    sourcePath: "docs/reference-ui.md#visual-reference",
    sourceNote: "Visual reference shows lower conversion estimate than the original text seed."
  },
  {
    proposedName: "Clinica de Estetica",
    proposedSlug: "clinica-de-estetica",
    marketApplicability: "BR",
    proposedConversionHint: 18.5,
    proposedQueryTerms: ["Clinica de Estetica", "Estetica facial"],
    sourcePath: "docs/reference-ui.md#visual-reference",
    sourceNote: "Visual reference confirms coverage by baseline seed."
  },
  {
    proposedName: "Cleaning Service",
    proposedSlug: "cleaning-service",
    marketApplicability: "INTERNATIONAL",
    proposedConversionHint: 14.0,
    proposedQueryTerms: ["Cleaning Service", "Residential cleaning"],
    sourcePath: "docs/reference-ui.md#visual-reference",
    sourceNote: "International visual reference confirms coverage by baseline seed."
  }
];
