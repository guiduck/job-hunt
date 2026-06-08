export type SeedNiche = {
  name: string;
  slug: string;
  market: "BR" | "INTERNATIONAL" | "both";
  conversionHint: number;
  defaultTerms: string[];
  sortOrder: number;
};

const brNames = new Set([
  "Clínica de Estética",
  "Clínica Odontológica",
  "Dentista",
  "Salão de Beleza",
  "Psicólogo",
  "Terapeuta",
  "Nutricionista",
  "Barbearia",
  "Fotógrafo",
  "Personal Trainer",
  "Clínica de Fisioterapia",
  "Arquiteto",
  "Designer de Interiores",
  "Academia",
  "Clínica Veterinária",
  "Imobiliária",
  "Pet Shop",
  "Escola de Idiomas",
  "Restaurante",
  "Pizzaria",
  "Hamburgueria",
  "Oficina Mecânica"
]);

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const sourceNiches = [
  { name: "Clínica de Estética", conversionHint: 18.5 },
  { name: "Clínica Odontológica", conversionHint: 17.2 },
  { name: "Dentista", conversionHint: 16.8 },
  { name: "Salão de Beleza", conversionHint: 15.4 },
  { name: "Psicólogo", conversionHint: 15.2 },
  { name: "Terapeuta", conversionHint: 15 },
  { name: "Nutricionista", conversionHint: 14.8 },
  { name: "Barbearia", conversionHint: 14.7 },
  { name: "Fotógrafo", conversionHint: 14.2 },
  { name: "Personal Trainer", conversionHint: 13.5 },
  { name: "Clínica de Fisioterapia", conversionHint: 13.2 },
  { name: "Arquiteto", conversionHint: 13 },
  { name: "Designer de Interiores", conversionHint: 12.9 },
  { name: "Academia", conversionHint: 12.8 },
  { name: "Clínica Veterinária", conversionHint: 12.3 },
  { name: "Imobiliária", conversionHint: 11.0 },
  { name: "Pet Shop", conversionHint: 9.5 },
  { name: "Escola de Idiomas", conversionHint: 9.2 },
  { name: "Restaurante", conversionHint: 5.8 },
  { name: "Pizzaria", conversionHint: 5.5 },
  { name: "Hamburgueria", conversionHint: 5.3 },
  { name: "Oficina Mecânica", conversionHint: 5.0 },
  { name: "Med Spa", conversionHint: 18.0 },
  { name: "HVAC", conversionHint: 15.8 },
  { name: "Plumber", conversionHint: 16.2 },
  { name: "Lawyer", conversionHint: 15.0 },
  { name: "Real Estate Agent", conversionHint: 14.5 },
  { name: "Landscaping", conversionHint: 13.0 },
  { name: "Cleaning Service", conversionHint: 14.0 }
];

export const seedNiches: SeedNiche[] = sourceNiches.map((niche, index) => ({
  name: niche.name,
  slug: slugify(niche.name),
  market: brNames.has(niche.name) ? "BR" : "INTERNATIONAL",
  conversionHint: niche.conversionHint,
  defaultTerms: [niche.name],
  sortOrder: index + 1
}));
