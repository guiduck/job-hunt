import { PrismaClient } from "@prisma/client";
import { seedCommercialTemplates } from "./seed-data/templates";
import { seedNiches } from "./seed-data/niches";
import { VISUAL_CANDIDATE_NICHES } from "../lib/freelance/niche-reference-data";
import { normalizeDisplayName, uniqueNormalizedTerms } from "../lib/freelance/niche-normalization";
import { loadLocalEnv } from "../scripts/env";

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://scrapper:scrapper@localhost:5432/scrapper_freelance";
}

const prisma = new PrismaClient();

async function main() {
  for (const niche of seedNiches) {
    await prisma.freelanceNiche.upsert({
      where: { slug: niche.slug },
      update: {
        name: niche.name,
        market: niche.market,
        conversionHint: niche.conversionHint,
        defaultTerms: niche.defaultTerms,
        displayName: niche.displayName,
        sourceName: niche.sourceName,
        sourcePath: niche.sourcePath,
        sourceNote: niche.sourceNote,
        conversionHintSource: niche.conversionHintSource,
        aliases: niche.aliases,
        queryTerms: niche.queryTerms,
        marketApplicability: niche.marketApplicability,
        lifecycleStatus: "approved",
        mergedIntoNicheId: null,
        enabled: true,
        sortOrder: niche.sortOrder
      },
      create: {
        name: niche.name,
        slug: niche.slug,
        market: niche.market,
        conversionHint: niche.conversionHint,
        defaultTerms: niche.defaultTerms,
        displayName: niche.displayName,
        sourceName: niche.sourceName,
        sourcePath: niche.sourcePath,
        sourceNote: niche.sourceNote,
        conversionHintSource: niche.conversionHintSource,
        aliases: niche.aliases,
        queryTerms: niche.queryTerms,
        marketApplicability: niche.marketApplicability,
        lifecycleStatus: "approved",
        sortOrder: niche.sortOrder
      }
    });
  }

  for (const candidate of VISUAL_CANDIDATE_NICHES) {
    const normalizedName = normalizeDisplayName(candidate.proposedName);
    const matchedNiche = await prisma.freelanceNiche.findFirst({
      where: {
        OR: [
          { slug: candidate.proposedSlug },
          { displayName: normalizedName },
          { name: normalizedName }
        ],
        enabled: true,
        lifecycleStatus: "approved"
      }
    });
    const data = {
      proposedName: normalizedName,
      normalizedName,
      proposedSlug: candidate.proposedSlug,
      marketApplicability: candidate.marketApplicability,
      proposedConversionHint: candidate.proposedConversionHint,
      proposedQueryTerms: uniqueNormalizedTerms(candidate.proposedQueryTerms),
      sourcePath: candidate.sourcePath,
      sourceExcerpt: candidate.sourceNote,
      sourceNote: candidate.sourceNote,
      matchedNicheId: matchedNiche?.id ?? null
    };
    const existing = await prisma.nicheCandidate.findFirst({
      where: {
        proposedSlug: candidate.proposedSlug,
        sourcePath: candidate.sourcePath
      }
    });

    if (existing) {
      await prisma.nicheCandidate.update({
        where: { id: existing.id },
        data
      });
    } else {
      await prisma.nicheCandidate.create({ data });
    }
  }

  for (const template of seedCommercialTemplates) {
    const existing = await prisma.commercialTemplate.findUnique({
      where: {
        id: `system-${template.stage}-${template.category}`
      }
    });

    if (!existing) {
      await prisma.commercialTemplate.create({
        data: {
          id: `system-${template.stage}-${template.category}`,
          ...template,
          isDefault: true,
          isActive: true
        }
      });
    }
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });




