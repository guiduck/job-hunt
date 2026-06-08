import { describe, expect, it } from "vitest";
import {
  campaignCreateSchema,
  leadFiltersSchema,
  leadUpdateSchema,
  lovableGenerationSchema,
  messageGenerationSchema,
  sellerSettingsSchema
} from "@/lib/validation/freelance";

describe("Freelance validation schemas", () => {
  it("accepts BR and international campaign inputs", () => {
    expect(
      campaignCreateSchema.parse({
        marketScope: "BR",
        country: "Brasil",
        state: "SC",
        city: "Indaial",
        nicheId: "niche_1"
      }).marketScope
    ).toBe("BR");

    expect(
      campaignCreateSchema.parse({
        marketScope: "INTERNATIONAL",
        country: "United States",
        state: "TX",
        city: "Alamo",
        nicheId: "niche_2"
      }).marketScope
    ).toBe("INTERNATIONAL");
  });

  it("rejects missing locality and niche requirements", () => {
    expect(() =>
      campaignCreateSchema.parse({
        marketScope: "BR",
        country: "Brasil",
        city: "",
        nicheId: ""
      })
    ).toThrow();
  });

  it("validates lead filters and review updates", () => {
    expect(leadFiltersSchema.parse({ minScore: "70" }).minScore).toBe(70);
    expect(leadUpdateSchema.parse({ temperature: "hot" }).temperature).toBe("hot");
  });

  it("validates generation request shapes", () => {
    expect(lovableGenerationSchema.parse({ leadId: "lead_1", variant: "compact" }).variant).toBe(
      "compact"
    );
    expect(
      messageGenerationSchema.parse({
        leadId: "lead_1",
        stage: "first_contact",
        templateId: "template_1"
      }).stage
    ).toBe("first_contact");
  });

  it("allows empty optional seller contact fields", () => {
    const parsed = sellerSettingsSchema.parse({
      defaultMarketScope: "BR",
      sellerEmail: "",
      portfolioUrl: "",
      preferredNicheIds: []
    });
    expect(parsed.sellerEmail).toBe("");
  });
});
