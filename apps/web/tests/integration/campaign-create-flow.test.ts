import { describe, expect, it } from "vitest";
import { buildCampaignName } from "@/lib/freelance/campaign-service";
import { seedNiches } from "@/prisma/seed-data/niches";

describe("campaign create flow", () => {
  it("supports BR campaign naming from seeded niches", () => {
    const niche = seedNiches.find((item) => item.name === "Imobiliaria");
    expect(niche).toBeDefined();
    expect(
      buildCampaignName({
        city: "Indaial",
        nicheName: niche?.displayName ?? "",
        marketScope: "BR"
      })
    ).toBe("Imobiliaria - Indaial (BR)");
  });

  it("supports international campaign naming from seeded niches", () => {
    const niche = seedNiches.find((item) => item.name === "Plumber");
    expect(niche).toBeDefined();
    expect(
      buildCampaignName({
        city: "Alamo",
        nicheName: niche?.displayName ?? "",
        marketScope: "INTERNATIONAL"
      })
    ).toBe("Plumber - Alamo (International)");
  });
});
