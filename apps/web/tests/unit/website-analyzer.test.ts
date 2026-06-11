import { describe, expect, it } from "vitest";
import { analyzeWebsite } from "@/worker/website-analysis/analyzer";

describe("lightweight website analyzer", () => {
  it("captures status evidence without pretending to run a real audit", async () => {
    const result = await analyzeWebsite({
      businessName: "Barbearia Central",
      city: "Indaial",
      nicheName: "Barbearia",
      websiteUrl: "https://example.com"
    });

    expect(result.detectedStatus).toBe("weak_site");
    expect(result.evidencePoints).toContain("Detected website status: weak_site");
    expect(result.evidencePoints).toContain(
      "Website URL was captured, but no real crawl or Lighthouse-style audit has been run yet."
    );
    expect(result.scores).toBeUndefined();
  });

  it("does not score social profile URLs as website audits", async () => {
    const result = await analyzeWebsite({
      businessName: "Paroquia Bom Jesus",
      city: "Brasilia",
      nicheName: "Igrejas",
      websiteUrl: "https://www.instagram.com/paroquiabomjesusbsb/"
    });

    expect(result.detectedStatus).toBe("social_only");
    expect(result.scores).toBeUndefined();
    expect(result.evidencePoints).toContain(
      "Website URL was captured, but no real crawl or Lighthouse-style audit has been run yet."
    );
  });
});
