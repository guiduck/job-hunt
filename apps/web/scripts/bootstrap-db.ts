import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { seedCommercialTemplates } from "../prisma/seed-data/templates";
import { seedNiches } from "../prisma/seed-data/niches";
import { VISUAL_CANDIDATE_NICHES } from "../lib/freelance/niche-reference-data";
import { normalizeDisplayName, uniqueNormalizedTerms } from "../lib/freelance/niche-normalization";
import { loadLocalEnv } from "./env";

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://scrapper:scrapper@localhost:5432/scrapper_freelance";
}

const prisma = new PrismaClient();

async function executeMigrationIfNeeded() {
  const existing = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT to_regclass('public.freelance_campaigns') IS NOT NULL AS exists
  `;

  if (existing[0]?.exists) {
    return;
  }

  const migrationSql = readFileSync(
    resolve(process.cwd(), "prisma/migrations/20260606000100_init_freelance_web/migration.sql"),
    "utf8"
  );

  const statements = migrationSql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
}

async function executeNicheCatalogGovernanceMigrationIfNeeded() {
  const existing = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'freelance_niches'
        AND column_name = 'display_name'
    ) AS exists
  `;

  if (existing[0]?.exists) {
    return;
  }

  const migrationSql = readFileSync(
    resolve(process.cwd(), "prisma/migrations/20260609000100_niche_catalog_governance/migration.sql"),
    "utf8"
  );

  const statements = migrationSql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
}

async function executeLeadSocialSourceLinksMigrationIfNeeded() {
  const existing = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'freelance_leads'
        AND column_name = 'social_url'
    ) AS exists
  `;

  if (!existing[0]?.exists) {
    const migrationSql = readFileSync(
      resolve(process.cwd(), "prisma/migrations/20260610000100_lead_social_source_links/migration.sql"),
      "utf8"
    );

    const statements = migrationSql
      .split(/;\s*(?:\r?\n|$)/)
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement);
    }
  }

  await prisma.$executeRaw`
    UPDATE freelance_leads
    SET social_url = website_url,
        website_url = NULL
    WHERE website_url ~* '(instagram\.com|facebook\.com|fb\.com|tiktok\.com|youtube\.com|youtu\.be|x\.com|twitter\.com|threads\.net|linkedin\.com)'
      AND social_url IS NULL
  `;

  await prisma.$executeRaw`
    UPDATE freelance_leads
    SET content_score = NULL,
        design_score = NULL,
        performance_score = NULL,
        seo_score = NULL
    WHERE classification_reasons::text ILIKE '%mock analysis%'
  `;

  await prisma.$executeRaw`
    UPDATE website_analyses
    SET content_score = NULL,
        design_score = NULL,
        performance_score = NULL,
        seo_score = NULL,
        overall_opportunity_score = NULL
    WHERE evidence_points::text ILIKE '%mock analysis%'
  `;
}

async function seed() {
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
    await prisma.commercialTemplate.upsert({
      where: { id: `system-${template.stage}-${template.category}` },
      update: {
        ...template,
        isDefault: true,
        isActive: true
      },
      create: {
        id: `system-${template.stage}-${template.category}`,
        ...template,
        isDefault: true,
        isActive: true
      }
    });
  }
}

async function main() {
  await prisma.$executeRaw`SELECT pg_advisory_lock(140140)`;
  try {
    await executeMigrationIfNeeded();
    await executeNicheCatalogGovernanceMigrationIfNeeded();
    await executeLeadSocialSourceLinksMigrationIfNeeded();
    await seed();
    console.log("Freelance database bootstrap complete.");
  } finally {
    await prisma.$executeRaw`SELECT pg_advisory_unlock(140140)`;
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
