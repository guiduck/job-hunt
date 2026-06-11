import { describe, expect, it } from "vitest";
import { buildLovablePrompt } from "@/lib/generation/lovable-prompt-builder";

const lead = {
  businessName: "Studio Bela",
  city: "Indaial",
  country: "Brazil",
  category: "Beauty salon",
  websiteStatus: "weak_site",
  leadScore: 84,
  demoUrl: "https://demo.example",
  classificationReasons: ["No clear CTA"],
  campaign: { nicheNameSnapshot: "Beauty salon" },
  websiteAnalyses: [{ evidencePoints: ["Missing WhatsApp CTA"] }]
};

describe("Lovable prompt builder", () => {
  it("uses lead evidence and selected variant", () => {
    const prompt = buildLovablePrompt(lead as never, "complete");
    expect(prompt).toContain("Studio Bela");
    expect(prompt).toContain("Missing WhatsApp CTA");
    expect(prompt).toContain("local SEO");
  });

  it("supports compact prompt generation", () => {
    expect(buildLovablePrompt(lead as never, "compact")).toContain("concise mobile-first");
  });
});
