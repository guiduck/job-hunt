import { PrismaClient } from "@prisma/client";
import { seedCommercialTemplates } from "./seed-data/templates";
import { seedNiches } from "./seed-data/niches";

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
        enabled: true,
        sortOrder: niche.sortOrder
      },
      create: {
        name: niche.name,
        slug: niche.slug,
        market: niche.market,
        conversionHint: niche.conversionHint,
        defaultTerms: niche.defaultTerms,
        sortOrder: niche.sortOrder
      }
    });
  }

  for (const template of seedCommercialTemplates) {
    await prisma.commercialTemplate.upsert({
      where: {
        id: `system-${template.stage}-${template.category}`
      },
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

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
