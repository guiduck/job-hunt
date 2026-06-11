const MOJIBAKE_REPLACEMENTS: Record<string, string> = {
  "ClÃ­nica de EstÃ©tica": "Clinica de Estetica",
  "ClÃ­nica OdontolÃ³gica": "Clinica Odontologica",
  "SalÃ£o de Beleza": "Salao de Beleza",
  "PsicÃ³logo": "Psicologo",
  "FotÃ³grafo": "Fotografo",
  "ClÃ­nica de Fisioterapia": "Clinica de Fisioterapia",
  "ClÃ­nica VeterinÃ¡ria": "Clinica Veterinaria",
  "ImobiliÃ¡ria": "Imobiliaria",
  "Oficina MecÃ¢nica": "Oficina Mecanica"
};

const DAMAGED_ENCODING_MARKERS = ["Ã", "Â", "â€", "â€œ", "â€\u009d", "�"];

export function hasEncodingDamage(value: string | null | undefined) {
  if (!value) {
    return false;
  }
  return DAMAGED_ENCODING_MARKERS.some((marker) => value.includes(marker));
}

export function normalizeAccents(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeDisplayName(value: string) {
  const trimmed = value.trim().replace(/\s+/g, " ");
  const repaired = MOJIBAKE_REPLACEMENTS[trimmed] ?? trimmed;
  return normalizeAccents(repaired);
}

export function normalizeAlias(value: string) {
  return normalizeDisplayName(value).toLowerCase();
}

export function slugifyNiche(value: string) {
  return normalizeDisplayName(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function uniqueNormalizedTerms(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = normalizeDisplayName(value);
    const key = normalizeAlias(normalized);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

