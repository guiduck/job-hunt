export type SeedNiche = {
  name: string;
  slug: string;
  market: "BR" | "INTERNATIONAL" | "both";
  conversionHint: number;
  defaultTerms: string[];
  displayName: string;
  sourceName: string;
  sourcePath: string;
  sourceNote: string;
  conversionHintSource: "text_seed" | "visual_reference" | "operator_override";
  aliases: string[];
  queryTerms: string[];
  marketApplicability: "BR" | "INTERNATIONAL" | "both";
  sortOrder: number;
};

type SourceNiche = {
  name: string;
  market: "BR" | "INTERNATIONAL";
  conversionHint: number;
  sourceNote?: string;
  conversionHintSource?: SeedNiche["conversionHintSource"];
  aliases?: string[];
  queryTerms?: string[];
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const sourceNiches: SourceNiche[] = [
  { name: "Clinica de Estetica", market: "BR", conversionHint: 18.5 },
  { name: "Clinica Odontologica", market: "BR", conversionHint: 17.2 },
  { name: "Dentista", market: "BR", conversionHint: 16.8 },
  { name: "Salao de Beleza", market: "BR", conversionHint: 15.4 },
  { name: "Psicologo", market: "BR", conversionHint: 15.2 },
  { name: "Terapeuta", market: "BR", conversionHint: 15 },
  { name: "Nutricionista", market: "BR", conversionHint: 14.8 },
  { name: "Barbearia", market: "BR", conversionHint: 14.7 },
  { name: "Fotografo", market: "BR", conversionHint: 14.2 },
  { name: "Personal Trainer", market: "BR", conversionHint: 13.5 },
  { name: "Clinica de Fisioterapia", market: "BR", conversionHint: 13.2 },
  { name: "Arquiteto", market: "BR", conversionHint: 13 },
  { name: "Designer de Interiores", market: "BR", conversionHint: 12.9 },
  { name: "Academia", market: "BR", conversionHint: 12.8 },
  { name: "Clinica Veterinaria", market: "BR", conversionHint: 12.3 },
  { name: "Imobiliaria", market: "BR", conversionHint: 11.0 },
  {
    name: "Igrejas",
    market: "BR",
    conversionHint: 12.0,
    sourceNote:
      "Operator-approved addition for churches that need CMS/admin sites for posts, events, calendars, image carousel, ministries and community updates.",
    conversionHintSource: "operator_override",
    aliases: ["Igreja", "Igreja Evangelica", "Igreja Catolica", "Paroquia"],
    queryTerms: ["Igreja", "Igreja evangelica", "Igreja catolica", "Paroquia", "Comunidade religiosa"]
  },
  { name: "Pet Shop", market: "BR", conversionHint: 9.5 },
  { name: "Escola de Idiomas", market: "BR", conversionHint: 9.2 },
  { name: "Restaurante", market: "BR", conversionHint: 5.8 },
  { name: "Pizzaria", market: "BR", conversionHint: 5.5 },
  { name: "Hamburgueria", market: "BR", conversionHint: 5.3 },
  { name: "Oficina Mecanica", market: "BR", conversionHint: 5.0 },
  { name: "Med Spa", market: "INTERNATIONAL", conversionHint: 18.0 },
  { name: "HVAC", market: "INTERNATIONAL", conversionHint: 15.8 },
  { name: "Plumber", market: "INTERNATIONAL", conversionHint: 16.2 },
  { name: "Lawyer", market: "INTERNATIONAL", conversionHint: 15.0 },
  { name: "Real Estate Agent", market: "INTERNATIONAL", conversionHint: 14.5 },
  { name: "Landscaping", market: "INTERNATIONAL", conversionHint: 13.0 },
  { name: "Cleaning Service", market: "INTERNATIONAL", conversionHint: 14.0 }
];

export const seedNiches: SeedNiche[] = sourceNiches.map((niche, index) => {
  const queryTerms = niche.queryTerms ?? [niche.name];

  return {
    name: niche.name,
    slug: slugify(niche.name),
    market: niche.market,
    conversionHint: niche.conversionHint,
    defaultTerms: queryTerms,
    displayName: niche.name,
    sourceName: niche.name,
    sourcePath: "apps/web/prisma/seed-data/niches.ts",
    sourceNote: niche.sourceNote ?? "Initial catalog baseline used by the Freelance prospecting MVP.",
    conversionHintSource: niche.conversionHintSource ?? "text_seed",
    aliases: niche.aliases ?? [],
    queryTerms,
    marketApplicability: niche.market,
    sortOrder: index + 1
  };
});
