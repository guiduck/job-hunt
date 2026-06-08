import { describe, expect, it } from "vitest";
import { buildCampaignName } from "@/lib/freelance/campaign-service";
import { seedNiches } from "@/prisma/seed-data/niches";

describe("campaign create flow", () => {
  it("supports BR campaign naming from seeded niches", () => {
    const niche = seedNiches.find((item) => item.name === "Imobiliária");
    expect(niche).toBeDefined();
    expect(
      buildCampaignName({
        city: "Indaial",
        nicheName: niche?.name ?? "",
        marketScope: "BR"
      })
    ).toBe("Imobiliária - Indaial (BR)");
  });

  it("supports international campaign naming from seeded niches", () => {
    const niche = seedNiches.find((item) => item.name === "Plumber");
    expect(niche).toBeDefined();
    expect(
      buildCampaignName({
        city: "Alamo",
        nicheName: niche?.name ?? "",
        marketScope: "INTERNATIONAL"
      })
    ).toBe("Plumber - Alamo (International)");
  });
});
