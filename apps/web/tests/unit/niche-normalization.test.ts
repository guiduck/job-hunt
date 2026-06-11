import { describe, expect, it } from "vitest";
import {
  hasEncodingDamage,
  normalizeAlias,
  normalizeDisplayName,
  slugifyNiche,
  uniqueNormalizedTerms
} from "@/lib/freelance/niche-normalization";

describe("niche normalization", () => {
  it("repairs known mojibake display names", () => {
    expect(normalizeDisplayName("ClÃ­nica de EstÃ©tica")).toBe("Clinica de Estetica");
    expect(normalizeDisplayName("ImobiliÃ¡ria")).toBe("Imobiliaria");
  });

  it("creates stable ASCII slugs and aliases", () => {
    expect(slugifyNiche("ClÃ­nica OdontolÃ³gica")).toBe("clinica-odontologica");
    expect(normalizeAlias("SalÃ£o de Beleza")).toBe("salao de beleza");
  });

  it("detects damaged encoding markers", () => {
    expect(hasEncodingDamage("Oficina MecÃ¢nica")).toBe(true);
    expect(hasEncodingDamage("Cleaning Service")).toBe(false);
  });

  it("deduplicates normalized query terms", () => {
    expect(uniqueNormalizedTerms(["ImobiliÃ¡ria", "Imobiliaria", "  Imobiliaria  "])).toEqual([
      "Imobiliaria"
    ]);
  });
});

