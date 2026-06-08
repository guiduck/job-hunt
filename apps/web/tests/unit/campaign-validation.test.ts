import { describe, expect, it } from "vitest";
import { campaignCreateSchema } from "@/lib/validation/freelance";

describe("campaign validation", () => {
  it("rejects missing city", () => {
    expect(() =>
      campaignCreateSchema.parse({
        marketScope: "BR",
        country: "Brasil",
        city: "",
        nicheId: "niche_1"
      })
    ).toThrow();
  });

  it("rejects missing niche", () => {
    expect(() =>
      campaignCreateSchema.parse({
        marketScope: "INTERNATIONAL",
        country: "United States",
        city: "Alamo",
        nicheId: ""
      })
    ).toThrow();
  });
});
