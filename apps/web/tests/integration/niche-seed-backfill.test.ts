import { describe, expect, it } from "vitest";
import { seedNiches } from "@/prisma/seed-data/niches";

describe("niche seed backfill", () => {
  it("adds governance metadata without changing the baseline count", () => {
    expect(seedNiches).toHaveLength(30);
    expect(seedNiches.every((niche) => niche.displayName && niche.sourcePath && niche.sourceNote)).toBe(true);
  });

  it("includes churches as an operator-approved BR niche for CMS-style website opportunities", () => {
    const churches = seedNiches.find((niche) => niche.slug === "igrejas");

    expect(churches).toMatchObject({
      displayName: "Igrejas",
      marketApplicability: "BR",
      conversionHintSource: "operator_override"
    });
    expect(churches?.queryTerms).toEqual(
      expect.arrayContaining(["Igreja evangelica", "Igreja catolica", "Paroquia"])
    );
    expect(churches?.sourceNote).toContain("CMS/admin sites");
  });

  it("keeps campaign snapshot fields out of seed updates", () => {
    const seedKeys = Object.keys(seedNiches[0]);
    expect(seedKeys).not.toContain("nicheNameSnapshot");
    expect(seedKeys).not.toContain("conversionHintSnapshot");
  });
});
